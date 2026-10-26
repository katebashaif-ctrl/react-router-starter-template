import React from "react";
import { useStore } from "../context/StoreContext";
import { ArrowLeft, Award, ShieldCheck, Truck, Sparkles } from "lucide-react";

export const Hero: React.FC = () => {
	const { setActiveCategory } = useStore();

	const handleScrollToCatalog = (cat?: "rutab" | "fig" | "faqa" | "boxes") => {
		if (cat) setActiveCategory(cat);
		const el = document.getElementById("catalog-section");
		if (el) el.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<section className="relative overflow-hidden bg-[#FAF7F2] border-b border-[#E8DCCB]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
				{/* Main Split Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
					{/* Text Column */}
					<div className="lg:col-span-6 flex flex-col justify-center space-y-6 text-right">
						<div className="flex items-center gap-2 text-xs font-semibold text-[#8B5A2B]">
							<span className="w-2.5 h-2.5 rounded-full bg-[#DE2A2D] animate-pulse"></span>
							<span className="text-[#DE2A2D] font-bold">مزرعة تين ليوا 🇦🇪</span>
							<span aria-hidden="true">·</span>
							<span>القص والتوصيل في نفس اليوم لجميع الإمارات</span>
						</div>

						<h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#2C2014] leading-[1.25] tracking-tight">
							تين ليوا الطازج كالعسل <br />
							<span className="text-[#DE2A2D]">وأفخر تمور وفقع الإمارات</span>
						</h1>

						<p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
							مباشرة من مزارع ليوا الغنّاء إلى باب منزلكم: تين أحمر وأصفر طازج مقطوف بعناية فجر كل يوم،
							تمور جلاكسي سكري وصقعي وإخلاص فاخرة، فقع درجة أولى، ولوز محلي ومكسرات طبيعية.
						</p>

						{/* CTAs */}
						<div className="flex flex-wrap items-center gap-3 pt-2">
							<button
								onClick={() => handleScrollToCatalog()}
								className="flex items-center gap-2 px-6 py-3.5 bg-[#2C2014] text-amber-200 text-sm font-semibold rounded-xl hover:bg-[#DE2A2D] hover:text-white transition-all shadow-md active:scale-95"
							>
								<span>تصفح كافة المنتجات</span>
								<ArrowLeft className="w-4 h-4 text-amber-400" />
							</button>

							<a
								href="https://wa.me/971504020220"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 px-5 py-3.5 bg-emerald-800 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
							>
								<span>اطلب عبر الواتساب: 0504020220</span>
							</a>
						</div>

						{/* Quick category shortcuts */}
						<div className="flex flex-wrap items-center gap-3 pt-4 text-xs text-stone-500 border-t border-[#E8DCCB]/60">
							<span className="font-bold text-stone-800">الأصناف المتاحة:</span>
							<button
								onClick={() => handleScrollToCatalog("fig")}
								className="hover:text-[#DE2A2D] font-medium underline underline-offset-4"
							>
								تين أحمر وأصفر
							</button>
							<span aria-hidden="true">·</span>
							<button
								onClick={() => handleScrollToCatalog("rutab")}
								className="hover:text-[#DE2A2D] font-medium underline underline-offset-4"
							>
								تمر سكري وصقعي
							</button>
							<span aria-hidden="true">·</span>
							<button
								onClick={() => handleScrollToCatalog("faqa")}
								className="hover:text-[#DE2A2D] font-medium underline underline-offset-4"
							>
								فقع 400 جرام
							</button>
							<span aria-hidden="true">·</span>
							<button
								onClick={() => handleScrollToCatalog()}
								className="hover:text-[#DE2A2D] font-medium underline underline-offset-4"
							>
								لوز وتوت وصبار
							</button>
						</div>
					</div>

					{/* Image Column */}
					<div className="lg:col-span-6 relative">
						<div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#D6BE9F]/60 aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] bg-stone-100">
							<img
								src="/images/redfig.jpg"
								alt="صندوق تين أحمر طازج من مزارع تين ليوا"
								referrerPolicy="no-referrer"
								className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
							/>
							{/* Subtle contrast gradient scrim for text legibility */}
							<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>

							{/* Floating authenticity note on image */}
							<div className="absolute bottom-4 right-4 left-4 bg-[#2C2014]/90 backdrop-blur-md p-4 rounded-xl border border-amber-900/40 text-amber-100 text-xs flex items-center justify-between">
								<div>
									<p className="font-bold text-white text-sm">مزرعة تين ليوا 🇦🇪</p>
									<p className="text-stone-300 text-[11px] mt-0.5">
										القص والتوصيل في نفس اليوم · هاتف: 0504020220
									</p>
								</div>
								<span className="px-3 py-1 bg-[#DE2A2D] text-white rounded-lg text-xs font-bold shadow-sm">
									طبيعي كالعسل
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* 4-Pillar Strip Below Hero */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#E8DCCB]">
					<div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#E8DCCB]/60">
						<div className="w-10 h-10 rounded-lg bg-[#F5EFE6] text-[#8B5A2B] flex items-center justify-center shrink-0">
							<Sparkles className="w-5 h-5 text-amber-700" />
						</div>
						<div>
							<h4 className="text-xs font-bold text-stone-900">قطاف فجر اليوم</h4>
							<p className="text-[11px] text-stone-500 mt-0.5">
								جني يدوي فجر كل يوم للحفاظ على الرطوبة
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#E8DCCB]/60">
						<div className="w-10 h-10 rounded-lg bg-[#F5EFE6] text-[#8B5A2B] flex items-center justify-center shrink-0">
							<Award className="w-5 h-5 text-amber-700" />
						</div>
						<div>
							<h4 className="text-xs font-bold text-stone-900">مزارع وصحاري وطنية</h4>
							<p className="text-[11px] text-stone-500 mt-0.5">
								أصناف أصلية من ليوا والعين والذيد
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#E8DCCB]/60">
						<div className="w-10 h-10 rounded-lg bg-[#F5EFE6] text-[#8B5A2B] flex items-center justify-center shrink-0">
							<ShieldCheck className="w-5 h-5 text-amber-700" />
						</div>
						<div>
							<h4 className="text-xs font-bold text-stone-900">تغليف مبرد فاخر</h4>
							<p className="text-[11px] text-stone-500 mt-0.5">
								سحاحير خشبية ومخاريف خوص للإهداء
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#E8DCCB]/60">
						<div className="w-10 h-10 rounded-lg bg-[#F5EFE6] text-[#8B5A2B] flex items-center justify-center shrink-0">
							<Truck className="w-5 h-5 text-amber-700" />
						</div>
						<div>
							<h4 className="text-xs font-bold text-stone-900">توصيل مبرد لكافة الإمارات</h4>
							<p className="text-[11px] text-stone-500 mt-0.5">
								سيارات مجهزة تصلكم خلال ٢٤ ساعة
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
