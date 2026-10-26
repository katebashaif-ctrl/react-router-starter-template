import React from "react";
import { Sparkles, Compass, Heart } from "lucide-react";

export const EmiratiHeritageSection: React.FC = () => {
	return (
		<section
			id="heritage-section"
			className="py-16 bg-[#F5EFE6] border-y border-[#E8DCCB] text-right"
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
				<div className="max-w-2xl mx-auto text-center space-y-3">
					<div className="flex items-center justify-center gap-2 text-xs font-bold text-[#8B5A2B]">
						<Sparkles className="w-4 h-4 text-amber-600" />
						<span>أصالة الأرض وتراث الأجداد</span>
					</div>
					<h2 className="font-serif text-3xl font-bold text-[#2C2014]">
						قصة خيرات الإمارات من البر إلى الواحة
					</h2>
					<p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
						ارتبط أهل الإمارات منذ القدم بخيرات أرضهم المعطاءة؛ من قيظ النخيل إلى
						أمطار الوسم التي تُنبت الفقع في الرمال.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Story 1: Rutab & Qaith */}
					<div className="bg-white p-6 rounded-2xl border border-[#D6BE9F]/60 shadow-sm space-y-3">
						<span className="text-2xl">🌴</span>
						<h3 className="font-serif text-lg font-bold text-[#2C2014]">
							موسم القيظ والمخرافة
						</h3>
						<p className="text-xs text-stone-600 leading-relaxed">
							في شهور الصيف، تزهو واحات العين ومحاضر ليوا بأبهى ألوان الرطب.
							كان آباؤنا ينسجون "المخرافة" من خوص النخيل ليجنوا فيها أطيب
							عراجين الخلاص والدباس وبومعان، لتكون أول ما يُقدم لإكرام الضيف.
						</p>
						<p className="text-[11px] font-semibold text-[#8B5A2B]">
							واحات ليوا والعين · تراث عريق
						</p>
					</div>

					{/* Story 2: Fresh Liwa Figs */}
					<div className="bg-white p-6 rounded-2xl border border-[#D6BE9F]/60 shadow-sm space-y-3">
						<span className="text-2xl">🍃</span>
						<h3 className="font-serif text-lg font-bold text-[#2C2014]">
							مزارع تين ليوا والقص الطازج
						</h3>
						<p className="text-xs text-stone-600 leading-relaxed">
							تشتهر مزارع تين ليوا بإنتاج أطيب سلالات التين الأحمر والأصفر الطازج، حيث يُقطف يومياً مع بزوغ الفجر بنظام القص والتوصيل في نفس اليوم ليبقى عسلياً وطرياً بأعلى معايير الجودة الإماراتية.
						</p>
						<p className="text-[11px] font-semibold text-[#DE2A2D]">
							مزارع تين ليوا · القص والتوصيل في نفس اليوم
						</p>
					</div>

					{/* Story 3: Desert Truffles */}
					<div className="bg-white p-6 rounded-2xl border border-[#D6BE9F]/60 shadow-sm space-y-3">
						<span className="text-2xl">✨</span>
						<h3 className="font-serif text-lg font-bold text-[#2C2014]">
							فقع الصحراء بعد أمطار الوسم
						</h3>
						<p className="text-xs text-stone-600 leading-relaxed">
							"الزبيدي والخلاسي" هبة السماء لصحراء الظفرة وسويحان. يخرج البدو
							وهواة المقناص بعد رعود الشتاء لتتبع تشققات الأرض الرملية بحثاً
							عن الكمأة الصحراوية ذات الرائحة العطرية الآسرة.
						</p>
						<p className="text-[11px] font-semibold text-[#8B5A2B]">
							صحراء الظفرة · قطاف يدوي نادر
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};
