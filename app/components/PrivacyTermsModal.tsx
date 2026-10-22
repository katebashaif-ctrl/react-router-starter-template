import React from "react";
import { useStore } from "../context/StoreContext";
import { Shield, FileText, Cookie, X, CheckCircle2, Lock } from "lucide-react";

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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn text-right">
			<div
				className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#D6BE9F] max-h-[90vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Top Header */}
				<div className="p-5 bg-[#FAF7F2] border-b border-[#E8DCCB] flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center">
							<Shield className="w-4 h-4 text-amber-700" />
						</div>
						<div>
							<h3 className="font-serif text-lg font-bold text-[#2C2014]">
								الخصوصية والشروط القانونية
							</h3>
							<p className="text-[11px] text-stone-500">
								وفقاً لتشريعات وقوانين دولة الإمارات العربية المتحدة 🇦🇪
							</p>
						</div>
					</div>

					<button
						onClick={() => setIsPrivacyModalOpen(false)}
						className="p-1.5 text-stone-400 hover:text-black hover:bg-stone-200/50 rounded-lg transition-colors"
						aria-label="إغلاق"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Navigation Tabs */}
				<div className="flex border-b border-stone-200 bg-stone-50 px-4 text-xs font-bold">
					<button
						onClick={() => setPrivacyModalTab("privacy")}
						className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
							privacyModalTab === "privacy"
								? "border-amber-800 text-amber-900 bg-white"
								: "border-transparent text-stone-600 hover:text-stone-900"
						}`}
					>
						<Lock className="w-3.5 h-3.5" />
						<span>سياسة الخصوصية</span>
					</button>

					<button
						onClick={() => setPrivacyModalTab("terms")}
						className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
							privacyModalTab === "terms"
								? "border-amber-800 text-amber-900 bg-white"
								: "border-transparent text-stone-600 hover:text-stone-900"
						}`}
					>
						<FileText className="w-3.5 h-3.5" />
						<span>شروط الاستخدام والخدمة</span>
					</button>

					<button
						onClick={() => setPrivacyModalTab("cookies")}
						className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
							privacyModalTab === "cookies"
								? "border-amber-800 text-amber-900 bg-white"
								: "border-transparent text-stone-600 hover:text-stone-900"
						}`}
					>
						<Cookie className="w-3.5 h-3.5" />
						<span>ملفات تعريف الارتباط</span>
					</button>
				</div>

				{/* Body Content */}
				<div className="flex-1 overflow-y-auto p-6 text-xs text-stone-600 leading-relaxed space-y-5">
					{/* TAB: PRIVACY POLICY */}
					{privacyModalTab === "privacy" && (
						<div className="space-y-4">
							<div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-medium">
								تلتزم «خيرات الدار» بحماية خصوصية عملائنا الكرام وفقاً للمرسوم بقانون اتحادي رقم (45) لسنة 2021 في شأن حماية البيانات الشخصية في دولة الإمارات العربية المتحدة.
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[#2C2014]">١. جمع واستخدام البيانات الشخصية</h4>
								<p>
									نقوم بجمع البيانات الضرورية لتنفيذ وتوصيل الطلبات بدقة، وتتضمن: الاسم الكريم، رقم الهاتف الإماراتي، الإمارة وعنوان التوصيل المفصل، وأي ملاحظات خاصة بالإهداء أو الضيافة.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[#2C2014]">٢. إعلانات Meta وFacebook Ads وPixel</h4>
								<p>
									يستخدم متجرنا تقنيات Meta Pixel وFacebook Catalog لمزامنة كتالوج المنتجات وقياس فاعلية الحملات الترويجية لمنتجات الرطب والتين والفقع، وتوجيه العروض المناسبة للعملاء المهتمين دون مشاركة أي بيانات مصرفية أو خاصة.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[#2C2014]">٣. حماية وسرية المعلومات</h4>
								<p>
									نتعهد بعدم بيع أو تأجير أو مشاركة بياناتكم مع أي أطراف ثالثة لأغراض تجارية، وتقتصر مشاركة بيانات العنوان ورقم الهاتف مع فريق التوصيل المعتمد لسيارات التبريد لإتمام التسليم.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[#2C2014]">٤. حقوق العميل</h4>
								<p>
									يحق لأي عميل طلب الاطلاع على بياناته المخزنة، تصحيحها، أو طلب حذفها نهائياً من سجلات المتجر عبر التواصل مع خدمة العملاء على الواتساب أو الهاتف المعتمد.
								</p>
							</div>
						</div>
					)}

					{/* TAB: TERMS OF SERVICE */}
					{privacyModalTab === "terms" && (
						<div className="space-y-4">
							<div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 font-medium">
								شروط وأحكام الشراء والضيافة في متجر خيرات الدار - دولة الإمارات العربية المتحدة.
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[#2C2014]">١. طبيعة المحاصيل الزراعية الطازجة</h4>
								<p>
									الرطب، التين، والفقع الصحراوي هي منتجات زراعية موسمية طازجة وسريعة التأثر بالعوامل الجوية. نحرص على جنيها وتبريدها بأعلى معايير الجودة وتعبئتها في سحاحير خشبية ومخاريف وصناديق مجهزة.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[#2C2014]">٢. التوصيل ومناطق التغطية</h4>
								<p>
									يتم الشحن بواسطة سيارات مبردة تغطي كافة إمارات الدولة (أبوظبي، دبي، الشارقة، العين، عجمان، رأس الخيمة، الفجيرة، وأم القيوين). التوصيل يتم خلال ٢٤ إلى ٤٨ ساعة من تأكيد الطلب.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[#2C2014]">٣. سياسة الفحص والاستبدال</h4>
								<p>
									نضمن سلامة ونضارة المحصول وقت التسليم. يرجى من العميل الكريم فحص الطلب عند الاستلام. في حال وجود أي ملاحظة أو تلف ناتج عن الشحن، يرجى إشعارنا عبر الواتساب خلال ساعتين من الاستلام مع صورة لتجهيز تعويض فوري.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="font-bold text-sm text-[#2C2014]">٤. الدفع والأسعار</h4>
								<p>
									كافة الأسعار المعروضة بالدرهم الإماراتي (د.إ AED). نوفر خيارات الدفع عند الاستلام نقداً أو بالبطاقة المصرفية لجهاز نقطة البيع المحمول مع مندوب التوصيل، أو الطلب المباشر عبر الواتساب.
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
								<div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
									<div>
										<p className="font-bold text-stone-900">ملفات تعريف الارتباط الضرورية</p>
										<p className="text-[11px] text-stone-500">
											مطلوبة لتشغيل السلة وإتمام الطلبات وحفظ إعدادات المتجر.
										</p>
									</div>
									<span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
										نشطة دائماً
									</span>
								</div>

								<div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
									<div>
										<p className="font-bold text-stone-900">ملفات Meta & Facebook Pixel الترويجية</p>
										<p className="text-[11px] text-stone-500">
											تسمح بعرض إعلانات مخصصة لمنتجات الرطب والتين في فيسبوك وانستغرام.
										</p>
									</div>
									<span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
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
									className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 font-medium"
								>
									رفض ملفات التتبع الإعلاني
								</button>
								<button
									onClick={() => {
										setCookieConsent("accepted");
										setIsPrivacyModalOpen(false);
									}}
									className="px-5 py-2 bg-[#2C2014] text-amber-200 font-bold rounded-lg hover:bg-black"
								>
									الموافقة على جميع ملفات الارتباط
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 bg-[#FAF7F2] border-t border-stone-200 flex justify-between items-center text-xs">
					<span className="text-stone-400">آخر تحديث: أكتوبر ٢٠٢٦</span>
					<button
						onClick={() => setIsPrivacyModalOpen(false)}
						className="px-5 py-2 bg-[#2C2014] text-amber-200 font-bold rounded-lg hover:bg-black"
					>
						إغلاق
					</button>
				</div>
			</div>
		</div>
	);
};
