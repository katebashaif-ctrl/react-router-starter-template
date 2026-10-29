import React from "react";
import type { Route } from "./+types/home";
import { StoreProvider } from "../context/StoreContext";
import { HomeView } from "../frontend/view/HomeView";
import { t } from "../frontend/locales/i18n";

export function meta({}: Route.MetaArgs) {
  return [
    { title: t("brand.metaTitle") },
    {
      name: "description",
      content: t("brand.metaDescription"),
    },
  ];
}

export default function Home() {
  return (
    <StoreProvider>
      <HomeView />
    </StoreProvider>
  );
}
