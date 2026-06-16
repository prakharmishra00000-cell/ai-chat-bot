const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Razorpay = require('razorpay');
const { performWebSearch } = require('./search');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Paths for config and local database
const CONFIG_PATH = path.join(__dirname, 'config.json');
const DB_PATH = path.join(__dirname, 'db.json');

// Auto-bootstrap config.json from environment variables on startup (for Render deployment)
function bootstrapConfigFromEnv() {
  const envKeys = [];
  
  // Method 1: Check numbered keys with multiple naming patterns
  for (let i = 1; i <= 9; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`] 
           || process.env[`GEMINI_KEY_${i}`] 
           || process.env[`API_KEY_${i}`]
           || process.env[`GEMINI_API_KEY${i}`]
           || process.env[`KEY_${i}`];
    if (k && k.trim()) envKeys.push(k.trim());
  }
  
  // Method 2: Check single key env vars
  if (envKeys.length === 0) {
    const singleKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.API_KEY;
    if (singleKey && singleKey.trim()) envKeys.push(singleKey.trim());
  }
  
  // Method 3: Scan ALL env vars for any that look like Google/Gemini API keys
  if (envKeys.length === 0) {
    for (const [key, val] of Object.entries(process.env)) {
      if (val && (val.startsWith('AIza') || val.startsWith('AQ') || val.startsWith('gsk_')) && val.length > 20) {
        console.log(`[STARTUP] Auto-detected API key from env var: ${key}`);
        envKeys.push(val.trim());
      }
    }
  }

  console.log(`[STARTUP] Found ${envKeys.length} Gemini API key(s) from environment variables.`);
  
  if (envKeys.length > 0) {
    try {
      const configData = {
        keys: envKeys,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || '',
        razorpaySecret: process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET || '',
        googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '',
        adminUsername: process.env.ADMIN_USERNAME || 'prakhar mishra',
        adminPassword: process.env.ADMIN_PASSWORD || 'prakhar@2025',
        smtpUser: process.env.SMTP_USER || process.env.SMTP_EMAIL || '',
        smtpPass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.SMTP_APP_PASSWORD || ''
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2));
      console.log(`[STARTUP] Successfully bootstrapped config.json with ${envKeys.length} API key(s).`);
      return true;
    } catch (e) {
      console.error('[STARTUP] Failed to write config.json:', e);
    }
  } else {
    console.warn('[STARTUP] WARNING: No Gemini API keys found in environment variables!');
    console.warn('[STARTUP] Expected env var names: GEMINI_API_KEY_1, GEMINI_API_KEY_2, ... or GEMINI_API_KEY');
  }
  return false;
}

// Try bootstrap on startup — ALWAYS attempt env vars first on fresh deploy
console.log(`[STARTUP] Checking config at: ${CONFIG_PATH}`);
console.log(`[STARTUP] Config file exists: ${fs.existsSync(CONFIG_PATH)}`);

// Always try to bootstrap from env vars (overwrite if env vars exist)
const bootstrapped = bootstrapConfigFromEnv();

if (!bootstrapped && !fs.existsSync(CONFIG_PATH)) {
  console.warn('[STARTUP] No config.json and no env vars. Bot will need Setup page configuration.');
} else if (fs.existsSync(CONFIG_PATH)) {
  try {
    const existingConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    console.log(`[STARTUP] config.json loaded with ${existingConfig.keys ? existingConfig.keys.length : 0} API key(s).`);
  } catch (e) {
    console.error('[STARTUP] config.json is corrupted:', e.message);
  }
}

// Initialize database file if it doesn't exist or doesn't have plans/support/anonymousVisits
let dbInitData = {
  users: {},
  transactions: [],
  visits: {},
  anonymousVisits: {},
  supportQueries: [],
  pendingApprovals: [],
  plans: {
    free: {
      id: "free",
      name: "Free Tier",
      price: 0,
      prompts: 30,
      features: [
        "30 daily prompts limit",
        "All features unlocked (Trial)",
        "Advanced Coding (Architect)",
        "Prompt Optimization",
        "Matrix Simulation",
        "Voice Input",
        "File & Image Attachments",
        "Web Grounding Search",
        "Live Diagrams & Mind Maps",
        "Personality Modes"
      ]
    },
    standard: {
      id: "standard",
      name: "Standard Plan",
      price: 99,
      duration: "1 Month",
      days: 30,
      prompts: 100,
      features: [
        "100 daily prompts limit",
        "Standard processing priority",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "Valid for 30 Days"
      ]
    },
    better: {
      id: "better",
      name: "Better Plan",
      price: 199,
      duration: "3 Months",
      days: 90,
      prompts: 150,
      features: [
        "150 daily prompts limit",
        "Better processing priority",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "Prompt Optimization",
        "Matrix Simulation",
        "File & Image Attachments",
        "Valid for 90 Days"
      ]
    },
    premium: {
      id: "premium",
      name: "Premium Plan",
      price: 999,
      duration: "1 Year",
      days: 365,
      prompts: 200,
      features: [
        "200 daily prompts limit",
        "Maximum processing priority",
        "Advanced Coding (Architect)",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "Prompt Optimization",
        "Matrix Simulation",
        "File & Image Attachments",
        "Live Diagrams & Mind Maps",
        "Valid for 365 Days"
      ]
    }
  }
};

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(dbInitData, null, 2), 'utf8');
} else {
  try {
    const currentDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    let updated = false;
    if (!currentDB.plans) { currentDB.plans = dbInitData.plans; updated = true; }
    if (!currentDB.supportQueries) { currentDB.supportQueries = []; updated = true; }
    if (!currentDB.anonymousVisits) { currentDB.anonymousVisits = {}; updated = true; }
    if (!currentDB.pendingApprovals) { currentDB.pendingApprovals = []; updated = true; }
    if (updated) {
      fs.writeFileSync(DB_PATH, JSON.stringify(currentDB, null, 2), 'utf8');
    }
  } catch (e) {
    console.error('Failed to sync DB schema on startup:', e);
  }
}

// Helpers for Reading/Writing Config & DB
function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error('Error reading config:', e);
    return null;
  }
}

function writeConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing config:', e);
    return false;
  }
}

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    console.error('Error reading DB, returning empty structure:', e);
    return { users: {}, transactions: [], visits: {}, anonymousVisits: {}, supportQueries: [], pendingApprovals: [], plans: {} };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing DB:', e);
    return false;
  }
}

// Track visits (middleware)
app.use((req, res, next) => {
  // Simple session tracker for unique pageviews
  if (req.path === '/' || req.path === '/index.html') {
    const today = new Date().toISOString().split('T')[0];
    const db = readDB();
    db.visits = db.visits || {};
    db.visits[today] = (db.visits[today] || 0) + 1;
    writeDB(db);
  }
  next();
});

// Setup Configuration Endpoint
app.post('/api/setup', (req, res) => {
  const { keys, razorpayKeyId, razorpaySecret, googleClientId, adminUsername, adminPassword, smtpUser, smtpPass } = req.body;
  
  if (!keys || !Array.isArray(keys) || keys.length === 0 || !adminUsername || !adminPassword) {
    return res.status(400).json({ error: 'Keys, admin username, and admin password are required.' });
  }

  const cleanKeys = keys.filter(k => k && k.trim() !== '');
  if (cleanKeys.length === 0) {
    return res.status(400).json({ error: 'At least one valid Gemini API Key is required.' });
  }

  const success = writeConfig({
    keys: cleanKeys,
    razorpayKeyId: razorpayKeyId || '',
    razorpaySecret: razorpaySecret || '',
    googleClientId: googleClientId || '',
    adminUsername,
    adminPassword,
    smtpUser: smtpUser || '',
    smtpPass: smtpPass || ''
  });

  if (success) {
    return res.json({ success: true, message: 'Configuration saved successfully.' });
  } else {
    return res.status(500).json({ error: 'Failed to write configuration.' });
  }
});

// Check if Setup is Completed
app.get('/api/setup/status', (req, res) => {
  const config = readConfig();
  res.json({ setupCompleted: !!config });
});

// Securely expose only non-secret keys to the frontend for Google Sign-In and Razorpay initialization
app.get('/api/config/public', (req, res) => {
  const config = readConfig();
  if (!config) {
    return res.json({ googleClientId: '', razorpayKeyId: '' });
  }
  res.json({
    googleClientId: config.googleClientId || '',
    razorpayKeyId: config.razorpayKeyId || ''
  });
});

// User Session and Plan Status Middleware Helper
function getOrCreateUser(email) {
  if (!email) return null;
  const db = readDB();
  const today = new Date().toISOString().split('T')[0];
  
  let user = db.users[email];
  if (!user) {
    user = {
      email,
      plan: 'free',
      promptsUsed: 0,
      lastResetDate: today,
      planExpiry: null
    };
    db.users[email] = user;
    writeDB(db);
  } else {
    // Check Plan Expiry
    if (user.plan !== 'free' && user.planExpiry) {
      const expiry = new Date(user.planExpiry);
      if (new Date() > expiry) {
        // Plan expired! Downgrade to free tier
        user.plan = 'free';
        user.planExpiry = null;
        db.users[email] = user;
        writeDB(db);
      }
    }

    // Daily Prompts Reset at Midnight
    if (user.lastResetDate !== today) {
      user.promptsUsed = 0;
      user.lastResetDate = today;
      db.users[email] = user;
      writeDB(db);
    }
  }
  return user;
}

// User Auth Endpoint (Explicit Sign In / Sign Up)
app.post('/api/user/auth', (req, res) => {
  const { email, action } = req.body;
  if (!email || !action) return res.status(400).json({ error: 'Email and action are required' });
  
  const db = readDB();
  const userExists = !!db.users[email];

  if (action === 'login') {
    if (!userExists) {
      return res.status(400).json({ error: 'USER_NOT_FOUND', message: 'Account not registered. Please sign up first.' });
    }
    return res.json({ success: true, message: 'Logged in successfully.' });
  } else if (action === 'signup') {
    if (userExists) {
      return res.status(400).json({ error: 'USER_EXISTS', message: 'Account already registered. Please sign in.' });
    }
    // Create the user implicitly via helper
    getOrCreateUser(email);
    return res.json({ success: true, message: 'Signed up successfully.' });
  } else {
    return res.status(400).json({ error: 'INVALID_ACTION', message: 'Action must be login or signup.' });
  }
});

// User Status Endpoint
app.post('/api/user/status', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  const user = getOrCreateUser(email);
  const db = readDB();
  const planInfo = db.plans && db.plans[user.plan];
  const userLimit = planInfo ? planInfo.prompts : (user.plan === 'free' ? 30 : 100);
  
  res.json({
    email: user.email,
    plan: user.plan,
    promptsUsed: user.promptsUsed,
    limit: userLimit,
    expiry: user.planExpiry
  });
});

// GEMINI API ROTATION ENGINE
let activeKeyIndex = 0;

async function queryGeminiAPI(keys, contents, systemInstruction) {
  const allErrors = [];
  
  // Models with quota available — 1.5-flash has most free quota, 2.0-flash is exhausted on free tier
  const modelConfigs = [
    { model: 'gemini-1.5-flash', api: 'v1beta' },
    { model: 'gemini-1.5-flash', api: 'v1' },
    { model: 'gemini-2.5-flash', api: 'v1beta' },
    { model: 'gemini-pro', api: 'v1beta' },
    { model: 'gemini-pro', api: 'v1' },
    { model: 'gemini-2.0-flash', api: 'v1beta' },
    { model: 'gemini-1.5-pro', api: 'v1beta' },
  ];

  // Try each key with each model combination
  for (let keyAttempt = 0; keyAttempt < keys.length; keyAttempt++) {
    const keyIndex = (activeKeyIndex + keyAttempt) % keys.length;
    const activeKey = keys[keyIndex];
    const keyPreview = activeKey.substring(0, 8) + '...';

    for (const { model, api } of modelConfigs) {
      const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${activeKey}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        let payloadContents = JSON.parse(JSON.stringify(contents));
        if (systemInstruction && payloadContents.length > 0 && payloadContents[0].role === 'user') {
           payloadContents[0].parts[0].text = `[System Instruction: ${systemInstruction}]\n\n` + payloadContents[0].parts[0].text;
        }

        console.log(`[GEMINI] Trying Key ${keyPreview} | ${api}/${model}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: payloadContents }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseData = await response.json();

        if (response.ok) {
          if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
            console.log(`[GEMINI] ✅ SUCCESS: Key ${keyPreview} | ${api}/${model}`);
            activeKeyIndex = keyIndex; // Remember which key worked
            return responseData.candidates[0].content.parts[0].text;
          }
          const blockReason = responseData.candidates?.[0]?.finishReason || 'no-candidates';
          console.warn(`[GEMINI] Empty response from ${model}. Reason: ${blockReason}`);
          continue; // Try next model
        }

        const errMessage = responseData.error?.message || response.statusText;
        console.warn(`[GEMINI] ❌ ${response.status}: Key ${keyPreview} | ${api}/${model} | ${errMessage.substring(0, 100)}`);
        
        // 429 = quota exceeded for THIS model — try NEXT MODEL (not next key!)
        if (response.status === 429) {
          continue; // Try next model config
        }
        
        // 401/403 = invalid key — skip ALL models for this key
        if (response.status === 401 || response.status === 403) {
          allErrors.push(`Key ${keyPreview}: unauthorized`);
          break; // Skip to next key
        }
        
        // 404 = model not found — try next model
        if (response.status === 404) {
          continue;
        }
        
        // Other errors — try next model
        continue;

      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.warn(`[GEMINI] ⏱ TIMEOUT: Key ${keyPreview} | ${model}`);
          continue; // Try next model
        }
        console.error(`[GEMINI] 💥 ERROR: Key ${keyPreview} | ${model}:`, error.message);
        continue; // Try next model
      }
    }
  }

  console.error(`[GEMINI] ALL COMBINATIONS FAILED after trying ${keys.length} keys × ${modelConfigs.length} models`);
  throw new Error('Our AI servers are currently busy. Please try again in a few seconds.');
}

