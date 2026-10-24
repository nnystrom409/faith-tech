// Channel-agnostic conversation logic. Each adapter (Telegram today,
// WhatsApp/SMS later) turns an inbound message into handle(channel, id, text)
// and sends back the replies. The code, not a model, decides what is saved.
import { getUser, saveUser, listChurches, getChurch, log, type User, type Church } from "./store";
import { registerChurch, saveCount } from "./baptize";

export type Reply = { text: string; buttons?: string[] };

export const MAX_COUNT = 10_000;

const WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100,
  cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, cien: 100,
};

export type CountResult = { ok: true; value: number } | { ok: false; error: string };

export function parseCount(input: string): CountResult {
  const t = input.trim().toLowerCase().replace(/[,_\s](?=\d{3}\b)/g, "");
  if (/^-\s*\d/.test(t)) return { ok: false, error: "A baptism count can't be negative. Please send a whole number from 0 to 10,000." };
  if (/^\d+[.]\d+$/.test(t)) return { ok: false, error: "Please send a whole number, like 12." };
  let n: number | undefined;
  if (/^\d+$/.test(t)) n = Number(t);
  else if (t in WORDS) n = WORDS[t];
  if (n === undefined) return { ok: false, error: "I didn't catch a number there. How many people were baptized? Reply with a number, like 12." };
  if (n > MAX_COUNT) return { ok: false, error: `${n.toLocaleString("en-US")} is more than one church can report (max 10,000). Please check the number and send it again.` };
  return { ok: true, value: n };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9áéíóúñü]+/g, " ").trim();
const YES = /^(yes|y|si|sí|ok|confirm|yes ✅|✅ yes)$/i;
const NO = /^(no|n|edit|✏️ edit|no ❌)$/i;

const consentPrompt = (): Reply => ({
  text:
    "Welcome to the Global Baptism Event! 🌊\n\n" +
    "I help churches register and report baptisms. It takes about 2 minutes.\n\n" +
    "Can we send you event messages here? Reply YES to agree. You can reply STOP at any time.",
  buttons: ["YES", "STOP"],
});

// A bare yes/no/ok is a stray tap or repeat, not a name or place.
const notAnAnswer = (t: string) => t.length < 2 || t.length > 120 || YES.test(t) || NO.test(t) || /^\/?start$/i.test(t);

const reportPrompt = (c: Church): Reply => ({
  text:
    `${c.name} is registered ✅\n\n` +
    "After your baptism service, tell me how many people were baptized. Just send a number, like 12.",
});

