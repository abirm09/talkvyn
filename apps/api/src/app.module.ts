import { Module, RequestMethod } from "@nestjs/common";
import type { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { getServerEnv } from "@talkvyn/env/server";
import { HttpRequestLoggerMiddleware } from "./common/middleware/http-request-logger.middleware.js";
import { RequestContextMiddleware } from "./common/middleware/request-context.middleware.js";
import { HealthModule } from "./health/health.module.js";
import { accountRateLimitTracker } from "./common/security/account-rate-limit-tracker.js";
import { StaffAuthModule } from "./staff-auth/staff-auth.module.js";
import { StaffModule } from "./staff/staff.module.js";

const serverEnv = getServerEnv();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [() => serverEnv],
    }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 120 },
      { name: "account", ttl: 60_000, limit: 120, getTracker: accountRateLimitTracker },
    ]),
    HealthModule,
    StaffAuthModule,
    StaffModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, HttpRequestLoggerMiddleware)
      .forRoutes({ path: "{*path}", method: RequestMethod.ALL });
  }
}
