// Telegram adapter: Bot API over fetch. Swap for a WhatsApp adapter later;
// lib/bot.ts doesn't change.
import { createHash } from "crypto";
import type { Reply } from "./bot";

const token = () => process.env.TELEGRAM_BOT_TOKEN || "";
export const hasToken = () => token().length > 0;

// Secret Telegram echoes back on every webhook call, derived from the token
// so there's only one env var to set.
export const webhookSecret = () => createHash("sha256").update("ft:" + token()).digest("hex").slice(0, 48);

export async function tg(method: string, body: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendReply(chatId: number | string, r: Reply) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: r.text,
    reply_markup: r.buttons
      ? { keyboard: [r.buttons.map((b) => ({ text: b }))], resize_keyboard: true, one_time_keyboard: true }
      : { remove_keyboard: true },
  });
}
