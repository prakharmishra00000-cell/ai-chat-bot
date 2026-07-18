const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'backend', 'config.json');

async function test() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const keys = config.keys || [];
  const key = keys[0];

  const tests = [
    { model: 'gemini-2.5-flash', api: 'v1beta' },
    { model: 'gemini-2.5-pro', api: 'v1beta' },
    { model: 'gemini-2.0-flash', api: 'v1beta' },
    { model: 'gemini-2.0-pro-exp-02-05', api: 'v1beta' }
  ];

  for (const { model, api } of tests) {
    const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${key}`;
    const payload = {
      contents: [{ role: "user", parts: [{ text: "Hello" }] }]
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(`\n--- Test: ${model} (${api}) ---`);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        console.log(`Success! Response snippet: ${data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) || 'No text content'}`);
      } else {
        console.log(`Error Message: ${data.error?.message || JSON.stringify(data)}`);
      }
    } catch (e) {
      console.log(`Exception for ${model}: ${e.message}`);
    }
  }
}

test();
