import React from "react";
import { useStore } from "../context/StoreContext";
import { Phone, MessageSquare, MapPin, Shield, Lock, FileText, Share2 } from "lucide-react";
import { Logo } from "./Logo";
import { t } from "../frontend/locales/i18n";

export const Footer: React.FC = () => {
	const {
		settings,
		setCurrentView,
		setActiveCategory,
		openPrivacyPolicy,
	} = useStore();

	const handleNav = (cat: "rutab" | "fig" | "faqa" | "dates" | "all") => {
		setCurrentView("store");
		setActiveCategory(cat as any);
		const el = document.getElementById("catalog-section");
		if (el) el.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<footer className="bg-[#2C2014] text-[#E8DCCB] border-t border-[#574127] pt-12 pb-8 text-right">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* Brand Column */}
					<div className="space-y-4">
						<Logo variant="footer" />
						<p className="text-xs text-stone-300 leading-relaxed">
							{t("footer.desc")}
						</p>
						<div className="flex items-center gap-3 text-xs text-amber-200">
							<a
								href="https://instagram.com/Teen_cafu"
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-1.5 hover:text-white transition-colors"
							>
								<svg className="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
								</svg>
								<span dir="ltr">@Teen_cafu</span>
							</a>
						</div>
					</div>

					{/* Category links */}
					<div className="space-y-2.5">
						<h4 className="text-xs font-bold text-white tracking-wider">
							{t("footer.quickLinks")}
						</h4>
						<ul className="space-y-2 text-xs text-stone-300">
							<li>
								<button
									onClick={() => handleNav("fig")}
									className="hover:text-amber-300 transition-colors"
								>
									{t("nav.freshFigs")}
								</button>
							</li>
							<li>
								<button
									onClick={() => handleNav("dates")}
									className="hover:text-amber-300 transition-colors"
								>
									{t("nav.dates")}
								</button>
							</li>
							<li>
								<button
									onClick={() => handleNav("faqa")}
									className="hover:text-amber-300 transition-colors"
								>
									{t("nav.desertTruffles")}
								</button>
							</li>
							<li>
								<button
									onClick={() => handleNav("all")}
									className="hover:text-amber-300 transition-colors"
								>
									{t("nav.allProducts")}
								</button>
							</li>
						</ul>
					</div>

					{/* Legal & Compliance */}
					<div className="space-y-2.5">
						<h4 className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
							<Shield className="w-3.5 h-3.5 text-amber-400" />
							<span>{t("footer.customerCare")}</span>
						</h4>
						<ul className="space-y-2 text-xs text-stone-300">
							<li>
								<button
									onClick={() => openPrivacyPolicy("privacy")}
									className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
								>
									<Lock className="w-3 h-3 text-stone-400" />
									<span>{t("footer.privacyPolicy")}</span>
								</button>
							</li>
							<li>
								<button
									onClick={() => openPrivacyPolicy("terms")}
									className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
								>
									<FileText className="w-3 h-3 text-stone-400" />
									<span>{t("footer.termsOfService")}</span>
								</button>
							</li>
							<li>
								<button
									onClick={() => openPrivacyPolicy("cookies")}
									className="hover:text-amber-300 transition-colors"
								>
									{t("cookies.title")}
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
									<span>Meta Catalog XML Feed</span>
								</a>
							</li>
						</ul>
					</div>

					{/* Contact & Hours */}
					<div className="space-y-2.5">
						<h4 className="text-xs font-bold text-white tracking-wider">
							{t("footer.contact")}
						</h4>
						<div className="space-y-2 text-xs text-stone-300">
							<a
								href={`https://wa.me/${(settings.whatsappNumber || "971504020220").replace(/[^0-9]/g, "")}`}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
							>
								<MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
								<span>{t("announcement.orderViaWhatsapp")}</span>
							</a>
							<a
								href={`tel:${settings.contactPhone || "0504020220"}`}
								className="flex items-center gap-2 hover:text-amber-300 transition-colors"
							>
								<Phone className="w-3.5 h-3.5 text-amber-400" />
								<span dir="ltr">{settings.contactPhone || "0504020220"}</span>
							</a>
							<div className="flex items-center gap-2 text-stone-400">
								<MapPin className="w-3.5 h-3.5 text-amber-400" />
								<span>{t("footer.address")}</span>
							</div>
						</div>
					</div>
				</div>

				<div className="pt-8 border-t border-[#574127] flex flex-col sm:flex-row items-center justify-center text-center text-xs text-stone-400 gap-4">
					<p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
				</div>
			</div>
		</footer>
	);
};
