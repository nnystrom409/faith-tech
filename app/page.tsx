"use client";
import { Fragment, useEffect, useState } from "react";

type Stats = {
  store: string;
  totals: { contacts: number; optedIn: number; optedOut: number; churches: number; reported: number; baptisms: number; flagged: number };
  churches: { id: string; name: string; city: string; leader: string; baptisms?: number; possibleDuplicateOf?: string; status?: string; followupOwner?: string }[];
  activity: { at: string; text: string; kind: "ok" | "warn" | "info" }[];
};

const ORG_ACTIONS = [
  ["approve", "Approve"],
  ["readiness", "Readiness"],
  ["report", "Ask for report"],
  ["followup", "Follow-up"],
] as const;

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [busy, setBusy] = useState("");
  async function send(churchId: string, action: string) {
    setBusy(churchId + action);
    try {
      const r = await fetch("/api/organizer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ churchId, action }) });
      if (!r.ok) alert((await r.json()).error ?? "Send failed");
    } finally {
      setBusy("");
    }
  }
  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/stats", { cache: "no-store" }).then((r) => r.json()).then((d) => alive && setS(d)).catch(() => {});
    load();
    const t = setInterval(load, 2000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const t = s?.totals;
  const tile = (label: string, v: number | undefined, cls = "") => (
    <div className={`card ${cls}`}><div className="label">{label}</div><div className="big">{v?.toLocaleString("en-US") ?? "–"}</div></div>
  );

  return (
    <main>
      <h1>Global Baptism Event</h1>
      <p className="sub">Live from chat · updates every 2 seconds · test data only · <a href="/chat">web chat backup</a></p>
      <div className="grid">
        {tile("Baptisms reported", t?.baptisms, "hero")}
        {tile("Churches registered", t?.churches)}
        {tile("Churches reported", t?.reported)}
        {tile("Opted in", t?.optedIn)}
        {tile("Opted out", t?.optedOut)}
        {tile("Needs review", t?.flagged)}
      </div>
      <div className="cols">
        <div className="card">
          <div className="label" style={{ marginBottom: 6 }}>Churches</div>
          <table>
            <thead><tr><th>Church</th><th>City</th><th>Leader</th><th style={{ textAlign: "right" }}>Baptisms</th></tr></thead>
            <tbody>
              {s?.churches.length ? s.churches.map((c) => (
                <Fragment key={c.id}>
                <tr>
                  <td>{c.name}{c.possibleDuplicateOf && <span className="tag">possible duplicate</span>}<div className="sub" style={{ margin: 0 }}>{c.status ?? "Registered"}{c.followupOwner ? ` · follow-up: ${c.followupOwner}` : ""}</div></td>
                  <td>{c.city}</td><td>{c.leader}</td>
                  <td className="num">{c.baptisms ?? "–"}</td>
                </tr>
                <tr>
                  <td colSpan={4} style={{ paddingTop: 0 }}>
                    <div className="btns">
                      {ORG_ACTIONS.map(([a, label]) => (
                        <button key={a} disabled={busy === c.id + a} onClick={() => send(c.id, a)} style={{ padding: "4px 10px", fontSize: 13 }}>
                          {busy === c.id + a ? "Sending…" : label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
                </Fragment>
              )) : <tr><td colSpan={4} className="sub">No churches yet. Message the bot to register one.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="label" style={{ marginBottom: 6 }}>Activity</div>
          <ul className="feed">
            {s?.activity.length ? s.activity.slice(0, 15).map((a, i) => (
              <li key={i} className={a.kind}><time>{new Date(a.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>{a.text}</li>
            )) : <li className="sub">Waiting for the first message…</li>}
          </ul>
        </div>
      </div>
    </main>
  );
}
