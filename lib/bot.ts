// Channel-agnostic conversation logic, following docs/mockups (E1–E7, S1–S4).
// Each adapter (Telegram today, WhatsApp/SMS later) turns an inbound message
// into handle(channel, id, text) and sends back the replies. Buttons are plain
// words, so typing the answer works the same as tapping it. The code, not a
// model, decides what is saved.
import { getUser, saveUser, listChurches, getChurch, saveChurch, log, type User, type Church, type Lang, type Draft } from "./store";
import { registerChurch, saveCount } from "./baptize";
import { findNear, listedEvents } from "./events";
import { answerQuestion, looksLikeQuestion } from "./ai";

export type Reply = { text: string; buttons?: string[]; link?: { label: string; url: string } };

export const MAX_COUNT = 10_000;
const DUPE_WINDOW_MS = 60 * 60 * 1000;

const WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100,
  cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, cien: 100,
};

export type CountResult = { ok: true; value: number } | { ok: false; error: "none" | "negative" | "decimal" | "too_big"; value?: number };

// Finds the count in free text like "14 bautismos hoy, gloria a Dios!".
export function parseCount(input: string): CountResult {
  const t = input.trim().toLowerCase().replace(/(\d)[,\s](?=\d{3}\b)/g, "$1");
  if (/(^|\s)-\s*\d/.test(t)) return { ok: false, error: "negative" };
  if (/\d+[.,]\d+/.test(t)) return { ok: false, error: "decimal" };
  const digits = t.match(/\d+/g);
  let n: number | undefined;
  if (digits) {
    if (digits.length > 1) return { ok: false, error: "none" };
    n = Number(digits[0]);
  } else {
    const word = t.split(/[^a-záéíóúñ]+/).find((w) => w in WORDS);
    if (word !== undefined) n = WORDS[word];
  }
  if (n === undefined) return { ok: false, error: "none" };
  if (n > MAX_COUNT) return { ok: false, error: "too_big", value: n };
  return { ok: true, value: n };
}

// "I'm Pastor Pablo Dela Cruz from Grace Fellowship in Tacloban"
// "hola soy el pastor Rubén Quispe, mi iglesia es Luz del Valle en Cusco"
// "Grace Fellowship, Pablo Dela Cruz, Tacloban"
// "vintage church" -> "Vintage Church". Text with any capitals is left as typed.
const SMALL = new Set(["de", "del", "la", "las", "los", "el", "y", "of", "the", "and", "in", "en"]);
export const nice = (s?: string) =>
  s && s === s.toLowerCase()
    ? s.replace(/\p{L}+/gu, (w, i: number) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)))
    : s;

export function parseIntro(input: string): Draft {
  const d = parseIntroRaw(input);
  return { ...d, church: nice(d.church), leader: nice(d.leader), city: nice(d.city) };
}

