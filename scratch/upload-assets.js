import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://menmpyyrqevonepbpfai.supabase.co',
  'sb_publishable_ALJFgSjXClApj6t32sCLcg_MO--Xqb3'
);

const logoPath = 'c:/Users/USER/Downloads/app-eventgrid/public/EventGrid-logo-white.svg';
const heroPath = 'c:/Users/USER/Downloads/app-eventgrid/public/emails/corporate_event_hall.png';

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

  console.log('Login successful! Reading files...');
  
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    const heroBuffer = fs.readFileSync(heroPath);

    console.log('Uploading EventGrid-logo-white.svg...');
    const { data: logoData, error: logoError } = await supabase.storage
      .from('org-assets')
      .upload('EventGrid-logo-white.svg', logoBuffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (logoError) {
      console.error('Logo upload failed:', logoError);
    } else {
      console.log('Logo uploaded successfully:', logoData);
    }

    console.log('Uploading corporate_event_hall.png...');
    const { data: heroData, error: heroError } = await supabase.storage
      .from('org-assets')
      .upload('emails/corporate_event_hall.png', heroBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (heroError) {
      console.error('Hero upload failed:', heroError);
    } else {
      console.log('Hero uploaded successfully:', heroData);
    }

    // Get public URLs
    const logoUrl = supabase.storage.from('org-assets').getPublicUrl('EventGrid-logo-white.svg').data.publicUrl;
    const heroUrl = supabase.storage.from('org-assets').getPublicUrl('emails/corporate_event_hall.png').data.publicUrl;

    console.log('\n--- PUBLIC URLs ---');
    console.log('Logo Public URL:', logoUrl);
    console.log('Hero Public URL:', heroUrl);

  } catch (err) {
    console.error('Unexpected error reading/uploading files:', err);
  }
}

run();
