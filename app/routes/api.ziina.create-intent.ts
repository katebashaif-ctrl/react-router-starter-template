import type { ActionFunctionArgs } from "react-router";
import { ziinaCreateIntentAction } from "../backend/enterpoints/ziinaEnterpoint";

export async function action(args: ActionFunctionArgs) {
  return ziinaCreateIntentAction(args);
}
