"use client";
import { useEffect, useState } from "react";
import { Shell } from "../ui";

type Status = "complete" | "not_yet" | "need_help" | "na";
type Item = { key: string; label: string; hint: string; essential: boolean };

const ORDER: Status[] = ["complete", "not_yet", "need_help", "na"];
const STATES: Record<Status, { label: string; cls: string }> = {
  complete: { label: "Complete", cls: "s-ok" },
  not_yet: { label: "Not yet", cls: "s-warn" },
  need_help: { label: "Need help", cls: "s-help" },
  na: { label: "Not applicable", cls: "s-na" },
};

type Props = {
  items: Item[];
  initial: Record<string, Status>;
  churchName: string;
  // Present only when opened from a church's signed link; otherwise it's the demo.
  link?: { c: string; k: string };
};

export default function PlanClient({ items, initial, churchName, link }: Props) {
  const [s, setS] = useState<Record<string, Status>>(initial);
  const [saving, setSaving] = useState("");
  const [err, setErr] = useState("");

  // Pick up changes made from Telegram while the page is open.
  useEffect(() => {
    if (!link) return;
    const load = () =>
      fetch(`/api/readiness?${new URLSearchParams(link)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          const next: Record<string, Status> = {};
          for (const it of items) next[it.key] = d.readiness.items[it.key]?.status ?? "not_yet";
          setS((prev) => (saving ? prev : next));
        })
        .catch(() => {});
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [link, items, saving]);

  async function cycle(key: string) {
    const next = ORDER[(ORDER.indexOf(s[key]) + 1) % ORDER.length];
    const prev = s[key];
    setS({ ...s, [key]: next });
    if (!link) return;
    setSaving(key);
    setErr("");
    try {
      const r = await fetch("/api/readiness", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...link, key, status: next }) });
      if (!r.ok) throw new Error();
    } catch {
      setS((cur) => ({ ...cur, [key]: prev }));
      setErr("Couldn't save that change. Check your connection and try again.");
    } finally {
      setSaving("");
    }
  }

  const done = items.filter((it) => s[it.key] === "complete" || s[it.key] === "na").length;
  const ready = items.every((it) => !it.essential || s[it.key] === "complete" || s[it.key] === "na");
  const helpCount = items.filter((it) => s[it.key] === "need_help").length;

  return (
    <Shell title="Readiness checklist" sub={`${churchName} · 16 May 2027`} back>
      <div className="pk-card">
        <div className="pk-row pk-between">
          <h2>{done} of {items.length} done</h2>
          <span className={`pk-pill ${ready ? "s-ok" : "s-warn"}`}>{ready ? "Ready" : "Not ready yet"}</span>
        </div>
        <div className="pk-bar"><span style={{ width: `${Math.round((done / items.length) * 100)}%` }} /></div>
        <p className="pk-mut">
          You're ready when every essential is complete. Tap a status to change it.
          {helpCount > 0 && ` ${helpCount} marked Need help: your regional organizer will get in touch.`}
        </p>
        <p className="pk-mut">
          {link ? "Saved for your church. Changes you make in Telegram show up here too." : "Demo with test data. Open the link from the bot to see your church's own checklist."}
        </p>
        {err && <p className="pk-mut" role="alert" style={{ color: "var(--accInk)" }}>{err}</p>}
      </div>

      <div className="pk-card wide" style={{ gap: 0 }}>
        <p className="pk-k" style={{ paddingBottom: 6 }}>Before 9 May</p>
        {items.map((it, i) => {
          const st = STATES[s[it.key]];
          return (
            <div key={it.key} className="pk-li" style={{ alignItems: "flex-start", borderTop: i ? undefined : 0 }}>
              <div className="pk-grow">
                {it.essential && <span className="pk-ess">Essential</span>}
                <div style={{ fontWeight: 600 }}>{it.label}</div>
                <div className="pk-mut">{it.hint}</div>
              </div>
              <button
                className={`pk-st ${st.cls}`}
                disabled={saving === it.key}
                aria-label={`${it.label}: ${st.label}. Tap to change.`}
                onClick={() => cycle(it.key)}
              >
                {st.label}
              </button>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
