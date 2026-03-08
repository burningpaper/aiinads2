/**
 * Load Test Script - Simulates 200 concurrent users
 *
 * Tests:
 * - Socket.io connections (200 concurrent)
 * - Voting (each user votes once)
 * - Commenting (each user submits 1-3 comments)
 * - Measures latency, errors, and throughput
 *
 * Usage: npx tsx scripts/load-test.ts
 */

import { io, Socket } from 'socket.io-client'
import { v4 as uuid } from 'uuid'

// Configuration
const CONFIG = {
  serverUrl: 'https://aiinads-server-production.up.railway.app',
  showId: '00000000-0000-0000-0000-000000000001',
  segmentId: '00000000-0000-0000-0000-000000000012',
  decisionId: '00000000-0000-0000-0000-000000000022',
  totalUsers: 200,
  rampUpTimeMs: 10000, // Spread connections over 10 seconds
  commentsPerUser: { min: 1, max: 3 },
  commentDelayMs: { min: 500, max: 2000 }, // Random delay between comments
}

// Metrics
const metrics = {
  connections: { success: 0, failed: 0, latencies: [] as number[] },
  votes: { success: 0, failed: 0, duplicate: 0, latencies: [] as number[] },
  comments: { success: 0, failed: 0, latencies: [] as number[] },
  socketEvents: { received: 0 },
  errors: [] as string[],
}

// Sample comments for testing
const sampleComments = [
  "Great point about the target market!",
  "I think Gen Z would be more receptive",
  "Millennials have more purchasing power",
  "What about targeting both demographics?",
  "The data supports a Gen Z focus",
  "Interesting perspective on this",
  "I disagree with the current direction",
  "This is exactly what we need",
  "Can we see more data on this?",
  "Love the creative approach here",
  "Not sure this will resonate with our audience",
  "The messaging needs to be sharper",
  "This feels very on-brand",
  "Consider the cultural implications",
  "Strong value proposition!",
]

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
  const start = Date.now()
  const result = await fn()
  return { result, latency: Date.now() - start }
}

interface SimulatedUser {
  id: string
  sessionId: string
  socket: Socket | null
}

async function connectUser(user: SimulatedUser): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const socket = io(CONFIG.serverUrl, {
      transports: ['websocket'],
      timeout: 10000,
    })

    const timeout = setTimeout(() => {
      socket.disconnect()
      metrics.connections.failed++
      metrics.errors.push(`User ${user.id}: Connection timeout`)
      reject(new Error('Connection timeout'))
    }, 15000)

    socket.on('connect', () => {
      clearTimeout(timeout)
      metrics.connections.success++
      metrics.connections.latencies.push(Date.now() - start)
      user.socket = socket

      // Join show room
      socket.emit('join', { room: `show:${CONFIG.showId}` })

      // Listen for events
      socket.on('vote:counted', () => metrics.socketEvents.received++)
      socket.on('comment:received', () => metrics.socketEvents.received++)
      socket.on('content:changed', () => metrics.socketEvents.received++)
      socket.on('segment:activated', () => metrics.socketEvents.received++)
      socket.on('decision:opened', () => metrics.socketEvents.received++)
      socket.on('decision:closed', () => metrics.socketEvents.received++)

      resolve()
    })

    socket.on('connect_error', (err) => {
      clearTimeout(timeout)
      metrics.connections.failed++
      metrics.errors.push(`User ${user.id}: ${err.message}`)
      reject(err)
    })
  })
}

async function vote(user: SimulatedUser): Promise<void> {
  const choice = Math.random() > 0.5 ? 'a' : 'b'

  try {
    const { latency } = await measureLatency(async () => {
      const response = await fetch(`${CONFIG.serverUrl}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId: CONFIG.decisionId,
          choice,
          audienceSessionId: user.sessionId,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        if (response.status === 409 || error.message?.includes('already voted')) {
          metrics.votes.duplicate++
          return
        }
        throw new Error(`HTTP ${response.status}: ${error.message || 'Vote failed'}`)
      }
      return response.json()
    })

    metrics.votes.success++
    metrics.votes.latencies.push(latency)
  } catch (err) {
    metrics.votes.failed++
    metrics.errors.push(`User ${user.id} vote: ${(err as Error).message}`)
  }
}

async function comment(user: SimulatedUser): Promise<void> {
  const text = randomChoice(sampleComments) + ` (User ${user.id.slice(0, 8)})`

  try {
    const { latency } = await measureLatency(async () => {
      const response = await fetch(`${CONFIG.serverUrl}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId: CONFIG.showId,
          segmentId: CONFIG.segmentId,
          audienceSessionId: user.sessionId,
          content: text,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`HTTP ${response.status}: ${error.message || 'Comment failed'}`)
      }
      return response.json()
    })

    metrics.comments.success++
    metrics.comments.latencies.push(latency)
  } catch (err) {
    metrics.comments.failed++
    metrics.errors.push(`User ${user.id} comment: ${(err as Error).message}`)
  }
}

async function simulateUser(user: SimulatedUser): Promise<void> {
  // Connect
  try {
    await connectUser(user)
  } catch {
    return // Can't continue without connection
  }

  // Small delay to let connection stabilize
  await sleep(randomInt(100, 500))

  // Vote
  await vote(user)

  // Submit comments (1-3 per user)
  const numComments = randomInt(CONFIG.commentsPerUser.min, CONFIG.commentsPerUser.max)
  for (let i = 0; i < numComments; i++) {
    await sleep(randomInt(CONFIG.commentDelayMs.min, CONFIG.commentDelayMs.max))
    await comment(user)
  }
}

