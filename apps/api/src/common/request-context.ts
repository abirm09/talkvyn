import { AsyncLocalStorage } from "node:async_hooks";
import type { Request } from "express";

export interface RequestWithId extends Request {
  requestId?: string;
}

export interface RequestContext {
  requestId: string;
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext(context: RequestContext, callback: () => void): void {
  requestContextStorage.run(context, callback);
}

export function getRequestId(request?: object): string | undefined {
  const requestId =
    request && "requestId" in request && typeof request.requestId === "string"
      ? request.requestId
      : undefined;

  return requestId ?? requestContextStorage.getStore()?.requestId;
}
