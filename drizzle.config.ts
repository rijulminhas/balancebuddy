import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// drizzle-kit doesn't load .env.local automatically (that's a Next.js convention)
config({ path: ".env.local" });

export default {
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
