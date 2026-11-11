import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { StaffAuthService } from "./staff-auth.service.js";
import type { StaffRequest } from "./staff-auth.types.js";

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly auth: StaffAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StaffRequest>();
    const authorization = request.header("authorization");
    const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]{40,})$/);
    if (!match) throw new UnauthorizedException("A valid bearer token is required");

    request.staff = await this.auth.authenticate(match[1]!);
    return true;
  }
}
