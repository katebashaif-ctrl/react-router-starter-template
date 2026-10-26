import React from "react";
import { useStore } from "../context/StoreContext";
import { ShoppingBag, Phone } from "lucide-react";
import { Logo } from "./Logo";

export const Header: React.FC = () => {
	const {
		currentView,
		setCurrentView,
		cartItemsCount,
		setIsCartOpen,
		setActiveCategory,
		settings,
	} = useStore();

	const handleCategoryClick = (cat: "rutab" | "fig" | "faqa" | "dates" | "nuts" | "all") => {
		setCurrentView("store");
		setActiveCategory(cat as any);
		const element = document.getElementById("catalog-section");
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};

	const handleStoryClick = () => {
		setCurrentView("store");
		const element = document.getElementById("heritage-section");
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<header className="sticky top-0 z-40 bg-[#FCFBF8]/95 backdrop-blur-md border-b border-[#E8DCCB] transition-all">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
				{/* Zone 1: Logo & Brand Name */}
				<button
					onClick={() => {
						setCurrentView("store");
						setActiveCategory("all");
						window.scrollTo({ top: 0, behavior: "smooth" });
					}}
					className="flex items-center gap-3 text-right whitespace-nowrap shrink-0 group focus:outline-none"
					aria-label="الرئيسية - تين ليوا"
				>
					<Logo variant="header" />
				</button>

				{/* Zone 2: Concise navigation links */}
				<nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-700">
					<button
						onClick={() => handleCategoryClick("all")}
						className="hover:text-[#DE2A2D] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						كافة المنتجات
					</button>
					<button
						onClick={() => handleCategoryClick("fig")}
						className="hover:text-[#DE2A2D] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						تين ليوا الطازج
					</button>
					<button
						onClick={() => handleCategoryClick("dates")}
						className="hover:text-[#DE2A2D] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						التمور الفاخرة
					</button>
					<button
						onClick={() => handleCategoryClick("faqa")}
						className="hover:text-[#DE2A2D] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						فقع الصحراء
					</button>
					<button
						onClick={() => handleCategoryClick("nuts")}
						className="hover:text-[#DE2A2D] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						اللوز والفواكه
					</button>
					<button
						onClick={handleStoryClick}
						className="hover:text-[#DE2A2D] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						مزارعنا في ليوا
					</button>
				</nav>

				{/* Zone 3: Direct WhatsApp / Call & Cart */}
				<div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
					<a
						href={`https://wa.me/${(settings.whatsappNumber || "971504020220").replace(/[^0-9]/g, "")}`}
						target="_blank"
						rel="noopener noreferrer"
						className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg hover:bg-emerald-100 transition-colors"
						title="تواصل مباشر عبر الواتساب"
					>
						<Phone className="w-3.5 h-3.5 text-emerald-600" />
						<span dir="ltr">0504020220</span>
					</a>

					{/* Cart Button */}
					{currentView === "store" && (
						<button
							onClick={() => setIsCartOpen(true)}
							aria-label={`حقيبة التسوق، ${cartItemsCount} عناصر`}
							className="relative flex items-center gap-2 px-3.5 py-2 bg-[#2C2014] text-amber-100 rounded-lg hover:bg-black transition-colors"
						>
							<ShoppingBag className="w-4 h-4 text-amber-300" />
							<span className="text-xs font-semibold hidden sm:inline">السلة</span>
							{cartItemsCount > 0 && (
								<span className="w-5 h-5 rounded-full bg-amber-500 text-[#2C2014] text-[11px] font-bold flex items-center justify-center tabular-nums">
									{cartItemsCount}
								</span>
							)}
						</button>
					)}
				</div>
			</div>
		</header>
	);
};
