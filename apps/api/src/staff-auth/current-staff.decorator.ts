import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { StaffPrincipal, StaffRequest } from "./staff-auth.types.js";

export const CurrentStaff = createParamDecorator(
  (_data: unknown, context: ExecutionContext): StaffPrincipal => {
    const request = context.switchToHttp().getRequest<StaffRequest>();
    if (!request.staff) throw new Error("Staff authentication guard was not applied");
    return request.staff;
  },
);
