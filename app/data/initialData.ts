import type { Product, Order, StoreSettings, MetaMarketingApiConfig, MetaCampaign, MarketingLead, McpServersConfig } from "../types/store";
import productsJson from "../frontend/locales/products.json";
import initialDataJson from "../frontend/locales/initialData.json";

export const INITIAL_PRODUCTS: Product[] = productsJson as unknown as Product[];
export const INITIAL_ORDERS: Order[] = initialDataJson.orders as unknown as Order[];
export const INITIAL_SETTINGS: StoreSettings = initialDataJson.settings as unknown as StoreSettings;
export const INITIAL_META_CONFIG: MetaMarketingApiConfig = initialDataJson.metaConfig as unknown as MetaMarketingApiConfig;
export const INITIAL_META_CAMPAIGNS: MetaCampaign[] = initialDataJson.metaCampaigns as unknown as MetaCampaign[];
export const INITIAL_LEADS: MarketingLead[] = initialDataJson.leads as unknown as MarketingLead[];
export const DEFAULT_MCP_CONFIG: McpServersConfig = initialDataJson.mcpConfig as unknown as McpServersConfig;
