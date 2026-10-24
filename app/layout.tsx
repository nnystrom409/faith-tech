import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Global Baptism Event", description: "Church onboarding and baptism reporting by chat" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
