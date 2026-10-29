import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { handleOrdersLoader, handleOrdersAction } from "../apis/ordersApi";

export async function ordersLoader(args: LoaderFunctionArgs) {
  return handleOrdersLoader(args);
}

export async function ordersAction(args: ActionFunctionArgs) {
  return handleOrdersAction(args);
}
