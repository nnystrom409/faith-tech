# Global Baptism Event bot

**Track:** 1 Mobile-first church onboarding
**Team:** Nick Nystrom · **Project Lead:** Nick Nystrom · **Dev:** Nick Nystrom (with Claude Code)

> We help church leaders anywhere in the world register their church and report baptisms for Baptize The World's Pentecost 2027 event by chatting with a bot on the phone they already use.

## What we built

A chat bot (live on Telegram) that walks a pastor through opt-in, language choice, church registration and baptism reporting in about three minutes, in English or Spanish. A live dashboard shows organizers each registration, report and flagged issue as it happens.

![Onboarding mockups](docs/mockups/png/E1Welcome.png)

## Demo

- **Live bot:** [t.me/FaithTech_tribos_bot](https://t.me/FaithTech_tribos_bot) (Telegram, anyone can message it)
- **Live dashboard:** [faith-tech-gold.vercel.app](https://faith-tech-gold.vercel.app)
- **Browser chat backup (no Telegram needed):** [faith-tech-gold.vercel.app/chat](https://faith-tech-gold.vercel.app/chat)
- Video walkthrough: _link added after recording_
- **Try it in 60 seconds:**
  1. Open the bot link and send `Hi`. Tap **English** (or **Español**), then **Yes, send updates**, then **Register my church**.
  2. Send one message like `I'm Pastor Ramon from Grace Fellowship in Tacloban` and confirm.
  3. Send `12 baptisms` and confirm. Watch it appear on the dashboard.
  4. Try `twelve thousand`, `-3` or `abc` to see validation, send the same count twice to see duplicate handling, and send `STOP` to opt out (`START` to come back).

## Run it

```bash
npm install
npm run dev   # open http://localhost:3000/chat to talk to the bot without Telegram
```

To run the Telegram bot on Vercel:

1. In Telegram, message @BotFather → `/newbot` → copy the token.
2. Import this repo on Vercel and set `TELEGRAM_BOT_TOKEN`.
3. Optional: add Upstash Redis from the Vercel Marketplace (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) so data is shared across instances. Without it, data lives in memory.
4. Open `https://<your-app>.vercel.app/api/telegram/setup` once. It points the bot's webhook at the deployment and returns the bot's t.me link.

## What works / what does not yet

- **Works:**
  - Consent first: opt-in before any event message, `STOP` works at any step, `START` resumes.
  - Language choice (English, Spanish) with tap buttons, plus "Talk to an organizer", which logs a support task.
  - Registration from one free-text message (church, leader, city), with a confirm-back before saving.
  - Baptism reporting with validation done by code, not AI: whole numbers 0–10,000 only, rejects text, negatives and decimals, ignores a repeated identical report, asks before replacing an earlier one.
  - Possible duplicate churches (same name and city) are flagged for an organizer instead of merged.
  - Live dashboard at `/` (refreshes every 2 seconds) and a browser chat at `/chat` that uses the same logic.
  - Test data only.
- **Not yet:**
  - The AI SDK agent (language detection and field extraction for any language, number words like "nove"). Today the parsing is rule-based.
  - WhatsApp and SMS. Meta would not issue a WhatsApp test number on the day, so we demo on Telegram. The flow is channel-agnostic, so WhatsApp (`@chat-adapter/whatsapp`) or SMS (`@chat-adapter/twilio`) is a new adapter, not a rewrite.
  - A real database. Data is in memory or Upstash Redis, not Supabase yet.
  - Participant and organizer journeys from the [build brief](docs/build-brief.md) beyond the church path.

## How it would plug into Baptize

- **Covers:** register a church and save a count.
- **Mocked:** `lib/baptize.ts` exposes `registerChurch` and `saveCount`. These are the only two calls that would change to hit the real Baptize API.
- **To run it for real, Baptize would need:** those two endpoints (or direct Supabase tables), a WhatsApp Business number and/or Clearstream/Twilio SMS for the adapter, and an organizer review queue for flagged duplicates and support requests.
- **Stack fit:** Next.js + TypeScript on Vercel, the same as Baptize. Storage moves to Supabase Postgres as a couple of tables. See the [tech approach](docs/tech-approach.md) and [MVP architecture](docs/architecture.html).

## Continue, hand off or stop?

Continue. Nick plans to keep building after the hackathon, starting with the AI SDK agent and a WhatsApp adapter, and is happy to hand it to the Baptize team.

## If someone picks this up next

1. **AI SDK agent:** have the model extract church, leader, city and counts from free text in any language into a zod schema, while the existing TypeScript validators keep the final say. Flag low-confidence results for a person.
2. **WhatsApp + SMS:** add `@chat-adapter/whatsapp` and `@chat-adapter/twilio` next to the Telegram adapter in `lib/chat.ts`. The conversation logic in `lib/bot.ts` does not change.
3. **Supabase + real Baptize API:** replace `lib/store.ts` with Supabase tables and swap the mocks in `lib/baptize.ts` for real calls.

Good to know: `lib/bot.ts` is the whole conversation as a channel-agnostic state machine. `lib/chat.ts` wires it to Chat SDK (webhook route `/api/webhooks/telegram`). `/api/telegram/setup?legacy=1` switches to the older direct webhook at `/api/telegram`. After each new domain or deploy, visit `/api/telegram/setup` once.

## Docs

| Doc | What it is |
|---|---|
| [Build brief](docs/build-brief.md) | Prototype workflow and acceptance tests |
| [Tech approach](docs/tech-approach.md) | Why Vercel Chat SDK + AI SDK, packages, demo risks |
| [MVP architecture](docs/architecture.html) | Diagram of the bot and storage options |
| [Demo screen mockups](docs/mockups/README.md) | Phone mockups of the onboarding flow (English full flow, Spanish quick demo) |

## Credits

- [Vercel Chat SDK](https://chat-sdk.dev) (`chat`, `@chat-adapter/telegram`, `@chat-adapter/state-memory`)
- [Next.js](https://nextjs.org), hosted on [Vercel](https://vercel.com); optional [Upstash Redis](https://upstash.com)
- Telegram Bot API
- FaithTech SoCal hackathon brief and README template
- Built with help from Claude Code

## License

MIT. See [LICENSE](LICENSE).
