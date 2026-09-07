import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { ensureDatabaseTables } from './auto-migrate';

const connectionString = process.env.DATABASE_URL || 'postgres://rubenroquemx:Leylichis.141213@ruben-roque_legislab-db:5432/legislab-db?sslmode=disable';

// Connection client for queries
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export * from './schema';

// Trigger automatic table creation in the background
ensureDatabaseTables(connectionString);
