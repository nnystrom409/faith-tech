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

const LABELS: Record<string, string> = { YES: "✅ Yes", EDIT: "✏️ Edit", NO: "✏️ Change", STOP: "🚫 No thanks", HELP: "❓ Help" };

// Short pairs share a row; anything longer gets a row per button.
const keyboard = <T extends { text: string }>(btns: T[]) =>
  btns.length <= 2 && btns.every((b) => b.text.length <= 16) ? [btns] : btns.map((b) => [b]);

// Buttons render as inline keyboards; the tap comes back as a callback_query
// whose data is the same word a user could type, so typed replies still work.
export async function sendReply(chatId: number | string, r: Reply) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: r.text,
    reply_markup: r.buttons
      ? { inline_keyboard: keyboard(r.buttons.map((b) => ({ text: LABELS[b] ?? b, callback_data: b }))) }
      : r.link
        ? { inline_keyboard: [[{ text: r.link.label, url: r.link.url }]] }
        : { remove_keyboard: true },
  });
}