function calculateStats(latencies: number[]): { avg: number; p50: number; p95: number; p99: number; min: number; max: number } {
  if (latencies.length === 0) {
    return { avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 }
  }

  const sorted = [...latencies].sort((a, b) => a - b)
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  const p99 = sorted[Math.floor(sorted.length * 0.99)]

  return {
    avg: Math.round(avg),
    p50,
    p95,
    p99,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

function printReport(): void {
  console.log('\n' + '='.repeat(60))
  console.log('LOAD TEST RESULTS')
  console.log('='.repeat(60))

  console.log('\n📊 CONFIGURATION')
  console.log(`   Total Users: ${CONFIG.totalUsers}`)
  console.log(`   Ramp-up Time: ${CONFIG.rampUpTimeMs}ms`)
  console.log(`   Server: ${CONFIG.serverUrl}`)

  console.log('\n🔌 SOCKET CONNECTIONS')
  console.log(`   Success: ${metrics.connections.success}`)
  console.log(`   Failed: ${metrics.connections.failed}`)
  const connStats = calculateStats(metrics.connections.latencies)
  console.log(`   Latency (avg/p50/p95/p99): ${connStats.avg}ms / ${connStats.p50}ms / ${connStats.p95}ms / ${connStats.p99}ms`)

  console.log('\n🗳️  VOTES')
  console.log(`   Success: ${metrics.votes.success}`)
  console.log(`   Failed: ${metrics.votes.failed}`)
  console.log(`   Duplicate (expected): ${metrics.votes.duplicate}`)
  const voteStats = calculateStats(metrics.votes.latencies)
  console.log(`   Latency (avg/p50/p95/p99): ${voteStats.avg}ms / ${voteStats.p50}ms / ${voteStats.p95}ms / ${voteStats.p99}ms`)

  console.log('\n💬 COMMENTS')
  console.log(`   Success: ${metrics.comments.success}`)
  console.log(`   Failed: ${metrics.comments.failed}`)
  console.log(`   Total attempted: ${metrics.comments.success + metrics.comments.failed}`)
  const commentStats = calculateStats(metrics.comments.latencies)
  console.log(`   Latency (avg/p50/p95/p99): ${commentStats.avg}ms / ${commentStats.p50}ms / ${commentStats.p95}ms / ${commentStats.p99}ms`)

  console.log('\n📡 SOCKET EVENTS RECEIVED')
  console.log(`   Total events across all clients: ${metrics.socketEvents.received}`)

  if (metrics.errors.length > 0) {
    console.log('\n❌ ERRORS (first 20)')
    metrics.errors.slice(0, 20).forEach(err => console.log(`   - ${err}`))
    if (metrics.errors.length > 20) {
      console.log(`   ... and ${metrics.errors.length - 20} more`)
    }
  }

  console.log('\n' + '='.repeat(60))

  // Summary verdict
  const totalOps = metrics.votes.success + metrics.comments.success
  const totalFailed = metrics.votes.failed + metrics.comments.failed + metrics.connections.failed
  const successRate = totalOps > 0 ? ((totalOps / (totalOps + totalFailed)) * 100).toFixed(1) : '0'

  if (totalFailed === 0) {
    console.log('✅ ALL TESTS PASSED - System handled load successfully')
  } else if (parseFloat(successRate) > 95) {
    console.log(`⚠️  MINOR ISSUES - ${successRate}% success rate, some operations failed`)
  } else {
    console.log(`❌ SIGNIFICANT ISSUES - ${successRate}% success rate, investigate errors above`)
  }

  // Performance warnings
  if (voteStats.p95 > 1000) {
    console.log('⚠️  Vote latency p95 > 1000ms - may feel slow to users')
  }
  if (commentStats.p95 > 1000) {
    console.log('⚠️  Comment latency p95 > 1000ms - may feel slow to users')
  }
  if (connStats.p95 > 3000) {
    console.log('⚠️  Connection latency p95 > 3000ms - users may experience delays')
  }

  console.log('='.repeat(60) + '\n')
}

async function runLoadTest(): Promise<void> {
  console.log('🚀 Starting load test...')
  console.log(`   Simulating ${CONFIG.totalUsers} concurrent users`)
  console.log(`   Target: ${CONFIG.serverUrl}`)
  console.log(`   Segment: ${CONFIG.segmentId}`)
  console.log(`   Decision: ${CONFIG.decisionId}`)
  console.log('')

  // Create users
  const users: SimulatedUser[] = Array.from({ length: CONFIG.totalUsers }, (_, i) => ({
    id: uuid(),
    sessionId: uuid(),
    socket: null,
  }))

  // Ramp up users gradually
  const delayBetweenUsers = CONFIG.rampUpTimeMs / CONFIG.totalUsers
  const promises: Promise<void>[] = []

  console.log('📈 Ramping up users...')
  for (let i = 0; i < users.length; i++) {
    promises.push(simulateUser(users[i]))

    // Progress indicator
    if ((i + 1) % 20 === 0) {
      console.log(`   ${i + 1}/${CONFIG.totalUsers} users started`)
    }

    await sleep(delayBetweenUsers)
  }

  console.log('⏳ Waiting for all operations to complete...')
  await Promise.allSettled(promises)

  // Give socket events a moment to arrive
  await sleep(2000)

  // Disconnect all sockets
  console.log('🔌 Disconnecting sockets...')
  users.forEach(user => {
    if (user.socket) {
      user.socket.disconnect()
    }
  })

  // Print results
  printReport()
}

// Run the test
runLoadTest().catch(console.error)
