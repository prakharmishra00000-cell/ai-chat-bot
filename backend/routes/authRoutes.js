const express = require('express');

module.exports = function(helpers) {
  const router = express.Router();
  const { readDB, writeDB, readConfig, writeConfig, getOrCreateUser, ADMIN_EMAIL } = helpers;

  // Setup Configuration Endpoint
  router.post('/setup', (req, res) => {
    const { keys, googleClientId, adminUsername, adminPassword, smtpUser, smtpPass, firebaseDbUrl, firebaseServiceAccount, razorpayWebhookSecret } = req.body;
    
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
      firebaseServiceAccount: firebaseServiceAccount || '',
      razorpayWebhookSecret: razorpayWebhookSecret || ''
    });

    if (success) {
      return res.json({ success: true, message: 'Configuration saved successfully.' });
    } else {
      return res.status(500).json({ error: 'Failed to write configuration.' });
    }
  });

  // Check if Setup is Completed
  router.get('/setup/status', (req, res) => {
    const config = readConfig();
    res.json({ setupCompleted: !!config });
  });

  // Securely expose public config to frontend (Google Sign-In, UPI receiver details)
  router.get('/config/public', (req, res) => {
    const config = readConfig();
    res.json({
      googleClientId: config?.googleClientId || '',
      razorpayKeyId: config?.razorpayKeyId || '',
      receiverUpiId: config?.RECEIVER_UPI_ID || '6372843175@kotakbank',
      receiverName: config?.RECEIVER_NAME || 'Prakhar Mishra'
    });
  });

  // User Auth Endpoint (Explicit Sign In / Sign Up) — Seamless cross-device auth
  router.post('/user/auth', (req, res) => {
    try {
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
    } catch (e) {
      return res.status(500).json({ error: 'CRASH', message: e.message, stack: e.stack });
    }
  });

  // User Status Endpoint
  router.post('/user/status', (req, res) => {
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

  return router;
};
