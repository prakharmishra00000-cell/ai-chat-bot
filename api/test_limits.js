const fetch = require('node-fetch');

async function testLimits() {
  const email = 'test_limits_user@example.com';
  
  // Login to create user
  await fetch('http://localhost:5000/api/user/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, action: 'login' })
  });

  console.log('Testing Masking Limits (Free Tier -> 5 limit)');
  for (let i = 1; i <= 6; i++) {
    const res = await fetch('http://localhost:5000/api/feature/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, feature: 'masking' })
    });
    const data = await res.json();
    if (!res.ok) {
      console.log(`Call ${i}: Hit Limit! Msg: ${data.message}`);
    } else {
      console.log(`Call ${i}: Success! Used: ${data.used}/${data.limit}`);
    }
  }

  console.log('\nTesting Council Limit (Free Tier -> 1 limit)');
  for (let i = 1; i <= 2; i++) {
    const res = await fetch('http://localhost:5000/api/chat/council/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, prompt: 'Test council' })
    });
    const data = await res.json();
    if (!res.ok) {
      console.log(`Call ${i}: Hit Limit! Error: ${data.message || data.error}`);
    } else {
      console.log(`Call ${i}: Success (started).`);
    }
  }
}

testLimits();
