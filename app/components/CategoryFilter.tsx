import React from "react";
import { useStore } from "../context/StoreContext";
import type { ProductCategory } from "../types/store";
import { Search } from "lucide-react";

export const CategoryFilter: React.FC = () => {
	const { activeCategory, setActiveCategory, searchQuery, setSearchQuery, products } = useStore();

	const categories: { id: ProductCategory | "all"; label: string; count: number }[] = [
		{ id: "all", label: "جميع الخيرات", count: products.length },
		{ id: "rutab", label: "رطب الإمارات", count: products.filter((p) => p.category === "rutab").length },
		{ id: "fig", label: "تين المزارع", count: products.filter((p) => p.category === "fig").length },
		{ id: "faqa", label: "فقع الصحراء", count: products.filter((p) => p.category === "faqa").length },
		{ id: "boxes", label: "صناديق الإهداء", count: products.filter((p) => p.category === "boxes").length },
	];

	return (
		<div className="space-y-4 mb-8">
			{/* Top bar with heading, search input, and counts */}
			<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
				<div>
					<h2 className="font-serif text-2xl font-bold text-[#2C2014]">
						محصول ومنتجات الدار
					</h2>
					<p className="text-xs text-stone-500 mt-1">
						اختر الصنف المطلوب واستمتع بقطاف الموسم المضمون
					</p>
				</div>

				{/* Search input */}
				<div className="relative w-full md:w-72">
					<Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="ابحث بالاسم أو المزرعة أو الصنف..."
						className="w-full pl-4 pr-9 py-2 text-xs bg-white border border-[#D6BE9F] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-colors"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs px-1"
						>
							مسح
						</button>
					)}
				</div>
			</div>

			{/* Segmented Category Buttons */}
			<div className="flex items-center gap-1.5 p-1 bg-[#F5EFE6] rounded-xl overflow-x-auto scrollbar-none border border-[#E8DCCB]">
				{categories.map((cat) => {
					const isActive = activeCategory === cat.id;
					return (
						<button
							key={cat.id}
							onClick={() => setActiveCategory(cat.id)}
							className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
								isActive
									? "bg-[#2C2014] text-amber-200 shadow-sm"
									: "text-[#574127] hover:text-[#2C2014] hover:bg-white/60"
							}`}
						>
							<span>{cat.label}</span>
							<span
								className={`text-[11px] px-1.5 py-0.2 rounded font-medium tabular-nums ${
									isActive
										? "bg-amber-500/20 text-amber-300"
										: "bg-stone-200/60 text-stone-600"
								}`}
							>
								{cat.count}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
};
