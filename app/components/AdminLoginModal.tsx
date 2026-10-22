import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { Lock, ShieldCheck, X, AlertCircle, ArrowLeft } from "lucide-react";

export const AdminLoginModal: React.FC = () => {
	const {
		isAdminLoginModalOpen,
		setIsAdminLoginModalOpen,
		adminLogin,
	} = useStore();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	if (!isAdminLoginModalOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		const success = adminLogin(username, password);
		if (!success) {
			setError("بيانات الدخول غير صحيحة. اسم المستخدم: admin وكلمة المرور: admin");
		} else {
			setUsername("");
			setPassword("");
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn text-right">
			<div
				className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#D6BE9F] p-6 sm:p-8 space-y-6"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					onClick={() => {
						setIsAdminLoginModalOpen(false);
						setError("");
					}}
					className="absolute top-4 left-4 p-1.5 rounded-full text-stone-400 hover:text-black hover:bg-stone-100 transition-colors"
					aria-label="إغلاق النافذة"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Header */}
				<div className="text-center space-y-2">
					<div className="w-14 h-14 rounded-2xl bg-[#F5EFE6] text-amber-900 border border-[#D6BE9F] flex items-center justify-center mx-auto shadow-inner">
						<Lock className="w-7 h-7 text-amber-800" />
					</div>
					<h3 className="font-serif text-2xl font-bold text-[#2C2014]">
						دخول المشرف الإداري
					</h3>
					<p className="text-xs text-stone-500">
						لوحة تحكم CMS محمية ومخصصة لإدارة مبيعات ومحاصيل خيرات الدار
					</p>
				</div>

				{/* Notice Badge */}
				<div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
					<ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
					<span>
						بيانات دخول المشرف المعتمدة: <strong>المستخدم: admin</strong> | <strong>كلمة المرور: admin</strong>
					</span>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-4 text-xs">
					{error && (
						<div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<div>
						<label className="block font-semibold text-stone-800 mb-1.5">
							اسم المستخدم المشرف
						</label>
						<input
							type="text"
							required
							autoFocus
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="admin"
							className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800 bg-stone-50"
							dir="ltr"
						/>
					</div>

					<div>
						<label className="block font-semibold text-stone-800 mb-1.5">
							كلمة المرور الإدارية
						</label>
						<input
							type="password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••"
							className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800 bg-stone-50"
							dir="ltr"
						/>
					</div>

					<button
						type="submit"
						className="w-full py-3 px-4 bg-[#2C2014] text-amber-200 font-bold rounded-xl hover:bg-black transition-colors shadow flex items-center justify-center gap-2 text-xs"
					>
						<span>تسجيل الدخول إلى CMS</span>
						<ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
					</button>

					<p className="text-[10px] text-stone-400 text-center">
						نظام التشفير الإداري الداخلي · دولة الإمارات العربية المتحدة
					</p>
				</form>
			</div>
		</div>
	);
};
