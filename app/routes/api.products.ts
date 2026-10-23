import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  getProductsFromDb,
  createProductInDb,
  updateProductInDb,
  deleteProductFromDb,
  clearAllProductsInDb,
  syncProductsToR2,
} from "../db/productsDb";
import type { Product } from "../types/store";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const d1 = (context as any)?.cloudflare?.env?.DB;
  const url = new URL(request.url);
  const categoryFilter = url.searchParams.get("category");
  const searchQuery = url.searchParams.get("q")?.toLowerCase();

  try {
    const { products, storageType } = await getProductsFromDb(d1);

    let filtered = products;
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
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
        error: "فشل استرجاع المنتجات من قاعدة البيانات",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const d1 = (context as any)?.cloudflare?.env?.DB;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "JSON غير صالح" }, { status: 400 });
  }

  const method = request.method.toUpperCase();
  const intent = body.intent || (method === "DELETE" ? "delete_product" : method === "PATCH" ? "update_product" : "create_product");

  // 1. Clear all products (Clean slate for CMS)
  if (intent === "clear_all_products") {
    try {
      const res = await clearAllProductsInDb(d1);
      return Response.json({
        success: true,
        message: "تم حذف وإلغاء جميع المنتجات من قاعدة البيانات بنجاح، يمكنك الآن إضافة المنتجات من لوحة التحكم (CMS)",
        ...res,
      });
    } catch (err) {
      return Response.json(
        {
          success: false,
          error: "فشل حذف المنتجات",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  // 2. Create new product
  if (intent === "create_product" || method === "POST") {
    const { product } = body;
    if (!product || !product.name || product.price === undefined) {
      return Response.json(
        { success: false, error: "بيانات المنتج غير مكتملة (الاسم والسعر مطلوبان)" },
        { status: 400 }
      );
    }

    try {
      const res = await createProductInDb(product, d1);
      return Response.json({
        success: true,
        message: `تم حفظ المنتج "${product.name}" بنجاح في قاعدة بيانات المتجر السحابية`,
        product: res.product,
        dbSaved: res.dbSaved,
        r2Synced: res.r2Synced,
      });
    } catch (err) {
      console.error("Error creating product in DB:", err);
      return Response.json(
        {
          success: false,
          error: "فشل تسجيل المنتج في قاعدة البيانات",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  // 3. Update product
  if (intent === "update_product" || method === "PATCH") {
    const { id, updates } = body;
    if (!id || !updates) {
      return Response.json({ success: false, error: "id و updates مطلوبان" }, { status: 400 });
    }

    try {
      const res = await updateProductInDb(id, updates, d1);
      return Response.json({
        success: true,
        message: "تم تحديث المنتج في قاعدة البيانات بنجاح",
        product: res.product,
        dbSaved: res.dbSaved,
        r2Synced: res.r2Synced,
      });
    } catch (err) {
      return Response.json(
        {
          success: false,
          error: "فشل تحديث المنتج",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  // 4. Delete product
  if (intent === "delete_product" || method === "DELETE") {
    const id = body.id || body.productId;
    if (!id) {
      return Response.json({ success: false, error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    try {
      const res = await deleteProductFromDb(id, d1);
      return Response.json({
        success: true,
        message: "تم حذف المنتج من قاعدة البيانات بنجاح",
        ...res,
      });
    } catch (err) {
      return Response.json(
        {
          success: false,
          error: "فشل حذف المنتج من قاعدة البيانات",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  return Response.json({ success: false, error: `إجراء غير مدعوم: ${intent}` }, { status: 400 });
}
