import React, { useState } from "react";
import { Check, Copy, Navigation } from "lucide-react";
import { t } from "../../frontend/locales/i18n";

export const CmsRouteInstructionsBanner: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/cms`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#2C2014] via-[#3D2C1C] to-[#2C2014] text-white p-4 rounded-2xl border border-amber-500/30 shadow-lg mb-6 text-right">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-sm font-bold text-amber-100">
                {t("cms.banner.title")}
              </h3>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
                /cms · /admin
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed max-w-3xl">
              {t("cms.banner.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">{t("cms.banner.copied")}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-300" />
                <span>{t("cms.banner.copyButton")}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-stone-400 hover:text-white px-2 py-1 text-xs"
            title="Close"
          >
            {t("cms.banner.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
