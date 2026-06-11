import { createClient } from 'jsr:@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PhaseData {
  phase_number: number
  phase_name: string
  status: string
}

interface IssueData {
  title: string
  severity: string
  resolved_at: string | null
  lessons_learned: string | null
}

interface ReportInput {
  event: {
    name: string
    event_type: string | null
    event_date: string | null
    venue_name: string | null
    status: string
  }
  phases: PhaseData[]
  guestCount: number
  checkedIn: number
  totalBudget: number
  vendorCount: number
  issues: IssueData[]
  issuesResolved: number
  mediaCount: number
  type: 'internal' | 'client'
}

interface AiResponse {
  narrative: {
    executiveSummary: string
    highlights: string[]
    vendorNotes: string
    issueSummary: string
    recommendations: string[]
  }
}

function buildPrompt(input: ReportInput): string {
  const completed = input.phases.filter((p) => p.status === 'completed').length
  const total = input.phases.length || 9
  const budgetFormatted = (input.totalBudget / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })

  return `You are an expert event report writer. Analyse the following event data and return ONLY valid JSON (no markdown, no code fences).

Generate a professional ${input.type} report narrative for "${input.event.name}".

Event Details:
- Type: ${input.event.event_type || 'N/A'}
- Date: ${input.event.event_date || 'N/A'}
- Venue: ${input.event.venue_name || 'N/A'}
- Status: ${input.event.status}
${input.type === 'internal' ? `- Budget: ${budgetFormatted}` : ''}

Metrics:
- Guests Invited: ${input.guestCount}
- Checked In: ${input.checkedIn}
- Vendors: ${input.vendorCount}
- Phase Progress: ${completed}/${total} completed
- Issues: ${input.issues.length} (${input.issuesResolved} resolved)
- Media Files: ${input.mediaCount}

Phases:
${input.phases.map((p) => `  Phase ${p.phase_number}: ${p.phase_name} — ${p.status}`).join('\n')}

Issues:
${input.issues.length > 0 ? input.issues.map((i) => `  - ${i.title} (${i.severity})${i.resolved_at ? ' [Resolved]' : ''}${i.lessons_learned ? ` Lesson: ${i.lessons_learned}` : ''}`).join('\n') : '  No issues logged.'}

Return JSON with this exact shape:
{
  "narrative": {
    "executiveSummary": "2-3 sentence summary of overall event performance",
    "highlights": ["3-5 bullet-point highlights as strings"],
    "vendorNotes": "1-2 sentence assessment of vendor performance",
    "issueSummary": "1-2 sentence summary of issues and resolutions",
    "recommendations": ["3-5 actionable recommendations as strings"]
  }
}

Keep the tone professional and ${input.type === 'internal' ? 'candid and detailed' : 'positive and client-friendly'}.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const input: ReportInput = await req.json()

    if (!input.event?.name) {
      return new Response(
        JSON.stringify({ error: 'Missing event data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = buildPrompt(input)

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      console.error('Gemini API error:', geminiRes.status, errBody)
      return new Response(
        JSON.stringify({ error: `AI service error (${geminiRes.status})`, detail: errBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiRes.json()
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Empty AI response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed: AiResponse = JSON.parse(cleaned)

    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('generate-report-narrative error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
