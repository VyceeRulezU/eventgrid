// k6 load test — API smoke test
// Usage: k6 run load-tests/api-smoke.js
// Install k6: https://k6.io/docs/getting-started/installation/

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'https://menmpyyrqevonepbpfai.supabase.co/rest/v1'
const ANON_KEY = __ENV.ANON_KEY

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp up to 10 users
    { duration: '1m', target: 10 },   // stay at 10 users
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    errors: ['rate<0.05'],             // < 5% error rate
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
  },
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
}

export default function () {
  group('events', () => {
    const res = http.get(`${BASE_URL}/events?select=id,name,status&limit=10`, { headers })
    check(res, { 'events query OK': (r) => r.status === 200 })
    errorRate.add(res.status !== 200)
  })

  group('profiles', () => {
    const res = http.get(`${BASE_URL}/profiles?select=id,display_name,role&limit=10`, { headers })
    check(res, { 'profiles query OK': (r) => r.status === 200 })
    errorRate.add(res.status !== 200)
  })

  sleep(1)
}
