import React from "react";
import { useStore } from "../context/StoreContext";
import { CheckCircle2, Printer, ArrowRight, MapPin, Phone, Calendar } from "lucide-react";

export const OrderSuccessModal: React.FC = () => {
	const { lastOrder, setLastOrder } = useStore();

	if (!lastOrder) return null;

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn text-right">
			<div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#D6BE9F] p-6 sm:p-8 space-y-6">
				{/* Top Status */}
				<div className="text-center space-y-2">
					<div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
						<CheckCircle2 className="w-9 h-9" />
					</div>
					<h3 className="font-serif text-2xl font-bold text-[#2C2014]">
						تم استلام طلبكم المبارك بنجاح
					</h3>
					<p className="text-xs text-stone-500">
						حياكم الله ونشكركم على ثقتكم في خيرات الدار. سيصلكم اتصال للتأكيد.
					</p>
					<div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
						<CheckCircle2 className="w-3 h-3 text-emerald-600" />
						<span>تم التوثيق والتسجيل بقاعدة بيانات المتجر السحابية</span>
					</div>
				</div>

				{/* Order Header Card */}
				<div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] space-y-2 text-xs">
					<div className="flex justify-between items-center pb-2 border-b border-stone-200">
						<span className="text-stone-500">رقم الطلب:</span>
						<span className="font-serif font-bold text-sm text-[#2C2014] tabular-nums">
							{lastOrder.orderNumber}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-stone-500">الاسم:</span>
						<span className="font-semibold text-stone-800">{lastOrder.customerName}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-stone-500">الهاتف:</span>
						<span className="font-semibold text-stone-800" dir="ltr">{lastOrder.customerPhone}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-stone-500">منطقة التوصيل:</span>
						<span className="font-semibold text-stone-800">
							{lastOrder.customerEmirate} - {lastOrder.customerAddress}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-stone-500">طريقة الدفع:</span>
						<span className="font-semibold text-stone-800">
							{lastOrder.paymentMethod === "cod"
								? "نقداً عند الاستلام"
								: lastOrder.paymentMethod === "card_on_delivery"
									? "بطاقة ائتمانية عند التسليم"
									: "تأكيد عبر واتساب"}
						</span>
					</div>
				</div>

				{/* Items breakdown */}
				<div className="space-y-2">
					<h4 className="text-xs font-bold text-stone-800">تفاصيل المحصول المطلوب:</h4>
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
									{it.price * it.quantity} د.إ
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Total */}
				<div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
					<span className="text-sm font-bold text-stone-800">المبلغ الإجمالي المستحق:</span>
					<span className="font-serif text-2xl font-bold text-[#2C2014] tabular-nums">
						{lastOrder.total} د.إ
					</span>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 pt-2">
					<button
						onClick={() => setLastOrder(null)}
						className="flex-1 py-3 px-4 bg-[#2C2014] text-amber-200 text-xs font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-1.5"
					>
						<span>متابعة التسوق</span>
						<ArrowRight className="w-3.5 h-3.5" />
					</button>

					<button
						onClick={handlePrint}
						className="py-3 px-4 bg-[#F5EFE6] text-[#574127] border border-[#D6BE9F] text-xs font-bold rounded-xl hover:bg-[#E8DCCB] transition-colors flex items-center justify-center gap-1.5"
					>
						<Printer className="w-4 h-4 text-amber-800" />
						<span className="hidden sm:inline">طباعة الفاتورة</span>
					</button>
				</div>
			</div>
		</div>
	);
};