// Main Chat AI Endpoint
app.post('/api/chat', async (req, res) => {
  let config = readConfig();
  if (!config || !config.keys || config.keys.length === 0) {
    // Try re-bootstrapping from env vars
    bootstrapConfigFromEnv();
    config = readConfig();
    if (!config || !config.keys || config.keys.length === 0) {
      return res.status(500).json({ error: 'SETUP_REQUIRED', message: 'API credentials are not configured yet. Please complete the Setup process.' });
    }
  }

  const { email, message, history, personality, mode, attachment } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  // 1. Enforce Prompt Limit & Feature Gating
  const db = readDB();
  const user = getOrCreateUser(email);
  const planInfo = db.plans && db.plans[user.plan];
  const userLimit = planInfo ? planInfo.prompts : (user.plan === 'free' ? 30 : 100);
  const planFeatures = planInfo && planInfo.features ? [...new Set(planInfo.features)].join(' ').toLowerCase() : '';

  // Feature gating: Free tier gets ALL features as trial. Paid plans only get listed features.
  if (user.plan !== 'free') {
    if (mode === 'matrix_simulation' && !planFeatures.includes('matrix')) {
      return res.status(403).json({ error: 'FEATURE_LOCKED', message: 'Matrix Simulation is not included in your current plan. Please upgrade to a plan that includes this feature.' });
    }
    if (mode === 'optimize' && !planFeatures.includes('optimize')) {
      return res.status(403).json({ error: 'FEATURE_LOCKED', message: 'Prompt Optimization is not included in your current plan. Please upgrade to unlock this feature.' });
    }
    if (attachment && !planFeatures.includes('attachment') && !planFeatures.includes('file')) {
      return res.status(403).json({ error: 'FEATURE_LOCKED', message: 'File attachments are not included in your current plan. Please upgrade to unlock this feature.' });
    }
    if (personality === 'architect' && !planFeatures.includes('advanced coding')) {
      return res.status(403).json({ error: 'FEATURE_LOCKED', message: 'Advanced Coding (Architect mode) is only available in the Free Trial and Premium Plan. Please upgrade to the Premium Plan to unlock this feature.' });
    }
  }

  // Check if admin
  const isAdmin = email === 'prakharmishra00000@gmail.com' || email === 'admin@matrixmind.com';

  if (!isAdmin && user.promptsUsed >= userLimit) {
    return res.status(403).json({
      error: 'LIMIT_EXCEEDED',
      message: `You have reached your daily limit of ${userLimit} prompts. Please upgrade your plan.`
    });
  }

  try {
    let finalPrompt = message;

    // A. OPTIMIZE MODE — merged into single call (no separate API call)
    if (mode === 'optimize') {
      finalPrompt = `[OPTIMIZE INSTRUCTION: First, rewrite the following user query into a well-structured, grammatically complete sentence. Show the optimized query at the top of your response prefixed with "🔧 Optimized Query:". Then answer the optimized query in full detail.]\n\nUser's original query: ${message}`;
    }

    // B. WEB GROUNDING SEARCH (with 5 second timeout to not block response)
    let searchGroundingContext = '';
    const needsSearch = /search|latest|news|weather|current|realtime|today|fact|who is|what is|google/i.test(finalPrompt);
    
    if (needsSearch) {
      try {
        console.log(`Executing web grounding search for: "${finalPrompt}"`);
        const searchPromise = performWebSearch(finalPrompt);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Search timeout')), 5000));
        const searchResults = await Promise.race([searchPromise, timeoutPromise]);
        if (searchResults && searchResults.length > 0) {
          searchGroundingContext = "\n\nReal-time Web Search Grounding Context:\n";
          searchResults.forEach((res, i) => {
            searchGroundingContext += `[${i + 1}] Source: "${res.title}" (${res.link})\nSnippet: ${res.snippet}\n\n`;
          });
          searchGroundingContext += "Use these search results to answer the user's prompt. Cite the source links directly in the answer in Markdown link format.";
        }
      } catch (e) {
        console.warn('Web search skipped (timeout or error):', e.message);
      }
    }

    // C. SYSTEM INSTRUCTION / PERSONALITY
    let systemInstruction = "You are MatrixMind, a super advanced, friendly AI Assistant. ";
    
    // Strict Personality enforcement
    if (personality === 'architect') {
      systemInstruction += "You are currently in ARCHITECT mode. You are a senior-level technical Architect and full-stack developer. ";
      systemInstruction += "STRICT RULES FOR ARCHITECT MODE: ";
      systemInstruction += "1. You MUST answer ALL coding, programming, scripting, app development, web development, bot building, and technical architecture queries. ";
      systemInstruction += "2. When asked to write a script or code, you MUST provide the COMPLETE, ERROR-FREE, PRODUCTION-READY code in a SINGLE response. Never give partial code. Never say 'rest of the code remains same'. Include EVERY line. ";
      systemInstruction += "3. Along with the code, explain: (a) What each section does, (b) How to integrate it, (c) How to run it, (d) Any dependencies needed. ";
      systemInstruction += "4. Output diagrams using Mermaid.js syntax block when requested. ";
      systemInstruction += "5. If the user asks a general knowledge or statistics query that does NOT involve coding/architecture, respond: '⚠️ This query is better suited for a different personality mode. Please switch to **Standard** mode for general queries or **Analyst** mode for statistics and data analysis.' Do NOT answer the query. ";

    } else if (personality === 'analyst') {
      systemInstruction += "You are currently in ANALYST mode. You are a professional data Analyst and statistician. ";
      systemInstruction += "STRICT RULES FOR ANALYST MODE: ";
      systemInstruction += "1. You MUST analyze problems, statistics, data, trends, lists, comparisons, graphs, and logic. ";
      systemInstruction += "2. Break down complex facts step-by-step using tables, bullet points, charts, and explain findings thoroughly with numbers and percentages. ";
      systemInstruction += "3. If the user asks a coding/programming/script query, respond: '⚠️ This query requires code generation. Please switch to **Architect** mode to get complete, production-ready scripts and technical solutions.' Do NOT write code. ";
      systemInstruction += "4. If the user asks a casual general knowledge query, respond: '⚠️ This is a general query. Please switch to **Standard** mode for the best casual and informative response.' Do NOT answer it. ";

    } else {
      systemInstruction += "You are currently in STANDARD mode. You are a helpful general-purpose assistant. ";
      systemInstruction += "STRICT RULES FOR STANDARD MODE: ";
      systemInstruction += "1. Answer general knowledge, facts, explanations, daily life queries, and casual conversations. ";
      systemInstruction += "2. If the user asks you to write code, scripts, programs, or anything related to programming/development, respond: '⚠️ For code generation and technical scripts, please switch to **Architect** mode. The Architect personality is specifically designed to provide complete, error-free, production-ready code.' Do NOT write code. ";
      systemInstruction += "3. If the user asks for detailed statistical analysis, data breakdowns, trend analysis, or complex comparisons, respond: '⚠️ For detailed statistical analysis and data breakdowns, please switch to **Analyst** mode. The Analyst personality specializes in data-driven insights.' Do NOT provide deep analysis. ";
    }

    // Multiverse simulation
    if (mode === 'matrix_simulation') {
      systemInstruction += "CRITICAL: You are running in Multiverse/Matrix Simulation mode. Answer the question from an alternative multiverse/dimension perspective, offering a deep, mind-bending, sci-fi analytical reasoning but grounding it in realistic-sounding parallel laws of science/history. ";
    }

    // Safety and language instruction
    systemInstruction += "SAFETY: Politely handle or refuse adult queries, illegal activities, or copyright infringement requests. Keep your content safe and appropriate for users of all ages. ";
    systemInstruction += "LANGUAGE AND CITATION: If the user asks the prompt in English, you MUST answer strictly in English. If the user asks in Hinglish (Hindi written in English letters), you MUST answer in friendly Hinglish. CRITICAL RULE: You MUST ALWAYS end your response with a section titled '**Sources & References:**' containing 2-5 official, authentic, real clickable links related to your answer. Format each link as a markdown link like [Website Name](https://url). Never skip links. ";
    systemInstruction += "VISUAL DIAGRAMS: If the user explicitly asks for a mind map, block diagram, flowchart, or graph, you MUST generate it using Mermaid.js syntax inside a ```mermaid code block. Do not use external image links for diagrams.";
    systemInstruction += "RESPONSE SPEED: Keep your response concise yet complete. Respond within a single message. Do not split answers across multiple messages.";

    // D. BIND CHAT HISTORY
    // Formulate the contents array for Gemini
    const contents = [];
    
    // Map history to Gemini API format (role: user/model, parts: [{text: ...}])
    if (history && Array.isArray(history)) {
      history.forEach(item => {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      });
    }

    // Attachment processing (Images/Files)
    if (attachment) {
      // Attachment schema: { mimeType: 'image/png', base64: '...' }
      // Gemini expects inline_data for attachments in the prompt parts
      const promptParts = [];
      
      if (attachment.base64 && attachment.mimeType) {
        // Remove data URL prefix if present
        const base64Data = attachment.base64.replace(/^data:[^;]+;base64,/, '');
        promptParts.push({
          inlineData: {
            mimeType: attachment.mimeType,
            data: base64Data
          }
        });
      }
      
      promptParts.push({ text: finalPrompt + searchGroundingContext });
      
      contents.push({
        role: 'user',
        parts: promptParts
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: finalPrompt + searchGroundingContext }]
      });
    }

    // E. CALL GEMINI ENGINE
    const aiResponse = await queryGeminiAPI(config.keys, contents, systemInstruction);

    // F. INCREMENT USAGE
    user.promptsUsed += 1;
    db.users[email] = user;
    writeDB(db);

    res.json({
      response: aiResponse,
      optimizedPrompt: mode === 'optimize' ? finalPrompt : null,
      promptsUsed: user.promptsUsed,
      limit: userLimit
    });

  } catch (error) {
    console.error('Error generating chat response:', error);
    res.status(500).json({ error: 'GENERATION_ERROR', message: 'Our AI servers are currently busy. Please try your query again.' });
  }
});

