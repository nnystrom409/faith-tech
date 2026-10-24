"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, Shell } from "../ui";

// Separate codes for team invites and participant registration, as the brief asks.
const TEAM_CODE = "GF7Q";

const ROLES = [
  { who: "PD", name: "Pablo Dela Cruz", role: "Event lead", pill: "Joined", cls: "s-ok", bg: "#16160C", fg: "#fff" },
  { who: "LM", name: "Liza Mercado", role: "Day-of contact · Welcome", pill: "Joined", cls: "s-ok", bg: "#DDE7F0", fg: "#1D4466" },
  { who: "JT", name: "Jun Tan · 1 more needed", role: "Baptism assistant", pill: "1 of 2", cls: "s-warn", bg: "#E3F3E8", fg: "#17603A" },
  { who: "?", name: "Calls each person within a week", role: "Follow-up lead", pill: "Open", cls: "s-help" },
  { who: "PD", name: "Defaults to the event lead", role: "Reporting owner", pill: "Pablo", cls: "s-ok" },
];

function qr(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&ecc=H&data=${encodeURIComponent(url)}`;
}

export default function Team() {
  const [origin, setOrigin] = useState("");
  const [toast, setToast] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const invite = `${origin}/pack/volunteer?invite=${TEAM_CODE}`;
  const join = `${origin}/pack/me?church=${TEAM_CODE}`;
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => { setToast("Link copied"); setTimeout(() => setToast(""), 1500); });

  return (
    <Shell title="Team and invites" sub="Grace Fellowship · 4 people" back>
      <div className="pk-card" style={{ alignItems: "center", textAlign: "center" }}>
        <p className="pk-k">Team invite</p>
        <div className="pk-qr">
          {origin && <img src={qr(invite)} alt="QR code for the Grace Fellowship team invite" width={150} height={150} style={{ display: "block", width: 150, height: 150 }} />}
          <img className="mark" src="/brand/baptize-b-mark-ink.svg" alt="" />
        </div>
        <h2>Scan to join Grace Fellowship's team</h2>
        <p className="pk-mut">Links the person to your church and asks which role they'll take. Only for your team, not for participants.</p>
        <div className="pk-row" style={{ width: "100%" }}>
          <a className="pk-btn" href={`https://t.me/share/url?url=${encodeURIComponent(invite)}&text=${encodeURIComponent("Join the Grace Fellowship team for Pentecost Sunday")}`} target="_blank" rel="noreferrer">
            <Icon name="send" size={18} />Share in Telegram
          </a>
          <button className="pk-btn2" onClick={() => copy(invite)}>Copy link</button>
        </div>
      </div>

      <div className="pk-card" style={{ gap: 0 }}>
        <div className="pk-row pk-between" style={{ paddingBottom: 6 }}><h2>Roles</h2><span className="pk-mut">3 of 5 filled</span></div>
        {ROLES.map((r) => (
          <div key={r.role} className="pk-li">
            <span className="pk-av" style={r.bg ? { background: r.bg, color: r.fg } : undefined}>{r.who}</span>
            <div className="pk-grow"><div style={{ fontWeight: 600 }}>{r.role}</div><div className="pk-mut">{r.name}</div></div>
            <span className={`pk-pill ${r.cls}`}>{r.pill}</span>
          </div>
        ))}
      </div>

      <div className="pk-card">
        <p className="pk-k">Participant registration</p>
        <h2>A separate QR for people who want to be baptized</h2>
        <p className="pk-mut">Registration starts a conversation with your church. People share only name, contact, language and permission to message.</p>
        <div className="pk-row">
          <Link className="pk-btn" href="/pack/me">Preview what they see</Link>
          {origin && <a className="pk-btn2" href={qr(join).replace("300x300", "1000x1000")} target="_blank" rel="noreferrer">Print QR</a>}
        </div>
        <p className="pk-mut">11 registered so far · 3 from the lobby poster</p>
      </div>
      {toast && <div className="pk-toast" role="status">{toast}</div>}
    </Shell>
  );
}
