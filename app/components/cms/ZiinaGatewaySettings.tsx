import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import {
	CreditCard,
	ShieldCheck,
	ExternalLink,
	Copy,
	Check,
	ArrowUpRight,
	Zap,
	Receipt,
	Server,
	Activity,
	Radio,
} from "lucide-react";

interface ZiinaStatusData {
	success: boolean;
	configured: boolean;
	envConfigured: boolean;
	maskedToken: string;
	testMode: boolean;
	mode: "sandbox" | "production";
	hasWebhookSecret: boolean;
	apiUrl: string;
}

export const ZiinaGatewaySettings: React.FC = () => {
	const { showToast, orders } = useStore();

	// Live status from server .env
	const [status, setStatus] = useState<ZiinaStatusData | null>(null);
	const [isLoadingStatus, setIsLoadingStatus] = useState(true);
	const [copiedWebhook, setCopiedWebhook] = useState(false);

	const webhookUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/api/ziina/webhook`
			: "https://yourdomain.com/api/ziina/webhook";

	// Fetch server status of ZIINA_API_TOKEN from .env
	const fetchGatewayStatus = async () => {
		setIsLoadingStatus(true);
		try {
			const res = await fetch("/api/ziina/create-intent", {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (res.ok) {
				const data = (await res.json()) as ZiinaStatusData;
				setStatus(data);
			}
		} catch (err) {
			console.warn("Could not fetch Ziina gateway status:", err);
		} finally {
			setIsLoadingStatus(false);
		}
	};

	useEffect(() => {
		fetchGatewayStatus();
	}, []);

	const copyWebhook = () => {
		if (typeof window !== "undefined") {
			navigator.clipboard.writeText(webhookUrl);
			setCopiedWebhook(true);
			setTimeout(() => setCopiedWebhook(false), 2500);
			showToast("تم النسخ", "تم نسخ رابط الويب هوك بنجاح");
		}
	};

	// Ziina Orders metrics
	const ziinaOrders = orders.filter((o) => o.paymentMethod === "ziina");
	const paidZiinaOrders = ziinaOrders.filter((o) => o.paymentStatus === "paid");
	const totalPaidZiina = paidZiinaOrders.reduce((sum, o) => sum + o.total, 0);

	return (
		<div className="space-y-6 text-right">
			{/* Top Hero Banner */}
			<div className="bg-gradient-to-r from-[#2C2014] to-[#453220] text-white p-6 sm:p-7 rounded-2xl border border-[#D6BE9F]/30 shadow-lg relative overflow-hidden">
				<div className="absolute left-6 top-6 opacity-10 pointer-events-none">
					<CreditCard className="w-40 h-40" />
				</div>
				<div className="relative z-10 max-w-2xl space-y-3">
					<div className="flex items-center gap-2">
						<span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
							<Zap className="w-4 h-4 text-amber-400" />
						</span>
						<span className="text-xs font-bold uppercase tracking-wider text-amber-300">
							بوابة الدفع الإلكتروني (Ziina Gateway)
						</span>
					</div>
					<h3 className="font-serif text-2xl font-bold text-amber-100">
						البطاقات البنكية و Apple Pay
					</h3>
					<p className="text-xs text-stone-300 leading-relaxed">
						مفاتيح الربط والـ API Access Token تُدار وتُقرأ مباشرة وبشكل آمن من ملف البيئة المحمي (<strong>.env</strong>) على الخادم. تتم معالجة جميع عمليات السداد والتحقق من التوقيع الرقمي تلقائياً دون الحاجة لأي إعدادات يدوية في المتصفح.
					</p>

					<div className="flex flex-wrap items-center gap-3 pt-2">
						<a
							href="https://docs.ziina.com/developers/custom-integration"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-lg text-xs font-bold transition-colors shadow-sm"
						>
							<span>توثيق مطوري Ziina</span>
							<ExternalLink className="w-3.5 h-3.5" />
						</a>
						<a
							href="https://app.ziina.com"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-stone-200 rounded-lg text-xs font-medium transition-colors"
						>
							<span>لوحة تحكم Ziina للأعمال</span>
							<ArrowUpRight className="w-3.5 h-3.5" />
						</a>
					</div>
				</div>
			</div>

			{/* Status & Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* 1. Environment Config Source */}
				<div className="bg-white p-5 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-2">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
							<Server className="w-3.5 h-3.5 text-amber-800" />
							<span>مصدر المفاتيح والـ API</span>
						</p>
						<span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 font-mono text-stone-600 font-bold">
							.env
						</span>
					</div>
					<div className="flex items-center gap-2 pt-1">
						<span
							className={`w-2.5 h-2.5 rounded-full ${
								status?.configured ? "bg-emerald-500" : "bg-amber-500"
							}`}
						></span>
						<span className="font-bold text-sm text-stone-900">
							{isLoadingStatus
								? "جاري التحقق من .env..."
								: status?.configured
								? "المفتاح مهيأ في .env"
								: "بانتظار ضبط ZIINA_API_TOKEN"}
						</span>
					</div>
					<p className="text-[11px] text-stone-500 font-mono" dir="ltr">
						{status?.maskedToken ? `TOKEN: ${status.maskedToken}` : "ZIINA_API_TOKEN is not set"}
					</p>
				</div>

				{/* 2. Gateway Environment Mode */}
				<div className="bg-white p-5 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-2">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
							<Radio className="w-3.5 h-3.5 text-amber-800" />
							<span>بيئة التشغيل</span>
						</p>
						<span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold font-mono">
							ZIINA_TEST_MODE
						</span>
					</div>
					<div className="flex items-baseline gap-1.5 pt-1">
						<span className="font-bold text-sm text-stone-900">
							{isLoadingStatus
								? "..."
								: status?.testMode
								? "وضع التجربة (Sandbox / Test)"
								: "وضع الإنتاج المباشر (Production)"}
						</span>
					</div>
					<p className="text-[11px] text-stone-500">
						{status?.testMode
							? "البوابة تعمل ببيئة الاختبار مع بطاقات وهمية"
							: "البوابة مفعلة للمدفوعات البنكية الحقيقية"}
					</p>
				</div>

				{/* 3. Total Volume & Orders */}
				<div className="bg-white p-5 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-2">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
							<Activity className="w-3.5 h-3.5 text-emerald-700" />
							<span>إجمالي مدفوعات Ziina</span>
						</p>
						<span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold">
							{paidZiinaOrders.length} طلب مدفوع
						</span>
					</div>
					<div className="flex items-baseline gap-1.5 pt-1">
						<span className="font-serif text-2xl font-bold text-amber-900 tabular-nums">
							{totalPaidZiina}
						</span>
						<span className="text-xs font-bold text-[#8B5A2B]">درهم إماراتي</span>
					</div>
					<p className="text-[11px] text-stone-500">
						نسبة النجاح: {ziinaOrders.length > 0 ? Math.round((paidZiinaOrders.length / ziinaOrders.length) * 100) : 100}%
					</p>
				</div>
			</div>

			{/* Webhook Endpoint & Setup Guide */}
			<div className="bg-white p-6 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-4">
				<div className="flex items-center gap-2 pb-3 border-b border-stone-200">
					<div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-800 flex items-center justify-center">
						<ShieldCheck className="w-4 h-4 text-emerald-700" />
					</div>
					<div>
						<h4 className="font-serif text-base font-bold text-[#2C2014]">
							رابط الويب هوك (Webhook Endpoint)
						</h4>
						<p className="text-[11px] text-stone-400">
							استقبال إشعارات الدفع الآلية وتأكيد الطلبات فور السداد
						</p>
					</div>
				</div>

				<p className="text-xs text-stone-600 leading-relaxed">
					عندما يكمل العميل عملية الدفع بنجاح في Ziina، يرسل الخادم إشعاراً فورياً إلى هذا الرابط لتحديث حالة الطلب إلى (<strong>مدفوع</strong>) تلقائياً:
				</p>

				<div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
					<label className="block text-[11px] font-bold text-stone-700">
						عنوان الويب هوك (Webhook URL):
					</label>
					<div className="flex items-center gap-2">
						<input
							type="text"
							readOnly
							value={webhookUrl}
							dir="ltr"
							className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-[11px] text-stone-800 select-all"
						/>
						<button
							type="button"
							onClick={copyWebhook}
							className="px-3 py-2 bg-[#2C2014] hover:bg-black text-amber-200 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1 shadow-sm"
						>
							{copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
							<span>{copiedWebhook ? "تم النسخ" : "نسخ"}</span>
						</button>
					</div>
					<div className="flex items-center gap-1.5 text-[10px] text-stone-500">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
						<span>الحدث المطلوب في لوحة تحكم Ziina: <code>payment_intent.status.updated</code></span>
					</div>
				</div>

				<div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DCCB] space-y-1.5 text-xs text-stone-600">
					<p className="font-bold text-[#2C2014]">متغيرات البيئة في ملف .env بالخادم:</p>
					<ul className="space-y-1 font-mono text-[11px] text-stone-700 text-left bg-white p-2.5 rounded-lg border border-stone-200" dir="ltr">
						<li>ZIINA_API_TOKEN=your_access_token_here</li>
						<li>ZIINA_TEST_MODE=false</li>
						<li>ZIINA_WEBHOOK_SECRET=your_webhook_secret_here</li>
					</ul>
				</div>
			</div>

			{/* Recent Ziina Transactions Table */}
			<div className="bg-white p-6 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-stone-200">
					<div className="flex items-center gap-2">
						<Receipt className="w-4 h-4 text-amber-800" />
						<h4 className="font-serif text-base font-bold text-[#2C2014]">
							سجل عمليات دفع Ziina ({ziinaOrders.length})
						</h4>
					</div>
					<span className="text-xs text-stone-400">
						يتم تحديث المعاملات لحظياً فور السداد
					</span>
				</div>

				{ziinaOrders.length === 0 ? (
					<div className="py-10 text-center space-y-2 text-stone-400">
						<CreditCard className="w-9 h-9 mx-auto opacity-30 text-amber-800" />
						<p className="text-xs font-semibold text-stone-600">لا توجد عمليات دفع مسجلة عبر Ziina حتى الآن</p>
						<p className="text-[11px] text-stone-400">
							ستظهر جميع طلبات البطاقات البنكية و Apple Pay هنا تلقائياً بمجرد إتمامها.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-right text-xs">
							<thead className="bg-[#FAF7F2] border-b border-stone-200 text-stone-600">
								<tr>
									<th className="py-2.5 px-3 font-semibold">رقم الطلب</th>
									<th className="py-2.5 px-3 font-semibold">العميل</th>
									<th className="py-2.5 px-3 font-semibold">المبلغ</th>
									<th className="py-2.5 px-3 font-semibold">طريقة الدفع</th>
									<th className="py-2.5 px-3 font-semibold">معرّف المعاملة</th>
									<th className="py-2.5 px-3 font-semibold">الحالة</th>
									<th className="py-2.5 px-3 font-semibold">التاريخ</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{ziinaOrders.map((ord) => (
									<tr key={ord.id} className="hover:bg-stone-50/50 transition-colors">
										<td className="py-2.5 px-3 font-bold tabular-nums text-stone-900">
											{ord.orderNumber}
										</td>
										<td className="py-2.5 px-3">
											<p className="font-semibold text-stone-900">{ord.customerName}</p>
											<p className="text-[10px] text-stone-400 font-mono" dir="ltr">{ord.customerPhone}</p>
										</td>
										<td className="py-2.5 px-3 font-bold text-[#8B5A2B] tabular-nums">
											{ord.total} درهم
										</td>
										<td className="py-2.5 px-3 text-stone-600">
											{ord.cardBrand ? `${ord.cardBrand} (•••• ${ord.cardLastFour || "4242"})` : "Apple Pay / Card"}
										</td>
										<td className="py-2.5 px-3 font-mono text-[10px] text-stone-500 max-w-[140px] truncate" dir="ltr">
											{ord.ziinaPaymentIntentId || "—"}
										</td>
										<td className="py-2.5 px-3">
											<span
												className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
													ord.paymentStatus === "paid"
														? "bg-emerald-100 text-emerald-800"
														: ord.paymentStatus === "failed"
														? "bg-rose-100 text-rose-800"
														: "bg-amber-100 text-amber-800"
												}`}
											>
												{ord.paymentStatus === "paid"
													? "مدفوع بنجاح"
													: ord.paymentStatus === "failed"
													? "فشلت المعاملة"
													: "بانتظار السداد"}
											</span>
										</td>
										<td className="py-2.5 px-3 text-stone-400 text-[10px]" dir="ltr">
											{new Date(ord.createdAt).toLocaleDateString("en-GB")}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};
