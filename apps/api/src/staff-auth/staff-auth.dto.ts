import type { SchemaObject } from "@nestjs/swagger";
import { z } from "zod";

export const staffAuthProfileSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  status: z.enum(["active", "disabled"]),
  role: z.object({ id: z.uuid(), name: z.string() }),
  permissions: z.array(z.string()),
  lastLoginAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  sessionId: z.uuid(),
});
export type StaffAuthProfile = z.infer<typeof staffAuthProfileSchema>;
export const staffAuthProfileOpenApiSchema = z.toJSONSchema(staffAuthProfileSchema, {
  target: "openapi-3.0",
}) as unknown as SchemaObject;

export const staffAuthResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal("Bearer"),
  expiresAt: z.iso.datetime(),
  staff: staffAuthProfileSchema,
});
export type StaffAuthResponse = z.infer<typeof staffAuthResponseSchema>;
export const staffAuthResponseOpenApiSchema = z.toJSONSchema(staffAuthResponseSchema, {
  target: "openapi-3.0",
}) as unknown as SchemaObject;

export const staffLogoutResponseSchema = z.object({ status: z.literal("ok") });
export type StaffLogoutResponse = z.infer<typeof staffLogoutResponseSchema>;
export const staffLogoutResponseOpenApiSchema = z.toJSONSchema(staffLogoutResponseSchema, {
  target: "openapi-3.0",
}) as unknown as SchemaObject;
