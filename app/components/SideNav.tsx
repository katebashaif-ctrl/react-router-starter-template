import React from "react";
import { useStore } from "../context/StoreContext";
import { ShoppingBag } from "lucide-react";

export const SideNav: React.FC = () => {
	const { cartItemsCount, setIsCartOpen, setCurrentView, setActiveCategory } = useStore();

	const handleLogoClick = () => {
		setCurrentView("store");
		setActiveCategory("all");
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<aside
			aria-label="القائمة الجانبية للتنقل"
			className="hidden md:flex flex-col items-center justify-between py-8 w-20 shrink-0 bg-[#1e1e1e] border-l border-white/10 select-none z-30 fixed top-0 bottom-0 right-0 h-screen"
		>
			{/* Monogram Brand Mark */}
			<button
				onClick={handleLogoClick}
				title="خيرات الدار - الرئيسية"
				className="font-extrabold text-2xl tracking-tight text-white hover:text-[#f0c38e] transition-colors focus:outline-none flex flex-col items-center gap-1 group"
			>
				<span className="font-['Syne',sans-serif] text-xl font-black group-hover:scale-105 transition-transform">
					خ.د
				</span>
				<span className="w-1.5 h-1.5 rounded-full bg-[#f0c38e] opacity-80 group-hover:opacity-100"></span>
			</button>

			{/* Vertical Typography Badges */}
			<div className="flex flex-col items-center gap-12 my-auto">
				<div className="vertical-text hover:text-white transition-colors cursor-default">
					TRADITION 2026
				</div>
				<div className="w-px h-8 bg-white/10"></div>
				<div className="vertical-text hover:text-white transition-colors cursor-default">
					EMIRATI GOURMET
				</div>
			</div>

			{/* Cart Action Pill */}
			<div className="mt-auto pt-4 flex flex-col items-center gap-2">
				<button
					onClick={() => setIsCartOpen(true)}
					aria-label={`سلة المشتريات، ${cartItemsCount} عناصر`}
					className="cart-pill flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
					title="عرض سلة التسوق"
				>
					<ShoppingBag className="w-3.5 h-3.5" />
					<span className="tabular-nums font-bold text-xs">{cartItemsCount}</span>
				</button>
				<span className="text-[10px] text-stone-500 font-mono tracking-wider">CART</span>
			</div>
		</aside>
	);
};
