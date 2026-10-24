import type { ActionFunctionArgs } from "react-router";
import { updateOrderPaymentInDb } from "../db/ordersDb";
import type { ZiinaPaymentIntent, ZiinaCreateIntentPayload } from "../types/ziina";

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";

export async function action({ request, context }: ActionFunctionArgs) {
	const d1 = (context as any)?.cloudflare?.env?.DB;

	try {
		const body = (await request.json()) as {
			orderId: string;
			orderNumber?: string;
			amount: number; // in AED (e.g. 150)
			currency?: string; // "AED"
			customerName?: string;
			customerPhone?: string;
			customerEmail?: string;
			apiToken?: string;
			testMode?: boolean;
		};

		const { orderId, orderNumber, amount } = body;
		if (!orderId || !amount || amount <= 0) {
			return Response.json(
				{ success: false, error: "معرف الطلب والمبلغ مطلوبان لإنشاء جلسة دفع Ziina" },
				{ status: 400 },
			);
		}

		const currency = body.currency || "AED";
		// Ziina requires amount in base/minor unit: fils for AED (1 AED = 100 fils). Minimum is 200 fils (2 AED)
		const amountInFils = Math.round(amount * 100);

		// Resolve API Token and Test Mode from request or environment variables
		const token = (body.apiToken || process.env.ZIINA_API_TOKEN || "").trim();
		const isTestMode = body.testMode ?? (process.env.ZIINA_TEST_MODE !== "false");

		const urlObj = new URL(request.url);
		const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

		const successUrl = `${baseUrl}/payment/callback?status=success&orderId=${encodeURIComponent(orderId)}&payment_intent_id={PAYMENT_INTENT_ID}`;
		const cancelUrl = `${baseUrl}/payment/callback?status=cancelled&orderId=${encodeURIComponent(orderId)}&payment_intent_id={PAYMENT_INTENT_ID}`;
		const failureUrl = `${baseUrl}/payment/callback?status=failed&orderId=${encodeURIComponent(orderId)}&payment_intent_id={PAYMENT_INTENT_ID}`;

		const payload: ZiinaCreateIntentPayload = {
			amount: amountInFils,
			currency_code: currency,
			message: `طلب من متجر خيرات الدار #${orderNumber || orderId}`,
			success_url: successUrl,
			cancel_url: cancelUrl,
			failure_url: failureUrl,
			test: isTestMode,
			allow_tips: false,
		};

		let paymentIntent: ZiinaPaymentIntent | null = null;
		let isLiveGateway = false;

		// If real Ziina token is configured, call official Ziina API
		if (token && !token.startsWith("test_placeholder") && token.length > 10) {
			try {
				const ziinaRes = await fetch(`${ZIINA_API_BASE}/payment_intent`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(payload),
				});

				if (ziinaRes.ok) {
					paymentIntent = (await ziinaRes.json()) as ZiinaPaymentIntent;
					isLiveGateway = true;
				} else {
					const errorText = await ziinaRes.text();
					console.warn(`[Ziina API Error] HTTP ${ziinaRes.status}: ${errorText}`);
					// If error from live API, capture and return diagnostic or fallback
					return Response.json(
						{
							success: false,
							error: `خطأ من بوابة Ziina (${ziinaRes.status})`,
							detail: errorText,
						},
						{ status: ziinaRes.status },
					);
				}
			} catch (apiErr) {
				console.error("[Ziina API Fetch Exception]:", apiErr);
			}
		}

		// Interactive Sandbox / Simulation Fallback if API token is pending configuration
		if (!paymentIntent) {
			const simulatedIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
			// Build a friendly test checkout callback redirect
			const simulatedRedirectUrl = `${baseUrl}/payment/callback?status=success&orderId=${encodeURIComponent(orderId)}&payment_intent_id=${simulatedIntentId}&simulated=true`;

			paymentIntent = {
				id: simulatedIntentId,
				amount: amountInFils,
				currency_code: currency,
				status: "requires_payment_instrument",
				redirect_url: simulatedRedirectUrl,
				test: true,
				message: payload.message,
				created_at: new Date().toISOString(),
			};
		}

		// Update order in database with pending Ziina status and intent ID
		if (paymentIntent.id) {
			await updateOrderPaymentInDb(
				orderId,
				"pending",
				{
					ziinaPaymentIntentId: paymentIntent.id,
					orderStatus: "pending",
				},
				d1,
			);
		}

		return Response.json({
			success: true,
			isLiveGateway,
			testMode: isTestMode,
			paymentIntent,
			redirect_url: paymentIntent.redirect_url,
			payment_intent_id: paymentIntent.id,
			amountFils: amountInFils,
			amountAED: amount,
			currency,
			message: isLiveGateway
				? "تم إنشاء جلسة الدفع بنجاح عبر بوابة Ziina الرسمية"
				: "تم إنشاء جلسة دفع تجريبية (Sandbox) بنجاح - بانتظار إدخال مفتاح Ziina للإنتاج",
		});
	} catch (error) {
		console.error("Error creating Ziina payment intent:", error);
		return Response.json(
			{
				success: false,
				error: "فشل إنشاء جلسة دفع Ziina",
				detail: error instanceof Error ? error.message : "unknown",
			},
			{ status: 500 },
		);
	}
}
