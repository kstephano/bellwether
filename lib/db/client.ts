import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DbClient = ReturnType<typeof createDbClient>;

export function createDbClient(connectionString: string) {
  return drizzle(neon(connectionString), { schema });
}

let _db: DbClient | undefined;

export function getDb(): DbClient {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = createDbClient(url);
  }
  return _db;
}
