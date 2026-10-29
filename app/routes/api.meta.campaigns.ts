import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  metaCampaignsLoader,
  metaCampaignsAction,
} from "../backend/enterpoints/metaEnterpoint";

export async function loader(args: LoaderFunctionArgs) {
  return metaCampaignsLoader(args);
}

export async function action(args: ActionFunctionArgs) {
  return metaCampaignsAction(args);
}
