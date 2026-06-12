import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Neon requires SSL. prepare:false is required for Drizzle + Neon compatibility.
// max:1 in production (Vercel serverless — each function invocation gets its own connection).
// Higher pool in dev (persistent Node process) so Promise.all queries run concurrently.
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: process.env.NODE_ENV === "production" ? 1 : 5,
});

export const db = drizzle(client, { schema });

export type DB = typeof db;
