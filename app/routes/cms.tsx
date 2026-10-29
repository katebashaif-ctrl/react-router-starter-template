import React from "react";
import type { Route } from "./+types/cms";
import { StoreProvider } from "../context/StoreContext";
import { CMSView } from "../frontend/view/CMSView";
import { t } from "../frontend/locales/i18n";

export function meta({}: Route.MetaArgs) {
  return [
    { title: t("admin.cmsTitle") },
    {
      name: "description",
      content: t("brand.metaDescription"),
    },
  ];
}

export default function CMSPage() {
  return (
    <StoreProvider>
      <CMSView />
    </StoreProvider>
  );
}
