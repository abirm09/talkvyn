import { randomUUID } from "node:crypto";
import { db } from "../prisma/db.js";
import { hashPassword } from "../passwords.js";

const permissionCatalog = [
  { resource: "staff", action: "read", description: "View staff accounts" },
  { resource: "staff", action: "create", description: "Create staff accounts" },
  { resource: "staff", action: "update", description: "Update staff accounts" },
  { resource: "staff", action: "delete", description: "Disable staff accounts" },
] as const;

function required(name: string, trim = true): string {
  const raw = process.env[name];
  const value = trim ? raw?.trim() : raw;
  if (!value) throw new Error(`${name} is required to seed the initial staff account`);
  return value;
}

async function ensureRole(name: string, isSystem: boolean): Promise<string> {
  const existing = await db.orm.public.roles.where({ name }).first();
  if (existing) return existing.id;

  const now = new Date().toISOString();
  const role = await db.orm.public.roles.create({
    id: randomUUID(),
    name,
    description: isSystem ? "Built-in administrator role" : "Default staff role",
    is_system: isSystem,
    created_at: now,
    updated_at: now,
  });
  return role.id;
}

async function main(): Promise<void> {
  const name = required("STAFF_BOOTSTRAP_NAME");
  const email = required("STAFF_BOOTSTRAP_EMAIL").toLowerCase();
  const password = required("STAFF_BOOTSTRAP_PASSWORD", false);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("STAFF_BOOTSTRAP_EMAIL must be a valid email address");
  }
  if (name.length < 2 || name.length > 100) {
    throw new Error("STAFF_BOOTSTRAP_NAME must contain between 2 and 100 characters");
  }

  const administratorRoleId = await ensureRole("administrator", true);
  await ensureRole("staff", false);

  await Promise.all(
    permissionCatalog.map(async (definition) => {
      let permission = await db.orm.public.permissions
        .where({ resource: definition.resource, action: definition.action })
        .first();
      if (!permission) {
        const now = new Date().toISOString();
        permission = await db.orm.public.permissions.create({
          id: randomUUID(),
          ...definition,
          created_at: now,
          updated_at: now,
        });
      }

      const grant = await db.orm.public.role_permissions
        .where({ role_id: administratorRoleId, permission_id: permission.id })
        .first();
      if (!grant) {
        await db.orm.public.role_permissions.create({
          id: randomUUID(),
          role_id: administratorRoleId,
          permission_id: permission.id,
          created_at: new Date().toISOString(),
        });
      }
    }),
  );

  const existingStaff = await db.orm.public.staff.where({ email_normalized: email }).first();
  if (existingStaff) {
    console.log(`Bootstrap staff already exists (${email}); credentials were left unchanged.`);
    return;
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  const staff = await db.orm.public.staff.create({
    id: randomUUID(),
    name,
    email_normalized: email,
    password_hash: passwordHash,
    role_id: administratorRoleId,
    status: "active",
    last_login_at: null,
    phone: null,
    created_at: now,
    updated_at: now,
  });

  console.log(`Created bootstrap administrator ${staff.email_normalized}.`);
}

try {
  await main();
} finally {
  await db.close();
}
