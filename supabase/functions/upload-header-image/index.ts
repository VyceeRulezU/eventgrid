import { createClient } from 'jsr:@supabase/supabase-js@2'
import { AwsClient } from 'npm:aws4fetch@1.0.18'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { file: base64, name, event_id } = await req.json()

    if (!base64 || !event_id) {
      return new Response(
        JSON.stringify({ error: 'Missing file or event_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const mime = (base64.split(';')[0].split(':')[1]) || 'image/jpeg'
    const raw = Uint8Array.from(atob(base64.split(',')[1]), (c) => c.charCodeAt(0))
    const ext = (name || 'image.jpg').split('.').pop() || 'jpg'
    const storagePath = event_id + '/header/' + crypto.randomUUID() + '.' + ext

    // Upload to R2 via S3-compatible API with SigV4
    const r2Endpoint = Deno.env.get('VITE_R2_ENDPOINT')!
    const r2Bucket = Deno.env.get('VITE_R2_BUCKET')!
    const r2AccessKey = Deno.env.get('VITE_R2_ACCESS_KEY_ID')!
    const r2Secret = Deno.env.get('VITE_R2_SECRET_ACCESS_KEY')!
    const r2PublicUrl = Deno.env.get('VITE_R2_PUBLIC_URL')!

    const aws = new AwsClient({
      accessKeyId: r2AccessKey,
      secretAccessKey: r2Secret,
      service: 's3',
      region: 'auto',
    })

    const r2Url = r2Endpoint + '/' + r2Bucket + '/' + storagePath
    const uploadRes = await aws.fetch(r2Url, {
      method: 'PUT',
      body: raw,
      headers: { 'Content-Type': mime },
    })

    if (!uploadRes.ok) {
      const text = await uploadRes.text()
      console.error('R2 upload failed:', uploadRes.status, text)
      return new Response(
        JSON.stringify({ error: 'R2 upload failed (' + uploadRes.status + '): ' + text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const publicUrl = r2PublicUrl + '/' + storagePath

    const { error: updateErr } = await supabaseAdmin
      .from('events')
      .update({ header_image_url: publicUrl })
      .eq('id', event_id)

    if (updateErr) {
      console.error('Event update failed:', updateErr)
      return new Response(
        JSON.stringify({ error: 'Database update failed: ' + updateErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('upload-header-image error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
