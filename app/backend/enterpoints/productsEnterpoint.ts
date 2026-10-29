import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { handleProductsLoader, handleProductsAction } from "../apis/productsApi";

export async function productsLoader(args: LoaderFunctionArgs) {
  return handleProductsLoader(args);
}

export async function productsAction(args: ActionFunctionArgs) {
  return handleProductsAction(args);
}
