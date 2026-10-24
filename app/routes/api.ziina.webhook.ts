import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { updateOrderPaymentInDb } from "../db/ordersDb";
import type { ZiinaWebhookPayload } from "../types/ziina";

// GET /api/ziina/webhook - Helpful status / test ping
export async function loader({ request }: LoaderFunctionArgs) {
	return Response.json({
		status: "active",
		service: "Khayrat Al Dar Ziina Payment Webhook Handler",
		endpoint: "/api/ziina/webhook",
		eventSupported: "payment_intent.status.updated",
		configuredWebhookSecret: Boolean(process.env.ZIINA_WEBHOOK_SECRET),
	});
}

// POST /api/ziina/webhook - Receives webhook events from Ziina
export async function action({ request, context }: ActionFunctionArgs) {
	const d1 = (context as any)?.cloudflare?.env?.DB;

	try {
		const payload = (await request.json()) as ZiinaWebhookPayload;

		console.log(`[Ziina Webhook Received] Event: ${payload?.event}, Intent ID: ${payload?.data?.id}, Status: ${payload?.data?.status}`);

		if (payload && payload.event === "payment_intent.status.updated" && payload.data) {
			const intent = payload.data;
			const intentId = intent.id;
			const status = intent.status;

			// If completed, find corresponding order and update to paid
			if (status === "completed") {
				await updateOrderPaymentInDb(
					intentId,
					"paid",
					{
						ziinaPaymentIntentId: intentId,
						transactionId: intent.operation_id || intentId,
						cardBrand: intent.card_details?.card_brand || "Apple Pay / Card",
						cardLastFour: intent.card_details?.card_last_four || "••••",
						orderStatus: "processing",
					},
					d1,
				);
			} else if (status === "failed" || status === "cancelled") {
				await updateOrderPaymentInDb(
					intentId,
					"failed",
					{
						ziinaPaymentIntentId: intentId,
						orderStatus: "cancelled",
					},
					d1,
				);
			}

			return Response.json({ status: "success", received: true, intentId, paymentStatus: status });
		}

		return Response.json({ status: "ignored", reason: "Unhandled event type" });
	} catch (error) {
		console.error("Error processing Ziina webhook:", error);
		return Response.json(
			{
				status: "error",
				message: error instanceof Error ? error.message : "Webhook processing failure",
			},
			{ status: 500 },
		);
	}
}
