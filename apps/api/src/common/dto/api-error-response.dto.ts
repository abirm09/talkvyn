import { ApiProperty } from "@nestjs/swagger";

export class ApiErrorResponseDto {
  @ApiProperty({ example: 500 })
  statusCode!: number;

  @ApiProperty({ example: "Internal Server Error" })
  error!: string;

  @ApiProperty({ oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] })
  message!: string | string[];

  @ApiProperty({ format: "date-time", example: "2026-11-11T12:00:00.000Z" })
  timestamp!: string;

  @ApiProperty({ example: "/api/v1/health" })
  path!: string;

  @ApiProperty({ format: "uuid", example: "aaecb6a0-4b67-4356-9e14-8a4cb06c37d2" })
  requestId!: string;
}
