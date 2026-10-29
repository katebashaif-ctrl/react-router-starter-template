import React from "react";
import { useStore } from "../context/StoreContext";
import { Cookie } from "lucide-react";
import { t } from "../frontend/locales/i18n";

export const CookieBanner: React.FC = () => {
	const { cookieConsent, setCookieConsent, openPrivacyPolicy } = useStore();

	if (cookieConsent !== null) return null;

	return (
		<div className="fixed bottom-4 right-4 left-4 md:right-24 md:left-auto md:max-w-xl z-50 animate-slideUp text-right">
			<div className="bg-[#1e1e1e]/95 backdrop-blur-md text-stone-200 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-2xl space-y-3">
				<div className="flex items-start gap-3">
					<div className="w-8 h-8 rounded-lg bg-[#f0c38e]/10 text-[#f0c38e] border border-[#f0c38e]/20 flex items-center justify-center shrink-0 mt-0.5">
						<Cookie className="w-4 h-4 text-[#f0c38e]" />
					</div>
					<div className="space-y-1 flex-1">
						<h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
							<span>{t("cookies.title")}</span>
						</h4>
						<p className="text-[11px] text-stone-400 leading-relaxed">
							{t("cookies.desc")}{" "}
							<button
								onClick={() => openPrivacyPolicy("privacy")}
								className="text-[#f0c38e] underline underline-offset-2 hover:text-white"
							>
								{t("footer.privacyPolicy")}
							</button>{" "}
							&amp;{" "}
							<button
								onClick={() => openPrivacyPolicy("terms")}
								className="text-[#f0c38e] underline underline-offset-2 hover:text-white"
							>
								{t("footer.termsOfService")}
							</button>
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/10">
					<button
						onClick={() => openPrivacyPolicy("cookies")}
						className="px-3 py-1.5 text-[11px] text-stone-400 hover:text-white font-mono"
					>
						{t("cookies.customize")}
					</button>

					<button
						onClick={() => setCookieConsent("rejected")}
						className="px-3 py-1.5 bg-[#121212] hover:bg-white/10 text-stone-300 text-xs font-medium rounded-lg transition-colors border border-white/10"
					>
						{t("cookies.reject")}
					</button>

					<button
						onClick={() => setCookieConsent("accepted")}
						className="px-4 py-1.5 bg-[#f0c38e] hover:bg-white text-[#121212] text-xs font-bold rounded-lg transition-colors shadow-sm font-mono"
					>
						{t("cookies.accept")}
					</button>
				</div>
			</div>
		</div>
	);
};
