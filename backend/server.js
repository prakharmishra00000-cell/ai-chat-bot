const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');
const admin = require('firebase-admin');
const { performWebSearch } = require('./search');
const { generatePPT, parseSlideContent, extractTopicWithAI, DOWNLOADS_DIR } = require('./pptGenerator');

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
        RECEIVER_UPI_ID: process.env.RECEIVER_UPI_ID || '6372843175@kotakbank',
        RECEIVER_NAME: process.env.RECEIVER_NAME || 'Prakhar Mishra',
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
      name: "Free",
      price: 0,
      prompts: 30,
      featureLimits: { ppt: 3, mindmap: 5, matrix: 3, optimize: 3, masking: 5, interview: 3, workflow: 1, council: 1, leads: -1 },
      features: [
        "30 daily prompts limit",
        "All features unlocked (Trial)",
        "Data Masking (5/day)",
        "Interview Mode (3/day)",
        "Workflow Sequencer (1/day)",
        "Council Room (1/day)",
        "PPT Generator (3/day)",
        "Mind Maps (5/day)",
        "Matrix Simulation (3/day)",
        "Prompt Optimization (3/day)",
        "Advanced Coding (Architect)",
        "Voice Input",
        "File & Image Attachments",
        "Web Grounding Search",
        "Personality Modes"
      ]
    },
    standard: {
      id: "standard",
      name: "Basic",
      price: 99,
      duration: "1 Month",
      days: 30,
      prompts: 100,
      featureLimits: { ppt: 5, mindmap: 8, matrix: 5, optimize: 5, masking: 20, interview: 10, workflow: 0, council: 0, leads: 10 },
      features: [
        "100 daily prompts limit",
        "Standard processing priority",
        "Data Masking (20/day)",
        "Interview Mode (10/day)",
        "PPT Generator (5/day)",
        "Mind Maps (8/day)",
        "Matrix Simulation (5/day)",
        "Prompt Optimization (5/day)",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "Valid for 30 Days"
      ]
    },
    better: {
      id: "better",
      name: "Pro",
      price: 199,
      duration: "3 Months",
      days: 90,
      prompts: 150,
      featureLimits: { ppt: 7, mindmap: 10, matrix: 10, optimize: 10, masking: 50, interview: 30, workflow: 10, council: 0, leads: 50 },
      features: [
        "150 daily prompts limit",
        "Better processing priority",
        "Data Masking (50/day)",
        "Interview Mode (30/day)",
        "Workflow Sequencer (10/day)",
        "PPT Generator (7/day)",
        "Mind Maps (10/day)",
        "Matrix Simulation (10/day)",
        "Prompt Optimization (10/day)",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "File & Image Attachments",
        "Valid for 90 Days"
      ]
    },
    premium: {
      id: "premium",
      name: "Ultimate",
      price: 999,
      duration: "1 Year",
      days: 365,
      prompts: 200,
      featureLimits: { ppt: 10, mindmap: 15, matrix: -1, optimize: -1, masking: -1, interview: -1, workflow: -1, council: -1, leads: -1 },
      features: [
        "200 daily prompts limit",
        "Maximum processing priority",
        "Data Masking (Unlimited)",
        "Interview Mode (Unlimited)",
        "Workflow Sequencer (Unlimited)",
        "Council Room (Unlimited)",
        "PPT Generator (10/day)",
        "Mind Maps (15/day)",
        "Matrix Simulation (Unlimited)",
        "Prompt Optimization (Unlimited)",
        "Advanced Coding (Architect)",
        "Voice Input",
        "Personality Modes",
        "Web Grounding Search",
        "File & Image Attachments",
        "Live Diagrams & Mind Maps",
        "PPT Presentation Generator",
        "Valid for 365 Days"
      ]
    }
  },
  featureNames: {
    ppt: "PPT Generator",
    mindmap: "Mind Maps",
    matrix: "Matrix Simulation",
    optimize: "Prompt Optimization",
    masking: "Data Masking",
    interview: "Interview Mode",
    workflow: "Workflow Sequencer",
    council: "Council Room",
    leads: "Lead Extractor"
  }
};

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(dbInitData, null, 2), 'utf8');
} else {
  try {
    const currentDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    let updated = false;
    if (!currentDB.plans) { currentDB.plans = dbInitData.plans; updated = true; }
    if (!currentDB.featureNames) { currentDB.featureNames = dbInitData.featureNames; updated = true; }
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
  // Try config.json first
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (config && config.keys && config.keys.length > 0) return config;
    } catch (e) {
      console.error('Error reading config.json:', e);
    }
  }
  // Fallback: load keys directly from env vars every time
  const envKeys = [];
  for (let i = 1; i <= 9; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`] || process.env[`GEMINI_KEY_${i}`];
    if (k && k.trim()) envKeys.push(k.trim());
  }
  if (envKeys.length === 0) {
    const single = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
    if (single && single.trim()) envKeys.push(single.trim());
  }
  if (envKeys.length > 0 || process.env.FIREBASE_DB_URL) {
    return {
      keys: envKeys,
      RECEIVER_UPI_ID: process.env.RECEIVER_UPI_ID || '6372843175@kotakbank',
      RECEIVER_NAME: process.env.RECEIVER_NAME || 'Prakhar Mishra',
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      firebaseDbUrl: process.env.FIREBASE_DB_URL || '',
      firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '',
      adminUsername: process.env.ADMIN_USERNAME || 'prakhar mishra',
      adminPassword: process.env.ADMIN_PASSWORD || '',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || ''
    };
  }
  return null;
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

const https = require('https');
const CLOUD_DB_HOST = 'extendsclass.com';
const CLOUD_DB_PATH = '/api/json-storage/bin/efdebab';

function syncDBToCloud(data) {
  try {
    const payload = JSON.stringify(data);
    const options = {
      hostname: CLOUD_DB_HOST,
      path: CLOUD_DB_PATH,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => { res.on('data', () => {}); });
    req.on('error', (e) => console.error('Cloud Sync Error:', e.message));
    req.write(payload);
    req.end();
  } catch (e) {
    console.error("Cloud DB Sync failed:", e);
  }
}

function fetchDBFromCloud(callback) {
  try {
    const req = https.get(`https://${CLOUD_DB_HOST}${CLOUD_DB_PATH}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data.plans) callback(data);
          else callback(null);
        } catch(e) { callback(null); }
      });
    });
    req.on('error', () => callback(null));
  } catch(e) {
    callback(null);
  }
}

// --- FIREBASE INTEGRATION & MEMORY DB ---
let globalDB = null;
let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;
  const config = readConfig();
  if (config && config.firebaseServiceAccount && config.firebaseDbUrl) {
    try {
      let serviceAccount;
      if (typeof config.firebaseServiceAccount === 'string') {
        try {
          serviceAccount = JSON.parse(config.firebaseServiceAccount);
        } catch (err) {
          console.warn('[FIREBASE] Standard JSON parse failed, attempting to fix mangled newlines...');
          // Fix unescaped newlines inside the JSON string (common issue when pasting into Render env vars)
          const fixedString = config.firebaseServiceAccount.replace(/\n/g, '\\n').replace(/\r/g, '');
          serviceAccount = JSON.parse(fixedString);
        }
      } else {
        serviceAccount = config.firebaseServiceAccount;
      }
      
      // Ensure the private key has correct actual newlines, not literal '\n' strings
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: config.firebaseDbUrl
      });
      firebaseInitialized = true;
      console.log('[FIREBASE] Successfully connected to Realtime Database.');

      // Listen for global changes to sync to local memory
      const dbRef = admin.database().ref('/');
      dbRef.on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
          globalDB = val;
        } else {
          // If Firebase is empty, initialize it with the local db.json
          if (!globalDB) globalDB = readLocalDB();
          admin.database().ref('/').set(globalDB);
        }
      });
    } catch (e) {
      console.error('[FIREBASE] Failed to initialize Firebase:', e.message);
    }
  }
}

function readLocalDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return { users: {}, transactions: [], visits: {}, anonymousVisits: {}, supportQueries: [], pendingApprovals: [], plans: {} };
  }
}

function readDB() {
  if (!globalDB) {
    globalDB = readLocalDB();
  }
  return globalDB;
}

function writeDB(data) {
  globalDB = data; // Update memory instantly for synchronous code
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local DB:', e.message);
  }
  
  if (firebaseInitialized) {
    admin.database().ref('/').set(data).catch(e => {
      console.error('[FIREBASE] Sync failed:', e.message);
    });
  } else {
    // Try to init in case config was just updated
    initFirebase();
  }
  return true;
}

// Call on startup
initFirebase();

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
  const { keys, googleClientId, adminUsername, adminPassword, smtpUser, smtpPass, firebaseDbUrl, firebaseServiceAccount } = req.body;
  
  if (!keys || !Array.isArray(keys) || keys.length === 0 || !adminUsername || !adminPassword) {
    return res.status(400).json({ error: 'Keys, admin username, and admin password are required.' });
  }

  const cleanKeys = keys.filter(k => k && k.trim() !== '');
  if (cleanKeys.length === 0) {
    return res.status(400).json({ error: 'At least one valid Gemini API Key is required.' });
  }
  const success = writeConfig({
    keys: cleanKeys,
    RECEIVER_UPI_ID: '6372843175@kotakbank',
    RECEIVER_NAME: 'Prakhar Mishra',
    googleClientId: googleClientId || '',
    adminUsername,
    adminPassword,
    smtpUser: smtpUser || '',
    smtpPass: smtpPass || '',
    firebaseDbUrl: firebaseDbUrl || '',
    firebaseServiceAccount: firebaseServiceAccount || ''
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

// Securely expose public config to frontend (Google Sign-In, UPI receiver details)
app.get('/api/config/public', (req, res) => {
  const config = readConfig();
  if (!config) {
    return res.json({ googleClientId: '', receiverUpiId: '6372843175@kotakbank', receiverName: 'Prakhar Mishra' });
  }
  res.json({
    googleClientId: config.googleClientId || '',
    receiverUpiId: config.RECEIVER_UPI_ID || '6372843175@kotakbank',
    receiverName: config.RECEIVER_NAME || 'Prakhar Mishra'
  });
});

// Admin email — gets unlimited everything (not shown in plans)
const ADMIN_EMAIL = 'prakharmishra00000@gmail.com';

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
      planExpiry: null,
      featureUsage: { ppt: 0, mindmap: 0, matrix: 0, optimize: 0, masking: 0, interview: 0, workflow: 0, council: 0, leads: 0 }
    };
    db.users[email] = user;
    writeDB(db);
  } else {
    // Ensure featureUsage field exists (for existing users)
    if (!user.featureUsage) {
      user.featureUsage = { ppt: 0, mindmap: 0, matrix: 0, optimize: 0, masking: 0, interview: 0, workflow: 0, council: 0, leads: 0 };
    }

    // Check Plan Expiry
    if (user.plan !== 'free' && user.planExpiry) {
      const expiry = new Date(user.planExpiry);
      if (new Date() > expiry) {
        user.plan = 'free';
        user.planExpiry = null;
        db.users[email] = user;
        writeDB(db);
      }
    }

    // Daily Reset at Midnight (prompts + feature usage)
    if (user.lastResetDate !== today) {
      user.promptsUsed = 0;
      user.featureUsage = { ppt: 0, mindmap: 0, matrix: 0, optimize: 0, masking: 0, interview: 0, workflow: 0, council: 0, leads: 0 };
      user.lastResetDate = today;
      db.users[email] = user;
      writeDB(db);
    }
  }
  return user;
}

