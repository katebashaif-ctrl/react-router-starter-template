import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import type { MarketingLead, LeadStatus } from "../../types/store";
import {
	Users,
	Sparkles,
	Phone,
	MessageSquare,
	Download,
	Plus,
	Trash2,
	CheckCircle2,
	Clock,
	X,
	ArrowUpRight,
	Bot,
	Send,
	Flame,
	ShieldCheck,
	Filter,
	Share2,
} from "lucide-react";

export const AILeadsManager: React.FC = () => {
	const {
		marketingLeads,
		addMarketingLead,
		updateLeadStatus,
		updateLeadScore,
		deleteLead,
		showToast,
	} = useStore();

	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [selectedLead, setSelectedLead] = useState<MarketingLead | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [aiResult, setAiResult] = useState<{
		aiScore?: string;
		scoreReason?: string;
		recommendedAction?: string;
		whatsappReply?: string;
	} | null>(null);

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [newLeadName, setNewLeadName] = useState("");
	const [newLeadPhone, setNewLeadPhone] = useState("+9715");
	const [newLeadEmirate, setNewLeadEmirate] = useState("أبوظبي");
	const [newLeadProduct, setNewLeadProduct] = useState("رطب خلاص العين الملكي");
	const [newLeadQty, setNewLeadQty] = useState("٣ سحاحير لضيافة المجلس");
	const [newLeadBudget, setNewLeadBudget] = useState<number>(350);
	const [newLeadCampaign, setNewLeadCampaign] = useState(
		"إعلانات Meta Facebook & Instagram Lead Ads",
	);

	const emiratesList = [
		"أبوظبي",
		"دبي",
		"الشارقة",
		"العين",
		"عجمان",
		"رأس الخيمة",
		"الفجيرة",
		"أم القيوين",
	];

	// Filtered leads
	const filteredLeads = marketingLeads.filter((l) =>
		statusFilter === "all" ? true : l.leadStatus === statusFilter,
	);

	// Summary numbers
	const totalLeads = marketingLeads.length;
	const qualifiedCount = marketingLeads.filter(
		(l) => l.leadStatus === "qualified" || l.leadStatus === "won",
	).length;
	const wonCount = marketingLeads.filter((l) => l.leadStatus === "won").length;
	const estimatedValue = marketingLeads.reduce((sum, l) => sum + (l.budgetAED || 0), 0);

	// Call AI to analyze lead and generate tailored WhatsApp message
	const handleAnalyzeLead = async (lead: MarketingLead) => {
		setSelectedLead(lead);
		setIsAnalyzing(true);
		setAiResult(null);

		try {
			const res = await fetch("/api/ai/marketing", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "analyze_lead",
					leadData: {
						customerName: lead.customerName,
						phone: lead.phone,
						emirate: lead.emirate,
						interestedProduct: lead.interestedProduct,
						quantityEstimated: lead.quantityEstimated,
						notes: lead.notes,
					},
				}),
			});

			const data = await res.json();
			if (data.success && data.data) {
				setAiResult(data.data);
				if (data.data.aiScore) {
					updateLeadScore(lead.id, data.data.aiScore as any, data.data.scoreReason);
				}
				showToast("تحليل الذكاء الاصطناعي", "تم تحليل نية العميل وصياغة الرد الإماراتي المخصص.");
			}
		} catch (err) {
			showToast("تنبيه", "تعذر الاتصال بمساعد الذكاء الاصطناعي.", "warning");
		} finally {
			setIsAnalyzing(false);
		}
	};

	// Open WhatsApp with AI-crafted message
	const handleSendWhatsApp = (phone: string, text: string) => {
		const cleanPhone = phone.replace(/[^0-9]/g, "");
		const encoded = encodeURIComponent(text);
		window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
		if (selectedLead && selectedLead.leadStatus === "new") {
			updateLeadStatus(selectedLead.id, "contacted");
		}
	};

	// Export leads as CSV for Meta Custom Audience
	const handleExportCSV = () => {
		const headers = [
			"id",
			"customer_name",
			"phone",
			"emirate",
			"product",
			"quantity",
			"budget_aed",
			"status",
			"ai_score",
			"campaign_source",
			"created_at",
		];
		const rows = marketingLeads.map((l) => [
			`"${l.id}"`,
			`"${l.customerName.replace(/"/g, '""')}"`,
			`"${l.phone}"`,
			`"${l.emirate}"`,
			`"${l.interestedProduct.replace(/"/g, '""')}"`,
			`"${l.quantityEstimated.replace(/"/g, '""')}"`,
			`"${l.budgetAED || 0}"`,
			`"${l.leadStatus}"`,
			`"${l.aiScore || "unknown"}"`,
			`"${l.sourceCampaign.replace(/"/g, '""')}"`,
			`"${l.createdAt}"`,
		]);

		const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", `meta_leads_audience_${Date.now()}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		showToast("تصدير البيانات", "تم تحميل ملف العملاء المحتملين بصيغة CSV لجمهور Meta المخصص.");
	};

	const handleAddLeadSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newLeadName.trim()) return;

		addMarketingLead({
			customerName: newLeadName,
			phone: newLeadPhone,
			emirate: newLeadEmirate,
			sourceCampaign: newLeadCampaign,
			interestedProduct: newLeadProduct,
			quantityEstimated: newLeadQty,
			budgetAED: Number(newLeadBudget),
			leadStatus: "new",
			aiScore: "high",
			aiSummary: `عميل مهتم بمحصول ${newLeadProduct} في إمارة ${newLeadEmirate}.`,
			notes: "تم تسجيل العميل يدوياً من الاستفسارات المباشرة.",
		});

		setIsAddModalOpen(false);
		setNewLeadName("");
	};

	return (
		<div className="space-y-6 text-right">
			{/* Top Banner */}
			<div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-white p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-4">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
							<Bot className="w-6 h-6 text-emerald-300" />
						</div>
						<div>
							<div className="flex items-center gap-2 flex-wrap">
								<h2 className="font-serif text-xl font-bold text-white">
									مساعد الذكاء الاصطناعي لاستقطاب وإدارة العملاء (AI Leads Helper)
								</h2>
								<span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
									تكامل مع Meta Lead Ads & WhatsApp
								</span>
							</div>
							<p className="text-xs text-emerald-200/90 pt-1">
								تحليل نية الشراء، تقييم العملاء المحتملين VIP، وصياغة ردود الواتساب الإماراتية بنقرة زر واحدة
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 self-end md:self-center">
						<button
							onClick={handleExportCSV}
							className="px-3.5 py-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-600/50"
							title="تصدير للجمهور المخصص في Meta Custom Audience"
						>
							<Download className="w-3.5 h-3.5 text-emerald-300" />
							<span>تصدير CSV لجمهور Meta</span>
						</button>

						<button
							onClick={() => setIsAddModalOpen(true)}
							className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
						>
							<Plus className="w-4 h-4 text-stone-900" />
							<span>تسجيل عميل محتمل</span>
						</button>
					</div>
				</div>

				{/* Quick Metrics */}
				<div className="pt-3 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
					<div className="bg-black/20 p-2.5 rounded-xl border border-emerald-800/40">
						<span className="text-[10px] text-emerald-300 block">إجمالي العملاء المهتمين</span>
						<span className="font-serif text-xl font-bold text-white tabular-nums">
							{totalLeads}
						</span>
					</div>
					<div className="bg-black/20 p-2.5 rounded-xl border border-emerald-800/40">
						<span className="text-[10px] text-emerald-300 block">عملاء مؤهلين للشراء (Qualified)</span>
						<span className="font-serif text-xl font-bold text-emerald-300 tabular-nums">
							{qualifiedCount}
						</span>
					</div>
					<div className="bg-black/20 p-2.5 rounded-xl border border-emerald-800/40">
						<span className="text-[10px] text-emerald-300 block">طلبات مؤكدة بنجاح (Won)</span>
						<span className="font-serif text-xl font-bold text-amber-300 tabular-nums">
							{wonCount}
						</span>
					</div>
					<div className="bg-black/20 p-2.5 rounded-xl border border-emerald-800/40">
						<span className="text-[10px] text-emerald-300 block">القيمة التقديرية للطلبات</span>
						<span className="font-serif text-xl font-bold text-white tabular-nums">
							{estimatedValue.toLocaleString()} د.إ
						</span>
					</div>
				</div>
			</div>

			{/* Pipeline Filters */}
			<div className="flex flex-wrap items-center gap-2">
				{[
					{ key: "all", label: `كافة العملاء (${marketingLeads.length})` },
					{
						key: "new",
						label: `جديد (${marketingLeads.filter((l) => l.leadStatus === "new").length})`,
					},
					{
						key: "contacted",
						label: `تم التواصل (${marketingLeads.filter((l) => l.leadStatus === "contacted").length})`,
					},
					{
						key: "qualified",
						label: `مؤهل للضيافة (${marketingLeads.filter((l) => l.leadStatus === "qualified").length})`,
					},
					{
						key: "won",
						label: `تم الطلب (${marketingLeads.filter((l) => l.leadStatus === "won").length})`,
					},
					{
						key: "lost",
						label: `ملغي (${marketingLeads.filter((l) => l.leadStatus === "lost").length})`,
					},
				].map((tab) => (
					<button
						key={tab.key}
						onClick={() => setStatusFilter(tab.key)}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
							statusFilter === tab.key
								? "bg-[#2C2014] text-amber-200 border-black shadow-sm"
								: "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Leads Table & AI Drawer */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Leads List (2 Columns on Desktop) */}
				<div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="font-serif text-lg font-bold text-[#2C2014]">
							سجل استفسارات وطلبات العملاء ({filteredLeads.length})
						</h3>
						<span className="text-[11px] text-stone-400">
							انقر على أي عميل لتحليله وصياغة رد واتساب ذكي
						</span>
					</div>

					<div className="space-y-3">
						{filteredLeads.length === 0 ? (
							<div className="text-center py-12 text-stone-400 text-xs">
								لا يوجد عملاء في هذه الفئة حالياً.
							</div>
						) : (
							filteredLeads.map((lead) => {
								const isSelected = selectedLead?.id === lead.id;
								return (
									<div
										key={lead.id}
										onClick={() => handleAnalyzeLead(lead)}
										className={`p-4 rounded-xl border transition-all cursor-pointer text-right space-y-2.5 ${
											isSelected
												? "border-amber-600 bg-amber-50/50 shadow-md ring-1 ring-amber-500"
												: "border-stone-200 hover:border-amber-400 bg-white hover:bg-stone-50/50"
										}`}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="space-y-0.5">
												<div className="flex items-center gap-2">
													<h4 className="font-bold text-stone-900 text-sm">
														{lead.customerName}
													</h4>
													<span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-semibold">
														{lead.emirate}
													</span>
													{lead.aiScore === "high" && (
														<span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
															<Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
															<span>أولوية VIP</span>
														</span>
													)}
												</div>
												<span className="text-[11px] text-stone-500 block font-mono" dir="ltr">
													{lead.phone}
												</span>
											</div>

											{/* Status Dropdown */}
											<select
												value={lead.leadStatus}
												onClick={(e) => e.stopPropagation()}
												onChange={(e) =>
													updateLeadStatus(lead.id, e.target.value as LeadStatus)
												}
												className="text-xs p-1.5 rounded-lg border border-stone-300 font-bold bg-stone-50"
											>
												<option value="new">جديد (New)</option>
												<option value="contacted">تم التواصل (Contacted)</option>
												<option value="qualified">مؤهل للشراء (Qualified)</option>
												<option value="won">تم الطلب بنجاح (Won)</option>
												<option value="lost">مغلق / ملغي (Lost)</option>
											</select>
										</div>

										<div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-1">
											<div className="flex items-center justify-between">
												<span className="font-semibold text-amber-900">
													المحصول: {lead.interestedProduct}
												</span>
												{lead.budgetAED && (
													<span className="font-bold text-stone-800">
														{lead.budgetAED} د.إ
													</span>
												)}
											</div>
											<p className="text-[11px] text-stone-500">
												الكمية: {lead.quantityEstimated} · المصدر: {lead.sourceCampaign}
											</p>
										</div>

										<div className="flex items-center justify-between pt-1 text-[11px]">
											<span className="text-stone-400">
												{new Date(lead.createdAt).toLocaleDateString("ar-AE")}
											</span>

											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleAnalyzeLead(lead);
													}}
													className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold flex items-center gap-1"
												>
													<Sparkles className="w-3 h-3 text-amber-700" />
													<span>رد الواتساب بالذكاء الاصطناعي</span>
												</button>

												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														if (confirm("هل تريد حذف هذا العميل من القائمة؟")) {
															deleteLead(lead.id);
														}
													}}
													className="p-1 text-stone-400 hover:text-rose-600 rounded"
													title="حذف"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* AI Assistant Output Card (1 Column on Desktop) */}
				<div className="bg-white p-5 rounded-2xl border border-[#E8DCCB] shadow-sm space-y-4">
					<div className="flex items-center gap-2 border-b border-stone-200 pb-3">
						<div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center">
							<Sparkles className="w-4 h-4 text-amber-700" />
						</div>
						<div>
							<h3 className="font-serif text-base font-bold text-[#2C2014]">
								مستشار الذكاء الاصطناعي
							</h3>
							<p className="text-[10px] text-stone-500">
								صياغة الرسائل وتحليل رغبة الشراء
							</p>
						</div>
					</div>

					{selectedLead ? (
						<div className="space-y-4 text-xs">
							{/* Lead Basic info */}
							<div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
								<p className="font-bold text-stone-900 text-sm">
									{selectedLead.customerName}
								</p>
								<p className="text-[11px] text-stone-500">
									{selectedLead.emirate} · {selectedLead.interestedProduct}
								</p>
							</div>

							{isAnalyzing ? (
								<div className="text-center py-8 space-y-2">
									<div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
									<p className="text-xs text-stone-500 font-medium">
										جارِ استدعاء نموذج الذكاء الاصطناعي وصياغة الرد الإماراتي...
									</p>
								</div>
							) : aiResult ? (
								<div className="space-y-4">
									{/* Score & recommendation */}
									<div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
										<div className="flex items-center justify-between">
											<span className="font-bold text-amber-950">تقييم نية العميل:</span>
											<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
												{aiResult.aiScore === "high"
													? "🔥 اهتمام عالي جداً"
													: "⚡ اهتمام متوسط"}
											</span>
										</div>
										<p className="text-[11px] text-amber-900 leading-relaxed">
											{aiResult.scoreReason}
										</p>
										{aiResult.recommendedAction && (
											<div className="pt-1 border-t border-amber-200/80 text-[11px] text-stone-700 font-medium">
												<strong>الخطوة المقترحة:</strong> {aiResult.recommendedAction}
											</div>
										)}
									</div>

									{/* WhatsApp Message Draft */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<label className="font-bold text-stone-900 text-xs flex items-center gap-1">
												<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
												<span>مسودة رسالة الواتساب المقترحة:</span>
											</label>
										</div>

										<textarea
											rows={6}
											value={aiResult.whatsappReply || ""}
											onChange={(e) =>
												setAiResult({ ...aiResult, whatsappReply: e.target.value })
											}
											className="w-full p-3 border border-stone-300 rounded-xl bg-stone-50 text-xs leading-relaxed focus:bg-white focus:outline-none focus:border-amber-800"
										/>

										<button
											onClick={() =>
												handleSendWhatsApp(
													selectedLead.phone,
													aiResult.whatsappReply || "",
												)
											}
											className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
										>
											<Send className="w-4 h-4" />
											<span>إرسال عبر الواتساب فوراً</span>
										</button>
									</div>
								</div>
							) : (
								<div className="text-center py-6">
									<button
										onClick={() => handleAnalyzeLead(selectedLead)}
										className="px-4 py-2.5 bg-[#2C2014] text-amber-200 font-bold rounded-xl text-xs hover:bg-black transition-colors"
									>
										بدء تحليل العميل بالذكاء الاصطناعي ✨
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-12 text-stone-400 space-y-2">
							<Users className="w-8 h-8 mx-auto text-stone-300" />
							<p className="text-xs">
								اختر أحد العملاء من القائمة لتشغيل مساعد الذكاء الاصطناعي وتجهيز رسالة الواتساب.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* MODAL: ADD NEW LEAD */}
			{isAddModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
					<div
						className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-[#D6BE9F] space-y-4"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between border-b pb-3">
							<h3 className="font-serif text-lg font-bold text-[#2C2014]">
								تسجيل عميل محتمل جديد (New Lead)
							</h3>
							<button onClick={() => setIsAddModalOpen(false)}>
								<X className="w-5 h-5 text-stone-400" />
							</button>
						</div>

						<form onSubmit={handleAddLeadSubmit} className="space-y-3.5 text-xs">
							<div>
								<label className="block font-semibold text-stone-800 mb-1">
									اسم العميل الكريم *
								</label>
								<input
									type="text"
									required
									value={newLeadName}
									onChange={(e) => setNewLeadName(e.target.value)}
									placeholder="مثال: سعادة محمد المزروعي"
									className="w-full p-2.5 border border-stone-300 rounded-xl"
								/>
							</div>

							<div>
								<label className="block font-semibold text-stone-800 mb-1">
									رقم الهاتف / الواتساب *
								</label>
								<input
									type="tel"
									required
									value={newLeadPhone}
									onChange={(e) => setNewLeadPhone(e.target.value)}
									placeholder="+971501234567"
									dir="ltr"
									className="w-full p-2.5 border border-stone-300 rounded-xl font-mono"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-semibold text-stone-800 mb-1">
										الإمارة
									</label>
									<select
										value={newLeadEmirate}
										onChange={(e) => setNewLeadEmirate(e.target.value)}
										className="w-full p-2.5 border border-stone-300 rounded-xl bg-white"
									>
										{emiratesList.map((em) => (
											<option key={em} value={em}>
												{em}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block font-semibold text-stone-800 mb-1">
										الميزانية التقديرية (د.إ)
									</label>
									<input
										type="number"
										value={newLeadBudget}
										onChange={(e) => setNewLeadBudget(Number(e.target.value))}
										className="w-full p-2.5 border border-stone-300 rounded-xl font-bold font-mono"
									/>
								</div>
							</div>

							<div>
								<label className="block font-semibold text-stone-800 mb-1">
									المحصول المهتم به
								</label>
								<input
									type="text"
									value={newLeadProduct}
									onChange={(e) => setNewLeadProduct(e.target.value)}
									placeholder="مثال: فقع زبيدي أبيض نخب أول"
									className="w-full p-2.5 border border-stone-300 rounded-xl"
								/>
							</div>

							<div>
								<label className="block font-semibold text-stone-800 mb-1">
									الكمية المتوقعة
								</label>
								<input
									type="text"
									value={newLeadQty}
									onChange={(e) => setNewLeadQty(e.target.value)}
									placeholder="مثال: سحارتين لضيافة المجلس"
									className="w-full p-2.5 border border-stone-300 rounded-xl"
								/>
							</div>

							<div className="pt-3 border-t flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setIsAddModalOpen(false)}
									className="px-4 py-2 border rounded-xl text-stone-600 hover:bg-stone-50"
								>
									إلغاء
								</button>
								<button
									type="submit"
									className="px-5 py-2 bg-[#2C2014] text-amber-200 font-bold rounded-xl hover:bg-black"
								>
									حفظ العميل
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};
