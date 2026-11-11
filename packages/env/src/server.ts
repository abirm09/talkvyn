import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(moduleDirectory, "../../../.env");

// Local development reads the single root env file. Deployment can inject env vars directly.
dotenv.config({ path: rootEnvPath, quiet: true });

const httpOriginSchema = z
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/"
    );
  }, "Use an HTTP(S) origin without credentials, a path, query or fragment")
  .transform((value) => new URL(value).origin);

const logLevelSchema = z.enum(["fatal", "error", "warn", "log", "debug", "verbose"]);
export type ServerLogLevel = z.infer<typeof logLevelSchema>;

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    HOST: z.string().min(1).default("127.0.0.1"),
    DATABASE_URL: z.url(),
    STAFF_BOOTSTRAP_NAME: z.string().min(2).max(100).optional(),
    STAFF_BOOTSTRAP_EMAIL: z.email().max(254).optional(),
    STAFF_BOOTSTRAP_PASSWORD: z.string().min(12).max(128).optional(),
    REDIS_URL: z.url().optional(),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    MAIL_FROM: z.email().optional(),
    CORS_ORIGINS: z
      .string()
      .default("http://localhost:3000")
      .transform((value) => value.split(",").map((origin) => origin.trim()))
      .pipe(z.array(httpOriginSchema).min(1)),
    SWAGGER_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    LOG_LEVELS: z
      .string()
      .optional()
      .transform((value) =>
        value
          ?.split(",")
          .map((level) => level.trim())
          .filter(Boolean),
      )
      .pipe(z.array(logLevelSchema).optional()),
  })
  .superRefine((environment, context) => {
    const provided = [
      environment.STAFF_BOOTSTRAP_NAME,
      environment.STAFF_BOOTSTRAP_EMAIL,
      environment.STAFF_BOOTSTRAP_PASSWORD,
    ].filter((value) => value !== undefined).length;
    if (provided !== 0 && provided !== 3) {
      context.addIssue({
        code: "custom",
        path: ["STAFF_BOOTSTRAP_NAME"],
        message:
          "Provide STAFF_BOOTSTRAP_NAME, STAFF_BOOTSTRAP_EMAIL and STAFF_BOOTSTRAP_PASSWORD together",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map(({ path: issuePath, message }) => `${issuePath.join(".") || "environment"}: ${message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${errors}`);
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export function getServerLogLevels(isProduction: boolean): ServerLogLevel[] {
  const configuredLevels = getServerEnv().LOG_LEVELS;
  if (configuredLevels?.length) return configuredLevels;
  return isProduction
    ? ["fatal", "error", "warn", "log"]
    : ["fatal", "error", "warn", "log", "debug", "verbose"];
}
