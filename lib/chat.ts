// Chat SDK wiring. The Telegram adapter handles webhooks, verification and
// inline keyboards; our flow in lib/bot.ts decides what to say and save.
// WhatsApp later: add createWhatsAppAdapter() under `adapters`.
import { Chat, Card, CardText, Actions, Button, type Thread } from "chat";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createMemoryState } from "@chat-adapter/state-memory";
import { handle, errorReply, type Reply } from "./bot";
import { webhookSecret } from "./telegram";

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
    await respond(thread, message.author.userId, message.text ?? "", message.author.fullName);
  });

  bot.onAction("r", async (event) => {
    if (!event.thread || !event.value) return;
    await respond(event.thread as Thread, event.user.userId, event.value, event.user.fullName);
  });

  return bot;
}

// A reply with buttons becomes a card; each button's value is the same word a
// user could type, so typed replies keep working.
const toPostable = (r: Reply) =>
  r.buttons?.length
    ? Card({ children: [CardText(r.text), Actions(r.buttons.map((b) => Button({ id: "r", value: b, label: b })))] })
    : r.text;

async function respond(thread: Thread, userId: string, text: string, name?: string) {
  try {
    const replies = await handle("telegram", userId, text, name);
    for (const r of replies) await thread.post(toPostable(r));
  } catch (e) {
    console.error(e);
    await thread.post(errorReply().text);
  }
}
