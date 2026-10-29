import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { handleMcpLoader, handleMcpAction } from "../apis/mcpApi";

export async function mcpLoader(args: LoaderFunctionArgs) {
  return handleMcpLoader(args);
}

export async function mcpAction(args: ActionFunctionArgs) {
  return handleMcpAction(args);
}
