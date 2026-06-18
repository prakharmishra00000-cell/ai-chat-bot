const fs = require('fs');
async function test() {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=FAKE_KEY";
  const payload = {
    contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    tools: [{ googleSearch: {} }]
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
