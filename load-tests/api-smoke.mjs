// Node.js API load test — no external dependencies, uses native fetch (Node 18+)
// Usage: node load-tests/api-smoke.mjs <your-supabase-anon-key>

const BASE_URL = process.env.SUPABASE_URL || 'https://menmpyyrqevonepbpfai.supabase.co/rest/v1'
const ANON_KEY = process.argv[2] || process.env.SUPABASE_ANON_KEY

if (!ANON_KEY) {
  console.error('Usage: node load-tests/api-smoke.mjs <anon-key>')
  console.error('  or set SUPABASE_ANON_KEY env var')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
}

const ENDPOINTS = [
  { name: 'events', url: `${BASE_URL}/events?select=id,name,status&limit=10` },
  { name: 'profiles', url: `${BASE_URL}/profiles?select=id,display_name,role&limit=10` },
  { name: 'vendors', url: `${BASE_URL}/organizations?select=id,name&limit=10` },
]

const CONCURRENCY = 10 // virtual users
const REQUESTS_PER_USER = 20
const totalRequests = CONCURRENCY * REQUESTS_PER_USER

async function makeRequest(endpoint) {
  const start = performance.now()
  try {
    const res = await fetch(endpoint.url, { headers })
    const duration = performance.now() - start
    return { ok: res.ok, status: res.status, duration, name: endpoint.name }
  } catch (err) {
    return { ok: false, status: 0, duration: performance.now() - start, name: endpoint.name, error: err.message }
  }
}

async function simulateUser(userId) {
  const results = []
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const endpoint = ENDPOINTS[i % ENDPOINTS.length]
    const result = await makeRequest(endpoint)
    results.push(result)
    // Random think time between 500ms-2s
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1500))
  }
  return results
}

async function run() {
  console.log(`\n🔧 Load test: ${CONCURRENCY} concurrent users × ${REQUESTS_PER_USER} requests each = ${totalRequests} total`)
  console.log(`   Target: ${BASE_URL}\n`)

  const startTime = Date.now()

  // Launch all virtual users concurrently
  const allResults = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => simulateUser(i + 1))
  )

  const flat = allResults.flat()
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  // Stats
  const ok = flat.filter(r => r.ok)
  const failed = flat.filter(r => !r.ok)
  const durations = flat.map(r => r.duration).sort((a, b) => a - b)
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  const p95 = durations[Math.floor(durations.length * 0.95)]
  const p99 = durations[Math.floor(durations.length * 0.99)]

  console.log(`✅ Completed in ${duration}s\n`)
  console.log(`📊 Results:`)
  console.log(`   Total requests:  ${flat.length}`)
  console.log(`   Successful:      ${ok.length}`)
  console.log(`   Failed:          ${failed.length} ${failed.length > 0 ? '❌' : '✓'}`)
  console.log(`   Error rate:      ${(failed.length / flat.length * 100).toFixed(1)}%`)
  console.log(`   Avg response:    ${avg.toFixed(0)}ms`)
  console.log(`   P95 response:    ${p95.toFixed(0)}ms`)
  console.log(`   P99 response:    ${p99.toFixed(0)}ms`)
  console.log(`   Fastest:         ${durations[0].toFixed(0)}ms`)
  console.log(`   Slowest:         ${durations[durations.length - 1].toFixed(0)}ms`)

  if (failed.length > 0) {
    console.log(`\n❌ Failed requests:`)
    failed.slice(0, 5).forEach(r => {
      console.log(`   ${r.name} → ${r.status} ${r.error || ''}`)
    })
  }

  // Per-endpoint breakdown
  console.log(`\n📊 Per-endpoint:`)
  for (const ep of ENDPOINTS) {
    const epResults = flat.filter(r => r.name === ep.name)
    const epOk = epResults.filter(r => r.ok)
    const epDurations = epResults.map(r => r.duration).sort((a, b) => a - b)
    const epAvg = epDurations.reduce((a, b) => a + b, 0) / epDurations.length
    const epP95 = epDurations[Math.floor(epDurations.length * 0.95)]
    console.log(`   ${ep.name.padEnd(12)} ${epOk.length}/${epResults.length} ok  avg:${epAvg.toFixed(0)}ms  p95:${epP95.toFixed(0)}ms`)
  }

  // Pass/fail
  const errorRate = failed.length / flat.length
  if (errorRate > 0.05) {
    console.log(`\n❌ FAIL: Error rate ${(errorRate * 100).toFixed(1)}% exceeds 5% threshold`)
    process.exit(1)
  }
  if (p95 > 5000) {
    console.log(`\n⚠️  WARN: P95 response ${p95.toFixed(0)}ms exceeds 5s threshold`)
  }
  console.log(`\n✅ PASS: All thresholds met`)
}

run().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
