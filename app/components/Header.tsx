import React from "react";
import { useStore } from "../context/StoreContext";
import { ShoppingBag, LayoutDashboard, Store } from "lucide-react";

export const Header: React.FC = () => {
	const {
		currentView,
		setCurrentView,
		cartItemsCount,
		setIsCartOpen,
		setActiveCategory,
		openCmsProtected,
	} = useStore();

	const handleCategoryClick = (cat: "rutab" | "fig" | "faqa" | "all") => {
		setCurrentView("store");
		setActiveCategory(cat);
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
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
				{/* Zone 1: Brand Wordmark (Single Text Element) */}
				<button
					onClick={() => {
						setCurrentView("store");
						setActiveCategory("all");
						window.scrollTo({ top: 0, behavior: "smooth" });
					}}
					className="flex items-center gap-2.5 text-right whitespace-nowrap shrink-0 group focus:outline-none"
				>
					<span className="w-9 h-9 rounded-lg bg-[#574127] text-amber-300 flex items-center justify-center font-serif text-xl font-bold shadow-sm group-hover:bg-[#2C2014] transition-colors">
						خ
					</span>
					<span className="flex flex-col text-right">
						<span className="font-serif text-2xl font-bold tracking-tight text-[#2C2014] group-hover:text-amber-900 transition-colors">
							خيرات الدار
						</span>
						<span className="text-[11px] font-medium text-stone-500 tracking-wider">
							تين · رطب · فقع إماراتي
						</span>
					</span>
				</button>

				{/* Zone 2: 4-5 concise single-line text navigation links */}
				<nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-700">
					<button
						onClick={() => handleCategoryClick("all")}
						className="hover:text-amber-900 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						المتجر
					</button>
					<button
						onClick={() => handleCategoryClick("rutab")}
						className="hover:text-amber-900 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						رطب ليوا والعين
					</button>
					<button
						onClick={() => handleCategoryClick("fig")}
						className="hover:text-amber-900 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						تين الذيد وحتا
					</button>
					<button
						onClick={() => handleCategoryClick("faqa")}
						className="hover:text-amber-900 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						فقع الصحراء
					</button>
					<button
						onClick={handleStoryClick}
						className="hover:text-amber-900 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
					>
						تراثنا الإماراتي
					</button>
				</nav>

				{/* Zone 3: Primary Action & Controls */}
				<div className="flex items-center gap-3 shrink-0">
					{/* CMS Toggle with Admin Protection */}
					<button
						onClick={() => {
							if (currentView === "cms") {
								setCurrentView("store");
							} else {
								openCmsProtected();
							}
						}}
						className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
							currentView === "cms"
								? "bg-amber-900 text-white shadow-sm hover:bg-amber-800"
								: "bg-[#F5EFE6] text-[#574127] border border-[#E8DCCB] hover:bg-[#E8DCCB]"
						}`}
						title={currentView === "cms" ? "العودة للمتجر" : "دخول المشرف إلى لوحة تحكم CMS"}
					>
						{currentView === "cms" ? (
							<>
								<Store className="w-4 h-4 text-amber-300" />
								<span className="hidden sm:inline">عرض المتجر</span>
							</>
						) : (
							<>
								<LayoutDashboard className="w-4 h-4 text-amber-700" />
								<span>لوحة التحكم CMS</span>
							</>
						)}
					</button>

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
