import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { getRequestId, type RequestWithId } from "../request-context.js";
import { getRouteTemplate } from "../utils/http-request.js";
import { isRecord } from "../utils/is-record.js";

interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId: string | null;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse();
    const statusCode = exception instanceof HttpException ? exception.getStatus() : 500;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const isServerError = statusCode >= 500;
    const body: ApiErrorResponse = {
      statusCode,
      error: isServerError ? "Internal Server Error" : this.getErrorName(exceptionResponse),
      message: isServerError ? "Internal server error" : this.getMessage(exceptionResponse),
      timestamp: new Date().toISOString(),
      path: request.path,
      requestId: getRequestId(request) ?? null,
    };

    if (isServerError) {
      this.logger.error("Unhandled request error", {
        requestId: body.requestId,
        method: request.method,
        route: getRouteTemplate(request),
        exceptionType: exception instanceof Error ? exception.name : "UnknownError",
      });
    }

    httpAdapter.reply(response, body, statusCode);
  }

  private getErrorName(exceptionResponse: unknown): string {
    if (isRecord(exceptionResponse) && typeof exceptionResponse.error === "string") {
      return exceptionResponse.error;
    }

    return "Request Error";
  }

  private getMessage(exceptionResponse: unknown): string | string[] {
    if (typeof exceptionResponse === "string") {
      return exceptionResponse;
    }

    if (
      isRecord(exceptionResponse) &&
      (typeof exceptionResponse.message === "string" ||
        (Array.isArray(exceptionResponse.message) &&
          exceptionResponse.message.every((message) => typeof message === "string")))
    ) {
      return exceptionResponse.message;
    }

    return "Request failed";
  }
}
