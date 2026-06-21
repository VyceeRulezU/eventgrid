import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

export async function recordReferralCommission(
  referredUserId: string,
  eventId: string,
  reference: string,
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('referred_by_code')
    .eq('id', referredUserId)
    .maybeSingle()

  if (!profile?.referred_by_code) return

  const { data: partner } = await supabase
    .from('referral_partners')
    .select('id, commission_amount')
    .eq('code', profile.referred_by_code)
    .eq('is_active', true)
    .maybeSingle()

  if (!partner) return

  const { error: insertError } = await supabase
    .from('referral_redemptions')
    .insert({
      partner_id: partner.id,
      referred_user_id: referredUserId,
      event_id: eventId,
      commission_amount: partner.commission_amount,
      status: 'pending',
      activated_at: new Date().toISOString(),
    })

  if (insertError) {
    // Log but don't throw — commission recording is best-effort
    console.error('Failed to record referral commission:', insertError)
  }
}