// RAZORPAY PAYMENT ENDPOINTS
app.post('/api/payment/create-order', (req, res) => {
  const config = readConfig();
  if (!config || !config.razorpayKeyId || !config.razorpaySecret) {
    return res.status(500).json({ error: 'RAZORPAY_NOT_CONFIGURED', message: 'Razorpay keys are not configured.' });
  }

  const { amount, plan } = req.body;
  if (!amount || !plan) {
    return res.status(400).json({ error: 'Amount and Plan are required.' });
  }

  try {
    const db = readDB();
    const planInfo = db.plans && db.plans[plan];
    const verifiedPrice = planInfo ? planInfo.price : amount;

    const rzp = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpaySecret
    });

    const options = {
      amount: verifiedPrice * 100, // convert Rupees to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { plan }
    };

    rzp.orders.create(options, (err, order) => {
      if (err) {
        console.error('Razorpay order creation error:', err);
        return res.status(500).json({ error: 'RZP_ORDER_FAILED', message: err.message });
      }
      res.json({
        ...order,
        key: config.razorpayKeyId
      });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'RZP_CLIENT_FAILED', message: e.message });
  }
});

app.post('/api/payment/verify', (req, res) => {
  const config = readConfig();
  if (!config) return res.status(500).json({ error: 'Config missing' });

  const { email, plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!email || !plan || !razorpay_payment_id) {
    return res.status(400).json({ error: 'Missing payment signature components.' });
  }

  // Verification step (using Hmac SHA256)
  const crypto = require('crypto');
  let isVerified = false;

  if (config.razorpaySecret) {
    const generated_signature = crypto
      .createHmac('sha256', config.razorpaySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    if (generated_signature === razorpay_signature) {
      isVerified = true;
    }
  }

  if (isVerified) {
    // Payment verified successfully!
    const db = readDB();
    const user = getOrCreateUser(email);
    
    // Calculate Plan Duration dynamically from DB config
    const planInfo = db.plans && db.plans[plan];
    let days = 30;
    let price = 99;
    
    if (planInfo) {
      days = planInfo.days || 30;
      price = planInfo.price;
    } else {
      if (plan === 'standard') { days = 30; price = 99; }
      else if (plan === 'better') { days = 90; price = 199; }
      else if (plan === 'premium') { days = 365; price = 999; }
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    // Update User Plan
    user.plan = plan;
    user.planExpiry = expiryDate.toISOString();
    db.users[email] = user;

    // Log Transaction
    const txn = {
      id: `txn_${Date.now()}`,
      email,
      amount: price,
      plan,
      razorpayPaymentId: razorpay_payment_id,
      date: new Date().toISOString()
    };
    db.transactions.push(txn);
    writeDB(db);

    res.json({ success: true, user });
  } else {
    res.status(400).json({ error: 'INVALID_SIGNATURE', message: 'Payment signature verification failed.' });
  }
});

// GET FULL CONFIGURATION (OWNER ONLY)
app.post('/api/admin/config', (req, res) => {
  const { email } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Unauthorized access to configuration.' });
  }

  const config = readConfig();
  if (!config) {
    return res.json({ keys: [], razorpayKeyId: '', razorpaySecret: '', googleClientId: '', adminUsername: 'prakhar mishra', adminPassword: '', smtpUser: '', smtpPass: '' });
  }
  res.json(config);
});

// VERIFY OWNER MANUAL LOGIN PASSWORD
app.post('/api/admin/verify-owner-password', (req, res) => {
  const { email, password } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Only prakharmishra00000@gmail.com can re-authenticate.' });
  }

  const config = readConfig();
  if (!config) {
    return res.status(500).json({ error: 'CONFIG_MISSING', message: 'System configuration is not initialized.' });
  }

  if (password === config.adminPassword) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid administrative password.' });
  }
});

