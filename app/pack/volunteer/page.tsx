"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, Shell } from "../ui";

const TODO = [
  { what: "Watch the welcome video", when: "" },
  { what: "Join the team chat", when: "" },
  { what: "Walk the venue with Pablo", when: "Sat 8 May, 4 PM" },
  { what: "Print the check-in list", when: "Ready the day before" },
];

export default function Volunteer() {
  const [done, setDone] = useState([true, true, false, false]);
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <p className="pk-k">Hi Liza</p>
        <h1>You're on the welcome team</h1>
        <p className="pk-mut">and you're the day-of contact. Pastor Pablo added you on 26 Oct.</p>
      </div>

      <div className="pk-card">
        <h2>What you'll do</h2>
        <p style={{ fontSize: 14 }}>Greet each person by name, check them in against the confirmed list, show them where to change, and introduce them to their follow-up contact afterwards.</p>
        <div className="pk-row">
          <Link className="pk-btn2" href="/pack/resources"><Icon name="play" size={18} />3-min video</Link>
          <Link className="pk-btn2" href="/pack/resources">Read instead</Link>
        </div>
      </div>

      <div className="pk-card" style={{ gap: 0 }}>
        <div className="pk-row pk-between" style={{ paddingBottom: 6 }}><h2>Before the day</h2><span className="pk-mut">{done.filter(Boolean).length} of {TODO.length}</span></div>
        {TODO.map((t, i) => (
          <label key={t.what} className="pk-li" style={{ alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={done[i]} onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))} style={{ width: 22, height: 22, marginTop: 1, accentColor: "#17603A" }} />
            <div><div style={{ fontWeight: 600 }}>{t.what}</div>{t.when && <div className="pk-mut">{t.when}</div>}</div>
          </label>
        ))}
      </div>

      <div className="pk-card dark">
        <p className="pk-k">On the day</p>
        <h2 style={{ color: "#fff" }}>Sun 16 May · arrive 7:30 AM</h2>
        <p className="pk-mut" style={{ fontSize: 14 }}>Tacloban riverside, north steps. Bring: name badges, pens, towels, the check-in list.</p>
        <Link className="pk-btn light" href="/pack/day">Open run sheet</Link>
      </div>

      <div className="pk-card">
        <h2>Questions?</h2>
        <p className="pk-mut">Ask Pastor Pablo in the bot. Pastoral questions go to him, not the portal.</p>
        <Link className="pk-btn2" href="/pack/help"><Icon name="send" size={18} />Message on Telegram</Link>
      </div>
      <p className="pk-note">Test data only · <Link href="/pack">Coordinator view</Link></p>
    </Shell>
  );
}
