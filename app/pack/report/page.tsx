"use client";
import { useState } from "react";
import { Icon, Shell } from "../ui";

const FOLLOW = [
  { name: "Joy A.", note: "Liza · new believers' class Sunday", ok: true },
  { name: "Marco B.", note: "Jun · home visit set", ok: true },
  { name: "Rosa C.", note: "Hope Chapel · Pastor Ellen", ok: true },
  { name: "Danilo P.", note: "Pablo · called twice", ok: true },
  { name: "Mae S.", note: "No follow-up contact yet", ok: false, pill: "Needs owner" },
  { name: "Leo V.", note: "Message sent, no reply", ok: false, pill: "Awaiting" },
];

// Same bounds the bot uses for counts.
const clamp = (n: number) => Math.max(0, Math.min(10000, n));

function Stepper({ label, sub, value, set, accent }: { label: string; sub: string; value: number; set: (n: number) => void; accent?: boolean }) {
  return (
    <div className="pk-row pk-between" style={{ padding: "6px 0" }}>
      <div><div style={{ fontWeight: 600 }}>{label}</div><div className="pk-mut">{sub}</div></div>
      <div className="pk-row" style={{ gap: 6 }}>
        <button className="pk-sbt" aria-label={`Decrease ${label}`} onClick={() => set(clamp(value - 1))}>−</button>
        <span className="pk-big" style={accent ? { color: "var(--acc)" } : undefined} aria-live="polite">{value}</span>
        <button className="pk-sbt" aria-label={`Increase ${label}`} onClick={() => set(clamp(value + 1))}>+</button>
      </div>
    </div>
  );
}

export default function Report() {
  const [att, setAtt] = useState(140);
  const [bap, setBap] = useState(6);
  const [pub, setPub] = useState(false);
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState("");
  const odd = bap > att;

  return (
    <Shell title="Report and follow-up" sub="Pentecost Sunday · Grace + Hope Chapel" back>
      <div className="pk-card">
        <div className="pk-row pk-between"><h2>Event report</h2><span className={`pk-pill ${sent ? "s-ok" : "s-warn"}`}>{sent ? "Submitted" : "Draft"}</span></div>
        <p className="pk-mut">You are the reporting owner, so Hope Chapel's baptisms are counted here once, not twice.</p>
        <Stepper label="People who attended" sub="Rough count is fine" value={att} set={(n) => { setAtt(n); setSent(false); }} />
        <div style={{ borderTop: "1px solid #EEEDE8" }} />
        <Stepper label="Baptisms completed" sub={odd ? "More than attended? Check the count." : "6 were confirmed for today"} value={bap} set={(n) => { setBap(n); setSent(false); }} accent />
        <button className="pk-btn" disabled={odd} style={odd ? { opacity: 0.5 } : undefined} onClick={() => setSent(true)}>
          {sent ? "Report submitted · edit any time" : "Submit report"}
        </button>
      </div>

      <div className="pk-card">
        <h2>Story or photo</h2>
        <label className="pk-photo">
          <Icon name="upload" />{photo || "Add a photo or a short story"}
          <input type="file" accept="image/*" style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} onChange={(e) => setPhoto(e.target.files?.[0]?.name ?? "")} />
        </label>
        <div className="pk-row">
          <div className="pk-grow"><div style={{ fontWeight: 600 }}>OK to share publicly?</div><div className="pk-mut">Ask the people pictured first. Uploading alone never grants permission.</div></div>
          <button className={`pk-sw ${pub ? "on" : ""}`} role="switch" aria-checked={pub} aria-label="Permission to publish" onClick={() => setPub(!pub)}><span /></button>
        </div>
      </div>

      <div className="pk-card" style={{ gap: 0 }}>
        <div className="pk-row pk-between" style={{ paddingBottom: 6 }}><h2>Follow-up</h2><span className="pk-mut">4 of 6 connected</span></div>
        {FOLLOW.map((f) => (
          <div key={f.name} className="pk-li">
            <div className="pk-grow"><div style={{ fontWeight: 600 }}>{f.name}</div><div className="pk-mut">{f.note}</div></div>
            <span className={`pk-pill ${f.ok ? "s-ok" : "s-warn"}`}>{f.ok ? "Connected" : f.pill}</span>
          </div>
        ))}
        <p className="pk-mut" style={{ paddingTop: 8 }}>A sent message doesn't count as connected. Mark it when someone has actually talked with them.</p>
      </div>
    </Shell>
  );
}