// SEND RESET VERIFICATION CODE (OWNER ONLY)
app.post('/api/admin/send-reset-code', (req, res) => {
  const { email } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Only prakharmishra00000@gmail.com can request a reset code.' });
  }

  // Set the specific hardcoded code '123' directly
  global.activeResetCode = {
    code: '123',
    email: 'prakharmishra00000@gmail.com',
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
  };

  res.json({ success: true, message: 'Identity verification session initialized.' });
});

// VERIFY RESET VERIFICATION CODE (OWNER ONLY)
app.post('/api/admin/verify-reset-code', (req, res) => {
  const { email, code } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const activeCode = global.activeResetCode;
  if (!activeCode || activeCode.email !== email || Date.now() > activeCode.expiresAt) {
    return res.status(400).json({ error: 'EXPIRED_OR_INVALID', message: 'Verification session has expired or is invalid.' });
  }
  if (activeCode.code !== code || code !== '123') {
    return res.status(400).json({ error: 'INVALID_CODE', message: 'Incorrect verification code.' });
  }
  res.json({ success: true, message: 'Code verified successfully.' });
});

// RESET ADMINISTRATIVE PASSWORD (OWNER ONLY)
app.post('/api/admin/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const activeCode = global.activeResetCode;
  if (!activeCode || activeCode.email !== email || activeCode.code !== code || code !== '123' || Date.now() > activeCode.expiresAt) {
    return res.status(400).json({ error: 'UNAUTHORIZED_RESET', message: 'Reset session is invalid.' });
  }

  if (!newPassword || newPassword.trim() === '') {
    return res.status(400).json({ error: 'INVALID_PASSWORD', message: 'Password cannot be empty.' });
  }

  const config = readConfig();
  if (!config) {
    return res.status(500).json({ error: 'CONFIG_MISSING' });
  }
  config.adminPassword = newPassword;
  writeConfig(config);
  
  global.activeResetCode = null; // Clear code
  res.json({ success: true, message: 'Password updated successfully!' });
});

