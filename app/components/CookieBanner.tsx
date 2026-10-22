import React from "react";
import { useStore } from "../context/StoreContext";
import { Shield, Cookie, X } from "lucide-react";

export const CookieBanner: React.FC = () => {
	const { cookieConsent, setCookieConsent, openPrivacyPolicy } = useStore();

	if (cookieConsent !== null) return null;

	return (
		<div className="fixed bottom-4 right-4 left-4 md:right-8 md:left-auto md:max-w-xl z-50 animate-slideUp text-right">
			<div className="bg-[#2C2014]/95 backdrop-blur-md text-[#F5EFE6] p-4 sm:p-5 rounded-2xl border border-[#D6BE9F]/40 shadow-2xl space-y-3">
				<div className="flex items-start gap-3">
					<div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
						<Cookie className="w-4 h-4 text-amber-400" />
					</div>
					<div className="space-y-1 flex-1">
						<h4 className="text-xs font-bold text-white flex items-center gap-1.5">
							<span>ملفات تعريف الارتباط والخصوصية</span>
							<span className="text-[10px] text-amber-400 font-normal">
								(مرسوم اتحادي رقم 45)
							</span>
						</h4>
						<p className="text-[11px] text-stone-300 leading-relaxed">
							نستخدم ملفات تعريف الارتباط وتحليلات Meta Facebook Ads لتحسين تجربة تصفح المحاصيل
							وتقديم عروض موثوقة. يمكنك الاطلاع على{" "}
							<button
								onClick={() => openPrivacyPolicy("privacy")}
								className="text-amber-300 underline underline-offset-2 hover:text-white"
							>
								سياسة الخصوصية
							</button>{" "}
							و{" "}
							<button
								onClick={() => openPrivacyPolicy("terms")}
								className="text-amber-300 underline underline-offset-2 hover:text-white"
							>
								شروط الاستخدام
							</button>
							.
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-[#574127]/60">
					<button
						onClick={() => openPrivacyPolicy("cookies")}
						className="px-3 py-1.5 text-[11px] text-stone-400 hover:text-stone-200"
					>
						تخصيص الخيارات
					</button>

					<button
						onClick={() => setCookieConsent("rejected")}
						className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-medium rounded-lg transition-colors"
					>
						الضرورية فقط
					</button>

					<button
						onClick={() => setCookieConsent("accepted")}
						className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-bold rounded-lg transition-colors shadow-sm"
					>
						الموافقة والمتابعة
					</button>
				</div>
			</div>
		</div>
	);
};
