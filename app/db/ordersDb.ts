import type { Order, OrderItem } from "../types/store";
import { AwsClient } from "aws4fetch";
import { INITIAL_ORDERS } from "../data/initialData";

export interface D1DatabaseLike {
  prepare: (query: string) => {
    bind: (...params: any[]) => {
      run: () => Promise<any>;
      all: <T = any>() => Promise<{ results?: T[]; success?: boolean }>;
      first: <T = any>() => Promise<T | null>;
    };
  };
  exec?: (query: string) => Promise<any>;
  batch?: (statements: any[]) => Promise<any>;
}

// In-memory cache for fast responsive reads and fallback resilience
let memoryOrdersCache: Order[] = [];
let isInitialized = false;
let isD1SchemaInitialized = false;

// SQL DDL Schema statements for Cloudflare D1
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    tracking_number TEXT NOT NULL UNIQUE,
    order_number TEXT,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    phone TEXT,
    customer_phone TEXT,
    emirate TEXT,
    customer_emirate TEXT,
    address TEXT,
    customer_address TEXT,
    items TEXT,
    items_json TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    delivery_fee REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cod',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    gift_note TEXT,
    source TEXT NOT NULL DEFAULT 'web_store',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    unit TEXT NOT NULL,
    packaging_option TEXT,
    total_price REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT,
    phone TEXT PRIMARY KEY,
    name TEXT,
    fname TEXT,
    lname TEXT,
    emirate TEXT,
    address TEXT,
    last_address TEXT,
    total_orders INTEGER NOT NULL DEFAULT 1,
    total_spent REAL NOT NULL DEFAULT 0,
    last_order_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_order_tracking TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`
];

// R2 Credentials configuration for remote cloud storage backup
const R2_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57",
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "edaa617e65bf06c1e92ae289e137d1c7",
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  bucket: process.env.CLOUDFLARE_R2_BUCKET || "bt-liwa",
  endpoint:
    process.env.CLOUDFLARE_R2_ENDPOINT && process.env.CLOUDFLARE_R2_ENDPOINT.includes("r2.cloudflarestorage.com")
      ? process.env.CLOUDFLARE_R2_ENDPOINT.replace(/\/+$/, "")
      : `https://${process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57"}.r2.cloudflarestorage.com`,
};

