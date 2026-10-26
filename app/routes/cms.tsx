import React, { useState } from "react";
import type { Route } from "./+types/cms";
import { StoreProvider, useStore } from "../context/StoreContext";
import { CMSDashboard } from "../components/CMSDashboard";
import { ToastContainer } from "../components/ToastContainer";
import { Lock, ShieldCheck, ArrowRight, ArrowLeft, Store, Copy, Check, Info } from "lucide-react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "لوحة تحكم تين ليوا | CMS teenliwa" },
		{
			name: "description",
			content:
				"لوحة تحكم CMS الشاملة لمتجر تين ليوا (teenliwa) لإدارة المحاصيل، الطلبات، المخزون، وحملات إعلانات Meta.",
		},
	];
}

const CMSPageContent: React.FC = () => {
	const { isAdminAuthenticated, adminLogin, setCurrentView } = useStore();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [copiedUrl, setCopiedUrl] = useState(false);

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		const success = adminLogin(username, password);
		if (!success) {
			setError("بيانات الدخول غير صحيحة. اسم المستخدم: admin وكلمة المرور: admin");
		}
	};

	const copyCmsUrl = () => {
		if (typeof window !== "undefined") {
			navigator.clipboard.writeText(`${window.location.origin}/cms`);
			setCopiedUrl(true);
			setTimeout(() => setCopiedUrl(false), 2500);
		}
	};

	// 1. Unauthenticated Admin Screen
	if (!isAdminAuthenticated) {
		return (
			<div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between text-right">
				{/* Top bar with back to store */}
				<header className="bg-[#2C2014] text-white border-b border-[#574127] py-4 px-6">
					<div className="max-w-6xl mx-auto flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span className="font-serif text-lg font-bold text-amber-100">
								تين ليوا (teenliwa) · لوحة تحكم المشرف (CMS)
							</span>
						</div>
						<Link
							to="/"
							onClick={() => setCurrentView("store")}
							className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#574127] text-amber-200 text-xs font-semibold rounded-lg hover:bg-[#6d5231] transition-colors"
						>
							<span>العودة للمتجر الرئيسي</span>
							<Store className="w-3.5 h-3.5" />
						</Link>
					</div>
				</header>

				{/* Center Login Box with Route Instructions */}
				<main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
					<div className="w-full max-w-md bg-white rounded-3xl border border-[#D6BE9F] shadow-2xl p-6 sm:p-8 space-y-6">
						{/* Icon & Title */}
						<div className="text-center space-y-2">
							<div className="w-16 h-16 rounded-2xl bg-[#F5EFE6] text-amber-900 border border-[#D6BE9F] flex items-center justify-center mx-auto shadow-inner">
								<Lock className="w-8 h-8 text-amber-800" />
							</div>
							<h1 className="font-serif text-2xl font-bold text-[#2C2014]">
								تسجيل دخول المشرف إلى CMS
							</h1>
							<p className="text-xs text-stone-500">
								الوصول المباشر إلى لوحة إدارة المتجر والمحاصيل وحملات Meta
							</p>
						</div>

						{/* Route Instructions Banner */}
						<div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 space-y-2 text-xs text-amber-950">
							<div className="flex items-center justify-between font-bold text-amber-900 text-[11px]">
								<span className="flex items-center gap-1.5">
									<Info className="w-4 h-4 text-amber-700 shrink-0" />
									<span>مسار الوصول المباشر (Direct Route):</span>
								</span>
								<button
									onClick={copyCmsUrl}
									className="px-2 py-0.5 bg-white text-stone-700 rounded border border-amber-300 text-[10px] hover:bg-stone-50 flex items-center gap-1"
									title="نسخ الرابط المباشر"
								>
									{copiedUrl ? (
										<>
											<Check className="w-3 h-3 text-emerald-600" />
											<span className="text-emerald-700 font-bold">تم النسخ</span>
										</>
									) : (
										<>
											<Copy className="w-3 h-3 text-stone-500" />
											<span>نسخ الرابط</span>
										</>
									)}
								</button>
							</div>
							<div className="font-mono text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 text-stone-800 flex items-center justify-between" dir="ltr">
								<span>/cms</span>
								<span className="text-stone-400 text-[10px]">أو /admin</span>
							</div>
							<p className="text-[11px] text-amber-800 leading-relaxed">
								بيانات الدخول المعتمدة للإدارة: اسم المستخدم: <strong>admin</strong> | كلمة المرور: <strong>admin</strong>
							</p>
						</div>

						{/* Form */}
						<form onSubmit={handleLogin} className="space-y-4 text-xs">
							{error && (
								<div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
									{error}
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
									dir="ltr"
									className="w-full px-4 py-3 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800 bg-stone-50"
								/>
							</div>

							<div>
								<label className="block font-semibold text-stone-800 mb-1.5">
									كلمة المرور
								</label>
								<input
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									dir="ltr"
									className="w-full px-4 py-3 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-amber-800 focus:ring-1 focus:ring-amber-800 bg-stone-50"
								/>
							</div>

							<button
								type="submit"
								className="w-full py-3.5 px-4 bg-[#2C2014] text-amber-200 font-bold rounded-xl hover:bg-black transition-colors shadow flex items-center justify-center gap-2 text-xs"
							>
								<span>دخول لوحة التحكم</span>
								<ArrowLeft className="w-4 h-4 text-amber-400" />
							</button>
						</form>

						<div className="pt-2 text-center text-[11px] text-stone-400">
							نظام إدارة التجارة والمحاصيل الزراعية · دولة الإمارات العربية المتحدة 🇦🇪
						</div>
					</div>
				</main>

				{/* Footer */}
				<footer className="text-center py-4 text-xs text-stone-500 border-t border-[#E8DCCB] bg-white">
					مزارع تين ليوا © {new Date().getFullYear()} · متجر تين ليوا الإماراتي
				</footer>
				<ToastContainer />
			</div>
		);
	}

	// 2. Authenticated Admin View
	return (
		<>
			<CMSDashboard />
			<ToastContainer />
		</>
	);
};

export default function CMSPage() {
	return (
		<StoreProvider>
			<CMSPageContent />
		</StoreProvider>
	);
}
