import React, { useState, useRef, useEffect } from "react";
import {
	Bot,
	Sparkles,
	Send,
	Trash2,
	CheckCircle2,
	Megaphone,
	Package,
	ShoppingCart,
	CreditCard,
	Sliders,
	ArrowRight,
	ExternalLink,
	RefreshCw,
	TrendingUp,
	Zap,
	ShieldCheck,
	Code2,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";

interface ExecutedAction {
	tool: string;
	args: Record<string, any>;
	result: any;
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	text: string;
	timestamp: string;
	actions?: ExecutedAction[];
	modelUsed?: string;
}

const QUICK_PROMPTS = [
	{
		label: "🚀 إطلاق حملة Meta Ads جديدة",
		prompt: "أنشئ لي حملة إعلانية جديدة على Meta لرطب خلاص ليوا بميزانية يومية 150 درهم تستهدف أبوظبي ودبي.",
		category: "ads",
	},
	{
		label: "📊 استعراض الحملات والميزانيات",
		prompt: "اعرض لي جميع حملات Meta الإعلانية الحالية وميزانياتها ونسب المشاهدات والنقر.",
		category: "ads",
	},
	{
		label: "🏷️ استعراض أسعار المحاصيل",
		prompt: "اعرض لي قائمة أسعار الرطب والتين والفقع المتوفرة في المتجر حالياً.",
		category: "store",
	},
	{
		label: "📦 فحص أحدث الطلبات والمبيعات",
		prompt: "أعطني ملخصاً لأحدث طلبات العملاء وحالة السداد عبر بوابة Ziina.",
		category: "orders",
	},
	{
		label: "💳 فحص بوابة الدفع Ziina",
		prompt: "افحص جاهزية بوابة دفع Ziina وتحصيلات البطاقات البنكية و Apple Pay.",
		category: "payment",
	},
	{
		label: "📢 تحديث إعلان شريط المتجر",
		prompt: "قم بتحديث شريط الإعلانات العلوي للمتجر إلى: 'موسم قطاف رطب ليوا وعين الفاخر نخب أول - شحن مبرد لجميع الإمارات'",
		category: "settings",
	},
];

export const StoreAiCopilot: React.FC = () => {
	const {
		products,
		orders,
		settings,
		metaCampaigns,
		fetchOrdersFromDatabase,
		showToast,
		setCmsTab,
	} = useStore();

	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: "welcome",
			role: "assistant",
			text: `يا مرحباً بك في غرفة تحكم "خيرات الدار" الذكية عبر بروتوكول MCP! 🌴\n\nأنا مساعدك الذكي المتصل مباشرة بأنظمة المتجر، قاعدة بيانات المحاصيل، حملات Meta Ads الإعلانية، وبوابة دفع Ziina.\n\nيمكنك أن تطلب مني باللغة العربية الطبيعية:\n• التحكم في حملات Meta الإعلانية (إطلاق حملة، زيادة الميزانية، إيقاف أو تشغيل).\n• تعديل أسعار المحاصيل وتحديث توفر المخزون.\n• مراجعة طلبات الضيافة وتعديل حالات الشحن والتسليم.\n• تحديث إعدادات ونصوص المتجر والشريط العلوي.`,
			timestamp: new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }),
		},
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [expandedActionIndex, setExpandedActionIndex] = useState<string | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	const handleSendMessage = async (textToSend?: string) => {
		const query = (textToSend || input).trim();
		if (!query || isLoading) return;

		const userMsgId = `user-${Date.now()}`;
		const userMsg: ChatMessage = {
			id: userMsgId,
			role: "user",
			text: query,
			timestamp: new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }),
		};

		setMessages((prev) => [...prev, userMsg]);
		if (!textToSend) setInput("");
		setIsLoading(true);

		try {
			const res = await fetch("/api/ai/agent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: query,
					history: messages.map((m) => ({
						role: m.role === "user" ? "user" : "model",
						text: m.text,
					})),
					clientContext: {
						products,
						campaigns: metaCampaigns,
						settings: [settings],
					},
				}),
			});

			const data = (await res.json()) as {
				success: boolean;
				reply?: string;
				executedActions?: ExecutedAction[];
				modelUsed?: string;
				error?: string;
			};

			if (data.success && data.reply) {
				const botMsg: ChatMessage = {
					id: `bot-${Date.now()}`,
					role: "assistant",
					text: data.reply,
					timestamp: new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }),
					actions: data.executedActions || [],
					modelUsed: data.modelUsed || "MCP Copilot",
				};
				setMessages((prev) => [...prev, botMsg]);

				// If actions modified orders or products, trigger background reload
				if (data.executedActions && data.executedActions.length > 0) {
					const hasOrderAction = data.executedActions.some((a) =>
						a.tool.includes("order"),
					);
					if (hasOrderAction && fetchOrdersFromDatabase) {
						fetchOrdersFromDatabase();
					}
					showToast("تم تنفيذ العملية بنجاح", "استجاب المساعد ونفذ أوامر MCP المباشرة", "success");
				}
			} else {
				setMessages((prev) => [
					...prev,
					{
						id: `bot-${Date.now()}`,
						role: "assistant",
						text: data.error || "عذراً، حدث خطأ أثناء الاتصال بخادم MCP. يرجى المحاولة مرة أخرى.",
						timestamp: new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }),
					},
				]);
			}
		} catch (err) {
			console.error("AI Copilot request failed:", err);
			setMessages((prev) => [
				...prev,
				{
					id: `bot-${Date.now()}`,
					role: "assistant",
					text: "تعذر الاتصال بـ API المساعد الذكي. تأكد من عمل خادم التطبيق.",
					timestamp: new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }),
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const clearChat = () => {
		setMessages([
			{
				id: "welcome-reset",
				role: "assistant",
				text: "تمت إعادة ضبط جلسة المساعد الذكي. تفضل بأمرك التالي لإدارة المتجر أو الحملات الإعلانية!",
				timestamp: new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }),
			},
		]);
		showToast("جلسة جديدة", "تمت إعادة ضبط محادثة المساعد الذكي بنجاح", "info");
	};

	const getToolArabicName = (toolName: string) => {
		switch (toolName) {
			case "list_products":
				return "استعراض منتجات المتجر";
			case "update_product_price":
				return "تعديل سعر المحصول";
			case "toggle_product_stock":
				return "تحديث حالة التوفر";
			case "list_orders":
				return "استعراض طلبات العملاء";
			case "update_order_status":
				return "تحديث حالة الطلب";
			case "list_ad_campaigns":
				return "استعراض حملات Meta الإعلانية";
			case "create_ad_campaign":
				return "إطلاق حملة إعلانية جديدة في Meta";
			case "toggle_campaign_status":
				return "تشغيل / إيقاف الحملة";
			case "update_campaign_budget":
				return "تعديل ميزانية الإعلان";
			case "update_store_settings":
				return "تحديث إعدادات وشريط المتجر";
			case "get_store_metrics":
				return "تحليل مبيعات وبوابة Ziina";
			default:
				return toolName;
		}
	};

	return (
		<div className="space-y-6">
			{/* Top Header Card */}
			<div className="bg-gradient-to-r from-[#2C2014] via-[#3D2C1C] to-[#1C140D] text-white rounded-3xl p-6 sm:p-8 border border-amber-600/30 shadow-xl relative overflow-hidden">
				<div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
				<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div className="space-y-2">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold border border-amber-400/30">
							<Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
							<span>Model Context Protocol (MCP) متصل ومفعل</span>
						</div>
						<h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-amber-100 flex items-center gap-3">
							<Bot className="w-8 h-8 text-amber-400" />
							<span>المساعد الذكي لإدارة المتجر والحملات (AI MCP Copilot)</span>
						</h2>
						<p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
							تحكم كامل بالمتجر عبر الذكاء الاصطناعي: قم بإنشاء وتعديل حملات Meta الإعلانية، تحديث أسعار الرطب والتين والفقع، متابعة طلبات الضيافة، وتفقد بوابة دفع Ziina بمحادثة واحدة طبيعية.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button
							onClick={() => setCmsTab("marketing")}
							className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white rounded-xl text-xs font-bold border border-white/10 transition-colors"
						>
							<Megaphone className="w-4 h-4 text-amber-400" />
							<span>لوحة الحملات</span>
						</button>
						<button
							onClick={() => setCmsTab("ziina")}
							className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/30 transition-colors"
						>
							<CreditCard className="w-4 h-4 text-emerald-400" />
							<span>بوابة Ziina</span>
						</button>
						<button
							onClick={clearChat}
							className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-800/80 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 rounded-xl text-xs font-bold border border-stone-700 transition-colors"
							title="مسح المحادثة"
						>
							<Trash2 className="w-3.5 h-3.5" />
							<span>مسح المحادثة</span>
						</button>
					</div>
				</div>

				{/* Quick Stats Banner */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
					<div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
						<span className="text-stone-400 text-[11px] block">المحاصيل في الكتالوج</span>
						<span className="text-amber-300 font-bold text-base">{products.length} منتج نشط</span>
					</div>
					<div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
						<span className="text-stone-400 text-[11px] block">إجمالي طلبات المتجر</span>
						<span className="text-emerald-300 font-bold text-base">{orders.length} طلبية</span>
					</div>
					<div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
						<span className="text-stone-400 text-[11px] block">حملات Meta Ads الإعلانية</span>
						<span className="text-amber-400 font-bold text-base">{metaCampaigns.length} حملات</span>
					</div>
					<div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
						<span className="text-stone-400 text-[11px] block">بوابة دفع Ziina</span>
						<span className="text-emerald-400 font-bold text-base flex items-center gap-1">
							<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
							<span>Apple Pay جاهز</span>
						</span>
					</div>
				</div>
			</div>

			{/* Quick Action Suggestions */}
			<div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DCCB] shadow-sm">
				<div className="flex items-center justify-between mb-3">
					<span className="text-xs font-bold text-stone-700 flex items-center gap-2">
						<Zap className="w-4 h-4 text-amber-500" />
						<span>أوامر سريعة بنقرة واحدة (Quick Prompt Chips):</span>
					</span>
					<span className="text-[11px] text-stone-500">انقر على أي أمر للتنفيذ الفوري</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{QUICK_PROMPTS.map((qp, idx) => (
						<button
							key={idx}
							onClick={() => handleSendMessage(qp.prompt)}
							disabled={isLoading}
							className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-amber-100/70 text-stone-800 border border-[#E8DCCB] hover:border-amber-400 transition-all text-right flex items-center gap-1.5 disabled:opacity-50"
						>
							<span>{qp.label}</span>
							<ArrowRight className="w-3 h-3 text-amber-700 rotate-180 shrink-0" />
						</button>
					))}
				</div>
			</div>

			{/* Main Chat Interface */}
			<div className="bg-white rounded-3xl border border-[#E8DCCB] shadow-sm flex flex-col h-[650px] overflow-hidden">
				{/* Chat Messages Log */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/50">
					{messages.map((msg) => (
						<div
							key={msg.id}
							className={`flex gap-3 ${
								msg.role === "user" ? "flex-row-reverse" : "flex-row"
							}`}
						>
							{/* Avatar */}
							<div
								className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
									msg.role === "user"
										? "bg-[#2C2014] text-amber-300"
										: "bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950"
								}`}
							>
								{msg.role === "user" ? (
									<span className="text-xs font-bold">أنت</span>
								) : (
									<Bot className="w-5 h-5 text-white" />
								)}
							</div>

							{/* Message Body */}
							<div
								className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
									msg.role === "user"
										? "bg-[#2C2014] text-amber-50 rounded-tr-none border border-amber-900/40"
										: "bg-white text-stone-800 rounded-tl-none border border-[#E8DCCB]"
								}`}
							>
								{/* Header */}
								<div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-black/5 text-[10px] text-stone-400">
									<span className="font-bold text-stone-600">
										{msg.role === "user" ? "مشرف المتجر" : "مساعد خيرات الدار الذكي (MCP Agent)"}
									</span>
									<span>{msg.timestamp}</span>
								</div>

								{/* Message Text with preserved breaks */}
								<div className="whitespace-pre-line font-medium text-[13px] leading-relaxed">
									{msg.text}
								</div>

								{/* Executed Tools Badges */}
								{msg.actions && msg.actions.length > 0 && (
									<div className="mt-3 pt-3 border-t border-stone-200/80 space-y-2">
										<div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
											<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
											<span>أدوات MCP التي تم تنفيذها بنجاح ({msg.actions.length}):</span>
										</div>

										<div className="space-y-1.5">
											{msg.actions.map((act, idx) => {
												const actionKey = `${msg.id}-action-${idx}`;
												const isExpanded = expandedActionIndex === actionKey;

												return (
													<div
														key={idx}
														className="rounded-xl border border-amber-200 bg-amber-50/50 p-2 text-xs"
													>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-2">
																<span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 font-mono text-[10px] font-bold" dir="ltr">
																	{act.tool}
																</span>
																<span className="font-semibold text-stone-800">
																	{getToolArabicName(act.tool)}
																</span>
															</div>
															<button
																onClick={() =>
																	setExpandedActionIndex(
																		isExpanded ? null : actionKey,
																	)
																}
																className="text-[10px] text-amber-800 hover:text-amber-900 flex items-center gap-1 font-bold"
															>
																<span>{isExpanded ? "إخفاء التفاصيل" : "عرض البيانات"}</span>
																{isExpanded ? (
																	<ChevronUp className="w-3 h-3" />
																) : (
																	<ChevronDown className="w-3 h-3" />
																)}
															</button>
														</div>

														{/* Action result message if present */}
														{act.result?.message && (
															<p className="mt-1 text-[11px] text-emerald-800 font-medium">
																✓ {act.result.message}
															</p>
														)}

														{/* Expandable JSON details */}
														{isExpanded && (
															<div className="mt-2 pt-2 border-t border-amber-200/60 font-mono text-[10px] bg-stone-900 text-amber-200 p-2 rounded-lg overflow-x-auto" dir="ltr">
																<div>Args: {JSON.stringify(act.args, null, 2)}</div>
																<div className="mt-1 text-emerald-400">Result: {JSON.stringify(act.result, null, 2)}</div>
															</div>
														)}
													</div>
												);
											})}
										</div>
									</div>
								)}

								{/* Model badge */}
								{msg.modelUsed && (
									<div className="mt-2 text-right">
										<span className="text-[9px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full font-mono">
											via {msg.modelUsed}
										</span>
									</div>
								)}
							</div>
						</div>
					))}

					{/* Loading indicator bubble */}
					{isLoading && (
						<div className="flex gap-3">
							<div className="w-9 h-9 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 animate-pulse">
								<Bot className="w-5 h-5 text-stone-950" />
							</div>
							<div className="bg-white border border-[#E8DCCB] rounded-2xl rounded-tl-none p-4 text-xs text-stone-600 flex items-center gap-3 shadow-sm">
								<RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
								<span className="font-semibold">
									جاري استدعاء بروتوكول MCP وقاعدة بيانات خيرات الدار وتجهيز الرد...
								</span>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input Footer */}
				<div className="p-3 sm:p-4 bg-white border-t border-[#E8DCCB]">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleSendMessage();
						}}
						className="flex items-center gap-2"
					>
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							disabled={isLoading}
							placeholder="اكتب طلبك للمساعد الذكي (مثال: أطلق حملة Meta جديدة، أو غير سعر رطب خلاص العين إلى 75 د.إ)..."
							className="flex-1 p-3 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DCCB] rounded-2xl focus:outline-none focus:border-amber-700 text-stone-800 placeholder-stone-400"
						/>
						<button
							type="submit"
							disabled={!input.trim() || isLoading}
							className="px-5 py-3 bg-[#2C2014] hover:bg-black text-amber-200 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow"
						>
							<span>إرسال</span>
							<Send className="w-4 h-4 rotate-180" />
						</button>
					</form>
					<div className="mt-2 flex items-center justify-between text-[11px] text-stone-400 px-1">
						<span>يدعم تنفيذ أوامر الكتالوج، ميزانيات Meta Ads، وحالات الطلبات مباشرة.</span>
						<span className="font-mono text-[10px]">MCP v1.0 • Gemini 3.8</span>
					</div>
				</div>
			</div>
		</div>
	);
};
