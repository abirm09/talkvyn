import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, "..");
const schemaDir = path.join(packageDir, "src", "prisma", "schema");
const contractPath = path.join(packageDir, "src", "prisma", "contract.prisma");

const files = fs
  .readdirSync(schemaDir)
  .filter((file) => file.endsWith(".prisma"))
  .toSorted((a, b) => {
    if (a.startsWith("_") !== b.startsWith("_")) return a.startsWith("_") ? -1 : 1;
    return a.localeCompare(b);
  });

if (files.length === 0) {
  throw new Error(`No Prisma schema files found in ${schemaDir}`);
}

let contract = "// use prisma-8\n\n";
contract += "// Generated from src/prisma/schema/*.prisma. Edit the source files instead.\n\n";

for (const file of files) {
  const contents = fs
    .readFileSync(path.join(schemaDir, file), "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("// use prisma-8"))
    .join("\n")
    .trim();

  contract += `// File: src/prisma/schema/${file}\n\n${contents}\n\n`;
}

fs.writeFileSync(contractPath, contract);
console.log(`Stitched ${files.length} schema files into ${contractPath}`);
