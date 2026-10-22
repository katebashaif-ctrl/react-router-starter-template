import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import fs from "node:fs";
import path from "node:path";

const CLOUDFLARE_CONFIG = {
	accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57",
	token: process.env.CLOUDFLARE_API_TOKEN || "",
	bucket: process.env.CLOUDFLARE_R2_BUCKET || "bt-liwa",
	endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || "https://0b7dc087410628baa1f652ea0fb8bd57.r2.cloudflarestorage.com",
};

// GET /api/r2
export async function loader({ request }: LoaderFunctionArgs) {
	try {
		// List local R2 images
		const possibleDirs = [
			path.join(process.cwd(), "public", "images", "r2"),
			path.join("/app/applet", "public", "images", "r2"),
			path.resolve("./public/images/r2"),
		];
		const r2Dir = possibleDirs.find((d) => fs.existsSync(d)) || possibleDirs[0];
		let localImages: string[] = [];
		if (fs.existsSync(r2Dir)) {
			localImages = fs
				.readdirSync(r2Dir)
				.filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f))
				.map((f) => `/images/r2/${f}`);
		}

		// Verify API Token with Cloudflare
		let verified = false;
		let remoteObjectsCount = 0;
		try {
			const res = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/tokens/verify`,
				{
					headers: {
						Authorization: `Bearer ${CLOUDFLARE_CONFIG.token}`,
					},
				},
			);
			const data = (await res.json()) as { success: boolean };
			verified = data.success === true;
		} catch (e) {
			console.warn("Cloudflare token check failed:", e);
		}

		let remoteImages: string[] = [];
		try {
			const res = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/r2/buckets/${CLOUDFLARE_CONFIG.bucket}/objects`,
				{
					headers: {
						Authorization: `Bearer ${CLOUDFLARE_CONFIG.token}`,
					},
				},
			);
			const data = (await res.json()) as { success: boolean; result?: { key: string }[] };
			if (data.success && Array.isArray(data.result)) {
				remoteObjectsCount = data.result.length;
				remoteImages = data.result
					.filter((item) => item.key && item.key.startsWith("products/"))
					.map((item) => `/images/r2/${item.key.replace("products/", "")}`);
			}
		} catch (e) {
			console.warn("Cloudflare R2 list failed:", e);
		}

		if (remoteImages.length > 0) {
			localImages = remoteImages;
		}

		return Response.json({
			success: true,
			connected: verified,
			bucket: CLOUDFLARE_CONFIG.bucket,
			accountId: CLOUDFLARE_CONFIG.accountId,
			endpoint: CLOUDFLARE_CONFIG.endpoint,
			remoteObjectsCount,
			localImages,
		});
	} catch (error) {
		return Response.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to load R2 status",
			},
			{ status: 500 },
		);
	}
}

// POST /api/r2
export async function action({ request }: ActionFunctionArgs) {
	try {
		const contentType = request.headers.get("content-type") || "";

		if (contentType.includes("application/json")) {
			const body = (await request.json()) as {
				intent?: string;
				data?: unknown;
				imageName?: string;
				imageBase64?: string;
			};

			// Intent 1: Sync store catalog JSON to R2
			if (body.intent === "sync_catalog") {
				const storeDataString = JSON.stringify(body.data, null, 2);
				const uploadRes = await fetch(
					`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/r2/buckets/${CLOUDFLARE_CONFIG.bucket}/objects/data%2Fstore.json`,
					{
						method: "PUT",
						headers: {
							Authorization: `Bearer ${CLOUDFLARE_CONFIG.token}`,
							"Content-Type": "application/json",
						},
						body: storeDataString,
					},
				);
				const uploadResult = (await uploadRes.json()) as { success: boolean };
				return Response.json({
					success: uploadResult.success,
					message: uploadResult.success
						? "تمت مزامنة كتالوج المتجر بنجاح مع Cloudflare R2 (data/store.json)"
						: "فشلت المزامنة مع R2",
				});
			}

			// Intent 2: Upload base64 image to R2 & save locally
			if (body.intent === "upload_base64" && body.imageBase64) {
				const extMatch = body.imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
				const ext = extMatch ? extMatch[1] : "jpg";
				const base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
				const buffer = Buffer.from(base64Data, "base64");

				const filename = `${Date.now()}-${(body.imageName || "product").replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
				const localPath = path.join(process.cwd(), "public", "images", "r2", filename);

				// Save locally
				const r2Dir = path.join(process.cwd(), "public", "images", "r2");
				if (!fs.existsSync(r2Dir)) {
					fs.mkdirSync(r2Dir, { recursive: true });
				}
				fs.writeFileSync(localPath, buffer);

				// Upload to Cloudflare R2
				const r2Key = `products/${filename}`;
				const r2Res = await fetch(
					`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/r2/buckets/${CLOUDFLARE_CONFIG.bucket}/objects/${encodeURIComponent(r2Key)}`,
					{
						method: "PUT",
						headers: {
							Authorization: `Bearer ${CLOUDFLARE_CONFIG.token}`,
							"Content-Type": `image/${ext}`,
						},
						body: buffer,
					},
				);
				const r2Result = (await r2Res.json()) as { success: boolean };

				return Response.json({
					success: true,
					url: `/images/r2/${filename}`,
					r2Key,
					r2Synced: r2Result.success === true,
				});
			}
		}

		return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
	} catch (error) {
		return Response.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "R2 action failed",
			},
			{ status: 500 },
		);
	}
}
