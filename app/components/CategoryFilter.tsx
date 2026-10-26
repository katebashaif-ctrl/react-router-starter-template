import React from "react";
import { useStore } from "../context/StoreContext";
import type { ProductCategory } from "../types/store";
import { Search } from "lucide-react";

export const CategoryFilter: React.FC = () => {
	const { activeCategory, setActiveCategory, searchQuery, setSearchQuery, products } = useStore();

	const categories: { id: ProductCategory | "all"; label: string; count: number }[] = [
		{ id: "all", label: "كافة المنتجات", count: products.length },
		{
			id: "fig",
			label: "تين ليوا الطازج",
			count: products.filter((p) => p.category === "fig" || p.name.includes("تين")).length,
		},
		{
			id: "dates",
			label: "التمور الفاخرة",
			count: products.filter(
				(p) =>
					p.category === "dates" ||
					p.category === "rutab" ||
					p.tag === "dates" ||
					p.name.includes("تمر"),
			).length,
		},
		{
			id: "faqa",
			label: "فقع الصحراء",
			count: products.filter(
				(p) => p.category === "faqa" || p.category === "truffle" || p.tag === "truffle" || p.name.includes("فقع"),
			).length,
		},
		{
			id: "nuts",
			label: "اللوز والمكسرات",
			count: products.filter((p) => p.category === "nuts" || p.tag === "nuts" || p.name.includes("لوز")).length,
		},
		{
			id: "fruits",
			label: "فواكه الموسم",
			count: products.filter((p) => p.category === "fruits" || p.name.includes("توت") || p.name.includes("صبار") || p.name.includes("كنار")).length,
		},
	];

	return (
		<div className="space-y-4 mb-8" id="catalog-section">
			{/* Top bar with heading, search input, and counts */}
			<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
				<div>
					<h2 className="font-serif text-2xl font-black text-[#2C2014] flex items-center gap-2">
						<span>محاصيل ومنتجات مزارع تين ليوا</span>
						<span className="text-xs px-2 py-0.5 rounded-md bg-[#DE2A2D]/10 text-[#DE2A2D] font-bold">
							قطاف اليوم
						</span>
					</h2>
					<p className="text-xs text-stone-500 mt-1">
						القص والتوصيل في نفس اليوم — جميع المحاصيل طبيعية ومختارة بعناية
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
