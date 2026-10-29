import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { Sparkles, Phone, X } from "lucide-react";
import { t } from "../frontend/locales/i18n";

export const AnnouncementBar: React.FC = () => {
	const { settings } = useStore();
	const [dismissed, setDismissed] = useState(false);

	if (!settings.bannerActive || dismissed) return null;

	return (
		<aside aria-label={t("announcement.tag")} className="bg-[#2C2014] text-[#E8DCCB] text-xs py-2 px-4 border-b border-[#574127]/40 relative z-30">
			<div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
				<div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
					<Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
					<p className="truncate font-medium">{settings.bannerNotice || t("announcement.defaultNotice")}</p>
				</div>
				<div className="hidden sm:flex items-center gap-4 shrink-0 text-stone-300">
					<a
						href={`tel:${settings.contactPhone || "0504020220"}`}
						className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
					>
						<Phone className="w-3 h-3 text-amber-400" />
						<span dir="ltr">{settings.contactPhone || "0504020220"}</span>
					</a>
					<button
						onClick={() => setDismissed(true)}
						aria-label={t("announcement.tag")}
						className="p-1 hover:text-white transition-colors"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
		</aside>
	);
};
