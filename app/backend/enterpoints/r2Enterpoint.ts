import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { handleR2Loader, handleR2Action } from "../apis/r2Api";

export async function r2Loader(args: LoaderFunctionArgs) {
  return handleR2Loader(args);
}

export async function r2Action(args: ActionFunctionArgs) {
  return handleR2Action(args);
}
