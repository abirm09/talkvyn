import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  SerializeOptions,
  StandardSchemaSerializerInterceptor,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Throttle, minutes } from "@nestjs/throttler";
import { z } from "zod";
import { ApiErrorResponseDto } from "../common/dto/api-error-response.dto.js";
import { CurrentStaff } from "./current-staff.decorator.js";
import { StaffAuthGuard } from "./staff-auth.guard.js";
import { StaffAuthService } from "./staff-auth.service.js";
import type { StaffPrincipal, StaffRequest } from "./staff-auth.types.js";
import {
  staffAuthProfileOpenApiSchema,
  staffAuthProfileSchema,
  staffAuthResponseOpenApiSchema,
  staffAuthResponseSchema,
  staffLogoutResponseOpenApiSchema,
  staffLogoutResponseSchema,
  type StaffLogoutResponse,
} from "./staff-auth.dto.js";

const staffLoginSchema = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(12).max(128),
});
type StaffLoginDto = z.infer<typeof staffLoginSchema>;

@ApiTags("staff-auth")
@UseInterceptors(StandardSchemaSerializerInterceptor)
@Controller({ path: "staff-auth", version: "1" })
export class StaffAuthController {
  constructor(private readonly auth: StaffAuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: 30, ttl: minutes(15) },
    account: { limit: 5, ttl: minutes(15) },
  })
  @ApiOperation({ summary: "Sign in as staff" })
  @ApiOkResponse({ schema: staffAuthResponseOpenApiSchema, description: "Staff session created" })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto, description: "Invalid credentials" })
  @SerializeOptions({ schema: staffAuthResponseSchema })
  login(@Body({ schema: staffLoginSchema }) body: StaffLoginDto, @Req() request: StaffRequest) {
    return this.auth.login(body, {
      ip: request.ip,
      userAgent: request.header("user-agent"),
    });
  }

  @Get("me")
  @UseGuards(StaffAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current staff profile" })
  @ApiOkResponse({ schema: staffAuthProfileOpenApiSchema, description: "Current staff profile" })
  @SerializeOptions({ schema: staffAuthProfileSchema })
  me(@CurrentStaff() staff: StaffPrincipal) {
    return this.auth.me(staff.id, staff.sessionId);
  }

  @Post("logout")
  @UseGuards(StaffAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke the current staff session" })
  @ApiOkResponse({ schema: staffLogoutResponseOpenApiSchema, description: "Staff session revoked" })
  @SerializeOptions({ schema: staffLogoutResponseSchema })
  async logout(@Headers("authorization") authorization: string): Promise<StaffLogoutResponse> {
    const token = authorization.slice("Bearer ".length);
    await this.auth.logout(token);
    return { status: "ok" };
  }
}
