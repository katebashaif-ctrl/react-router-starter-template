import React, { useState } from "react";
import type { Product } from "../types/store";
import { useStore } from "../context/StoreContext";
import { X, Plus, Minus, ShoppingBag, MapPin, Check, Calendar, Sun } from "lucide-react";
import { t, formatImagePath } from "../frontend/locales/i18n";

interface ProductDetailModalProps {
	product: Product | null;
	onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
	product,
	onClose,
}) => {
	const { addToCart, setIsCartOpen } = useStore();
	const minQuantity = product?.minQty || 1;
	const maxQuantity = product?.maxQty || 100;
	const [quantity, setQuantity] = useState(minQuantity);
	const [added, setAdded] = useState(false);

	// Reset quantity to minQty whenever product changes
	React.useEffect(() => {
		if (product) {
			setQuantity(product.minQty || 1);
		}
	}, [product]);

	if (!product) return null;

	const isDisabled =
		product.disabled === 1 ||
		!product.inStock ||
		(product.stockQuantity !== undefined && product.stockQuantity <= 0);
	const imageSrc = formatImagePath(product.image);

	const handleAdd = () => {
		if (isDisabled) return;
		addToCart(product, quantity);
		setAdded(true);
		setTimeout(() => {
			setAdded(false);
		}, 1500);
	};

	const handleAddAndGoToCart = () => {
		if (isDisabled) return;
		addToCart(product, quantity);
		onClose();
		setIsCartOpen(true);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
			<div
				className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D6BE9F] max-h-[90vh] flex flex-col md:flex-row text-right"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/90 text-stone-700 hover:text-black hover:bg-white flex items-center justify-center shadow-md transition-colors"
					aria-label="close"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Image Column - Clean Product Showcase */}
				<div className="md:w-1/2 relative bg-gradient-to-b from-[#FAF7F2] to-[#F5EFE6] flex items-center justify-center p-6 md:p-8 min-h-[280px] md:min-h-[440px] border-b md:border-b-0 md:border-l border-[#E8DCCB]/80">
					{/* Badges Top-Right */}
					<div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
						{isDisabled ? (
							<div className="bg-amber-900/90 backdrop-blur-sm text-amber-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-600/30 flex items-center gap-1.5 shadow-sm">
								<span>{product.disabledTxt || t("products.comingSoon")}</span>
							</div>
						) : (
							<div className="bg-emerald-800/90 backdrop-blur-sm text-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
								<span>{product.disabledTxt || t("products.available")}</span>
							</div>
						)}
					</div>

					{/* Product Image Display: Full, Uncropped, Crisp */}
					<div className="w-full h-full flex items-center justify-center">
						<img
							src={imageSrc}
							alt={product.name}
							referrerPolicy="no-referrer"
							className="max-h-[240px] md:max-h-[360px] w-auto max-w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
						/>
					</div>
				</div>

				{/* Details Column */}
				<div className="md:w-1/2 p-6 md:p-7 overflow-y-auto flex flex-col justify-between space-y-5">
					<div className="space-y-4">
						{/* Origin, Season & Harvest Metadata Card */}
						<div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] text-xs">
							<span className="flex items-center gap-1 text-[#8B5A2B] font-semibold">
								<MapPin className="w-3.5 h-3.5 text-[#DE2A2D]" />
								<span>{product.origin || t("brand.name")}</span>
							</span>
							<div className="flex items-center gap-2 text-[11px] text-stone-500">
								{product.season && (
									<span className="flex items-center gap-1">
										<Sun className="w-3 h-3 text-amber-600" />
										<span>{product.season}</span>
									</span>
								)}
								{product.harvestDate && (
									<span className="flex items-center gap-1">
										<Calendar className="w-3 h-3 text-stone-400" />
										<span>{product.harvestDate}</span>
									</span>
								)}
								<span className="px-2 py-0.5 rounded bg-white text-stone-600 font-medium border border-stone-200">
									{product.unit}
								</span>
							</div>
						</div>

						{/* Title */}
						<div>
							<h2 className="font-serif text-2xl font-bold text-[#2C2014] leading-tight">
								{product.name}
							</h2>
							{product.nameEn && (
								<p className="text-xs text-stone-400 mt-0.5" dir="ltr">
									{product.nameEn}
								</p>
							)}
						</div>

						{/* Price */}
						<div className="flex items-baseline gap-2 pb-1 border-b border-stone-100">
							<span className="font-serif text-3xl font-bold text-[#2C2014] tabular-nums">
								{product.price * quantity}
							</span>
							<span className="text-sm font-semibold text-[#8B5A2B]">{t("products.currency")}</span>
							{product.originalPrice && (
								<span className="text-sm text-stone-400 line-through tabular-nums mr-2">
									{product.originalPrice * quantity} {t("products.currency")}
								</span>
							)}
						</div>

						{/* Description */}
						<p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
							{product.desc || product.description}
						</p>

						{/* Tasting Notes */}
						{product.tastingNotes && product.tastingNotes.length > 0 && (
							<div className="pt-1">
								<p className="text-xs font-semibold text-stone-800 mb-1.5">
									{t("products.tastingNotes")}:
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
						{product.storageInstructions && (
							<div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-normal">
								<span className="font-bold">{t("products.storage")}: </span>
								<span>{product.storageInstructions}</span>
							</div>
						)}
					</div>

					{/* Action Controls */}
					<div className="pt-4 border-t border-stone-100 space-y-3">
						{!isDisabled ? (
							<div className="flex items-center justify-between gap-4">
								<div>
									<span className="text-xs font-semibold text-stone-700">
										{t("products.minQuantity", { qty: minQuantity })}
									</span>
								</div>
								<div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
									<button
										onClick={() => setQuantity((q) => Math.max(minQuantity, q - 1))}
										disabled={quantity <= minQuantity}
										className="p-2 text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-40"
										aria-label="decrease"
									>
										<Minus className="w-4 h-4" />
									</button>
									<span className="w-12 text-center text-sm font-bold tabular-nums">
										{quantity}
									</span>
									<button
										onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
										disabled={quantity >= maxQuantity}
										className="p-2 text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-40"
										aria-label="increase"
									>
										<Plus className="w-4 h-4" />
									</button>
								</div>
							</div>
						) : (
							<div className="p-3 bg-stone-100 border border-stone-200 rounded-xl text-center text-xs font-semibold text-stone-600">
								{product.disabledTxt || t("products.comingSoon")}
							</div>
						)}

						<div className="flex gap-2">
							<button
								onClick={handleAdd}
								disabled={isDisabled}
								className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
									added
										? "bg-emerald-800 text-white"
										: !isDisabled
											? "bg-[#2C2014] text-amber-200 hover:bg-[#DE2A2D] hover:text-white"
											: "bg-stone-200 text-stone-400 cursor-not-allowed"
								}`}
							>
								{added ? (
									<>
										<Check className="w-4 h-4 text-emerald-300" />
										<span>{t("products.addSuccessTitle")}</span>
									</>
								) : !isDisabled ? (
									<>
										<ShoppingBag className="w-4 h-4 text-amber-400" />
										<span>
											{t("products.addToCart")} ({product.price * quantity} {t("products.currency")})
										</span>
									</>
								) : (
									<span>{product.disabledTxt || t("products.comingSoon")}</span>
								)}
							</button>

							{!isDisabled && (
								<button
									onClick={handleAddAndGoToCart}
									className="px-4 py-3 bg-[#F5EFE6] text-[#574127] border border-[#D6BE9F] rounded-xl text-xs font-bold hover:bg-[#E8DCCB] transition-colors"
								>
									{t("cart.checkout")}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
