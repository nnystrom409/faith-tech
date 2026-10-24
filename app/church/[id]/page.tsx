// A registered church's own page, linked from the bot's "You're registered!" message.
import Link from "next/link";
import { getChurch } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function ChurchPage({ params, searchParams }: Props) {
  const { id } = await params;
  const q = await searchParams;
  const c = await getChurch(id);
  const name = c?.name ?? q.n ?? "Your church";
  const status = c?.status ?? "Registered";
  const rows: [string, string | undefined][] = [
    ["Leader", c?.leader ?? q.l],
    ["Role", c?.role],
    ["Location", c?.city ?? q.c],
    ["Taking part", c?.part],
    ["Follow-up owner", c?.followupOwner],
    ["Baptisms reported", c?.baptisms !== undefined ? String(c.baptisms) : undefined],
  ];
  return (
    <main>
      <h1>{name}</h1>
      <p className="sub">Global Baptism Event · Pentecost, May 16, 2027 · test data for the hackathon demo</p>
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="label">Status</div>
        <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
          {status === "Registered" ? "Registered · waiting for a regional organizer to review" : status}
        </p>
      </div>
      {rows
        .filter(([, v]) => v)
        .map(([h, v]) => (
          <div className="card" key={h} style={{ marginBottom: 10 }}>
            <div className="label">{h}</div>
            <p style={{ margin: "4px 0 0" }}>{v}</p>
          </div>
        ))}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="label">Next steps</div>
        <p style={{ margin: "4px 0 0" }}>
          Report baptisms by sending the number to the bot in Telegram. Resources:{" "}
          <Link href="/starter-pack">host starter pack</Link> · <Link href="/discipleship-guide">30-day discipleship guide</Link>
        </p>
      </div>
    </main>
  );
}
