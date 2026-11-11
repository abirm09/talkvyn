import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { db } from "@talkvyn/database";
import { hashPassword } from "@talkvyn/database/passwords";
import type { StaffPrincipal } from "../staff-auth/staff-auth.types.js";
import type { CreateStaffDto, StaffListQueryDto, UpdateStaffDto } from "./staff.dto.js";

const staffNotFound = () => new NotFoundException("Staff member not found");

@Injectable()
export class StaffService {
  async list(query: StaffListQueryDto) {
    const page = query.page;
    const perPage = query.perPage;
    const q = query.q?.trim();
    const filter = (collection: typeof db.orm.public.staff) => {
      let filtered = collection;
      if (q) filtered = filtered.where((staff) => staff.name.ilike(`%${q}%`));
      if (query.status) filtered = filtered.where({ status: query.status });
      return filtered;
    };

    const rows = await filter(db.orm.public.staff)
      .include("role", (role) => role.select("id", "name"))
      .orderBy((staff) => staff.created_at.desc())
      .limit(perPage + 1)
      .offset((page - 1) * perPage)
      .all();
    const hasMore = rows.length > perPage;
    const pageRows = hasMore ? rows.slice(0, perPage) : rows;

    return {
      data: pageRows.map((row) => this.toResponse(row)),
      meta: { page, perPage, hasMore },
    };
  }

  async get(id: string) {
    const row = await db.orm.public.staff
      .where({ id })
      .include("role", (role) => role.select("id", "name"))
      .first();
    if (!row) throw staffNotFound();
    return this.toResponse(row);
  }

  async listAssignableRoles(actor: StaffPrincipal) {
    const roles = await db.orm.public.roles.orderBy((role) => role.name.asc()).all();
    const result: { id: string; name: string }[] = [];
    for (const role of roles) {
      const grants = await db.orm.public.role_permissions
        .where({ role_id: role.id })
        .include("permission", (permission) => permission.select("resource", "action"))
        .all();
      const mayAssign = grants.every(
        ({ permission }) =>
          !permission || actor.permissions.has(`${permission.resource}:${permission.action}`),
      );
      if (mayAssign) result.push({ id: role.id, name: role.name });
    }
    return result;
  }

  async create(input: CreateStaffDto, actor: StaffPrincipal) {
    const email = input.email.trim().toLowerCase();
    if (await db.orm.public.staff.where({ email_normalized: email }).first()) {
      throw new ConflictException("A staff account with this email already exists");
    }
    await this.assertAssignableRole(input.roleId, actor);

    const now = new Date().toISOString();
    const data = {
      id: randomUUID(),
      name: input.name.trim(),
      email_normalized: email,
      password_hash: await hashPassword(input.password),
      role_id: input.roleId,
      phone: input.phone?.trim() || null,
      status: "active" as const,
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };

    try {
      const created = await db.orm.public.staff.create(data);
      return this.get(created.id);
    } catch (error: unknown) {
      if (await db.orm.public.staff.where({ email_normalized: email }).first()) {
        throw new ConflictException("A staff account with this email already exists");
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateStaffDto, actor: StaffPrincipal) {
    const account = await db.orm.public.staff.where({ id }).first();
    if (!account) throw staffNotFound();

    const changes = Object.keys(input);
    if (!changes.length) throw new BadRequestException("Provide at least one field to update");
    if (actor.id === id && (input.roleId || input.status === "disabled")) {
      throw new BadRequestException("You cannot change your own role or disable your own account");
    }
    if (input.roleId) await this.assertAssignableRole(input.roleId, actor);

    const email = input.email?.trim().toLowerCase();
    if (email && email !== account.email_normalized) {
      const duplicate = await db.orm.public.staff.where({ email_normalized: email }).first();
      if (duplicate) throw new ConflictException("A staff account with this email already exists");
    }

    const passwordHash = input.password ? await hashPassword(input.password) : undefined;
    const now = new Date().toISOString();
    await db.orm.public.staff.where({ id }).update({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(email ? { email_normalized: email } : {}),
      ...(input.roleId ? { role_id: input.roleId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(passwordHash ? { password_hash: passwordHash } : {}),
      updated_at: now,
    });

    if (input.roleId || input.status === "disabled" || passwordHash) {
      await this.revokeSessions(id, now);
    }
    return this.get(id);
  }

  async disable(id: string, actor: StaffPrincipal): Promise<void> {
    if (actor.id === id) throw new BadRequestException("You cannot disable your own account");
    const account = await db.orm.public.staff.where({ id }).first();
    if (!account) throw staffNotFound();
    const now = new Date().toISOString();
    await db.orm.public.staff.where({ id }).update({ status: "disabled", updated_at: now });
    await this.revokeSessions(id, now);
  }

  private async revokeSessions(staffId: string, now: string): Promise<void> {
    await db.orm.public.staff_sessions
      .where({ staff_id: staffId })
      .where((session) => session.revoked_at.isNull())
      .update({ revoked_at: now, updated_at: now });
  }

  private async assertAssignableRole(roleId: string, actor: StaffPrincipal): Promise<void> {
    const role = await db.orm.public.roles.where({ id: roleId }).first();
    if (!role) throw new NotFoundException("Staff role not found");

    const grants = await db.orm.public.role_permissions
      .where({ role_id: roleId })
      .include("permission", (permission) => permission.select("resource", "action"))
      .all();
    const forbidden = grants.some(({ permission }) =>
      permission ? !actor.permissions.has(`${permission.resource}:${permission.action}`) : false,
    );
    if (forbidden) {
      throw new ForbiddenException("You cannot assign a role with permissions you do not hold");
    }
  }

  private toResponse(row: {
    id: string;
    name: string;
    email_normalized: string;
    phone: string | null;
    status: "active" | "disabled";
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    role: { id: string; name: string } | null;
  }) {
    if (!row.role) throw new Error("Staff account has no assigned role");
    return {
      id: row.id,
      name: row.name,
      email: row.email_normalized,
      phone: row.phone,
      status: row.status,
      role: row.role,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
