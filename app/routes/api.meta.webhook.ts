import type { ActionFunctionArgs } from "react-router";
import { metaWebhookAction } from "../backend/enterpoints/metaEnterpoint";

export async function action(args: ActionFunctionArgs) {
  return metaWebhookAction(args);
}
