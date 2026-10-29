import React from "react";
import { useStore } from "../context/StoreContext";
import { CheckCircle2, Printer, ArrowRight } from "lucide-react";
import { t } from "../frontend/locales/i18n";

export const OrderSuccessModal: React.FC = () => {
	const { lastOrder, setLastOrder, settings } = useStore();

	if (!lastOrder) return null;

	const handlePrint = () => {
		window.print();
	};

	const waItemsSummary = lastOrder.items
		.map((i) => `• ${i.quantity} × ${i.name} (${i.price * i.quantity} AED)`)
		.join("%0A");
	const waText = `Order: ${lastOrder.orderNumber}%0AName: ${lastOrder.customerName}%0APhone: ${lastOrder.customerPhone}%0AEmirate: ${lastOrder.customerEmirate}%0AAddress: ${lastOrder.customerAddress}%0A%0AItems:%0A${waItemsSummary}%0A%0ATotal: ${lastOrder.total} AED`;
	const whatsappUrl = `https://wa.me/${(settings.whatsappNumber || "971504020220").replace(/[^0-9]/g, "")}?text=${waText}`;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn text-right">
			<div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#D6BE9F] p-6 sm:p-8 space-y-6">
				{/* Top Status */}
				<div className="text-center space-y-2">
					<div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
						<CheckCircle2 className="w-9 h-9" />
					</div>
					<h3 className="font-serif text-2xl font-bold text-[#2C2014]">
						{t("orderSuccess.title")}
					</h3>
					<p className="text-xs text-stone-500">
						{t("orderSuccess.subtitle")}
					</p>
				</div>

				{/* WhatsApp CTA if paymentMethod is whatsapp */}
				{lastOrder.paymentMethod === "whatsapp" && (
					<a
						href={whatsappUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="block p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-bold text-xs shadow-md transition-colors"
					>
						{t("orderSuccess.trackViaWhatsapp")}
					</a>
				)}

				{/* Order Header Card */}
				<div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-2 text-xs">
					<div className="flex justify-between items-center pb-2 border-b border-stone-200">
						<span className="text-stone-500">{t("orderSuccess.orderNumber")}:</span>
						<span className="font-serif font-bold text-sm text-[#2C2014] tabular-nums">
							{lastOrder.orderNumber}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-stone-500">{t("orderSuccess.customer")}:</span>
						<span className="font-semibold text-stone-800">{lastOrder.customerName}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-stone-500">{t("cart.phoneNumber")}:</span>
						<span className="font-semibold text-stone-800" dir="ltr">{lastOrder.customerPhone}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-stone-500">{t("orderSuccess.emirate")}:</span>
						<span className="font-semibold text-stone-800">
							{lastOrder.customerEmirate} - {lastOrder.customerAddress}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-stone-500">{t("cart.paymentMethod")}:</span>
						<span className="font-semibold text-stone-800">
							{lastOrder.paymentMethod === "ziina"
								? t("cart.payZiina")
								: lastOrder.paymentMethod === "cod"
									? t("cart.payCod")
									: lastOrder.paymentMethod === "card_on_delivery"
										? t("cart.payCardOnDelivery")
										: t("cart.payWhatsapp")}
						</span>
					</div>
				</div>

				{/* Items breakdown */}
				<div className="space-y-2">
					<h4 className="text-xs font-bold text-stone-800">{t("cart.title")}:</h4>
					<div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
						{lastOrder.items.map((it, idx) => (
							<div
								key={idx}
								className="flex justify-between items-center text-xs p-2 rounded bg-stone-50 border border-stone-100"
							>
								<span className="truncate max-w-[240px]">
									{it.quantity} × {it.name} ({it.unit})
								</span>
								<span className="font-bold text-[#8B5A2B] tabular-nums">
									{it.price * it.quantity} {t("products.currency")}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Total */}
				<div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
					<span className="text-sm font-bold text-stone-800">{t("orderSuccess.total")}:</span>
					<span className="font-serif text-2xl font-bold text-[#2C2014] tabular-nums">
						{lastOrder.total} {t("products.currency")}
					</span>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 pt-2">
					<button
						onClick={() => setLastOrder(null)}
						className="flex-1 py-3 px-4 bg-[#2C2014] text-amber-200 text-xs font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-1.5"
					>
						<span>{t("orderSuccess.continueShopping")}</span>
						<ArrowRight className="w-3.5 h-3.5" />
					</button>

					<button
						onClick={handlePrint}
						className="py-3 px-4 bg-[#F5EFE6] text-[#574127] border border-[#D6BE9F] text-xs font-bold rounded-xl hover:bg-[#E8DCCB] transition-colors flex items-center justify-center gap-1.5"
					>
						<Printer className="w-4 h-4 text-amber-800" />
					</button>
				</div>
			</div>
		</div>
	);
};
