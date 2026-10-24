// Web chat backup for the demo: same bot logic, no Telegram needed.
import { handle } from "@/lib/bot";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id, text, name } = (await req.json()) as { id: string; text: string; name?: string };
  if (!id || typeof text !== "string") return Response.json({ error: "id and text required" }, { status: 400 });
  const replies = await handle("web", id.slice(0, 64), text.slice(0, 500), name);
  return Response.json({ replies });
}