function getR2Client(): AwsClient | null {
  if (!R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) return null;
  return new AwsClient({
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

/**
 * Robustly ensures Cloudflare D1 tables exist.
 */
export async function initializeD1Schema(db: D1DatabaseLike, force = false): Promise<boolean> {
  if (isD1SchemaInitialized && !force) return true;

  try {
    for (const statement of SCHEMA_STATEMENTS) {
      try {
        await db.prepare(statement).run();
      } catch (stmtErr: any) {
        if (typeof db.exec === "function") {
          try {
            await db.exec(statement);
          } catch (execErr) {
            // Ignore if table/index already exists
          }
        }
      }
    }
    isD1SchemaInitialized = true;
    return true;
  } catch (err) {
    console.warn("D1 schema initialization warning:", err);
    return false;
  }
}

/**
 * Backup order to Cloudflare R2 Database Storage (data/orders.json and orders/{id}.json)
 */
async function syncOrderToR2(order: Order, allOrders?: Order[]): Promise<boolean> {
  const r2 = getR2Client();
  if (!r2) return false;

  try {
    const singleOrderUrl = `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/orders/${order.id}.json`;
    await r2.fetch(singleOrderUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(order, null, 2),
    });

    if (allOrders && allOrders.length > 0) {
      const allOrdersUrl = `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/data/orders.json`;
      await r2.fetch(allOrdersUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify(
          {
            lastUpdated: new Date().toISOString(),
            totalOrders: allOrders.length,
            orders: allOrders,
          },
          null,
          2
        ),
      });
    }
    return true;
  } catch (err) {
    console.warn("Could not sync order to R2 bucket:", err);
    return false;
  }
}

/**
 * Fetch orders from Cloudflare R2 Database Storage
 */
async function fetchOrdersFromR2(): Promise<Order[] | null> {
  const r2 = getR2Client();
  if (!r2) return null;

  try {
    const url = `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/data/orders.json`;
    const res = await r2.fetch(url);
    if (res.ok) {
      const data = (await res.json()) as { orders?: Order[] };
      if (data && Array.isArray(data.orders)) {
        return data.orders;
      }
    }
  } catch (err) {
    console.warn("Could not load orders from R2:", err);
  }
  return null;
}

/**
 * Map D1 SQL row to application Order type.
 * Works seamlessly with both legacy teenliwa-db schema and new extended schema.
 */
function mapD1RowToOrder(row: any): Order {
  let items: OrderItem[] = [];
  try {
    const rawItems = row.items || row.items_json;
    const parsed = typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems || [];
    if (Array.isArray(parsed)) {
      items = parsed.map((item: any) => ({
        productId: item.productId || item.id || `p-${Math.random().toString(36).substring(2, 6)}`,
        name: item.name || "Item",
        quantity: Number(item.quantity ?? item.qty) || 1,
        price: Number(item.price) || 0,
        unit: item.unit || "Box",
        packagingOption: item.packagingOption,
      }));
    }
  } catch {
    items = [];
  }

  // Parse notes or gift note if stored as JSON or string
  let notesStr = row.notes;
  let giftNoteStr = row.gift_note;
  if (typeof notesStr === "string" && notesStr.startsWith("{") && notesStr.endsWith("}")) {
    try {
      const parsedNotes = JSON.parse(notesStr);
      if (parsedNotes.giftNote) giftNoteStr = parsedNotes.giftNote;
      if (parsedNotes.notes) notesStr = parsedNotes.notes;
    } catch {}
  }

  const orderNum = row.tracking_number || row.order_number || row.id;

  return {
    id: row.id,
    orderNumber: orderNum,
    customerName: row.customer_name || (row.fname ? `${row.fname} ${row.lname || ""}`.trim() : "Customer"),
    customerPhone: row.phone || row.customer_phone || "",
    customerEmirate: row.emirate || row.customer_emirate || "Abu Dhabi",
    customerAddress: row.address || row.customer_address || "",
    notes: notesStr || undefined,
    giftNote: giftNoteStr || undefined,
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    discount: Number(row.discount) || 0,
    total: Number(row.total) || 0,
    paymentMethod: row.payment_method || "cod",
    paymentStatus: row.payment_status || "pending",
    ziinaPaymentIntentId: row.ziina_payment_intent_id || undefined,
    ziinaRedirectUrl: row.ziina_redirect_url || undefined,
    transactionId: row.transaction_id || undefined,
    cardBrand: row.card_brand || undefined,
    cardLastFour: row.card_last_four || undefined,
    status: row.status || "pending",
    createdAt: row.created_at || new Date().toISOString(),
    items,
  };
}

/**
 * Seed initial sample orders into D1 if database table is completely empty
 */
async function seedInitialOrdersToD1(d1: D1DatabaseLike): Promise<void> {
  try {
    for (const order of INITIAL_ORDERS) {
      await d1
        .prepare(
          `INSERT OR IGNORE INTO orders (
            id, tracking_number, customer_name, phone, emirate, address,
            items, subtotal, delivery_fee, total, payment_method, status, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          order.id,
          order.orderNumber,
          order.customerName,
          order.customerPhone,
          order.customerEmirate,
          order.customerAddress,
          JSON.stringify(order.items),
          order.subtotal,
          order.deliveryFee,
          order.total,
          order.paymentMethod,
          order.status,
          order.notes || "",
          order.createdAt
        )
        .run();
    }
  } catch (seedErr) {
    console.warn("Could not seed initial orders to D1:", seedErr);
  }
}

/**
 * Get all orders from the persistent database (Cloudflare D1 SQL)
 */
export async function getOrdersFromDb(d1?: D1DatabaseLike): Promise<{
  orders: Order[];
  storageType: "d1_database" | "r2_database" | "server_persistent_cache";
}> {
  if (d1) {
    try {
      await initializeD1Schema(d1);

      let results: any[] | undefined;
      try {
        const stmt = d1.prepare("SELECT * FROM orders ORDER BY created_at DESC");
        const queryRes = await stmt.bind().all<any>();
        results = queryRes?.results;
      } catch (queryErr: any) {
        if (String(queryErr).includes("no such table")) {
          console.info("Orders table missing in D1. Auto-creating schema and retrying...");
          await initializeD1Schema(d1, true);
          const retryStmt = d1.prepare("SELECT * FROM orders ORDER BY created_at DESC");
          const retryRes = await retryStmt.bind().all<any>();
          results = retryRes?.results;
        } else {
          throw queryErr;
        }
      }

      if (Array.isArray(results)) {
        if (results.length === 0 && INITIAL_ORDERS.length > 0) {
          await seedInitialOrdersToD1(d1);
          const afterSeed = await d1.prepare("SELECT * FROM orders ORDER BY created_at DESC").bind().all<any>();
          results = afterSeed?.results || [];
        }

        const d1Orders = results.map(mapD1RowToOrder);
        memoryOrdersCache = d1Orders;
        isInitialized = true;
        return { orders: d1Orders, storageType: "d1_database" };
      }
    } catch (e) {
      console.warn("D1 query fallback:", e);
    }
  }

  // Fallback to R2 or memory
  if (!isInitialized || memoryOrdersCache.length === 0) {
    const r2Orders = await fetchOrdersFromR2();
    if (r2Orders && r2Orders.length > 0) {
      memoryOrdersCache = r2Orders;
    } else if (memoryOrdersCache.length === 0) {
      memoryOrdersCache = [...INITIAL_ORDERS];
    }
    isInitialized = true;
  }

  return {
    orders: memoryOrdersCache,
    storageType: getR2Client() ? "r2_database" : "server_persistent_cache",
  };
}

/**
 * Save and record new customer order in the persistent database
 */
export async function createOrderInDb(
  orderInput: Omit<Order, "id" | "orderNumber" | "createdAt" | "status"> & {
    id?: string;
    orderNumber?: string;
    createdAt?: string;
    status?: Order["status"];
  },
  d1?: D1DatabaseLike
): Promise<{ order: Order; dbSaved: boolean; r2Synced: boolean; storageType: string }> {
  const orderId = orderInput.id || `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const orderNumber = orderInput.orderNumber || `AED-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = orderInput.createdAt || new Date().toISOString();
  const status = orderInput.status || "pending";

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerName: orderInput.customerName.trim(),
    customerPhone: orderInput.customerPhone.trim(),
    customerEmirate: orderInput.customerEmirate,
    customerAddress: orderInput.customerAddress.trim(),
    notes: orderInput.notes?.trim() || undefined,
    giftNote: orderInput.giftNote?.trim() || undefined,
    items: orderInput.items,
    subtotal: orderInput.subtotal,
    deliveryFee: orderInput.deliveryFee,
    discount: orderInput.discount || 0,
    total: orderInput.total,
    paymentMethod: orderInput.paymentMethod,
    paymentStatus: orderInput.paymentStatus || (orderInput.paymentMethod === "ziina" ? "pending" : "pending"),
    ziinaPaymentIntentId: orderInput.ziinaPaymentIntentId,
    ziinaRedirectUrl: orderInput.ziinaRedirectUrl,
    transactionId: orderInput.transactionId,
    cardBrand: orderInput.cardBrand,
    cardLastFour: orderInput.cardLastFour,
    status,
    createdAt: nowIso,
  };

  // Update in-memory database cache
  memoryOrdersCache = [newOrder, ...memoryOrdersCache.filter((o) => o.id !== orderId)];
  isInitialized = true;

  let dbSaved = false;

  // Persist directly to Cloudflare D1 SQL relational tables
  if (d1) {
    const executeInsert = async () => {
      const itemsJson = JSON.stringify(newOrder.items);
      const customerId = `cust-${Date.now().toString(36)}`;

      // 1. Try unified insert with both tracking_number and order_number
      try {
        await d1
          .prepare(
            `INSERT INTO orders (
              id, tracking_number, order_number, customer_id, customer_name,
              phone, customer_phone, emirate, customer_emirate, address, customer_address,
              items, items_json, notes, gift_note, subtotal, delivery_fee, discount, total,
              payment_method, payment_status, status, source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            newOrder.id,
            newOrder.orderNumber,
            newOrder.orderNumber,
            customerId,
            newOrder.customerName,
            newOrder.customerPhone,
            newOrder.customerPhone,
            newOrder.customerEmirate,
            newOrder.customerEmirate,
            newOrder.customerAddress,
            newOrder.customerAddress,
            itemsJson,
            itemsJson,
            newOrder.notes || "",
            newOrder.giftNote || "",
            newOrder.subtotal,
            newOrder.deliveryFee,
            newOrder.discount,
            newOrder.total,
            newOrder.paymentMethod,
            "pending",
            newOrder.status,
            "web_store",
            nowIso,
            nowIso
          )
          .run();
      } catch (unifiedErr: any) {
        // If column difference (e.g. teenliwa-db standard schema), fall back to standard columns
        await d1
          .prepare(
            `INSERT INTO orders (
              id, tracking_number, customer_id, customer_name, phone, emirate, address,
              items, subtotal, delivery_fee, total, payment_method, status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            newOrder.id,
            newOrder.orderNumber,
            customerId,
            newOrder.customerName,
            newOrder.customerPhone,
            newOrder.customerEmirate,
            newOrder.customerAddress,
            itemsJson,
            newOrder.subtotal,
            newOrder.deliveryFee,
            newOrder.total,
            newOrder.paymentMethod,
            newOrder.status,
            newOrder.giftNote ? `${newOrder.notes || ""}\nGift Note: ${newOrder.giftNote}`.trim() : newOrder.notes || "",
            nowIso
          )
          .run();
      }

      // 2. Insert items into order_items if table exists
      try {
        for (const item of newOrder.items) {
          const itemId = `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
          await d1
            .prepare(
              `INSERT INTO order_items (
                id, order_id, product_id, name, quantity, price, unit, packaging_option, total_price, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              itemId,
              newOrder.id,
              item.productId,
              item.name,
              item.quantity,
              item.price,
              item.unit,
              item.packagingOption || "standard",
              item.price * item.quantity,
              nowIso
            )
            .run();
        }
      } catch (itemErr) {
        // Secondary relational table optional
      }

      // 3. Upsert customer registry
      try {
        await d1
          .prepare(
            `INSERT INTO customers (id, phone, name, fname, lname, emirate, address, last_address, total_orders, total_spent, last_order_at, last_order_tracking, created_at)
             VALUES (?, ?, ?, ?, '', ?, ?, ?, 1, ?, ?, ?, ?)
             ON CONFLICT(phone) DO UPDATE SET
               name = excluded.name,
               emirate = excluded.emirate,
               last_address = excluded.last_address,
               total_orders = customers.total_orders + 1,
               total_spent = customers.total_spent + excluded.total_spent,
               last_order_at = excluded.last_order_at,
               last_order_tracking = excluded.last_order_tracking`
          )
          .bind(
            customerId,
            newOrder.customerPhone,
            newOrder.customerName,
            newOrder.customerName,
            newOrder.customerEmirate,
            newOrder.customerAddress,
            newOrder.customerAddress,
            newOrder.total,
            nowIso,
            newOrder.orderNumber,
            nowIso
          )
          .run();
      } catch (custErr) {
        // Fallback for different customer columns
        try {
          await d1
            .prepare(
              `INSERT INTO customers (id, fname, lname, phone, address, emirate, total_orders, total_spent, last_order_tracking, created_at)
               VALUES (?, ?, '', ?, ?, ?, 1, ?, ?, ?)
               ON CONFLICT(phone) DO UPDATE SET
                 address = excluded.address,
                 emirate = excluded.emirate,
                 total_orders = customers.total_orders + 1,
                 total_spent = customers.total_spent + excluded.total_spent,
                 last_order_tracking = excluded.last_order_tracking`
            )
            .bind(
              customerId,
              newOrder.customerName,
              newOrder.customerPhone,
              newOrder.customerAddress,
              newOrder.customerEmirate,
              newOrder.total,
              newOrder.orderNumber,
              nowIso
            )
            .run();
        } catch {}
      }
    };

    try {
      await initializeD1Schema(d1);
      await executeInsert();
      dbSaved = true;
    } catch (insertErr: any) {
      if (String(insertErr).includes("no such table")) {
        console.info("Table missing during order insert. Initializing schema and retrying...");
        try {
          await initializeD1Schema(d1, true);
          await executeInsert();
          dbSaved = true;
        } catch (retryErr) {
          console.error("D1 order insertion retry error:", retryErr);
        }
      } else {
        console.error("D1 Order insertion error:", insertErr);
      }
    }
  }

  // Backup to Cloudflare R2 bucket
  const r2Synced = await syncOrderToR2(newOrder, memoryOrdersCache);

  return {
    order: newOrder,
    dbSaved,
    r2Synced,
    storageType: dbSaved ? "d1_database" : r2Synced ? "r2_database" : "server_persistent_cache",
  };
}

/**
 * Update order status in the database
 */
export async function updateOrderStatusInDb(
  orderId: string,
  status: Order["status"],
  d1?: D1DatabaseLike
): Promise<boolean> {
  const idx = memoryOrdersCache.findIndex((o) => o.id === orderId);
  if (idx > -1) {
    memoryOrdersCache[idx].status = status;
  }

  if (d1) {
    try {
      await initializeD1Schema(d1);
      await d1
        .prepare("UPDATE orders SET status = ? WHERE id = ? OR tracking_number = ? OR order_number = ?")
        .bind(status, orderId, orderId, orderId)
        .run();
    } catch (e: any) {
      if (String(e).includes("no such table")) {
        await initializeD1Schema(d1, true);
        await d1
          .prepare("UPDATE orders SET status = ? WHERE id = ? OR tracking_number = ? OR order_number = ?")
          .bind(status, orderId, orderId, orderId)
          .run();
      } else {
        console.warn("D1 update order status error:", e);
      }
    }
  }

  if (idx > -1) {
    await syncOrderToR2(memoryOrdersCache[idx], memoryOrdersCache);
  }
  return true;
}

/**
 * Update order payment status and transaction details in the database
 */
export async function updateOrderPaymentInDb(
  orderId: string,
  paymentStatus: "paid" | "failed" | "pending" | "cancelled",
  details?: {
    ziinaPaymentIntentId?: string;
    transactionId?: string;
    cardBrand?: string;
    cardLastFour?: string;
    orderStatus?: Order["status"];
  },
  d1?: D1DatabaseLike
): Promise<boolean> {
  const idx = memoryOrdersCache.findIndex(
    (o) =>
      o.id === orderId ||
      o.orderNumber === orderId ||
      (o.ziinaPaymentIntentId && o.ziinaPaymentIntentId === orderId)
  );
  if (idx > -1) {
    memoryOrdersCache[idx].paymentStatus = paymentStatus;
    if (details?.orderStatus) {
      memoryOrdersCache[idx].status = details.orderStatus;
    } else if (paymentStatus === "paid" && memoryOrdersCache[idx].status === "pending") {
      memoryOrdersCache[idx].status = "processing";
    }
    if (details?.ziinaPaymentIntentId) {
      memoryOrdersCache[idx].ziinaPaymentIntentId = details.ziinaPaymentIntentId;
    }
    if (details?.transactionId) {
      memoryOrdersCache[idx].transactionId = details.transactionId;
    }
    if (details?.cardBrand) {
      memoryOrdersCache[idx].cardBrand = details.cardBrand;
    }
    if (details?.cardLastFour) {
      memoryOrdersCache[idx].cardLastFour = details.cardLastFour;
    }
  }

  if (d1) {
    try {
      await initializeD1Schema(d1);
      const newStatus =
        details?.orderStatus || (paymentStatus === "paid" ? "processing" : "pending");
      await d1
        .prepare(
          "UPDATE orders SET payment_status = ?, status = ?, updated_at = ? WHERE id = ? OR tracking_number = ? OR order_number = ?"
        )
        .bind(paymentStatus, newStatus, new Date().toISOString(), orderId, orderId, orderId)
        .run();
    } catch (e: any) {
      console.warn("D1 update order payment status error:", e);
    }
  }

  if (idx > -1) {
    await syncOrderToR2(memoryOrdersCache[idx], memoryOrdersCache);
  }
  return true;
}

/**
 * Delete order from the database
 */
export async function deleteOrderFromDb(orderId: string, d1?: D1DatabaseLike): Promise<boolean> {
  memoryOrdersCache = memoryOrdersCache.filter((o) => o.id !== orderId);

  if (d1) {
    try {
      await initializeD1Schema(d1);
      try {
        await d1.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId).run();
      } catch {}
      await d1.prepare("DELETE FROM orders WHERE id = ? OR tracking_number = ? OR order_number = ?").bind(orderId, orderId, orderId).run();
    } catch (e: any) {
      if (String(e).includes("no such table")) {
        await initializeD1Schema(d1, true);
        try {
          await d1.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId).run();
        } catch {}
        await d1.prepare("DELETE FROM orders WHERE id = ? OR tracking_number = ? OR order_number = ?").bind(orderId, orderId, orderId).run();
      } else {
        console.warn("D1 delete order error:", e);
      }
    }
  }

  const r2 = getR2Client();
  if (r2) {
    try {
      await r2.fetch(`${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/orders/${orderId}.json`, {
        method: "DELETE",
      });
      await r2.fetch(`${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/data/orders.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastUpdated: new Date().toISOString(),
          totalOrders: memoryOrdersCache.length,
          orders: memoryOrdersCache,
        }),
      });
    } catch (err) {
      console.warn("R2 delete order error:", err);
    }
  }

  return true;
}
