import cmsStringsJson from "./cmsStrings.json";

const cmsStrings: Record<string, string> = cmsStringsJson;

export function cmsT(key: string): string {
  return cmsStrings[key] ?? key;
}

export function cmsFormat(key: string, args: (string | number)[]): string {
  let text = cmsT(key);
  args.forEach((arg, i) => {
    text = text.replace(new RegExp(`\\{${i}\\}`, "g"), String(arg));
  });
  return text;
}
