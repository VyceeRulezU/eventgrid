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

  if (eventsError) {
    console.error('Failed to fetch events:', eventsError);
  } else {
    console.log('Events count:', events.length);
    for (const evt of events) {
      console.log('Event details:', {
        id: evt.id,
        name: evt.name,
        slug: evt.slug,
        org_id: evt.org_id,
        created_by: evt.created_by
      });
    }
  }
}

run();
