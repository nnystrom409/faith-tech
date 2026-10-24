"use client";
import { useState } from "react";
import { Shell } from "../ui";

const STATES = [
  { label: "Complete", cls: "s-ok" },
  { label: "Not yet", cls: "s-warn" },
  { label: "Need help", cls: "s-help" },
  { label: "Not applicable", cls: "s-na" },
];

// The readiness checklist from the build brief, section 8.
const ITEMS = [
  { label: "Date, time and venue", detail: "Sun 16 May, 9:00 AM PHT · venue to confirm", essential: true, start: 1 },
  { label: "Event lead and day-of contact", detail: "Ramon Dela Cruz · Liza Mercado", essential: true, start: 0 },
  { label: "Volunteer roles", detail: "Welcome, baptism assistants, follow-up", essential: false, start: 0 },
  { label: "Accessibility and arrival", detail: "Ramp, seating, parking, interpreters", essential: false, start: 1 },
  { label: "Baptism arrangements and supervision", detail: "Water, changing area, two adults present", essential: true, start: 0 },
  { label: "Participant preparation process", detail: "Two prep conversations before the day", essential: true, start: 0 },
  { label: "Reporting owner", detail: "Ramon reports for Grace and Hope Chapel", essential: true, start: 0 },
  { label: "Follow-up owner and next step", detail: "Who calls each person within a week", essential: true, start: 2 },
  { label: "Emergency and disruption plan", detail: "Weather backup, first aid, who to call", essential: true, start: 1 },
];

export default function Plan() {
  const [s, setS] = useState(ITEMS.map((i) => i.start));
  const done = s.filter((x) => x === 0 || x === 3).length;
  const ready = ITEMS.every((it, i) => !it.essential || s[i] === 0 || s[i] === 3);
  const helpCount = s.filter((x) => x === 2).length;

  return (
    <Shell title="Readiness checklist" sub="Grace Fellowship · 16 May 2027" back>
      <div className="pk-card">
        <div className="pk-row pk-between">
          <h2>{done} of {ITEMS.length} done</h2>
          <span className={`pk-pill ${ready ? "s-ok" : "s-warn"}`}>{ready ? "Ready" : "Not ready yet"}</span>
        </div>
        <div className="pk-bar"><span style={{ width: `${Math.round((done / ITEMS.length) * 100)}%` }} /></div>
        <p className="pk-mut">
          You're ready when the coordinator, event, essentials and follow-up owner are all in place. Tap a status to change it.
          {helpCount > 0 && ` ${helpCount} marked Need help: Ana, your organizer, will get in touch.`}
        </p>
      </div>

      <div className="pk-card wide" style={{ gap: 0 }}>
        <p className="pk-k" style={{ paddingBottom: 6 }}>Before 9 May</p>
        {ITEMS.map((it, i) => {
          const st = STATES[s[i]];
          return (
            <div key={it.label} className="pk-li" style={{ alignItems: "flex-start", borderTop: i ? undefined : 0 }}>
              <div className="pk-grow">
                {it.essential && <span className="pk-ess">Essential</span>}
                <div style={{ fontWeight: 600 }}>{it.label}</div>
                <div className="pk-mut">{it.detail}</div>
              </div>
              <button
                className={`pk-st ${st.cls}`}
                aria-label={`${it.label}: ${st.label}. Tap to change.`}
                onClick={() => setS((prev) => prev.map((v, j) => (j === i ? (v + 1) % STATES.length : v)))}
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