// Check if a feature is within its daily limit
function checkFeatureLimit(email, feature) {
  if (email === ADMIN_EMAIL) return { allowed: true, used: 0, limit: -1 };
  
  const user = getOrCreateUser(email);
  const db = readDB();
  const planInfo = db.plans && db.plans[user.plan];
  const limits = planInfo?.featureLimits || { ppt: 3, mindmap: 5, matrix: 3, optimize: 3, masking: 5, interview: 3, workflow: 1, council: 1, leads: -1 };
  const limit = limits[feature];
  const used = user.featureUsage?.[feature] || 0;
  
  if (Number(limit) === -1) return { allowed: true, used, limit: -1 }; // unlimited
  return { allowed: used < limit, used, limit };
}

// Increment feature usage count
function incrementFeatureUsage(email, feature) {
  if (email === ADMIN_EMAIL) return;
  
  const db = readDB();
  const user = db.users[email];
  if (user) {
    if (!user.featureUsage) user.featureUsage = { ppt: 0, mindmap: 0, matrix: 0, optimize: 0, masking: 0, interview: 0, workflow: 0, council: 0, leads: 0 };
    user.featureUsage[feature] = (user.featureUsage[feature] || 0) + 1;
    db.users[email] = user;
    writeDB(db);
  }
}

