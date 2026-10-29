import React from "react";
import { useStore } from "../../context/StoreContext";
import { StoreLayout } from "../layout/StoreLayout";
import { Hero } from "../../components/Hero";
import { CategoryFilter } from "../../components/CategoryFilter";
import { ProductCard } from "../../components/ProductCard";
import { EmiratiHeritageSection } from "../../components/EmiratiHeritageSection";
import { ProductDetailModal } from "../../components/ProductDetailModal";
import { CMSView } from "./CMSView";
import { t } from "../locales/i18n";

export const HomeView: React.FC = () => {
	const {
		currentView,
		products,
		activeCategory,
		searchQuery,
		selectedProduct,
		setSelectedProduct,
	} = useStore();

	if (currentView === "cms") {
		return <CMSView />;
	}

	const filteredProducts = products.filter((p) => {
		let matchesCategory = activeCategory === "all";
		if (!matchesCategory) {
			if (activeCategory === "fig") {
				matchesCategory = p.category === "fig" || p.tag === "fig";
			} else if (activeCategory === "dates" || activeCategory === "rutab") {
				matchesCategory =
					p.category === "dates" ||
					p.category === "rutab" ||
					p.tag === "dates";
			} else if (activeCategory === "faqa" || activeCategory === "truffle") {
				matchesCategory =
					p.category === "faqa" ||
					p.category === "truffle" ||
					p.tag === "truffle";
			} else if (activeCategory === "nuts") {
				matchesCategory =
					p.category === "nuts" ||
					p.tag === "nuts";
			} else if (activeCategory === "fruits") {
				matchesCategory =
					p.category === "fruits" ||
					p.tag === "fruits";
			} else {
				matchesCategory = p.category === activeCategory;
			}
		}

		const matchesSearch =
			!searchQuery ||
			p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(p.nameEn && p.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(p.desc && p.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

		return matchesCategory && matchesSearch;
	});

	return (
		<StoreLayout>
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
							{t("products.emptySearchTitle")}
						</p>
						<p className="text-xs text-stone-500">
							{t("products.emptySearchDesc")}
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

			<ProductDetailModal
				product={selectedProduct}
				onClose={() => setSelectedProduct(null)}
			/>
		</StoreLayout>
	);
};
