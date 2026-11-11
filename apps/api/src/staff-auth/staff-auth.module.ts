import { Module } from "@nestjs/common";
import { DatabaseShutdownProvider } from "./database-shutdown.provider.js";
import { StaffAuthController } from "./staff-auth.controller.js";
import { StaffAuthGuard } from "./staff-auth.guard.js";
import { StaffAuthService } from "./staff-auth.service.js";
import { StaffPermissionsGuard } from "./staff-permissions.guard.js";

@Module({
  controllers: [StaffAuthController],
  providers: [StaffAuthService, StaffAuthGuard, StaffPermissionsGuard, DatabaseShutdownProvider],
  exports: [StaffAuthService, StaffAuthGuard, StaffPermissionsGuard],
})
export class StaffAuthModule {}
