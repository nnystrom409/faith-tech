// Storage: Supabase (REST) or Upstash Redis (REST) when their env vars exist,
// otherwise in-memory. Supabase errors fall back to memory so the bot keeps answering.
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
  | "ask_listed"
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
  | "find_city"
  | "find_pick"
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
  listed?: boolean;
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
  lastPrompt?: { text: string; buttons?: string[] };
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
  listed?: boolean; // agreed to show the event in "Find a baptism near me"
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
const sbUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
export const storeKind = sbUrl && sbKey ? "supabase" : url && token ? "redis" : "memory";

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

// Tables ft_records(bucket, id, data jsonb) and ft_activity(at, data jsonb), RLS on,
// read and written only server-side with the service role key.
async function sb<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth: Record<string, string> = { apikey: sbKey! };
  if (!sbKey!.startsWith("sb_")) auth.Authorization = `Bearer ${sbKey}`;
  const res = await fetch(`${sbUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...auth, "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.text();
  return (body ? JSON.parse(body) : null) as T;
}
const sbGet = async <T>(bucket: string, id: string) =>
  ((await sb<{ data: T }[]>(`ft_records?bucket=eq.${bucket}&id=eq.${encodeURIComponent(id)}&select=data`))[0]?.data);
const sbPut = (bucket: string, id: string, data: unknown) =>
  sb("ft_records", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ bucket, id, data, updated_at: new Date().toISOString() }),
  });
const sbList = async <T>(bucket: string) => (await sb<{ data: T }[]>(`ft_records?bucket=eq.${bucket}&select=data`)).map((r) => r.data);

// Try Supabase; on any error, log it and use memory for this call.
async function viaSb<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("store fallback to memory:", e);
    return fallback();
  }
}

export async function getUser(id: string): Promise<User | undefined> {
  if (storeKind === "supabase") return viaSb(() => sbGet<User>("users", id), () => mem.users.get(id));
  if (storeKind === "memory") return mem.users.get(id);
  const raw = (await redis(["HGET", P + "users", id])) as string | null;
  return raw ? (JSON.parse(raw) as User) : undefined;
}

export async function saveUser(u: User) {
  mem.users.set(u.id, u);
  if (storeKind === "supabase") return void (await viaSb(() => sbPut("users", u.id, u), () => null));
  if (storeKind === "memory") return;
  await redis(["HSET", P + "users", u.id, JSON.stringify(u)]);
}

export async function listUsers(): Promise<User[]> {
  if (storeKind === "supabase") return viaSb(() => sbList<User>("users"), () => [...mem.users.values()]);
  if (storeKind === "memory") return [...mem.users.values()];
  const vals = (await redis(["HVALS", P + "users"])) as string[];
  return vals.map((v) => JSON.parse(v) as User);
}

export async function getChurch(id: string): Promise<Church | undefined> {
  if (storeKind === "supabase") return viaSb(() => sbGet<Church>("churches", id), () => mem.churches.get(id));
  if (storeKind === "memory") return mem.churches.get(id);
  const raw = (await redis(["HGET", P + "churches", id])) as string | null;
  return raw ? (JSON.parse(raw) as Church) : undefined;
}

export async function saveChurch(c: Church) {
  mem.churches.set(c.id, c);
  if (storeKind === "supabase") return void (await viaSb(() => sbPut("churches", c.id, c), () => null));
  if (storeKind === "memory") return;
  await redis(["HSET", P + "churches", c.id, JSON.stringify(c)]);
}

export async function listChurches(): Promise<Church[]> {
  if (storeKind === "supabase") return viaSb(() => sbList<Church>("churches"), () => [...mem.churches.values()]);
  if (storeKind === "memory") return [...mem.churches.values()];
  const vals = (await redis(["HVALS", P + "churches"])) as string[];
  return vals.map((v) => JSON.parse(v) as Church);
}

export async function log(text: string, kind: Activity["kind"] = "info") {
  const a: Activity = { at: new Date().toISOString(), text, kind };
  if (storeKind === "supabase") {
    const ok = await viaSb(() => sb("ft_activity", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ at: a.at, data: a }) }).then(() => true), () => false);
    if (ok) return;
  }
  if (storeKind !== "redis") {
    mem.activity.unshift(a);
    mem.activity.length = Math.min(mem.activity.length, 50);
    return;
  }
  await redis(["LPUSH", P + "activity", JSON.stringify(a)]);
  await redis(["LTRIM", P + "activity", 0, 49]);
}

export async function listActivity(): Promise<Activity[]> {
  if (storeKind === "supabase")
    return viaSb(async () => (await sb<{ data: Activity }[]>("ft_activity?select=data&order=at.desc&limit=50")).map((r) => r.data), () => mem.activity);
  if (storeKind === "memory") return mem.activity;
  const vals = (await redis(["LRANGE", P + "activity", 0, 49])) as string[];
  return vals.map((v) => JSON.parse(v) as Activity);
}

// Generic records for features that keep their own bucket (e.g. "readiness").
const memRecords: Map<string, unknown> = ((g as unknown as { __rec?: Map<string, unknown> }).__rec ??= new Map());

export async function getRecord<T>(bucket: string, id: string): Promise<T | undefined> {
  const key = `${bucket}:${id}`;
  if (storeKind === "supabase") return viaSb(() => sbGet<T>(bucket, id), () => memRecords.get(key) as T | undefined);
  if (storeKind === "memory") return memRecords.get(key) as T | undefined;
  const raw = (await redis(["HGET", P + bucket, id])) as string | null;
  return raw ? (JSON.parse(raw) as T) : undefined;
}

export async function putRecord<T>(bucket: string, id: string, data: T) {
  memRecords.set(`${bucket}:${id}`, data);
  if (storeKind === "supabase") return void (await viaSb(() => sbPut(bucket, id, data), () => null));
  if (storeKind === "memory") return;
  await redis(["HSET", P + bucket, id, JSON.stringify(data)]);
}

// Records in a bucket whose id starts with prefix (e.g. one church's readiness items).
export async function listRecords<T>(bucket: string, prefix: string): Promise<T[]> {
  const fromMem = () => [...memRecords.entries()].filter(([k]) => k.startsWith(`${bucket}:${prefix}`)).map(([, v]) => v as T);
  if (storeKind === "supabase")
    return viaSb(async () => (await sb<{ data: T }[]>(`ft_records?bucket=eq.${bucket}&id=like.${encodeURIComponent(prefix)}*&select=data`)).map((r) => r.data), fromMem);
  if (storeKind === "memory") return fromMem();
  const all = ((await redis(["HGETALL", P + bucket])) as string[]) ?? [];
  const out: T[] = [];
  for (let i = 0; i < all.length; i += 2) if (all[i].startsWith(prefix)) out.push(JSON.parse(all[i + 1]) as T);
  return out;
}
