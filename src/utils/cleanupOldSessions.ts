import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const PAYMENT_DATE_FORMAT = "DD.MM.YYYY HH:mm:ss";
const SESSION_TTL_DAYS = 30;
const SESSIONS_FILE = "sessions.json";
const BACKUP_DIR = "sessions-backups";
const MAX_BACKUPS = 5;

const isOlderThanTtl = (paymentDate?: string): boolean => {
  if (!paymentDate) return false;

  const parsed = dayjs(paymentDate, PAYMENT_DATE_FORMAT, true);
  if (!parsed.isValid()) return false;

  return parsed.isBefore(dayjs().subtract(SESSION_TTL_DAYS, "day"));
};

const createSessionsBackup = (): string | null => {
  const sessionsPath = path.resolve(SESSIONS_FILE);
  if (!fs.existsSync(sessionsPath)) return null;

  const backupDir = path.resolve(BACKUP_DIR);
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = dayjs().format("YYYY-MM-DD-HHmmss");
  const backupPath = path.join(backupDir, `sessions-${stamp}.json`);
  fs.copyFileSync(sessionsPath, backupPath);

  const backups = fs
    .readdirSync(backupDir)
    .filter((name) => name.startsWith("sessions-") && name.endsWith(".json"))
    .map((name) => ({
      name,
      mtime: fs.statSync(path.join(backupDir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const old of backups.slice(MAX_BACKUPS)) {
    fs.unlinkSync(path.join(backupDir, old.name));
  }

  return backupPath;
};

/** ??????? ?????? ? ??????? ?????? SESSION_TTL_DAYS ????. ???????? ?????? ??? ?????? ????. */
export const cleanupOldSessions = async (localSession: {
  DB: any;
}): Promise<void> => {
  try {
    const db = await localSession.DB.getState();
    const sessions: Array<{ id?: string; data?: any }> = db.sessions || [];
    const before = sessions.length;

    const kept = sessions.filter(
      (session) =>
        !isOlderThanTtl(session?.data?.user?.paymentInfo?.paymentDate),
    );

    const removed = before - kept.length;
    if (removed === 0) {
      console.log(`[sessions] cleanup: nothing to remove (total ${before})`);
      return;
    }

    const backupPath = createSessionsBackup();
    if (backupPath) {
      console.log(`[sessions] backup: ${backupPath}`);
    }

    await localSession.DB.set("sessions", kept).write();

    console.log(
      `[sessions] cleanup: removed ${removed} older than ${SESSION_TTL_DAYS}d, left ${kept.length}`,
    );
  } catch (error) {
    console.error("[sessions] cleanup failed:", error);
  }
};
