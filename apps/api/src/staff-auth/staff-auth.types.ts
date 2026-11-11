import type { Request } from "express";

export interface StaffPrincipal {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  sessionId: string;
  permissions: ReadonlySet<string>;
}

export interface StaffRequest extends Request {
  staff?: StaffPrincipal;
}
