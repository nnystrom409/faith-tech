// Chat SDK wiring. The Telegram adapter handles webhooks, verification and
// inline keyboards; our flow in lib/bot.ts decides what to say and save.
// WhatsApp later: add createWhatsAppAdapter() under `adapters`.
import { Chat, Card, CardText, Actions, Button, type Thread } from "chat";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createMemoryState } from "@chat-adapter/state-memory";
import { handle, errorReply, type Reply } from "./bot";
import { webhookSecret, tg } from "./telegram";

const seen = new Set<string>();
const cleared = new Set<string>();

// The first version of the bot left a reply keyboard ("YES") on some chats.
// Telegram only removes it with a message, so send one and delete it.
async function clearOldKeyboard(chatId: string) {
  if (cleared.has(chatId)) return;
  cleared.add(chatId);
  try {
    const sent = (await tg("sendMessage", { chat_id: chatId, text: "…", reply_markup: { remove_keyboard: true } })) as { result?: { message_id: number } };
    if (sent.result) await tg("deleteMessage", { chat_id: chatId, message_id: sent.result.message_id });
  } catch {}
}

// Built on first request so the build doesn't need the token.
let instance: ReturnType<typeof createBot> | undefined;
export const getBot = () => (instance ??= createBot());

function createBot() {
  const bot = new Chat({
    userName: process.env.TELEGRAM_BOT_USERNAME || "faithtechbot",
    adapters: {
      telegram: createTelegramAdapter({ mode: "webhook", secretToken: process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN || webhookSecret() }),
    },
    state: createMemoryState(),
  });

  bot.onDirectMessage(async (thread, message) => {
    // Telegram can redeliver an update; answer each message once.
    if (seen.has(message.id)) return;
    seen.add(message.id);
    await clearOldKeyboard(message.author.userId);
    await respond(thread, message.author.userId, message.text ?? "", message.author.fullName);
  });

  // Telegram marks /start, /reset, /help as bot commands, which Chat SDK routes
  // here instead of onDirectMessage.
  bot.onSlashCommand(async (event) => {
    await clearOldKeyboard(event.user.userId);
    await respond(event.channel, event.user.userId, `${event.command} ${event.text}`.trim(), event.user.fullName);
  });

  bot.onAction("r", async (event) => {
    if (!event.thread || !event.value) return;
    await respond(event.thread as Thread, event.user.userId, event.value, event.user.fullName);
  });

  return bot;
}

const EMOJI: Record<string, string> = {
  English: "🇺🇸", Español: "🇪🇸",
  "Yes, send updates": "✅", "Sí, envíenme mensajes": "✅", "No thanks": "🚫", "No, gracias": "🚫",
  "Register my church": "⛪", "Registrar mi iglesia": "⛪", "Talk to an organizer": "💬", "Hablar con un organizador": "💬",
  "Lead pastor": "🙏", "Pastor principal": "🙏", "Event coordinator": "📋", Coordinador: "📋", Other: "✏️", Otro: "✏️",
  "Host our own event": "🏠", Organizar: "🏠", "Join another church": "🤝", "Unirnos a otro": "🤝", "Help me decide": "🤔", "Necesito ayuda": "🤔",
  "Yes, that's right": "✅", "Sí, es correcto": "✅", Yes: "✅", "Sí": "✅", "Fix something": "✏️", "Corregir algo": "✏️",
  Fix: "✏️", Corregir: "✏️", "Same report": "🔁", "Es el mismo": "🔁", "Got it, thank you!": "🙌", "I need help": "🆘",
  "See full list": "📋", "Send the guide": "📖", "Some still need one": "⏳", "Need help": "🆘",
};
const label = (b: string) => {
  const e = EMOJI[b] ?? (/^(Yes|Sí), \d+$/.test(b) ? "✅" : /^\d+ (more|is right)$|^Son \d+ más$|^\d+ es correcto$/.test(b) ? "➕" : "");
  return e ? `${e} ${b}` : b;
};

// A reply with buttons becomes a card; each button's value is the same word a
// user could type, so typed replies keep working. Short pairs share a row,
// anything longer gets a row per button so Telegram doesn't truncate labels.
export const toPostable = (r: Reply) => {
  if (!r.buttons?.length) return r.text;
  const btns = r.buttons.map((b) => Button({ id: "r", value: b, label: label(b) }));
  const oneRow = btns.length <= 2 && r.buttons.every((b) => b.length <= 14);
  return Card({ children: [CardText(r.text), ...(oneRow ? [Actions(btns)] : btns.map((b) => Actions([b])))] });
};

async function respond(thread: Pick<Thread, "post">, userId: string, text: string, name?: string) {
  try {
    const replies = await handle("telegram", userId, text, name);
    for (const r of replies) await thread.post(toPostable(r));
  } catch (e) {
    console.error(e);
    await thread.post(errorReply().text);
  }
}

// Organizer-initiated messages (dashboard buttons) go out through Chat SDK too,
// so button taps on them come back through onAction.
export async function sendToTelegramUser(userId: string, replies: Reply[]) {
  const bot = getBot();
  await bot.initialize();
  const thread = await bot.openDM(userId);
  for (const r of replies) await thread.post(toPostable(r));
}
