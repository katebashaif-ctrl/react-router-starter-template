import type { LoaderFunctionArgs } from "react-router";
import { metaCatalogFeedLoader } from "../backend/enterpoints/metaEnterpoint";

export async function loader(args: LoaderFunctionArgs) {
  return metaCatalogFeedLoader(args);
}
