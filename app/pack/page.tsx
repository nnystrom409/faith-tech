import Link from "next/link";
import { Icon, Row, Shell } from "./ui";

export const revalidate = 3600;

const EVENT = new Date("2027-05-16T09:00:00+08:00");

export default function PackHome() {
  const days = Math.max(0, Math.ceil((EVENT.getTime() - Date.now()) / 86_400_000));
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <p className="pk-k">Welcome back</p>
        <h1>Pastor Ramon</h1>
      </div>

      <div className="pk-card dark">
        <img src="/brand/baptize-wordmark-white.svg" alt="Baptize The World" style={{ width: 150, height: "auto" }} />
        <p className="pk-k">Your event</p>
        <h2 style={{ fontSize: 20 }}>Pentecost Sunday · 16 May 2027</h2>
        <p className="pk-mut" style={{ fontSize: 14 }}>Hosting, with Hope Chapel Palo joining. You report for both churches.</p>
        <div className="pk-row pk-between">
          <span className="pk-num" style={{ color: "#FFB98A" }}>{days} days</span>
          <span className="pk-mut">Confirm counts by 9 May</span>
        </div>
      </div>

      <div className="pk-card">
        <div className="pk-row pk-between"><h2>Readiness</h2><span className="pk-pill s-warn">Not ready yet</span></div>
        <div className="pk-bar"><span style={{ width: "55%" }} /></div>
        <p className="pk-mut">5 of 9 done. Still open: venue, emergency plan, follow-up owner, accessibility.</p>
        <Link className="pk-btn" href="/pack/plan">Open checklist</Link>
      </div>

      <div className="pk-card">
        <h2>Participants</h2>
        <div className="pk-stats">
          <div className="pk-stat"><span className="pk-num">24</span><span className="pk-mut">Expected</span></div>
          <div className="pk-stat"><span className="pk-num">11</span><span className="pk-mut">Registered</span></div>
          <div className="pk-stat"><span className="pk-num">6</span><span className="pk-mut">Confirmed</span></div>
        </div>
        <p className="pk-mut">3 people are waiting for a first call from your team.</p>
      </div>

      <div className="pk-card">
        <div className="pk-row pk-between"><h2>Your starter pack</h2><span className="pk-mut">v1.2</span></div>
        <div className="pk-tiles">
          <Link className="pk-tile" href="/pack/resources"><Icon name="plan" />Planning guide and roles</Link>
          <Link className="pk-tile" href="/pack/resources"><Icon name="drop" />Baptism preparation</Link>
          <Link className="pk-tile" href="/pack/resources"><Icon name="megaphone" />Announcement kit</Link>
          <Link className="pk-tile" href="/pack/day"><Icon name="cal" />Event-day guide</Link>
        </div>
      </div>

      <div className="pk-card" style={{ gap: 0 }}>
        <h2 style={{ paddingBottom: 4 }}>Next steps</h2>
        <Row first href="/pack/team" icon="team" title="Invite your team" sub="3 of 5 roles filled · follow-up lead open" />
        <Row href="/pack/team" icon="qr" title="Print the registration QR" sub="For the bulletin and lobby" />
        <Row href="/pack/report" icon="heart" title="Name a follow-up owner" sub="Needed before you can be marked ready" />
      </div>

      <div className="pk-card">
        <h2>Need a hand?</h2>
        <p className="pk-mut">Ana Reyes, your Visayas organizer, usually replies within a day.</p>
        <Link className="pk-btn2" href="/pack/help"><Icon name="send" size={20} />Message on Telegram</Link>
      </div>
      <p className="pk-note">Test data only · <Link href="/pack/volunteer">Volunteer view</Link> · <Link href="/pack/me">Participant view</Link></p>
    </Shell>
  );
}
