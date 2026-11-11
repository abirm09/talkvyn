interface RateLimitRequest extends Record<string, unknown> {
  body?: { email?: unknown };
  ip?: string;
}

export function accountRateLimitTracker(request: RateLimitRequest): string {
  const email = request.body?.email;
  const normalizedEmail =
    typeof email === "string" ? email.trim().normalize("NFC").toLowerCase() : "";
  return `${normalizedEmail}:${request.ip ?? "unknown"}`;
}
