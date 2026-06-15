# EventGrid — Promo Code System for Beta Testing
## Agent Context Document 10
**Version:** 1.0

---

## Why This Exists

Beta testers need free or discounted event activation while the payment flow runs through **live** Paystack/Flutterwave rails (not sandbox) — so production webhooks, signature verification, and real bank-card OTP flows are validated during beta, with zero risk to testers.

This system is also reusable post-beta for promotions, referral codes, and partner discounts — not a throwaway beta-only hack.

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  description       text,
  discount_type     text NOT NULL CHECK (discount_type IN ('percentage','fixed','free')),
  discount_value    integer DEFAULT 0,
  -- percentage: 0-100. fixed: amount in kobo. free: value ignored, final amount = 0.
  applies_to        text NOT NULL DEFAULT 'event_activation'
                     CHECK (applies_to IN ('event_activation','coordinator_project')),
  max_redemptions   integer,           -- null = unlimited
  redemption_count  integer DEFAULT 0,
  expires_at        timestamptz,       -- null = no expiry
  is_active         boolean DEFAULT true,
  created_by        uuid REFERENCES public.profiles(id),
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id   uuid NOT NULL REFERENCES public.promo_codes(id),
  user_id         uuid NOT NULL REFERENCES public.profiles(id),
  event_id        uuid REFERENCES public.events(id),
  final_amount    bigint DEFAULT 0,    -- kobo, after discount (0 if free)
  redeemed_at     timestamptz DEFAULT now(),
  UNIQUE(promo_code_id, event_id)
);

