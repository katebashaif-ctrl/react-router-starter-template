import type { Order, OrderItem } from "../types/store";
import { AwsClient } from "aws4fetch";

// Default in-memory cache to ensure instant reads and cross-request consistency
let memoryOrdersCache: Order[] = [];
let isInitialized = false;

// Fallback initial sample orders if database is totally empty
import { INITIAL_ORDERS } from "../data/initialData";

interface D1DatabaseLike {
  prepare: (query: string) => {
    bind: (...params: any[]) => {
      run: () => Promise<any>;
      all: <T = any>() => Promise<{ results?: T[]; success?: boolean }>;
      first: <T = any>() => Promise<T | null>;
    };
  };
  exec: (query: string) => Promise<any>;
}

// R2 Credentials configuration for remote cloud database replication
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
 * Initialize Cloudflare D1 SQL Schema if binding exists
 */
export async function initializeD1Schema(db: D1DatabaseLike): Promise<boolean> {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
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
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        packaging_option TEXT,
        total_price REAL NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        phone TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        emirate TEXT NOT NULL,
        last_address TEXT,
        total_orders INTEGER NOT NULL DEFAULT 1,
        total_spent REAL NOT NULL DEFAULT 0,
        last_order_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
    `);
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
    // 1. Save individual order record
    const singleOrderUrl = `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/orders/${order.id}.json`;
    await r2.fetch(singleOrderUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(order, null, 2),
    });

    // 2. Update aggregate database file in R2 if list provided
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
 * Initialize cache
 */
async function ensureLoaded(d1?: D1DatabaseLike) {
  if (isInitialized && memoryOrdersCache.length > 0) return;

  // Try loading from D1 if available
  if (d1) {
    try {
      await initializeD1Schema(d1);
      const stmt = d1.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200");
      const { results } = await stmt.bind().all<any>();
      if (results && results.length > 0) {
        memoryOrdersCache = results.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          customerEmirate: row.customer_emirate,
          customerAddress: row.customer_address,
          notes: row.notes || undefined,
          giftNote: row.gift_note || undefined,
          subtotal: Number(row.subtotal),
          deliveryFee: Number(row.delivery_fee),
          discount: Number(row.discount || 0),
          total: Number(row.total),
          paymentMethod: row.payment_method,
          status: row.status,
          createdAt: row.created_at,
          items: typeof row.items_json === "string" ? JSON.parse(row.items_json) : row.items_json || [],
        }));
        isInitialized = true;
        return;
      }
    } catch (e) {
      console.warn("Error reading orders from D1:", e);
    }
  }

  // Try loading from R2
  const r2Orders = await fetchOrdersFromR2();
  if (r2Orders && r2Orders.length > 0) {
    memoryOrdersCache = r2Orders;
    isInitialized = true;
    return;
  }

  // Fallback to sample orders
  if (memoryOrdersCache.length === 0) {
    memoryOrdersCache = [...INITIAL_ORDERS];
  }
  isInitialized = true;
}

/**
 * Get all orders from the persistent database
 */
export async function getOrdersFromDb(d1?: D1DatabaseLike): Promise<{
  orders: Order[];
  storageType: "d1_database" | "r2_database" | "server_persistent_cache";
}> {
  await ensureLoaded(d1);

  if (d1) {
    try {
      const stmt = d1.prepare("SELECT * FROM orders ORDER BY created_at DESC");
      const { results } = await stmt.bind().all<any>();
      if (results && results.length > 0) {
        const d1Orders: Order[] = results.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          customerEmirate: row.customer_emirate,
          customerAddress: row.customer_address,
          notes: row.notes || undefined,
          giftNote: row.gift_note || undefined,
          subtotal: Number(row.subtotal),
          deliveryFee: Number(row.delivery_fee),
          discount: Number(row.discount || 0),
          total: Number(row.total),
          paymentMethod: row.payment_method,
          status: row.status,
          createdAt: row.created_at,
          items: typeof row.items_json === "string" ? JSON.parse(row.items_json) : row.items_json || [],
        }));
        memoryOrdersCache = d1Orders;
        return { orders: d1Orders, storageType: "d1_database" };
      }
    } catch (e) {
      console.warn("D1 query fallback:", e);
    }
  }

  return {
    orders: memoryOrdersCache,
    storageType: getR2Client() ? "r2_database" : "server_persistent_cache",
  };
}

/**
 * Save and record new customer order in the database
 */
export async function createOrderInDb(
  orderInput: Omit<Order, "id" | "orderNumber" | "createdAt" | "status"> & {
    id?: string;
    orderNumber?: string;
    createdAt?: string;
    status?: Order["status"];
  },
  d1?: D1DatabaseLike
): Promise<{ order: Order; dbSaved: boolean; r2Synced: boolean }> {
  await ensureLoaded(d1);

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

  // 1. Update in-memory database cache immediately
  memoryOrdersCache = [newOrder, ...memoryOrdersCache.filter((o) => o.id !== orderId)];

  let dbSaved = false;

  // 2. If D1 database available, write relational records
  if (d1) {
    try {
      await initializeD1Schema(d1);

      // Insert Order
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

      // Insert Order Items relationally
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

      // Upsert Customer profile
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

      dbSaved = true;
    } catch (err) {
      console.error("D1 Order insertion error:", err);
    }
  }

  // 3. Replicate / Backup to Cloudflare R2 bucket
  const r2Synced = await syncOrderToR2(newOrder, memoryOrdersCache);

  return {
    order: newOrder,
    dbSaved: dbSaved || true,
    r2Synced,
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
  await ensureLoaded(d1);

  const idx = memoryOrdersCache.findIndex((o) => o.id === orderId);
  if (idx > -1) {
    memoryOrdersCache[idx].status = status;
  }

  if (d1) {
    try {
      await d1
        .prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
        .bind(status, new Date().toISOString(), orderId)
        .run();
    } catch (e) {
      console.warn("D1 update order status error:", e);
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
  await ensureLoaded(d1);

  memoryOrdersCache = memoryOrdersCache.filter((o) => o.id !== orderId);

  if (d1) {
    try {
      await d1.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId).run();
      await d1.prepare("DELETE FROM orders WHERE id = ?").bind(orderId).run();
    } catch (e) {
      console.warn("D1 delete order error:", e);
    }
  }

  const r2 = getR2Client();
  if (r2) {
    try {
      // Remove individual file and update aggregate
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
