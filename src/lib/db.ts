import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const SCHEMA = `
create table if not exists profile (
  user_id text primary key,
  xp integer not null default 0,
  streak integer not null default 0,
  best_streak integer not null default 0,
  last_active text,
  plan text not null default 'free',
  plan_source text,
  plan_updated_at text
);
create table if not exists progress (
  user_id text not null,
  level_id text not null,
  best_stars integer not null,
  best_credits integer not null,
  best_p95 real not null,
  best_availability real not null,
  design text not null,
  attempts integer not null default 0,
  completed_at text,
  updated_at text not null,
  primary key (user_id, level_id)
);
create table if not exists runs (
  id integer primary key autoincrement,
  user_id text not null,
  level_id text not null,
  stars integer not null,
  credits integer not null,
  p95 real not null,
  availability real not null,
  created_at text not null
);
create index if not exists runs_user on runs (user_id, created_at);
create table if not exists badges (
  user_id text not null,
  badge text not null,
  earned_at text not null,
  primary key (user_id, badge)
);
create table if not exists daily_scores (
  date text not null,
  user_id text not null,
  stars integer not null,
  credits integer not null,
  p95 real not null,
  created_at text not null,
  primary key (date, user_id)
);
create table if not exists billing_events (
  id text primary key,
  kind text not null,
  user_id text,
  payload text not null,
  created_at text not null
);
`;

const holder = globalThis as unknown as { __systemSketchLabDb?: Database.Database };

export function databasePath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "system-sketch-lab.db");
}

/** One shared connection per process; app tables are created on first use. Auth tables come from `pnpm db:migrate`. */
export function db(): Database.Database {
  if (!holder.__systemSketchLabDb) {
    const file = databasePath();
    if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
    const conn = new Database(file);
    try {
      conn.pragma("journal_mode = WAL");
    } catch {
      // Some filesystems (FUSE mounts) cannot do WAL; the default rollback journal still works.
    }
    conn.pragma("busy_timeout = 5000");
    conn.exec(SCHEMA);
    holder.__systemSketchLabDb = conn;
  }
  return holder.__systemSketchLabDb;
}

export const nowIso = () => new Date().toISOString();
