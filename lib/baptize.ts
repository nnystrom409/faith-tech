// Mock of the Baptize The World API. One function per action, swappable for
// the real API later. Test data only.
import { saveChurch, type Church } from "./store";

export async function registerChurch(c: Church) {
  await saveChurch(c);
  return { ok: true, id: c.id };
}

// Reports add up: a church can report more than once on the day.
export async function saveCount(c: Church, count: number) {
  const at = new Date().toISOString();
  const reports = [...(c.reports ?? []), { count, at }];
  const updated = { ...c, reports, baptisms: reports.reduce((s, r) => s + r.count, 0), reportedAt: at };
  await saveChurch(updated);
  return updated;
}
