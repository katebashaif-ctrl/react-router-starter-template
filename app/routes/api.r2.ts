import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { AwsClient } from "aws4fetch";
import fs from "node:fs";
import path from "node:path";

const CFG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57",
  token: process.env.CLOUDFLARE_API_TOKEN || "",
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  bucket: process.env.CLOUDFLARE_R2_BUCKET || "bt-liwa",
  endpoint:
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    `https://${process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57"}.r2.cloudflarestorage.com`,

  publicUrl: (process.env.CLOUDFLARE_R2_PUBLIC_URL || "").replace(/\/+$/, ""),
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

/* ---------- GET /api/r2 ---------- */
export async function loader() {
  const r2 = getR2Client();
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
          .map((k) =>
            CFG.publicUrl
              ? `${CFG.publicUrl}/${k}`
              : `${CFG.endpoint}/${CFG.bucket}/${k}`
          );
      } else {
        listError = `LIST HTTP ${res.status}`;
      }
    } catch (e) {
      listError = e instanceof Error ? e.message : "LIST exception";
    }
  } else {
    listError = "مفاتيح S3 (ACCESS_KEY_ID / SECRET) غير مضبوطة";
  }

  // صور محلية (dev only)
  let localImages: string[] = [];
  try {
    const dir = path.join(process.cwd(), "public", "images", "r2");
    if (fs.existsSync(dir)) {
      localImages = fs
        .readdirSync(dir)
        .filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f))
        .map((f) => `/images/r2/${f}`);
    }
  } catch {}

  const allImages = Array.from(new Set([...remoteImages, ...localImages]));

  return Response.json({
    success: true,
    connected,                 // ← الآن يعكس حالة S3 الحقيقية
    s3Configured,
    publicUrlConfigured: Boolean(CFG.publicUrl),
    bucket: CFG.bucket,
    accountId: CFG.accountId,
    endpoint: CFG.endpoint,
    remoteObjectsCount,
    localImages: allImages,
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
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "JSON غير صالح" }, { status: 400 });
  }

  const r2 = getR2Client();

  /* ===== 1) مزامنة الكتالوج ===== */
  if (body.intent === "sync_catalog") {
    if (!r2) {
      return Response.json(
        {
          success: false,
          r2Synced: false,
          error: "مفاتيح R2 غير مضبوطة — تم إلغاء المزامنة",
          hint: "أضف CLOUDFLARE_R2_ACCESS_KEY_ID و CLOUDFLARE_R2_SECRET_ACCESS_KEY",
        },
        { status: 503 }
      );
    }
    try {
      const putUrl = `${CFG.endpoint}/${CFG.bucket}/data/store.json`;
      const putRes = await r2.fetch(putUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body.data, null, 2),
      });
      if (!putRes.ok) {
        return Response.json(
          {
            success: false,
            r2Synced: false,
            error: `PUT فشل: HTTP ${putRes.status}`,
            detail: (await putRes.text()).slice(0, 400),
          },
          { status: 502 }
        );
      }
      return Response.json({ success: true, r2Synced: true, message: "تمت المزامنة بنجاح" });
    } catch (e) {
      return Response.json(
        {
          success: false,
          r2Synced: false,
          error: "استثناء أثناء الرفع",
          detail: e instanceof Error ? e.message : "unknown",
        },
        { status: 500 }
      );
    }
  }

  /* ===== 2) رفع صورة Base64 ===== */
  if (body.intent === "upload_base64") {
    if (!body.imageBase64) {
      return Response.json({ success: false, error: "imageBase64 مطلوب" }, { status: 400 });
    }

    // استخراج الامتداد بشكل صحيح (يتعامل مع svg+xml)
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

    // ❗ إن لم تُضبط مفاتيح R2 → فشل صريح (بدل الابتلاع)
    if (!r2) {
      return Response.json(
        {
          success: false,
          r2Synced: false,
          error: "لم يتم رفع الصورة إلى R2: مفاتيح S3 غير مضبوطة",
          hint:
            "أضف CLOUDFLARE_R2_ACCESS_KEY_ID و CLOUDFLARE_R2_SECRET_ACCESS_KEY و CLOUDFLARE_R2_PUBLIC_URL في متغيرات البيئة",
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
            hint:
              putRes.status === 403
                ? "المفتاح لا يملك صلاحية Object Write على هذا الـ bucket — راجع صلاحيات API Token"
                : putRes.status === 404
                  ? "الـ bucket غير موجود أو الاسم خاطئ"
                  : undefined,
          },
          { status: 502 }
        );
      }

      // كاش محلي اختياري للتطوير
      try {
        const dir = path.join(process.cwd(), "public", "images", "r2");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, filename), Buffer.from(bytes));
      } catch {}

      const publicUrl = CFG.publicUrl ? `${CFG.publicUrl}/${r2Key}` : null;

      return Response.json({
        success: true,
        r2Synced: true,
        key: r2Key,
        filename,
        url: publicUrl || `/images/r2/${filename}`,
        publicUrlMissing: !publicUrl,
        warning: publicUrl
          ? undefined
          : "تم الرفع إلى R2 لكن CLOUDFLARE_R2_PUBLIC_URL غير مضبوط — أضفه ليظهر رابط عام",
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

  return Response.json(
    { success: false, error: `intent غير معروف: ${body.intent}` },
    { status: 400 }
  );
}
