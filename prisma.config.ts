import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

function loadLocalEnvFile(filename: string) {
  const filePath = path.join(process.cwd(), filename);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }
}

loadLocalEnvFile(".env");
loadLocalEnvFile(".env.local");

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
