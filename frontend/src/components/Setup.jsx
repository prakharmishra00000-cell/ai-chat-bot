import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ShieldAlert, Award } from 'lucide-react';

function Setup({ onComplete, onBack, currentUser }) {
  const [keys, setKeys] = useState(Array(9).fill(''));
  const [p2pApiKey, setP2pApiKey] = useState('');
  const [p2pApiUrl, setP2pApiUrl] = useState('https://api.uropay.me/v1');
  const [receiverUpiId, setReceiverUpiId] = useState('6372843175@kotakbank');
  const [receiverName, setReceiverName] = useState('Prakhar Mishra');
  const [googleClientId, setGoogleClientId] = useState('');
  const [adminUsername, setAdminUsername] = useState('prakhar mishra');
  const [adminPassword, setAdminPassword] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.email === 'prakharmishra00000@gmail.com') {
      fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          if (data.keys && Array.isArray(data.keys)) {
            const newKeys = Array(9).fill('');
            data.keys.forEach((k, idx) => {
              if (idx < 9) newKeys[idx] = k;
            });
            setKeys(newKeys);
          }
          setP2pApiKey(data.P2P_API_KEY || '');
          setP2pApiUrl(data.P2P_API_URL || 'https://api.uropay.me/v1');
          setReceiverUpiId(data.RECEIVER_UPI_ID || '6372843175@kotakbank');
          setReceiverName(data.RECEIVER_NAME || 'Prakhar Mishra');
          setGoogleClientId(data.googleClientId || '');
          setAdminUsername(data.adminUsername || 'prakhar mishra');
          setAdminPassword(data.adminPassword || '');
          setSmtpUser(data.smtpUser || '');
          setSmtpPass(data.smtpPass || '');
        }
      })
      .catch(err => console.error('Failed to pre-fill configuration:', err));
    }
  }, [currentUser]);

  const handleKeyChange = (index, val) => {
    const updated = [...keys];
    updated[index] = val;
    setKeys(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Filter blank keys
    const validKeys = keys.filter(k => k && k.trim() !== '');
    if (validKeys.length === 0) {
      setError('You must configure at least 1 valid Gemini API Key.');
      return;
    }

    if (!adminUsername || !adminPassword) {
      setError('Admin Username and Password are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: validKeys,
          P2P_API_KEY: p2pApiKey,
          P2P_API_URL: p2pApiUrl,
          RECEIVER_UPI_ID: receiverUpiId,
          RECEIVER_NAME: receiverName,
          googleClientId,
          adminUsername,
          adminPassword,
          smtpUser,
          smtpPass
        })
      });

      const data = await res.json();
      if (res.ok) {
        onComplete();
      } else {
        setError(data.error || 'Failed to save configuration details.');
      }
    } catch (err) {
      console.error(err);
      setError('Network connection error. Is backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card glass-panel">
        {onBack && (
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={onBack}
            style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: '20px', width: 'max-content', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Back to Login
          </button>
        )}
        <h2>System Credentials Setup</h2>
        <p className="subtitle">Configure your Gemini keys, payment gateway, and admin logins. All secrets are stored locally on your device.</p>
        
        {error && (
          <div className="tos-checkbox" style={{ color: '#ff3366', marginBottom: '20px', padding: '10px', background: 'rgba(255,51,102,0.1)', borderRadius: '8px' }}>
            <ShieldAlert size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Gemini API Keys */}
          <div className="form-group">
            <label>Gemini 1.5 Flash API Keys (Up to 9 Keys)</label>
            <p style={{ fontSize: '0.75rem', color: varColor('text-muted'), marginBottom: '10px' }}>
              Paste your 9 API keys. The backend will rotate automatically through them (1,000 requests per key/day) to achieve up to 9,000 free requests daily.
            </p>
            <div className="keys-grid">
              {keys.map((key, i) => (
                <input
                  key={i}
                  type="password"
                  placeholder={`Gemini Key #${i + 1}`}
                  value={key}
                  onChange={(e) => handleKeyChange(i, e.target.value)}
                />
              ))}
            </div>
          </div>

          {/* UroPay UPI Payment Configuration */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '20px' }}>
            <label>UroPay UPI Payment Configuration (Optional)</label>
            <p style={{ fontSize: '0.75rem', color: varColor('text-muted'), marginBottom: '10px' }}>
              Required to handle premium upgrades (₹99, ₹199, ₹999 orders). Configure your UroPay P2P API credentials and the receiver UPI ID for collecting payments.
            </p>
            <div className="keys-grid" style={{ gridTemplateColumns: '1fr' }}>
              <input
                type="password"
                placeholder="UroPay API Key"
                value={p2pApiKey}
                onChange={(e) => setP2pApiKey(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <input
                type="text"
                placeholder="UroPay API URL (default: https://api.uropay.me/v1)"
                value={p2pApiUrl}
                onChange={(e) => setP2pApiUrl(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <input
                type="text"
                placeholder="Receiver UPI ID (default: 6372843175@kotakbank)"
                value={receiverUpiId}
                onChange={(e) => setReceiverUpiId(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <input
                type="text"
                placeholder="Receiver Name (default: Prakhar Mishra)"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
              />
            </div>
          </div>

          {/* Google Identity Client ID */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '20px' }}>
            <label>Google OAuth Client ID (Optional)</label>
            <p style={{ fontSize: '0.75rem', color: varColor('text-muted'), marginBottom: '10px' }}>
              Enables "Continue with Google" sign-in. If empty, the app runs a beautiful simulated Google account selector.
            </p>
            <input
              type="text"
              placeholder="Google Client ID (e.g. 12345-abc.apps.googleusercontent.com)"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
            />
          </div>

          {/* Admin Logins */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '20px' }}>
            <label>Admin Panel Credentials</label>
            <p style={{ fontSize: '0.75rem', color: varColor('text-muted'), marginBottom: '10px' }}>
              Used to access the local visitor log, analytics dashboard, and subscription order tables.
            </p>
            <div className="keys-grid" style={{ gridTemplateColumns: '1fr' }}>
              <input
                type="text"
                placeholder="Admin Username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{ width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* SMTP Server Credentials */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '20px' }}>
            <label>SMTP Email Server Configuration (Optional)</label>
            <p style={{ fontSize: '0.75rem', color: varColor('text-muted'), marginBottom: '10px' }}>
              Allows programmatic support emails to be delivered to <strong>prakharmishra00000@gmail.com</strong>.
              Enter your sending Gmail address and its generated 16-character <strong>App Password</strong>.
            </p>
            <div className="keys-grid" style={{ gridTemplateColumns: '1fr' }}>
              <input
                type="email"
                placeholder="SMTP Gmail Address (e.g. yoursupport@gmail.com)"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <input
                type="password"
                placeholder="Gmail 16-character App Password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
            {loading ? 'Saving Settings...' : 'Initialize System'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Utility to fetch css values in JSX inline styling
function varColor(variable) {
  return `var(--${variable})`;
}

export default Setup;
