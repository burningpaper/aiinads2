# Developer Logs

## 2026-03-08: Feature Additions for Live Event

### Summary
Added 9 new features to prepare for the live 200-user event in 2 weeks.

### Features Added

1. **Comment Moderation**
   - Hide/show toggle in admin CommentsPanel
   - Hidden comments don't display on presentation
   - Added `hidden` column to comments table via migration 002

2. **Show Reset (Rehearsals)**
   - `POST /api/shows/:id/reset` endpoint
   - Clears votes, comments, AI summaries
   - Resets all segments/decisions to initial state
   - Admin dashboard button with confirmation modal

3. **QR Code on Welcome Screen**
   - Auto-generated QR code on presentation welcome screen
   - Uses external QR API (no npm dependency)
   - Shows URL for audience to scan and join

4. **Data Export (CSV)**
   - `GET /api/shows/:id/export?type=votes|comments`
   - Downloads directly from admin dashboard
   - Includes segment context and timestamps

5. **Voting Countdown Timer**
   - Optional timer when opening voting (30s, 60s, 2min)
   - Added `countdown_seconds` column to decisions
   - Timer displays on audience and presentation screens
   - Voting buttons disabled when timer expires

6. **Optimistic Vote UI**
   - Vote shows "submitted" immediately on tap
   - Reverts if API call fails
   - Reduces perceived latency from ~1.4s to instant

7. **Health Check Endpoint**
   - `GET /api/health` returns database status, socket count
   - Returns 503 if database is down

8. **Error Boundaries**
   - React error boundaries wrap each interface
   - Presentation has "Recovering..." fallback
   - Prevents entire app crash from component errors

9. **Reconnection Toast**
   - Shows "Reconnecting..." when socket disconnects
   - Shows "Reconnected" briefly when restored

### Technical Notes

- Migration file: `db/migrations/002_add_features.sql`
- New components: `ErrorBoundary.tsx`, `ConnectionToast.tsx`
- Updated types: Comment (hidden), Decision (countdownSeconds)
- All TypeScript checks pass
- All existing tests pass

### Files Changed

**Server:**
- `services/commentsService.ts` - setHidden, getVisibleBySegment
- `services/showsService.ts` - resetForRehearsal, exportVotes, exportComments
- `services/decisionsService.ts` - countdownSeconds on open
- `routes/comments.ts` - visibility endpoint
- `routes/shows.ts` - reset and export endpoints
- `routes/decisions.ts` - countdownSeconds parameter
- `index.ts` - enhanced health check

**Client:**
- `components/ErrorBoundary.tsx` - new
- `components/ConnectionToast.tsx` - new
- `interfaces/admin/components/CommentsPanel.tsx` - hide/show buttons
- `interfaces/admin/components/DashboardHome.tsx` - reset and export buttons
- `interfaces/admin/components/DecisionManager.tsx` - countdown options
- `interfaces/audience/components/VotingPanel.tsx` - countdown, optimistic voting
- `interfaces/presentation/components/WelcomeScreen.tsx` - QR code
- `interfaces/presentation/components/PresentationVoting.tsx` - countdown
- `App.tsx` - error boundaries, connection toast
- `types/index.ts` - updated interfaces

### Load Test Results
Successfully handled 200 concurrent users:
- Socket connections: 200/200 (100%)
- Votes: 200/200 (100%)
- Comments: 423/423 (100%)
- Vote latency p95: 2.3s (acceptable for live event)
