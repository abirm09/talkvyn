import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { z } from "zod";

export const staffIdSchema = z.uuid();

export const createStaffSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  password: z.string().min(12).max(128),
  roleId: staffIdSchema,
  phone: z.string().trim().max(40).optional(),
});
export type CreateStaffDto = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.email().max(254).optional(),
    password: z.string().min(12).max(128).optional(),
    roleId: staffIdSchema.optional(),
    status: z.enum(["active", "disabled"]).optional(),
    phone: z.string().trim().max(40).nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one field to update",
  });
export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;

export const staffListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  status: z.enum(["active", "disabled"]).optional(),
});
export type StaffListQueryDto = z.infer<typeof staffListQuerySchema>;

export class StaffResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: "email" })
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: ["active", "disabled"] })
  status!: "active" | "disabled";

  @ApiProperty({
    type: "object",
    properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
  })
  role!: { id: string; name: string };

  @ApiPropertyOptional({ format: "date-time", nullable: true })
  lastLoginAt!: string | null;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}
