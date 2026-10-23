import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, Gift, CheckCircle, MessageSquare } from "lucide-react";

export const CartDrawer: React.FC = () => {
	const {
		cart,
		updateCartQty,
		removeFromCart,
		clearCart,
		cartTotal,
		isCartOpen,
		setIsCartOpen,
		settings,
		addOrder,
	} = useStore();

	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [customerEmirate, setCustomerEmirate] = useState("أبوظبي");
	const [customerAddress, setCustomerAddress] = useState("");
	const [deliveryNotes, setDeliveryNotes] = useState("");
	const [hasGiftNote, setHasGiftNote] = useState(false);
	const [giftNoteText, setGiftNoteText] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<"cod" | "card_on_delivery" | "whatsapp">("cod");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

	if (!isCartOpen) return null;

	const deliveryFee =
		cartTotal >= settings.freeDeliveryThreshold || cartTotal === 0
			? 0
			: settings.standardDeliveryFee;
	const grandTotal = cartTotal + deliveryFee;
	const remainingForFreeShipping = Math.max(
		0,
		settings.freeDeliveryThreshold - cartTotal,
	);
	const freeShippingPercent = Math.min(
		100,
		Math.round((cartTotal / settings.freeDeliveryThreshold) * 100),
	);

	const emirates = [
		"أبوظبي",
		"دبي",
		"الشارقة",
		"العين",
		"عجمان",
		"رأس الخيمة",
		"الفجيرة",
		"أم القيوين",
	];

	const validate = () => {
		const newErrors: { name?: string; phone?: string; address?: string } = {};
		if (!customerName.trim()) newErrors.name = "يرجى كتابة الاسم الكريم";
		if (!customerPhone.trim()) {
			newErrors.phone = "يرجى كتابة رقم الهاتف للتواصل";
		} else if (customerPhone.trim().length < 8) {
			newErrors.phone = "يرجى إدخال رقم هاتف صحيح";
		}
		if (!customerAddress.trim()) newErrors.address = "يرجى تحديد المنطقة والشارع أو رقم الفيلا";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleCheckout = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		if (cart.length === 0) return;

		setIsSubmitting(true);

		const orderItems = cart.map((item) => ({
			productId: item.product.id,
			name: item.product.name,
			quantity: item.quantity,
			price: item.product.price,
			unit: item.product.unit,
			packagingOption: item.packagingOption,
		}));

		const newOrder = await addOrder({
			customerName,
			customerPhone,
			customerEmirate,
			customerAddress,
			notes: deliveryNotes,
			giftNote: hasGiftNote ? giftNoteText : undefined,
			items: orderItems,
			subtotal: cartTotal,
			deliveryFee,
			discount: 0,
			total: grandTotal,
			paymentMethod,
		});

		setIsSubmitting(false);
		setIsCartOpen(false);

		// If WhatsApp chosen, open direct WhatsApp conversation
		if (paymentMethod === "whatsapp") {
			const itemsSummary = cart
				.map((i) => `• ${i.quantity} × ${i.product.name} (${i.product.price * i.quantity} د.إ)`)
				.join("%0A");
			const waText = `*طلب جديد من خيرات الدار*%0Aرقم الطلب: ${newOrder.orderNumber}%0Aالاسم: ${customerName}%0Aالهاتف: ${customerPhone}%0Aالإمارة: ${customerEmirate}%0Aالعنوان: ${customerAddress}%0A%0A*المنتجات:*%0A${itemsSummary}%0A%0A*الإجمالي:* ${grandTotal} د.إ`;
			window.open(
				`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}?text=${waText}`,
				"_blank",
			);
		}
	};

	return (
		<div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
			<div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

			<div className="fixed inset-y-0 right-0 max-w-full flex pl-10 text-right">
				<div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#D6BE9F]">
					{/* Header */}
					<div className="p-4 sm:p-5 border-b border-stone-200 bg-[#FAF7F2] flex items-center justify-between">
						<div className="flex items-center gap-2">
							<ShoppingBag className="w-5 h-5 text-amber-800" />
							<h3 className="font-serif text-lg font-bold text-[#2C2014]">
								سلة المشتريات
							</h3>
							<span className="text-xs bg-[#E8DCCB] text-[#574127] font-semibold px-2 py-0.5 rounded-full tabular-nums">
								{cart.length} أصناف
							</span>
						</div>
						<button
							onClick={() => setIsCartOpen(false)}
							className="p-1.5 rounded-lg text-stone-500 hover:text-black hover:bg-stone-200/60 transition-colors"
							aria-label="إغلاق السلة"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Free Shipping Progress */}
					<div className="px-5 py-3 bg-[#F5EFE6] border-b border-[#E8DCCB] text-xs">
						{remainingForFreeShipping > 0 ? (
							<div className="space-y-1.5">
								<p className="text-[#574127] font-medium flex items-center gap-1.5">
									<Truck className="w-4 h-4 text-amber-700 shrink-0" />
									<span>
										أضف بقيمة <strong className="text-amber-900 tabular-nums">{remainingForFreeShipping} د.إ</strong> إضافية للحصول على توصيل مبرد مجاني
									</span>
								</p>
								<div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
									<div
										className="bg-amber-700 h-full transition-all duration-300"
										style={{ width: `${freeShippingPercent}%` }}
									/>
								</div>
							</div>
						) : (
							<p className="text-emerald-800 font-bold flex items-center gap-1.5">
								<CheckCircle className="w-4 h-4 text-emerald-600" />
								<span>طلبكم مؤهل للتوصيل المبرد المجاني لكافة الإمارات!</span>
							</p>
						)}
					</div>

					{/* Cart Items List */}
					<div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
						{cart.length === 0 ? (
							<div className="py-16 text-center space-y-3">
								<div className="w-16 h-16 rounded-full bg-[#F5EFE6] text-amber-800 flex items-center justify-center mx-auto">
									<ShoppingBag className="w-8 h-8 opacity-60" />
								</div>
								<p className="font-serif text-lg font-bold text-stone-800">
									سلتكم خالية حالياً
								</p>
								<p className="text-xs text-stone-500 max-w-xs mx-auto">
									تفضل باختيار أطايب الرطب والتين والفقع الإماراتي لإضافتها إلى
									سلتك.
								</p>
								<button
									onClick={() => setIsCartOpen(false)}
									className="mt-3 px-5 py-2.5 bg-[#2C2014] text-amber-200 text-xs font-semibold rounded-lg hover:bg-black transition-colors"
								>
									تصفح المنتجات
								</button>
							</div>
						) : (
							<>
								<div className="space-y-3">
									{cart.map((item) => (
										<div
											key={`${item.product.id}-${item.packagingOption}`}
											className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80 items-center justify-between"
										>
											<img
												src={item.product.image}
												alt={item.product.name}
												referrerPolicy="no-referrer"
												className="w-16 h-16 rounded-lg object-cover bg-stone-200 shrink-0"
											/>

											<div className="flex-1 min-w-0 pr-1">
												<h4 className="text-xs font-bold text-stone-900 truncate">
													{item.product.name}
												</h4>
												<p className="text-[11px] text-stone-500">
													{item.product.unit} · {item.packagingOption === "luxury_wood_box" ? "سحارة خشبية" : "تغليف قياسي"}
												</p>
												<p className="text-xs font-bold text-[#8B5A2B] mt-1 tabular-nums">
													{item.product.price * item.quantity} د.إ
												</p>
											</div>

											{/* Stepper */}
											<div className="flex flex-col items-end gap-1.5 shrink-0">
												<button
													onClick={() => removeFromCart(item.product.id)}
													className="text-stone-400 hover:text-rose-600 transition-colors p-0.5"
													title="حذف الصنف"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>

												<div className="flex items-center border border-stone-300 rounded bg-white">
													<button
														onClick={() =>
															updateCartQty(item.product.id, item.quantity - 1)
														}
														className="px-1.5 py-0.5 text-stone-600 hover:bg-stone-100"
													>
														<Minus className="w-3 h-3" />
													</button>
													<span className="px-2 text-xs font-bold tabular-nums">
														{item.quantity}
													</span>
													<button
														onClick={() =>
															updateCartQty(item.product.id, item.quantity + 1)
														}
														className="px-1.5 py-0.5 text-stone-600 hover:bg-stone-100"
													>
														<Plus className="w-3 h-3" />
													</button>
												</div>
											</div>
										</div>
									))}
								</div>

								{/* Gift Card Addon */}
								<div className="pt-2 border-t border-stone-100">
									<label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 font-medium">
										<input
											type="checkbox"
											checked={hasGiftNote}
											onChange={(e) => setHasGiftNote(e.target.checked)}
											className="rounded text-amber-800 focus:ring-amber-800"
										/>
										<Gift className="w-3.5 h-3.5 text-amber-700" />
										<span>هذا الطلب إهداء (إرفاق بطاقة إهداء فاخرة مجانية)</span>
									</label>
									{hasGiftNote && (
										<textarea
											value={giftNoteText}
											onChange={(e) => setGiftNoteText(e.target.value)}
											placeholder="اكتب عبارة الإهداء واسم المهدى إليه..."
											rows={2}
											className="w-full mt-2 p-2 text-xs border border-amber-300 rounded-lg bg-amber-50/40 focus:outline-none focus:ring-1 focus:ring-amber-800"
										/>
									)}
								</div>

								{/* Customer Info Form */}
								<form id="checkout-form" onSubmit={handleCheckout} className="pt-3 border-t border-stone-200 space-y-3">
									<h4 className="text-xs font-bold text-stone-900">
										بيانات التوصيل والتسليم:
									</h4>

									<div>
										<label className="block text-[11px] font-medium text-stone-600 mb-1">
											الاسم الكريم *
										</label>
										<input
											type="text"
											value={customerName}
											onChange={(e) => setCustomerName(e.target.value)}
											placeholder="سالم بن راشد"
											className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800"
										/>
										{errors.name && (
											<p className="text-[10px] text-rose-600 mt-0.5">{errors.name}</p>
										)}
									</div>

									<div className="grid grid-cols-2 gap-2">
										<div>
											<label className="block text-[11px] font-medium text-stone-600 mb-1">
												رقم الهاتف *
											</label>
											<input
												type="tel"
												value={customerPhone}
												onChange={(e) => setCustomerPhone(e.target.value)}
												placeholder="+971 50 000 0000"
												dir="ltr"
												className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-right"
											/>
											{errors.phone && (
												<p className="text-[10px] text-rose-600 mt-0.5">{errors.phone}</p>
											)}
										</div>

										<div>
											<label className="block text-[11px] font-medium text-stone-600 mb-1">
												الإمارة *
											</label>
											<select
												value={customerEmirate}
												onChange={(e) => setCustomerEmirate(e.target.value)}
												className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 bg-white"
											>
												{emirates.map((em) => (
													<option key={em} value={em}>
														{em}
													</option>
												))}
											</select>
										</div>
									</div>

									<div>
										<label className="block text-[11px] font-medium text-stone-600 mb-1">
											العنوان بالتفصيل (المنطقة والشارع) *
										</label>
										<input
											type="text"
											value={customerAddress}
											onChange={(e) => setCustomerAddress(e.target.value)}
											placeholder="مثال: البطين، شارع الشيخ راشد، فيلا ١٢"
											className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800"
										/>
										{errors.address && (
											<p className="text-[10px] text-rose-600 mt-0.5">{errors.address}</p>
										)}
									</div>

									<div>
										<label className="block text-[11px] font-medium text-stone-600 mb-1">
											ملاحظات التوصيل (اختياري)
										</label>
										<input
											type="text"
											value={deliveryNotes}
											onChange={(e) => setDeliveryNotes(e.target.value)}
											placeholder="مثال: يرجى الاتصال قبل الوصول بربع ساعة"
											className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800"
										/>
									</div>

									{/* Payment Method Selector */}
									<div>
										<label className="block text-[11px] font-medium text-stone-600 mb-1">
											طريقة الدفع والتأكيد:
										</label>
										<div className="grid grid-cols-3 gap-1.5 text-center">
											<button
												type="button"
												onClick={() => setPaymentMethod("cod")}
												className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
													paymentMethod === "cod"
														? "border-[#2C2014] bg-[#F5EFE6] text-[#2C2014]"
														: "border-stone-200 text-stone-600 hover:bg-stone-50"
												}`}
											>
												نقداً عند الاستلام
											</button>
											<button
												type="button"
												onClick={() => setPaymentMethod("card_on_delivery")}
												className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
													paymentMethod === "card_on_delivery"
														? "border-[#2C2014] bg-[#F5EFE6] text-[#2C2014]"
														: "border-stone-200 text-stone-600 hover:bg-stone-50"
												}`}
											>
												بطاقة عند التوصيل
											</button>
											<button
												type="button"
												onClick={() => setPaymentMethod("whatsapp")}
												className={`p-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
													paymentMethod === "whatsapp"
														? "border-emerald-800 bg-emerald-50 text-emerald-900"
														: "border-stone-200 text-stone-600 hover:bg-stone-50"
												}`}
											>
												<MessageSquare className="w-3 h-3 text-emerald-600" />
												<span>عبر واتساب</span>
											</button>
										</div>
									</div>
								</form>
							</>
						)}
					</div>

					{/* Footer Summary & Place Order Button */}
					{cart.length > 0 && (
						<div className="p-4 sm:p-5 border-t border-stone-200 bg-[#FAF7F2] space-y-3">
							<div className="space-y-1.5 text-xs text-stone-600">
								<div className="flex justify-between">
									<span>قيمة المنتجات:</span>
									<span className="font-semibold text-stone-900 tabular-nums">
										{cartTotal} د.إ
									</span>
								</div>
								<div className="flex justify-between">
									<span>رسوم التوصيل المبرد:</span>
									<span className="font-semibold tabular-nums">
										{deliveryFee === 0 ? (
											<span className="text-emerald-700">مجاناً</span>
										) : (
											`${deliveryFee} د.إ`
										)}
									</span>
								</div>
								<div className="flex justify-between text-base font-bold text-[#2C2014] pt-2 border-t border-stone-200">
									<span>المجموع الكلي:</span>
									<span className="font-serif text-xl tabular-nums">
										{grandTotal} د.إ
									</span>
								</div>
							</div>

							<button
								type="submit"
								form="checkout-form"
								disabled={isSubmitting}
								className="w-full py-3.5 px-4 bg-[#2C2014] text-amber-200 text-sm font-bold rounded-xl hover:bg-black transition-colors shadow flex items-center justify-center gap-2"
							>
								{isSubmitting ? (
									<span>جاري تسجيل الطلب في قاعدة البيانات...</span>
								) : paymentMethod === "whatsapp" ? (
									<>
										<MessageSquare className="w-4 h-4 text-emerald-400" />
										<span>تأكيد الطلب المباشر عبر واتساب ({grandTotal} د.إ)</span>
									</>
								) : (
									<>
										<CheckCircle className="w-4 h-4 text-amber-400" />
										<span>تأكيد الطلب الآن ({grandTotal} د.إ)</span>
									</>
								)}
							</button>

							<p className="text-[10px] text-stone-400 text-center">
								سيصلك اتصال من فريق التوصيل لتأكيد وقت الوصول
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