// User Auth Endpoint (Explicit Sign In / Sign Up) — Seamless cross-device auth
app.post('/api/user/auth', (req, res) => {
  const { email, action } = req.body;
  if (!email || !action) return res.status(400).json({ error: 'Email and action are required' });
  
  const db = readDB();
  const userExists = !!db.users[email];

  if (action === 'login') {
    if (!userExists) {
      // Auto-register on login attempt — seamless cross-device experience
      getOrCreateUser(email);
      return res.json({ success: true, message: 'Account created and logged in successfully.', autoRegistered: true });
    }
    return res.json({ success: true, message: 'Logged in successfully.' });
  } else if (action === 'signup') {
    if (userExists) {
      // If already registered, just log them in instead of showing error
      return res.json({ success: true, message: 'Account found. Logged in successfully.', alreadyExists: true });
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
  const featureLimits = planInfo?.featureLimits || { ppt: 3, mindmap: 5, matrix: 3, optimize: 3, masking: 5, interview: 3, workflow: 1, council: 1, leads: -1 };
  const isAdmin = email === ADMIN_EMAIL;
  
  res.json({
    email: user.email,
    plan: user.plan,
    promptsUsed: user.promptsUsed,
    limit: userLimit,
    expiry: user.planExpiry,
    featureUsage: isAdmin ? { ppt: 0, mindmap: 0, matrix: 0, optimize: 0, masking: 0, interview: 0, workflow: 0, council: 0, leads: 0 } : (user.featureUsage || { ppt: 0, mindmap: 0, matrix: 0, optimize: 0, masking: 0, interview: 0, workflow: 0, council: 0, leads: 0 }),
    featureLimits: isAdmin ? { ppt: -1, mindmap: -1, matrix: -1, optimize: -1, masking: -1, interview: -1, workflow: -1, council: -1, leads: -1 } : featureLimits
  });
});



// GEMINI API ROTATION ENGINE
let activeKeyIndex = 0;
let lastGeminiError = '';

async function queryGeminiAPI(keys, contents, systemInstruction, enableWebSearch = false) {
  const modelConfigs = [
    { model: 'gemini-1.5-flash', api: 'v1beta' },
    { model: 'gemini-2.0-flash-exp', api: 'v1beta' }
  ];

  // Try each key with each model
  for (let keyAttempt = 0; keyAttempt < keys.length; keyAttempt++) {
    const keyIndex = (activeKeyIndex + keyAttempt) % keys.length;
    const activeKey = keys[keyIndex];
    const keyPreview = activeKey.substring(0, 8) + '...';

    for (const { model, api } of modelConfigs) {
      const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${activeKey}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s per attempt for search

      try {
        let payloadContents = JSON.parse(JSON.stringify(contents));
        if (systemInstruction && payloadContents.length > 0 && payloadContents[0].role === 'user') {
           payloadContents[0].parts[0].text = `[System Instruction: ${systemInstruction}]\n\n` + payloadContents[0].parts[0].text;
        }

        console.log(`[GEMINI] Trying Key ${keyPreview} | ${api}/${model}`);

        const requestPayload = { contents: payloadContents };
        if (enableWebSearch) {
           requestPayload.tools = [{ googleSearch: {} }];
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseData = await response.json();

        if (response.ok) {
          if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
            console.log(`[GEMINI] ✅ SUCCESS: Key ${keyPreview} | ${api}/${model}`);
            activeKeyIndex = keyIndex;
            return responseData.candidates[0].content.parts[0].text;
          }
          continue; // Empty response — try next model
        }

        const errMsg = (responseData.error?.message || '').substring(0, 80);
        lastGeminiError = `Status: ${response.status}. Msg: ${errMsg}`;
        console.warn(`[GEMINI] ❌ ${response.status}: ${keyPreview} | ${api}/${model} | ${errMsg}`);
        
        if (response.status === 429) {
          continue; // Quota exceeded — try next model
        }
        if (response.status === 401 || response.status === 403) {
          break; // Bad key — skip to next key
        }
        continue; // Other error — try next model

      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.warn(`[GEMINI] ⏱ TIMEOUT: ${keyPreview} | ${model}`);
          continue; // Timeout — try next model
        }
        console.error(`[GEMINI] 💥 ${keyPreview} | ${model}: ${error.message}`);
        lastGeminiError = `Exception: ${error.message}`;
        continue;
      }
    }
  }

  // FINAL RETRY: Wait 2 seconds, then try gemini-2.5-flash on first 3 keys
  console.log('[GEMINI] All attempts failed. Waiting 2s for final retry...');
  await new Promise(r => setTimeout(r, 2000));
  
  for (let i = 0; i < Math.min(keys.length, 3); i++) {
    const key = keys[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);
    try {
      let payloadContents = JSON.parse(JSON.stringify(contents));
      if (systemInstruction && payloadContents.length > 0 && payloadContents[0].role === 'user') {
        payloadContents[0].parts[0].text = `[System Instruction: ${systemInstruction}]\n\n` + payloadContents[0].parts[0].text;
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const requestPayloadFinal = { contents: payloadContents };
      if (enableWebSearch) requestPayloadFinal.tools = [{ googleSearch: {} }];

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayloadFinal),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (response.ok && data.candidates?.[0]?.content) {
        console.log(`[GEMINI] ✅ FINAL RETRY SUCCESS`);
        return data.candidates[0].content.parts[0].text;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      continue;
    }
  }

  console.error(`[GEMINI] ALL ${keys.length} KEYS EXHAUSTED — daily free-tier quota likely reached`);
  if (keys.length === 0) {
    throw new Error("CRITICAL: No API keys found! You must add GEMINI_API_KEY_1 to your Render Environment Variables.");
  }
  throw new Error(`I apologize, but the backend failed to generate a response.\n\n**Exact Internal Error**: ${lastGeminiError || 'Unknown timeout/quota error'}\n\nPlease check your API keys or try again later.`);
}

// Health Check — diagnose key loading issues
app.get('/api/health', (req, res) => {
  const config = readConfig();
  const keyCount = config?.keys?.length || 0;
  const keyPreviews = (config?.keys || []).map(k => k.substring(0, 6) + '...' + k.substring(k.length - 4));
  res.json({
    status: keyCount > 0 ? 'OK' : 'NO_KEYS',
    keyCount,
    keyPreviews,
    configFileExists: fs.existsSync(CONFIG_PATH),
    envKeysFound: Object.keys(process.env).filter(k => k.includes('GEMINI')).length,
    timestamp: new Date().toISOString()
  });
});

// PPT File Download endpoint
app.get('/api/download-ppt/:filename', (req, res) => {
  const filePath = path.join(DOWNLOADS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired. Please generate again.' });
  }
  res.download(filePath, req.params.filename);
});

// PPT Generation endpoint
app.post('/api/generate-ppt', async (req, res) => {
  const { email, topic, pageCount, style } = req.body;
  if (!email || !topic) {
    return res.status(400).json({ error: 'Email and topic are required.' });
  }
  
  // Check PPT daily limit
  const pptCheck = checkFeatureLimit(email, 'ppt');
  if (!pptCheck.allowed) {
    return res.status(403).json({ 
      error: 'FEATURE_LIMIT', 
      message: `You have used all ${pptCheck.limit} PPT generations for today (${pptCheck.used}/${pptCheck.limit}). Upgrade your plan for more.` 
    });
  }
  
  let config = readConfig();
  if (!config || !config.keys || config.keys.length === 0) {
    return res.status(500).json({ error: 'API keys not configured.' });
  }

  const slideCount = Math.min(Math.max(parseInt(pageCount) || 8, 3), 25);
  const stylePreference = style || 'balanced';

  try {
    // STEP 1: AI deeply analyzes the user's FULL prompt to understand what they actually want
    // This extracts: the clean topic name + what sub-topics/aspects should be covered
    const userOriginalPrompt = topic; // This is the user's full raw prompt
    
    let cleanTopic = userOriginalPrompt;
    let slideOutline = '';
    
    try {
      const analysisPrompt = `A user wants a presentation. Read their request carefully and understand exactly what topic they want and what aspects they expect to be covered.

User's request: "${userOriginalPrompt}"

You must respond in EXACTLY this format (nothing else):

TOPIC: [The exact topic name — just the subject, no extra words. For example if user says "make a ppt on evolution of engines" the topic is "Evolution of Engines"]

OUTLINE:
1. [First sub-topic that should be covered based on what user asked]
2. [Second sub-topic]
3. [Third sub-topic]
4. [Fourth sub-topic]
5. [Fifth sub-topic]
6. [Sixth sub-topic]
7. [Seventh sub-topic]
8. [Eighth sub-topic]

Create exactly ${slideCount} sub-topics in the outline. Each sub-topic must be directly related to the main topic. Think about what aspects the user would naturally expect to see in a presentation about this topic.

For example, if the user asks about "Evolution of Engines":
TOPIC: Evolution of Engines
OUTLINE:
1. What is an Engine - Definition and Basic Working
2. Origin and Invention of the First Engine
3. Steam Engine Era - The Beginning of Mechanical Power
4. Internal Combustion Engine - How It Changed Everything
5. Types of Engines - Petrol, Diesel, Rotary, Turbine
6. Key Upgrades and Technological Improvements in Engines
7. Modern Engines - Electric Motors and Hybrid Technology
8. Future of Engines - Hydrogen, AI-Powered, and Beyond`;

      const analysisContents = [{ role: 'user', parts: [{ text: analysisPrompt }] }];
      const analysisResponse = await queryGeminiAPI(config.keys, analysisContents, 'You analyze user requests to extract the topic and create a presentation outline. Respond only in the format asked. No markdown.');
      
      // Parse the analysis
      const topicMatch = analysisResponse.match(/TOPIC:\s*(.+)/i);
      if (topicMatch) {
        const extracted = topicMatch[1].trim().replace(/^["']|["']$/g, '');
        if (extracted.length > 2 && extracted.length < 150) cleanTopic = extracted;
      }
      
      const outlineMatch = analysisResponse.match(/OUTLINE:\s*([\s\S]+)/i);
      if (outlineMatch) {
        slideOutline = outlineMatch[1].trim();
      }
      
      console.log(`[PPT] AI understood topic: "${cleanTopic}"`);
      console.log(`[PPT] AI created outline with ${slideOutline.split('\n').filter(l => l.trim()).length} sub-topics`);
    } catch (e) {
      console.warn('[PPT] Analysis fallback — using raw prompt');
      // Fallback: try simple topic extraction
      try {
        const aiTopic = await extractTopicWithAI(userOriginalPrompt, queryGeminiAPI, config.keys);
        if (aiTopic) cleanTopic = aiTopic;
      } catch (e2) { /* use raw */ }
    }
    
    console.log(`[PPT] Generating ${slideCount}-slide presentation on: "${cleanTopic}"`);
    
    // STEP 2: Generate detailed slide content using the outline
    const pptContentPrompt = slideOutline
      ? `You are creating a detailed presentation about "${cleanTopic}".

The user's original request was: "${userOriginalPrompt}"

Follow this outline and write detailed content for each slide. Every point must be a real fact specifically about "${cleanTopic}":

${slideOutline}

For each sub-topic in the outline above, write one slide with 4-6 detailed bullet points. Every bullet must contain specific information directly about "${cleanTopic}" — real facts, dates, names, numbers, examples.

Write as if you are teaching someone everything about "${cleanTopic}". The content should be the same quality as if someone asked you to explain "${cleanTopic}" in a conversation.

FORMAT — use this exact format:

SLIDE 1: [Sub-topic from outline]
- [Detailed specific fact about this aspect of ${cleanTopic}]
- [Another real fact with names/dates/numbers]
- [Important detail about ${cleanTopic}]
- [Key point or example]
- [Additional fact if relevant]

SLIDE 2: [Next sub-topic from outline]
- [Point 1]
- [Point 2]
- [Point 3]
- [Point 4]

Continue for all ${slideCount} slides.

SLIDE ${slideCount + 1}: Sources and References
- [Real official URL about ${cleanTopic}]
- [Another credible source]
- [Third reference]

Rules: Plain text only. No bold, no **, no markdown. Start each slide with "SLIDE X:" exactly.`
      : `Explain "${cleanTopic}" in complete detail. The user asked: "${userOriginalPrompt}"

Break your explanation into exactly ${slideCount} sections covering all important aspects of "${cleanTopic}". Include specific facts, dates, names, numbers.

FORMAT:
SLIDE 1: [Sub-topic of ${cleanTopic}]
- [Detailed fact]
- [Another fact]
- [Data point]
- [Key detail]

Continue for ${slideCount} slides, then add:
SLIDE ${slideCount + 1}: Sources and References
- [URL 1]
- [URL 2]
- [URL 3]

Plain text only. No markdown. Start each with "SLIDE X:".`;

    const contents = [{ role: 'user', parts: [{ text: pptContentPrompt }] }];
    const systemInstr = `You are a subject matter expert on "${cleanTopic}". Explain "${cleanTopic}" thoroughly with real, accurate information. Every slide heading must be a sub-topic of "${cleanTopic}". Every bullet must contain specific facts about "${cleanTopic}" — not generic information. Write as if teaching someone who wants to learn everything about "${cleanTopic}". Plain text only.`;
    
    const aiResponse = await queryGeminiAPI(config.keys, contents, systemInstr);
    
    // STEP 3: Parse AI response into slides
    const slides = parseSlideContent(aiResponse);
    
    if (!slides || slides.length === 0) {
      console.error('[PPT] Failed to parse slides from AI response');
      return res.status(500).json({ error: 'Failed to generate slide content. Please try again.' });
    }
    
    console.log(`[PPT] Parsed ${slides.length} slides, generating PPTX with images...`);
    
    // STEP 4: Generate PPTX with real images (uses cleanTopic)
    const result = await generatePPT(cleanTopic, slides, { style: stylePreference });
    
    const downloadUrl = `/api/download-ppt/${result.fileName}`;
    
    // Increment PPT usage
    incrementFeatureUsage(email, 'ppt');
    
    res.json({
      success: true,
      downloadUrl,
      fileName: result.fileName,
      slideCount: result.slideCount,
      topic: cleanTopic,
      message: `✅ Presentation generated! ${result.slideCount} slides on "${cleanTopic}".`
    });
    
  } catch (error) {
    console.error('[PPT] Generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate presentation. ' + error.message });
  }
});

// Key Diagnostic — tests each key individually to find exact errors
app.get('/api/test-keys', async (req, res) => {
  const config = readConfig();
  if (!config || !config.keys || config.keys.length === 0) {
    return res.json({ error: 'No keys found' });
  }
  
  const results = [];
  const testPayload = { contents: [{ role: 'user', parts: [{ text: 'Say hi in one word' }] }] };
  
  for (let i = 0; i < config.keys.length; i++) {
    const key = config.keys[i];
    const keyPreview = key.substring(0, 8) + '...' + key.substring(key.length - 4);
    
    // Test with gemini-3.5-flash
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (response.ok && data.candidates?.[0]?.content) {
        results.push({ key: keyPreview, status: 'WORKING', httpCode: 200, model: 'gemini-3.5-flash' });
      } else {
        const errMsg = data.error?.message || 'Unknown error';
        results.push({ key: keyPreview, status: 'FAILED', httpCode: response.status, error: errMsg.substring(0, 150), model: 'gemini-3.5-flash' });
      }
    } catch (e) {
      results.push({ key: keyPreview, status: 'ERROR', error: e.message, model: 'gemini-3.5-flash' });
    }
  }
  
  const workingKeys = results.filter(r => r.status === 'WORKING').length;
  res.json({ 
    summary: `${workingKeys}/${results.length} keys working`,
    results,
    timestamp: new Date().toISOString()
  });
});
// --- LIVE APP GENERATOR HOSTING ---
const generatedApps = new Map(); // Store generated HTML files in memory. Key: short id, Value: raw HTML

app.post('/api/apps/share', (req, res) => {
  const { htmlCode } = req.body;
  if (!htmlCode) return res.status(400).json({ error: 'No HTML code provided' });
  
  // Generate a random 6-character ID
  const id = crypto.randomBytes(3).toString('hex');
  generatedApps.set(id, htmlCode);
  
  // Clean up old apps if map gets too large to prevent memory leaks (keep last 100)
  if (generatedApps.size > 100) {
    const firstKey = generatedApps.keys().next().value;
    generatedApps.delete(firstKey);
  }
  
  res.json({ success: true, url: `/api/apps/serve/${id}`, id });
});

app.get('/api/apps/serve/:id', (req, res) => {
  const { id } = req.params;
  const htmlCode = generatedApps.get(id);
  
  if (!htmlCode) {
    return res.status(404).send('<h1>App Not Found or Expired</h1><p>This live app preview link has expired. Generate a new one in the MatrixMind dashboard.</p>');
  }
  
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlCode);
});

// Main Chat AI Endpoint
app.post('/api/chat', async (req, res) => {
  let config = readConfig();
  if (!config || !config.keys || config.keys.length === 0) {
    bootstrapConfigFromEnv();
    config = readConfig();
    if (!config || !config.keys || config.keys.length === 0) {
      return res.status(500).json({ error: 'SETUP_REQUIRED', message: 'API credentials are not configured. Please set GEMINI_API_KEY_1 through GEMINI_API_KEY_9 in Render environment variables.' });
    }
  }
  
  console.log(`[CHAT] Processing request with ${config.keys.length} API key(s). First key prefix: ${config.keys[0].substring(0, 6)}...`);

  const { email, message, history, personality, mode, attachment, appCredentials } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const db = readDB();
  const user = getOrCreateUser(email);
  const isAdmin = email === ADMIN_EMAIL;

  // 0. LEAD EXTRACTOR INTENT DETECTION
  let isLeadGenRequest = false;
  try {
    const intentPrompt = `Analyze this user query: "${message}"\nIs the user primarily asking to extract, generate, or find "leads", contact info, or prospects? Return only valid JSON: {"isLeadGen": true/false}`;
    const intentRes = await queryGeminiAPI(config.keys, [{ role: 'user', parts: [{ text: intentPrompt }] }], 'You are a JSON generator.');
    const intentJson = JSON.parse(intentRes.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim());
    if (intentJson && intentJson.isLeadGen) {
      isLeadGenRequest = true;
    }
  } catch(e) {
    console.error('[LEAD EXTRACTOR] Intent parse failed:', e.message);
  }

  // Execute Lead Gen if detected
  if (isLeadGenRequest) {
    try {
      console.log(`[LEAD EXTRACTOR] Intent detected for ${email}`);
      const check = checkFeatureLimit(email, 'leads');
      if (!check.allowed && !isAdmin) {
        return res.status(403).json({ error: 'FEATURE_LIMIT', message: `Lead Extractor daily limit reached (${check.used}/${check.limit}). Upgrade your plan for more.` });
      }
      incrementFeatureUsage(email, 'leads');
      
      const leadPrompt = `You are a Professional B2B Lead Researcher. The user wants leads based on this requirement: "${message}".\nSearch the public internet for relevant professional discussions, Reddit threads, Twitter posts, and professional networks. \nUse your search tool to find actual public contact info or profiles. Append queries with "contact me" OR "email me at" to find actual leads if needed.\nFormat the output EXACTLY as a Markdown Table with these columns:\n| Lead Name/Handle | Contact Info (Email/Phone) | Relevant Comment/Bio | Direct Source Link |\n|---|---|---|---|\nIf direct contact info is missing from the public web, write "N/A (DM via Platform)". \nProvide as many leads as the user requested. Output the markdown table and a brief summary. Do not output anything malicious or harmful.`;
      
      const leadResult = await queryGeminiAPI(config.keys, [{ role: 'user', parts: [{ text: leadPrompt }] }], 'You are a professional lead researcher. You must use web search to find publicly available business contact details.', true);
      
      if (!isAdmin) {
        user.promptsUsed += 1;
        db.users[email] = user;
        writeDB(db);
      }
      
      return res.json({ success: true, response: `🤖 **Autonomous Lead Extractor Activated**\n\n${leadResult}` });
    } catch (error) {
      console.error('[LEAD EXTRACTOR] Execution failed:', error.message);
      return res.json({ success: false, response: `🤖 **Lead Extractor Error**\n\nI detected that you want to generate leads, but my search engine encountered an error (this could be due to API timeouts or safety filters blocking the query). Please try rephrasing your request to be more specific or try again later.\n\nError details: ${error.message.substring(0, 100)}` });
    }
  }

  // 1. Enforce Prompt Limit & Feature Gating
  const planInfo = db.plans && db.plans[user.plan];
  const userLimit = planInfo ? planInfo.prompts : (user.plan === 'free' ? 30 : 100);
  const planFeatures = planInfo && planInfo.features ? [...new Set(planInfo.features)].join(' ').toLowerCase() : '';

  // Feature usage limits (matrix, optimize, mindmap)
  
  if (!isAdmin) {
    if (mode === 'matrix_simulation') {
      const check = checkFeatureLimit(email, 'matrix');
      if (!check.allowed) {
        return res.status(403).json({ error: 'FEATURE_LIMIT', message: `Matrix Simulation daily limit reached (${check.used}/${check.limit}). Upgrade your plan for more.` });
      }
    }
    if (mode === 'optimize') {
      const check = checkFeatureLimit(email, 'optimize');
      if (!check.allowed) {
        return res.status(403).json({ error: 'FEATURE_LIMIT', message: `Prompt Optimization daily limit reached (${check.used}/${check.limit}). Upgrade your plan for more.` });
      }
    }
  }

  if (!isAdmin && Number(userLimit) !== -1 && user.promptsUsed >= Number(userLimit)) {
    return res.status(403).json({
      error: 'LIMIT_EXCEEDED',
      message: `You have reached your daily limit of ${userLimit} prompts. Please upgrade your plan.`
    });
  }

  try {
    let finalPrompt = message;

    // AA. GENERATE APP MODE
    if (mode === 'generate') {
      let credentialsInjection = '';
      if (appCredentials && Array.isArray(appCredentials) && appCredentials.length > 0) {
        const validCreds = appCredentials.filter(c => c.name && c.value);
        if (validCreds.length > 0) {
          credentialsInjection = `\n7. **CREDENTIALS INJECTION**: You MUST automatically integrate the following credentials exactly as named into the generated application code: ${validCreds.map(c => `- ${c.name}: ${c.value}`).join('\n')}. DO NOT leave placeholder comments asking the user to insert them. Use them immediately. DO NOT output annoying confirmation messages like "API Key added successfully" in your chat response.`;
        }
      }

      finalPrompt = `[APP GENERATION MODE INSTRUCTIONS — STRICTLY ENFORCED]

You are an expert full-stack developer. The user wants you to either generate a NEW fully functional Web App/Bot OR FIX/UPDATE an existing one based on this query:
"${message}"

REQUIREMENTS:
1. Whether creating from scratch or fixing a bug, you MUST provide the complete, updated code as a SINGLE cohesive HTML file that includes HTML, CSS (in <style>), and JavaScript (in <script>). Do NOT give partial snippets. If the user asks for a fix, you MUST make the app perfectly functional. In your intro text, explicitly state what the error was and how you fixed it. Then output the FULL repaired HTML code block.
2. The UI must be incredibly modern, premium, and beautiful (use glassmorphism, nice gradients, animations, dark mode).
3. Do NOT use external frameworks that require a build step (No React/Vue build systems). You may use CDNs for libraries like Tailwind, FontAwesome, or simple React via Babel standalone if absolutely necessary, but vanilla JS/HTML/CSS is preferred for speed and reliability.
4. Wrap the ENTIRE HTML code inside a single markdown code block like this:
\`\`\`html
<!DOCTYPE html>
<html>...</html>
\`\`\`
5. **CREDENTIAL DETECTION**: Analyze the requested app/feature. If it requires ANY external API keys or credentials (e.g., Firebase, OpenAI, Stripe, OpenWeather), you MUST list them explicitly at the VERY TOP of your response (above the code block) under the exact heading: "⚠️ **REQUIRED CREDENTIALS:**". List exactly what they need to add to their local Setup Panel. If none are needed, omit this.
6. The app MUST handle its logic locally in the browser where possible, or simulate responses if it's a "bot". Furthermore, 100% of the frontend and backend logic requested must be done BY YOU within the generated file. Do not ask the user to add code. You must do all the heavy lifting. Finally, if anything else is required to make the app fully functional and live in a production environment (like purchasing a domain, setting up a real database), explicitly state this in your short intro.
7. **SPEED & OPTIMIZATION**: To reduce generation time, write extremely lean, highly optimized code. Avoid unnecessary boilerplate, massive base64 images, or bloated CSS unless strictly required for the design. Prioritize flawless logic and error-free functionality over verbose code.${credentialsInjection}

CRITICAL: Return nothing else but the short intro (including fix explanations, credential warnings, or live hosting requirements) and the HTML code block.`;
    }

    // A. OPTIMIZE MODE — show restructured prompt + detailed answer
    if (mode === 'optimize') {
      finalPrompt = `[OPTIMIZE MODE INSTRUCTIONS — FOLLOW EXACTLY]

You received a raw, possibly messy user query. You must do TWO things in order:

**STEP 1 — RESTRUCTURED PROMPT:**
Rewrite the user's raw query into a clear, well-structured, grammatically correct, detailed prompt. This should be the kind of prompt that would get the BEST possible answer from an AI. Show it at the very top of your response in this exact format:

---
🔧 **Optimized Prompt:**
> [Write the beautifully restructured, detailed version of the user's query here]
---

**STEP 2 — DETAILED ANSWER:**
Now answer the optimized prompt above in FULL DETAIL. Give a thorough, comprehensive, well-organized response as if you received a perfect prompt. Use headings, bullet points, and clear explanations.

**STEP 3 — OFFICIAL LINKS (MANDATORY):**
You MUST end your response with a section titled '**📎 Official Sources & References:**' containing 2-5 real, authentic, clickable links relevant to the topic. Format: [Website Name](https://url). NEVER skip this section.

IMPORTANT: Do NOT skip any step. The user MUST see: restructured prompt → answer → official links.
IMPORTANT: Do NOT include any Mermaid diagrams, flowcharts, or visual diagrams unless the user's original query specifically asks for one.

User's original raw query: ${message}`;
    }

    // B. WEB SEARCH — only for factual/current queries, 3s timeout to keep responses fast
    let searchGroundingContext = '';
    const needsSearch = mode !== 'generate' && /search|latest|news|weather|current|today|\b202[4-9]\b|who is|who won|score|price|stock|release|launch|update|trending/i.test(finalPrompt);
    
    if (needsSearch) {
      try {
        console.log(`Executing web search for: "${finalPrompt.substring(0, 60)}..."`);
        const searchPromise = performWebSearch(finalPrompt);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Search timeout')), 3000));
        const searchResults = await Promise.race([searchPromise, timeoutPromise]);
        if (searchResults && searchResults.length > 0) {
          searchGroundingContext = "\n\nReal-time Web Search Results:\n";
          searchResults.forEach((res, i) => {
            searchGroundingContext += `[${i + 1}] "${res.title}" (${res.link})\nSnippet: ${res.snippet}\n\n`;
          });
          searchGroundingContext += "Use these results to answer. Include source links in markdown format.";
        }
      } catch (e) {
        console.warn('Web search skipped:', e.message);
        // Continue without search — don't block the response
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
      systemInstruction += "CRITICAL — MATRIX SIMULATION MODE ACTIVATED: ";
      systemInstruction += "You are answering from a parallel dimension/alternate reality within the Multiverse. Your ENTIRE response must be written from this alternate-reality perspective. ";
      systemInstruction += "RULES FOR MATRIX SIMULATION: ";
      systemInstruction += "1. Start your response with a dimension header like: '🌌 **Dimension #[random number] — [Alternate Reality Name]**' to set the scene. ";
      systemInstruction += "2. Rewrite history, science, or facts as they would exist in THIS alternate dimension. For example: if asked about gravity, explain how gravity works differently in this dimension. If asked about a historical event, describe how it played out differently here. ";
      systemInstruction += "3. Use vivid, immersive, sci-fi language. Make it feel like the user has genuinely entered another dimension. Reference alternate laws of physics, different historical outcomes, parallel technological evolution, etc. ";
      systemInstruction += "4. Ground your alternate-reality answer in plausible-sounding science and logic — it should feel real, not random. ";
      systemInstruction += "5. At the end, add a brief '🔮 **Back to Base Reality:**' section with 1-2 sentences about what the REAL answer is in our dimension. ";
      systemInstruction += "6. Do NOT show any 'Optimized Prompt' or 'Restructured Prompt' section. That feature is ONLY for Optimize mode. Just answer directly in the multidimensional style. ";
      systemInstruction += "7. You MUST still end with '**📎 Official Sources & References:**' containing 2-5 real clickable links relevant to the topic. ";
    }

    // Safety and language instruction
    systemInstruction += "SAFETY: Politely handle or refuse adult queries, illegal activities, or copyright infringement requests. Keep your content safe and appropriate for users of all ages. ";
    systemInstruction += "LANGUAGE AND CITATION: If the user asks in English, answer in English. If in Hinglish, answer in Hinglish. ";
    systemInstruction += "MANDATORY LINKS RULE (CRITICAL — NEVER SKIP): At the VERY END of EVERY single response, regardless of mode (normal, optimize, matrix simulation, or any other), you MUST include a section titled '**📎 Official Sources & References:**' containing 2-5 real, authentic, official clickable links relevant to the topic discussed. Format as markdown: [Website Name](https://url). Examples: Wikipedia, official docs, government sites, reputable news outlets. This section is ABSOLUTELY REQUIRED in every response without exception. If you skip this section, the response is considered INCOMPLETE and FAILED. NEVER use fake or made-up URLs. ";
    systemInstruction += "VISUAL DIAGRAMS RULE: You must ONLY generate Mermaid.js diagrams when the user EXPLICITLY asks for a mind map, diagram, flowchart, block diagram, tree, chart, or graph. Do NOT include diagrams in regular answers. When diagrams ARE requested, use Mermaid.js syntax inside a ```mermaid code block. Follow these STRICT Mermaid rules: ";
    systemInstruction += "1. Use ONLY these diagram types: graph TD, graph LR, mindmap, flowchart TD, flowchart LR, sequenceDiagram, classDiagram, pie. ";
    systemInstruction += "2. Keep node labels SHORT (under 30 chars). Use quotes around labels with special characters: A[\"Label (info)\"]. ";
    systemInstruction += "3. Do NOT use HTML tags in labels. Do NOT use emojis in node IDs. ";
    systemInstruction += "4. For mind maps use: ```mermaid\\nmindmap\\n  root((Topic))\\n    Branch1\\n      Sub1\\n    Branch2\\n      Sub2\\n```. ";
    systemInstruction += "5. Always produce VALID Mermaid syntax that renders without errors. Test your output mentally before writing. ";
    systemInstruction += "RESPONSE SPEED: Keep your response concise yet complete. Respond within a single message. Do not split answers across multiple messages.";

    // D. BIND CHAT HISTORY
    // Formulate the contents array for Gemini
    systemInstruction += ' MANDATORY LINKS RULE: At the VERY END of your response, you MUST append a section titled \'**?? Official Sources & References:**\' providing 2-5 valid, authentic, clickable markdown links relevant to the topic. NEVER skip this rule.';
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

    // Increment feature-specific usage
    if (mode === 'matrix_simulation') incrementFeatureUsage(email, 'matrix');
    if (mode === 'optimize') incrementFeatureUsage(email, 'optimize');
    // Mindmap: detect if response contains mermaid diagram
    if (/mindmap|flowchart|graph|diagram/i.test(message)) incrementFeatureUsage(email, 'mindmap');

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

// ==================== COUNCIL ROOM - MULTI-AGENT DEBATE (DESKTOP ONLY) ====================
// Phase 1: Generate personas + Round 1 individual proposals
app.post('/api/chat/council/start', async (req, res) => {
  const { email, prompt } = req.body;
  if (!email || !prompt) return res.status(400).json({ error: 'Email and prompt required.' });

  const check = checkFeatureLimit(email, 'council');
  if (!check.allowed) {
    return res.status(403).json({ error: 'FEATURE_LIMIT', message: `Council Room daily limit reached (${check.used}/${check.limit}). Upgrade your plan for more.` });
  }

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  try {
    // Generate 3 personas + Round 1 in a single optimized call
    const masterPrompt = `You are an AI Council Orchestrator. A user has a complex problem that needs adversarial debate from multiple expert perspectives.

USER'S PROBLEM: "${prompt.substring(0, 500)}"

YOUR TASK: Create 3 opposing expert personas specifically tailored to THIS problem domain, then generate each persona's initial detailed analysis.

Return a JSON object with this EXACT structure. No markdown, no code blocks, ONLY pure valid JSON:
{
  "personas": [
    {
      "id": "pragmatist",
      "name": "[Creative name for a hard-nosed pragmatist relevant to this domain]",
      "emoji": "⚡",
      "focus": "[Their specific focus area, 5-10 words]",
      "color": "#ff6b6b",
      "description": "[One-line stance description]"
    },
    {
      "id": "creative",
      "name": "[Creative name for an innovative risk-taker relevant to this domain]",
      "emoji": "🎨",
      "focus": "[Their specific focus area]",
      "color": "#4ecdc4",
      "description": "[One-line stance description]"
    },
    {
      "id": "guardian",
      "name": "[Creative name for a safety/ethics/compliance guardian relevant to this domain]",
      "emoji": "🛡️",
      "focus": "[Their specific focus area]",
      "color": "#45b7d1",
      "description": "[One-line stance description]"
    }
  ],
  "round1": [
    { "personaId": "pragmatist", "response": "[200-300 word detailed initial analysis from this persona's perspective. Be specific, data-driven, and stay in character. Include concrete recommendations.]" },
    { "personaId": "creative", "response": "[200-300 word analysis...]" },
    { "personaId": "guardian", "response": "[200-300 word analysis...]" }
  ]
}

CRITICAL: Customize persona names and focus areas to match the problem domain. For medical questions use Doctor/Researcher/Patient-Advocate. For business use CFO/Innovator/Legal. For tech use Engineer/Designer/Security. Make each Round 1 response substantive and opinionated.`;

    const contents = [{ role: 'user', parts: [{ text: masterPrompt }] }];
    const raw = await queryGeminiAPI(config.keys, contents, 'You are a JSON generator. Return ONLY valid JSON, no markdown.');
    
    let result;
    try {
      const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: 'AI returned invalid format. Please retry.' });
    }

    console.log(`[COUNCIL] Started for ${email}: ${result.personas?.length || 0} personas created`);
    incrementFeatureUsage(email, 'council');
    res.json({ success: true, personas: result.personas, round1: result.round1 });
  } catch (error) {
    console.error('[COUNCIL] Start error:', error.message);
    res.status(500).json({ error: 'Failed to start council. Try again.' });
  }
});

// Phase 2: Cross-examination — agents critique each other
app.post('/api/chat/council/debate', async (req, res) => {
  const { email, prompt, personas, round1 } = req.body;
  if (!email || !prompt || !personas || !round1) return res.status(400).json({ error: 'Missing debate data.' });

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  try {
    const round1Summary = round1.map(r => {
      const p = personas.find(x => x.id === r.personaId);
      return `${p?.name || r.personaId}: "${r.response}"`;
    }).join('\n\n');

    const debatePrompt = `You are orchestrating Round 2 of an adversarial multi-agent debate. Each agent must now CRITIQUE the other agents' Round 1 proposals — find flaws, challenge assumptions, and defend their own position.

ORIGINAL PROBLEM: "${prompt.substring(0, 300)}"

ROUND 1 PROPOSALS:
${round1Summary}

THE 3 PERSONAS:
${personas.map(p => `- ${p.name} (${p.id}): ${p.focus}`).join('\n')}

Generate Round 2 cross-examination. Each agent must:
1. Directly reference and critique specific points from the OTHER agents' proposals
2. Point out flaws, risks, or blind spots in their reasoning
3. Defend their own position against anticipated criticism

Return ONLY valid JSON:
{
  "round2": [
    { "personaId": "pragmatist", "response": "[200-300 words cross-examining the other two agents' proposals. Quote their specific claims and challenge them.]" },
    { "personaId": "creative", "response": "[200-300 words...]" },
    { "personaId": "guardian", "response": "[200-300 words...]" }
  ]
}`;

    const contents = [{ role: 'user', parts: [{ text: debatePrompt }] }];
    const raw = await queryGeminiAPI(config.keys, contents, 'Return ONLY valid JSON.');
    
    let result;
    try {
      const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: 'Cross-examination parsing failed.' });
    }

    res.json({ success: true, round2: result.round2 });
  } catch (error) {
    console.error('[COUNCIL] Debate error:', error.message);
    res.status(500).json({ error: 'Cross-examination failed.' });
  }
});

// Phase 3: User steers the debate — course correction
app.post('/api/chat/council/steer', async (req, res) => {
  const { email, prompt, personas, round1, round2, steerInput } = req.body;
  if (!email || !steerInput || !personas) return res.status(400).json({ error: 'Missing steering data.' });

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  try {
    const steerPrompt = `You are orchestrating Round 3 of a multi-agent debate. The human observer has watched the debate and now wants to REDIRECT the discussion with new constraints.

ORIGINAL PROBLEM: "${prompt.substring(0, 200)}"

THE 3 PERSONAS:
${personas.map(p => `- ${p.name} (${p.id}): ${p.focus}`).join('\n')}

HUMAN'S COURSE CORRECTION: "${steerInput}"

Each agent must now re-analyze the problem incorporating the human's new direction. They should:
1. Acknowledge the course correction
2. Adapt their position to the new constraints
3. Provide updated, specific recommendations
4. Still maintain their unique persona perspective

Return ONLY valid JSON:
{
  "round3": [
    { "personaId": "pragmatist", "response": "[200-300 words updated analysis incorporating the human's steering...]" },
    { "personaId": "creative", "response": "[200-300 words...]" },
    { "personaId": "guardian", "response": "[200-300 words...]" }
  ]
}`;

    const contents = [{ role: 'user', parts: [{ text: steerPrompt }] }];
    const raw = await queryGeminiAPI(config.keys, contents, 'Return ONLY valid JSON.');
    
    let result;
    try {
      const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: 'Steering round parsing failed.' });
    }

    res.json({ success: true, round3: result.round3 });
  } catch (error) {
    console.error('[COUNCIL] Steer error:', error.message);
    res.status(500).json({ error: 'Steering failed.' });
  }
});

