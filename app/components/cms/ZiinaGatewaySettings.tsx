import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import {
	CreditCard,
	ShieldCheck,
	ExternalLink,
	Copy,
	Check,
	Key,
	ToggleLeft,
	ToggleRight,
	Play,
	CheckCircle,
	AlertCircle,
	RefreshCw,
	Lock,
	ArrowUpRight,
	Zap,
	Receipt,
} from "lucide-react";

export const ZiinaGatewaySettings: React.FC = () => {
	const { settings, updateSettings, showToast, orders } = useStore();

	const [apiToken, setApiToken] = useState(settings.ziinaApiKey || "");
	const [testMode, setTestMode] = useState<boolean>(settings.ziinaTestMode ?? true);
	const [webhookSecret, setWebhookSecret] = useState(settings.ziinaWebhookSecret || "");
	const [isSaving, setIsSaving] = useState(false);
	const [copiedWebhook, setCopiedWebhook] = useState(false);

	// Test ping state
	const [isTesting, setIsTesting] = useState(false);
	const [testResult, setTestResult] = useState<any>(null);

	const webhookUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/api/ziina/webhook`
			: "https://yourdomain.com/api/ziina/webhook";

	const copyWebhook = () => {
		if (typeof window !== "undefined") {
			navigator.clipboard.writeText(webhookUrl);
			setCopiedWebhook(true);
			setTimeout(() => setCopiedWebhook(false), 2500);
			showToast("تم النسخ", "تم نسخ رابط Webhook إلى الحافظة");
		}
	};

	const handleSaveConfig = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		updateSettings({
			ziinaApiKey: apiToken.trim(),
			ziinaTestMode: testMode,
			ziinaWebhookSecret: webhookSecret.trim(),
			ziinaEnabled: true,
		});
		setIsSaving(false);
		showToast("تم الحفظ", "تم حفظ إعدادات بوابة الدفع Ziina بنجاح.");
	};

	const handleRunTestPing = async () => {
		setIsTesting(true);
		setTestResult(null);
		try {
			const res = await fetch("/api/ziina/create-intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					orderId: `test-${Date.now().toString(36)}`,
					orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
					amount: 15, // 15 AED test
					currency: "AED",
					customerName: "فحص بوابة Ziina",
					customerPhone: "+971500000000",
					apiToken: apiToken.trim() || undefined,
					testMode,
				}),
			});
			const data = await res.json();
			setTestResult(data);
			if (data.success) {
				showToast("نجاح الفحص", data.message || "تم إنشاء جلسة دفع Ziina بنجاح");
			} else {
				showToast("تنبيه الفحص", data.error || "فشل الاتصال ببوابة Ziina", "warning");
			}
		} catch (err) {
			setTestResult({
				success: false,
				error: err instanceof Error ? err.message : "Network error",
			});
		}
		setIsTesting(false);
	};

	// Ziina Orders
	const ziinaOrders = orders.filter((o) => o.paymentMethod === "ziina");
	const paidZiinaOrders = ziinaOrders.filter((o) => o.paymentStatus === "paid");
	const totalPaidZiina = paidZiinaOrders.reduce((sum, o) => sum + o.total, 0);

	return (
		<div className="space-y-6 text-right">
			{/* Top Hero Banner */}
			<div className="bg-gradient-to-r from-[#2C2014] to-[#453220] text-white p-6 rounded-2xl border border-[#D6BE9F]/30 shadow-lg relative overflow-hidden">
				<div className="absolute left-6 top-6 opacity-10">
					<CreditCard className="w-36 h-36" />
				</div>
				<div className="relative z-10 max-w-2xl space-y-3">
					<div className="flex items-center gap-2">
						<span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
							<Zap className="w-4 h-4 text-amber-400" />
						</span>
						<span className="text-xs font-bold uppercase tracking-wider text-amber-300">
							بوابة الدفع الإلكتروني المعتمدة (Payment Gateway)
						</span>
					</div>
					<h3 className="font-serif text-2xl font-bold text-amber-100">
						ربط بوابة Ziina (Apple Pay · فيزا · ماستركارد)
					</h3>
					<p className="text-xs text-stone-300 leading-relaxed">
						تتيح بوابة Ziina لعملاء متجر خيرات الدار إتمام سداد قيمة المحاصيل التراثية فورياً عبر الهواتف والبطاقات البنكية المعتمدة في دولة الإمارات مع إيداع مباشر وأعلى معايير التشفير المصرفي.
					</p>

					<div className="flex flex-wrap items-center gap-3 pt-2">
						<a
							href="https://docs.ziina.com/developers/custom-integration"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-lg text-xs font-bold transition-colors shadow-sm"
						>
							<span>توثيق المطورين (Ziina Custom Integration Docs)</span>
							<ExternalLink className="w-3.5 h-3.5" />
						</a>
						<a
							href="https://app.ziina.com"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-stone-200 rounded-lg text-xs font-medium transition-colors"
						>
							<span>لوحة تحكم التاجر (Ziina Dashboard)</span>
							<ArrowUpRight className="w-3.5 h-3.5" />
						</a>
					</div>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="bg-white p-5 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-1">
					<p className="text-xs font-medium text-stone-500">حالة بوابة الدفع</p>
					<div className="flex items-center gap-2 pt-1">
						<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
						<span className="font-bold text-sm text-stone-900">
							{apiToken ? (testMode ? "وضع التجربة (Sandbox)" : "مباشر بالإنتاج (Live)") : "جلسات تجريبية نشطة"}
						</span>
					</div>
					<p className="text-[11px] text-stone-400">
						{apiToken ? "مفتاح API مربوط ومضبوط" : "يمكن للعملاء فحص الدفع التجريبي"}
					</p>
				</div>

				<div className="bg-white p-5 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-1">
					<p className="text-xs font-medium text-stone-500">الطلبات المسددة عبر Ziina</p>
					<div className="flex items-baseline gap-1.5">
						<span className="font-serif text-2xl font-bold text-emerald-800 tabular-nums">
							{paidZiinaOrders.length}
						</span>
						<span className="text-xs text-stone-400">من أصل {ziinaOrders.length}</span>
					</div>
					<p className="text-[11px] text-emerald-700 font-medium">
						نسبة التحويل {ziinaOrders.length > 0 ? Math.round((paidZiinaOrders.length / ziinaOrders.length) * 100) : 100}%
					</p>
				</div>

				<div className="bg-white p-5 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-1">
					<p className="text-xs font-medium text-stone-500">المبالغ المحصلة إلكترونياً</p>
					<div className="flex items-baseline gap-1.5">
						<span className="font-serif text-2xl font-bold text-amber-900 tabular-nums">
							{totalPaidZiina}
						</span>
						<span className="text-xs font-bold text-[#8B5A2B]">د.إ AED</span>
					</div>
					<p className="text-[11px] text-stone-400">تحويل مباشر لحساب التاجر المصرفي</p>
				</div>
			</div>

			{/* Configuration & Webhook Form */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Credentials Box */}
				<div className="bg-white p-6 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-4">
					<div className="flex items-center gap-2 pb-2 border-b border-stone-200">
						<Key className="w-4 h-4 text-amber-800" />
						<h4 className="font-serif text-base font-bold text-[#2C2014]">
							مفاتيح وإعدادات بوابة Ziina
						</h4>
					</div>

					<form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
						<div>
							<label className="block text-stone-700 font-semibold mb-1">
								رمز الوصول السري (Ziina API Access Token / Bearer Token):
							</label>
							<div className="relative">
								<input
									type="password"
									value={apiToken}
									onChange={(e) => setApiToken(e.target.value)}
									placeholder="الصق رمز Ziina Bearer Token هنا..."
									className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
									dir="ltr"
								/>
							</div>
							<p className="text-[10px] text-stone-400 mt-1">
								احصل عليه من لوحة تحكم Ziina &gt; Settings &gt; Developer API Keys (مع صلاحية <code>write_payment_intents</code>).
							</p>
						</div>

						{/* Test Mode Switch */}
						<div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
							<div>
								<p className="font-bold text-stone-800">بيئة التجربة (Test / Sandbox Mode):</p>
								<p className="text-[10px] text-stone-500">
									عند التفعيل، تُرسل المعاملات بعلم <code>test: true</code> بدون خصم مالي حقيقي من بطاقات العملاء.
								</p>
							</div>
							<button
								type="button"
								onClick={() => setTestMode(!testMode)}
								className="text-stone-700 hover:text-black transition-colors"
							>
								{testMode ? (
									<ToggleRight className="w-8 h-8 text-amber-600" />
								) : (
									<ToggleLeft className="w-8 h-8 text-stone-400" />
								)}
							</button>
						</div>

						<div>
							<label className="block text-stone-700 font-semibold mb-1">
								مفتاح توثيق الويب هوك السري (Webhook Secret - اختياري):
							</label>
							<input
								type="password"
								value={webhookSecret}
								onChange={(e) => setWebhookSecret(e.target.value)}
								placeholder="Client Secret للتحقق من HMAC Signature..."
								className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
								dir="ltr"
							/>
						</div>

						<div className="pt-2 flex items-center justify-between">
							<button
								type="submit"
								disabled={isSaving}
								className="px-5 py-2.5 bg-[#2C2014] hover:bg-black text-amber-200 text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-1.5"
							>
								<Check className="w-4 h-4" />
								<span>{isSaving ? "جاري الحفظ..." : "حفظ إعدادات Ziina"}</span>
							</button>

							<button
								type="button"
								onClick={handleRunTestPing}
								disabled={isTesting}
								className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
							>
								<RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-amber-800" : ""}`} />
								<span>{isTesting ? "جاري الفحص..." : "فحص الاتصال والإنشاء"}</span>
							</button>
						</div>
					</form>
				</div>

				{/* Webhook & Integration Instructions Box */}
				<div className="bg-white p-6 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-4">
					<div className="flex items-center gap-2 pb-2 border-b border-stone-200">
						<ShieldCheck className="w-4 h-4 text-emerald-700" />
						<h4 className="font-serif text-base font-bold text-[#2C2014]">
							رابط الاستماع للأحداث (Webhook URL)
						</h4>
					</div>

					<p className="text-xs text-stone-500 leading-relaxed">
						لتحديث حالة الطلبات تلقائياً عند اكتمال الدفع من قبل العميل، قم بنسخ الرابط التالي وإضافته في حسابك لدى Ziina:
					</p>

					<div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
						<label className="block text-[11px] font-bold text-stone-700">
							عنوان الـ Webhook الخاص بمتجرك:
						</label>
						<div className="flex items-center gap-2">
							<input
								type="text"
								readOnly
								value={webhookUrl}
								dir="ltr"
								className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono text-[11px] text-stone-800"
							/>
							<button
								type="button"
								onClick={copyWebhook}
								className="px-3 py-2 bg-[#2C2014] hover:bg-black text-amber-200 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
								title="نسخ الرابط"
							>
								{copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
								<span>{copiedWebhook ? "تم النسخ" : "نسخ"}</span>
							</button>
						</div>
						<div className="flex items-center gap-1.5 text-[10px] text-stone-500">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
							<span>الحدث المدعوم: <code>payment_intent.status.updated</code></span>
						</div>
					</div>

					{/* Step by step guide */}
					<div className="space-y-2 text-xs text-stone-600 bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DCCB]">
						<p className="font-bold text-[#2C2014]">خطوات التفعيل في منصة Ziina:</p>
						<ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-600">
							<li>سجل دخولك إلى لوحة تحكم Ziina للأعمال.</li>
							<li>توجه إلى قائمة <strong>Settings &gt; Developers</strong>.</li>
							<li>أنشئ <strong>Access Token</strong> وانسخه إلى الحقل أعلاه.</li>
							<li>أضف عنوان الـ Webhook الموضح أعلاه لاستلام إشعارات السداد اللحظية.</li>
						</ol>
					</div>

					{/* Test Ping Response Box */}
					{testResult && (
						<div
							className={`p-3.5 rounded-xl border text-xs space-y-2 ${
								testResult.success
									? "bg-emerald-50 border-emerald-200 text-emerald-950"
									: "bg-rose-50 border-rose-200 text-rose-950"
							}`}
						>
							<div className="flex items-center justify-between font-bold">
								<span className="flex items-center gap-1.5">
									{testResult.success ? (
										<CheckCircle className="w-4 h-4 text-emerald-600" />
									) : (
										<AlertCircle className="w-4 h-4 text-rose-600" />
									)}
									<span>نتيجة فحص جلسة الدفع:</span>
								</span>
								<span className="text-[10px] uppercase font-mono">
									{testResult.isLiveGateway ? "بوابة Ziina الرسمية" : "جلسة تجريبية (Sandbox)"}
								</span>
							</div>

							<p className="text-[11px]">{testResult.message || testResult.error}</p>

							{testResult.redirect_url && (
								<div className="pt-1 flex items-center justify-between">
									<span className="text-[10px] text-stone-500 font-mono truncate max-w-[200px]" dir="ltr">
										ID: {testResult.payment_intent_id}
									</span>
									<a
										href={testResult.redirect_url}
										target="_blank"
										rel="noreferrer"
										className="px-2.5 py-1 bg-[#2C2014] text-amber-200 rounded text-[11px] font-bold flex items-center gap-1 hover:bg-black transition-colors"
									>
										<span>معاينة صفحة الدفع</span>
										<ExternalLink className="w-3 h-3" />
									</a>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Recent Ziina Transactions Table */}
			<div className="bg-white p-6 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-4">
				<div className="flex items-center justify-between pb-2 border-b border-stone-200">
					<div className="flex items-center gap-2">
						<Receipt className="w-4 h-4 text-amber-800" />
						<h4 className="font-serif text-base font-bold text-[#2C2014]">
							سجل عمليات دفع Ziina الأخيرة ({ziinaOrders.length})
						</h4>
					</div>
					<span className="text-xs text-stone-400">
						تحديث تلقائي عبر قاعدة البيانات وسحابة المتجر
					</span>
				</div>

				{ziinaOrders.length === 0 ? (
					<div className="py-8 text-center space-y-2 text-stone-400">
						<CreditCard className="w-8 h-8 mx-auto opacity-40" />
						<p className="text-xs">لم يتم تسجيل أي طلبات دفع عبر Ziina حتى الآن.</p>
						<p className="text-[11px] text-stone-400">
							عند اختيار أي عميل لبوابة Ziina في السلة، ستظهر تفاصيل العملية وحالتها هنا مباشرة.
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
									<th className="py-2.5 px-3 font-semibold">طريقة البطاقة</th>
									<th className="py-2.5 px-3 font-semibold">معرّف Ziina Intent</th>
									<th className="py-2.5 px-3 font-semibold">حالة الدفع</th>
									<th className="py-2.5 px-3 font-semibold">التاريخ</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-stone-100">
								{ziinaOrders.map((ord) => (
									<tr key={ord.id} className="hover:bg-stone-50/50">
										<td className="py-2.5 px-3 font-bold tabular-nums text-stone-900">
											{ord.orderNumber}
										</td>
										<td className="py-2.5 px-3">
											<p className="font-semibold text-stone-900">{ord.customerName}</p>
											<p className="text-[10px] text-stone-400" dir="ltr">{ord.customerPhone}</p>
										</td>
										<td className="py-2.5 px-3 font-bold text-[#8B5A2B] tabular-nums">
											{ord.total} د.إ
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
													? "تم السداد ✓"
													: ord.paymentStatus === "failed"
														? "فشل السداد"
														: "قيد السداد"}
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
