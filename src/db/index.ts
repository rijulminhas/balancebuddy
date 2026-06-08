import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Neon requires SSL. prepare:false is required for Drizzle + Neon compatibility.
// max:1 prevents connection pool exhaustion in serverless (Vercel) environments.
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 1,
});

export const db = drizzle(client, { schema });

export type DB = typeof db;
