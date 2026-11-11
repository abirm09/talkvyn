import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";
import { runWithRequestContext, type RequestWithId } from "../request-context.js";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const requestId = randomUUID();
    request.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);

    runWithRequestContext({ requestId }, next);
  }
}
