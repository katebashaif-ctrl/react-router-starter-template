import type { LoaderFunctionArgs } from "react-router";
import { ziinaVerifyLoader } from "../backend/enterpoints/ziinaEnterpoint";

export async function loader(args: LoaderFunctionArgs) {
  return ziinaVerifyLoader(args);
}