function parseIntroRaw(input: string): Draft {
  const t = input.trim().replace(/[.!]+$/, "");
  const clean = (s?: string) => s?.trim().replace(/^[,\s]+|[,\s]+$/g, "");
  const pastor = (s?: string) => {
    const v = clean(s) ?? "";
    const titled = /^(el |la )?pastor(a)? /i.test(v);
    return { leader: v.replace(/^(el |la )?pastor(a)? /i, "").trim() || undefined, pastorTitle: titled };
  };
  let m = t.match(/(?:i'?m|i am|this is|my name is)\s+(.+?)\s+(?:from|at|of)\s+(.+?)\s+in\s+(.+)$/i);
  if (m) return { ...pastor(m[1]), church: clean(m[2]), city: clean(m[3]) };
  m = t.match(/soy\s+(.+?)[,.]?\s+(?:y\s+)?(?:mi iglesia es|de la iglesia|pastoreo)\s+(.+?)\s+en\s+(.+)$/i);
  if (m) return { ...pastor(m[1]), church: clean(m[2]), city: clean(m[3]) };
  m = t.match(/soy\s+(.+?)\s+de\s+(.+?)\s+en\s+(.+)$/i);
  if (m) return { ...pastor(m[1]), church: clean(m[2]), city: clean(m[3]) };
  // "Nick, Vintage Church, Santa Monica" or "Vintage Church, Nick, Santa Monica":
  // the part that sounds like a church is the church, the last part is the city.
  const parts = t.split(/\s*[,;\n]\s*/).filter(Boolean);
  if (parts.length === 3) {
    const CHURCH = /church|iglesia|igreja|fellowship|chapel|capilla|ministr|parish|parroquia|templo|temple|assembly|asamblea|tabernacle|cathedral|catedral|congregation|comunidad|community|mission|misi[oó]n|bautista|baptist|cristian|christian|gospel|evangel/i;
    const PERSON = /^(el |la )?(pastor|pastora|rev|reverend|father|padre|hermano|hermana|sister|brother)\b/i;
    let ci = parts.slice(0, 2).findIndex((p) => CHURCH.test(p) && !PERSON.test(p));
    if (ci < 0) ci = PERSON.test(parts[0]) ? 1 : 0;
    return { church: parts[ci], ...pastor(parts[1 - ci]), city: parts[2] };
  }
  return {};
}

const S = {
  en: {
    welcome:
      "Welcome! Baptize The World unites churches for a global day of baptism on Pentecost, May 16, 2027.\n\nWhich language do you prefer?",
    consent: "Joining takes about 3 minutes, right here in chat. May we send you event updates here? Reply STOP anytime to opt out.",
    consentBtns: ["Yes, send updates", "No thanks"],
    consentAgain: "To continue, tap \"Yes, send updates\", or STOP to opt out.",
    menu: "Thank you! What would you like to do?",
    menuBtns: ["Register my church", "Talk to an organizer", "Find a baptism near me"],
    findAsk: "Happy to help you find a baptism near you! What town or city are you in?",
    findList: (place: string, list: string) => `Here are listed Pentecost baptism events near ${place}:\n\n${list}\n\nTap one and I'll connect you. We never share anyone's contact details.`,
    findNone: (place: string) => `I couldn't find a listed event near ${place} yet. I've passed your request to an organizer, who will follow up here.`,
    findAgain: "Search another city",
    findDone: (c: string) => `Wonderful! 🙏 I've passed your interest to the organizers for ${c}, and they'll connect you with the church here. Your details are only shared with them.`,
    organizer: "An organizer will message you here shortly. 🙏 In the meantime you can tap \"Register my church\".",
    intro: "Great! In one message, tell me your church's name, your name, and your town or city.\n\nFor example: I'm Pastor Pablo from Grace Fellowship in Tacloban",
    askChurch: "Thanks! What is your church's name?",
    askCity: (c: string) => `What town or city is ${c} in?`,
    askLeader: "And what is your name?",
    badName: "Please type a name, for example: Grace Fellowship.",
    role: (who: string, c: string) => `Thanks, ${who}! What is your role at ${c}?`,
    roleBtns: ["Lead pastor", "Event coordinator", "Other"],
    part: "How would your church like to take part?",
    partBtns: ["Host our own event", "Join another church", "Help me decide"],
    email: "Last one: an email address? Optional. Reply \"skip\" if you'd rather not.",
    skip: ["skip", "no", "none", "saltar"],
    check: "Please check your details:",
    labels: { church: "Church", leader: "Pastor", role: "Role", city: "Location", part: "Taking part", email: "Email" },
    confirmBtns: ["Yes, that's right", "Fix something"],
    listAsk: "May we list your baptism event (church name and city only) so people nearby can find it? Contact details are never shown.",
    listBtns: ["Yes, list it", "No, keep it private"],
    whatFix: "What should I change? For example: The church is Grace Fellowship Tacloban",
    updated: (v: string) => `Updated: ${v}. Everything else correct?`,
    yesFix: ["Yes", "Fix something"],
    churchPage: "Open your church page",
    registered: (c: string) =>
      `You're registered! A regional organizer will review ${c}, usually within 2 days. I'll message you here.\n\nWhen you baptize, just send the number here, for example: "12 baptisms".`,
    dupeChurch: (c: string, city: string) =>
      `Note: ${c} in ${city} may already be registered by someone else. I've flagged it for an organizer to check, so nothing is merged by mistake.`,
    noNumber: "Praise God! Please send the number, for example \"23\".",
    negative: "A baptism count can't be negative. Please send a whole number, like 23.",
    decimal: "Please send a whole number, like 23.",
    tooBig: (n: number) => `${n.toLocaleString("en-US")} is more than one church can report (max 10,000). Please check the number and send it again.`,
    checkBig: (n: number, m: number) => `Just checking: did you mean ${n}, or ${m}?`,
    rightBtn: (n: number) => `${n} is right`,
    confirm: (n: number, c: string) => `Please confirm: ${n} ${n === 1 ? "baptism" : "baptisms"} at ${c} today?`,
    confirmBtns2: (n: number) => [`Yes, ${n}`, "Fix"],
    fixCount: "OK, nothing saved. Send the correct number when you're ready.",
    recorded: (n: number, c: string) =>
      `Recorded: ${n} ${n === 1 ? "baptism" : "baptisms"} at ${c}. Thank you for serving! 🙌\n\nIf more people are baptized later, just send the new number.`,
    dupe: (n: number) => `We already received ${n} baptisms a few minutes ago. Is this ${n} more, or the same report?`,
    dupeBtns: (n: number) => ["Same report", `${n} more`],
    same: (total: number) => `Got it, the total stays at ${total}.`,
    stop: "You're unsubscribed and won't get more messages. Reply START to rejoin.",
    help: "Send a number to report baptisms, RESET to register again, or STOP to unsubscribe.",
    error: "Sorry, something went wrong on our side. Please try again.",
    noAnswer: "Good question! I've passed it to an organizer, who will reply here.",
  },
  es: {
    welcome:
      "¡Bienvenido! Baptize The World une a iglesias para un día mundial de bautismo en Pentecostés, el 16 de mayo de 2027.\n\n¿Qué idioma prefieres?",
    consent: "Registrarse toma unos 3 minutos. ¿Podemos enviarte mensajes del evento aquí? Puedes responder STOP en cualquier momento.",
    consentBtns: ["Sí, envíenme mensajes", "No, gracias"],
    consentAgain: "Para continuar, toca \"Sí, envíenme mensajes\", o STOP para salir.",
    menu: "¡Gracias! ¿Qué te gustaría hacer?",
    menuBtns: ["Registrar mi iglesia", "Hablar con un organizador", "Buscar un bautismo cerca"],
    findAsk: "¡Con gusto te ayudo a encontrar un bautismo cerca! ¿En qué ciudad estás?",
    findList: (place: string, list: string) => `Estos son los eventos de bautismo de Pentecostés cerca de ${place}:\n\n${list}\n\nToca uno y te conecto. Nunca compartimos datos de contacto.`,
    findNone: (place: string) => `Aún no encontré un evento cerca de ${place}. Le pasé tu solicitud a un organizador, que te escribirá aquí.`,
    findAgain: "Buscar otra ciudad",
    findDone: (c: string) => `¡Qué bien! 🙏 Le pasé tu interés a los organizadores de ${c}, y te conectarán con la iglesia aquí. Tus datos solo se comparten con ellos.`,
    organizer: "Un organizador te escribirá aquí pronto. 🙏 Mientras tanto puedes tocar \"Registrar mi iglesia\".",
    intro: "¡Perfecto! Cuéntame de tu iglesia en un mensaje: nombre de la iglesia, tu nombre y tu ciudad.\n\nPor ejemplo: soy el pastor Rubén, mi iglesia es Luz del Valle en Cusco",
    askChurch: "¡Gracias! ¿Cómo se llama tu iglesia?",
    askCity: (c: string) => `¿En qué ciudad está ${c}?`,
    askLeader: "¿Y cuál es tu nombre?",
    badName: "Por favor escribe un nombre, por ejemplo: Luz del Valle.",
    role: (who: string, c: string) => `Gracias, ${who}. Tengo:\n• ${c}\n\n¿Cuál es tu rol en la iglesia?`,
    roleBtns: ["Pastor principal", "Coordinador", "Otro"],
    part: "¿Quieren organizar su propio evento o unirse a otra iglesia?",
    partBtns: ["Organizar", "Unirnos a otro", "Necesito ayuda"],
    email: "Último paso: ¿un correo electrónico? Es opcional. Escribe \"saltar\" si no tienes.",
    skip: ["saltar", "no", "ninguno", "skip"],
    check: "Por favor confirma tus datos:",
    labels: { church: "Iglesia", leader: "Pastor", role: "Rol", city: "Lugar", part: "Evento", email: "Correo" },
    confirmBtns: ["Sí, es correcto", "Corregir algo"],
    listAsk: "¿Podemos publicar tu evento de bautismo (solo el nombre de la iglesia y la ciudad) para que personas cercanas lo encuentren? Nunca mostramos datos de contacto.",
    listBtns: ["Sí, publicarlo", "No, mantener privado"],
    whatFix: "¿Qué debo cambiar? Por ejemplo: La iglesia es Luz del Valle Cusco",
    updated: (v: string) => `Actualizado: ${v}. ¿Todo lo demás está bien?`,
    yesFix: ["Sí", "Corregir algo"],
    churchPage: "Ver la página de su iglesia",
    registered: (c: string) =>
      `¡Bienvenido! ${c} está registrada. Un organizador regional revisará su participación pronto.\n\nCuando bauticen, simplemente envíe el número aquí, por ejemplo: "12 bautismos".`,
    dupeChurch: (c: string, city: string) =>
      `Nota: puede que ${c} en ${city} ya esté registrada. Lo marqué para que un organizador lo revise; nada se combina automáticamente.`,
    noNumber: "¡Gloria a Dios! Por favor envía el número, por ejemplo \"14\".",
    negative: "El número no puede ser negativo. Envía un número entero, como 14.",
    decimal: "Envía un número entero, como 14.",
    tooBig: (n: number) => `${n.toLocaleString("es")} es más de lo que una iglesia puede reportar (máximo 10.000). Revisa el número y envíalo otra vez.`,
    checkBig: (n: number, m: number) => `Solo para confirmar: ¿quisiste decir ${n} o ${m}?`,
    rightBtn: (n: number) => `${n} es correcto`,
    confirm: (n: number, c: string) => `¿Confirmas ${n} ${n === 1 ? "bautismo" : "bautismos"} para ${c} hoy?`,
    confirmBtns2: (n: number) => [`Sí, ${n}`, "Corregir"],
    fixCount: "Bien, no guardé nada. Envía el número correcto cuando estés listo.",
    recorded: (n: number, _c: string) => `Registrado: ${n} ${n === 1 ? "bautismo" : "bautismos"}. ¡Gracias por servir! 🙌`,
    dupe: (n: number) => `Ya recibimos ${n} bautismos hace unos minutos. ¿Son ${n} más, o es el mismo reporte?`,
    dupeBtns: (n: number) => ["Es el mismo", `Son ${n} más`],
    same: (total: number) => `Entendido, el total sigue en ${total}.`,
    stop: "Cancelaste la suscripción y no recibirás más mensajes. Responde START para volver.",
    help: "Envía un número para reportar bautismos, RESET para registrarte de nuevo, o STOP para salir.",
    error: "Lo siento, algo salió mal. Intenta de nuevo.",
    noAnswer: "¡Buena pregunta! Se la pasé a un organizador, que te responderá aquí.",
  },
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9@. ]+/g, " ").replace(/\s+/g, " ").trim();
const is = (text: string, ...options: string[]) => options.some((o) => norm(o) === norm(text));
const YES = ["yes", "y", "si", "ok", "okay", "yep", "correct", "confirm"];
const NO = ["no", "n", "nope"];
// A bare yes/no/ok is a stray tap or repeat, not a name or place.
const notAName = (t: string) => t.length < 2 || t.length > 120 || is(t, ...YES, ...NO, "start", "/start");

const lineOf = (lang: Lang, d: Draft) => {
  const L = S[lang].labels;
  return [
    `${L.church}: ${d.church}`,
    `${L.leader}: ${d.leader}`,
    d.role && `${L.role}: ${d.role}`,
    `${L.city}: ${d.city}`,
    d.part && `${L.part}: ${d.part}`,
    `${L.email}: ${d.email || "—"}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const greetName = (lang: Lang, d: Draft) => {
  if (!d.leader) return "";
  if (d.pastorTitle) return `Pastor ${d.leader.split(" ")[0]}`;
  return d.leader.split(" ")[0];
};

// Side questions get a short AI answer, then the step they were on is asked
// again. Everything else is the scripted flow below.
export async function handle(channel: string, id: string, rawText: string, name?: string): Promise<Reply[]> {
  const text = (rawText || "").trim();
  const user = await getUser(`${channel}:${id}`);
  const askable = user && !["new", "ask_language", "stopped"].includes(user.step) && user.lastPrompt;
  const first = text.replace(/^\//, "").split(/[\s@?¿!.,]/)[0].toUpperCase();
  if (askable && !GLOBAL_CMDS.includes(first) && looksLikeQuestion(text) && !isExpectedAnswer(user, text)) {
    const answer = await answerQuestion(text, user.lang ?? "en");
    await log(`Question from ${user.name || "a contact"}${answer ? " answered by AI" : " sent to an organizer"}: "${text.slice(0, 40)}"`, answer ? "info" : "warn");
    // Without an answer, still don't let a question be saved as a name or place.
    // Once registered or approved, just answer; the starter pack was already sent on approval.
    const done = ["registered", "approved"].includes(user.step);
    return [{ text: answer ?? S[user.lang ?? "en"].noAnswer }, ...(done ? [] : [user.lastPrompt!])];
  }
  // A brand-new contact who opens with a question gets the answer, then the welcome.
  const fresh = !user || user.step === "new";
  const answer = fresh && !text.startsWith("/") && looksLikeQuestion(text) ? await answerQuestion(text, "en") : null;
  const replies = [...(answer ? [{ text: answer }] : []), ...(await flow(channel, id, rawText, name))];
  const last = replies[replies.length - 1];
  if (last) {
    const u = await getUser(`${channel}:${id}`);
    if (u) await saveUser({ ...u, lastPrompt: last });
  }
  return replies;
}

// Opt-out words always reach flow(), even with a "?" after them.
const GLOBAL_CMDS = ["STOP", "UNSUBSCRIBE", "CANCEL", "ALTO", "PARAR"];

// A step that expects free text (names, places) shouldn't treat "Grace? Church" as a question.
const isExpectedAnswer = (u: User, text: string) =>
  !!u.lastPrompt?.buttons?.some((b) => is(text, b)) ||
  (u.step === "ask_intro" && !!parseIntro(text).church) || (u.step === "registered" && parseCount(text).ok);

async function flow(channel: string, id: string, rawText: string, name?: string): Promise<Reply[]> {
  const text = (rawText || "").trim();
  const cmd = text.replace(/^\//, "").split(/\s|@/)[0].toUpperCase();
  const key = `${channel}:${id}`;
  let user = await getUser(key);
  if (!user) user = { id: key, channel, name, step: "new", draft: {} };
  const lang: Lang = user.lang ?? (/^(hola|buen|quiero|soy)/i.test(text) ? "es" : "en");
  const t = S[lang];
  const who = user.name || "A contact";
  const save = (u: User) => saveUser(u);

  // STOP works at every step.
  if (["STOP", "UNSUBSCRIBE", "CANCEL", "ALTO", "PARAR"].includes(cmd)) {
    user.step = "stopped";
    user.stoppedAt = new Date().toISOString();
    await save(user);
    await log(`${who} opted out (STOP), reminders cancelled`, "warn");
    return [{ text: t.stop }];
  }

  if (user.step === "stopped") {
    if (cmd !== "START") return []; // respect opt-out: stay silent
    user.stoppedAt = undefined;
    user.step = "ask_language";
    await save(user);
    return [{ text: t.welcome, buttons: ["English", "Español"] }];
  }

  if (is(text, "help", "/help", "ayuda")) return [{ text: t.help }];

  // START always begins again, like RESET, so a demo can rerun from the top.
  if (cmd === "RESET" || cmd === "START") {
    user.step = "ask_language";
    user.draft = {};
    user.churchId = undefined;
    await save(user);
    return [{ text: t.welcome, buttons: ["English", "Español"] }];
  }

  const church = user.churchId ? await getChurch(user.churchId) : undefined;

  switch (user.step) {
    case "new": {
      user.step = "ask_language";
      await save(user);
      await log(`${who} started a conversation on ${channel}`);
      return [{ text: t.welcome, buttons: ["English", "Español"] }];
    }

    case "ask_language": {
      if (is(text, "english", "en", "ingles")) user.lang = "en";
      else if (is(text, "espanol", "spanish", "es")) user.lang = "es";
      else return [{ text: t.welcome, buttons: ["English", "Español"] }];
      user.step = "await_consent";
      await save(user);
      const tl = S[user.lang];
      return [{ text: tl.consent, buttons: tl.consentBtns }];
    }

    case "await_consent": {
      if (is(text, ...t.consentBtns.slice(0, 1), ...YES)) {
        user.consentAt = new Date().toISOString();
        user.step = church ? "registered" : "menu";
        await save(user);
        await log(`${who} opted in (${lang}), consent time saved`, "ok");
        if (church) return [{ text: t.registered(church.name) }];
        return [{ text: t.menu, buttons: t.menuBtns }];
      }
      if (is(text, t.consentBtns[1], "no thanks", "no gracias", ...NO)) {
        user.step = "stopped";
        user.stoppedAt = new Date().toISOString();
        await save(user);
        await log(`${who} declined messages`, "warn");
        return [{ text: t.stop }];
      }
      return [{ text: t.consentAgain, buttons: t.consentBtns }];
    }

    case "menu": {
      if (is(text, t.menuBtns[1], "talk to an organizer", "hablar con un organizador", "organizer", "organizador")) {
        await log(`${who} asked to talk to an organizer (support task)`, "warn");
        return [{ text: t.organizer, buttons: t.menuBtns }];
      }
      if (is(text, t.menuBtns[2], "find a baptism near me", "buscar un bautismo cerca", "find near me", "near me", "cerca")) {
        user.step = "find_city";
        await save(user);
        return [{ text: t.findAsk }];
      }
      user.step = "ask_intro";
      await save(user);
      if (is(text, t.menuBtns[0], "register my church", "registrar mi iglesia", "register", "registrar")) return [{ text: t.intro }];
      return flow(channel, id, text, name); // they went straight to the intro
    }

    case "ask_intro": {
      const d = parseIntro(text);
      if (d.church && d.city && d.leader) {
        user.draft = { ...user.draft, ...d };
        user.step = "ask_role";
        await save(user);
        return [{ text: t.role(greetName(lang, user.draft), user.draft.church!), buttons: t.roleBtns }];
      }
      if (notAName(text)) return [{ text: t.intro }];
      // Couldn't split it: treat it as the church name and ask the rest.
      user.draft.church = nice(text);
      user.step = "ask_city";
      await save(user);
      return [{ text: t.askCity(text) }];
    }

    case "ask_church": {
      if (notAName(text)) return [{ text: t.badName }];
      user.draft.church = nice(text);
      user.step = "ask_city";
      await save(user);
      return [{ text: t.askCity(text) }];
    }

    case "ask_city": {
      if (notAName(text)) return [{ text: t.askCity(user.draft.church ?? "") }];
      user.draft.city = nice(text);
      user.step = "ask_leader";
      await save(user);
      return [{ text: t.askLeader }];
    }

    case "ask_leader": {
      if (notAName(text)) return [{ text: t.askLeader }];
      const p = parseIntro(`soy ${text} de x en y`);
      user.draft.leader = nice(p.leader ?? text);
      user.draft.pastorTitle = p.pastorTitle;
      user.step = "ask_role";
      await save(user);
      return [{ text: t.role(greetName(lang, user.draft), user.draft.church!), buttons: t.roleBtns }];
    }

    case "ask_role": {
      if (notAName(text)) return [{ text: t.role(greetName(lang, user.draft), user.draft.church!), buttons: t.roleBtns }];
      user.draft.role = text;
      user.step = "ask_part";
      await save(user);
      return [{ text: t.part, buttons: t.partBtns }];
    }

    case "ask_part": {
      if (notAName(text)) return [{ text: t.part, buttons: t.partBtns }];
      user.draft.part = text;
      user.step = "ask_email";
      await save(user);
      return [{ text: t.email }];
    }

    case "ask_email": {
      if (is(text, ...t.skip)) user.draft.email = undefined;
      else if (/^\S+@\S+\.\S+$/.test(text)) user.draft.email = text;
      else return [{ text: t.email }];
      // Only hosts have an event to list; a church joining another one skips this.
      if (is(user.draft.part ?? "", t.partBtns[1])) {
        user.draft.listed = false;
        user.step = "confirm_church";
        await save(user);
        return [{ text: `${t.check}\n\n${lineOf(lang, user.draft)}`, buttons: t.confirmBtns }];
      }
      user.step = "ask_listed";
      await save(user);
      return [{ text: t.listAsk, buttons: t.listBtns }];
    }

    case "ask_listed": {
      if (is(text, t.listBtns[0], ...YES)) user.draft.listed = true;
      else if (is(text, t.listBtns[1], "private", "privado", ...NO)) user.draft.listed = false;
      else return [{ text: t.listAsk, buttons: t.listBtns }];
      user.step = "confirm_church";
      await save(user);
      return [{ text: `${t.check}\n\n${lineOf(lang, user.draft)}`, buttons: t.confirmBtns }];
    }

    case "confirm_church": {
      if (is(text, t.confirmBtns[1], "fix something", "corregir algo", "fix", "corregir", "edit", ...NO)) {
        user.step = "fix_church";
        await save(user);
        return [{ text: t.whatFix }];
      }
      if (!is(text, t.confirmBtns[0], t.yesFix[0], ...YES, "yes thats right", "si es correcto")) {
        return [{ text: `${t.check}\n\n${lineOf(lang, user.draft)}`, buttons: t.confirmBtns }];
      }
      const d = user.draft;
      const all = await listChurches();
      const dupe = all.find((c) => norm(c.name) === norm(d.church!) && norm(c.city) === norm(d.city!) && c.contactId !== user.id);
      const c: Church = {
        id: `ch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        name: d.church!,
        city: d.city!,
        leader: d.leader!,
        role: d.role,
        part: d.part,
        email: d.email,
        listed: d.listed === true,
        lang,
        contactId: user.id,
        registeredAt: new Date().toISOString(),
        possibleDuplicateOf: dupe?.id,
      };
      await registerChurch(c);
      user.churchId = c.id;
      user.step = "registered";
      user.draft = {};
      await save(user);
      const out: Reply[] = [{ text: t.registered(c.name), link: { label: t.churchPage, url: churchUrl(c) } }];
      if (dupe) {
        await log(`Possible duplicate: ${c.name}, ${c.city} (flagged for review, not merged)`, "warn");
        out.unshift({ text: t.dupeChurch(dupe.name, dupe.city) });
      } else {
        await log(`Registered: ${c.name}, ${c.city} · ${d.part ?? ""} · duplicate check passed`, "ok");
      }
      return out;
    }

    case "find_city": {
      const found = await findNear(text);
      const place = nice(text) ?? text;
      if (!found.length) {
        user.step = "menu";
        await save(user);
        await log(`${who} looked for a baptism near ${place}: none listed, sent to an organizer`, "warn");
        return [{ text: t.findNone(place), buttons: t.menuBtns }];
      }
      user.step = "find_pick";
      await save(user);
      const list = found.map((e) => `⛪ ${e.church}, ${e.city}\n${e.when}`).join("\n\n");
      return [{ text: t.findList(place, list), buttons: [...found.map((e) => e.church), t.findAgain] }];
    }

    case "find_pick": {
      if (is(text, t.findAgain, "search another city", "buscar otra ciudad", "another", "otra")) {
        user.step = "find_city";
        await save(user);
        return [{ text: t.findAsk }];
      }
      const ev = (await listedEvents()).find((e) => is(text, e.church));
      if (!ev) {
        // Typed a place instead of tapping a church: search again.
        user.step = "find_city";
        await save(user);
        return flow(channel, id, text, name);
      }
      user.step = "menu";
      await save(user);
      await log(`${who} wants to join the baptism at ${ev.church}, ${ev.city} (follow-up task, contact kept private)`, "ok");
      return [{ text: t.findDone(ev.church), buttons: t.menuBtns }];
    }

    case "fix_church": {
      const m = text.match(
        /^(?:the\s+|my\s+|la\s+|el\s+|mi\s+)?(church|iglesia|city|town|location|ciudad|lugar|name|pastor|nombre|role|rol|email|correo)\s*(?:name\s+)?(?:is|es|:|=)\s*(.+)$/i,
      );
      if (!m) return [{ text: t.whatFix }];
      const field = m[1].toLowerCase();
      const value = ["role", "rol", "email", "correo"].includes(field) ? m[2].trim() : nice(m[2].trim())!;
      const map: Record<string, keyof Draft> = {
        church: "church", iglesia: "church", city: "city", town: "city", location: "city", ciudad: "city", lugar: "city",
        name: "leader", pastor: "leader", nombre: "leader", role: "role", rol: "role", email: "email", correo: "email",
      };
      (user.draft as Record<string, unknown>)[map[field]] = value;
      user.step = "confirm_church";
      await save(user);
      return [{ text: t.updated(value), buttons: t.yesFix }];
    }

    case "registered": {
      if (!church) {
        user.step = "menu";
        await save(user);
        return [{ text: t.menu, buttons: t.menuBtns }];
      }
      const parsed = parseCount(text);
      if (!parsed.ok) {
        await log(`Rejected report from ${church.name}: "${text.slice(0, 30)}"`, "warn");
        if (parsed.error === "too_big") return [{ text: t.tooBig(parsed.value!) }];
        return [{ text: t[parsed.error === "none" ? "noNumber" : parsed.error] }];
      }
      const n = parsed.value;
      user.draft.count = n;
      // Sanity check: a round number of 100+ is often an extra zero (230 vs 23).
      if (n >= 100 && n % 10 === 0) {
        user.step = "check_count";
        await save(user);
        await log(`Unusual count from ${church.name}: ${n}, asked to double-check`, "warn");
        return [{ text: t.checkBig(n, n / 10), buttons: [String(n / 10), t.rightBtn(n)] }];
      }
      const last = church.reports?.[church.reports.length - 1];
      if (last && last.count === n && Date.now() - Date.parse(last.at) < DUPE_WINDOW_MS) {
        user.step = "dupe_count";
        await save(user);
        await log(`Possible duplicate report: ${church.name} sent ${n} again`, "warn");
        return [{ text: t.dupe(n), buttons: t.dupeBtns(n) }];
      }
      user.step = "confirm_count";
      await save(user);
      return [{ text: t.confirm(n, church.name), buttons: t.confirmBtns2(n) }];
    }

    case "check_count": {
      const n = user.draft.count;
      if (!church || n === undefined) break;
      let chosen: number | undefined;
      if (is(text, t.rightBtn(n))) chosen = n;
      else {
        const p = parseCount(text);
        if (p.ok && (p.value === n || p.value === n / 10)) chosen = p.value;
      }
      if (chosen === undefined) return [{ text: t.checkBig(n, n / 10), buttons: [String(n / 10), t.rightBtn(n)] }];
      const prev = church.reports?.[church.reports.length - 1];
      if (prev && prev.count === chosen && Date.now() - Date.parse(prev.at) < DUPE_WINDOW_MS) {
        user.draft.count = chosen;
        user.step = "dupe_count";
        await save(user);
        return [{ text: t.dupe(chosen), buttons: t.dupeBtns(chosen) }];
      }
      return record(user, church, chosen, lang);
    }

    case "confirm_count": {
      const n = user.draft.count;
      if (!church || n === undefined) break;
      if (is(text, t.confirmBtns2(n)[1], "fix", "corregir", "edit", ...NO)) {
        user.step = "registered";
        user.draft = {};
        await save(user);
        return [{ text: t.fixCount }];
      }
      if (!is(text, t.confirmBtns2(n)[0], ...YES, String(n))) return [{ text: t.confirm(n, church.name), buttons: t.confirmBtns2(n) }];
      return record(user, church, n, lang);
    }

    // E4–E7: replies to messages an organizer sent from the dashboard.
    case "approved": {
      if (!church) break;
      if (is(text, "text")) {
        return [{ text: ORG.videoSummary, buttons: ["Got it, thank you!"] }];
      }
      if (is(text, "i need help", "help me", "need help")) {
        await log(`${church.name} asked for help after approval (support task)`, "warn");
        return [{ text: "Thanks for telling us. A regional organizer will message you here today. 🙏" }];
      }
      if (is(text, "got it, thank you!", "got it", "thanks", "thank you", ...YES)) {
        user.step = "registered";
        await save(user);
        await log(`Starter pack acknowledged by ${church.name}`, "ok");
        return [{ text: "Wonderful! I'll check in as Pentecost gets closer. 🙌" }];
      }
      user.step = "registered";
      await save(user);
      return handle(channel, id, text, name);
    }

    case "ask_followup_owner": {
      if (!church) break;
      if (is(text, "see full list")) return [{ text: ORG.checklist(church), buttons: ["Talk to an organizer"] }];
      if (is(text, "talk to an organizer")) {
        await log(`${church.name} asked to talk to an organizer (support task)`, "warn");
        return [{ text: "An organizer will call you today. 🙏" }];
      }
      if (notAName(text)) return [{ text: ORG.askOwner }];
      await saveChurch({ ...church, followupOwner: text });
      user.step = "registered";
      await save(user);
      await log(`${church.name}: follow-up owner set (${text}) · 1 open essential: water & supervision`, "warn");
      return [
        {
          text: `Thanks! Follow-up owner: ${text}. You asked for help with water and supervision. An organizer will call you today.`,
          buttons: ["See full list", "Talk to an organizer"],
        },
      ];
    }

    case "followup_people": {
      if (!church) break;
      const n = church.baptisms ?? 0;
      if (is(text, `Yes, all ${n}`, "yes all", ...YES)) {
        user.step = "followup_guide";
        await save(user);
        await log(`${church.name}: follow-up confirmed for all ${n}`, "ok");
        return [{ text: "Wonderful. Would you like the 30-day discipleship guide to share with them?", buttons: ["Send the guide", "No thanks"] }];
      }
      if (is(text, "Some still need one", "Need help")) {
        user.step = "registered";
        await save(user);
        await log(`${church.name}: some baptized people still need a follow-up person (support task)`, "warn");
        return [{ text: "Thank you for telling us. An organizer will help you match each person with someone from your church. 🙏" }];
      }
      return [{ text: ORG.followup(n), buttons: [`Yes, all ${n}`, "Some still need one", "Need help"] }];
    }

    case "followup_guide": {
      if (!church) break;
      user.step = "registered";
      await save(user);
      if (is(text, "Send the guide", ...YES)) {
        await log(`30-day discipleship guide sent to ${church.name}`, "ok");
        return [{ text: `Sent: ${ORG.guideUrl}\n\nWe'll check in again in 30 days. Reply STOP anytime to stop messages.` }];
      }
      return [{ text: "No problem. We'll check in again in 30 days. Reply STOP anytime to stop messages." }];
    }

    case "dupe_count": {
      const n = user.draft.count;
      if (!church || n === undefined) break;
      if (is(text, t.dupeBtns(n)[0], "same", "same report", "es el mismo", "mismo")) {
        user.step = "registered";
        user.draft = {};
        await save(user);
        await log(`Duplicate report ignored for ${church.name}, total stays ${church.baptisms ?? 0}`, "info");
        return [{ text: t.same(church.baptisms ?? 0) }];
      }
      if (is(text, t.dupeBtns(n)[1], "more", "mas", `son ${n} mas`, `${n} more`)) return record(user, church, n, lang);
      return [{ text: t.dupe(n), buttons: t.dupeBtns(n) }];
    }
  }

  user.step = church ? "registered" : "menu";
  user.draft = {};
  await save(user);
  return [{ text: church ? t.registered(church.name) : t.menu, buttons: church ? undefined : t.menuBtns }];
}

