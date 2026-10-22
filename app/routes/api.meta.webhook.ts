import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { INITIAL_LEADS } from "../data/initialData";

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "khayrat_aldar_meta_verify_token_2026";

// GET /api/meta/webhook - Meta Webhook Verification
export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const mode = url.searchParams.get("hub.mode");
	const token = url.searchParams.get("hub.verify_token");
	const challenge = url.searchParams.get("hub.challenge");

	if (mode === "subscribe" && token === VERIFY_TOKEN) {
		return new Response(challenge, { status: 200 });
	}

	return new Response("Forbidden", { status: 403 });
}

// POST /api/meta/webhook - Receive Live Lead Ads Webhooks from Meta
export async function action({ request }: ActionFunctionArgs) {
	try {
		const payload = await request.json();

		// Handle Meta Lead Generation Webhook Event
		if (payload.object === "page") {
			const entries = payload.entry || [];
			for (const entry of entries) {
				const changes = entry.changes || [];
				for (const change of changes) {
					if (change.field === "leadgen") {
						const leadgenId = change.value?.leadgen_id;
						const formId = change.value?.form_id;
						const pageId = change.value?.page_id;
						console.log(`[Meta Lead Webhook Received] Leadgen ID: ${leadgenId}, Form ID: ${formId}, Page: ${pageId}`);
					}
				}
			}
			return Response.json({ status: "success", received: true });
		}

		return Response.json({ status: "ignored" });
	} catch (e) {
		return Response.json({ status: "error", message: e instanceof Error ? e.message : "Webhook error" }, { status: 500 });
	}
}
