import React from "react";
import { useStore } from "../../context/StoreContext";
import { LogOut, Store } from "lucide-react";
import { t } from "../locales/i18n";
import { ToastContainer } from "../../components/ToastContainer";

interface AdminLayoutProps {
	children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
	const { adminLogout, setCurrentView } = useStore();

	return (
		<div className="flex flex-col min-h-screen bg-[#FAF7F2] text-right">
			{/* Admin Header */}
			<header className="sticky top-0 z-40 bg-[#2C2014] text-[#E8DCCB] border-b border-[#574127] shadow-md">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="font-serif text-lg font-bold text-amber-200">
							{t("admin.cmsTitle")}
						</span>
						<span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded">
							Admin
						</span>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={() => setCurrentView("store")}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2]/10 hover:bg-[#FAF7F2]/20 text-stone-200 text-xs rounded-lg transition-colors"
						>
							<Store className="w-3.5 h-3.5 text-amber-300" />
							<span>{t("admin.backToStore")}</span>
						</button>

						<button
							onClick={adminLogout}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs rounded-lg transition-colors"
						>
							<LogOut className="w-3.5 h-3.5" />
							<span>{t("admin.logout")}</span>
						</button>
					</div>
				</div>
			</header>

			<main className="flex-1">{children}</main>

			<ToastContainer />
		</div>
	);
};
