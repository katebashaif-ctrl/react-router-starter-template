import React from "react";

interface LogoProps {
	className?: string;
	showText?: boolean;
	variant?: "header" | "footer" | "hero" | "compact";
}

export const Logo: React.FC<LogoProps> = ({
	className = "",
	variant = "header",
}) => {
	const titleSizes = {
		compact: "text-lg font-bold",
		header: "text-2xl sm:text-3xl font-extrabold",
		hero: "text-3xl sm:text-4xl font-extrabold",
		footer: "text-2xl font-bold",
	}[variant];

	const titleColor = {
		compact: "text-[#2C2014]",
		header: "text-[#2C2014]",
		hero: "text-[#2C2014]",
		footer: "text-[#FAF7F2]",
	}[variant];

	const subtitleColor = {
		compact: "text-stone-500",
		header: "text-[#8B5A2B]",
		hero: "text-[#8B5A2B]",
		footer: "text-stone-300",
	}[variant];

	return (
		<div className={`flex flex-col text-right leading-tight select-none ${className}`}>
			<span className={`font-serif ${titleSizes} tracking-tight ${titleColor} transition-colors group-hover:text-[#DE2A2D]`}>
				تِين لِيوَا
			</span>
			<span className={`text-[10px] sm:text-[11px] font-semibold ${subtitleColor} tracking-wide flex items-center gap-1`}>
				<span>مزارع ليوا</span>
				<span className="text-[#DE2A2D]">·</span>
				<span>الإمارات 🇦🇪</span>
			</span>
		</div>
	);
};