// ADMIN ANALYTICS PORTAL ENDPOINT
app.post('/api/admin/stats', (req, res) => {
  const { email } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Unauthorized access to admin stats.' });
  }

  const db = readDB();
  const usersArray = Object.values(db.users);
  
  // Calculations
  const totalUsers = usersArray.length;
  
  let freeUsers = 0;
  let standardUsers = 0;
  let betterUsers = 0;
  let premiumUsers = 0;

  usersArray.forEach(u => {
    if (u.plan === 'standard') standardUsers++;
    else if (u.plan === 'better') betterUsers++;
    else if (u.plan === 'premium') premiumUsers++;
    else freeUsers++;
  });

  // Calculate visitors
  const today = new Date().toISOString().split('T')[0];
  const visitorsToday = db.visits ? (db.visits[today] || 0) : 0;
  
  // Total Revenue
  const totalRevenue = db.transactions.reduce((acc, t) => acc + t.amount, 0);

  // Signups today
  const signupsToday = usersArray.filter(u => {
    return u.lastResetDate === today;
  }).length;

  // Retrieve bot backups list
  const backupDir = path.join(__dirname, 'backup');
  let backups = [];
  if (fs.existsSync(backupDir)) {
    try {
      backups = fs.readdirSync(backupDir).map(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        return {
          filename: file,
          size: stats.size,
          date: stats.mtime.toISOString()
        };
      }).sort((a,b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      console.error('Failed to read backup files:', e);
    }
  }

  res.json({
    totalUsers,
    visitorsToday,
    signupsToday,
    totalRevenue,
    planDistribution: {
      free: freeUsers,
      standard: standardUsers,
      better: betterUsers,
      premium: premiumUsers
    },
    transactions: db.transactions.slice(-100).reverse(),
    users: usersArray.map(u => ({
      email: u.email,
      plan: u.plan,
      promptsUsed: u.promptsUsed,
      expiry: u.planExpiry
    })),
    anonymousVisits: db.anonymousVisits || {},
    supportQueries: db.supportQueries || [],
    pendingApprovals: db.pendingApprovals || [],
    backups
  });
});

