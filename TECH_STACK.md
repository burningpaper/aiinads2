# AI in Advertising - Tech Stack Reference

Quick reference for all services, URLs, and configuration.

---

## Services Overview

| Service | Purpose | Dashboard |
|---------|---------|-----------|
| **Neon** | PostgreSQL database | [console.neon.tech](https://console.neon.tech) |
| **Clerk** | Authentication (admin) | [dashboard.clerk.com](https://dashboard.clerk.com) |
| **Cloudflare R2** | File storage (images, PDFs) | [dash.cloudflare.com](https://dash.cloudflare.com) |
| **OpenAI** | AI comment summarization | [platform.openai.com](https://platform.openai.com) |
| **Vercel** | Client hosting | [vercel.com/dashboard](https://vercel.com/dashboard) |
| **Railway** | Server hosting (Socket.io) | [railway.app/dashboard](https://railway.app/dashboard) |
| **GitHub** | Source code | [github.com/burningpaper/aiinads2](https://github.com/burningpaper/aiinads2) |

---

## Live URLs

| Environment | URL |
|-------------|-----|
| **Client (Vercel)** | https://aiinads2-client.vercel.app |
| **Server (Railway)** | _[Add Railway URL here]_ |
| **Local Client** | http://localhost:5173 |
| **Local Server** | http://localhost:3000 |

---

## Environment Variables

### Server (Railway)

```bash
DATABASE_URL=postgresql://[user]:[password]@[host].neon.tech/[database]?sslmode=require
CLERK_SECRET_KEY=sk_test_[your-clerk-secret-key]
OPENAI_API_KEY=sk-proj-[your-openai-api-key]
CLIENT_URL=https://aiinads2-client.vercel.app
# PORT is auto-set by Railway
```

### Client (Vercel)

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_[your-clerk-publishable-key]
VITE_DEFAULT_SHOW_ID=00000000-0000-0000-0000-000000000001
VITE_API_URL=https://[RAILWAY_URL]/api
VITE_SOCKET_URL=https://[RAILWAY_URL]
```

### Optional: Cloudflare R2 (for file uploads)

```bash
R2_ACCESS_KEY_ID=[your-r2-access-key]
R2_SECRET_ACCESS_KEY=[your-r2-secret-key]
R2_BUCKET_NAME=[your-bucket-name]
R2_ACCOUNT_ID=[your-cloudflare-account-id]
```

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                    (Vercel - Static)                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   /admin        │   / (root)      │   /presentation         │
│   Admin Panel   │   Audience View │   Big Screen Display    │
│   (Clerk Auth)  │   (Anonymous)   │   (Read-only)           │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
              ┌────────────▼────────────┐
              │     REST API + WS       │
              │   (Railway - Node.js)   │
              │   Express + Socket.io   │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │  Neon   │      │  Clerk    │     │  OpenAI   │
    │ Postgres│      │   Auth    │     │  GPT-4o   │
    └─────────┘      └───────────┘     └───────────┘
```

---

## Tech Stack Details

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Query** - Server state
- **Socket.io Client** - Real-time updates

### Backend
- **Node.js** - Runtime
- **Express** - HTTP server
- **TypeScript** - Type safety
- **Socket.io** - WebSocket server
- **@neondatabase/serverless** - Database client

### Database
- **Neon** - Serverless PostgreSQL
- Tables: `shows`, `segments`, `segment_content`, `decisions`, `votes`, `comments`, `ai_summaries`

### Auth
- **Clerk** - Admin authentication only
- Audience uses anonymous localStorage UUIDs

---

## Development Commands

```bash
# Client
cd client
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npm run test         # Run Vitest tests
npm run lint         # ESLint

# Server
cd server
npm run dev          # Start with hot reload (port 3000)
npm run build        # Compile TypeScript
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
```

---

## Key IDs

| Entity | UUID |
|--------|------|
| Default Show | `00000000-0000-0000-0000-000000000001` |
| Segment 1 (The Brief) | `00000000-0000-0000-0000-000000000011` |
| Segment 2 (Research) | `00000000-0000-0000-0000-000000000012` |
| Segment 3 (Creative) | `00000000-0000-0000-0000-000000000013` |
| Segment 4 (Production) | `00000000-0000-0000-0000-000000000014` |
| Segment 5 (Launch) | `00000000-0000-0000-0000-000000000015` |

---

## Troubleshooting

### Server won't start
- Check `DATABASE_URL` is set and Neon is accessible
- Check Railway logs: Deployments → View Logs

### Socket.io not connecting
- Verify `VITE_SOCKET_URL` matches Railway URL (no `/api` suffix)
- Check CORS: `CLIENT_URL` on server must match Vercel URL

### Auth not working
- Verify Clerk keys match between client and server
- Check Clerk dashboard for API key status

### Database empty
- Run `npm run db:migrate` then `npm run db:seed` locally
- Migrations run automatically on server start

---

## Useful Links

- [Neon Docs](https://neon.tech/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
