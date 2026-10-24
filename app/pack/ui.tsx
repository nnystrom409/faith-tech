"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const PATHS: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  plan: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  folder: "M4 5h6l2 2h8v12H4z",
  team: "M3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M21 20c0-2.5-2-4.5-4-5M12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  back: "M15 5l-7 7 7 7",
  chev: "M9 6l6 6-6 6",
  drop: "M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z",
  megaphone: "M3 10v4h3l6 4V6L6 10H3zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
  cal: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M8 3v4M16 3v4",
  send: "M21 4L3 11l6 2 2 6 3-4 5 4z",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  play: "M8 5l11 7-11 7z",
  copy: "M8 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2zM16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3",
  alert: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v6M12 16.5v.5",
  camera: "M3 8a2 2 0 0 1 2-2h3l1.5-2h5L16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 9.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z",
  edit: "M4 20h4L19 9l-4-4L4 16z",
  heart: "M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2",
  user: "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4 4-6 8-6s8 2 8 6",
  help: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.5",
  upload: "M12 16V5M7 10l5-5 5 5M5 20h14",
};

export function Icon({ name, size = 22 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg className="i" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}

type Tab = { href: string; label: string; icon: string };
const COORD_TABS: Tab[] = [
  { href: "/pack", label: "Home", icon: "home" },
  { href: "/pack/plan", label: "Plan", icon: "plan" },
  { href: "/pack/resources", label: "Resources", icon: "folder" },
  { href: "/pack/team", label: "Team", icon: "team" },
  { href: "/pack/report", label: "Report", icon: "chart" },
];
const VOL_TABS: Tab[] = [
  { href: "/pack/volunteer", label: "Home", icon: "home" },
  { href: "/pack/day", label: "Event day", icon: "cal" },
  { href: "/pack/resources", label: "Resources", icon: "folder" },
  { href: "/pack/help", label: "Help", icon: "help" },
];

declare global {
  interface Window { Telegram?: { WebApp?: { ready: () => void; expand: () => void } } }
}

// One shell for every portal screen: top bar, role pill, bottom tabs.
export function Shell({ title, sub, back, children }: { title?: string; sub?: string; back?: boolean; children: ReactNode }) {
  const path = usePathname() ?? "/pack";
  const role = path.startsWith("/pack/me") ? "par" : path.startsWith("/pack/volunteer") || path.startsWith("/pack/help") ? "vol" : "coord";
  const tabs = role === "par" ? [] : role === "vol" ? VOL_TABS : COORD_TABS;

  // Inside Telegram, tell the Mini App we're ready and use the full height.
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
  }, []);

  return (
    <div className="pk">
      <div className={`pk-col ${tabs.length ? "" : "notabs"}`}>
        <header className="pk-top">
          {back ? (
            <Link href={role === "vol" ? "/pack/volunteer" : "/pack"} aria-label="Back to home" style={{ display: "flex", width: 44, height: 44, margin: "-6px -6px -6px -10px", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>
              <Icon name="back" />
            </Link>
          ) : role === "par" ? (
            <img src="/brand/baptize-b-mark-ink.svg" alt="Baptize The World" style={{ width: 28, height: 28, borderRadius: 0 }} />
          ) : (
            <img src="/brand/baptize-globe-192.png" alt="Baptize The World" />
          )}
          <div>
            <div className="pk-tt">{title ?? (role === "par" ? "My baptism" : "Starter pack")}</div>
            <div className="pk-ts">{sub ?? "Grace Fellowship · Tacloban"}</div>
          </div>
          {role !== "par" && <span className={`pk-role ${role === "vol" ? "vol" : ""}`}>{role === "vol" ? "Volunteer" : "Coordinator"}</span>}
        </header>
        <div className="pk-body" style={tabs.length ? undefined : { paddingBottom: 24 }}>{children}</div>
        {tabs.length > 0 && (
          <nav className="pk-tabs" aria-label="Starter pack sections">
            <div className="pk-tabs-in">
              {tabs.map((t) => {
                const on = t.href === path || (t.href === "/pack/plan" && path === "/pack/day" && role === "coord");
                return (
                  <Link key={t.href} href={t.href} className={`pk-tab ${on ? "on" : ""}`} aria-current={on ? "page" : undefined}>
                    <Icon name={t.icon} />
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

export function Row({ href, icon, title, sub, first }: { href: string; icon: string; title: string; sub: string; first?: boolean }) {
  return (
    <Link className={`pk-li ${first ? "first" : ""}`} href={href}>
      <span className="pk-ic"><Icon name={icon} size={20} /></span>
      <span className="pk-grow"><span style={{ display: "block", fontWeight: 600 }}>{title}</span><span className="pk-mut">{sub}</span></span>
      <span style={{ color: "#8A877C" }}><Icon name="chev" size={18} /></span>
    </Link>
  );
}