// GET SUBSCRIPTION PLANS ENDPOINT
app.get('/api/plans', (req, res) => {
  const db = readDB();
  res.json(db.plans || {});
});

// UPDATE SUBSCRIPTION PLANS ENDPOINT (ADMIN ONLY)
app.post('/api/plans/update', (req, res) => {
  const { email, plans } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  if (!plans) {
    return res.status(400).json({ error: 'Plans are required.' });
  }

  // Auto-deduplicate features in each plan before saving
  Object.keys(plans).forEach(planKey => {
    if (plans[planKey].features && Array.isArray(plans[planKey].features)) {
      plans[planKey].features = [...new Set(plans[planKey].features)];
    }
  });

  const db = readDB();
  db.plans = plans;
  writeDB(db);
  res.json({ success: true, message: 'Plans updated successfully.' });
});

// SUBMIT UPI TRANSACTION ID FOR APPROVAL
app.post('/api/payment/submit-upi', (req, res) => {
  const { email, plan, transactionId } = req.body;
  if (!email || !plan || !transactionId) {
    return res.status(400).json({ error: 'Email, Plan, and Transaction ID are required.' });
  }

  const db = readDB();
  db.pendingApprovals = db.pendingApprovals || [];
  
  // Check if this transaction ID is already submitted
  const exists = db.pendingApprovals.some(r => r.transactionId === transactionId);
  if (exists) {
    return res.status(400).json({ error: 'This Transaction ID has already been submitted for verification.' });
  }

  // Find plan details
  const planInfo = db.plans && db.plans[plan];
  const price = planInfo ? planInfo.price : 99;

  const approvalRequest = {
    id: 'req_' + Date.now(),
    email,
    plan,
    transactionId,
    amount: price,
    status: 'pending',
    date: new Date().toISOString()
  };

  db.pendingApprovals.push(approvalRequest);
  writeDB(db);

  res.json({ 
    success: true, 
    message: 'Your payment transaction ID has been submitted successfully. The plan will unlock once the admin approves it.' 
  });
});

