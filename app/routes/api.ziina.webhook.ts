import type { ActionFunctionArgs } from "react-router";
import { ziinaWebhookAction } from "../backend/enterpoints/ziinaEnterpoint";

export async function action(args: ActionFunctionArgs) {
  return ziinaWebhookAction(args);
}
