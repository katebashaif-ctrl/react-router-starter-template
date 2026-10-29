import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  getProductsFromDb,
  createProductInDb,
  updateProductInDb,
  deleteProductFromDb,
  clearAllProductsInDb,
} from "../../db/productsDb";

export async function handleProductsLoader({ request, context }: LoaderFunctionArgs) {
  const d1 = (context as any)?.cloudflare?.env?.DB;
  const url = new URL(request.url);
  const categoryFilter = url.searchParams.get("category");
  const searchQuery = url.searchParams.get("q")?.toLowerCase();

  try {
    const { products, storageType } = await getProductsFromDb(d1);

    let filtered = products;
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter || p.tag === categoryFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery) ||
          p.nameEn?.toLowerCase().includes(searchQuery) ||
          p.description?.toLowerCase().includes(searchQuery)
      );
    }

    return Response.json({
      success: true,
      count: filtered.length,
      storageType,
      products: filtered,
    });
  } catch (error) {
    console.error("Error fetching products from database:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch products from database",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}

export async function handleProductsAction({ request, context }: ActionFunctionArgs) {
  const d1 = (context as any)?.cloudflare?.env?.DB;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const method = request.method.toUpperCase();
  const intent = body.intent || (method === "DELETE" ? "delete_product" : method === "PATCH" ? "update_product" : "create_product");

  if (intent === "clear_all_products") {
    try {
      const res = await clearAllProductsInDb(d1);
      return Response.json({
        success: true,
        message: "All products cleared successfully",
        ...res,
      });
    } catch (err) {
      return Response.json(
        {
          success: false,
          error: "Failed to clear products",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  if (intent === "create_product" || method === "POST") {
    const { product } = body;
    if (!product || !product.name || product.price === undefined) {
      return Response.json(
        { success: false, error: "Missing required product fields (name and price)" },
        { status: 400 }
      );
    }

    try {
      const res = await createProductInDb(product, d1);
      return Response.json({
        success: true,
        message: "Product created successfully",
        product: res.product,
        dbSaved: res.dbSaved,
        r2Synced: res.r2Synced,
      });
    } catch (err) {
      console.error("Error creating product in DB:", err);
      return Response.json(
        {
          success: false,
          error: "Failed to create product in database",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  if (intent === "update_product" || method === "PATCH") {
    const { id, updates } = body;
    if (!id || !updates) {
      return Response.json({ success: false, error: "id and updates required" }, { status: 400 });
    }

    try {
      const res = await updateProductInDb(id, updates, d1);
      return Response.json({
        success: true,
        message: "Product updated successfully",
        product: res.product,
        dbSaved: res.dbSaved,
        r2Synced: res.r2Synced,
      });
    } catch (err) {
      return Response.json(
        {
          success: false,
          error: "Failed to update product",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  if (intent === "delete_product" || method === "DELETE") {
    const id = body.id || body.productId;
    if (!id) {
      return Response.json({ success: false, error: "Product id required" }, { status: 400 });
    }

    try {
      const res = await deleteProductFromDb(id, d1);
      return Response.json({
        success: true,
        message: "Product deleted successfully",
        ...res,
      });
    } catch (err) {
      return Response.json(
        {
          success: false,
          error: "Failed to delete product from database",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  return Response.json({ success: false, error: `Unsupported intent: ${intent}` }, { status: 400 });
}
