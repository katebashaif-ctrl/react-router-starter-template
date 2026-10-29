import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  handleMetaCampaignsLoader,
  handleMetaCampaignsAction,
  handleMetaCatalogFeed,
  handleMetaWebhook,
} from "../apis/metaApi";

export async function metaCampaignsLoader(args: LoaderFunctionArgs) {
  return handleMetaCampaignsLoader(args);
}

export async function metaCampaignsAction(args: ActionFunctionArgs) {
  return handleMetaCampaignsAction(args);
}

export async function metaCatalogFeedLoader(args: LoaderFunctionArgs) {
  return handleMetaCatalogFeed(args);
}

export async function metaWebhookAction(args: ActionFunctionArgs) {
  return handleMetaWebhook(args);
}
