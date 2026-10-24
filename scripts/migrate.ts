/** Creates or updates Better Auth tables (app tables are created by src/lib/db.ts). `pnpm db:migrate` */
import { getMigrations } from "better-auth/db/migration";
import { auth } from "@/lib/auth";
import { databasePath } from "@/lib/db";

const { runMigrations, toBeCreated, toBeAdded } = await getMigrations(auth.options);
await runMigrations();
console.log(`Database ready at ${databasePath()} (created ${toBeCreated.length} tables, added ${toBeAdded.length} columns).`);
