import { Injectable, Logger } from "@nestjs/common";
import type { NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { getRequestId } from "../request-context.js";
import {
  getElapsedMilliseconds,
  getRouteTemplate,
  isHealthCheckRequest,
} from "../utils/http-request.js";

@Injectable()
export class HttpRequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    let logged = false;

    const complete = (aborted: boolean): void => {
      if (logged) return;
      logged = true;

      const statusCode = aborted ? 499 : response.statusCode;
      if (isHealthCheckRequest(request) && statusCode < 400) return;

      const durationMs = getElapsedMilliseconds(startedAt);
      const requestId = getRequestId(request);
      const message = [
        request.method,
        getRouteTemplate(request),
        statusCode,
        `${durationMs.toFixed(2)}ms`,
        aborted ? "(client disconnected)" : undefined,
        requestId ? `[request_id=${requestId}]` : undefined,
      ]
        .filter(Boolean)
        .join(" ");

      if (statusCode >= 500) this.logger.error(message);
      else if (statusCode >= 400) this.logger.warn(message);
      else this.logger.log(message);
    };

    response.once("finish", () => complete(false));
    response.once("close", () => complete(!response.writableFinished));
    next();
  }
}
