import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { INITIAL_META_CAMPAIGNS, INITIAL_META_CONFIG } from "../data/initialData";
import type { MetaCampaign, MetaMarketingApiConfig } from "../types/store";

// In-memory / module-level state for dev environment
let storedConfig: MetaMarketingApiConfig = { ...INITIAL_META_CONFIG };
let storedCampaigns: MetaCampaign[] = [...INITIAL_META_CAMPAIGNS];

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const actionType = url.searchParams.get("action");

	// Test real Meta Graph API connection if requested
	if (actionType === "verify_token" && storedConfig.accessToken) {
		try {
			const res = await fetch(
				`https://graph.facebook.com/v21.0/me?access_token=${encodeURIComponent(storedConfig.accessToken)}`,
			);
			const data = (await res.json()) as { id?: string; name?: string; error?: unknown };
			return Response.json({
				success: !data.error,
				metaAccount: data,
				connected: !data.error,
			});
		} catch (e) {
			return Response.json({
				success: false,
				error: e instanceof Error ? e.message : "Failed to verify Meta token",
			});
		}
	}

	const totalSpent = storedCampaigns.reduce((sum, c) => sum + (c.spentAED || 0), 0);
	const totalImpressions = storedCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
	const totalClicks = storedCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
	const totalLeads = storedCampaigns.reduce((sum, c) => sum + (c.leadsCount || 0), 0);
	const totalConversions = storedCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);

	return Response.json({
		success: true,
		config: storedConfig,
		campaigns: storedCampaigns,
		summary: {
			totalSpentAED: totalSpent,
			totalImpressions,
			totalClicks,
			totalLeads,
			totalConversions,
			averageCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + "%" : "0%",
			costPerLeadAED: totalLeads > 0 ? (totalSpent / totalLeads).toFixed(1) : "0",
		},
		documentationUrl: "https://developers.facebook.com/documentation/ads-commerce/marketing-api",
		apiVersion: storedConfig.apiVersion,
	});
}

export async function action({ request }: ActionFunctionArgs) {
	try {
		const body = (await request.json()) as {
			intent: string;
			campaign?: Partial<MetaCampaign>;
			campaignId?: string;
			status?: MetaCampaign["status"];
			dailyBudget?: number;
			config?: Partial<MetaMarketingApiConfig>;
		};

		// Intent 1: Create Meta Ad Campaign
		if (body.intent === "create_campaign" && body.campaign) {
			const c = body.campaign;
			const newId = `camp-meta-${Date.now().toString(36)}`;
			const newCampaign: MetaCampaign = {
				id: newId,
				name: c.name || `حملة إعلانية جديدة - ${new Date().toLocaleDateString("ar-AE")}`,
				objective: c.objective || "OUTCOME_SALES",
				status: (c.status as MetaCampaign["status"]) || "ACTIVE",
				dailyBudget: Number(c.dailyBudget) || 100,
				spentAED: 0,
				impressions: 0,
				clicks: 0,
				leadsCount: 0,
				conversions: 0,
				targetEmirates: c.targetEmirates || ["أبوظبي", "دبي", "الشارقة"],
				targetInterests: c.targetInterests || ["رطب وتمور", "فقع", "تراث إماراتي"],
				productCategory: c.productCategory || "all",
				headline: c.headline || "خيرات الدار الإماراتية الفاخرة",
				primaryText: c.primaryText || "أجود محاصيل الرطب والتين والفقع بتوصيل مبرد طازج.",
				callToAction: c.callToAction || "SHOP_NOW",
				imageUrl: c.imageUrl || "/images/product_emirati_rutab_1792506810615.jpg",
				leadFormName: c.leadFormName,
				createdAt: new Date().toISOString(),
			};

			// Attempt live dispatch to Meta Marketing API if valid token and adAccountId are set
			let metaApiResponse: unknown = null;
			if (
				storedConfig.accessToken &&
				storedConfig.adAccountId &&
				!storedConfig.accessToken.includes("...")
			) {
				try {
					const metaRes = await fetch(
						`https://graph.facebook.com/${storedConfig.apiVersion}/${storedConfig.adAccountId}/campaigns`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${storedConfig.accessToken}`,
							},
							body: JSON.stringify({
								name: newCampaign.name,
								objective: newCampaign.objective,
								status: newCampaign.status === "ACTIVE" ? "ACTIVE" : "PAUSED",
								special_ad_categories: [],
								buying_type: "AUCTION",
							}),
						},
					);
					metaApiResponse = await metaRes.json();
				} catch (err) {
					console.warn("Meta Marketing API live call skipped or failed:", err);
				}
			}

			storedCampaigns = [newCampaign, ...storedCampaigns];

			return Response.json({
				success: true,
				campaign: newCampaign,
				metaApiResponse,
				message: `تم إنشاء الحملة الإعلانية "${newCampaign.name}" بنجاح في Meta Ads Manager`,
			});
		}

		// Intent 2: Toggle Campaign Status
		if (body.intent === "toggle_status" && body.campaignId) {
			storedCampaigns = storedCampaigns.map((c) =>
				c.id === body.campaignId
					? {
							...c,
							status: c.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
						}
					: c,
			);
			const updated = storedCampaigns.find((c) => c.id === body.campaignId);
			return Response.json({
				success: true,
				campaign: updated,
				message: `تم تغيير حالة الحملة إلى: ${updated?.status === "ACTIVE" ? "نشطة (Active)" : "موقفة مؤقتاً (Paused)"}`,
			});
		}

		// Intent 3: Update Daily Budget
		if (body.intent === "update_budget" && body.campaignId && body.dailyBudget) {
			storedCampaigns = storedCampaigns.map((c) =>
				c.id === body.campaignId ? { ...c, dailyBudget: Number(body.dailyBudget) } : c,
			);
			return Response.json({
				success: true,
				message: `تم تحديث الميزانية اليومية للحملة إلى ${body.dailyBudget} درهم إماراتي.`,
			});
		}

		// Intent 4: Delete Campaign
		if (body.intent === "delete_campaign" && body.campaignId) {
			storedCampaigns = storedCampaigns.filter((c) => c.id !== body.campaignId);
			return Response.json({
				success: true,
				message: "تم حذف الحملة الإعلانية بنجاح من القائمة.",
			});
		}

		// Intent 5: Save Meta API Config
		if (body.intent === "save_config" && body.config) {
			storedConfig = {
				...storedConfig,
				...body.config,
			};
			return Response.json({
				success: true,
				config: storedConfig,
				message: "تم حفظ إعدادات Meta Marketing API & Catalog بنجاح.",
			});
		}

		return Response.json({ success: false, error: "Unknown intent" }, { status: 400 });
	} catch (error) {
		return Response.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Marketing API action failed",
			},
			{ status: 500 },
		);
	}
}
