# Tech approach: Vercel AI SDK + Chat SDK

How we plan to build the prototype in [the build brief](build-brief.md) during the hackathon. Draft; update as we build.

## Why this stack

- **Chat SDK** ([`chat`](https://chat-sdk.dev/docs)) gives one bot codebase with platform adapters. The official [`@chat-adapter/whatsapp`](https://chat-sdk.dev/adapters/official/whatsapp) adapter uses the WhatsApp Business Cloud API (webhooks, interactive buttons, templates). [`@chat-adapter/twilio`](https://www.npmjs.com/package/@chat-adapter/twilio) adds plain SMS, which covers pastors who don't use WhatsApp, with the same handlers.
- **AI SDK** ([`ai`](https://ai-sdk.dev)) handles the language work: replying in the pastor's language, pulling church name, pastor, city and counts out of free text ("Oi! Somos da Igreja Fonte de Vida, Recife"), and reading number words ("nove").
- **Fits Baptize's stack.** Baptize runs Next.js/TypeScript on Vercel with Supabase Postgres, so this drops in as a Next.js route plus a few tables. That helps the Technical viability score.

## Architecture

```
WhatsApp / SMS
      │  webhook
      ▼
Next.js route (Vercel) ── Chat SDK bot (adapters: whatsapp, twilio)
      │
      ├─ Conversation state machine  (consent → language → register → confirm → report)
      ├─ AI SDK: extract fields + detect language → structured object (zod schema)
      ├─ Deterministic validators   (dupes, 0–10,000, unknown numbers, STOP)
      └─ baptize.ts mock            (registerChurch, saveCount), swappable for a real API later
      │
      ▼
Postgres / Supabase (or in-memory for the demo) ──► Live dashboard page
```

## Key rules

- **The AI extracts, code decides.** The model proposes structured fields, and plain TypeScript validates them: whole number 0–10,000, duplicate within a time window, count implausible for the church size, unknown number. Nothing is saved without a confirm-back to the pastor.
- **Consent before anything.** The opt-in is recorded before any outbound message, and STOP works at any step.
- **Uncertainty goes to a person.** Low-confidence translations or extractions (for example Quechua) are flagged on the dashboard instead of being guessed. This is our quality control for AI and translation mistakes.
- **One function per Baptize action**, behind a mock, as the hackathon asks.

## Packages

| Package | Use |
|---|---|
| `chat` | Bot core, threads, handlers |
| `@chat-adapter/whatsapp` | WhatsApp Business Cloud API |
| `@chat-adapter/twilio` | SMS fallback |
| `@chat-adapter/state-memory` → Postgres/Redis state adapter | Conversation state (memory for the demo) |
| `ai` + a model provider | Language detection, extraction, replies |
| `zod` | Schemas for extracted fields |
| Next.js | Webhook routes and dashboard |

Scaffold: `npx create-chat-sdk@latest bot --adapter whatsapp memory`

## Demo risks to check early

- **WhatsApp test numbers** only message phone numbers registered on the Meta app, so judges' phones have to be added in advance or we demo from our own phones. Twilio trial accounts have the same limit with verified numbers.
- Webhooks need a public URL: deploy to Vercel early, or use a tunnel locally.
- Keep a backup video in case the network fails.
