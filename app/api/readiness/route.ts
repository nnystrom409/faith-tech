// Web side of the shared readiness checklist. The signed link (c + k) is the only credential.
import { NextResponse } from "next/server";
import { getReadiness, isStatus, setItem, summary, verifyChurch } from "@/lib/readiness";
import { getChurch, log } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const c = u.searchParams.get("c") ?? undefined;
  if (!verifyChurch(c, u.searchParams.get("k") ?? undefined)) return NextResponse.json({ error: "invalid link" }, { status: 403 });
  const r = await getReadiness(c);
  return NextResponse.json({ readiness: r, summary: summary(r) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { c?: string; k?: string; key?: string; status?: string };
  if (!verifyChurch(body.c, body.k)) return NextResponse.json({ error: "invalid link" }, { status: 403 });
  if (!body.key || !body.status || !isStatus(body.status)) return NextResponse.json({ error: "key and status required" }, { status: 400 });
  try {
    const r = await setItem(body.c, body.key, body.status, "web");
    const church = await getChurch(body.c);
    const s = summary(r);
    await log(`${church?.name ?? "A church"} marked ${body.key} ${body.status.replace("_", " ")} on the web · ${s.done}/${s.total}${s.ready ? " · ready" : ""}`, body.status === "need_help" ? "warn" : "info");
    return NextResponse.json({ readiness: r, summary: s });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
