// AI SDK answers side questions ("what do we need to host?") from the event
// FAQ only. It never registers, counts or opts anyone in or out: lib/bot.ts
// does that in code. On Vercel the AI Gateway authenticates with OIDC; locally
// set AI_GATEWAY_API_KEY. Any failure returns null and the scripted reply runs.
import { generateText } from "ai";
import type { Lang } from "./store";

const MODEL = process.env.AI_MODEL || "anthropic/claude-haiku-5.5";

const FAQ = `Event: Baptize The World, a global day of baptism on Pentecost, Sunday May 16, 2027. Churches register by chat, then prepare, hold their event, and report how many people were baptized.
Who can take part: local churches. A church can host its own event, join another church's event, or ask for help deciding. A regional organizer reviews each registration, usually within 2 days.
What the central team provides: a host starter pack (planning checklist, baptism preparation guide, invite graphics, event-day guide, follow-up resources), a 2-minute welcome video with a text summary, and regional organizers for support.
What the local church is responsible for: pastoral preparation of each candidate using its own teaching and practice, a safe venue and water with supervision, and ongoing care: every baptized person should have a named person from the church following up with them. A 30-day discipleship guide is provided.
Readiness essentials: date, time and venue; event lead and day-of contact; volunteer roles; candidate preparation; safe water and supervision; reporting owner; follow-up owner.
Reporting: on the day, the church sends the number of people baptized in this chat (a whole number from 0 to 10,000). Numbers are confirmed back, duplicates are checked, and a Baptize team member reviews counts. Reports can be sent more than once if more people are baptized later.
Messages and privacy: the church agrees to event messages first and can reply STOP at any time to unsubscribe, or START to rejoin. Stories or photos are only published with permission.
Languages: English and Spanish in this demo; more are planned.
Help: reply "Talk to an organizer" or HELP, and an organizer will reach out.`;

const QUESTION = /\?|¿|^(what|when|where|who|why|how|can we|can i|could|qu[eé] |cu[aá]ndo|c[oó]mo|d[oó]nde|qui[eé]n|por qu[eé]|puedo|podemos)\b/i;

export const looksLikeQuestion = (text: string) => text.trim().length > 6 && QUESTION.test(text.trim());

export async function answerQuestion(question: string, lang: Lang): Promise<string | null> {
  if (!process.env.VERCEL && !process.env.AI_GATEWAY_API_KEY) return null;
  try {
    const { text } = await generateText({
      model: MODEL,
      system:
        `You answer questions from church leaders in a chat about the event below. Use only these facts. ` +
        `If the answer isn't in them, say an organizer will follow up. Reply in ${lang === "es" ? "Spanish" : "English"}, ` +
        `in at most 2 short sentences, warm and plain, no markdown. Never say a church is registered or that a count was saved.\n\n${FAQ}`,
      prompt: question.slice(0, 500),
      maxOutputTokens: 160,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(8000),
    });
    return text.trim() || null;
  } catch (e) {
    console.error("answerQuestion failed", e);
    return null;
  }
}
