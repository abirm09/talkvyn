import { ConsoleLogger, StandardSchemaValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { getServerLogLevels } from "@talkvyn/env/server";
import helmet from "helmet";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter.js";

async function bootstrap(): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger(
      isProduction
        ? { json: true, logLevels: getServerLogLevels(isProduction) }
        : { logLevels: getServerLogLevels(isProduction) },
    ),
  });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.getOrThrow<string[]>("CORS_ORIGINS"),
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 600,
  });
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter(app.get(HttpAdapterHost)));
  app.enableShutdownHooks();

  if (config.getOrThrow<boolean>("SWAGGER_ENABLED")) {
    const openApiConfig = new DocumentBuilder()
      .setTitle("Talkvyn API")
      .setDescription("HTTP API for a self-hosted Talkvyn assistant instance.")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    const documentFactory = (): OpenAPIObject => SwaggerModule.createDocument(app, openApiConfig);

    SwaggerModule.setup("docs", app, documentFactory, {
      useGlobalPrefix: true,
      customSiteTitle: "Talkvyn API",
    });
  }

  await app.listen(config.getOrThrow<number>("PORT"), config.getOrThrow<string>("HOST"));
}

await bootstrap();