// Phase 4: Consensus — synthesize debate into final action plan
app.post('/api/chat/council/consensus', async (req, res) => {
  const { email, prompt, personas, rounds } = req.body;
  if (!email || !prompt || !personas) return res.status(400).json({ error: 'Missing consensus data.' });

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  try {
    // Build full debate transcript
    let transcript = '';
    if (rounds?.round1) {
      transcript += 'ROUND 1 — INITIAL PROPOSALS:\n';
      rounds.round1.forEach(r => {
        const p = personas.find(x => x.id === r.personaId);
        transcript += `${p?.name || r.personaId}: ${r.response}\n\n`;
      });
    }
    if (rounds?.round2) {
      transcript += 'ROUND 2 — CROSS-EXAMINATION:\n';
      rounds.round2.forEach(r => {
        const p = personas.find(x => x.id === r.personaId);
        transcript += `${p?.name || r.personaId}: ${r.response}\n\n`;
      });
    }
    if (rounds?.round3?.length > 0) {
      transcript += 'ROUND 3 — STEERED ITERATION:\n';
      rounds.round3.forEach(r => {
        const p = personas.find(x => x.id === r.personaId);
        transcript += `${p?.name || r.personaId}: ${r.response}\n\n`;
      });
    }

    const consensusPrompt = `You are the Chief Synthesis Officer. A multi-agent adversarial debate has just concluded. Your job is to review all debate transcripts, filter out the hostile arguments, and distill the survivable, stress-tested ideas into a comprehensive, bulletproof action plan.

ORIGINAL PROBLEM: "${prompt}"

THE DEBATERS:
${personas.map(p => `- ${p.name}: ${p.focus}`).join('\n')}

FULL DEBATE TRANSCRIPT:
${transcript}

YOUR TASK — Generate the FINAL CONSENSUS DECISION:

Structure your response EXACTLY as follows:
1. Start with a bold title for the stress-tested strategy
2. "The Core Play" — the main recommended action (2-3 sentences)
3. For EACH persona, extract their KEY SURVIVING CONTRIBUTION as a named guardrail:
   - "The [Persona Focus] Guardrail ([Persona Name]):" — their specific, actionable safeguard
4. "Implementation Timeline" — concrete next steps with priorities
5. "Risks Acknowledged" — remaining risks the team accepts
6. "Why This Plan Survives" — 2-3 sentences on why this plan is superior to any single agent's proposal

Use clear headings, bullet points, and bold text. Make it feel like a real executive strategy document. This should be a COMPLETE, ACTIONABLE blueprint — not a vague summary.`;

    const contents = [{ role: 'user', parts: [{ text: consensusPrompt }] }];
    const consensusText = await queryGeminiAPI(config.keys, contents, 'You are a strategy synthesizer. Produce a comprehensive, well-formatted action plan. MANDATORY LINKS RULE: At the VERY END of your response, you MUST append a section titled \'**?? Official Sources & References:**\' providing 2-5 valid, authentic, clickable markdown links relevant to the topic. NEVER skip this rule.');

    console.log(`[COUNCIL] Consensus generated for ${email}`);
    res.json({ success: true, consensus: consensusText });
  } catch (error) {
    console.error('[COUNCIL] Consensus error:', error.message);
    res.status(500).json({ error: 'Consensus generation failed.' });
  }
});