export async function handle(channel: string, id: string, rawText: string, name?: string): Promise<Reply[]> {
  const text = (rawText || "").trim();
  const cmd = text.replace(/^\//, "").split(/\s|@/)[0].toUpperCase();
  const key = `${channel}:${id}`;
  let user = await getUser(key);
  if (!user) user = { id: key, channel, name, step: "new", draft: {} };
  const who = user.name ? `${user.name}` : "A contact";

  const save = async (u: User) => saveUser(u);

  // STOP works at every step.
  if (["STOP", "UNSUBSCRIBE", "CANCEL", "ALTO"].includes(cmd)) {
    user.step = "stopped";
    user.stoppedAt = new Date().toISOString();
    await save(user);
    await log(`${who} opted out (STOP)`, "warn");
    return [{ text: "You're unsubscribed and won't get more messages from us. Send START if you want to come back." }];
  }

  if (user.step === "stopped") {
    if (cmd === "START") {
      user.step = "await_consent";
      user.stoppedAt = undefined;
      await save(user);
      return [consentPrompt()];
    }
    return []; // respect opt-out: stay silent
  }

  if (cmd === "HELP") {
    return [{ text: "Send a number to report baptisms, RESET to start registration over, or STOP to unsubscribe." }];
  }

  if (cmd === "RESET") {
    user.step = user.consentAt ? "ask_church" : "await_consent";
    user.draft = {};
    user.churchId = undefined;
    await save(user);
    return user.consentAt ? [{ text: "Starting over. What is your church's name?" }] : [consentPrompt()];
  }

  switch (user.step) {
    case "new": {
      user.step = "await_consent";
      await save(user);
      await log(`${who} started a conversation on ${channel}`);
      return [consentPrompt()];
    }

    case "await_consent": {
      if (YES.test(text) || cmd === "START") {
        user.consentAt = new Date().toISOString();
        user.step = "ask_church";
        const existing = user.churchId ? await getChurch(user.churchId) : undefined;
        if (existing) user.step = "registered";
        await save(user);
        await log(`${who} opted in to event messages`, "ok");
        if (existing) return [reportPrompt(existing)];
        return [{ text: "Thank you! What is your church's name?" }];
      }
      return [{ text: "To continue, reply YES to receive event messages, or STOP to opt out.", buttons: ["YES", "STOP"] }];
    }

    case "ask_church": {
      if (notAnAnswer(text)) return [{ text: "Please type your church's name, for example: Iglesia Fuente de Vida." }];
      user.draft.church = text;
      user.step = "ask_city";
      await save(user);
      return [{ text: `Great. What city or town is ${text} in?` }];
    }

    case "ask_city": {
      if (notAnAnswer(text)) return [{ text: "Please type the city or town, for example: Los Angeles." }];
      user.draft.city = text;
      user.step = "ask_leader";
      await save(user);
      return [{ text: "And what is the name of the pastor or coordinator?" }];
    }

    case "ask_leader": {
      if (notAnAnswer(text)) return [{ text: "Please type the pastor or coordinator's name, for example: Pastor Ana." }];
      user.draft.leader = text;
      user.step = "confirm_church";
      await save(user);
      const d = user.draft;
      return [
        {
          text: `Please check this:\n\n⛪ ${d.church}\n📍 ${d.city}\n👤 ${d.leader}\n\nIs this right?`,
          buttons: ["YES", "EDIT"],
        },
      ];
    }

    case "confirm_church": {
      if (NO.test(text)) {
        user.step = "ask_church";
        user.draft = {};
        await save(user);
        return [{ text: "No problem, let's fix it. What is your church's name?" }];
      }
      if (!YES.test(text)) return [{ text: "Reply YES to confirm, or EDIT to change it.", buttons: ["YES", "EDIT"] }];
      const d = user.draft;
      const all = await listChurches();
      const dupe = all.find((c) => norm(c.name) === norm(d.church!) && norm(c.city) === norm(d.city!));
      const church: Church = {
        id: `ch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        name: d.church!,
        city: d.city!,
        leader: d.leader!,
        contactId: user.id,
        registeredAt: new Date().toISOString(),
        possibleDuplicateOf: dupe?.id,
      };
      await registerChurch(church);
      user.churchId = church.id;
      user.step = "registered";
      user.draft = {};
      await save(user);
      if (dupe) {
        await log(`Possible duplicate: ${church.name}, ${church.city} (flagged for organizer review)`, "warn");
        return [
          { text: `It looks like ${dupe.name} in ${dupe.city} may already be registered. I've saved yours and flagged it so an organizer can check, so nothing is merged by mistake.` },
          reportPrompt(church),
        ];
      }
      await log(`New church registered: ${church.name}, ${church.city}`, "ok");
      return [reportPrompt(church)];
    }

    case "registered": {
      const church = user.churchId ? await getChurch(user.churchId) : undefined;
      if (!church) {
        user.step = "ask_church";
        await save(user);
        return [{ text: "I couldn't find your registration. What is your church's name?" }];
      }
      if (cmd === "START") return [reportPrompt(church)];
      const parsed = parseCount(text);
      if (!parsed.ok) {
        await log(`Rejected report from ${church.name}: "${text.slice(0, 30)}"`, "warn");
        return [{ text: parsed.error }];
      }
      if (church.baptisms === parsed.value) {
        await log(`Duplicate report ignored: ${church.name} sent ${parsed.value} again`, "warn");
        return [{ text: `You've already reported ${parsed.value} baptisms for ${church.name}, so I haven't counted it twice. 🙏` }];
      }
      user.draft.count = parsed.value;
      user.step = "confirm_count";
      await save(user);
      const prev = church.baptisms !== undefined ? `\n\nThis replaces your earlier report of ${church.baptisms}.` : "";
      return [{ text: `${parsed.value} ${parsed.value === 1 ? "person" : "people"} baptized at ${church.name}. Is that right?${prev}`, buttons: ["YES", "NO"] }];
    }

    case "confirm_count": {
      const church = user.churchId ? await getChurch(user.churchId) : undefined;
      const count = user.draft.count;
      if (!church || count === undefined) {
        user.step = "registered";
        await save(user);
        return [{ text: "Let's try again. How many people were baptized?" }];
      }
      if (NO.test(text)) {
        user.step = "registered";
        user.draft = {};
        await save(user);
        return [{ text: "OK, nothing saved. Send the correct number when you're ready." }];
      }
      if (!YES.test(text)) return [{ text: `Reply YES to save ${count}, or NO to change it.`, buttons: ["YES", "NO"] }];
      await saveCount(church, count);
      user.step = "registered";
      user.draft = {};
      await save(user);
      await log(`${church.name} reported ${count} baptisms 🎉`, "ok");
      return [
        {
          text: `Saved! ${count} baptisms at ${church.name}. Praise God! 🙌\n\nThank you for walking with them. If the number changes, just send the new one.`,
        },
      ];
    }
  }
  return [];
}
