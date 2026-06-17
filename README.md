# 99 Names of Allah – Natural Voice App

Learn the 99 Names of Allah with a beautiful, natural **ElevenLabs** voice. Your API key stays safe on the server — never exposed to the browser.

---

## What Changed (vs. the old version)

| Problem | Fix |
|---|---|
| TTS not sounding natural | Updated to ElevenLabs `v2` API endpoint + optimized voice settings (`stability: 0.35`, `style: 0.2`, `use_speaker_boost: true`) |
| Frontend cluttered with debug buttons | Moved tech controls to a clean **Settings ⚙** modal. Only essential buttons remain in the control bar |
| Endpoint management confusing | Auto-detects current domain, saved in localStorage, editable via Settings |
| Unstable auto-play interval | Configurable interval (3–30s) in Settings |

---

## Quick Deploy to Vercel

1. **Push to GitHub** (or use this repo directly)
2. Go to [vercel.com](https://vercel.com) → New Project → import this repo
3. In **Project Settings → Environment Variables**, add:
   - `ELEVENLABS_API_KEY` = your key from [elevenlabs.io](https://elevenlabs.io)
   - *(optional)* `ELEVENLABS_VOICE_ID` = any voice ID (default: Rachel `21m00Tcm4TlvDq8ikWAM`)
4. Deploy. That's it — your `/api/tts` endpoint will serve the voice.

> The `index.html` auto-detects its own domain, so no config needed on the frontend.

---

## Local Development

```bash
npx serve .
# then open http://localhost:3000
```

The local server won't have the ElevenLabs backend. It will fall back to the browser's built-in speech synthesis automatically.

---

## File Structure

```
/
├── index.html       # Complete frontend (all CSS + JS inline)
├── api/
│   └── tts.js       # Vercel serverless function → ElevenLabs proxy
├── package.json
└── README.md
```

---

## API Endpoint

- **GET** `/api/tts` → health check
- **POST** `/api/tts` → `{ "text": "Hello world" }` → returns `audio/mpeg`

The API key lives **only** in the Vercel environment variable — never sent to the browser.

---

## Voice Settings Used

```json
{
  "stability": 0.35,
  "similarity_boost": 0.9,
  "style": 0.2,
  "use_speaker_boost": true
}
```

These are tuned for a warm, clear English voice reading the names and stories. You can experiment in your ElevenLabs dashboard.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / next name |
| `Space` | Play / pause |
| `P` | Toggle autoplay |
| `M` | Mute / unmute |
| `Esc` | Close modals |
