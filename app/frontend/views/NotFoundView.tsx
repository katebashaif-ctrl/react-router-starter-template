import React from "react";
import { Link } from "react-router";
import { t } from "../locales/i18n";

export const NotFoundView: React.FC = () => {
	return (
		<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-right" dir="rtl">
			<div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#D6BE9F] shadow-xl text-center space-y-4">
				<div className="w-16 h-16 rounded-2xl bg-[#F5EFE6] text-amber-900 border border-[#D6BE9F] flex items-center justify-center mx-auto text-2xl font-bold font-serif">
					404
				</div>
				<h2 className="font-serif text-2xl font-bold text-[#2C2014]">
					{t("errors.notFoundTitle")}
				</h2>
				<p className="text-xs text-stone-500 leading-relaxed">
					{t("errors.notFoundDesc")}
				</p>
				<div className="pt-2">
					<Link
						to="/"
						className="inline-block px-6 py-2.5 bg-[#2C2014] text-amber-200 font-bold rounded-xl text-xs hover:bg-black transition-colors"
					>
						{t("errors.backHome")}
					</Link>
				</div>
			</div>
		</div>
	);
};
