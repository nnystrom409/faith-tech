# Global Baptism Event bot

Churches register and report baptisms by chat. Built for FaithTech SoCal Track 1 (mobile church onboarding). Test data only.

- **Chat:** Telegram bot (anyone can message it). The conversation logic in `lib/bot.ts` is channel-agnostic, so WhatsApp or SMS is a new adapter next to `lib/telegram.ts`.
- **Flow:** opt-in → church name → city → leader → confirm → report baptism count → confirm → saved. STOP works at any step, START comes back.
- **Validation (code decides, not AI):** whole numbers 0–10,000 only, rejects text/negatives/decimals, ignores a repeated identical report, asks before replacing a previous one, flags possible duplicate churches for review instead of merging.
- **Dashboard:** `/` updates every 2 seconds. `/chat` is a browser chat backup with the same logic.
- **Baptize API:** mocked in `lib/baptize.ts` (`registerChurch`, `saveCount`).

## Run on Vercel

1. In Telegram, message @BotFather → `/newbot` → copy the token.
2. Import this repo on Vercel and set `TELEGRAM_BOT_TOKEN`.
3. Recommended: add Upstash Redis from the Vercel Marketplace (Storage tab) so data is shared across instances. Without it, data lives in memory.
4. Open `https://<your-app>.vercel.app/api/telegram/setup` once. It points the bot at the deployment and returns the bot's t.me link.

## Run locally

```
npm install
npm run dev   # open http://localhost:3000/chat to talk to the bot without Telegram
```

## License

MIT
