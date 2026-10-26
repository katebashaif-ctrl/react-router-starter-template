import React from "react";
import type { Route } from "./+types/home";
import { StoreProvider, useStore } from "../context/StoreContext";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { CategoryFilter } from "../components/CategoryFilter";
import { ProductCard } from "../components/ProductCard";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { CartDrawer } from "../components/CartDrawer";
import { OrderSuccessModal } from "../components/OrderSuccessModal";
import { CMSDashboard } from "../components/CMSDashboard";
import { EmiratiHeritageSection } from "../components/EmiratiHeritageSection";
import { Footer } from "../components/Footer";
import { ToastContainer } from "../components/ToastContainer";
import { AdminLoginModal } from "../components/AdminLoginModal";
import { CookieBanner } from "../components/CookieBanner";
import { PrivacyTermsModal } from "../components/PrivacyTermsModal";
import { Lock, ArrowRight } from "lucide-react";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "تين ليوا | متجر مزارع تين ليوا للمنتجات الزراعية الفاخرة" },
		{
			name: "description",
			content:
				"متجر تين ليوا الرسمي - أجود أنواع التين الأحمر والأصفر الطازج، الرطب والتمور الفاخرة، الفقع، اللوز، التوت، والصبار من مزارع ليوا مع القص والتوصيل في نفس اليوم.",
		},
	];
}

const StorefrontContent: React.FC = () => {
	const {
		currentView,
		setCurrentView,
		products,
		activeCategory,
		searchQuery,
		selectedProduct,
		setSelectedProduct,
		isAdminAuthenticated,
		setIsAdminLoginModalOpen,
	} = useStore();

	const filteredProducts = products.filter((p) => {
		let matchesCategory = activeCategory === "all";
		if (!matchesCategory) {
			if (activeCategory === "fig") {
				matchesCategory = p.category === "fig" || p.name.includes("تين");
			} else if (activeCategory === "dates" || activeCategory === "rutab") {
				matchesCategory =
					p.category === "dates" ||
					p.category === "rutab" ||
					p.tag === "dates" ||
					p.name.includes("تمر") ||
					p.name.includes("رطب");
			} else if (activeCategory === "faqa" || activeCategory === "truffle") {
				matchesCategory =
					p.category === "faqa" ||
					p.category === "truffle" ||
					p.tag === "truffle" ||
					p.name.includes("فقع");
			} else if (activeCategory === "nuts") {
				matchesCategory =
					p.category === "nuts" ||
					p.tag === "nuts" ||
					p.name.includes("لوز");
			} else if (activeCategory === "fruits") {
				matchesCategory =
					p.category === "fruits" ||
					p.name.includes("توت") ||
					p.name.includes("صبار") ||
					p.name.includes("كنار");
			} else {
				matchesCategory = p.category === activeCategory;
			}
		}

		const matchesSearch =
			!searchQuery ||
			p.name.includes(searchQuery) ||
			(p.origin && p.origin.includes(searchQuery)) ||
			(p.desc && p.desc.includes(searchQuery)) ||
			(p.description && p.description.includes(searchQuery));

		return matchesCategory && matchesSearch;
	});

	// Protected CMS View
	if (currentView === "cms") {
		if (!isAdminAuthenticated) {
			return (
				<div className="flex flex-col min-h-screen text-right bg-[#FAF7F2]">
					<Header />
					<main className="flex-1 flex items-center justify-center p-6">
						<div className="text-center space-y-4 max-w-md w-full bg-white p-8 rounded-2xl border border-[#D6BE9F] shadow-xl">
							<div className="w-16 h-16 rounded-2xl bg-[#F5EFE6] text-amber-900 border border-[#D6BE9F] flex items-center justify-center mx-auto">
								<Lock className="w-8 h-8 text-amber-800" />
							</div>
							<h2 className="font-serif text-2xl font-bold text-[#2C2014]">
								منطقة المشرف الإداري
							</h2>
							<p className="text-xs text-stone-500 leading-relaxed">
								هذه المنطقة مخصصة لإدارة مبيعات ومحاصيل المتجر. يرجى تسجيل الدخول باسم المستخدم <strong>admin</strong> وكلمة المرور <strong>admin</strong> للمتابعة.
							</p>
							<div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
								<button
									onClick={() => setIsAdminLoginModalOpen(true)}
									className="px-6 py-3 bg-[#2C2014] text-amber-200 font-bold rounded-xl text-xs hover:bg-black transition-colors"
								>
									دخول المشرف (admin / admin)
								</button>
								<button
									onClick={() => setCurrentView("store")}
									className="px-5 py-3 border border-stone-300 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-50"
								>
									العودة للمتجر
								</button>
							</div>
						</div>
					</main>
					<Footer />
					<AdminLoginModal />
					<ToastContainer />
				</div>
			);
		}

		return (
			<>
				<CMSDashboard />
				<ToastContainer />
			</>
		);
	}

	return (
		<div className="flex flex-col min-h-screen">
			<Header />

			<main className="flex-1">
				<Hero />

				{/* Products Catalog Section */}
				<section
					id="catalog-section"
					className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
				>
					<CategoryFilter />

					{filteredProducts.length === 0 ? (
						<div className="py-16 text-center bg-white rounded-2xl border border-[#E8DCCB] p-8 space-y-3">
							<p className="font-serif text-xl font-bold text-stone-800">
								لا توجد نتائج مطابقة لبحثكم
							</p>
							<p className="text-xs text-stone-500">
								يرجى تجربة البحث باسم آخر أو اختيار قسم مختلف من الأقسام أعلاه.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
							{filteredProducts.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									onOpenDetail={(prod) => setSelectedProduct(prod)}
								/>
							))}
						</div>
					)}
				</section>

				<EmiratiHeritageSection />
			</main>

			<Footer />

			{/* Modals, Drawers & Compliance Banners */}
			<ProductDetailModal
				product={selectedProduct}
				onClose={() => setSelectedProduct(null)}
			/>
			<CartDrawer />
			<OrderSuccessModal />
			<AdminLoginModal />
			<CookieBanner />
			<PrivacyTermsModal />
			<ToastContainer />
		</div>
	);
};

export default function Home() {
	return (
		<StoreProvider>
			<StorefrontContent />
		</StoreProvider>
	);
}