-- RLS: no direct SELECT for regular users — validation happens via RPC only
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_codes_admin_only" ON public.promo_codes FOR ALL
  USING ((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY "promo_redemptions_admin_read" ON public.promo_redemptions FOR SELECT
  USING ((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY "promo_redemptions_own" ON public.promo_redemptions FOR SELECT
  USING (user_id = auth.uid());
```

---

## Validation Function (RPC)

Promo codes are validated server-side via a `SECURITY DEFINER` function — this avoids exposing the `promo_codes` table to client-side enumeration (a user guessing codes by brute-force SELECT).

```sql
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code text,
  p_context text,       -- 'event_activation' or 'coordinator_project'
  p_base_amount bigint   -- the price before discount, in kobo
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo public.promo_codes;
  v_final_amount bigint;
BEGIN
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = upper(trim(p_code))
    AND applies_to = p_context
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_redemptions IS NULL OR redemption_count < max_redemptions);

  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Invalid or expired promo code');
  END IF;

  IF v_promo.discount_type = 'free' THEN
    v_final_amount := 0;
  ELSIF v_promo.discount_type = 'percentage' THEN
    v_final_amount := p_base_amount - (p_base_amount * v_promo.discount_value / 100);
  ELSE -- fixed
    v_final_amount := GREATEST(p_base_amount - v_promo.discount_value, 0);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'discount_type', v_promo.discount_type,
    'final_amount', v_final_amount,
    'message', CASE
      WHEN v_final_amount = 0 THEN 'Free activation applied!'
      ELSE 'Discount applied'
    END
  );
END;
$$;
```

---

## Frontend Flow — Event Activation Screen

**File:** `src/features/events/ActivateEventModal.tsx` (or wherever the activation UI lives)

Add a collapsible "Have a promo code?" section below the price display:

```tsx
const [promoCode, setPromoCode] = useState('')
const [promoResult, setPromoResult] = useState<PromoValidation | null>(null)
const [applying, setApplying] = useState(false)

const baseAmount = SIZE_TIER_PRICES[event.size_tier] // in kobo

async function applyPromoCode() {
  setApplying(true)
  const { data, error } = await supabase.rpc('validate_promo_code', {
    p_code: promoCode,
    p_context: 'event_activation',
    p_base_amount: baseAmount
  })
  setApplying(false)
  if (error || !data.valid) {
    setPromoResult({ valid: false, message: data?.message ?? 'Something went wrong' })
    return
  }
  setPromoResult(data)
}

const finalAmount = promoResult?.valid ? promoResult.final_amount : baseAmount
```

**UI:**
```tsx
<div className={styles.promoSection}>
  <button
    type="button"
    className="btn btn-ghost btn-sm"
    onClick={() => setShowPromoInput(!showPromoInput)}
  >
    Have a promo code?
  </button>

  {showPromoInput && (
    <div className={styles.promoInputRow}>
      <input
        className="input"
        placeholder="Enter code"
        value={promoCode}
        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
      />
      <button
        className="btn btn-secondary btn-sm"
        onClick={applyPromoCode}
        disabled={applying || !promoCode}
      >
        Apply
      </button>
    </div>
  )}

  {promoResult && (
    <p className={promoResult.valid ? styles.promoSuccess : styles.promoError}>
      {promoResult.message}
    </p>
  )}
</div>

<div className={styles.priceDisplay}>
  {promoResult?.valid && promoResult.final_amount !== baseAmount && (
    <span className={styles.priceOriginal}>{formatNaira(baseAmount)}</span>
  )}
  <span className={styles.priceFinal}>{formatNaira(finalAmount)}</span>
</div>
```

Styling:
```css
.promoSuccess { font-size: var(--text-xs); color: var(--color-success); margin-top: var(--space-2); }
.promoError   { font-size: var(--text-xs); color: var(--color-error); margin-top: var(--space-2); }
.priceOriginal {
  text-decoration: line-through;
  color: var(--color-text-muted);
  margin-right: var(--space-2);
}
.priceFinal {
  color: var(--color-accent);
  font-weight: var(--weight-bold);
  font-size: var(--text-title);
}
```

---

## Activation Branching

**If `finalAmount === 0` (free):**

Skip Paystack/Flutterwave entirely. Directly activate:

```typescript
async function activateFree(eventId: string, promoCodeId: string) {
  await supabase
    .from('events')
    .update({
      status: 'active',
      payment_status: 'paid',
      paystack_ref: `PROMO:${promoCode}`
    })
    .eq('id', eventId)

  await supabase.from('promo_redemptions').insert({
    promo_code_id: promoCodeId,
    user_id: user.id,
    event_id: eventId,
    final_amount: 0
  })

  await supabase.rpc('increment_promo_redemption', { p_promo_code_id: promoCodeId })

  await supabase.from('event_activity').insert({
    event_id: eventId,
    actor_id: user.id,
    actor_name: profile.display_name,
    action_type: 'event_activated',
    description: `Event activated via promo code ${promoCode}`
  })

  // Navigate to event dashboard — fully unlocked
}
```

Add the increment helper:
```sql
CREATE OR REPLACE FUNCTION public.increment_promo_redemption(p_promo_code_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.promo_codes
  SET redemption_count = redemption_count + 1
  WHERE id = p_promo_code_id;
$$;
```

**If `finalAmount > 0` (partial discount or no code):**

Proceed with the existing Paystack/Flutterwave flow as normal, but pass `finalAmount` instead of `baseAmount` as the charge amount. On successful webhook (existing `/paystack-webhook` Edge Function), additionally insert the `promo_redemptions` row and increment the counter if a promo code was applied — pass `promo_code_id` through in the Paystack `metadata` field when initializing payment so the webhook can access it.

---

## Generating Beta Codes (Manual, via Supabase Table Editor)

No admin UI is needed for ~8 testers. Insert rows directly:

```sql
-- One code per tester, free, allows 3 activations (in case they want to test multiple events)
INSERT INTO public.promo_codes (code, description, discount_type, applies_to, max_redemptions)
VALUES
  ('BETA-TUNDE',   'Beta tester - Tunde', 'free', 'event_activation', 3),
  ('BETA-CHISOM',  'Beta tester - Chisom', 'free', 'event_activation', 3),
  ('BETA-ADUNOLA', 'Beta tester - Adunola', 'free', 'event_activation', 3);

-- Coordinator standalone projects, separate batch
INSERT INTO public.promo_codes (code, description, discount_type, applies_to, max_redemptions)
VALUES
  ('BETACOORD-BLESSING', 'Beta coordinator - Blessing', 'free', 'coordinator_project', 2);
```

Naming convention: `BETA-[FIRSTNAME]` for planners, `BETACOORD-[FIRSTNAME]` for standalone coordinators. Personalised codes also make it easy to track which tester is actually using the product.

---

## Quality Checklist

- [ ] `promo_codes` and `promo_redemptions` tables created with RLS
- [ ] `validate_promo_code` RPC function created
- [ ] `increment_promo_redemption` RPC function created
- [ ] Promo input added to event activation screen
- [ ] Free codes skip payment provider entirely and activate directly
- [ ] Partial-discount codes pass reduced amount to Paystack/Flutterwave
- [ ] `event_activity` logs promo-based activations
- [ ] Beta codes inserted for each tester before outreach messages are sent
