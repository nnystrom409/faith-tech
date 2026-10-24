"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, Shell } from "../ui";

type Res = { kind: string; title: string; sub: string; action?: "download" | "play" | "copy" | "open"; href?: string; done?: string };
const SECTIONS: { name: string; items: Res[] }[] = [
  { name: "1 · Plan", items: [
    { kind: "LIVE", title: "Planning checklist", sub: "Also live in Plan", action: "open", href: "/pack/plan" },
    { kind: "PDF", title: "Role descriptions", sub: "Lead, day-of contact, welcome, assistants, follow-up" },
  ] },
  { name: "2 · Prepare people", items: [
    { kind: "PDF", title: "Baptism preparation guide", sub: "For pastors · two-conversation outline" },
    { kind: "VID", title: "Welcome video", sub: "4 min · text summary included", action: "play", done: "Watched by you" },
  ] },
  { name: "3 · Tell your congregation", items: [
    { kind: "TXT", title: "Announcement copy", sub: "Pulpit, bulletin and group-chat versions", action: "copy" },
    { kind: "ZIP", title: "Graphics pack", sub: "Square, story and slide sizes with your QR" },
  ] },
  { name: "4 · Event day and after", items: [
    { kind: "LIVE", title: "Run sheet and safety", sub: "Also live in Event day", action: "open", href: "/pack/day" },
    { kind: "PDF", title: "Reporting how-to", sub: "One report per event, no double counts" },
    { kind: "PDF", title: "Discipleship next steps", sub: "First 30 days with each new believer" },
  ] },
];

const ANNOUNCEMENT =
  "On Pentecost Sunday, 16 May 2027, Grace Fellowship joins churches around the world for a day of baptisms. If you'd like to be baptized, or want to talk about it, scan the QR code in the lobby or speak to Pastor Pablo.";

export default function Resources() {
  const [lang, setLang] = useState("English");
  const [toast, setToast] = useState("");
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 1800); };

  return (
    <Shell title="Resources" sub="Host pack · version 1.2" back>
      <div className="pk-seg" role="group" aria-label="Language">
        {["English", "Filipino", "Español"].map((l) => (
          <button key={l} className={lang === l ? "on" : ""} aria-pressed={lang === l} onClick={() => setLang(l)}>{l}</button>
        ))}
      </div>

      {SECTIONS.map((sec) => (
        <div key={sec.name} className="pk-card" style={{ gap: 0 }}>
          <p className="pk-k">{sec.name}</p>
          {sec.items.map((r, i) => (
            <div key={r.title} className={`pk-li ${i ? "" : "first"}`}>
              <span className="pk-ic">{r.kind}</span>
              <div className="pk-grow">
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <div className="pk-mut">{r.sub}</div>
                {r.done && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ok)" }}>{r.done}</div>}
              </div>
              {r.action === "open" && r.href ? (
                <Link className="pk-dl" href={r.href} aria-label={`Open ${r.title}`}><Icon name="chev" size={20} /></Link>
              ) : r.action === "copy" ? (
                <button className="pk-dl" style={{ background: "none", border: 0, padding: 0 }} aria-label={`Copy ${r.title}`}
                  onClick={() => navigator.clipboard?.writeText(ANNOUNCEMENT).then(() => say("Announcement copied"), () => say("Couldn't copy"))}>
                  <Icon name="copy" size={20} />
                </button>
              ) : (
                <button className="pk-dl" style={{ background: "none", border: 0, padding: 0 }} aria-label={`${r.action === "play" ? "Play" : "Download"} ${r.title}`}
                  onClick={() => say(`${r.title} (${lang}) is a placeholder in this demo`)}>
                  <Icon name={r.action === "play" ? "play" : "download"} size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      <button className="pk-btn" onClick={() => say("Full pack download is a placeholder in this demo")}><Icon name="download" size={20} />Download the whole pack</button>
      <p className="pk-note">Low on data? Ask the bot for any file by name and it sends a text version.</p>
      {toast && <div className="pk-toast" role="status">{toast}</div>}
    </Shell>
  );
}
