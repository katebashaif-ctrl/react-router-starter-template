import arLocale from "./ar.json";
import cmsLocale from "./cms.json";
import initialDataJson from "./initialData.json";
import productsJson from "./products.json";

export const locale = {
  ...arLocale,
  cms: cmsLocale,
};

export const initialData = initialDataJson;
export const productsData = productsJson;

export type TranslationKey = string;

export function t(path: string, params?: Record<string, string | number>): string {
  const parts = path.split(".");
  let current: any = locale;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return path;
    }
  }

  if (typeof current !== "string") {
    return path;
  }

  let text = current;
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
    }
  }

  return text;
}

export function formatImagePath(src?: string): string {
  if (!src) return "/images/redfig.jpg";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  return src.startsWith("/") ? src : `/${src}`;
}
