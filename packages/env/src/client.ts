import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001/api/v1"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  FRONTEND_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cachedClientEnv: ClientEnv | undefined;

export function getClientEnv(): ClientEnv {
  if (cachedClientEnv) return cachedClientEnv;

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    FRONTEND_PORT: process.env.FRONTEND_PORT,
  });
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map(({ path, message }) => `${path.join(".") || "environment"}: ${message}`)
      .join("\n");
    throw new Error(`Invalid client environment configuration:\n${errors}`);
  }

  cachedClientEnv = parsed.data;
  return cachedClientEnv;
}
