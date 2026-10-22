import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("cms", "routes/cms.tsx"),
	route("admin", "routes/admin.tsx"),
	route("api/r2", "routes/api.r2.ts"),
	route("api/catalog/meta", "routes/api.catalog.meta.ts"),
	route("api/meta/campaigns", "routes/api.meta.campaigns.ts"),
	route("api/ai/marketing", "routes/api.ai.marketing.ts"),
	route("api/meta/mcp", "routes/api.meta.mcp.ts"),
	route("api/meta/webhook", "routes/api.meta.webhook.ts"),
	route("*", "routes/catchall.tsx"),
] satisfies RouteConfig;
