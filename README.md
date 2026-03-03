# Alpha Learning — Raleigh's Daily 30

A polished Next.js web app for a 5th-grade daily 30-minute mastery learning routine.

## Features shipped
- Dashboard with streak, weekly completion bar, subject mastery rings, and total minutes.
- 30-minute learning session interface with:
  - visible countdown timer
  - subject selector
  - AI tutor chat (stubbed `/api/tutor` endpoint)
  - concept mastery progress bar
  - session completion logging
- Progress tracking:
  - 90-day completion heatmap
  - per-subject mastery/time/concept progress cards
- Parent view:
  - level + weekly goal snapshot
  - badges
  - recent sessions
  - JSON export
- Local storage persistence (`alpha-learning-state-v1`)
- Preloaded 5th-grade curriculum by subject

## Tech
- Next.js 14 (App Router)
- React 18
- Chart.js + react-chartjs-2
- localStorage MVP persistence

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel
1. Push repo to GitHub (`wesbenterprise/alpha-learning`)
2. Import project in Vercel
3. Build command: `npm run build`
4. Output handled by Next.js defaults

## API wiring later
Current `/api/tutor` is deterministic and local for standalone use.
To wire real AI:
- replace response logic in `app/api/tutor/route.js`
- pass conversation, subject, current concept context to your LLM
- return explanation + scored concept set

## Data model (localStorage)
- `sessionLogs`: date, duration, subject, concepts covered, mastery score
- `subjects`: mastery %, minutes spent, concept/unit pointers
- streak, weekly completion, badges, total minutes
