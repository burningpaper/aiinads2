# e2e-simulator Agent

Simulate a complete show flow across all three interfaces using Playwright.

## When to Use
- After major feature completion
- Before any live event
- When testing real-time synchronization between interfaces

## The Full Show Flow

### Phase 1: Setup
1. Admin opens show (`status: setup → live`)
2. Verify: Audience sees "show starting" state
3. Verify: Presentation shows welcome screen

### Phase 2: Segment Activation (repeat for each segment)
1. Admin activates segment N
2. Verify: Audience sees segment N content
3. Verify: Presentation shows segment N content
4. Verify: Previous segment marked complete

### Phase 3: Voting
1. Admin opens decision for segment
2. Verify: Audience sees voting UI
3. Verify: Presentation shows vote tally at 0/0
4. Simulate: 3 audience votes for Option A, 2 for Option B
5. Verify: Presentation updates in real-time (< 500ms)
6. Admin closes decision
7. Verify: Audience sees "Option A wins" result
8. Verify: Presentation shows final result with winner highlighted

### Phase 4: Comments
1. Audience submits comment
2. Verify: Admin sees comment in live feed
3. Verify: Comment does NOT appear on audience or presentation

### Phase 5: Show Close
1. Admin closes show
2. Verify: Audience interface becomes mini-site (browsable archive)
3. Verify: Presentation shows "Thank you" screen

## Playwright Test Structure

```typescript
// e2e/full-show-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Full Show Flow', () => {
  test.beforeAll(async () => {
    // Seed database with test show
  })

  test('complete show from setup to close', async ({ browser }) => {
    // Open 3 browser contexts
    const adminContext = await browser.newContext()
    const audienceContext = await browser.newContext()
    const presentationContext = await browser.newContext()

    const adminPage = await adminContext.newPage()
    const audiencePage = await audienceContext.newPage()
    const presentationPage = await presentationContext.newPage()

    // Navigate all three
    await adminPage.goto('/admin')
    await audiencePage.goto('/')
    await presentationPage.goto('/presentation')

    // ... run flow phases
  })
})
```

## Commands
```bash
# Run full E2E suite
cd client && npm run test:e2e

# Run with UI (debugging)
cd client && npm run test:e2e -- --ui

# Run specific test
cd client && npx playwright test full-show-flow

# Run headed (see browsers)
cd client && npx playwright test --headed
```

## Critical Assertions

| Action | Latency Requirement |
|--------|---------------------|
| Segment activation | < 500ms all interfaces |
| Vote count update | < 500ms presentation |
| Decision close | < 500ms result display |
| Comment submission | < 1s admin feed |

## Report Format
```
## E2E Simulation Results

🎭 Show Flow: [PASS/FAIL]

### Phase Results
- Setup: ✅
- Segment 1: ✅
- Voting: ❌ Vote count latency 780ms (expected < 500ms)
- Comments: ✅
- Close: ✅

### Failures
[Details with screenshots if available]

### Performance
- Average sync latency: 320ms
- Max sync latency: 780ms
- Socket reconnects: 0
```
