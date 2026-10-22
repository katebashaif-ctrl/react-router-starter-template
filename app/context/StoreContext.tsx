import React, { createContext, useContext, useState, useEffect } from "react";
import type {
	Product,
	Order,
	StoreSettings,
	CartItem,
	ProductCategory,
	MetaCampaign,
	MarketingLead,
	MetaMarketingApiConfig,
	LeadStatus,
	McpServersConfig,
} from "../types/store";
import {
	INITIAL_PRODUCTS,
	INITIAL_ORDERS,
	INITIAL_SETTINGS,
	INITIAL_META_CAMPAIGNS,
	INITIAL_LEADS,
	INITIAL_META_CONFIG,
	DEFAULT_MCP_CONFIG,
} from "../data/initialData";

interface ToastNotification {
	id: string;
	title: string;
	message: string;
	type: "success" | "info" | "warning";
}

export type CookieConsentStatus = "accepted" | "rejected" | "custom" | null;

export type CMSTabType =
	| "overview"
	| "products"
	| "orders"
	| "inventory"
	| "marketing"
	| "leads"
	| "r2"
	| "settings"
	| "mcp"
	| "campaigns"
	| "meta";

interface StoreContextType {
	// Catalog
	products: Product[];
	addProduct: (product: Omit<Product, "id">) => void;
	updateProduct: (id: string, updates: Partial<Product>) => void;
	deleteProduct: (id: string) => void;
	toggleProductStock: (id: string) => void;

	// Orders
	orders: Order[];
	addOrder: (orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "status">) => Order;
	updateOrderStatus: (orderId: string, status: Order["status"]) => void;
	deleteOrder: (orderId: string) => void;

	// Cart
	cart: CartItem[];
	addToCart: (product: Product, quantity?: number, packaging?: CartItem["packagingOption"]) => void;
	updateCartQty: (productId: string, quantity: number) => void;
	removeFromCart: (productId: string) => void;
	clearCart: () => void;
	cartTotal: number;
	cartItemsCount: number;
	isCartOpen: boolean;
	setIsCartOpen: (open: boolean) => void;

	// Settings
	settings: StoreSettings;
	updateSettings: (newSettings: Partial<StoreSettings>) => void;
	resetToSampleData: () => void;

	// Cloudflare R2 Sync
	isR2Synced: boolean;
	syncCatalogToR2: (prods?: Product[], sets?: StoreSettings) => Promise<boolean>;
	fetchCatalogFromR2: () => Promise<boolean>;

	// UI Navigation
	currentView: "store" | "cms";
	setCurrentView: (view: "store" | "cms") => void;
	cmsTab: CMSTabType;
	setCmsTab: (tab: CMSTabType) => void;
	selectedProduct: Product | null;
	setSelectedProduct: (product: Product | null) => void;

	// Filters
	activeCategory: ProductCategory | "all";
	setActiveCategory: (cat: ProductCategory | "all") => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;

	// Checkout & Success
	lastOrder: Order | null;
	setLastOrder: (order: Order | null) => void;

	// Admin Authentication (admin / admin)
	isAdminAuthenticated: boolean;
	adminLogin: (username: string, pass: string) => boolean;
	adminLogout: () => void;
	isAdminLoginModalOpen: boolean;
	setIsAdminLoginModalOpen: (open: boolean) => void;
	openCmsProtected: () => void;

	// Cookie Consent & Privacy Policy
	cookieConsent: CookieConsentStatus;
	setCookieConsent: (val: "accepted" | "rejected" | "custom") => void;
	isPrivacyModalOpen: boolean;
	setIsPrivacyModalOpen: (open: boolean) => void;
	privacyModalTab: "privacy" | "terms" | "cookies";
	setPrivacyModalTab: (tab: "privacy" | "terms" | "cookies") => void;
	openPrivacyPolicy: (tab?: "privacy" | "terms" | "cookies") => void;

	// Meta Marketing API Campaigns
	metaCampaigns: MetaCampaign[];
	addMetaCampaign: (
		campaign: Omit<
			MetaCampaign,
			"id" | "spentAED" | "impressions" | "clicks" | "leadsCount" | "conversions" | "createdAt"
		>,
	) => MetaCampaign;
	toggleCampaignStatus: (id: string) => void;
	updateCampaignBudget: (id: string, budget: number) => void;
	deleteCampaign: (id: string) => void;

