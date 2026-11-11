import type { Request } from "express";

export function getRouteTemplate(request: Pick<Request, "method" | "route">): string {
  const route: unknown = request.route;

  if (
    typeof route === "object" &&
    route !== null &&
    "path" in route &&
    typeof route.path === "string" &&
    route.path.startsWith("/")
  ) {
    return route.path;
  }

  return request.method === "OPTIONS" ? "<preflight>" : "<unmatched>";
}

export function getElapsedMilliseconds(
  startedAt: bigint,
  endedAt = process.hrtime.bigint(),
): number {
  return Math.round(Number(endedAt - startedAt) / 10_000) / 100;
}

export function isHealthCheckRequest(request: Pick<Request, "path">): boolean {
  return /(?:^|\/)health\/?$/.test(request.path);
}
