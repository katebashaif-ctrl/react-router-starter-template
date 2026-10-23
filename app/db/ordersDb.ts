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
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_emirate TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    notes TEXT,
    gift_note TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    delivery_fee REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cod',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'pending',
    items_json TEXT NOT NULL,
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    phone TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emirate TEXT NOT NULL,
    last_address TEXT,
    total_orders INTEGER NOT NULL DEFAULT 1,
    total_spent REAL NOT NULL DEFAULT 0,
    last_order_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_emirate ON orders(customer_emirate)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`
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
 * Robustly ensures Cloudflare D1 tables and indexes exist.
 * Uses individual prepare().run() executions to avoid multi-statement parsing issues.
 */
export async function initializeD1Schema(db: D1DatabaseLike, force = false): Promise<boolean> {
  if (isD1SchemaInitialized && !force) return true;

  try {
    for (const statement of SCHEMA_STATEMENTS) {
      try {
        await db.prepare(statement).run();
      } catch (stmtErr: any) {
        // If exec is supported, fallback to exec
        if (typeof db.exec === "function") {
          try {
            await db.exec(statement);
          } catch (execErr) {
            console.warn("D1 statement warning:", stmtErr?.message || stmtErr);
          }
        } else {
          console.warn("D1 statement warning:", stmtErr?.message || stmtErr);
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
 * Map D1 SQL row to application Order type
 */
function mapD1RowToOrder(row: any): Order {
  let items: OrderItem[] = [];
  try {
    items = typeof row.items_json === "string" ? JSON.parse(row.items_json) : row.items_json || [];
  } catch {
    items = [];
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmirate: row.customer_emirate,
    customerAddress: row.customer_address,
    notes: row.notes || undefined,
    giftNote: row.gift_note || undefined,
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    discount: Number(row.discount) || 0,
    total: Number(row.total) || 0,
    paymentMethod: row.payment_method || "cod",
    status: row.status || "pending",
    createdAt: row.created_at || new Date().toISOString(),
    items,
  };
}

/**
 * Seed initial sample orders into D1 if database table is empty
 */
async function seedInitialOrdersToD1(d1: D1DatabaseLike): Promise<void> {
  try {
    for (const order of INITIAL_ORDERS) {
      await d1
        .prepare(
          `INSERT OR IGNORE INTO orders (
            id, order_number, customer_name, customer_phone, customer_emirate, customer_address,
            notes, gift_note, subtotal, delivery_fee, discount, total, payment_method,
            payment_status, status, items_json, source, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          order.id,
          order.orderNumber,
          order.customerName,
          order.customerPhone,
          order.customerEmirate,
          order.customerAddress,
          order.notes || "",
          order.giftNote || "",
          order.subtotal,
          order.deliveryFee,
          order.discount || 0,
          order.total,
          order.paymentMethod,
          "paid",
          order.status,
          JSON.stringify(order.items),
          "seed_data",
          order.createdAt,
          order.createdAt
        )
        .run();

      for (const item of order.items) {
        const itemId = `item-${order.id}-${item.productId}`;
        await d1
          .prepare(
            `INSERT OR IGNORE INTO order_items (
              id, order_id, product_id, name, quantity, price, unit, packaging_option, total_price, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            itemId,
            order.id,
            item.productId,
            item.name,
            item.quantity,
            item.price,
            item.unit,
            item.packagingOption || "standard",
            item.price * item.quantity,
            order.createdAt
          )
          .run();
      }
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
        // If "no such table" occurs, re-run schema initialization and retry once
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
        // If table is completely empty on fresh instance, seed with sample orders
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
      // 1. Insert Order into orders table
      await d1
        .prepare(
          `INSERT INTO orders (
            id, order_number, customer_name, customer_phone, customer_emirate, customer_address,
            notes, gift_note, subtotal, delivery_fee, discount, total, payment_method,
            payment_status, status, items_json, source, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          newOrder.id,
          newOrder.orderNumber,
          newOrder.customerName,
          newOrder.customerPhone,
          newOrder.customerEmirate,
          newOrder.customerAddress,
          newOrder.notes || "",
          newOrder.giftNote || "",
          newOrder.subtotal,
          newOrder.deliveryFee,
          newOrder.discount,
          newOrder.total,
          newOrder.paymentMethod,
          "pending",
          newOrder.status,
          JSON.stringify(newOrder.items),
          "web_store",
          nowIso,
          nowIso
        )
        .run();

      // 2. Insert Order Items into order_items relational table
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

      // 3. Upsert Customer profile in customers registry
      await d1
        .prepare(
          `INSERT INTO customers (phone, name, emirate, last_address, total_orders, total_spent, last_order_at, created_at)
           VALUES (?, ?, ?, ?, 1, ?, ?, ?)
           ON CONFLICT(phone) DO UPDATE SET
             name = excluded.name,
             emirate = excluded.emirate,
             last_address = excluded.last_address,
             total_orders = customers.total_orders + 1,
             total_spent = customers.total_spent + excluded.total_spent,
             last_order_at = excluded.last_order_at`
        )
        .bind(
          newOrder.customerPhone,
          newOrder.customerName,
          newOrder.customerEmirate,
          newOrder.customerAddress,
          newOrder.total,
          nowIso,
          nowIso
        )
        .run();
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
        .prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
        .bind(status, new Date().toISOString(), orderId)
        .run();
    } catch (e: any) {
      if (String(e).includes("no such table")) {
        await initializeD1Schema(d1, true);
        await d1
          .prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
          .bind(status, new Date().toISOString(), orderId)
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
 * Delete order from the database
 */
export async function deleteOrderFromDb(orderId: string, d1?: D1DatabaseLike): Promise<boolean> {
  memoryOrdersCache = memoryOrdersCache.filter((o) => o.id !== orderId);

  if (d1) {
    try {
      await initializeD1Schema(d1);
      await d1.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId).run();
      await d1.prepare("DELETE FROM orders WHERE id = ?").bind(orderId).run();
    } catch (e: any) {
      if (String(e).includes("no such table")) {
        await initializeD1Schema(d1, true);
        await d1.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId).run();
        await d1.prepare("DELETE FROM orders WHERE id = ?").bind(orderId).run();
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