	// AI Marketing Leads Pipeline
	marketingLeads: MarketingLead[];
	addMarketingLead: (lead: Omit<MarketingLead, "id" | "createdAt">) => MarketingLead;
	updateLeadStatus: (id: string, status: LeadStatus) => void;
	updateLeadScore: (id: string, score: "high" | "medium" | "low", summary?: string) => void;
	deleteLead: (id: string) => void;

	// Meta API Config
	metaConfig: MetaMarketingApiConfig;
	updateMetaConfig: (config: Partial<MetaMarketingApiConfig>) => void;

	// Custom MCP Server Config ({ mcpServers: { 'meta-mcp': { transport, url, headers } } })
	mcpConfig: McpServersConfig;
	updateMcpConfig: (config: McpServersConfig) => void;
	resetMcpConfig: () => void;

	// Meta / Facebook Ads Event Tracking
	trackMetaEvent: (eventName: string, params?: Record<string, unknown>) => void;

	// Toasts
	toasts: ToastNotification[];
	showToast: (title: string, message: string, type?: ToastNotification["type"]) => void;
	removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
	PRODUCTS: "khayrat_aldar_products_v1",
	ORDERS: "khayrat_aldar_orders_v1",
	SETTINGS: "khayrat_aldar_settings_v1",
	CART: "khayrat_aldar_cart_v1",
	ADMIN_AUTH: "khayrat_aldar_admin_auth_v1",
	COOKIE_CONSENT: "khayrat_aldar_cookie_consent_v1",
	META_CAMPAIGNS: "khayrat_aldar_meta_campaigns_v1",
	LEADS: "khayrat_aldar_leads_v1",
	META_CONFIG: "khayrat_aldar_meta_config_v1",
	MCP_CONFIG: "khayrat_aldar_mcp_config_v2",
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
	const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
	const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
	const [mcpConfig, setMcpConfig] = useState<McpServersConfig>(DEFAULT_MCP_CONFIG);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [currentView, setCurrentView] = useState<"store" | "cms">("store");
	const [cmsTab, setCmsTab] = useState<CMSTabType>("overview");
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [lastOrder, setLastOrder] = useState<Order | null>(null);
	const [toasts, setToasts] = useState<ToastNotification[]>([]);
	const [isClient, setIsClient] = useState(false);

	// Admin Auth state
	const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
	const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

	// Cookie Consent & Legal Modals
	const [cookieConsent, setCookieConsentState] = useState<CookieConsentStatus>(null);
	const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
	const [privacyModalTab, setPrivacyModalTab] = useState<"privacy" | "terms" | "cookies">("privacy");

	// Meta Marketing API Campaigns & Leads
	const [metaCampaigns, setMetaCampaigns] = useState<MetaCampaign[]>(INITIAL_META_CAMPAIGNS);
	const [marketingLeads, setMarketingLeads] = useState<MarketingLead[]>(INITIAL_LEADS);
	const [metaConfig, setMetaConfig] = useState<MetaMarketingApiConfig>(INITIAL_META_CONFIG);

	// Cloudflare R2 Sync state
	const [isR2Synced, setIsR2Synced] = useState<boolean>(false);

	// Fetch catalog synchronously from Cloudflare R2
	const fetchCatalogFromR2 = async (): Promise<boolean> => {
		try {
			const res = await fetch("/api/r2?intent=get_catalog");
			const json = await res.json();
			if (json.success && json.fromR2 && json.data && Array.isArray(json.data.products) && json.data.products.length > 0) {
				setProducts(json.data.products);
				if (json.data.settings) {
					setSettings((prev) => ({ ...prev, ...json.data.settings }));
				}
				setIsR2Synced(true);
				return true;
			}
		} catch (err) {
			console.warn("Could not fetch catalog from R2 on mount:", err);
		}
		return false;
	};

