const logoUrl = 'https://menmpyyrqevonepbpfai.supabase.co/storage/v1/object/public/org-assets/EventGrid-logo-white.svg';
const heroUrl = 'https://menmpyyrqevonepbpfai.supabase.co/storage/v1/object/public/org-assets/emails/corporate_event_hall.png';

async function test(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
    console.log(`Content-Length: ${res.headers.get('content-length')}`);
    console.log('---');
  } catch (err) {
    console.error(`Failed to fetch URL ${url}:`, err);
  }
}

async function run() {
  await test(logoUrl);
  await test(heroUrl);
}

run();
