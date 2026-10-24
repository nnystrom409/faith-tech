// Visit /api/telegram/setup once after deploying to point the bot at this site.
// /api/telegram/setup?legacy=1 points it back at the pre-Chat-SDK webhook.
import { tg, webhookSecret, hasToken } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!hasToken()) {
    return Response.json({ ok: false, error: "Add TELEGRAM_BOT_TOKEN in Vercel env vars, then redeploy." }, { status: 500 });
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  // Default: Chat SDK route. ?legacy=1 rolls back to the direct webhook.
  const legacy = new URL(req.url).searchParams.has("legacy");
  const url = `https://${host}${legacy ? "/api/telegram" : "/api/webhooks/telegram"}`;
  const hook = await tg("setWebhook", {
    url,
    secret_token: webhookSecret(),
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  await tg("setMyCommands", {
    commands: [
      { command: "start", description: "Start or restart" },
      { command: "help", description: "What can I send?" },
      { command: "reset", description: "Register your church again" },
      { command: "stop", description: "Unsubscribe" },
    ],
  });
  const me = await tg("getMe", {});
  return Response.json({ webhook: url, setWebhook: hook, bot: me?.result?.username ? `https://t.me/${me.result.username}` : me });
}