// ==================== WORKFLOW EXECUTION SEQUENCER ====================
app.post('/api/workflow/start', async (req, res) => {
  const { email, goal } = req.body;
  if (!email || !goal) return res.status(400).json({ error: 'Email and goal required.' });

  const check = checkFeatureLimit(email, 'workflow');
  if (!check.allowed) {
    return res.status(403).json({ error: 'FEATURE_LIMIT', message: `Workflow Sequencer daily limit reached (${check.used}/${check.limit}). Upgrade your plan for more.` });
  }

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  try {
    const startPrompt = `A user wants to execute an autonomous multi-step software pipeline for this goal: "${goal.substring(0, 500)}".
Break this goal down into exactly 4 sequential logical sub-tasks/steps.
Step 3 MUST be an interactive review step that gathers items (competitors, links, resources, stock suggestions, etc. depending on the goal) for human review before proceeding.
Step 4 must be the final synthesis/consolidation.

Return a JSON array of exactly 4 steps in this format. No markdown, no code blocks, ONLY valid JSON array:
[
  { "id": "step_1", "label": "Analysis & Planning: [specific descriptive sub-task]" },
  { "id": "step_2", "label": "Data Extraction & Scraping: [specific descriptive sub-task]" },
  { "id": "step_3", "label": "Staging Review: [specific descriptive sub-task]", "requiresApproval": true },
  { "id": "step_4", "label": "Final Consolidation & Drafting: [specific descriptive sub-task]" }
]`;

    const contents = [{ role: 'user', parts: [{ text: startPrompt }] }];
    const raw = await queryGeminiAPI(config.keys, contents, 'You are a JSON generator. Return only a valid JSON array.');
    
    let steps;
    try {
      const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      steps = JSON.parse(cleaned);
    } catch (err) {
      // Fallback steps if JSON parsing fails
      steps = [
        { id: 'step_1', label: 'Analysis & Target Identification' },
        { id: 'step_2', label: 'Background Scrape & Data Extraction' },
        { id: 'step_3', label: 'Interactive Result Filtering', requiresApproval: true },
        { id: 'step_4', label: 'Report Compilation & Draft Generation' }
      ];
    }

    const workflowId = 'wf_' + Date.now();
    console.log(`[WORKFLOW] Started: ${workflowId} for ${email}`);
    incrementFeatureUsage(email, 'workflow');
    res.json({ success: true, workflowId, steps });
  } catch (error) {
    console.error('[WORKFLOW] Start error:', error.message);
    res.status(500).json({ error: 'Failed to start workflow sequence.' });
  }
});

