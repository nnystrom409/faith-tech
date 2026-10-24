import "./pack.css";
import Script from "next/script";
import type { ReactNode } from "react";

export const metadata = { title: "Starter pack · Baptize The World", description: "Starter pack for churches, volunteers and participants" };

// The bot opens these pages as a Telegram Mini App; the script is a no-op in a normal browser.
export default function PackLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      {children}
    </>
  );
}
