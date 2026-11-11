import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentStaff } from "../staff-auth/current-staff.decorator.js";
import { RequirePermissions } from "../staff-auth/require-permissions.decorator.js";
import { StaffAuthGuard } from "../staff-auth/staff-auth.guard.js";
import { StaffPermissionsGuard } from "../staff-auth/staff-permissions.guard.js";
import type { StaffPrincipal } from "../staff-auth/staff-auth.types.js";
import type { CreateStaffDto, StaffListQueryDto, UpdateStaffDto } from "./staff.dto.js";
import {
  createStaffSchema,
  staffIdSchema,
  staffListQuerySchema,
  StaffResponseDto,
  updateStaffSchema,
} from "./staff.dto.js";
import { StaffService } from "./staff.service.js";

@ApiTags("staff")
@ApiBearerAuth()
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@Controller({ path: "staff", version: "1" })
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @RequirePermissions("staff:read")
  @ApiOperation({ summary: "List staff accounts" })
  @ApiOkResponse({ description: "Staff page with pagination metadata" })
  list(@Query({ schema: staffListQuerySchema }) query: StaffListQueryDto) {
    return this.staff.list(query);
  }

  @Get("roles")
  @RequirePermissions("staff:create")
  @ApiOperation({ summary: "List roles the current staff member can assign" })
  @ApiOkResponse({ description: "Assignable staff roles" })
  roles(@CurrentStaff() actor: StaffPrincipal) {
    return this.staff.listAssignableRoles(actor);
  }

  @Get(":id")
  @RequirePermissions("staff:read")
  @ApiOperation({ summary: "Get a staff account" })
  @ApiOkResponse({ type: StaffResponseDto })
  get(@Param("id", { schema: staffIdSchema }) id: string) {
    return this.staff.get(id);
  }

  @Post()
  @RequirePermissions("staff:create")
  @ApiOperation({ summary: "Create a staff account" })
  @ApiCreatedResponse({ type: StaffResponseDto })
  create(
    @Body({ schema: createStaffSchema }) body: CreateStaffDto,
    @CurrentStaff() actor: StaffPrincipal,
  ) {
    return this.staff.create(body, actor);
  }

  @Patch(":id")
  @RequirePermissions("staff:update")
  @ApiOperation({ summary: "Update a staff account" })
  @ApiOkResponse({ type: StaffResponseDto })
  update(
    @Param("id", { schema: staffIdSchema }) id: string,
    @Body({ schema: updateStaffSchema }) body: UpdateStaffDto,
    @CurrentStaff() actor: StaffPrincipal,
  ) {
    return this.staff.update(id, body, actor);
  }

  @Delete(":id")
  @RequirePermissions("staff:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Disable a staff account and revoke its sessions" })
  @ApiNoContentResponse({ description: "Staff account disabled" })
  async disable(
    @Param("id", { schema: staffIdSchema }) id: string,
    @CurrentStaff() actor: StaffPrincipal,
  ) {
    await this.staff.disable(id, actor);
  }
}