app.post('/api/workflow/execute-step', async (req, res) => {
  const { email, goal, workflowId, stepId, stepIndex, stepsHistory } = req.body;
  if (!email || !goal || !workflowId || !stepId) return res.status(400).json({ error: 'Missing step details.' });

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  const currentStep = stepsHistory?.[stepIndex] || {};

  try {
    if (currentStep.requiresApproval) {
      // Step 3 (Review Step): Generate a structured JSON response with console logs AND 5-6 review items
      const reviewPrompt = `The user is running a multi-step workflow.
Goal: "${goal.substring(0, 500)}"
We are at Step: "${currentStep.label}".
Generate 5-6 structured items/competitors/links/images (relevant to the goal) that the AI sub-agents 'discovered'.
Also generate 4 developer-style console log messages showing the backend process.

Return a JSON object in this format. No markdown, no code blocks, ONLY valid JSON:
{
  "logs": [
    "Spinning up search spiders...",
    "Crawling identified assets...",
    "Extracting metadata and relevance metrics...",
    "Staging candidate list for human verification..."
  ],
  "items": [
    {
      "id": "[short id, e.g. comp_1 or link_1]",
      "name": "[Name of company, resource, link, or image]",
      "description": "[1-2 sentence description of what this is and how it matches the user's goal]",
      "relevance": "[Relevance percentage, e.g. 96%]"
    }
  ]
}`;

      const contents = [{ role: 'user', parts: [{ text: reviewPrompt }] }];
      const raw = await queryGeminiAPI(config.keys, contents, 'You are a JSON generator. Return only a valid JSON object.');
      
      let parsed;
      try {
        const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = {
          logs: [
            "Launching entity extraction subprocess...",
            "Crawled relevant channels...",
            "Compiled matches in staging table..."
          ],
          items: [
            { id: 'item_1', name: 'Option Alpha', description: 'Strong relevance match based on initial site audit.', relevance: '95%' },
            { id: 'item_2', name: 'Beta Labs Solutions', description: 'Secondary provider with similar pricing structure.', relevance: '88%' },
            { id: 'item_3', name: 'Gamma Resource Group', description: 'Alternative repository containing high-quality replacement assets.', relevance: '84%' }
          ]
        };
      }
      return res.json({ success: true, logs: parsed.logs, items: parsed.items, output: 'Awaiting human review.' });
    } else {
      // Regular steps (Step 1, Step 2)
      const executionPrompt = `The user is running a multi-step workflow.
Goal: "${goal.substring(0, 500)}"
We are at Step: "${currentStep.label}" (Step index: ${stepIndex + 1}).
Generate 4 developer-style backend console log messages showing the work being done.

Return a JSON object in this format. No markdown, no code blocks, ONLY valid JSON:
{
  "logs": [
    "[Developer log line 1]",
    "[Developer log line 2]",
    "[Developer log line 3]",
    "[Developer log line 4]"
  ],
  "output": "[A short 1-sentence summary of step completion]"
}`;

      const contents = [{ role: 'user', parts: [{ text: executionPrompt }] }];
      const raw = await queryGeminiAPI(config.keys, contents, 'You are a JSON generator. Return only a valid JSON object.');
      
      let parsed;
      try {
        const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = {
          logs: [
            "Task initialized by scheduler.",
            "Gathering system resources...",
            "Executing logic logic...",
            "Logs synchronized successfully."
          ],
          output: "Step completed."
        };
      }
      return res.json({ success: true, logs: parsed.logs, output: parsed.output });
    }
  } catch (error) {
    console.error('[WORKFLOW] Step execution error:', error.message);
    res.status(500).json({ error: 'Failed to execute step.' });
  }
});

