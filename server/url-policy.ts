import { isIP } from "node:net";
export function domainAllowed(url: URL, domains: string[]) {
  return (
    !domains.length ||
    domains.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`))
  );
}
export function publicEvidenceUrl(value: string, domains: string[] = []) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid HTTPS URL");
  }
  if (
    value.length > 4096 ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    isIP(url.hostname.replace(/^\[|\]$/g, "")) ||
    !url.hostname.includes(".") ||
    /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(
      url.hostname,
    ) ||
    url.hostname.endsWith(".home.arpa")
  )
    throw new Error(
      "Extraction requires a public HTTPS hostname without credentials or a custom port",
    );
  if (!domainAllowed(url, domains))
    throw new Error("URL is outside this task’s allowed domains");
  url.hash = "";
  return url.href;
}
