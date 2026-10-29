import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { r2Loader, r2Action } from "../backend/enterpoints/r2Enterpoint";

export async function loader(args: LoaderFunctionArgs) {
  return r2Loader(args);
}

export async function action(args: ActionFunctionArgs) {
  return r2Action(args);
}
