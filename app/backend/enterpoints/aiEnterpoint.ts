import type { ActionFunctionArgs } from "react-router";
import { handleAiAgentAction, handleAiMarketingAction } from "../apis/aiApi";

export async function aiAgentAction(args: ActionFunctionArgs) {
  return handleAiAgentAction(args);
}

export async function aiMarketingAction(args: ActionFunctionArgs) {
  return handleAiMarketingAction(args);
}
