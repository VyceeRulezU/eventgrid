import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://menmpyyrqevonepbpfai.supabase.co',
  'sb_publishable_ALJFgSjXClApj6t32sCLcg_MO--Xqb3'
);

async function run() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'eventgridtest@mailto.plus',
    password: 'Password123!'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  console.log('Login successful! Fetching events...');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*');

  if (eventsError || events.length === 0) {
    console.error('Failed to get events:', eventsError);
    return;
  }

  const event = events[0];
  console.log('Using event:', event.id, event.name);

  console.log('Invoking send-invite Edge Function...');
  const { data, error } = await supabase.functions.invoke('send-invite', {
    body: {
      type: 'team_member',
      event_id: event.id,
      email: 'testinvite999@mailto.plus',
      invited_by_name: 'Test Agent'
    }
  });

  console.log('Result data:', data);
  console.log('Result error:', error);
  if (error && error.context) {
    try {
      const text = await error.context.text();
      console.log('Error context body:', text);
    } catch (e) {
      console.log('Could not read error context body:', e);
    }
  }
}

run();
