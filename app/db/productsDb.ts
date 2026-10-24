import type { Product } from "../types/store";
import { AwsClient } from "aws4fetch";
import { INITIAL_PRODUCTS } from "../data/initialData";

export interface D1DatabaseLike {
  prepare: (query: string) => {
    bind: (...params: any[]) => {
      run: () => Promise<any>;
      all: <T = any>() => Promise<{ results?: T[]; success?: boolean }>;
      first: <T = any>() => Promise<T | null>;
    };
  };
  exec?: (query: string) => Promise<any>;
}

// In-memory products cache initialized with authentic Emirati catalog
let memoryProductsCache: Product[] = [...INITIAL_PRODUCTS];
let isProductsLoaded = false;
let isProductSchemaInitialized = false;

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
 * Ensure D1 products schema exists
 */
export async function initializeProductsSchema(db: D1DatabaseLike, force = false): Promise<boolean> {
  if (isProductSchemaInitialized && !force) return true;

  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        seed_key TEXT,
        available INTEGER DEFAULT 1,
        category_id TEXT,
        sort_order INTEGER DEFAULT 1,
        minimum_order_quantity INTEGER DEFAULT 1,
        maximum_order_quantity INTEGER,
        data_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.prepare(ddl).run();
    isProductSchemaInitialized = true;
    return true;
  } catch (err: any) {
    if (typeof db.exec === "function") {
      try {
        await db.exec(`
          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT,
            seed_key TEXT,
            available INTEGER DEFAULT 1,
            category_id TEXT,
            sort_order INTEGER DEFAULT 1,
            minimum_order_quantity INTEGER DEFAULT 1,
            maximum_order_quantity INTEGER,
            data_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        isProductSchemaInitialized = true;
        return true;
      } catch (e) {
        console.warn("Product schema creation warning:", e);
      }
    }
    return false;
  }
}

/**
 * Map D1 SQL row to application Product type
 */
export function mapD1RowToProduct(row: any): Product {
  let extraData: Partial<Product> = {};
  if (row.data_json) {
    try {
      extraData = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
    } catch {}
  }

  const categoryMap: Record<string, Product["category"]> = {
    "cat-1": "rutab",
    "cat-2": "figs",
    "cat-3": "dates",
    "cat-4": "truffles",
    "cat-5": "heritage_boxes",
    "cat-6": "preserves",
    "rutab": "rutab",
    "figs": "figs",
    "dates": "dates",
    "truffles": "truffles",
    "heritage_boxes": "heritage_boxes",
    "preserves": "preserves",
  };

  const cat = extraData.category || categoryMap[row.category_id] || "rutab";

  return {
    id: row.id,
    name: row.name,
    nameEn: extraData.nameEn || row.name,
    category: cat,
    price: Number(row.price) || 0,
    originalPrice: extraData.originalPrice || undefined,
    unit: extraData.unit || "صندوق",
    origin: extraData.origin || "مزارع ليوا والعين",
    harvestDate: extraData.harvestDate || "قطاف طازج",
    season: extraData.season || "موسم محلي",
    image: row.image_url || extraData.image || "/images/product_emirati_rutab_1792506810615.jpg",
    description: row.description || extraData.description || "",
    tastingNotes: extraData.tastingNotes || [],
    storageInstructions: extraData.storageInstructions || "يُحفظ في مكان بارد ومبرد",
    inStock: row.available === 1 || extraData.inStock !== false,
    stockQuantity: extraData.stockQuantity ?? 50,
    badge: extraData.badge || undefined,
    featured: extraData.featured ?? false,
  };
}

/**
 * Sync entire products catalog to Cloudflare R2 (data/store.json)
 */
export async function syncProductsToR2(products: Product[]): Promise<boolean> {
  const r2 = getR2Client();
  if (!r2) return false;

  try {
    const storeUrl = `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/data/store.json`;
    await r2.fetch(storeUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(
        {
          lastUpdated: new Date().toISOString(),
          products,
        },
        null,
        2
      ),
    });
    return true;
  } catch (err) {
    console.warn("Could not sync products to R2:", err);
    return false;
  }
}

/**
 * Fetch products from Cloudflare R2
 */
async function fetchProductsFromR2(): Promise<Product[] | null> {
  const r2 = getR2Client();
  if (!r2) return null;

  try {
    const storeUrl = `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/data/store.json`;
    const res = await r2.fetch(storeUrl);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && Array.isArray(data.products)) {
        return data.products;
      }
    }
  } catch (err) {
    console.warn("Could not fetch products from R2:", err);
  }
  return null;
}

/**
 * Seed initial sample products into D1 if database table is completely empty
 */
async function seedInitialProductsToD1(d1: D1DatabaseLike): Promise<void> {
  try {
    for (const product of INITIAL_PRODUCTS) {
      const jsonStr = JSON.stringify(product);
      await d1
        .prepare(
          `INSERT OR IGNORE INTO products (
            id, name, description, price, image_url, available, category_id,
            sort_order, minimum_order_quantity, maximum_order_quantity, data_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 0, ?, ?)`
        )
        .bind(
          product.id,
          product.name,
          product.description || "",
          product.price,
          product.image || "",
          product.inStock ? 1 : 0,
          product.category,
          jsonStr,
          new Date().toISOString()
        )
        .run();
    }
  } catch (seedErr) {
    console.warn("Could not seed initial products to D1:", seedErr);
  }
}

/**
 * Get all products from persistent database (Cloudflare D1 SQL)
 */
export async function getProductsFromDb(d1?: D1DatabaseLike): Promise<{
  products: Product[];
  storageType: "d1_database" | "r2_database" | "memory_cache";
}> {
  if (d1) {
    try {
      await initializeProductsSchema(d1);
      const stmt = d1.prepare("SELECT * FROM products ORDER BY sort_order ASC, created_at DESC");
      let { results } = await stmt.bind().all<any>();

      if (Array.isArray(results)) {
        if (results.length === 0 && INITIAL_PRODUCTS.length > 0) {
          await seedInitialProductsToD1(d1);
          const afterSeed = await d1.prepare("SELECT * FROM products ORDER BY sort_order ASC, created_at DESC").bind().all<any>();
          results = afterSeed?.results || [];
        }

        const d1Products = results.map(mapD1RowToProduct);
        memoryProductsCache = d1Products.length > 0 ? d1Products : [...INITIAL_PRODUCTS];
        isProductsLoaded = true;
        return { products: memoryProductsCache, storageType: "d1_database" };
      }
    } catch (e: any) {
      console.warn("D1 products query error:", e);
    }
  }

  // Fallback to R2
  const r2Products = await fetchProductsFromR2();
  if (r2Products && r2Products.length > 0) {
    memoryProductsCache = r2Products;
    isProductsLoaded = true;
    return { products: r2Products, storageType: "r2_database" };
  }

  if (memoryProductsCache.length === 0) {
    memoryProductsCache = [...INITIAL_PRODUCTS];
  }

  return {
    products: memoryProductsCache,
    storageType: "memory_cache",
  };
}

/**
 * Save new product into Cloudflare D1 SQL database
 */
export async function createProductInDb(product: Product, d1?: D1DatabaseLike): Promise<{
  product: Product;
  dbSaved: boolean;
  r2Synced: boolean;
}> {
  memoryProductsCache = [product, ...memoryProductsCache.filter((p) => p.id !== product.id)];
  let dbSaved = false;

  if (d1) {
    try {
      await initializeProductsSchema(d1);
      const jsonStr = JSON.stringify(product);
      await d1
        .prepare(
          `INSERT INTO products (
            id, name, description, price, image_url, available, category_id,
            sort_order, minimum_order_quantity, maximum_order_quantity, data_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 0, ?, ?)`
        )
        .bind(
          product.id,
          product.name,
          product.description || "",
          product.price,
          product.image || "",
          product.inStock ? 1 : 0,
          product.category,
          jsonStr,
          new Date().toISOString()
        )
        .run();
      dbSaved = true;
    } catch (err: any) {
      console.error("D1 product insert error:", err);
    }
  }

  const r2Synced = await syncProductsToR2(memoryProductsCache);
  return { product, dbSaved, r2Synced };
}

/**
 * Update existing product in Cloudflare D1 SQL database
 */
export async function updateProductInDb(
  id: string,
  updates: Partial<Product>,
  d1?: D1DatabaseLike
): Promise<{ product: Product | null; dbSaved: boolean; r2Synced: boolean }> {
  const idx = memoryProductsCache.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { product: null, dbSaved: false, r2Synced: false };
  }

  const updated: Product = { ...memoryProductsCache[idx], ...updates };
  memoryProductsCache[idx] = updated;

  let dbSaved = false;
  if (d1) {
    try {
      await initializeProductsSchema(d1);
      const jsonStr = JSON.stringify(updated);
      await d1
        .prepare(
          `UPDATE products SET
            name = ?,
            description = ?,
            price = ?,
            image_url = ?,
            available = ?,
            category_id = ?,
            data_json = ?
           WHERE id = ?`
        )
        .bind(
          updated.name,
          updated.description || "",
          updated.price,
          updated.image || "",
          updated.inStock ? 1 : 0,
          updated.category,
          jsonStr,
          id
        )
        .run();
      dbSaved = true;
    } catch (err) {
      console.error("D1 product update error:", err);
    }
  }

  const r2Synced = await syncProductsToR2(memoryProductsCache);
  return { product: updated, dbSaved, r2Synced };
}

/**
 * Delete product from Cloudflare D1 SQL database
 */
export async function deleteProductFromDb(id: string, d1?: D1DatabaseLike): Promise<{
  deleted: boolean;
  dbSaved: boolean;
  r2Synced: boolean;
}> {
  memoryProductsCache = memoryProductsCache.filter((p) => p.id !== id);
  let dbSaved = false;

  if (d1) {
    try {
      await initializeProductsSchema(d1);
      await d1.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      dbSaved = true;
    } catch (err) {
      console.error("D1 product delete error:", err);
    }
  }

  const r2Synced = await syncProductsToR2(memoryProductsCache);
  return { deleted: true, dbSaved, r2Synced };
}

/**
 * Delete all products from database (Clean slate for CMS)
 */
export async function clearAllProductsInDb(d1?: D1DatabaseLike): Promise<{
  cleared: boolean;
  dbSaved: boolean;
  r2Synced: boolean;
}> {
  memoryProductsCache = [];
  isProductsLoaded = true;
  let dbSaved = false;

  if (d1) {
    try {
      await initializeProductsSchema(d1);
      await d1.prepare("DELETE FROM products").run();
      dbSaved = true;
    } catch (err) {
      console.error("D1 products clear error:", err);
    }
  }

  const r2Synced = await syncProductsToR2([]);
  return { cleared: true, dbSaved, r2Synced };
}
