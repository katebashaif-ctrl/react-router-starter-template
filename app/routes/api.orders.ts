import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { ordersLoader, ordersAction } from "../backend/enterpoints/ordersEnterpoint";

export async function loader(args: LoaderFunctionArgs) {
  return ordersLoader(args);
}

export async function action(args: ActionFunctionArgs) {
  return ordersAction(args);
}
