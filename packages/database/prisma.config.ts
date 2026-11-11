import dotenv from "dotenv";
import { resolve } from "node:path";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

dotenv.config({ path: resolve(import.meta.dirname, "../../.env"), quiet: true });

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: process.env["DATABASE_URL"],
    },
  }),
});