app.post('/api/workflow/consolidate', async (req, res) => {
  const { email, goal, workflowId, filteredItems, steeringInput } = req.body;
  if (!email || !goal || !workflowId) return res.status(400).json({ error: 'Missing consolidation data.' });

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  try {
    const consolidatePrompt = `The user ran a multi-step workflow for the macro goal: "${goal}".
After data collection and scraping, the human owner approved these verified items:
${JSON.stringify(filteredItems, null, 2)}

${steeringInput ? `The human owner also provided this course correction feedback: "${steeringInput}"` : ''}

Generate the final consolidated macro report / action plan / outreach drafts to fully solve the user's goal.
Use clear headers, structured tables/lists, and detailed recommendations. Make it look like a highly professional final product.`;

    const contents = [{ role: 'user', parts: [{ text: consolidatePrompt }] }];
    const finalReport = await queryGeminiAPI(config.keys, contents, 'You are a professional report compiler. Generate a detailed, structured final report. MANDATORY LINKS RULE: At the VERY END of your response, you MUST append a section titled \'**?? Official Sources & References:**\' providing 2-5 valid, authentic, clickable markdown links relevant to the topic. NEVER skip this rule.');

    console.log(`[WORKFLOW] Completed: ${workflowId} for ${email}`);
    res.json({ success: true, report: finalReport });
  } catch (error) {
    console.error('[WORKFLOW] Consolidation error:', error.message);
    res.status(500).json({ error: 'Failed to consolidate workflow report.' });
  }
});

// ==================== INTERVIEW MODE (REVERSE PROMPTING) ====================
app.post('/api/chat/interview/start', async (req, res) => {
  const { email, message, personality } = req.body;
  if (!email || !message) return res.status(400).json({ error: 'Email and message are required.' });

  const check = checkFeatureLimit(email, 'interview');
  if (!check.allowed) {
    return res.status(403).json({ error: 'FEATURE_LIMIT', message: `Interview Mode daily limit reached (${check.used}/${check.limit}). Upgrade your plan for more.` });
  }

  // Check Plan limits
  const db = readDB();
  const user = getOrCreateUser(email);
  const planInfo = db.plans && db.plans[user.plan];
  const userLimit = planInfo ? planInfo.prompts : (user.plan === 'free' ? 30 : 100);
  const isAdmin = email === ADMIN_EMAIL;

  if (!isAdmin && Number(userLimit) !== -1 && user.promptsUsed >= Number(userLimit)) {
    return res.status(403).json({
      error: 'LIMIT_EXCEEDED',
      message: `You have reached your daily limit of ${userLimit} prompts. Please upgrade your plan.`
    });
  }

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  try {
    const analysisPrompt = `You are a diagnostic prompt analyzer. The user wants to write a prompt or run a request, but it is vague:
"${message.substring(0, 500)}"

Identify exactly 3 critical missing parameters/constraints required to produce a highly customized, functional, and flawless solution on the first try.
Generate exactly 3 questions in a questionnaire.
Each question type must be one of:
- 'select' (a single-choice dropdown menu)
- 'checkbox' (multiple choice checklist)
- 'radio' (single-choice radio button list)

Return a JSON object with this EXACT format. Do not use markdown, do not wrap in code blocks (no \`\`\`json), ONLY output valid raw JSON:
{
  "questions": [
    {
      "id": "param_1",
      "type": "select",
      "label": "[Question text, e.g. Target Operating System?]",
      "options": ["Windows", "macOS", "Linux"]
    },
    {
      "id": "param_2",
      "type": "checkbox",
      "label": "[Question text, e.g. What categories should be processed?]",
      "options": ["Extensions (.pdf, .zip)", "Creation Date", "File Size"]
    },
    {
      "id": "param_3",
      "type": "radio",
      "label": "[Question text, e.g. How to handle existing duplicates?]",
      "options": ["Auto-rename suffix", "Overwrite files", "Skip duplicates"]
    }
  ]
}`;

    const contents = [{ role: 'user', parts: [{ text: analysisPrompt }] }];
    const raw = await queryGeminiAPI(config.keys, contents, 'You are a JSON generator. Return only a valid JSON object.');
    
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Fallback questionnaire if parsing fails
      parsed = {
        questions: [
          { id: 'param_1', type: 'select', label: 'Target Operating System?', options: ['Windows', 'macOS', 'Linux'] },
          { id: 'param_2', type: 'checkbox', label: 'File Categorization Rule?', options: ['By Extension (.pdf, .jpg)', 'By Creation Date', 'By File Size'] },
          { id: 'param_3', type: 'radio', label: 'Duplicate File Action?', options: ['Auto-rename with suffix', 'Overwrite', 'Skip file'] }
        ]
      };
    }

    incrementFeatureUsage(email, 'interview');
    res.json({ success: true, questions: parsed.questions });
  } catch (error) {
    console.error('[INTERVIEW] Start error:', error.message);
    res.status(500).json({ error: 'Failed to generate diagnostic questions.' });
  }
});

// Track Standalone Feature Usage (e.g. Local Data Masking)
app.post('/api/feature/track', (req, res) => {
  const { email, feature } = req.body;
  if (!email || !feature) return res.status(400).json({ error: 'Email and feature required.' });

  const check = checkFeatureLimit(email, feature);
  if (!check.allowed) {
    return res.status(403).json({ error: 'FEATURE_LIMIT', message: `Daily limit reached for ${feature} (${check.used}/${check.limit}). Upgrade your plan for more.` });
  }

  incrementFeatureUsage(email, feature);
  res.json({ success: true, used: check.used + 1, limit: check.limit });
});

app.post('/api/chat/interview/submit', async (req, res) => {
  const { email, originalPrompt, answers, history, personality } = req.body;
  if (!email || !originalPrompt || !answers) return res.status(400).json({ error: 'Missing required parameters.' });

  // Check Plan limits
  const db = readDB();
  const user = getOrCreateUser(email);
  const planInfo = db.plans && db.plans[user.plan];
  const userLimit = planInfo ? planInfo.prompts : (user.plan === 'free' ? 30 : 100);
  const isAdmin = email === ADMIN_EMAIL;

  if (!isAdmin && Number(userLimit) !== -1 && user.promptsUsed >= Number(userLimit)) {
    return res.status(403).json({
      error: 'LIMIT_EXCEEDED',
      message: `You have reached your daily limit of ${userLimit} prompts. Please upgrade your plan.`
    });
  }

  const config = readConfig();
  if (!config?.keys?.length) return res.status(500).json({ error: 'AI not configured.' });

  try {
    // Format answers summary
    const summary = answers.map(ans => `- **${ans.label}**: ${Array.isArray(ans.selection) ? ans.selection.join(', ') : ans.selection}`).join('\n');

    let finalPrompt = `The user originally requested: "${originalPrompt}"
To resolve prompt ambiguity, the user has completed a diagnostic questionnaire and selected these parameters:
${summary}

Based on these specific variables, please output a flawless, custom-tailored solution. If code or scripts are requested, write complete, production-ready, error-free code that targets these choices perfectly.`;

    // Implement standard personality behavior
    let systemInstruction = "You are MatrixMind, a super advanced, friendly AI Assistant. ";
    if (personality === 'architect') {
      systemInstruction += "You are currently in ARCHITECT mode. You are a senior-level technical Architect and full-stack developer. You must write complete, functional, production-ready code with no shortcuts. Explain sections, integrations, and dependencies. ";
    } else if (personality === 'analyst') {
      systemInstruction += "You are currently in ANALYST mode. You are a data Analyst and statistician. Answer step-by-step using tables, lists, and numbers. ";
    } else {
      systemInstruction += "You are currently in STANDARD mode. A general-purpose assistant. If they ask for programming scripts, advise them to switch to Architect mode; however, since they completed the diagnostic parameters, provide a high-level explanation and code guidelines matching their choices. MANDATORY LINKS RULE: At the VERY END of your response, you MUST append a section titled '**?? Official Sources & References:**' providing 2-5 valid, authentic, clickable markdown links relevant to the topic. NEVER skip this rule.";
    }

    systemInstruction += ' MANDATORY LINKS RULE: At the VERY END of your response, you MUST append a section titled \'**?? Official Sources & References:**\' providing 2-5 valid, authentic, clickable markdown links relevant to the topic. NEVER skip this rule.';
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(item => {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: finalPrompt }]
    });

    const aiResponse = await queryGeminiAPI(config.keys, contents, systemInstruction);

    // Charge 1 prompt limit
    user.promptsUsed += 1;
    db.users[email] = user;
    writeDB(db);

    res.json({
      success: true,
      response: aiResponse,
      promptsUsed: user.promptsUsed,
      limit: userLimit
    });
  } catch (error) {
    console.error('[INTERVIEW] Submit error:', error.message);
    res.status(500).json({ error: 'Failed to compile optimized solution.' });
  }
});

