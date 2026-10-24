// Dashboard buttons: an organizer sends the E4–E7 messages to a church's contact.
import { organizerMessage, type OrganizerAction } from "@/lib/bot";
import { sendToTelegramUser } from "@/lib/chat";

export const dynamic = "force-dynamic";

const ACTIONS: OrganizerAction[] = ["approve", "readiness", "report", "followup"];

export async function POST(req: Request) {
  const { churchId, action } = (await req.json()) as { churchId?: string; action?: OrganizerAction };
  if (!churchId || !action || !ACTIONS.includes(action)) return Response.json({ error: "churchId and action required" }, { status: 400 });
  const out = await organizerMessage(churchId, action);
  if ("error" in out) return Response.json(out, { status: 400 });
  const [channel, userId] = [out.user.channel, out.user.id.split(":").slice(1).join(":")];
  if (channel === "telegram") {
    try {
      await sendToTelegramUser(userId, out.replies);
    } catch (e) {
      console.error(e);
      return Response.json({ error: "send failed" }, { status: 502 });
    }
  }
  return Response.json({ ok: true, channel, replies: out.replies });
}