// Messages an organizer sends from the dashboard (mockups E4, E5, E6, E7).
// Each church's own page in the web app. Name and city ride along in the URL
// so the page still shows them if this instance's memory doesn't have the church.
export const churchUrl = (c: Church) =>
  `${ORG.baseUrl}/church/${c.id}?${new URLSearchParams({ n: c.name, c: c.city, l: c.leader })}`;

const ORG = {
  // Set PUBLIC_BASE_URL on another domain so church pages open on the deployment that stores them.
  baseUrl: process.env.PUBLIC_BASE_URL || "https://faith-tech-gold.vercel.app",
  packUrl: "https://faith-tech-gold.vercel.app/starter-pack",
  guideUrl: "https://faith-tech-gold.vercel.app/discipleship-guide",
  videoSummary:
    "Welcome video in short: Pentecost, May 16, 2027 is a global day of baptism. Prepare each candidate with your church's usual teaching, keep the water safe and supervised, report your number here on the day, and make sure every person has someone from your church walking with them afterwards.",
  askOwner: "Who will follow up with each person after they're baptized?",
  checklist: (c: Church) =>
    [
      `Two weeks to go! Here's ${c.name}'s readiness list:`,
      "",
      "✅ Date, time and venue",
      "✅ Event lead and day-of contact",
      "✅ Volunteer roles",
      "⏳ Candidate preparation: not yet",
      "🆘 Safe water and supervision: need help",
      "✅ Reporting owner",
      c.followupOwner ? `✅ Follow-up owner: ${c.followupOwner}` : "⏳ Follow-up owner: not yet",
    ].join("\n"),
  followup: (n: number) => `Does each of the ${n} people baptized have a named person from your church following up with them?`,
};