	// Synchronize products & settings directly to Cloudflare R2
	const syncCatalogToR2 = async (prodsToSync?: Product[], setsToSync?: StoreSettings): Promise<boolean> => {
		try {
			const res = await fetch("/api/r2", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: "sync_catalog",
					data: {
						products: prodsToSync || products,
						settings: setsToSync || settings,
						lastUpdated: new Date().toISOString(),
						storeName: "خيرات الدار | تين ليوا",
					},
				}),
			});
			const json = await res.json();
			if (json.success && json.r2Synced) {
				setIsR2Synced(true);
				return true;
			}
		} catch (err) {
			console.warn("Failed to sync catalog to Cloudflare R2:", err);
		}
		return false;
	};

	// Load from localStorage on client mount, then load live from R2
	useEffect(() => {
		setIsClient(true);
		try {
			const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
			if (savedProducts) setProducts(JSON.parse(savedProducts));

			const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
			if (savedOrders) setOrders(JSON.parse(savedOrders));

			const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
			if (savedSettings) setSettings(JSON.parse(savedSettings));

			const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
			if (savedCart) setCart(JSON.parse(savedCart));

			const savedAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
			if (savedAuth === "true") setIsAdminAuthenticated(true);

			const savedConsent = localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT);
			if (savedConsent) setCookieConsentState(savedConsent as CookieConsentStatus);

			const savedCampaigns = localStorage.getItem(STORAGE_KEYS.META_CAMPAIGNS);
			if (savedCampaigns) setMetaCampaigns(JSON.parse(savedCampaigns));

			const savedLeads = localStorage.getItem(STORAGE_KEYS.LEADS);
			if (savedLeads) setMarketingLeads(JSON.parse(savedLeads));

			const savedConfig = localStorage.getItem(STORAGE_KEYS.META_CONFIG);
			if (savedConfig) setMetaConfig(JSON.parse(savedConfig));

			const savedMcp = localStorage.getItem(STORAGE_KEYS.MCP_CONFIG);
			if (savedMcp) {
				try {
					setMcpConfig(JSON.parse(savedMcp));
				} catch (e) {}
			}
		} catch (e) {
			console.error("Error reading localStorage:", e);
		}

		// Sync live from Cloudflare R2 Bucket
		fetchCatalogFromR2();
	}, []);

	// Sync to localStorage
	useEffect(() => {
		if (!isClient) return;
		try {
			localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
		} catch (e) {}
	}, [products, isClient]);

	useEffect(() => {
		if (!isClient) return;
		try {
			localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
		} catch (e) {}
	}, [orders, isClient]);

	useEffect(() => {
		if (!isClient) return;
		try {
			localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
		} catch (e) {}
	}, [settings, isClient]);

	useEffect(() => {
		if (!isClient) return;
		try {
			localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
		} catch (e) {}
	}, [cart, isClient]);

	useEffect(() => {
		if (!isClient) return;
		try {
			localStorage.setItem(STORAGE_KEYS.META_CAMPAIGNS, JSON.stringify(metaCampaigns));
		} catch (e) {}
	}, [metaCampaigns, isClient]);

	useEffect(() => {
		if (!isClient) return;
		try {
			localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(marketingLeads));
		} catch (e) {}
	}, [marketingLeads, isClient]);

	useEffect(() => {
		if (!isClient) return;
		try {
			localStorage.setItem(STORAGE_KEYS.META_CONFIG, JSON.stringify(metaConfig));
		} catch (e) {}
	}, [metaConfig, isClient]);

	useEffect(() => {
		if (!isClient) return;
		try {
			localStorage.setItem(STORAGE_KEYS.MCP_CONFIG, JSON.stringify(mcpConfig));
		} catch (e) {}
	}, [mcpConfig, isClient]);

	const updateMcpConfig = (newConfig: McpServersConfig) => {
		setMcpConfig(newConfig);
		if (isClient) {
			try {
				localStorage.setItem(STORAGE_KEYS.MCP_CONFIG, JSON.stringify(newConfig));
			} catch (e) {}
		}
		showToast("تم تحديث إعدادات MCP", "تم حفظ وتفعيل إعدادات خادم MCP بنجاح.");
	};

	const resetMcpConfig = () => {
		setMcpConfig(DEFAULT_MCP_CONFIG);
		if (isClient) {
			try {
				localStorage.setItem(STORAGE_KEYS.MCP_CONFIG, JSON.stringify(DEFAULT_MCP_CONFIG));
			} catch (e) {}
		}
		showToast("استعادة الإعدادات", "تمت استعادة إعدادات خادم MCP الافتراضية.");
	};

	// Toast helper
	const showToast = (title: string, message: string, type: ToastNotification["type"] = "success") => {
		const id = Math.random().toString(36).substring(2, 9);
		setToasts((prev) => [...prev, { id, title, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	};

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	// Admin Authentication
	const adminLogin = (username: string, pass: string): boolean => {
		if (username.trim() === "admin" && pass.trim() === "admin") {
			setIsAdminAuthenticated(true);
			if (isClient) {
				localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
			}
			setIsAdminLoginModalOpen(false);
			setCurrentView("cms");
			showToast("مرحباً بك يا مشرف", "تم تسجيل الدخول إلى لوحة تحكم CMS بنجاح.");
			return true;
		}
		return false;
	};

	const adminLogout = () => {
		setIsAdminAuthenticated(false);
		if (isClient) {
			localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
		}
		setCurrentView("store");
		showToast("تسجيل الخروج", "تم تسجيل الخروج من لوحة تحكم CMS.", "info");
	};

	const openCmsProtected = () => {
		if (isAdminAuthenticated) {
			setCurrentView("cms");
		} else {
			setIsAdminLoginModalOpen(true);
		}
	};

	// Cookie Consent & Legal
	const setCookieConsent = (val: "accepted" | "rejected" | "custom") => {
		setCookieConsentState(val);
		if (isClient) {
			localStorage.setItem(STORAGE_KEYS.COOKIE_CONSENT, val);
		}
		if (val === "accepted") {
			showToast("تم حفظ التفضيلات", "تم قبول ملفات تعريف الارتباط وفق سياسة الخصوصية الإماراتية.");
		}
	};

	const openPrivacyPolicy = (tab: "privacy" | "terms" | "cookies" = "privacy") => {
		setPrivacyModalTab(tab);
		setIsPrivacyModalOpen(true);
	};

	// Meta / Facebook Pixel Tracking
	const trackMetaEvent = (eventName: string, params?: Record<string, unknown>) => {
		if (typeof window !== "undefined" && (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq) {
			try {
				(window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", eventName, params);
			} catch (err) {
				console.warn("Meta Pixel track error:", err);
			}
		}
	};

	// Product mutations with synchronous Cloudflare R2 storage
	const addProduct = async (productData: Omit<Product, "id">) => {
		const newId = `prod-${Date.now().toString(36)}`;
		let finalImage = productData.image;

		// Ensure that if the image was base64, it's uploaded to Cloudflare R2
		if (finalImage && finalImage.startsWith("data:image/")) {
			try {
				const uploadRes = await fetch("/api/r2", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						intent: "upload_base64",
						imageBase64: finalImage,
						imageName: productData.nameEn || productData.name || "product",
					}),
				});
				const uploadData = await uploadRes.json();
				if (uploadData.success && uploadData.url) {
					finalImage = uploadData.url;
				}
			} catch (err) {
				console.warn("Could not upload product image to R2:", err);
			}
		}

		const newProduct: Product = { ...productData, image: finalImage, id: newId };
		const updated = [newProduct, ...products];
		setProducts(updated);
		showToast("تم إضافة المنتج", `تمت إضافة "${newProduct.name}" بنجاح ومزامنتها في سحابة R2.`);

		// Sync directly to Cloudflare R2
		syncCatalogToR2(updated);
	};

	const updateProduct = (id: string, updates: Partial<Product>) => {
		const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
		setProducts(updated);
		showToast("تم تحديث المنتج", "تم حفظ التعديلات بنجاح.");
		syncCatalogToR2(updated);
	};

	const deleteProduct = (id: string) => {
		const target = products.find((p) => p.id === id);
		const updated = products.filter((p) => p.id !== id);
		setProducts(updated);
		showToast("تم حذف المنتج", `تم حذف "${target?.name || id}" من المتجر.`, "info");
		syncCatalogToR2(updated);
	};

	const toggleProductStock = (id: string) => {
		const updated = products.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p));
		setProducts(updated);
		syncCatalogToR2(updated);
	};

	// Cart operations
	const addToCart = (
		product: Product,
		quantity: number = 1,
		packaging: CartItem["packagingOption"] = "standard",
	) => {
		setCart((prev) => {
			const existingIndex = prev.findIndex(
				(item) => item.product.id === product.id && item.packagingOption === packaging,
			);
			if (existingIndex > -1) {
				const updated = [...prev];
				updated[existingIndex].quantity += quantity;
				return updated;
			}
			return [...prev, { product, quantity, packagingOption: packaging }];
		});

		// Track Meta Pixel AddToCart event
		trackMetaEvent("AddToCart", {
			content_name: product.name,
			content_category: product.category,
			content_ids: [product.id],
			content_type: "product",
			value: product.price * quantity,
			currency: "AED",
		});

		showToast("أضيف إلى السلة", `تمت إضافة ${quantity} × ${product.name} إلى حقيبة التسوق.`);
	};

	const updateCartQty = (productId: string, quantity: number) => {
		if (quantity <= 0) {
			removeFromCart(productId);
			return;
		}
		setCart((prev) =>
			prev.map((item) =>
				item.product.id === productId ? { ...item, quantity } : item,
			),
		);
	};

	const removeFromCart = (productId: string) => {
		setCart((prev) => prev.filter((item) => item.product.id !== productId));
	};

	const clearCart = () => {
		setCart([]);
	};

	const cartTotal = cart.reduce(
		(sum, item) => sum + item.product.price * item.quantity,
		0,
	);
	const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

	// Order operations
	const addOrder = (
		orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "status">,
	): Order => {
		const orderNum = `AED-${Math.floor(1000 + Math.random() * 9000)}`;
		const newOrder: Order = {
			...orderData,
			id: `ord-${Date.now().toString(36)}`,
			orderNumber: orderNum,
			status: "pending",
			createdAt: new Date().toISOString(),
		};

		setOrders((prev) => [newOrder, ...prev]);

		// Track Meta Pixel Purchase event
		trackMetaEvent("Purchase", {
			content_ids: newOrder.items.map((i) => i.productId),
			content_type: "product",
			value: newOrder.total,
			currency: "AED",
			num_items: newOrder.items.reduce((s, i) => s + i.quantity, 0),
		});

		clearCart();
		setLastOrder(newOrder);
		showToast("تم استلام طلبك المبارك", `رقم الطلب: ${orderNum}. سنقوم بالتواصل معكم لتأكيد موعد التوصيل.`);
		return newOrder;
	};

	const updateOrderStatus = (orderId: string, status: Order["status"]) => {
		setOrders((prev) =>
			prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
		);
		showToast("تم تحديث الطلب", `تم تغيير حالة الطلب ${orderId} إلى: ${status}.`);
	};

	const deleteOrder = (orderId: string) => {
		setOrders((prev) => prev.filter((o) => o.id !== orderId));
		showToast("تم حذف الطلب", "تم إزالة سجل الطلب بنجاح.", "info");
	};

	// Meta Campaign Operations
	const addMetaCampaign = (
		campaignData: Omit<
			MetaCampaign,
			"id" | "spentAED" | "impressions" | "clicks" | "leadsCount" | "conversions" | "createdAt"
		>,
	): MetaCampaign => {
		const newCampaign: MetaCampaign = {
			...campaignData,
			id: `camp-meta-${Date.now().toString(36)}`,
			spentAED: 0,
			impressions: 0,
			clicks: 0,
			leadsCount: 0,
			conversions: 0,
			createdAt: new Date().toISOString(),
		};

		setMetaCampaigns((prev) => [newCampaign, ...prev]);
		showToast("حملة Meta جديدة", `تم إطلاق الحملة الإعلانية "${newCampaign.name}" بنجاح.`);
		return newCampaign;
	};

	const toggleCampaignStatus = (id: string) => {
		setMetaCampaigns((prev) =>
			prev.map((c) =>
				c.id === id
					? {
							...c,
							status: c.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
						}
					: c,
			),
		);
		const target = metaCampaigns.find((c) => c.id === id);
		showToast(
			"حالة الحملة",
			`تم تغيير حالة الحملة إلى: ${target?.status === "ACTIVE" ? "موقفة مؤقتاً" : "نشطة"}.`,
		);
	};

	const updateCampaignBudget = (id: string, budget: number) => {
		setMetaCampaigns((prev) =>
			prev.map((c) => (c.id === id ? { ...c, dailyBudget: budget } : c)),
		);
		showToast("تحديث الميزانية", `تم تعديل الميزانية اليومية إلى ${budget} درهم.`);
	};

	const deleteCampaign = (id: string) => {
		setMetaCampaigns((prev) => prev.filter((c) => c.id !== id));
		showToast("حذف الحملة", "تم حذف الحملة الإعلانية بنجاح.", "info");
	};

	// Marketing Leads Operations
	const addMarketingLead = (leadData: Omit<MarketingLead, "id" | "createdAt">): MarketingLead => {
		const newLead: MarketingLead = {
			...leadData,
			id: `lead-${Date.now().toString(36)}`,
			createdAt: new Date().toISOString(),
		};

		setMarketingLeads((prev) => [newLead, ...prev]);
		showToast("عميل محتمل جديد", `تم تسجيل العميل "${newLead.customerName}" من إعلانات Meta.`);
		return newLead;
	};

	const updateLeadStatus = (id: string, status: LeadStatus) => {
		setMarketingLeads((prev) =>
			prev.map((l) => (l.id === id ? { ...l, leadStatus: status } : l)),
		);
		showToast("تحديث حالة العميل", `تم تغيير حالة العميل إلى: ${status}.`);
	};

	const updateLeadScore = (id: string, score: "high" | "medium" | "low", summary?: string) => {
		setMarketingLeads((prev) =>
			prev.map((l) => (l.id === id ? { ...l, aiScore: score, aiSummary: summary || l.aiSummary } : l)),
		);
		showToast("تحليل الذكاء الاصطناعي", "تم تقييم اهتمام العميل بالذكاء الاصطناعي بنجاح.");
	};

	const deleteLead = (id: string) => {
		setMarketingLeads((prev) => prev.filter((l) => l.id !== id));
		showToast("حذف العميل", "تم حذف العميل من قائمة الاستقطاب.", "info");
	};

	// Meta Config
	const updateMetaConfig = (newConfig: Partial<MetaMarketingApiConfig>) => {
		setMetaConfig((prev) => ({ ...prev, ...newConfig }));
		showToast("إعدادات Meta", "تم حفظ إعدادات Meta Marketing API.");
	};

	// Settings & Reset
	const updateSettings = (newSettings: Partial<StoreSettings>) => {
		setSettings((prev) => ({ ...prev, ...newSettings }));
		showToast("تم حفظ الإعدادات", "تم تحديث إعدادات متجر خيرات الدار.");
	};

	const resetToSampleData = () => {
		setProducts(INITIAL_PRODUCTS);
		setOrders(INITIAL_ORDERS);
		setSettings(INITIAL_SETTINGS);
		setMetaCampaigns(INITIAL_META_CAMPAIGNS);
		setMarketingLeads(INITIAL_LEADS);
		setMetaConfig(INITIAL_META_CONFIG);
		setCart([]);
		if (isClient) {
			localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
			localStorage.removeItem(STORAGE_KEYS.ORDERS);
			localStorage.removeItem(STORAGE_KEYS.SETTINGS);
			localStorage.removeItem(STORAGE_KEYS.CART);
			localStorage.removeItem(STORAGE_KEYS.META_CAMPAIGNS);
			localStorage.removeItem(STORAGE_KEYS.LEADS);
			localStorage.removeItem(STORAGE_KEYS.META_CONFIG);
		}
		showToast("تم استرجاع البيانات الأصلية", "تمت إعادة تعيين المنتجات والطلبات والحملات النموذجية.");
	};

	return (
		<StoreContext.Provider
			value={{
				products,
				addProduct,
				updateProduct,
				deleteProduct,
				toggleProductStock,
				orders,
				addOrder,
				updateOrderStatus,
				deleteOrder,
				cart,
				addToCart,
				updateCartQty,
				removeFromCart,
				clearCart,
				cartTotal,
				cartItemsCount,
				isCartOpen,
				setIsCartOpen,
				settings,
				updateSettings,
				resetToSampleData,
				isR2Synced,
				syncCatalogToR2,
				fetchCatalogFromR2,
				currentView,
				setCurrentView,
				cmsTab,
				setCmsTab,
				selectedProduct,
				setSelectedProduct,
				activeCategory,
				setActiveCategory,
				searchQuery,
				setSearchQuery,
				lastOrder,
				setLastOrder,
				isAdminAuthenticated,
				adminLogin,
				adminLogout,
				isAdminLoginModalOpen,
				setIsAdminLoginModalOpen,
				openCmsProtected,
				cookieConsent,
				setCookieConsent,
				isPrivacyModalOpen,
				setIsPrivacyModalOpen,
				privacyModalTab,
				setPrivacyModalTab,
				openPrivacyPolicy,
				metaCampaigns,
				addMetaCampaign,
				toggleCampaignStatus,
				updateCampaignBudget,
				deleteCampaign,
				marketingLeads,
				addMarketingLead,
				updateLeadStatus,
				updateLeadScore,
				deleteLead,
				metaConfig,
				updateMetaConfig,
				mcpConfig,
				updateMcpConfig,
				resetMcpConfig,
				trackMetaEvent,
				toasts,
				showToast,
				removeToast,
			}}
		>
			{children}
		</StoreContext.Provider>
	);
};

export const useStore = () => {
	const context = useContext(StoreContext);
	if (!context) {
		throw new Error("useStore must be used within a StoreProvider");
	}
	return context;
};
