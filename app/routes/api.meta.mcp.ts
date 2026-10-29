import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { mcpLoader, mcpAction } from "../backend/enterpoints/mcpEnterpoint";

export async function loader(args: LoaderFunctionArgs) {
  return mcpLoader(args);
}

export async function action(args: ActionFunctionArgs) {
  return mcpAction(args);
}
