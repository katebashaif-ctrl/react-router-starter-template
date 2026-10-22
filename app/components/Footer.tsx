import React from "react";
import { useStore } from "../context/StoreContext";
import { Phone, MessageSquare, MapPin, Shield, Lock, FileText, Share2 } from "lucide-react";

export const Footer: React.FC = () => {
	const {
		settings,
		setCurrentView,
		setActiveCategory,
		openCmsProtected,
		openPrivacyPolicy,
	} = useStore();

	const handleNav = (cat: "rutab" | "fig" | "faqa" | "boxes" | "all") => {
		setCurrentView("store");
		setActiveCategory(cat);
		const el = document.getElementById("catalog-section");
		if (el) el.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<footer className="bg-[#2C2014] text-[#E8DCCB] border-t border-[#574127] pt-12 pb-8 text-right">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* Brand Column */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-serif text-lg font-bold">
								خ
							</span>
							<h3 className="font-serif text-xl font-bold text-white">
								{settings.storeName}
							</h3>
						</div>
						<p className="text-xs text-stone-400 leading-relaxed">
							{settings.storeTagline}. نوصل أطيب رطب وتين وفقع إماراتي إلى باب
							مجلسكم مبرداً في سحاحير تراثية وصناديق إهداء فاخرة.
						</p>
					</div>

					{/* Category links */}
					<div className="space-y-2.5">
						<h4 className="text-xs font-bold text-white tracking-wider">
							أقسام المحصول الإماراتي
						</h4>
						<ul className="space-y-2 text-xs text-stone-300">
							<li>
								<button
									onClick={() => handleNav("rutab")}
									className="hover:text-amber-300 transition-colors"
								>
									رطب خلاص وبومعان ليوا والعين
								</button>
							</li>
							<li>
								<button
									onClick={() => handleNav("fig")}
									className="hover:text-amber-300 transition-colors"
								>
									تين أسود وعسلي مزارع الذيد وحتا
								</button>
							</li>
							<li>
								<button
									onClick={() => handleNav("faqa")}
									className="hover:text-amber-300 transition-colors"
								>
									فقع زبيدي وخلاسي صحراء الظفرة
								</button>
							</li>
							<li>
								<button
									onClick={() => handleNav("boxes")}
									className="hover:text-amber-300 transition-colors"
								>
									صناديق وبوكسات الضيافة والإهداء
								</button>
							</li>
						</ul>
					</div>

					{/* Legal & Compliance */}
					<div className="space-y-2.5">
						<h4 className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
							<Shield className="w-3.5 h-3.5 text-amber-400" />
							<span>الخصوصية والشروط</span>
						</h4>
						<ul className="space-y-2 text-xs text-stone-300">
							<li>
								<button
									onClick={() => openPrivacyPolicy("privacy")}
									className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
								>
									<Lock className="w-3 h-3 text-stone-400" />
									<span>سياسة الخصوصية (قانون إماراتي)</span>
								</button>
							</li>
							<li>
								<button
									onClick={() => openPrivacyPolicy("terms")}
									className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
								>
									<FileText className="w-3 h-3 text-stone-400" />
									<span>شروط الاستخدام والخدمة</span>
								</button>
							</li>
							<li>
								<button
									onClick={() => openPrivacyPolicy("cookies")}
									className="hover:text-amber-300 transition-colors"
								>
									إدارة ملفات تعريف الارتباط (Cookies)
								</button>
							</li>
							<li>
								<a
									href="/api/catalog/meta"
									target="_blank"
									rel="noreferrer"
									className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-stone-400"
								>
									<Share2 className="w-3 h-3 text-amber-400" />
									<span>خلاصة كتالوج Meta (XML Feed)</span>
								</a>
							</li>
							<li>
								<a
									href="/cms"
									className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-stone-400 font-mono text-[11px]"
								>
									<span>/cms · /admin (لوحة الإشراف)</span>
								</a>
							</li>
						</ul>
					</div>

					{/* Contact & Hours */}
					<div className="space-y-2.5">
						<h4 className="text-xs font-bold text-white tracking-wider">
							خدمة العملاء والطلبات
						</h4>
						<div className="space-y-2 text-xs text-stone-300">
							<a
								href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
							>
								<MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
								<span>طلبات واتساب المباشرة</span>
							</a>
							<a
								href={`tel:${settings.contactPhone}`}
								className="flex items-center gap-2 hover:text-amber-300 transition-colors"
							>
								<Phone className="w-3.5 h-3.5 text-amber-400" />
								<span dir="ltr">{settings.contactPhone}</span>
							</a>
							<div className="flex items-center gap-2 text-stone-400">
								<MapPin className="w-3.5 h-3.5 text-amber-400" />
								<span>الإمارات العربية المتحدة 🇦🇪</span>
							</div>
						</div>
					</div>
				</div>

				<div className="pt-8 border-t border-[#574127] flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
					<p>© {new Date().getFullYear()} خيرات الدار. جميع الحقوق محفوظة لدولة الإمارات العربية المتحدة 🇦🇪</p>
					<button
						onClick={() => {
							openCmsProtected();
							window.scrollTo({ top: 0, behavior: "smooth" });
						}}
						className="text-stone-400 hover:text-amber-300 underline underline-offset-4"
					>
						الدخول إلى لوحة تحكم CMS (مشرف فقط)
					</button>
				</div>
			</div>
		</footer>
	);
};
