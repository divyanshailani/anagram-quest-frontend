# Anagram Quest Frontend

Premium frontend for **Anagram Quest** built with Next.js App Router.

This app ships two core experiences:

1. **Watch AI Play** — real-time AI solving stream with terminal-style telemetry
2. **Player vs AI** — competitive mode with timer, banking mechanics, and anti-cheat masking

## Live Demo

- Main app: [anagram-quest-frontend.vercel.app](https://anagram-quest-frontend.vercel.app)
- PvAI mode: [anagram-quest-frontend.vercel.app/vs](https://anagram-quest-frontend.vercel.app/vs)

## Project Family

- Master repo (architecture + full journey): [divyanshailani/anagram-quest](https://github.com/divyanshailani/anagram-quest)
- Backend: [divyanshailani/anagram-quest-server](https://github.com/divyanshailani/anagram-quest-server)
- OpenEnv foundation: [divyanshailani/anagram-quest-openenv](https://github.com/divyanshailani/anagram-quest-openenv)

## Features

- Real-time SSE integration for AI events
- Premium dark UI with game-oriented motion and visual hierarchy
- Player-vs-AI split arena with level race flow
- Sound FX integration with event-driven hook architecture
- Auto-advance logic and end-of-level overlays
- Banking panel (boost/recover actions, activity feed)
- Reconnect and resilience handling for unstable networks
- Rematch reliability with explicit `starting` lifecycle state

## Tech Stack

- Next.js (App Router)
- React hooks + client-side state orchestration
- Native fetch + EventSource (SSE)
- Howler.js (sound)
- CSS (custom theme variables + component-level styles)

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Environment Variables

Create `.env.production` (or `.env.local`) with:

```bash
NEXT_PUBLIC_GAME_SERVER=https://anagram-quest.mooo.com
```

## Build and Quality

```bash
npm run lint
npm run build
```

## Directory Highlights

```text
app/
  components/      # UI components (arena, bank panel, game board)
  hooks/           # useMatchEngine, useGameStream, useSoundFX
  vs/              # Player vs AI route
  page.js          # Landing page
```

## Notes

Frontend is optimized for the currently deployed backend model where match state is managed server-side and AI updates are streamed over SSE.
