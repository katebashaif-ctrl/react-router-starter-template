import React from "react";
import { useStore } from "../context/StoreContext";
import { Shield, FileText, Cookie, X, Lock } from "lucide-react";

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
							<h3 className="font-['Syne',sans-serif] text-lg font-bold text-white">
								الخصوصية والشروط القانونية
							</h3>
							<p className="text-[11px] text-stone-400 font-mono">
								تشريعات وقوانين دولة الإمارات العربية المتحدة 🇦🇪
							</p>
						</div>
					</div>

					<button
						onClick={() => setIsPrivacyModalOpen(false)}
						className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
						aria-label="إغلاق"
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
						<span>سياسة الخصوصية</span>
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
						<span>شروط الاستخدام والخدمة</span>
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
						<span>ملفات تعريف الارتباط</span>
					</button>
				</div>

				{/* Body Content */}
				<div className="flex-1 overflow-y-auto p-6 text-xs text-stone-300 leading-relaxed space-y-5">
					{/* TAB: PRIVACY POLICY */}
					{privacyModalTab === "privacy" && (
						<div className="space-y-4">
							<div className="p-3 bg-[#121212] rounded-xl border border-white/10 text-[#f0c38e] font-medium font-mono text-[11px]">
								تلتزم «خيرات الدار» بحماية خصوصية عملائنا الكرام وفقاً للمرسوم بقانون اتحادي رقم (45) لسنة 2021 في شأن حماية البيانات الشخصية في دولة الإمارات العربية المتحدة.
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-white">١. جمع واستخدام البيانات الشخصية</h4>
								<p>
									نقوم بجمع البيانات الضرورية لتنفيذ وتوصيل الطلبات بدقة، وتتضمن: الاسم الكريم، رقم الهاتف الإماراتي، الإمارة وعنوان التوصيل المفصل، وأي ملاحظات خاصة بالإهداء أو الضيافة.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-white">٢. إعلانات Meta وFacebook Ads وPixel</h4>
								<p>
									يستخدم متجرنا تقنيات Meta Pixel وFacebook Catalog لمزامنة كتالوج المنتجات وقياس فاعلية الحملات الترويجية لمنتجات الرطب والتين والفقع، وتوجيه العروض المناسبة للعملاء المهتمين دون مشاركة أي بيانات مصرفية أو خاصة.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-white">٣. حماية وسرية المعلومات</h4>
								<p>
									نتعهد بعدم بيع أو تأجير أو مشاركة بياناتكم مع أي أطراف ثالثة لأغراض تجارية، وتقتصر مشاركة بيانات العنوان ورقم الهاتف مع فريق التوصيل المعتمد لسيارات التبريد لإتمام التسليم.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-white">٤. حقوق العميل</h4>
								<p>
									يحق لأي عميل طلب الاطلاع على بياناته المخزنة، تصحيحها، أو طلب حذفها نهائياً من سجلات المتجر عبر التواصل مع خدمة العملاء على الواتساب أو الهاتف المعتمد.
								</p>
							</div>
						</div>
					)}

					{/* TAB: TERMS OF SERVICE */}
					{privacyModalTab === "terms" && (
						<div className="space-y-4">
							<div className="p-3 bg-[#121212] rounded-xl border border-white/10 text-stone-200 font-medium font-mono text-[11px]">
								شروط وأحكام الشراء والضيافة في متجر خيرات الدار - دولة الإمارات العربية المتحدة.
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-white">١. طبيعة المحاصيل الزراعية الطازجة</h4>
								<p>
									الرطب، التين، والفقع الصحراوي هي منتجات زراعية موسمية طازجة وسريعة التأثر بالعوامل الجوية. نحرص على جنيها وتبريدها بأعلى معايير الجودة وتعبئتها في سحاحير خشبية ومخاريف وصناديق مجهزة.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-white">٢. التوصيل ومناطق التغطية</h4>
								<p>
									يتم الشحن بواسطة سيارات مبردة تغطي كافة إمارات الدولة (أبوظبي، دبي، الشارقة، العين، عجمان، رأس الخيمة، الفجيرة، وأم القيوين). التوصيل يتم خلال ٢٤ إلى ٤٨ ساعة من تأكيد الطلب.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-white">٣. سياسة الفحص والاستبدال</h4>
								<p>
									نضمن سلامة ونضارة المحصول وقت التسليم. يرجى من العميل الكريم فحص الطلب عند الاستلام. في حال وجود أي ملاحظة أو تلف ناتج عن الشحن، يرجى إشعارنا عبر الواتساب خلال ساعتين من الاستلام مع صورة لتجهيز تعويض فوري.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-white">٤. الدفع والأسعار</h4>
								<p>
									كافة الأسعار المعروضة بالدرهم الإماراتي (AED). نوفر خيارات الدفع الإلكتروني عبر بوابة Ziina المعتمدة، أو الدفع عند الاستلام نقداً أو بالبطاقة المصرفية، أو الطلب المباشر عبر الواتساب.
								</p>
							</div>
						</div>
					)}

					{/* TAB: COOKIES */}
					{privacyModalTab === "cookies" && (
						<div className="space-y-4">
							<p>
								تساعدنا ملفات تعريف الارتباط على تذكر المنتجات الموجودة في سلة التسوق الخاصة بك، وتوفير تجربة تصفح أسرع، وتكامل إعلانات Meta Facebook Ads.
							</p>

							<div className="space-y-3">
								<div className="p-3 rounded-2xl bg-[#121212] border border-white/10 flex items-center justify-between">
									<div>
										<p className="font-bold text-white">ملفات تعريف الارتباط الضرورية</p>
										<p className="text-[11px] text-stone-400">
											مطلوبة لتشغيل السلة وإتمام الطلبات وحفظ إعدادات المتجر.
										</p>
									</div>
									<span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded">
										نشطة دائماً
									</span>
								</div>

								<div className="p-3 rounded-2xl bg-[#121212] border border-white/10 flex items-center justify-between">
									<div>
										<p className="font-bold text-white">ملفات Meta & Facebook Pixel الترويجية</p>
										<p className="text-[11px] text-stone-400">
											تسمح بعرض إعلانات مخصصة لمنتجات الرطب والتين في فيسبوك وانستغرام.
										</p>
									</div>
									<span className="text-[10px] bg-[#f0c38e]/20 text-[#f0c38e] font-mono font-bold px-2 py-0.5 rounded">
										{cookieConsent === "accepted" ? "مفعلة" : "غير مفعلة"}
									</span>
								</div>
							</div>

							<div className="pt-2 flex justify-end gap-2">
								<button
									onClick={() => {
										setCookieConsent("rejected");
										setIsPrivacyModalOpen(false);
									}}
									className="px-4 py-2 border border-white/10 rounded-xl text-stone-400 hover:text-white font-mono"
								>
									رفض ملفات التتبع الإعلاني
								</button>
								<button
									onClick={() => {
										setCookieConsent("accepted");
										setIsPrivacyModalOpen(false);
									}}
									className="px-5 py-2 bg-[#f0c38e] text-[#121212] font-bold rounded-xl hover:bg-white transition-colors"
								>
									الموافقة على جميع ملفات الارتباط
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 bg-[#181818] border-t border-white/10 flex justify-between items-center text-xs">
					<span className="text-stone-500 font-mono">OCTOBER 2026 EDITION</span>
					<button
						onClick={() => setIsPrivacyModalOpen(false)}
						className="px-5 py-2 bg-[#f0c38e] text-[#121212] font-bold rounded-xl hover:bg-white transition-colors"
					>
						إغلاق
					</button>
				</div>
			</div>
		</div>
	);
};
