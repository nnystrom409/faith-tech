// Mock of the Baptize The World API. One function per action, swappable for
// the real API later. Test data only.
import { saveChurch, type Church } from "./store";

export async function registerChurch(c: Church) {
  await saveChurch(c);
  return { ok: true, id: c.id };
}

export async function saveCount(c: Church, count: number) {
  await saveChurch({ ...c, baptisms: count, reportedAt: new Date().toISOString() });
  return { ok: true };
}
