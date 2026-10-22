import React from "react";
import type { Product } from "../types/store";
import { useStore } from "../context/StoreContext";
import { Plus, Eye, MapPin, Sparkles } from "lucide-react";

interface ProductCardProps {
	product: Product;
	onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
	product,
	onOpenDetail,
}) => {
	const { addToCart } = useStore();

	const handleQuickAdd = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!product.inStock) return;
		addToCart(product, 1, "standard");
	};

	return (
		<article
			onClick={() => onOpenDetail(product)}
			className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8DCCB] hover:border-[#D6BE9F] hover:shadow-lg transition-all duration-300 cursor-pointer relative"
		>
			{/* Image container (65% of card visually) */}
			<div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EFE6]">
				<img
					src={product.image}
					alt={product.name}
					referrerPolicy="no-referrer"
					className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
				/>

				{/* Subtle badge if present */}
				{product.badge && (
					<div className="absolute top-3 right-3 bg-[#2C2014]/90 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-900/30 flex items-center gap-1 shadow-sm">
						<Sparkles className="w-3 h-3 text-amber-400" />
						<span>{product.badge}</span>
					</div>
				)}

				{!product.inStock && (
					<div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
						<span className="px-3 py-1 bg-rose-900/90 text-rose-100 text-xs font-semibold rounded-md border border-rose-700">
							نفد المحصول لهذا اليوم
						</span>
					</div>
				)}

				{/* Hover overlay button to preview */}
				<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
					<span className="px-3 py-1.5 bg-white/95 text-stone-900 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5">
						<Eye className="w-3.5 h-3.5 text-amber-800" />
						<span>عرض التفاصيل</span>
					</span>
				</div>
			</div>

			{/* Card Content */}
			<div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 text-right">
				<div>
					{/* Origin & Unit in quiet metadata */}
					<div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
						<span className="flex items-center gap-1 text-[11px] text-[#8B5A2B] font-medium">
							<MapPin className="w-3 h-3 shrink-0" />
							<span className="truncate max-w-[150px]">{product.origin}</span>
						</span>
						<span className="text-[11px] text-stone-400">{product.unit}</span>
					</div>

					{/* Title */}
					<h3 className="font-semibold text-stone-900 text-base leading-snug group-hover:text-amber-900 transition-colors line-clamp-2">
						{product.name}
					</h3>

					{/* Short description */}
					<p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
						{product.description}
					</p>
				</div>

				{/* Price and Action Baseline */}
				<div className="pt-3 border-t border-[#F5EFE6] flex items-center justify-between gap-3">
					<div className="flex flex-col">
						<div className="flex items-baseline gap-1.5">
							<span className="font-serif text-xl font-bold text-[#2C2014] tabular-nums">
								{product.price}
							</span>
							<span className="text-xs font-semibold text-[#8B5A2B]">د.إ</span>
							{product.originalPrice && (
								<span className="text-xs text-stone-400 line-through tabular-nums mr-1">
									{product.originalPrice}
								</span>
							)}
						</div>
						<span className="text-[10px] text-stone-400">شامل الضريبة</span>
					</div>

					{/* Add to Cart Button */}
					<button
						onClick={handleQuickAdd}
						disabled={!product.inStock}
						className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
							product.inStock
								? "bg-[#2C2014] text-amber-200 hover:bg-black"
								: "bg-stone-100 text-stone-400 cursor-not-allowed"
						}`}
						title={product.inStock ? "أضف مباشرة للسلة" : "غير متوفر حالياً"}
					>
						<Plus className="w-3.5 h-3.5" />
						<span>أضف</span>
					</button>
				</div>
			</div>
		</article>
	);
};
