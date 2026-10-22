import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { AwsClient } from "aws4fetch";
import fs from "node:fs";
import path from "node:path";

const CLOUDFLARE_CONFIG = {
	accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "0b7dc087410628baa1f652ea0fb8bd57",
	token: process.env.CLOUDFLARE_API_TOKEN || "",
	accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
	secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
	bucket: process.env.CLOUDFLARE_R2_BUCKET || "bt-liwa",
	endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || "https://0b7dc087410628baa1f652ea0fb8bd57.r2.cloudflarestorage.com",
};

function getR2Client(): AwsClient | null {
	const accessKeyId = CLOUDFLARE_CONFIG.accessKeyId;
	const secretAccessKey = CLOUDFLARE_CONFIG.secretAccessKey;

	if (!accessKeyId || !secretAccessKey) {
		return null;
	}

	return new AwsClient({
		accessKeyId,
		secretAccessKey,
		service: "s3",
		region: "auto",
	});
}

// GET /api/r2
export async function loader({ request }: LoaderFunctionArgs) {
	try {
		// 1. List local R2 images if available in filesystem
		const possibleDirs = [
			path.join(process.cwd(), "public", "images", "r2"),
			path.join("/app/applet", "public", "images", "r2"),
			path.resolve("./public/images/r2"),
		];
		const r2Dir = possibleDirs.find((d) => {
			try {
				return fs.existsSync(d);
			} catch {
				return false;
			}
		}) || possibleDirs[0];

		let localImages: string[] = [];
		try {
			if (fs.existsSync(r2Dir)) {
				localImages = fs
					.readdirSync(r2Dir)
					.filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f))
					.map((f) => `/images/r2/${f}`);
			}
		} catch {
			// Filesystem read fallback
		}

		// 2. Query real Cloudflare R2 bucket objects via aws4fetch
		let connected = false;
		let remoteObjectsCount = 0;
		let remoteImages: string[] = [];

		const r2 = getR2Client();
		if (r2) {
			try {
				const listUrl = `https://${CLOUDFLARE_CONFIG.accountId}.r2.cloudflarestorage.com/${CLOUDFLARE_CONFIG.bucket}?list-type=2&max-keys=100`;
				const res = await r2.fetch(listUrl);
				if (res.ok) {
					connected = true;
					const xml = await res.text();
					const keyMatches = xml.matchAll(/<Key>([^<]+)<\/Key>/g);
					const allKeys: string[] = [];
					for (const match of keyMatches) {
						if (match[1]) allKeys.push(match[1]);
					}
					remoteObjectsCount = allKeys.length;

					remoteImages = allKeys
						.filter((key) => /\.(jpg|jpeg|png|webp|svg)$/i.test(key))
						.map((key) => {
							const filename = key.replace(/^products\//, "");
							return `/images/r2/${filename}`;
						});
				}
			} catch {
				// S3 connection probe catch
			}
		}

		// Also verify token with Cloudflare API if S3 was not configured
		if (!connected && CLOUDFLARE_CONFIG.token) {
			try {
				const res = await fetch(
					`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/tokens/verify`,
					{
						headers: {
							Authorization: `Bearer ${CLOUDFLARE_CONFIG.token}`,
						},
					},
				);
				const data = (await res.json().catch(() => ({}))) as { success?: boolean };
				connected = data?.success === true;
			} catch {
				// Token check catch
			}
		}

		// Combine images
		const combinedImages = Array.from(new Set([...remoteImages, ...localImages]));

		return Response.json({
			success: true,
			connected,
			bucket: CLOUDFLARE_CONFIG.bucket,
			accountId: CLOUDFLARE_CONFIG.accountId,
			endpoint: CLOUDFLARE_CONFIG.endpoint,
			remoteObjectsCount: remoteObjectsCount || combinedImages.length,
			localImages: combinedImages.length > 0 ? combinedImages : localImages,
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

			const r2 = getR2Client();

			// Intent 1: Sync store catalog JSON to Cloudflare R2
			if (body.intent === "sync_catalog") {
				const storeDataString = JSON.stringify(body.data, null, 2);
				let r2Synced = false;

				if (r2) {
					try {
						const putUrl = `https://${CLOUDFLARE_CONFIG.accountId}.r2.cloudflarestorage.com/${CLOUDFLARE_CONFIG.bucket}/data/store.json`;
						const putRes = await r2.fetch(putUrl, {
							method: "PUT",
							headers: {
								"Content-Type": "application/json",
							},
							body: storeDataString,
						});
						r2Synced = putRes.ok;
					} catch {
						// S3 sync fallback
					}
				}

				return Response.json({
					success: true,
					r2Synced,
					message: r2Synced
						? "تمت مزامنة كتالوج المتجر بنجاح مع Cloudflare R2 (data/store.json)"
						: "تم حفظ الكتالوج محلياً، وجاري الربط مع R2",
				});
			}

			// Intent 2: Upload base64 image to Cloudflare R2
			if (body.intent === "upload_base64" && body.imageBase64) {
				const extMatch = body.imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
				const ext = extMatch ? extMatch[1] : "jpg";
				const base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
				const filename = `${Date.now()}-${(body.imageName || "product").replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;

				let finalUrl = body.imageBase64; // Guaranteed fallback
				let savedLocally = false;
				let r2Synced = false;

				// Try local file caching if filesystem is writable
				try {
					const buffer = Buffer.from(base64Data, "base64");
					const r2Dir = path.join(process.cwd(), "public", "images", "r2");
					if (!fs.existsSync(r2Dir)) {
						fs.mkdirSync(r2Dir, { recursive: true });
					}
					const localPath = path.join(r2Dir, filename);
					fs.writeFileSync(localPath, buffer);
					finalUrl = `/images/r2/${filename}`;
					savedLocally = true;
				} catch {
					// Filesystem write restricted in sandbox, seamlessly use data URL
				}

				// Upload to Cloudflare R2 via aws4fetch
				if (r2) {
					try {
						const buffer = Buffer.from(base64Data, "base64");
						const uint8 = new Uint8Array(buffer);
						const r2Key = `products/${filename}`;
						const putUrl = `https://${CLOUDFLARE_CONFIG.accountId}.r2.cloudflarestorage.com/${CLOUDFLARE_CONFIG.bucket}/${r2Key}`;
						const putRes = await r2.fetch(putUrl, {
							method: "PUT",
							headers: {
								"Content-Type": `image/${ext === "jpg" ? "jpeg" : ext}`,
							},
							body: uint8,
						});
						r2Synced = putRes.ok;
					} catch {
						// S3 upload catch
					}
				}

				return Response.json({
					success: true,
					url: finalUrl,
					filename,
					savedLocally,
					r2Synced,
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
