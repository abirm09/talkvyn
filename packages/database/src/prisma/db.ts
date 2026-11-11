import dotenv from "dotenv";
import { resolve } from "node:path";
import postgres, { type PostgresClient } from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "./contract.d.js";
import contractJson from "./contract.json" with { type: "json" };

dotenv.config({ path: resolve(import.meta.dirname, "../../../../.env"), quiet: true });

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
}

export const contract = contractFromJson<Contract>(contractJson);

export const db: PostgresClient<Contract> = postgres({
  contract,
  url: databaseUrl,
});
