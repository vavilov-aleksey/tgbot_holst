import Database from "better-sqlite3";

const BD_FILE = "sessions.db";

const db = new Database(BD_FILE);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS SESSIONS (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

const stmtGet = db.prepare("SELECT data FROM sessions WHERE id = ?");
const stmtUpsert = db.prepare(
  "INSERT INTO sessions (id, data) VALUES (?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET data = excluded.data",
);

const stmtDelete = db.prepare("DELETE FROM sessions WHERE id = ?");
const stmtAll = db.prepare("SELECT id, data FROM sessions");

export const sessionStorage = {
  get(id: string) {
    const row = stmtGet.get(id);
    //@ts-ignore
    return row ? JSON.parse(row.data) : null;
  },
  save(id: string, data: Record<string, any>) {
    if (!data) return;
    stmtUpsert.run(id, JSON.stringify(data));
  },
  remove(id: string) {
    stmtDelete.run(id);
  },
  all() {
    return stmtAll
      .all()
      .map((r: any) => ({ id: r.id, data: JSON.parse(r.data) }));
  },
};
