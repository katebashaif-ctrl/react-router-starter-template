import React from "react";
import { useStore } from "../context/StoreContext";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
	const { toasts, removeToast } = useStore();

	if (toasts.length === 0) return null;

	return (
		<div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none text-right">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className="pointer-events-auto flex items-start gap-3 p-3.5 bg-[#2C2014] text-white rounded-xl shadow-xl border border-amber-900/60 animate-slideUp text-xs"
				>
					<div className="mt-0.5 shrink-0">
						{toast.type === "success" && (
							<CheckCircle2 className="w-4 h-4 text-emerald-400" />
						)}
						{toast.type === "info" && <Info className="w-4 h-4 text-blue-400" />}
						{toast.type === "warning" && (
							<AlertCircle className="w-4 h-4 text-amber-400" />
						)}
					</div>

					<div className="flex-1 min-w-0">
						<p className="font-bold text-amber-200">{toast.title}</p>
						<p className="text-stone-300 mt-0.5 leading-relaxed">{toast.message}</p>
					</div>

					<button
						onClick={() => removeToast(toast.id)}
						className="text-stone-400 hover:text-white p-0.5"
						aria-label="close"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			))}
		</div>
	);
};