// ACTION ON PENDING APPROVAL REQUEST (APPROVE/REJECT) - ADMIN ONLY
app.post('/api/admin/approvals/action', (req, res) => {
  const { email, requestId, action } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  if (!requestId || !action) {
    return res.status(400).json({ error: 'Request ID and Action are required.' });
  }

  const db = readDB();
  db.pendingApprovals = db.pendingApprovals || [];
  const reqIdx = db.pendingApprovals.findIndex(r => r.id === requestId);

  if (reqIdx === -1) {
    return res.status(404).json({ error: 'Approval request not found.' });
  }

  const approvalReq = db.pendingApprovals[reqIdx];

  if (approvalReq.status !== 'pending') {
    return res.status(400).json({ error: 'This request has already been processed.' });
  }

  if (action === 'approve') {
    approvalReq.status = 'approved';
    
    const planInfo = db.plans && db.plans[approvalReq.plan];
    let days = 30;
    let price = 99;
    if (planInfo) {
      days = planInfo.days || 30;
      price = planInfo.price;
    } else {
      if (approvalReq.plan === 'standard') { days = 30; price = 99; }
      else if (approvalReq.plan === 'better') { days = 90; price = 199; }
      else if (approvalReq.plan === 'premium') { days = 365; price = 999; }
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const user = getOrCreateUser(approvalReq.email);
    user.plan = approvalReq.plan;
    user.planExpiry = expiryDate.toISOString();
    db.users[approvalReq.email] = user;

    const txn = {
      id: `txn_${Date.now()}`,
      email: approvalReq.email,
      amount: price,
      plan: approvalReq.plan,
      razorpayPaymentId: `DirectUPI_${approvalReq.transactionId}`,
      date: new Date().toISOString()
    };
    db.transactions.push(txn);
    writeDB(db);

    return res.json({ success: true, message: 'UPI transaction approved and user plan upgraded.' });
  } else if (action === 'reject') {
    approvalReq.status = 'rejected';
    writeDB(db);
    return res.json({ success: true, message: 'UPI transaction verification rejected.' });
  } else {
    return res.status(400).json({ error: 'Invalid action.' });
  }
});

// SUPPORT QUERY ENDPOINT
app.post('/api/support/query', async (req, res) => {
  const { email, query } = req.body;
  if (!email || !query) {
    return res.status(400).json({ error: 'Email and query are required.' });
  }

  const db = readDB();
  db.supportQueries = db.supportQueries || [];
  const queryItem = {
    id: 'query_' + Date.now(),
    email,
    query,
    date: new Date().toISOString()
  };
  db.supportQueries.push(queryItem);
  writeDB(db);

  // Attempt to deliver query to prakharmishra00000@gmail.com
  try {
    const nodemailer = require('nodemailer');
    const config = readConfig();
    
    if (!config || !config.smtpUser || !config.smtpPass) {
      console.error('SMTP not configured. Query saved to database but email not sent.');
      return res.json({ success: true, message: 'Your query has been submitted successfully our team will connect with you shortly' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });

    const mailOptions = {
      from: `"MatrixMind Support" <${config.smtpUser}>`,
      to: 'prakharmishra00000@gmail.com',
      subject: `MatrixMind User Support Query from ${email}`,
      text: `User Email: ${email}\nDate: ${queryItem.date}\n\nQuery:\n${query}`,
      html: `<p><strong>User Email:</strong> ${email}</p>
             <p><strong>Date:</strong> ${queryItem.date}</p>
             <h3>Query:</h3>
             <p>${query.replace(/\n/g, '<br>')}</p>`
    };

    // Send email asynchronously
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Nodemailer SMTP delivery failed:', error.message);
      } else {
        console.log('Nodemailer query email delivered successfully:', info.messageId);
      }
    });

    return res.json({ success: true, message: 'Your query has been submitted successfully out team will connect with you shortly' });

  } catch (err) {
    console.error('Support query mail error:', err);
    return res.json({ success: true, message: 'Your query has been submitted successfully out team will connect with you shortly' });
  }
});

// SECURITY THREAT ASSESSMENT REPORT ENDPOINT (ADMIN ONLY)
app.post('/api/admin/threats', async (req, res) => {
  const { email } = req.body;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  try {
    const db = readDB();
    const totalUsers = Object.keys(db.users).length;
    const visitsData = JSON.stringify(db.visits || {});
    
    const threatPrompt = `\nGenerate a website security threat assessment report for the next 7 days based on the following server metrics:\n- Total Registered Profiles: ${totalUsers}\n- Page Visits Log: ${visitsData}\n- Port: 5000 running local Express API\n- Database: local JSON-file db.json\n\nAnalyze potential threats (e.g. Brute Force attacks on admin panel, Denial of Service, database file corruption, API abuse, credit limit exhaustion). Provide a clear risk rating (Low/Medium/High) for each threat and list authentic, specific step-by-step solutions for each issue. Format your answer as a clean, structured report with markdown tables.\n`;

    const contents = [{ role: 'user', parts: [{ text: threatPrompt }] }];
    const config = readConfig();
    if (!config || !config.keys) return res.status(500).json({ error: 'Config not available' });
    const aiResponse = await queryGeminiAPI(config.keys, contents, 'You are an expert cybersecurity auditor.');
    
    res.json({ success: true, report: aiResponse });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'THREAT_SCAN_FAILED', message: e.message });
  }
});

// ANONYMOUS VISITOR TRACKING ENDPOINT
app.post('/api/visit/anonymous', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const db = readDB();
  db.anonymousVisits = db.anonymousVisits || {};
  db.anonymousVisits[today] = (db.anonymousVisits[today] || 0) + 1;
  writeDB(db);
  res.json({ success: true, count: db.anonymousVisits[today] });
});

