import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "@talkvyn/database";
import { hashPassword, verifyPassword } from "@talkvyn/database/passwords";
import type { StaffAuthProfile, StaffAuthResponse } from "./staff-auth.dto.js";
import type { StaffPrincipal } from "./staff-auth.types.js";

const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
const invalidCredentials = () => new UnauthorizedException("Invalid email or password");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

@Injectable()
export class StaffAuthService {
  private dummyPasswordHash?: Promise<string>;

  async login(
    input: { email: string; password: string },
    metadata: { ip?: string; userAgent?: string },
  ): Promise<StaffAuthResponse> {
    const email = input.email.trim().toLowerCase();
    const account = await db.orm.public.staff.where({ email_normalized: email }).first();
    const encoded =
      account?.password_hash ??
      (await (this.dummyPasswordHash ??= hashPassword(randomBytes(32).toString("base64url"))));
    const matches = await verifyPassword(input.password, encoded);

    if (!account || account.status !== "active" || !matches) throw invalidCredentials();

    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
    const sessionId = randomUUID();

    await db.orm.public.staff_sessions.create({
      id: sessionId,
      staff_id: account.id,
      token_hash: hashToken(token),
      expires_at: expiresAt.toISOString(),
      revoked_at: null,
      ip_address: metadata.ip ?? null,
      user_agent: metadata.userAgent?.slice(0, 512) ?? null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    await db.orm.public.staff.where({ id: account.id }).update({
      last_login_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    return {
      accessToken: token,
      tokenType: "Bearer" as const,
      expiresAt: expiresAt.toISOString(),
      staff: await this.profile(account.id, sessionId),
    };
  }

  async authenticate(token: string): Promise<StaffPrincipal> {
    const session = await db.orm.public.staff_sessions
      .where({ token_hash: hashToken(token) })
      .first();
    if (!session || session.revoked_at !== null || Date.parse(session.expires_at) <= Date.now()) {
      throw new UnauthorizedException("Staff authentication is invalid or expired");
    }

    const account = await db.orm.public.staff
      .where({ id: session.staff_id })
      .include("role", (role) => role.select("id", "name"))
      .first();
    if (!account || account.status !== "active" || !account.role) {
      throw new UnauthorizedException("Staff authentication is invalid or expired");
    }

    const grants = await db.orm.public.role_permissions
      .where({ role_id: account.role_id })
      .include("permission", (permission) => permission.select("resource", "action"))
      .all();
    const permissions = new Set(
      grants.flatMap(({ permission }) =>
        permission ? [`${permission.resource}:${permission.action}`] : [],
      ),
    );

    return {
      id: account.id,
      name: account.name,
      email: account.email_normalized,
      roleId: account.role.id,
      roleName: account.role.name,
      sessionId: session.id,
      permissions,
    };
  }

  async logout(token: string): Promise<void> {
    const session = await db.orm.public.staff_sessions
      .where({ token_hash: hashToken(token) })
      .first();
    if (!session || session.revoked_at !== null) return;

    await db.orm.public.staff_sessions.where({ id: session.id }).update({
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async me(staffId: string, sessionId: string): Promise<StaffAuthProfile> {
    return this.profile(staffId, sessionId);
  }

  private async profile(staffId: string, sessionId: string): Promise<StaffAuthProfile> {
    const account = await db.orm.public.staff
      .where({ id: staffId })
      .include("role", (role) => role.select("id", "name"))
      .first();
    if (!account || !account.role) throw invalidCredentials();

    const grants = await db.orm.public.role_permissions
      .where({ role_id: account.role_id })
      .include("permission", (permission) => permission.select("resource", "action"))
      .all();

    return {
      id: account.id,
      name: account.name,
      email: account.email_normalized,
      phone: account.phone,
      status: account.status,
      role: { id: account.role.id, name: account.role.name },
      permissions: [
        ...new Set(
          grants.flatMap(({ permission }) =>
            permission ? [`${permission.resource}:${permission.action}`] : [],
          ),
        ),
      ].sort(),
      lastLoginAt: account.last_login_at,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
      sessionId,
    };
  }
}
