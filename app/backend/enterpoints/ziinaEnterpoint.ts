import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  handleZiinaCreateIntent,
  handleZiinaVerify,
  handleZiinaWebhook,
  handleZiinaStatus,
} from "../apis/ziinaApi";

export async function ziinaCreateIntentAction(args: ActionFunctionArgs) {
  return handleZiinaCreateIntent(args);
}

export async function ziinaStatusLoader(args: LoaderFunctionArgs) {
  return handleZiinaStatus(args);
}

export async function ziinaVerifyLoader(args: LoaderFunctionArgs) {
  return handleZiinaVerify(args);
}

export async function ziinaWebhookAction(args: ActionFunctionArgs) {
  return handleZiinaWebhook(args);
}
