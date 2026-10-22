import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { AwsClient } from "aws4fetch";

interface R2Config {
  accountId: string;
  token: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
  publicUrl: string;
}

// Module-level config supporting environment variables and runtime settings
const CFG: R2Config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57",
  token: process.env.CLOUDFLARE_API_TOKEN || "",
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "edaa617e65bf06c1e92ae289e137d1c7",
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  bucket: process.env.CLOUDFLARE_R2_BUCKET || "bt-liwa",
  endpoint:
    process.env.CLOUDFLARE_R2_ENDPOINT && process.env.CLOUDFLARE_R2_ENDPOINT.includes("r2.cloudflarestorage.com")
      ? process.env.CLOUDFLARE_R2_ENDPOINT.replace(/\/+$/, "")
      : (process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57")
        ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57"}.r2.cloudflarestorage.com`
        : "",
  publicUrl: (
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    (process.env.CLOUDFLARE_R2_ENDPOINT && !process.env.CLOUDFLARE_R2_ENDPOINT.includes("r2.cloudflarestorage.com")
      ? process.env.CLOUDFLARE_R2_ENDPOINT
      : "")
  ).replace(/\/+$/, ""),
};

function getR2Client(): AwsClient | null {
  if (!CFG.accessKeyId || !CFG.secretAccessKey) return null;
  return new AwsClient({
    accessKeyId: CFG.accessKeyId,
    secretAccessKey: CFG.secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "gif":
      return "image/gif";
    case "json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

/* ---------- GET /api/r2 ---------- */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || url.searchParams.get("file");
  const intent = url.searchParams.get("intent");
  const r2 = getR2Client();

  // 1. Stream image or object directly from Cloudflare R2 Bucket (No local file storage)
  if (key) {
    if (!r2) {
      return new Response("Cloudflare R2 credentials (CLOUDFLARE_R2_SECRET_ACCESS_KEY) not configured", {
        status: 503,
      });
    }

    try {
      const cleanKey = key.replace(/^\/+/, "");
      const objUrl = `${CFG.endpoint}/${CFG.bucket}/${cleanKey}`;
      const s3Res = await r2.fetch(objUrl);

      if (!s3Res.ok) {
        return new Response(`File not found in R2: ${s3Res.status}`, { status: s3Res.status });
      }

      const mimeType = s3Res.headers.get("content-type") || getMimeType(cleanKey);

      return new Response(s3Res.body, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e) {
      return new Response(e instanceof Error ? e.message : "Error streaming from R2", { status: 500 });
    }
  }

  // 2. Fetch Catalog Synchronously from R2 (data/store.json)
  if (intent === "get_catalog") {
    if (!r2) {
      return Response.json({
        success: false,
        fromR2: false,
        s3Configured: false,
        message: "مفاتيح R2 غير مضبوطة في السيرفر",
      });
    }

    try {
      const catalogUrl = `${CFG.endpoint}/${CFG.bucket}/data/store.json`;
      const res = await r2.fetch(catalogUrl);

      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        return Response.json({
          success: true,
          fromR2: true,
          data,
          message: "تم جلب المنتجات والبيانات من Cloudflare R2 بنجاح",
        });
      }

      return Response.json({
        success: false,
        fromR2: false,
        notFound: true,
        status: res.status,
        message: "لم يتم حفظ ملف الكتالوج في R2 بعد",
      });
    } catch (e) {
      return Response.json({
        success: false,
        fromR2: false,
        error: e instanceof Error ? e.message : "Failed to fetch catalog from R2",
      });
    }
  }

  // 3. Status and listing of R2 Bucket
  const s3Configured = r2 !== null;
  let connected = false;
  let remoteObjectsCount = 0;
  let remoteImages: string[] = [];
  let listError: string | null = null;

  if (r2) {
    try {
      const listUrl = `${CFG.endpoint}/${CFG.bucket}?list-type=2&max-keys=200`;
      const res = await r2.fetch(listUrl);
      if (res.ok) {
        connected = true;
        const xml = await res.text();
        const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
        remoteObjectsCount = keys.length;
        remoteImages = keys
          .filter((k) => /\.(jpg|jpeg|png|webp|svg)$/i.test(k))
          .map((k) => {
            if (CFG.publicUrl) {
              return `${CFG.publicUrl}/${k.replace(/^products\//, "")}`;
            }
            return `/api/r2?key=${encodeURIComponent(k)}`;
          });
      } else {
        listError = `LIST HTTP ${res.status}`;
      }
    } catch (e) {
      listError = e instanceof Error ? e.message : "LIST exception";
    }
  } else {
    listError = "مفتاح الوصول السري CLOUDFLARE_R2_SECRET_ACCESS_KEY غير مضبوط";
  }

  return Response.json({
    success: true,
    connected,
    s3Configured,
    publicUrlConfigured: Boolean(CFG.publicUrl),
    bucket: CFG.bucket,
    accountId: CFG.accountId,
    endpoint: CFG.endpoint,
    publicUrl: CFG.publicUrl,
    remoteObjectsCount,
    remoteImages,
    listError,
  });
}

/* ---------- POST /api/r2 ---------- */
export async function action({ request }: ActionFunctionArgs) {
  let body: {
    intent?: string;
    data?: unknown;
    imageName?: string;
    imageBase64?: string;
    config?: Partial<R2Config>;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "JSON غير صالح" }, { status: 400 });
  }

  // ===== A) حفظ وتحديث إعدادات R2 ديناميكياً =====
  if (body.intent === "save_r2_config" && body.config) {
    if (body.config.accountId) CFG.accountId = body.config.accountId.trim();
    if (body.config.accessKeyId) CFG.accessKeyId = body.config.accessKeyId.trim();
    if (body.config.secretAccessKey) CFG.secretAccessKey = body.config.secretAccessKey.trim();
    if (body.config.bucket) CFG.bucket = body.config.bucket.trim();
    if (body.config.publicUrl !== undefined) CFG.publicUrl = body.config.publicUrl.trim().replace(/\/+$/, "");
    if (body.config.endpoint) {
      CFG.endpoint = body.config.endpoint.trim().replace(/\/+$/, "");
    } else if (CFG.accountId) {
      CFG.endpoint = `https://${CFG.accountId}.r2.cloudflarestorage.com`;
    }

    const testClient = getR2Client();
    let testSuccess = false;
    let testError: string | null = null;
    let objectsCount = 0;

    if (testClient) {
      try {
        const testRes = await testClient.fetch(`${CFG.endpoint}/${CFG.bucket}?list-type=2&max-keys=5`);
        if (testRes.ok) {
          testSuccess = true;
          const xml = await testRes.text();
          const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
          objectsCount = keys.length;
        } else {
          testError = `HTTP ${testRes.status} ${testRes.statusText}`;
        }
      } catch (err) {
        testError = err instanceof Error ? err.message : "Connection failed";
      }
    } else {
      testError = "الرجاء إدخال Secret Access Key و Access Key ID للاتصال";
    }

    return Response.json({
      success: testSuccess,
      connected: testSuccess,
      error: testError,
      objectsCount,
      config: {
        accountId: CFG.accountId,
        accessKeyId: CFG.accessKeyId,
        bucket: CFG.bucket,
        endpoint: CFG.endpoint,
        publicUrl: CFG.publicUrl,
        hasSecretKey: Boolean(CFG.secretAccessKey),
      },
      message: testSuccess
        ? "تم الاتصال بسحابة Cloudflare R2 بنجاح!"
        : `تعذر الاتصال بـ R2: ${testError}`,
    });
  }

  const r2 = getR2Client();

  /* ===== B) مزامنة الكتالوج إلى R2 (data/store.json) ===== */
  if (body.intent === "sync_catalog") {
    if (!r2) {
      return Response.json(
        {
          success: false,
          r2Synced: false,
          error: "مفاتيح R2 غير مضبوطة في السيرفر — يرجى إدخال CLOUDFLARE_R2_SECRET_ACCESS_KEY",
        },
        { status: 503 }
      );
    }
    try {
      const putUrl = `${CFG.endpoint}/${CFG.bucket}/data/store.json`;
      const putRes = await r2.fetch(putUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(body.data, null, 2),
      });

      if (!putRes.ok) {
        return Response.json(
          {
            success: false,
            r2Synced: false,
            error: `فشل الحفظ في R2: HTTP ${putRes.status}`,
            detail: (await putRes.text()).slice(0, 400),
          },
          { status: 502 }
        );
      }

      return Response.json({
        success: true,
        r2Synced: true,
        message: "تم حفظ وتحديث الكتالوج بنجاح في سحابة Cloudflare R2 (data/store.json)",
      });
    } catch (e) {
      return Response.json(
        {
          success: false,
          r2Synced: false,
          error: "استثناء أثناء الرفع إلى R2",
          detail: e instanceof Error ? e.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  /* ===== C) رفع صورة منتج مباشرة إلى R2 حصراً (بدون تخزين محلي) ===== */
  if (body.intent === "upload_base64") {
    if (!body.imageBase64) {
      return Response.json({ success: false, error: "imageBase64 مطلوب" }, { status: 400 });
    }

    const m = body.imageBase64.match(/^data:image\/([a-zA-Z0-9]+)(?:\+xml)?;base64,(.+)$/s);
    if (!m) {
      return Response.json({ success: false, error: "صيغة Base64 غير صالحة" }, { status: 400 });
    }
    const extRaw = m[1].toLowerCase();
    const ext = extRaw === "jpeg" ? "jpg" : extRaw;
    const contentType =
      extRaw === "svg" ? "image/svg+xml" : `image/${extRaw === "jpg" ? "jpeg" : extRaw}`;
    const base64Data = m[2];

    const safeName = (body.imageName || "product").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${Date.now()}-${safeName}.${ext}`;
    const r2Key = `products/${filename}`;

    if (!r2) {
      return Response.json(
        {
          success: false,
          r2Synced: false,
          error: "تعذر رفع الصورة إلى R2: مفاتيح S3 غير مضبوطة (CLOUDFLARE_R2_SECRET_ACCESS_KEY)",
          hint: "يرجى إدخال مفتاح CLOUDFLARE_R2_SECRET_ACCESS_KEY في إعدادات R2 لتفعيل التخزين السحابي المباشر",
        },
        { status: 503 }
      );
    }

    try {
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const putUrl = `${CFG.endpoint}/${CFG.bucket}/${r2Key}`;

      const putRes = await r2.fetch(putUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: bytes,
      });

      if (!putRes.ok) {
        return Response.json(
          {
            success: false,
            r2Synced: false,
            error: `R2 PUT فشل: HTTP ${putRes.status} ${putRes.statusText}`,
            detail: (await putRes.text()).slice(0, 500),
          },
          { status: 502 }
        );
      }

      // حساب الرابط النهائي للصورة السحابية في R2 (بدون أي حفظ محلي على الإطلاق)
      let finalImageUrl = "";
      if (CFG.publicUrl) {
        finalImageUrl = `${CFG.publicUrl}/${r2Key.replace(/^products\//, "")}`;
      } else {
        // نقطة نهاية البث المباشر من R2
        finalImageUrl = `/api/r2?key=${encodeURIComponent(r2Key)}`;
      }

      return Response.json({
        success: true,
        r2Synced: true,
        key: r2Key,
        filename,
        url: finalImageUrl,
        isR2Hosted: true,
        message: "تم رفع صورة المنتج مباشرة إلى سحابة Cloudflare R2 بنجاح (بدون تخزين محلي)",
      });
    } catch (e) {
      return Response.json(
        {
          success: false,
          r2Synced: false,
          error: "استثناء أثناء الرفع إلى Cloudflare R2",
          detail: e instanceof Error ? e.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  return Response.json(
    { success: false, error: `intent غير معروف: ${body.intent}` },
    { status: 400 }
  );
}