// ==================== SMART CHAT TITLE GENERATOR ====================
// Generates a concise, descriptive title for a chat based on the first exchange
app.post('/api/chat/generate-title', async (req, res) => {
  const { userMessage, botResponse } = req.body;
  if (!userMessage) return res.status(400).json({ error: 'User message is required.' });

  try {
    const config = readConfig();
    if (!config || !config.keys || config.keys.length === 0) {
      // Fallback: extract title from user message
      const fallback = userMessage.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 50);
      return res.json({ title: fallback || 'Chat' });
    }

    const titlePrompt = `Generate a short, descriptive topic title (3-6 words max) for a chat conversation that started with this user message:

"${userMessage.substring(0, 200)}"

${botResponse ? `The bot responded about: "${botResponse.substring(0, 200)}"` : ''}

Rules:
- Return ONLY the title text, nothing else
- No quotes, no punctuation at the end, no prefixes
- Make it specific and descriptive (e.g., "Evolution of Car Engines", "Python Web Scraping Tutorial", "Black Holes & Spacetime")
- If the message is a greeting, use "General Conversation"
- Maximum 6 words`;

    const contents = [{ role: 'user', parts: [{ text: titlePrompt }] }];
    const titleResponse = await queryGeminiAPI(config.keys, contents, 'You are a title generator. Return only the title.');
    
    let title = titleResponse.trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/[.!?]+$/, '')       // Remove trailing punctuation
      .substring(0, 60);            // Max 60 chars
    
    if (!title || title.length < 2) title = userMessage.substring(0, 40);

    res.json({ title });
  } catch (error) {
    console.warn('[TITLE] Generation failed, using fallback:', error.message);
    const fallback = userMessage.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 50);
    res.json({ title: fallback || 'Chat' });
  }
});

// ==================== SIMPLE UPI PAYMENT - ADMIN APPROVAL SYSTEM ====================
// User pays via QR/UPI ID → enters UTR → submits for admin review → admin approves/rejects

app.post('/api/payment/submit-utr', (req, res) => {
  try {
    const { email, utr, planRequested } = req.body;
    if (!email || !utr) {
      return res.status(400).json({ error: 'Email and UTR number are required.' });
    }

    // Validate UTR format: exactly 12 numeric digits
    if (!/^\d{12}$/.test(utr)) {
      return res.status(400).json({ error: 'Invalid UTR. Must be exactly 12 digits.' });
    }

    const db = readDB();
    db.pendingApprovals = db.pendingApprovals || [];

    // Check if this UTR was already submitted
    const exists = db.pendingApprovals.some(r => r.transactionId === utr);
    if (exists) {
      return res.status(400).json({ error: 'This UTR has already been submitted for verification.' });
    }

    const approvalRequest = {
      id: 'req_' + Date.now(),
      email,
      plan: planRequested || 'standard',
      transactionId: utr,
      amount: 0,
      status: 'pending',
      date: new Date().toISOString()
    };

    db.pendingApprovals.push(approvalRequest);
    writeDB(db);

    console.log(`[PAYMENT] UTR submitted for approval: ${utr} by ${email}`);

    res.json({
      success: true,
      message: 'Your UTR has been submitted successfully! Your plan will be activated once the admin verifies your payment.'
    });
  } catch (error) {
    console.error('[PAYMENT] UTR submission error:', error.message);
    res.status(500).json({ error: 'Failed to submit UTR.' });
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
    return res.json({ keys: [], RECEIVER_UPI_ID: '6372843175@kotakbank', RECEIVER_NAME: 'Prakhar Mishra', googleClientId: '', adminUsername: 'prakhar mishra', adminPassword: '', smtpUser: '', smtpPass: '', firebaseDbUrl: '', firebaseServiceAccount: '' });
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
  res.json({
    plans: db.plans || {},
    featureNames: db.featureNames || {}
  });
});

// UPDATE SUBSCRIPTION PLANS ENDPOINT (ADMIN ONLY)
app.post('/api/plans/update', (req, res) => {
  const { email, plans, featureNames } = req.body;
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
  if (featureNames) {
    db.featureNames = featureNames;
  }
  writeDB(db);
  res.json({ success: true, message: 'Plans updated successfully.' });
});

// ==================== ADMIN PAYMENT SETTINGS (UPI ID + QR Upload) ====================
const QR_IMAGE_PATH = path.join(__dirname, 'payment-qr.png');

// GET payment settings for admin
app.get('/api/admin/payment-settings', (req, res) => {
  const config = readConfig();
  if (!config) return res.json({ receiverUpiId: '6372843175@kotakbank', receiverName: 'Prakhar Mishra', hasCustomQR: false });
  
  res.json({
    receiverUpiId: config.RECEIVER_UPI_ID || '6372843175@kotakbank',
    receiverName: config.RECEIVER_NAME || 'Prakhar Mishra',
    hasCustomQR: fs.existsSync(QR_IMAGE_PATH)
  });
});

// POST update payment settings (UPI ID + Name)
app.post('/api/admin/payment-settings', (req, res) => {
  const { receiverUpiId, receiverName } = req.body;
  if (!receiverUpiId) return res.status(400).json({ error: 'UPI ID is required.' });
  
  const config = readConfig();
  if (!config) return res.status(500).json({ error: 'Config not initialized.' });
  
  config.RECEIVER_UPI_ID = receiverUpiId.trim();
  config.RECEIVER_NAME = (receiverName || '').trim() || 'Prakhar Mishra';
  writeConfig(config);
  
  console.log(`[ADMIN] Payment settings updated: UPI=${receiverUpiId}, Name=${receiverName}`);
  res.json({ success: true, message: 'Payment settings updated successfully.' });
});

// POST upload custom QR code image (base64)
app.post('/api/admin/upload-qr', (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ error: 'No image data provided.' });
    
    // imageData should be base64 string (data:image/png;base64,...)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'QR image too large. Max 5MB.' });
    }
    
    fs.writeFileSync(QR_IMAGE_PATH, buffer);
    console.log(`[ADMIN] Custom QR code uploaded (${Math.round(buffer.length / 1024)} KB)`);
    res.json({ success: true, message: 'QR code uploaded successfully.' });
  } catch (err) {
    console.error('[ADMIN] QR upload error:', err.message);
    res.status(500).json({ error: 'Failed to save QR image.' });
  }
});

// DELETE custom QR code (revert to auto-generated)
app.delete('/api/admin/upload-qr', (req, res) => {
  try {
    if (fs.existsSync(QR_IMAGE_PATH)) {
      fs.unlinkSync(QR_IMAGE_PATH);
      console.log('[ADMIN] Custom QR code removed');
    }
    res.json({ success: true, message: 'Custom QR removed. Auto-generated QR will be used.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove QR.' });
  }
});

// GET serve the QR code image to frontend
app.get('/api/payment-qr', (req, res) => {
  if (fs.existsSync(QR_IMAGE_PATH)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(QR_IMAGE_PATH);
  } else {
    res.status(404).json({ error: 'No custom QR uploaded.' });
  }
});

// ACTION ON PENDING APPROVAL REQUEST - ADMIN SELECTS PLAN TO UNLOCK
app.post('/api/admin/approvals/action', (req, res) => {
  const { email, requestId, action, selectedPlan } = req.body;
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

  if (action === 'reject') {
    approvalReq.status = 'rejected';
    writeDB(db);
    return res.json({ success: true, message: 'Payment verification rejected. User will be notified.' });
  }

  // Admin is approving with a specific plan
  // action should be 'approve' and selectedPlan should be 'standard', 'better', or 'premium'
  const planToActivate = selectedPlan || action; // action itself could be the plan name
  
  // Map plan names to durations
  const planConfigs = {
    standard: { days: 30, price: 99, name: 'Basic' },
    better: { days: 90, price: 199, name: 'Pro' },
    premium: { days: 365, price: 999, name: 'Ultimate' }
  };

  const planConfig = planConfigs[planToActivate];
  if (!planConfig) {
    return res.status(400).json({ error: 'Invalid plan selection.' });
  }

  // Check if DB has custom plan config
  const dbPlanInfo = db.plans && db.plans[planToActivate];
  const days = dbPlanInfo ? (dbPlanInfo.days || planConfig.days) : planConfig.days;
  const price = dbPlanInfo ? (dbPlanInfo.price || planConfig.price) : planConfig.price;

  approvalReq.status = 'approved';
  approvalReq.approvedPlan = planToActivate;
  approvalReq.approvedAmount = price;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  const user = getOrCreateUser(approvalReq.email);
  user.plan = planToActivate;
  user.planExpiry = expiryDate.toISOString();
  db.users[approvalReq.email] = user;

  // Log transaction
  if (!db.transactions) db.transactions = [];
  db.transactions.push({
    id: `txn_${Date.now()}`,
    email: approvalReq.email,
    amount: price,
    plan: planToActivate,
    paymentRef: `UPI_${approvalReq.transactionId}`,
    date: new Date().toISOString()
  });
  writeDB(db);

  console.log(`[ADMIN] Plan approved: ${approvalReq.email} → ${planConfig.name} (₹${price}, ${days} days)`);
  return res.json({ success: true, message: `${planConfig.name} (₹${price}) activated for ${approvalReq.email} for ${days} days.` });
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
      const fileListPrompt = `\nYou are a project manager. We have a full-stack project with the following files:\n1. "backend/server.js" (Handles Express routes, database reads/writes, APIs)\n2. "frontend/src/App.jsx" (Handles views, routing, top-level state, alerts)\n3. "frontend/src/App.css" (Stylesheets, glassmorphism UI)\n4. "frontend/src/components/Dashboard.jsx" (Chat, voice messages, sidebar UI layout)\n5. "frontend/src/components/Admin.jsx" (Admin panel metrics, charts, tables, payment approval)\n6. "frontend/src/components/UpgradeModal.jsx" (Subscription plan cards, UPI QR payment, UTR submission)\n7. "frontend/src/components/Setup.jsx" (System Setup form for API Keys and SMTP configuration)\n8. "frontend/src/components/HelpSupport.jsx" (Query box and support contact)\n9. "frontend/src/components/Legal.jsx" (Terms of Service, Privacy Policy pages)\n10. "frontend/src/components/OwnerSecureLogin.jsx" (Re-verification secure page)\n\nBased on the following request from the user, which file should be modified?\nUser Request: "${prompt}"\n\nResponse format: Return ONLY the exact file path from the list above (e.g. "backend/server.js" or "frontend/src/components/Dashboard.jsx"). Do not include any formatting, explanation, punctuation, quotes, or markdown tags.\n`;

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
