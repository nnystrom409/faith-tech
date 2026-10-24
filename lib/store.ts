// Storage: Upstash Redis (REST) when its env vars exist, otherwise in-memory.
// In-memory is fine for local dev; on Vercel add Upstash so the webhook and
// dashboard see the same data across function instances.

export type Step =
  | "new"
  | "ask_language"
  | "await_consent"
  | "menu"
  | "ask_intro"
  | "ask_church"
  | "ask_city"
  | "ask_leader"
  | "ask_role"
  | "ask_part"
  | "ask_email"
  | "confirm_church"
  | "fix_church"
  | "registered"
  | "check_count"
  | "confirm_count"
  | "dupe_count"
  | "approved"
  | "ask_followup_owner"
  | "followup_people"
  | "followup_guide"
  | "stopped";

export type Lang = "en" | "es";

export type Draft = {
  church?: string;
  city?: string;
  leader?: string;
  pastorTitle?: boolean;
  role?: string;
  part?: string;
  email?: string;
  count?: number;
};

export type User = {
  id: string;
  channel: string;
  name?: string;
  lang?: Lang;
  step: Step;
  consentAt?: string;
  stoppedAt?: string;
  draft: Draft;
  churchId?: string;
};

export type Report = { count: number; at: string };

export type Church = {
  id: string;
  name: string;
  city: string;
  leader: string;
  role?: string;
  part?: string;
  email?: string;
  lang?: Lang;
  contactId: string;
  registeredAt: string;
  possibleDuplicateOf?: string;
  status?: "Registered" | "Confirmed" | "Ready";
  followupOwner?: string;
  needsHelp?: string[];
  reports?: Report[];
  baptisms?: number;
  reportedAt?: string;
};

export type Activity = { at: string; text: string; kind: "ok" | "warn" | "info" };

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const storeKind = url && token ? "redis" : "memory";

type Mem = { users: Map<string, User>; churches: Map<string, Church>; activity: Activity[] };
const g = globalThis as unknown as { __mem?: Mem };
const mem: Mem = (g.__mem ??= { users: new Map(), churches: new Map(), activity: [] });

async function redis(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result;
}

const P = "ft:";

export async function getUser(id: string): Promise<User | undefined> {
  if (storeKind === "memory") return mem.users.get(id);
  const raw = (await redis(["HGET", P + "users", id])) as string | null;
  return raw ? (JSON.parse(raw) as User) : undefined;
}

export async function saveUser(u: User) {
  if (storeKind === "memory") return void mem.users.set(u.id, u);
  await redis(["HSET", P + "users", u.id, JSON.stringify(u)]);
}

export async function listUsers(): Promise<User[]> {
  if (storeKind === "memory") return [...mem.users.values()];
  const vals = (await redis(["HVALS", P + "users"])) as string[];
  return vals.map((v) => JSON.parse(v) as User);
}

export async function getChurch(id: string): Promise<Church | undefined> {
  if (storeKind === "memory") return mem.churches.get(id);
  const raw = (await redis(["HGET", P + "churches", id])) as string | null;
  return raw ? (JSON.parse(raw) as Church) : undefined;
}

export async function saveChurch(c: Church) {
  if (storeKind === "memory") return void mem.churches.set(c.id, c);
  await redis(["HSET", P + "churches", c.id, JSON.stringify(c)]);
}

export async function listChurches(): Promise<Church[]> {
  if (storeKind === "memory") return [...mem.churches.values()];
  const vals = (await redis(["HVALS", P + "churches"])) as string[];
  return vals.map((v) => JSON.parse(v) as Church);
}

export async function log(text: string, kind: Activity["kind"] = "info") {
  const a: Activity = { at: new Date().toISOString(), text, kind };
  if (storeKind === "memory") {
    mem.activity.unshift(a);
    mem.activity.length = Math.min(mem.activity.length, 50);
    return;
  }
  await redis(["LPUSH", P + "activity", JSON.stringify(a)]);
  await redis(["LTRIM", P + "activity", 0, 49]);
}

export async function listActivity(): Promise<Activity[]> {
  if (storeKind === "memory") return mem.activity;
  const vals = (await redis(["LRANGE", P + "activity", 0, 49])) as string[];
  return vals.map((v) => JSON.parse(v) as Activity);
}
