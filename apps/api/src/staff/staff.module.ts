import { Module } from "@nestjs/common";
import { StaffAuthModule } from "../staff-auth/staff-auth.module.js";
import { StaffController } from "./staff.controller.js";
import { StaffService } from "./staff.service.js";

@Module({
  imports: [StaffAuthModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
