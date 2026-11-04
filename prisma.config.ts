import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Falls back gracefully without throwing a PrismaConfigEnvError
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "", 
  },
});
