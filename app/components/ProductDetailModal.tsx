import React, { useState } from "react";
import type { Product, CartItem } from "../types/store";
import { useStore } from "../context/StoreContext";
import { X, Plus, Minus, ShoppingBag, MapPin, Calendar, Sparkles, Check } from "lucide-react";

interface ProductDetailModalProps {
	product: Product | null;
	onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
	product,
	onClose,
}) => {
	const { addToCart, setIsCartOpen } = useStore();
	const [quantity, setQuantity] = useState(1);
	const [packaging, setPackaging] = useState<CartItem["packagingOption"]>("standard");
	const [added, setAdded] = useState(false);

	if (!product) return null;

	const handleAdd = () => {
		addToCart(product, quantity, packaging);
		setAdded(true);
		setTimeout(() => {
			setAdded(false);
		}, 1500);
	};

	const handleAddAndGoToCart = () => {
		addToCart(product, quantity, packaging);
		onClose();
		setIsCartOpen(true);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
			<div
				className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#D6BE9F] max-h-[90vh] flex flex-col md:flex-row text-right"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 text-stone-700 hover:text-black hover:bg-white flex items-center justify-center shadow-md transition-colors"
					aria-label="إغلاق النافذة"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Image Column */}
				<div className="md:w-1/2 relative bg-[#F5EFE6] min-h-[260px] md:min-h-full">
					<img
						src={product.image}
						alt={product.name}
						referrerPolicy="no-referrer"
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

					{product.badge && (
						<div className="absolute top-4 right-4 bg-[#2C2014]/90 backdrop-blur-sm text-amber-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-900/30 flex items-center gap-1.5 shadow">
							<Sparkles className="w-3.5 h-3.5 text-amber-400" />
							<span>{product.badge}</span>
						</div>
					)}

					<div className="absolute bottom-4 right-4 left-4 text-white text-xs">
						<p className="font-semibold text-sm">{product.season}</p>
						<p className="text-stone-300 text-[11px]">{product.harvestDate}</p>
					</div>
				</div>

				{/* Details Column */}
				<div className="md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
					<div className="space-y-4">
						{/* Origin & Category */}
						<div className="flex items-center justify-between text-xs text-[#8B5A2B]">
							<span className="flex items-center gap-1 font-medium">
								<MapPin className="w-3.5 h-3.5" />
								<span>{product.origin}</span>
							</span>
							<span className="text-stone-400">{product.unit}</span>
						</div>

						{/* Title */}
						<div>
							<h2 className="font-serif text-2xl font-bold text-[#2C2014] leading-tight">
								{product.name}
							</h2>
							<p className="text-xs text-stone-400 mt-0.5" dir="ltr">
								{product.nameEn}
							</p>
						</div>

						{/* Price */}
						<div className="flex items-baseline gap-2">
							<span className="font-serif text-3xl font-bold text-[#2C2014] tabular-nums">
								{product.price * quantity}
							</span>
							<span className="text-sm font-semibold text-[#8B5A2B]">د.إ</span>
							{product.originalPrice && (
								<span className="text-sm text-stone-400 line-through tabular-nums mr-2">
									{product.originalPrice * quantity} د.إ
								</span>
							)}
							{quantity > 1 && (
								<span className="text-xs text-stone-500 mr-2">
									({product.price} د.إ للوحدة)
								</span>
							)}
						</div>

						{/* Description */}
						<p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
							{product.description}
						</p>

						{/* Tasting Notes */}
						{product.tastingNotes && product.tastingNotes.length > 0 && (
							<div className="pt-2">
								<p className="text-xs font-semibold text-stone-800 mb-1.5">
									سمات النكهة والمذاق:
								</p>
								<div className="flex flex-wrap gap-1.5">
									{product.tastingNotes.map((note, idx) => (
										<span
											key={idx}
											className="text-[11px] px-2.5 py-1 bg-[#F5EFE6] text-[#574127] rounded-md font-medium"
										>
											{note}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Storage instruction */}
						<div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-normal">
							<span className="font-bold">إرشادات الحفظ: </span>
							<span>{product.storageInstructions}</span>
						</div>

						{/* Packaging option */}
						<div>
							<label className="block text-xs font-semibold text-stone-800 mb-1.5">
								نوع التغليف المطلوب:
							</label>
							<div className="grid grid-cols-2 gap-2 text-xs">
								<button
									type="button"
									onClick={() => setPackaging("standard")}
									className={`p-2.5 rounded-lg border text-right transition-all ${
										packaging === "standard"
											? "border-[#2C2014] bg-[#F5EFE6] text-[#2C2014] font-semibold"
											: "border-stone-200 hover:border-stone-300 text-stone-600"
									}`}
								>
									<p className="font-medium">التغليف المبرد القياسي</p>
									<p className="text-[10px] text-stone-500">حفظ مبرد طازج</p>
								</button>

								<button
									type="button"
									onClick={() => setPackaging("luxury_wood_box")}
									className={`p-2.5 rounded-lg border text-right transition-all ${
										packaging === "luxury_wood_box"
											? "border-[#2C2014] bg-[#F5EFE6] text-[#2C2014] font-semibold"
											: "border-stone-200 hover:border-stone-300 text-stone-600"
									}`}
								>
									<p className="font-medium">سحارة خشبية تراثية</p>
									<p className="text-[10px] text-stone-500">مخصصة للإهداء والمجالس</p>
								</button>
							</div>
						</div>
					</div>

					{/* Action Controls */}
					<div className="pt-4 border-t border-stone-100 space-y-3">
						<div className="flex items-center justify-between gap-4">
							<span className="text-xs font-semibold text-stone-700">الكمية:</span>
							<div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
								<button
									onClick={() => setQuantity((q) => Math.max(1, q - 1))}
									className="p-2 text-stone-600 hover:bg-stone-100 transition-colors"
									aria-label="إنقاص الكمية"
								>
									<Minus className="w-4 h-4" />
								</button>
								<span className="w-12 text-center text-sm font-bold tabular-nums">
									{quantity}
								</span>
								<button
									onClick={() => setQuantity((q) => q + 1)}
									className="p-2 text-stone-600 hover:bg-stone-100 transition-colors"
									aria-label="زيادة الكمية"
								>
									<Plus className="w-4 h-4" />
								</button>
							</div>
						</div>

						<div className="flex gap-2">
							<button
								onClick={handleAdd}
								disabled={!product.inStock}
								className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
									added
										? "bg-emerald-800 text-white"
										: product.inStock
											? "bg-[#2C2014] text-amber-200 hover:bg-black"
											: "bg-stone-200 text-stone-400 cursor-not-allowed"
								}`}
							>
								{added ? (
									<>
										<Check className="w-4 h-4 text-emerald-300" />
										<span>تمت الإضافة للسلة</span>
									</>
								) : (
									<>
										<ShoppingBag className="w-4 h-4 text-amber-400" />
										<span>أضف إلى السلة ({product.price * quantity} د.إ)</span>
									</>
								)}
							</button>

							<button
								onClick={handleAddAndGoToCart}
								disabled={!product.inStock}
								className="px-4 py-3 bg-[#F5EFE6] text-[#574127] border border-[#D6BE9F] rounded-xl text-xs font-bold hover:bg-[#E8DCCB] transition-colors"
							>
								إتمام الطلب
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