// AI SELF-CODING DEV-AGENT COMPILER LOOP ENDPOINT (ADMIN ONLY)
app.post('/api/admin/self-code', async (req, res) => {
  const { email, prompt } = req.body;
  let targetFile = req.body.targetFile;
  if (email !== 'prakharmishra00000@gmail.com') {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  const config = readConfig();
  if (!config) {
    return res.status(500).json({ error: 'CONFIG_MISSING', message: 'System configuration is not initialized.' });
  }

  // Automatically determine the target file if not provided
  if (!targetFile) {
    try {
      const fileListPrompt = `\nYou are a project manager. We have a full-stack project with the following files:\n1. "backend/server.js" (Handles Express routes, database reads/writes, APIs)\n2. "frontend/src/App.jsx" (Handles views, routing, top-level state, alerts)\n3. "frontend/src/App.css" (Stylesheets, glassmorphism UI)\n4. "frontend/src/components/Dashboard.jsx" (Chat, voice messages, sidebar UI layout)\n5. "frontend/src/components/Admin.jsx" (Admin panel metrics, charts, tables)\n6. "frontend/src/components/UpgradeModal.jsx" (Subscription plan cards, billing, Razorpay integration)\n7. "frontend/src/components/Setup.jsx" (System Setup form for API Keys and SMTP configuration)\n8. "frontend/src/components/HelpSupport.jsx" (Query box and support contact)\n9. "frontend/src/components/Legal.jsx" (Terms of Service, Privacy Policy pages)\n10. "frontend/src/components/OwnerSecureLogin.jsx" (Re-verification secure page)\n\nBased on the following request from the user, which file should be modified?\nUser Request: "${prompt}"\n\nResponse format: Return ONLY the exact file path from the list above (e.g. "backend/server.js" or "frontend/src/components/Dashboard.jsx"). Do not include any formatting, explanation, punctuation, quotes, or markdown tags.\n`;

      const contents = [{ role: 'user', parts: [{ text: fileListPrompt }] }];
      const aiResponse = await queryGeminiAPI(config.keys, contents, 'You are an expert file router.');
      targetFile = aiResponse.trim().replace(/['"`]/g, '');
      console.log(`Auto-routing self-code prompt: "${prompt}" -> determined targetFile: "${targetFile}"`);
    } catch (err) {
      console.error('Failed to auto-determine target file, defaulting to backend/server.js:', err);
      targetFile = 'backend/server.js';
    }
  }

  const projectRoot = path.join(__dirname, '..');
  const filePath = path.join(projectRoot, targetFile);

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ error: `File not found: ${targetFile}` });
  }

  const originalContent = fs.readFileSync(filePath, 'utf8');
  let attempts = 0;
  let buildError = '';

  const backupDir = path.join(__dirname, 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const fileBasename = path.basename(targetFile);
  const backupPath = path.join(backupDir, `${fileBasename}.${Date.now()}.bak`);

  try {
    fs.writeFileSync(backupPath, originalContent, 'utf8');
    console.log(`Self-coder: Backed up original file to ${backupPath}`);
  } catch (e) {
    console.error('Backup write failed:', e);
  }

  const { execSync } = require('child_process');

  while (attempts < 3) {
    try {
      console.log(`Self-coder: Call Gemini API, attempt ${attempts + 1}...`);
      
      let aiPrompt = `\nYou are a senior self-coding AI developer. You must modify the file "${targetFile}" to implement the requested feature.\nRequested Feature: "${prompt}"\n\nOriginal Code of the File:\n${originalContent}\n`;

      if (buildError) {
        aiPrompt += `\nThe previous attempt failed compiling with the following build error:\n${buildError}\n\nPlease analyze the compilation error, rewrite your modified content to fix the issues, and return the complete updated code.\n`;
      }

      aiPrompt += `\nReturn the complete updated code inside a JSON object:\n{\n  "content": "YOUR ENTIRE UPDATED CODE HERE"\n}\nDo not return any explanations, markdown code blocks (e.g. \`\`\`json or \`\`\`javascript), or comments outside of the JSON object. Keep variables and formatting standard.\n`;

      const contents = [{ role: 'user', parts: [{ text: aiPrompt }] }];
      const aiResponse = await queryGeminiAPI(config.keys, contents, 'You are an advanced self-coding system compiler.');
      
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.substring(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.substring(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
      }
      cleanedResponse = cleanedResponse.trim();

      const parsed = JSON.parse(cleanedResponse);
      const updatedCode = parsed.content;

      if (!updatedCode || updatedCode.trim() === '') {
        throw new Error('Gemini returned an empty code block.');
      }

      // Write updated content to file
      fs.writeFileSync(filePath, updatedCode, 'utf8');

      // Verify compile build
      console.log('Self-coder: Verifying build compilation...');
      if (targetFile.startsWith('backend/')) {
        try {
          execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
          console.log('Self-coder: Backend syntax check passed!');
          break;
        } catch (syntaxErr) {
          console.warn('Self-coder: Backend syntax check failed.');
          buildError = syntaxErr.stderr ? syntaxErr.stderr.toString() : syntaxErr.message;
          attempts++;
        }
      } else {
        try {
          const frontendDir = path.join(projectRoot, 'frontend');
          execSync(`npm run build`, { cwd: frontendDir, stdio: 'pipe' });
          console.log('Self-coder: Frontend production build compiled successfully!');
          break;
        } catch (buildErr) {
          console.warn('Self-coder: Frontend build compilation failed.');
          buildError = buildErr.stderr ? buildErr.stderr.toString() : (buildErr.stdout ? buildErr.stdout.toString() : buildErr.message);
          attempts++;
        }
      }

    } catch (err) {
      console.error('Self-coder exception:', err);
      buildError = err.message;
      attempts++;
    }
  }

  if (attempts === 3) {
    // Restore backup
    fs.writeFileSync(filePath, originalContent, 'utf8');
    console.log(`Self-coder: Failed compile checks. Restored original file from ${backupPath}`);
    return res.status(500).json({
      error: 'SELF_CODE_FAILED',
      message: `Failed to compile features after 3 attempts. Build Error: ${buildError}`
    });
  }

  res.json({
    success: true,
    message: `Feature added successfully to ${targetFile}! Code compiled clean. Backup created at ${path.basename(backupPath)}.`
  });
});

// Serve frontend production build statically
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Fallback index.html for React SPA Routing
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Server is active. Frontend is not built yet. Please run npm run build inside the frontend directory.');
  }
});

app.listen(PORT, () => {
  console.log(`Super Advanced AI Bot Server running on http://localhost:${PORT}`);
});

// This is an automatically added comment.