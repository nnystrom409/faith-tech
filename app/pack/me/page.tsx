import Link from "next/link";
import { Icon, Shell } from "../ui";

const STEPS = [
  { what: "Said you're interested", note: "Scanned the lobby poster, 2 Nov", state: "done" },
  { what: "Connected with your church", note: "Liza from Grace Fellowship called you", state: "done" },
  { what: "Preparing", note: "Conversation 2 of 2 with Pastor Ramon · Sun 25 Apr", state: "now" },
  { what: "Confirm you're coming", note: "We'll ask one week before", state: "" },
  { what: "Baptism day", note: "", state: "" },
  { what: "Next steps together", note: "", state: "" },
];

export default function Participant() {
  return (
    <Shell sub="with Grace Fellowship">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <p className="pk-k">Hi Joy</p>
        <h1>You're preparing for Pentecost Sunday</h1>
        <p className="pk-mut">16 May 2027 · Tacloban riverside</p>
      </div>

      <div className="pk-card" style={{ gap: 0 }}>
        <h2 style={{ paddingBottom: 12 }}>Your journey</h2>
        {STEPS.map((s) => (
          <div key={s.what} className="pk-js">
            <span className={`pk-dot ${s.state}`} />
            <div><div style={{ fontWeight: 600 }}>{s.what}</div>{s.note && <div className="pk-mut">{s.note}</div>}</div>
          </div>
        ))}
      </div>

      <div className="pk-card">
        <h2>What to expect</h2>
        <p style={{ fontSize: 14 }}>Worship, a short testimony if you'd like to share one, then baptism in the river with Pastor Ramon. Family and friends are welcome.</p>
        <p className="pk-k">Bring</p>
        <p style={{ fontSize: 14 }}>A change of clothes, a towel, and someone you'd like to celebrate with.</p>
      </div>

      <div className="pk-card">
        <h2>Questions or changes</h2>
        <p className="pk-mut">Your messages go to your church only, not the global team.</p>
        <Link className="pk-btn" href="/pack/help"><Icon name="send" size={18} />Ask privately</Link>
        <div className="pk-row">
          <Link className="pk-btn2" href="/pack/help">I can't make it</Link>
          <Link className="pk-btn2" href="/pack/help">Change event</Link>
        </div>
      </div>

      <p className="pk-note">You shared only your name, number and language. Reply STOP in the bot to stop messages. · <Link href="/pack">Coordinator view</Link></p>
    </Shell>
  );
}
