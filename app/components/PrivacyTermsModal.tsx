import React from "react";
import { useStore } from "../context/StoreContext";
import { Shield, FileText, Cookie, X, Lock } from "lucide-react";
import { t } from "../frontend/locales/i18n";

export const PrivacyTermsModal: React.FC = () => {
	const {
		isPrivacyModalOpen,
		setIsPrivacyModalOpen,
		privacyModalTab,
		setPrivacyModalTab,
		cookieConsent,
		setCookieConsent,
	} = useStore();

	if (!isPrivacyModalOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-right text-white">
			<div
				className="relative w-full max-w-2xl bg-[#1e1e1e] rounded-3xl shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Top Header */}
				<div className="p-5 bg-[#181818] border-b border-white/10 flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-[#f0c38e]/10 text-[#f0c38e] flex items-center justify-center">
							<Shield className="w-4 h-4 text-[#f0c38e]" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-white">
								{t("legal.title")}
							</h3>
							<p className="text-[11px] text-stone-400 font-mono">
								{t("legal.subtitle")}
							</p>
						</div>
					</div>

					<button
						onClick={() => setIsPrivacyModalOpen(false)}
						className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
						aria-label="close"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Navigation Tabs */}
				<div className="flex border-b border-white/10 bg-[#141414] px-4 text-xs font-bold font-mono">
					<button
						onClick={() => setPrivacyModalTab("privacy")}
						className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
							privacyModalTab === "privacy"
								? "border-[#f0c38e] text-[#f0c38e] bg-[#1e1e1e]"
								: "border-transparent text-stone-400 hover:text-white"
						}`}
					>
						<Lock className="w-3.5 h-3.5" />
						<span>{t("legal.privacyTab")}</span>
					</button>

					<button
						onClick={() => setPrivacyModalTab("terms")}
						className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
							privacyModalTab === "terms"
								? "border-[#f0c38e] text-[#f0c38e] bg-[#1e1e1e]"
								: "border-transparent text-stone-400 hover:text-white"
						}`}
					>
						<FileText className="w-3.5 h-3.5" />
						<span>{t("legal.termsTab")}</span>
					</button>

					<button
						onClick={() => setPrivacyModalTab("cookies")}
						className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
							privacyModalTab === "cookies"
								? "border-[#f0c38e] text-[#f0c38e] bg-[#1e1e1e]"
								: "border-transparent text-stone-400 hover:text-white"
						}`}
					>
						<Cookie className="w-3.5 h-3.5" />
						<span>{t("legal.cookiesTab")}</span>
					</button>
				</div>

				{/* Body Content */}
				<div className="flex-1 overflow-y-auto p-6 text-xs text-stone-300 leading-relaxed space-y-5">
					{/* TAB: PRIVACY POLICY */}
					{privacyModalTab === "privacy" && (
						<div className="space-y-4">
							<div className="p-3 bg-[#121212] rounded-xl border border-white/10 text-[#f0c38e] font-medium font-mono text-[11px]">
								{t("legal.privacyNote")}
							</div>

							<div className="space-y-2">
								<p>{t("legal.privacyP1")}</p>
								<p>{t("legal.privacyP2")}</p>
							</div>
						</div>
					)}

					{/* TAB: TERMS OF SERVICE */}
					{privacyModalTab === "terms" && (
						<div className="space-y-4">
							<div className="p-3 bg-[#121212] rounded-xl border border-white/10 text-stone-200 font-medium font-mono text-[11px]">
								{t("legal.termsNote")}
							</div>

							<div className="space-y-2">
								<p>{t("legal.termsP1")}</p>
								<p>{t("legal.termsP2")}</p>
							</div>
						</div>
					)}

					{/* TAB: COOKIES */}
					{privacyModalTab === "cookies" && (
						<div className="space-y-4">
							<p>{t("legal.cookiesNote")}</p>

							<div className="pt-2 flex justify-end gap-2">
								<button
									onClick={() => {
										setCookieConsent("rejected");
										setIsPrivacyModalOpen(false);
									}}
									className="px-4 py-2 border border-white/10 rounded-xl text-stone-400 hover:text-white font-mono"
								>
									{t("legal.rejectAll")}
								</button>
								<button
									onClick={() => {
										setCookieConsent("accepted");
										setIsPrivacyModalOpen(false);
									}}
									className="px-5 py-2 bg-[#f0c38e] text-[#121212] font-bold rounded-xl hover:bg-white transition-colors"
								>
									{t("legal.acceptAll")}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 bg-[#181818] border-t border-white/10 flex justify-between items-center text-xs">
					<span className="text-stone-500 font-mono">TEEN LIWA LEGAL</span>
					<button
						onClick={() => setIsPrivacyModalOpen(false)}
						className="px-5 py-2 bg-[#f0c38e] text-[#121212] font-bold rounded-xl hover:bg-white transition-colors"
					>
						{t("legal.close")}
					</button>
				</div>
			</div>
		</div>
	);
};
