import { handle } from "@/lib/bot";
import { sendReply, webhookSecret, hasToken, tg } from "@/lib/telegram";

export const dynamic = "force-dynamic";

type Update = {
  message?: { chat: { id: number }; from?: { first_name?: string }; text?: string };
  callback_query?: {
    id: string;
    data?: string;
    from?: { first_name?: string };
    message?: { message_id: number; chat: { id: number }; text?: string };
  };
};

export async function POST(req: Request) {
  if (!hasToken()) return new Response("TELEGRAM_BOT_TOKEN not set", { status: 500 });
  if (req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) {
    return new Response("forbidden", { status: 403 });
  }
  const update = (await req.json()) as Update;
  const cb = update.callback_query;
  if (cb?.message && cb.data) {
    const chatId = cb.message.chat.id;
    await tg("answerCallbackQuery", { callback_query_id: cb.id });
    // Remove the buttons so an old card can't be tapped twice.
    await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } });
    try {
      const replies = await handle("telegram", String(chatId), cb.data, cb.from?.first_name);
      for (const r of replies) await sendReply(chatId, r);
    } catch (e) {
      console.error(e);
      await sendReply(chatId, { text: "Sorry, something went wrong on our side. Please try again." });
    }
    return Response.json({ ok: true });
  }
  const msg = update.message;
  if (!msg) return Response.json({ ok: true });
  const chatId = msg.chat.id;
  if (!msg.text) {
    await sendReply(chatId, { text: "Please reply with text. Send HELP for options." });
    return Response.json({ ok: true });
  }
  try {
    const replies = await handle("telegram", String(chatId), msg.text, msg.from?.first_name);
    for (const r of replies) await sendReply(chatId, r);
  } catch (e) {
    console.error(e);
    await sendReply(chatId, { text: "Sorry, something went wrong on our side. Please try again." });
  }
  return Response.json({ ok: true });
}
