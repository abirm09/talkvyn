import { ApiProperty } from "@nestjs/swagger";

export class HealthStatusDto {
  @ApiProperty({ enum: ["ok"], example: "ok" })
  status!: "ok";

  @ApiProperty({ example: "talkvyn-api" })
  service!: string;

  @ApiProperty({ format: "date-time", example: "2026-11-11T12:00:00.000Z" })
  timestamp!: string;
}
