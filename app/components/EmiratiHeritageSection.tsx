import React from "react";
import { Sparkles } from "lucide-react";
import { t } from "../frontend/locales/i18n";

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
						<span>{t("heritage.badge")}</span>
					</div>
					<h2 className="font-serif text-3xl font-bold text-[#2C2014]">
						{t("heritage.title")}
					</h2>
					<p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
						{t("heritage.paragraph1")}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Story 1 */}
					<div className="bg-white p-6 rounded-2xl border border-[#D6BE9F]/60 shadow-sm space-y-3">
						<span className="text-2xl">🌴</span>
						<h3 className="font-serif text-lg font-bold text-[#2C2014]">
							{t("heritage.feature1Title")}
						</h3>
						<p className="text-xs text-stone-600 leading-relaxed">
							{t("heritage.feature1Desc")}
						</p>
						<p className="text-[11px] font-semibold text-[#8B5A2B]">
							{t("hero.statsPureHeritage")}
						</p>
					</div>

					{/* Story 2 */}
					<div className="bg-white p-6 rounded-2xl border border-[#D6BE9F]/60 shadow-sm space-y-3">
						<span className="text-2xl">🍃</span>
						<h3 className="font-serif text-lg font-bold text-[#2C2014]">
							{t("heritage.feature2Title")}
						</h3>
						<p className="text-xs text-stone-600 leading-relaxed">
							{t("heritage.feature2Desc")}
						</p>
						<p className="text-[11px] font-semibold text-[#DE2A2D]">
							{t("hero.pillSameDay")}
						</p>
					</div>

					{/* Story 3 */}
					<div className="bg-white p-6 rounded-2xl border border-[#D6BE9F]/60 shadow-sm space-y-3">
						<span className="text-2xl">✨</span>
						<h3 className="font-serif text-lg font-bold text-[#2C2014]">
							{t("heritage.feature3Title")}
						</h3>
						<p className="text-xs text-stone-600 leading-relaxed">
							{t("heritage.feature3Desc")}
						</p>
						<p className="text-[11px] font-semibold text-[#8B5A2B]">
							{t("hero.pill100Emirati")}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};
