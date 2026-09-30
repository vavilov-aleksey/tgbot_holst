import fs from "node:fs";
import { sessionStorage } from "../services/sessionStorage";

const raw = fs.readFileSync("sessions.json", "utf-8");
const db = JSON.parse(raw);

for (const { id, data } of db.sessions ?? []) {
  sessionStorage.save(id, data);
}
console.log("migrated", db.sessions?.length, "sessions");