const pastorOf = (c: Church) => {
  const first = c.leader?.split(" ")[0] ?? "";
  return /pastor/i.test(c.role ?? "") ? `Pastor ${first}` : first || "friend";
};

export type OrganizerAction = "approve" | "readiness" | "report" | "followup";

export async function organizerMessage(churchId: string, action: OrganizerAction): Promise<{ user: User; replies: Reply[] } | { error: string }> {
  const church = await getChurch(churchId);
  if (!church) return { error: "church not found" };
  const user = await getUser(church.contactId);
  if (!user) return { error: "contact not found" };
  if (user.step === "stopped") return { error: "contact opted out" };
  const p = pastorOf(church);
  let replies: Reply[] = [];
  switch (action) {
    case "approve":
      await saveChurch({ ...church, status: "Confirmed" });
      user.step = "approved";
      replies = [
        { text: `Good news, ${p}: ${church.name} is confirmed as a host church! 🎉` },
        { text: "🎬 Welcome video · 2 min\nPurpose, what to expect, preparing candidates, and caring for them after.\n\nCan't play video? Reply TEXT for a short written summary." },
        {
          text: `Your host starter pack: planning checklist, baptism prep guide, invite graphics, event-day guide and follow-up resources.\n${ORG.packUrl}`,
          buttons: ["Got it, thank you!", "I need help"],
        },
      ];
      await log(`${church.name} approved as host · starter pack v1 sent`, "ok");
      break;
    case "readiness":
      user.step = "ask_followup_owner";
      replies = [{ text: ORG.checklist(church) }, { text: ORG.askOwner }];
      await log(`Readiness check sent to ${church.name}`, "info");
      break;
    case "report":
      user.step = "registered";
      replies = [{ text: `Happy Pentecost, ${p}! When you're ready, how many people were baptized today?` }];
      await log(`Pentecost report request sent to ${church.name}`, "info");
      break;
    case "followup": {
      const n = church.baptisms ?? 0;
      user.step = "followup_people";
      replies = [
        { text: `Thank you again for Sunday, ${p}! Two quick questions.` },
        { text: ORG.followup(n), buttons: [`Yes, all ${n}`, "Some still need one", "Need help"] },
      ];
      await log(`Follow-up check sent to ${church.name}`, "info");
      break;
    }
  }
  user.draft = {};
  user.lastPrompt = replies[replies.length - 1];
  await saveUser(user);
  return { user, replies };
}

async function record(user: User, church: Church, n: number, lang: Lang): Promise<Reply[]> {
  const updated = await saveCount(church, n);
  user.step = "registered";
  user.draft = {};
  await saveUser(user);
  await log(`${church.name} reported ${n} baptisms 🎉 (total ${updated.baptisms}) · awaiting Baptize review`, "ok");
  return [{ text: S[lang].recorded(n, church.name) }];
}

export const errorReply = (lang: Lang = "en"): Reply => ({ text: S[lang].error });
