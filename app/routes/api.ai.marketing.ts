import type { ActionFunctionArgs } from "react-router";
import { aiMarketingAction } from "../backend/enterpoints/aiEnterpoint";

export async function action(args: ActionFunctionArgs) {
  return aiMarketingAction(args);
}
