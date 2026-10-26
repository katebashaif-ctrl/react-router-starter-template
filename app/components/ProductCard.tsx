import React from "react";
import type { Product } from "../types/store";
import { useStore } from "../context/StoreContext";
import { Plus, Eye, MapPin, Sparkles, CheckCircle, Clock } from "lucide-react";

interface ProductCardProps {
	product: Product;
	onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
	product,
	onOpenDetail,
}) => {
	const { addToCart } = useStore();

	const isDisabled = product.disabled === 1 || !product.inStock;
	const buttonText = isDisabled
		? product.disabledTxt || "قريباً"
		: product.disabledTxt && product.disabledTxt !== "متوفر"
			? product.disabledTxt
			: "أضف للسلة";

	const imageSrc = product.image
		? product.image.startsWith("/")
			? product.image
			: `/${product.image}`
		: "/images/redfig.jpg";

	const handleQuickAdd = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isDisabled) return;
		addToCart(product, product.minQty || 1, "standard");
	};

	return (
		<article
			onClick={() => onOpenDetail(product)}
			className={`group flex flex-col bg-white rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer relative ${
				isDisabled
					? "border-[#E8DCCB] opacity-95 hover:border-stone-400"
					: "border-[#E8DCCB] hover:border-[#DE2A2D]/50 hover:shadow-xl hover:-translate-y-0.5"
			}`}
		>
			{/* Image container */}
			<div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EFE6]">
				<img
					src={imageSrc}
					alt={product.name}
					referrerPolicy="no-referrer"
					className={`w-full h-full object-cover transition-transform duration-500 ${
						isDisabled ? "grayscale-[15%] group-hover:scale-102" : "group-hover:scale-105"
					}`}
				/>

				{/* Availability Tag Top-Right */}
				<div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
					{product.disabled === 0 ? (
						<span className="bg-emerald-700/90 backdrop-blur-sm text-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1 shadow-sm">
							<CheckCircle className="w-3 h-3 text-emerald-300" />
							<span>{product.disabledTxt || "متوفر"}</span>
						</span>
					) : (
						<span className="bg-amber-900/90 backdrop-blur-sm text-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-600/30 flex items-center gap-1 shadow-sm">
							<Clock className="w-3 h-3 text-amber-300" />
							<span>{product.disabledTxt || "قريباً"}</span>
						</span>
					)}

					{product.badge && (
						<span className="bg-[#2C2014]/90 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-amber-900/30 flex items-center gap-1 shadow-sm">
							<Sparkles className="w-2.5 h-2.5 text-amber-400" />
							<span>{product.badge}</span>
						</span>
					)}
				</div>

				{/* Min quantity indicator if > 1 */}
				{product.minQty && product.minQty > 1 && (
					<div className="absolute top-3 left-3 bg-[#2C2014]/85 backdrop-blur-sm text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
						أقل طلب: {product.minQty} كجم
					</div>
				)}

				{/* Hover overlay button to preview */}
				<div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
					<span className="px-3.5 py-1.5 bg-white/95 text-stone-900 text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5">
						<Eye className="w-3.5 h-3.5 text-[#DE2A2D]" />
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
							<MapPin className="w-3 h-3 shrink-0 text-[#DE2A2D]" />
							<span className="truncate max-w-[150px]">{product.origin || "مزارع ليوا"}</span>
						</span>
						<span className="text-[11px] text-stone-400">{product.unit || "كيلو"}</span>
					</div>

					{/* Title */}
					<h3 className="font-semibold text-stone-900 text-base leading-snug group-hover:text-[#DE2A2D] transition-colors line-clamp-1">
						{product.name}
					</h3>

					{/* Short description */}
					<p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
						{product.desc || product.description}
					</p>
				</div>

				{/* Price and Action Baseline */}
				<div className="pt-3 border-t border-[#F5EFE6] flex items-center justify-between gap-3">
					<div className="flex flex-col">
						<div className="flex items-baseline gap-1">
							<span className="font-serif text-2xl font-bold text-[#2C2014] tabular-nums">
								{product.price}
							</span>
							<span className="text-xs font-semibold text-[#8B5A2B]">د.إ</span>
							{product.originalPrice && (
								<span className="text-xs text-stone-400 line-through tabular-nums mr-1">
									{product.originalPrice}
								</span>
							)}
						</div>
						<span className="text-[10px] text-stone-400">شامل التوصيل المبرد</span>
					</div>

					{/* Add to Cart or Status Button */}
					<button
						onClick={handleQuickAdd}
						disabled={isDisabled}
						className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
							!isDisabled
								? "bg-[#2C2014] text-amber-200 hover:bg-[#DE2A2D] hover:text-white shadow-sm active:scale-95"
								: "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
						}`}
						title={isDisabled ? "غير متوفر حالياً" : "أضف مباشرة للسلة"}
					>
						{!isDisabled && <Plus className="w-3.5 h-3.5" />}
						<span>{buttonText}</span>
					</button>
				</div>
			</div>
		</article>
	);
};
