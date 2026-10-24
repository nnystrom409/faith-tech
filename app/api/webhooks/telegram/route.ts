import { after } from "next/server";
import { getBot } from "@/lib/chat";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return getBot().webhooks.telegram(request, { waitUntil: (task) => after(() => task) });
}
