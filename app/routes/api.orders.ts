import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  getOrdersFromDb,
  createOrderInDb,
  updateOrderStatusInDb,
  deleteOrderFromDb,
} from "../db/ordersDb";
import type { Order } from "../types/store";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const d1 = (context as any)?.cloudflare?.env?.DB;
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const searchQuery = url.searchParams.get("q")?.toLowerCase();

  try {
    const { orders, storageType } = await getOrdersFromDb(d1);

    let filtered = orders;
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchQuery) ||
          o.customerName.toLowerCase().includes(searchQuery) ||
          o.customerPhone.includes(searchQuery) ||
          o.customerEmirate.toLowerCase().includes(searchQuery)
      );
    }

    return Response.json({
      success: true,
      count: filtered.length,
      totalRevenue: filtered.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total : 0), 0),
      storageType,
      orders: filtered,
    });
  } catch (error) {
    console.error("Error fetching orders from database:", error);
    return Response.json(
      {
        success: false,
        error: "فشل استرجاع الطلبات من قاعدة البيانات",
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
  const intent = body.intent || (method === "DELETE" ? "delete_order" : method === "PATCH" ? "update_status" : "create_order");

  // 1. Create new order in the database
  if (intent === "create_order" || method === "POST") {
    const {
      customerName,
      customerPhone,
      customerEmirate,
      customerAddress,
      notes,
      giftNote,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!customerName || !customerPhone || !customerAddress || !customerEmirate) {
      return Response.json(
        {
          success: false,
          error: "بيانات العميل غير مكتملة (الاسم، الهاتف، الإمارة، والعنوان مطلوبة)",
        },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json(
        {
          success: false,
          error: "لا يمكن إرسال طلب بدون منتجات في السلة",
        },
        { status: 400 }
      );
    }

    try {
      const result = await createOrderInDb(
        {
          customerName,
          customerPhone,
          customerEmirate,
          customerAddress,
          notes,
          giftNote,
          items,
          subtotal: Number(subtotal) || 0,
          deliveryFee: Number(deliveryFee) || 0,
          discount: Number(discount) || 0,
          total: Number(total) || 0,
          paymentMethod: paymentMethod || "cod",
        },
        d1
      );

      return Response.json({
        success: true,
        message: "تم حفظ الطلب بنجاح وتسجيله في قاعدة بيانات المتجر",
        order: result.order,
        dbSaved: result.dbSaved,
        r2Synced: result.r2Synced,
      });
    } catch (err) {
      console.error("Error creating order:", err);
      return Response.json(
        {
          success: false,
          error: "فشل تسجيل الطلب في قاعدة البيانات",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  // 2. Update order status
  if (intent === "update_status" || method === "PATCH") {
    const { orderId, status } = body;
    if (!orderId || !status) {
      return Response.json(
        { success: false, error: "orderId و status مطلوبان" },
        { status: 400 }
      );
    }

    try {
      await updateOrderStatusInDb(orderId, status as Order["status"], d1);
      return Response.json({
        success: true,
        message: `تم تحديث حالة الطلب إلى "${status}" في قاعدة البيانات بنجاح`,
        orderId,
        status,
      });
    } catch (err) {
      return Response.json(
        {
          success: false,
          error: "فشل تحديث حالة الطلب في قاعدة البيانات",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  // 3. Delete order
  if (intent === "delete_order" || method === "DELETE") {
    const orderId = body.orderId;
    if (!orderId) {
      return Response.json({ success: false, error: "orderId مطلوب" }, { status: 400 });
    }

    try {
      await deleteOrderFromDb(orderId, d1);
      return Response.json({
        success: true,
        message: "تم حذف الطلب من قاعدة البيانات بنجاح",
        orderId,
      });
    } catch (err) {
      return Response.json(
        {
          success: false,
          error: "فشل حذف الطلب من قاعدة البيانات",
          detail: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  return Response.json(
    { success: false, error: `إجراء غير مدعوم: ${intent}` },
    { status: 400 }
  );
}
