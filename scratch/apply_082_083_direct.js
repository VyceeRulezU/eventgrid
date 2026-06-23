import fs from 'fs'
import pg from 'pg'
const { Client } = pg

const connStr = 'postgresql://postgres.menmpyyrqevonepbpfai:Password123!@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'

async function run() {
  console.log('Connecting via raw Postgres connection...')
  const client = new Client({ connectionString: connStr })
  await client.connect()
  console.log('Connected!')

  try {
    console.log('Running: Step 1 (Normalise profiles email)...')
    await client.query('UPDATE public.profiles SET email = LOWER(email) WHERE email != LOWER(email)')

    console.log('Running: Step 2a (Delete duplicate invitations)...')
    await client.query(`
      DELETE FROM public.invitations AS inv
      USING public.invitations AS inv2
      WHERE inv.id != inv2.id
        AND inv.event_id = inv2.event_id
        AND LOWER(inv.email) = LOWER(inv2.email)
        AND inv.email != LOWER(inv.email)
        AND inv2.email = LOWER(inv2.email)
    `)

    console.log('Running: Step 2b (Normalise invitations email)...')
    await client.query('UPDATE public.invitations SET email = LOWER(email) WHERE email != LOWER(email)')

    console.log('Running: Step 3 (Add lowercase constraint on profiles.email)...')
    await client.query('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_lowercase')
    await client.query('ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_lowercase CHECK (email = LOWER(email))')

    console.log('Running: Step 4 (Fix handle_new_user trigger)...')
    await client.query(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO profiles (id, email, display_name, role, phone)
        VALUES (
          NEW.id,
          LOWER(NEW.email),
          NEW.raw_user_meta_data->>'display_name',
          COALESCE(NEW.raw_user_meta_data->>'role', 'coordinator'),
          NEW.raw_user_meta_data->>'phone'
        )
        ON CONFLICT (id) DO UPDATE
          SET email = LOWER(EXCLUDED.email);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
    `)

    console.log('✅ Migrations applied successfully via Postgres client!')
  } catch (err) {
    console.error('❌ Database error:', err.message)
  } finally {
    await client.end()
  }
}

run().catch(console.error)
