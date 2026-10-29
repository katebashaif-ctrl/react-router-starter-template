import React from "react";
import type { Route } from "./+types/payment.callback";
import { StoreProvider } from "../context/StoreContext";
import { PaymentCallbackView } from "../frontend/view/PaymentCallbackView";
import { t } from "../frontend/locales/i18n";

export function meta({}: Route.MetaArgs) {
  return [
    { title: t("paymentCallback.successTitle") },
    {
      name: "description",
      content: t("paymentCallback.successDesc"),
    },
  ];
}

export default function PaymentCallbackPage() {
  return (
    <StoreProvider>
      <PaymentCallbackView />
    </StoreProvider>
  );
}
