export interface ZiinaPaymentIntent {
	id: string;
	account_id?: string;
	amount: number; // In minor currency units (fils: 100 AED = 10000)
	currency_code: string; // "AED"
	status:
		| "requires_payment_instrument"
		| "pending"
		| "requires_user_action"
		| "completed"
		| "failed"
		| "cancelled";
	redirect_url?: string;
	embedded_url?: string;
	message?: string;
	test?: boolean;
	expiry?: string;
	allow_tips?: boolean;
	created_at?: string;
	operation_id?: string;
	settled?: {
		amount: number;
		tip_amount: number;
		vat_amount: number;
		currency_code: string;
	};
	card_details?: {
		card_last_four?: string;
		card_brand?: string;
		card_funding_type?: string;
		card_category?: string;
		card_bin?: string;
		card_issuer?: string;
		card_country_code?: string;
		card_sub_brand?: string;
	};
}

export interface ZiinaCreateIntentPayload {
	amount: number; // in fils (integer)
	currency_code: string; // "AED"
	message?: string;
	success_url: string;
	cancel_url: string;
	failure_url?: string;
	test?: boolean;
	allow_tips?: boolean;
}

export interface ZiinaWebhookPayload {
	event: "payment_intent.status.updated" | string;
	data: ZiinaPaymentIntent;
}

export interface ZiinaGatewayConfig {
	apiToken: string;
	testMode: boolean;
	enabled: boolean;
	webhookSecret?: string;
}
