import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  ziinaCreateIntentAction,
  ziinaStatusLoader,
} from "../backend/enterpoints/ziinaEnterpoint";

export async function action(args: ActionFunctionArgs) {
  return ziinaCreateIntentAction(args);
}

export async function loader(args: LoaderFunctionArgs) {
  return ziinaStatusLoader(args);
}

