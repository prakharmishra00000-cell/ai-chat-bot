import React, { useState, useEffect } from 'react';
import { Mail, Lock, ShieldCheck, User } from 'lucide-react';

function Login({ onLogin, onShowLegal, onShowSetup }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

  // Simulated Google accounts for testing local multi-device profiles
  const googleAccounts = [
    'yasha.user@gmail.com',
    'guest.tester@gmail.com',
    'analyst.dev@gmail.com',
    'ai.enthusiast@gmail.com'
  ];

  const performAuth = async (authEmail, action) => {
    try {
      const res = await fetch('/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(authEmail);
      } else {
        setError(data.message || data.error || 'Authentication failed.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error during authentication.');
    }
  };

  const handleEmailAuth = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (activeTab === 'signup' && !agreeTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to register.');
      return;
    }

    performAuth(email, activeTab);
  };

  const [googleClientId, setGoogleClientId] = useState('');
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const handleSimulatedGoogleLogin = (accEmail) => {
    setShowGoogleChooser(false);
    performAuth(accEmail, activeTab);
  };

  // Fetch public keys and initialize Google Identity Services
  useEffect(() => {
    const fetchPublicKeys = async () => {
      try {
        const res = await fetch('/api/config/public');
        const data = await res.json();
        if (data.googleClientId) {
          setGoogleClientId(data.googleClientId);
        }
      } catch (e) {
        console.warn('Failed to load public config:', e);
      } finally {
        setIsConfigLoaded(true);
      }
    };
    
    fetchPublicKeys();

    // Log anonymous visitor daily page views
    fetch('/api/visit/anonymous', { method: 'POST' }).catch(err => console.error(err));
  }, []);

  // Poll for the Google SDK and the DOM container to be ready
  useEffect(() => {
    if (!googleClientId || !isConfigLoaded) return;

    const checkSDK = setInterval(() => {
      /* global google */
      const container = document.getElementById('google-real-btn-container');
      if (typeof google !== 'undefined' && container) {
        clearInterval(checkSDK);
        initRealGoogleGSI(googleClientId, container);
      }
    }, 100);

    // Timeout fallback if SDK fails to load in 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkSDK);
      console.warn('Google GSI SDK timed out loading.');
    }, 5000);

    return () => {
      clearInterval(checkSDK);
      clearTimeout(timeout);
    };
  }, [googleClientId, isConfigLoaded]);

  const initRealGoogleGSI = (clientId, container) => {
    /* global google */
    if (typeof google === 'undefined') {
      console.warn('Google GSI SDK not loaded in browser.');
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: clientId,
        context: 'use',
        ux_mode: 'popup',
        callback: (response) => {
          try {
            // Decode the JWT credential payload to extract user's email
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const profile = JSON.parse(jsonPayload);
            if (profile && profile.email) {
              // Always use 'login' — backend auto-registers if user doesn't exist (seamless cross-device)
              fetch('/api/user/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: profile.email, action: 'login' })
              }).then(res => res.json()).then(data => {
                if (data.success) {
                  onLogin(profile.email);
                } else {
                  setError(data.message || data.error);
                }
              }).catch(err => setError('Google auth network error.'));
            }
          } catch (err) {
            console.error('Error decoding JWT token from Google:', err);
            setError('Google authentication succeeded, but email extraction failed.');
          }
        }
      });

      // Render the official Google Button inside our container safely
      google.accounts.id.renderButton(
        container,
        { theme: 'outline', size: 'large', width: 380 }
      );
      
      // Automatically show the "One Tap" popup in the top right to choose emails linked to device
      google.accounts.id.prompt();
    } catch (err) {
      console.error('Error initializing Google Identity Services:', err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">

        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2.2rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MatrixMind
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>Advanced Real-Time AI Search System</p>
        </div>

        {/* Auth Tabs */}
        <div className="auth-tabs">
          <div 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('login'); setError(''); }}
          >
            Sign In
          </div>
          <div 
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('signup'); setError(''); }}
          >
            Register
          </div>
        </div>

        {error && (
          <div style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Google Continue Button */}
        {isConfigLoaded && (
          googleClientId ? (
            <div id="google-real-btn-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', minHeight: '44px' }}></div>
          ) : (
            <button 
              type="button" 
              className="google-auth-btn"
              onClick={() => {
                if (activeTab === 'signup' && !agreeTerms) {
                  setError('You must accept the Terms of Service and Privacy Policy to register.');
                  return;
                }
                setShowGoogleChooser(true);
              }}
            >
              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/web-24dp/logo_googleg_color_24dp.png" alt="Google" />
              Continue with Google
            </button>
          )
        )}

        <div className="divider">or use email</div>

        {/* Email Auth Form */}
        <form onSubmit={handleEmailAuth}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          {activeTab === 'signup' && (
            <label className="tos-checkbox">
              <input 
                type="checkbox" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                By signing up, you agree to our{' '}
                <a href="#tos" onClick={(e) => { e.preventDefault(); onShowLegal('tos'); }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" onClick={(e) => { e.preventDefault(); onShowLegal('privacy'); }}>
                  Privacy Policy
                </a>.
              </span>
            </label>
          )}

          <button type="submit" className="btn" style={{ width: '100%', padding: '12px' }}>
            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* Simulated Google Account Chooser Modal */}
      {showGoogleChooser && (
        <div className="modal-overlay" style={{ zIndex: 600 }}>
          <div className="modal-card glass-panel" style={{ maxWidth: '400px', padding: '30px' }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '10px', textAlign: 'center' }}>Choose an Account</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '20px' }}>
              Select a Google Account linked to this device
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {googleAccounts.map((acc, index) => (
                <button
                  key={index}
                  onClick={() => handleSimulatedGoogleLogin(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-main)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-glass-active)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ background: 'var(--gradient-primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--text-dark)' }}>
                    <User size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Google User</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc}</span>
                  </div>
                </button>
              ))}
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '20px', padding: '10px' }} 
              onClick={() => setShowGoogleChooser(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
