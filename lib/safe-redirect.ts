/** Only allow same-site relative paths, so ?next= cannot be used as an open redirect. */
export function safeNext(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
