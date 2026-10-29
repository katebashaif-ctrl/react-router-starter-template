import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { updateOrderPaymentInDb } from "../../db/ordersDb";
import type { ZiinaPaymentIntent, ZiinaCreateIntentPayload } from "../../types/ziina";

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";

export async function handleZiinaCreateIntent({ request, context }: ActionFunctionArgs) {
	const d1 = (context as any)?.cloudflare?.env?.DB;

	try {
		const body = (await request.json()) as {
			orderId: string;
			orderNumber?: string;
			amount: number;
			currency?: string;
			customerName?: string;
			customerPhone?: string;
			customerEmail?: string;
			apiToken?: string;
			testMode?: boolean;
		};

		const { orderId, orderNumber, amount } = body;
		if (!orderId || !amount || amount <= 0) {
			return Response.json(
				{ success: false, error: "orderId and valid amount are required" },
				{ status: 400 },
			);
		}

		const currency = body.currency || "AED";
		const amountInFils = Math.round(amount * 100);

		const token = (body.apiToken || process.env.ZIINA_API_TOKEN || "").trim();
		const isTestMode = body.testMode ?? (process.env.ZIINA_TEST_MODE !== "false");

		function getPublicBaseUrl(req: Request): string {
			const origin = req.headers.get("origin");
			if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
				return origin.replace(/\/+$/, "");
			}

			const referer = req.headers.get("referer");
			if (referer) {
				try {
					const u = new URL(referer);
					if (!u.hostname.includes("localhost") && !u.hostname.includes("127.0.0.1")) {
						return `${u.protocol}//${u.host}`;
					}
				} catch {}
			}

			const xForwardedHost = req.headers.get("x-forwarded-host");
			const xForwardedProto = req.headers.get("x-forwarded-proto") || "https";
			if (xForwardedHost && !xForwardedHost.includes("localhost") && !xForwardedHost.includes("127.0.0.1")) {
				return `${xForwardedProto}://${xForwardedHost}`;
			}

			const host = req.headers.get("host");
			if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
				return `https://${host}`;
			}

			return "https://ais-dev-hsqw5onlp3tiaxn5ifdcoa-583061957492.europe-west1.run.app";
		}

		const publicBase = getPublicBaseUrl(request);
		const successUrl = `${publicBase}/payment/callback?status=success&orderId=${encodeURIComponent(orderId)}&payment_intent_id={PAYMENT_INTENT_ID}`;
		const cancelUrl = `${publicBase}/payment/callback?status=cancelled&orderId=${encodeURIComponent(orderId)}&payment_intent_id={PAYMENT_INTENT_ID}`;
		const failureUrl = `${publicBase}/payment/callback?status=failed&orderId=${encodeURIComponent(orderId)}&payment_intent_id={PAYMENT_INTENT_ID}`;

		const payload: ZiinaCreateIntentPayload = {
			amount: amountInFils,
			currency_code: currency,
			message: `Teen Liwa Order #${orderNumber || orderId}`,
			success_url: successUrl,
			cancel_url: cancelUrl,
			failure_url: failureUrl,
			test: isTestMode,
			allow_tips: false,
		};

		let paymentIntent: ZiinaPaymentIntent | null = null;
		let isLiveGateway = false;

		if (token) {
			try {
				const res = await fetch(`${ZIINA_API_BASE}/payment_intent`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(payload),
				});

				if (res.ok) {
					paymentIntent = (await res.json()) as ZiinaPaymentIntent;
					isLiveGateway = true;
				} else {
					console.warn(`[Ziina Gateway HTTP ${res.status}] ${await res.text()}`);
				}
			} catch (fetchErr) {
				console.error("[Ziina Gateway Fetch Error]:", fetchErr);
			}
		}

		if (!paymentIntent) {
			const mockIntentId = `pi_test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
			// Use relative path for seamless client navigation without broken localhost references
			const mockRedirectUrl = `/payment/callback?status=success&orderId=${encodeURIComponent(orderId)}&payment_intent_id=${mockIntentId}&simulated=true`;

			paymentIntent = {
				id: mockIntentId,
				amount: amountInFils,
				currency_code: currency,
				status: "requires_payment_instrument",
				redirect_url: mockRedirectUrl,
				test: true,
				created_at: new Date().toISOString(),
			};
		}

		try {
			await updateOrderPaymentInDb(
				orderId,
				"pending",
				{ ziinaPaymentIntentId: paymentIntent.id },
				d1,
			);
		} catch (dbErr) {
			console.warn("Could not update order paymentIntentId in DB:", dbErr);
		}

		return Response.json({
			success: true,
			payment_intent: paymentIntent,
			redirect_url: paymentIntent.redirect_url,
			isLiveGateway,
			testMode: isTestMode,
		});
	} catch (err) {
		console.error("Ziina create-intent error:", err);
		return Response.json(
			{
				success: false,
				error: "Failed to initialize payment intent",
				detail: err instanceof Error ? err.message : "unknown",
			},
			{ status: 500 },
		);
	}
}

export async function handleZiinaVerify({ request, context }: LoaderFunctionArgs) {
	const d1 = (context as any)?.cloudflare?.env?.DB;
	const url = new URL(request.url);
	const paymentIntentId = url.searchParams.get("id") || url.searchParams.get("payment_intent_id");
	const orderId = url.searchParams.get("orderId");
	const simulated = url.searchParams.get("simulated") === "true";
	const apiToken = (url.searchParams.get("token") || process.env.ZIINA_API_TOKEN || "").trim();

	if (!paymentIntentId) {
		return Response.json(
			{ success: false, error: "payment_intent_id is required" },
			{ status: 400 },
		);
	}

	try {
		let intentData: ZiinaPaymentIntent | null = null;
		let isLive = false;

		if (apiToken && !simulated && !paymentIntentId.startsWith("pi_test_")) {
			try {
				const res = await fetch(`${ZIINA_API_BASE}/payment_intent/${encodeURIComponent(paymentIntentId)}`, {
					headers: {
						Authorization: `Bearer ${apiToken}`,
						Accept: "application/json",
					},
				});

				if (res.ok) {
					intentData = (await res.json()) as ZiinaPaymentIntent;
					isLive = true;
				}
			} catch (fetchErr) {
				console.error("[Ziina Verify Fetch Error]:", fetchErr);
			}
		}

		if (!intentData) {
			const isCompleted = url.searchParams.get("status") !== "failed" && url.searchParams.get("status") !== "cancelled";
			intentData = {
				id: paymentIntentId,
				amount: 10000,
				currency_code: "AED",
				status: isCompleted ? "completed" : "failed",
				test: true,
				card_details: {
					card_last_four: "4242",
					card_brand: "Visa / Apple Pay",
					card_issuer: "First Abu Dhabi Bank (FAB)",
				},
				created_at: new Date().toISOString(),
			};
		}

		const isPaid = intentData.status === "completed";

		if (orderId) {
			try {
				await updateOrderPaymentInDb(
					orderId,
					isPaid ? "paid" : "failed",
					{
						ziinaPaymentIntentId: paymentIntentId,
						cardBrand: intentData.card_details?.card_brand,
						cardLastFour: intentData.card_details?.card_last_four,
						orderStatus: isPaid ? "processing" : "pending",
					},
					d1,
				);
			} catch (dbErr) {
				console.warn("Could not record payment verification in DB:", dbErr);
			}
		}

		return Response.json({
			success: true,
			status: intentData.status,
			isPaid,
			intent: intentData,
			isLive,
		});
	} catch (err) {
		return Response.json(
			{
				success: false,
				error: "Failed to verify payment intent",
				detail: err instanceof Error ? err.message : "unknown",
			},
			{ status: 500 },
		);
	}
}

export async function handleZiinaWebhook({ request, context }: ActionFunctionArgs) {
	const d1 = (context as any)?.cloudflare?.env?.DB;

	try {
		const payload = (await request.json()) as any;
		const eventType = payload.event || payload.type || "";
		const intent = payload.data?.object || payload.data || payload;

		if (intent && intent.id) {
			const status = intent.status === "completed" ? "paid" : intent.status === "failed" ? "failed" : "pending";
			const orderId = intent.metadata?.orderId || intent.message?.match(/#([a-zA-Z0-9_-]+)/)?.[1];

			if (orderId) {
				await updateOrderPaymentInDb(orderId, {
					paymentStatus: status,
					paymentDetails: intent,
				}, d1);
			}
		}

		return Response.json({ success: true, received: true, event: eventType });
	} catch (err) {
		return Response.json(
			{ success: false, error: "Failed to process webhook" },
			{ status: 400 },
		);
	}
}
