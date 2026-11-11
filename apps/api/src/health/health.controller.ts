import { Controller, Get } from "@nestjs/common";
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiErrorResponseDto } from "../common/dto/api-error-response.dto.js";
import { HealthStatusDto } from "./health-status.dto.js";

@ApiTags("health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  @Get()
  @ApiOperation({
    summary: "Check API liveness",
    description: "Confirms that the API process is running and able to receive requests.",
  })
  @ApiOkResponse({
    description: "The API process is healthy.",
    type: HealthStatusDto,
  })
  @ApiInternalServerErrorResponse({
    description: "An unexpected server error occurred.",
    type: ApiErrorResponseDto,
  })
  getHealth(): HealthStatusDto {
    return {
      status: "ok",
      service: "talkvyn-api",
      timestamp: new Date().toISOString(),
    };
  }
}
