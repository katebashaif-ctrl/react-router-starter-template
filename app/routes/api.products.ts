import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { productsLoader, productsAction } from "../backend/enterpoints/productsEnterpoint";

export async function loader(args: LoaderFunctionArgs) {
  return productsLoader(args);
}

export async function action(args: ActionFunctionArgs) {
  return productsAction(args);
}
