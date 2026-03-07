# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

Real-time conference participation platform for a live 5-segment show. Three interfaces: Admin (controls show flow), Audience (mobile voting/comments), Presentation (big screen display). After the show, audience view becomes a browsable mini-site.

**Critical context:** This runs live in front of an audience. Stability over cleverness. Real-time latency must be <500ms.

## Development Commands

```bash
# Client (Vite + React)
cd client && npm install
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check

# Server (Express + TypeScript)
cd server && npm install
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled JS

# Database (Neon)
npm run db:migrate   # Run pending migrations
npm run db:seed      # Seed test data
npm run db:reset     # Drop and recreate (dev only)

# Testing
cd client && npm run test              # Vitest watch mode
cd client && npm run test -- --run     # Vitest single run
cd client && npm run test:e2e          # Playwright E2E
cd client && npx playwright test --ui  # Playwright with UI
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query
- **Backend:** Node.js, Express, TypeScript, Socket.io
- **Database:** Neon (PostgreSQL)
- **Auth:** Clerk (admin only)
- **Storage:** Cloudflare R2 (images, PDFs)
- **AI:** OpenAI GPT-4o for comment summarisation
- **Testing:** Vitest (unit/integration), Playwright (E2E)

## Design System

See `.claude/DESIGN_SYSTEM.md` for complete UI patterns. Key points:

- **Typography:** Playfair Display (headings), Inter (body)
- **Colors:** Dark teal gradient (`#0a1a1a` → `#206060`), white cards, subtle shadows
- **Style:** Premium fintech aesthetic inspired by Letter - rounded cards, pill buttons, generous whitespace
- **Audience:** Mobile-first (375px), large touch targets, sticky header, bottom-anchored input
- **Presentation:** Dark backgrounds, massive typography (readable from 10m), animated vote bars

## Agents

Use the Task tool to spawn these agents after code changes:

### test-runner
**When:** After any code changes
**What:** Runs relevant Vitest tests, reports failures with fix suggestions
**Instructions:** `.claude/agents/test-runner.md`

### e2e-simulator
**When:** After major features, before live events
**What:** Simulates full show flow across all 3 interfaces with Playwright
**Instructions:** `.claude/agents/e2e-simulator.md`

## Architecture

### Three Interfaces
| Interface | Path | Auth | Purpose |
|-----------|------|------|---------|
| Admin | `/admin` | Clerk | Control show, manage content, view comments |
| Audience | `/` | Anonymous (localStorage UUID) | Vote, comment, view content (375px mobile-first) |
| Presentation | `/presentation` | None | Big screen display (1920x1080, read-only, self-healing) |

### Real-time Pattern (Socket.io)
All interfaces connect to Socket.io server. Pattern: REST fetch for initial load, then socket events to patch state.

```typescript
// Client joins room based on interface
socket.emit('join', { room: 'show:${showId}' })

// Server broadcasts state changes
io.to(`show:${showId}`).emit('segment:activated', segment)
io.to(`show:${showId}`).emit('decision:opened', decision)
io.to(`show:${showId}`).emit('vote:counted', { decisionId, counts })
```

Key events: `show:updated`, `segment:activated`, `content:changed`, `decision:opened`, `decision:closed`, `vote:counted`, `comment:received`

### State Flow
```
Show: setup → live → closed
Segment: draft → live → complete (one segment live at a time)
Decision: pending → open → closed (one per segment, cannot reopen)
```

## Data Model

**Core tables:** `shows`, `segments`, `segment_content`, `decisions`, `votes`, `comments`, `ai_summaries`

Key relationships:
- `segments.show_id` → `shows.id` (5 segments per show)
- `segment_content.segment_id` → `segments.id` (ordered by `display_order`)
- `decisions.segment_id` → `segments.id` (one decision per segment)
- `votes` unique on `(decision_id, audience_session_id)` — one vote per person

Content types: `text`, `image`, `youtube`, `pdf`

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...@neon.tech/dbname

# Auth (Clerk)
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Storage (Cloudflare R2)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ACCOUNT_ID=

# AI
OPENAI_API_KEY=sk-...
```

## Key Implementation Notes

- **Audience votes:** Store `voted_{decision_id}` in localStorage to prevent re-vote UI
- **Anonymous sessions:** Client-generated UUID in localStorage (`audience_session_id`)
- **Presentation resilience:** Auto-reconnect Socket.io with exponential backoff, re-fetch full state on reconnect
- **Socket.io rooms:** Each show has a room `show:${showId}`, clients join on connect
- **AI summarisation:** Background process every 60s while live, summarises unprocessed comments
- **No PDFs on presentation screen** (not legible at distance)
- **Clerk middleware:** Protect `/admin` routes, use `getAuth()` for user context
- **Latency requirement:** All real-time updates must propagate in <500ms

## Build Order

1. Database schema + migrations + seed data
2. Express server + Socket.io setup
3. Clerk auth integration
4. Admin interface (segment list, content manager)
5. Audience interface (content display, mobile layout)
6. Presentation interface (large screen, auto-recovery)
7. Voting system (decision config, vote UI, live tally via sockets)
8. Comments (submission, live feed, AI summary)
9. R2 file uploads (images, PDFs)
10. Mini-site (show-closed archive view)
