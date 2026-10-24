import Link from "next/link";
import { Icon, Shell } from "../ui";

const RUN = [
  { t: "7:30", what: "Team arrives", note: "Liza opens the welcome table" },
  { t: "8:15", what: "Safety check", note: "Water depth, first aid, two adults at the water", now: true },
  { t: "9:00", what: "Worship and testimonies", note: "Hope Chapel leads the second song" },
  { t: "10:00", what: "Baptisms", note: "Names read from the confirmed list" },
  { t: "11:30", what: "Next steps and photos", note: "Each person meets their follow-up contact" },
];

export default function EventDay() {
  return (
    <Shell title="Event day" sub="Sun 16 May 2027 · Grace Fellowship" back>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <p className="pk-k">On the day</p>
        <h1>Pentecost Sunday</h1>
        <p className="pk-mut">Tacloban riverside, north steps · 6 confirmed · 2 churches</p>
      </div>

      <div className="pk-tiles">
        <Link className="pk-tile urgent" href="/pack/help"><Icon name="alert" />Get help now</Link>
        <Link className="pk-tile" href="/pack/report"><Icon name="drop" />Report baptisms</Link>
        <Link className="pk-tile" href="/pack/report"><Icon name="team" />Record attendance</Link>
        <Link className="pk-tile" href="/pack/report"><Icon name="camera" />Share a story or photo</Link>
        <Link className="pk-tile" href="/pack/plan" style={{ gridColumn: "span 2", minHeight: 56, flexDirection: "row", alignItems: "center" }}>
          <Icon name="edit" />Update venue or time (tells everyone affected)
        </Link>
      </div>

      <div className="pk-card" style={{ gap: 0 }}>
        <h2 style={{ paddingBottom: 12 }}>Run sheet</h2>
        {RUN.map((r) => (
          <div key={r.t} className="pk-tl">
            <span className="pk-tm">{r.t}</span>
            <span className={`pk-dot ${r.now ? "now" : ""}`} />
            <div><div style={{ fontWeight: 600 }}>{r.what}</div><div className="pk-mut">{r.note}</div></div>
          </div>
        ))}
      </div>

      <div className="pk-card">
        <h2>Who to call</h2>
        <p>Day-of contact · Liza Mercado</p>
        <p>Regional organizer · Ana Reyes</p>
        <p className="pk-mut">Emergency: local services first, then tell the bot so we can help.</p>
      </div>
    </Shell>
  );
}
