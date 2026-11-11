import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_PERMISSIONS } from "./require-permissions.decorator.js";
import type { StaffRequest } from "./staff-auth.types.js";

@Injectable()
export class StaffPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<StaffRequest>();
    if (required.every((permission) => request.staff?.permissions.has(permission))) return true;
    throw new ForbiddenException("You do not have permission to perform this action");
  }
}
