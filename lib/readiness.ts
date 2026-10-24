// One readiness checklist per church, shared by the Telegram bot and /pack/plan.
// Stored in its own bucket ("readiness", id = church id) so a web tap and a bot
// saveChurch never overwrite each other.
import { createHmac, timingSafeEqual } from "node:crypto";
import { getRecord, putRecord, type Church, type Lang } from "./store";

export type ItemStatus = "complete" | "not_yet" | "need_help" | "na";
export type ItemKey = (typeof READINESS_ITEMS)[number]["key"];
export type Readiness = {
  churchId: string;
  items: Partial<Record<ItemKey, { status: ItemStatus; by: "web" | "telegram"; at: string }>>;
  updatedAt?: string;
};

// The build brief's readiness checklist (section 8).
export const READINESS_ITEMS = [
  { key: "venue", essential: true, en: "Date, time and venue", es: "Fecha, hora y lugar", hint: "Where and when, in your local time" },
  { key: "lead", essential: true, en: "Event lead and day-of contact", es: "Líder del evento y contacto del día", hint: "Who runs the day and who answers the phone" },
  { key: "volunteers", essential: false, en: "Volunteer roles", es: "Roles de voluntarios", hint: "Welcome, baptism assistants, follow-up" },
  { key: "access", essential: false, en: "Accessibility and arrival", es: "Accesibilidad y llegada", hint: "Ramp, seating, parking, interpreters" },
  { key: "water", essential: true, en: "Safe water and supervision", es: "Agua segura y supervisión", hint: "Changing area, two adults at the water, first aid" },
  { key: "prep", essential: true, en: "Candidate preparation", es: "Preparación de candidatos", hint: "How your church prepares each person" },
  { key: "reporting", essential: true, en: "Reporting owner", es: "Responsable del reporte", hint: "One person reports the event's baptisms" },
  { key: "followup", essential: true, en: "Follow-up owner and next step", es: "Responsable de seguimiento", hint: "Who walks with each person afterwards" },
  { key: "emergency", essential: true, en: "Emergency and disruption plan", es: "Plan de emergencia", hint: "Weather backup, first aid, who to call" },
] as const;

export const STATUSES: ItemStatus[] = ["complete", "not_yet", "need_help", "na"];
export const STATUS_LABEL: Record<Lang, Record<ItemStatus, string>> = {
  en: { complete: "Complete", not_yet: "Not yet", need_help: "Need help", na: "Not applicable" },
  es: { complete: "Listo", not_yet: "Todavía no", need_help: "Necesito ayuda", na: "No aplica" },
};
const EMOJI: Record<ItemStatus, string> = { complete: "✅", not_yet: "⏳", need_help: "🆘", na: "➖" };

const isKey = (k: string): k is ItemKey => READINESS_ITEMS.some((i) => i.key === k);
export const isStatus = (s: string): s is ItemStatus => (STATUSES as string[]).includes(s);
export const statusOf = (r: Readiness, key: ItemKey): ItemStatus => r.items[key]?.status ?? "not_yet";

export async function getReadiness(churchId: string): Promise<Readiness> {
  return (await getRecord<Readiness>("readiness", churchId)) ?? { churchId, items: {} };
}

export async function setItem(churchId: string, key: string, status: ItemStatus, by: "web" | "telegram"): Promise<Readiness> {
  if (!isKey(key)) throw new Error(`unknown readiness item: ${key}`);
  const r = await getReadiness(churchId);
  const at = new Date().toISOString();
  const next: Readiness = { churchId, items: { ...r.items, [key]: { status, by, at } }, updatedAt: at };
  await putRecord("readiness", churchId, next);
  return next;
}

// Ready only when every essential is Complete or Not applicable (brief: readiness gate).
export function summary(r: Readiness) {
  const done = READINESS_ITEMS.filter((i) => ["complete", "na"].includes(statusOf(r, i.key))).length;
  const open = READINESS_ITEMS.filter((i) => !["complete", "na"].includes(statusOf(r, i.key)));
  const ready = open.every((i) => !i.essential);
  const needHelp = READINESS_ITEMS.filter((i) => statusOf(r, i.key) === "need_help").map((i) => i.key);
  return { done, total: READINESS_ITEMS.length, ready, open: open.map((i) => i.key), needHelp };
}

// The same list as a Telegram message.
export function checklistText(church: Church, r: Readiness, lang: Lang = "en") {
  const l = STATUS_LABEL[lang];
  const s = summary(r);
  return [
    lang === "es" ? `Lista de preparación de ${church.name} (${s.done}/${s.total}):` : `${church.name}'s readiness list (${s.done} of ${s.total} done):`,
    "",
    ...READINESS_ITEMS.map((i) => {
      const st = statusOf(r, i.key);
      return `${EMOJI[st]} ${i[lang]}${st === "complete" ? "" : `: ${l[st].toLowerCase()}`}`;
    }),
  ].join("\n");
}

// Signed link so a church opens its own checklist with no login.
const secret = () => process.env.PACK_LINK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "dev-only-secret";
export const signChurch = (churchId: string) => createHmac("sha256", secret()).update(`plan:${churchId}`).digest("base64url").slice(0, 22);
export function verifyChurch(churchId: string | undefined, key: string | undefined): churchId is string {
  if (!churchId || !key) return false;
  const a = Buffer.from(signChurch(churchId));
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

const baseUrl = () => process.env.PUBLIC_BASE_URL || "https://faith-tech-gold.vercel.app";
export const packPlanUrl = (church: Pick<Church, "id">) =>
  `${baseUrl()}/pack/plan?${new URLSearchParams({ c: church.id, k: signChurch(church.id) })}`;
