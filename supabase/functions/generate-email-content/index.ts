import { GoogleGenAI } from '@google/genai'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { prompt, role, platform_stats } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    const systemPrompt = `You are a marketing email writer for NaliGrid, an event management platform for Nigerian event professionals. 
Write engaging, professional email content in HTML format (without <html>/<body> tags, just the content block).
Keep the tone warm, professional, and slightly casual.
Include a clear call-to-action button.
The audience is event planners, coordinators, and vendors in Nigeria.
Use Nigerian brands/context where appropriate.
Return JSON with fields: subject (string, max 80 chars), body_html (string, HTML content without outer html/body tags).`

    const userPrompt = `Target audience role: ${role || 'event planners'}
Platform context: NaliGrid is an event management platform with tools for pipeline tracking, vendor management, financials, guest lists, task management, live board, media gallery, and post-event reports.

Additional instructions: ${prompt}

Respond with a JSON object containing "subject" and "body_html".`

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        responseMimeType: 'application/json',
      },
    })

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error('Gemini returned empty response')
    }

    const parsed = JSON.parse(text)

    return new Response(
      JSON.stringify({ subject: parsed.subject, body_html: parsed.body_html }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('generate-email-content error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
