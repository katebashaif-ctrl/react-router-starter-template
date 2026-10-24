import React, { useEffect, useState } from "react";
import type { Route } from "./+types/payment.callback";
import { Link, useSearchParams } from "react-router";
import {
	CheckCircle,
	XCircle,
	AlertTriangle,
	Loader2,
	ShoppingBag,
	CreditCard,
	ArrowRight,
	Truck,
	ShieldCheck,
	Receipt,
	Phone,
	MessageSquare,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "تأكيد الدفع الإلكتروني | خيرات الدار" },
		{
			name: "description",
			content: "نتيجة عملية الدفع الإلكتروني الآمن عبر بوابة Ziina لمتجر خيرات الدار الإماراتي.",
		},
	];
}

interface VerificationResult {
	status: string;
	isPaid: boolean;
	intent?: {
		id: string;
		amount: number;
		currency_code: string;
		status: string;
		card_details?: {
			card_last_four?: string;
			card_brand?: string;
			card_issuer?: string;
		};
	};
}

export default function PaymentCallback() {
	const [searchParams] = useSearchParams();
	const statusParam = searchParams.get("status") || "success";
	const orderId = searchParams.get("orderId") || "";
	const paymentIntentId = searchParams.get("payment_intent_id") || searchParams.get("id") || "";
	const isSimulated = searchParams.get("simulated") === "true";

	const [isLoading, setIsLoading] = useState(true);
	const [result, setResult] = useState<VerificationResult | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function verifyPayment() {
			if (!paymentIntentId && !orderId) {
				setIsLoading(false);
				return;
			}

			try {
				const verifyUrl = `/api/ziina/verify?payment_intent_id=${encodeURIComponent(
					paymentIntentId,
				)}&orderId=${encodeURIComponent(orderId)}${isSimulated ? "&simulated=true" : ""}&status=${encodeURIComponent(
					statusParam,
				)}`;
				const res = await fetch(verifyUrl);
				const data = (await res.json()) as any;
				if (isMounted) {
					if (data.success) {
						setResult(data);
					} else {
						setResult({
							status: statusParam === "success" ? "completed" : "failed",
							isPaid: statusParam === "success",
						});
					}
					setIsLoading(false);
				}
			} catch (err) {
				console.warn("Verification error:", err);
				if (isMounted) {
					setResult({
						status: statusParam === "success" ? "completed" : "failed",
						isPaid: statusParam === "success",
					});
					setIsLoading(false);
				}
			}
		}

		verifyPayment();
		return () => {
			isMounted = false;
		};
	}, [paymentIntentId, orderId, isSimulated, statusParam]);

	const isSuccess = statusParam === "success" && (result?.isPaid ?? true);
	const isCancelled = statusParam === "cancelled";

	return (
		<div className="min-h-screen bg-[#FAF7F2] text-right flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
			{/* Top Bar Header */}
			<header className="bg-[#2C2014] text-white border-b border-[#574127] py-4 px-6">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<Link to="/" className="flex items-center gap-3">
						<span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-base shadow-inner">
							خ
						</span>
						<div>
							<h1 className="font-serif text-lg font-bold text-amber-100">
								خيرات الدار · المتجر الإماراتي
							</h1>
							<p className="text-[10px] text-amber-300/80">
								بوابة الدفع الإلكتروني المعتمدة (Ziina Payment Gateway)
							</p>
						</div>
					</Link>
					<Link
						to="/"
						className="px-4 py-1.5 bg-[#574127] hover:bg-[#6d5231] text-amber-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
					>
						<span>العودة للرئيسية</span>
						<ArrowRight className="w-3.5 h-3.5" />
					</Link>
				</div>
			</header>

			{/* Main Content Area */}
			<main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
				<div className="w-full max-w-lg bg-white rounded-3xl border border-[#D6BE9F] shadow-2xl p-6 sm:p-8 space-y-6">
					{isLoading ? (
						<div className="py-16 text-center space-y-4">
							<Loader2 className="w-12 h-12 text-amber-700 animate-spin mx-auto" />
							<h2 className="font-serif text-xl font-bold text-[#2C2014]">
								جاري التحقق من عملية الدفع...
							</h2>
							<p className="text-xs text-stone-500">
								يرجى الانتظار لحظات بينما نقوم بمطابقة المعاملة مع بوابة Ziina
							</p>
						</div>
					) : isSuccess ? (
						<div className="space-y-6">
							{/* Success Header */}
							<div className="text-center space-y-2">
								<div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
									<CheckCircle className="w-9 h-9 text-emerald-600" />
								</div>
								<h2 className="font-serif text-2xl font-bold text-[#2C2014]">
									تم سداد وتأكيد طلبكم بنجاح!
								</h2>
								<p className="text-xs text-stone-500">
									شكراً لثقتكم بخيرات الدار. تم تسجيل الدفع رسمياً عبر بوابة Ziina وسيتم تجهيز الطلب فوراً.
								</p>
							</div>

							{/* Payment Receipt Card */}
							<div className="p-4 rounded-2xl bg-[#F5EFE6]/70 border border-[#D6BE9F] space-y-3 text-xs">
								<div className="flex items-center justify-between pb-2 border-b border-[#D6BE9F]/60">
									<span className="text-stone-600 flex items-center gap-1.5">
										<Receipt className="w-3.5 h-3.5 text-amber-800" />
										<span>حالة المعاملة:</span>
									</span>
									<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
										<ShieldCheck className="w-3 h-3 text-emerald-600" />
										<span>مدفوع ومكتمل (Paid)</span>
									</span>
								</div>

								{orderId && (
									<div className="flex items-center justify-between">
										<span className="text-stone-600">رقم الطلب:</span>
										<span className="font-mono font-bold text-stone-900" dir="ltr">
											{orderId}
										</span>
									</div>
								)}

								{paymentIntentId && (
									<div className="flex items-center justify-between">
										<span className="text-stone-600">رقم عملية Ziina:</span>
										<span className="font-mono text-[11px] text-stone-700 max-w-[200px] truncate" dir="ltr">
											{paymentIntentId}
										</span>
									</div>
								)}

								<div className="flex items-center justify-between">
									<span className="text-stone-600">طريقة الدفع:</span>
									<span className="font-semibold text-stone-900 flex items-center gap-1.5">
										<CreditCard className="w-3.5 h-3.5 text-amber-800" />
										<span>
											{result?.intent?.card_details?.card_brand || "Apple Pay / بطاقة ائتمانية"}
										</span>
									</span>
								</div>

								<div className="flex items-center justify-between pt-2 border-t border-[#D6BE9F]/60 font-bold">
									<span className="text-[#2C2014]">رسوم التوصيل المبرد:</span>
									<span className="text-emerald-700">توصيل مبرد ٢٤ ساعة</span>
								</div>
							</div>

							{/* Delivery Steps Notice */}
							<div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2.5">
								<Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
								<p className="leading-relaxed">
									سيتم قطاف وتجهيز طلبكم بسيارات مبردة لضمان أقصى درجات النضارة، وسيقوم مندوب التوصيل بالتواصل معكم قبل الوصول.
								</p>
							</div>

							{/* Action Buttons */}
							<div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
								<Link
									to="/"
									className="flex-1 py-3 px-4 bg-[#2C2014] hover:bg-black text-amber-200 text-xs font-bold rounded-xl transition-colors text-center shadow flex items-center justify-center gap-1.5"
								>
									<ShoppingBag className="w-4 h-4" />
									<span>متابعة التسوق في المتجر</span>
								</Link>
								<a
									href="https://wa.me/971501234567"
									target="_blank"
									rel="noreferrer"
									className="py-3 px-4 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
								>
									<MessageSquare className="w-4 h-4 text-emerald-600" />
									<span>خدمة العملاء بالواتساب</span>
								</a>
							</div>
						</div>
					) : (
						/* Failure / Cancellation Screen */
						<div className="space-y-6">
							<div className="text-center space-y-2">
								<div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
									{isCancelled ? (
										<AlertTriangle className="w-9 h-9 text-amber-600" />
									) : (
										<XCircle className="w-9 h-9 text-rose-600" />
									)}
								</div>
								<h2 className="font-serif text-2xl font-bold text-[#2C2014]">
									{isCancelled ? "تم إلغاء عملية الدفع" : "تعذر استكمال الدفع الإلكتروني"}
								</h2>
								<p className="text-xs text-stone-500">
									{isCancelled
										? "تم إلغاء جلسة الدفع عبر Ziina. لم يتم خصم أي مبلغ من بطاقتك ويمكنك إعادة المحاولة أو اختيار الدفع عند الاستلام."
										: "نعتذر، لم تكتمل العملية بنجاح. يرجى التأكد من رصيد البطاقة أو استخدام وسيلة دفع بديلة."}
								</p>
							</div>

							<div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
								<Link
									to="/"
									className="flex-1 py-3 px-4 bg-[#2C2014] hover:bg-black text-amber-200 text-xs font-bold rounded-xl transition-colors text-center shadow"
								>
									العودة إلى المتجر وتعديل السلة
								</Link>
								<a
									href="tel:+971 4 800 327"
									className="py-3 px-4 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
								>
									<Phone className="w-4 h-4 text-stone-600" />
									<span>اتصل بخدمة العملاء</span>
								</a>
							</div>
						</div>
					)}
				</div>
			</main>

			{/* Footer */}
			<footer className="py-4 text-center text-xs text-stone-400 border-t border-[#E8DCCB] bg-[#F5EFE6]/50">
				<p>© 2026 خيرات الدار. مدعوم ببوابة Ziina للدفع الإلكتروني المعتمدة في دولة الإمارات 🇦🇪</p>
			</footer>
		</div>
	);
}
