import type { ActionFunctionArgs } from "react-router";
import { aiAgentAction } from "../backend/enterpoints/aiEnterpoint";

export async function action(args: ActionFunctionArgs) {
  return aiAgentAction(args);
}
