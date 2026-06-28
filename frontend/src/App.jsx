import React, { useState, useEffect, Suspense, lazy } from 'react';
import Setup from './components/Setup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Legal from './components/Legal';
import UpgradeModal from './components/UpgradeModal';
import HelpSupport from './components/HelpSupport';
import OwnerSecureLogin from './components/OwnerSecureLogin';

import { AlertTriangle, X, Cpu, Zap } from 'lucide-react';
const SpaceBackground = lazy(() => import('./components/SpaceBackground'));
import './App.css';

// Generate or retrieve a persistent device ID for anonymous usage tracking
function getDeviceId() {
  let deviceId = localStorage.getItem('matrixmind_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('matrixmind_device_id', deviceId);
  }
  return deviceId;
}

function App() {
  const [setupCompleted, setSetupCompleted] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // null = anonymous user
  const [view, setView] = useState('chat'); // Default to 'chat' — no login required
  const [legalType, setLegalType] = useState('tos');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    const validThemes = [
      'supernova-blast', 'solar-eruption', 'quasar-jet', 'nebula-tempest', 'hyperdrive-warp',
      'meteor-shower', 'blackhole-vortex', 'gammaray-burst', 'asteroid-storm', 'cosmic-collision'
    ];
    return validThemes.includes(saved) ? saved : 'supernova-blast';
  });
  const [isOwnerSecured, setIsOwnerSecured] = useState(false);
  const [nextViewAfterOwnerSecured, setNextViewAfterOwnerSecured] = useState('');
  
  // Subscription Plan Popup triggers
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userPlanDetails, setUserPlanDetails] = useState(null);
  const [showExpiryReminder, setShowExpiryReminder] = useState(false);

  // Login-inside-upgrade: when user needs to sign in to buy a plan
  const [showLoginForUpgrade, setShowLoginForUpgrade] = useState(false);

  // Performance mode state
  const [perfMode, setPerfMode] = useState(() => localStorage.getItem('perf_mode_static_bg') !== 'false');



  // Pre-fetched subscription plans
  const [preFetchedPlans, setPreFetchedPlans] = useState([]);
  const [preFetchedFeatureNames, setPreFetchedFeatureNames] = useState({});
  const [preFetchedGoogleClientId, setPreFetchedGoogleClientId] = useState('');
  const [preFetchedReceiverUpiId, setPreFetchedReceiverUpiId] = useState('');
  const [preFetchedReceiverName, setPreFetchedReceiverName] = useState('');
  const [preFetchedRazorpayKeyId, setPreFetchedRazorpayKeyId] = useState('');

  // Device ID for anonymous tracking
  const [deviceId] = useState(() => getDeviceId());

  const handleTogglePerfMode = () => {
    const newVal = !perfMode;
    setPerfMode(newVal);
    localStorage.setItem('perf_mode_static_bg', String(newVal));
    window.dispatchEvent(new Event('perfModeChanged'));
  };

  useEffect(() => {
    const preFetchData = async () => {
      try {
        fetch('/api/plans')
          .then(res => res.json())
          .then(data => {
            if (data.plans) {
              const arr = Object.values(data.plans);
              if (arr.length > 0) setPreFetchedPlans(arr);
            }
            if (data.featureNames) {
              setPreFetchedFeatureNames(data.featureNames);
            }
          })
          .catch(err => console.error('Failed to pre-fetch plans', err));

        fetch('/api/config/public')
          .then(res => res.json())
          .then(data => {
            if (data.googleClientId) setPreFetchedGoogleClientId(data.googleClientId);
            if (data.receiverUpiId) setPreFetchedReceiverUpiId(data.receiverUpiId);
            if (data.receiverName) setPreFetchedReceiverName(data.receiverName);
            if (data.razorpayKeyId) setPreFetchedRazorpayKeyId(data.razorpayKeyId);
          })
          .catch(err => console.error('Failed to pre-fetch public config', err));
      } catch (err) {
        console.error('Failed pre-fetching app config:', err);
      }
    };
    preFetchData();
  }, []);

  const [appConfig, setAppConfig] = useState(null);

  // 1. Check Setup Status & Auto-login on Start
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      setSetupCompleted(data.setupCompleted);
      if (!data.setupCompleted) {
        setView('setup');
        return;
      }
      // Check if user was previously logged in
      const savedUser = localStorage.getItem('logged_in_user');
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          setCurrentUser(userObj);
          fetchUserStatus(userObj.email);
          // Owner goes to owner portal, everyone else to chat
          if (userObj.email === 'prakharmishra00000@gmail.com') {
            setView('owner_portal');
          } else {
            setView('chat');
          }
          return;
        } catch (e) {
          console.error('Corrupted localStorage, clearing:', e);
          localStorage.removeItem('logged_in_user');
        }
      }
      // No saved user — go directly to chat as ANONYMOUS (no login screen!)
      setView('chat');
      fetchDeviceStatus();
    } catch (e) {
      console.error('Failed to query setup status:', e);
      const savedUser = localStorage.getItem('logged_in_user');
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          setCurrentUser(userObj);
          setView('chat');
          return;
        } catch (err) {
          localStorage.removeItem('logged_in_user');
        }
      }
      // Even on error, go to chat anonymously (not login!)
      setView('chat');
    }
  };

  // Fetch device status for anonymous users
  const fetchDeviceStatus = async () => {
    try {
      const res = await fetch('/api/device/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      const data = await res.json();
      if (!data.error) {
        setUserPlanDetails(data);
      }
    } catch (e) {
      console.error('Failed to fetch device status:', e);
    }
  };

  // 2. Fetch User Plan Details & Refresh Usage
  const fetchUserStatus = async (email) => {
    if (!email) return;
    try {
      const res = await fetch('/api/user/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!data.error) {
        setUserPlanDetails(data);
        if (data.plan !== 'free' && data.expiry) {
          const expiryDate = new Date(data.expiry);
          const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft === 7 || daysLeft === 3) {
            const lastReminderClose = localStorage.getItem(`reminder_closed_${email}_${daysLeft}`);
            const todayStr = new Date().toISOString().split('T')[0];
            if (lastReminderClose !== todayStr) {
              setShowExpiryReminder(true);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load user status:', e);
    }
  };

  // Update theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 15-second Automatic Cosmic Theme Cycling
  useEffect(() => {
    const validThemes = [
      'supernova-blast', 'solar-eruption', 'quasar-jet', 'nebula-tempest', 'hyperdrive-warp',
      'meteor-shower', 'blackhole-vortex', 'gammaray-burst', 'asteroid-storm', 'cosmic-collision'
    ];
    const timer = setInterval(() => {
      setTheme((prevTheme) => {
        const currentIndex = validThemes.indexOf(prevTheme);
        const nextIndex = (currentIndex + 1) % validThemes.length;
        return validThemes[nextIndex];
      });
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // 4. Periodic Status Sync — for logged-in users OR anonymous devices
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser?.email) {
        fetchUserStatus(currentUser.email);
      } else {
        fetchDeviceStatus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.email, deviceId]);

  // Handle successful login (from upgrade modal or direct)
  const handleLogin = (userEmail) => {
    const userObj = { email: userEmail };
    setCurrentUser(userObj);
    localStorage.setItem('logged_in_user', JSON.stringify(userObj));
    fetchUserStatus(userEmail);
    // If login was triggered from upgrade modal, keep showing upgrade
    if (showLoginForUpgrade) {
      setShowLoginForUpgrade(false);
      // Keep showUpgradeModal true — user just signed in to buy a plan
    } else if (userEmail === 'prakharmishra00000@gmail.com') {
      setView('owner_portal');
    } else {
      setView('chat');
    }
  };

  // Handle Logout — go back to anonymous chat, NOT login screen
  const handleLogout = () => {
    localStorage.removeItem('logged_in_user');
    setCurrentUser(null);
    setUserPlanDetails(null);
    setShowExpiryReminder(false);
    setIsOwnerSecured(false);
    setView('chat'); // Go to chat as anonymous, not login
    fetchDeviceStatus();
  };

  // Handle upgrade trigger — if not logged in, show login first
  const handleTriggerUpgrade = () => {
    if (!currentUser) {
      // Anonymous user trying to upgrade → show login inside upgrade modal
      setShowLoginForUpgrade(true);
    }
    setShowUpgradeModal(true);
  };

  // Check setup completed callback
  const handleSetupComplete = () => {
    setSetupCompleted(true);
    setIsOwnerSecured(false);
    setView(currentUser?.email === 'prakharmishra00000@gmail.com' ? 'owner_portal' : 'chat');
  };

  // Render correct view
  if (setupCompleted === null) {
    return (
      <div className="app-container glass-panel" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'Outfit', color: '#00f2fe' }}>Loading System...</h2>
      </div>
    );
  }

  return (
    <div className={`app-container theme-${theme}`}>
      {/* GLOBAL 3D BACKGROUND */}
      <Suspense fallback={<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, background: '#010103' }} />}>
        <SpaceBackground theme={theme} />
      </Suspense>

      {/* GLOBAL FLOATING CIRCULAR LOGO */}
      <div className="matrixmind-logo-badge" title="MatrixMind AI">
        <img src="/matrixmind-logo.jpg" alt="MatrixMind AI" />
      </div>

      {/* PERFORMANCE TOGGLE BUTTON */}
      <button 
        className="perf-toggle-btn"
        onClick={handleTogglePerfMode}
        title={perfMode ? "Switch to 3D Background" : "Switch to 2D Background (Reduces Lag)"}
      >
        {perfMode ? <Zap size={13} color="#fda085" /> : <Cpu size={13} color="#00f2fe" />}
        <span>{perfMode ? "2D BG" : "3D BG"}</span>
      </button>

      {view === 'setup' && (
        <Setup 
          onComplete={handleSetupComplete} 
          onBack={setupCompleted ? () => { setIsOwnerSecured(false); setView(currentUser?.email === 'prakharmishra00000@gmail.com' ? 'owner_portal' : 'chat'); } : null} 
          currentUser={currentUser}
        />
      )}

      {/* LOGIN VIEW — only shown if explicitly navigated to (not on startup) */}
      {view === 'login' && (
        <Login 
          onLogin={handleLogin} 
          onShowLegal={(type) => { setLegalType(type); setView('legal'); }} 
          onShowSetup={() => setView('setup')}
          preFetchedGoogleClientId={preFetchedGoogleClientId}
        />
      )}

      {view === 'owner_portal' && currentUser && (
        <OwnerPortal 
          onContinueToBot={() => { setIsOwnerSecured(false); setView('chat'); }}
          onChangeSetup={() => {
            setNextViewAfterOwnerSecured('setup');
            setView('owner_login');
          }}
          onEnterAdmin={() => {
            setNextViewAfterOwnerSecured('admin');
            setView('owner_login');
          }}
          onLogout={() => {
            setIsOwnerSecured(false);
            handleLogout();
          }}
        />
      )}

      {view === 'owner_login' && (
        <OwnerSecureLogin 
          onSuccess={() => {
            setIsOwnerSecured(true);
            setView(nextViewAfterOwnerSecured || 'owner_portal');
          }}
          onBack={() => {
            setIsOwnerSecured(false);
            setView('owner_portal');
          }}
        />
      )}

      {/* CHAT VIEW — now works for both anonymous and logged-in users */}
      {view === 'chat' && (
        <Dashboard
          key={currentUser?.email || deviceId}
          currentUser={currentUser}
          deviceId={deviceId}
          userPlanDetails={userPlanDetails}
          refreshUserStatus={() => currentUser ? fetchUserStatus(currentUser.email) : fetchDeviceStatus()}
          onLogout={currentUser ? handleLogout : null}
          onLogin={() => { setView('login'); }}
          theme={theme}
          setTheme={setTheme}
          onTriggerUpgrade={handleTriggerUpgrade}
          onShowAdmin={() => {
            setNextViewAfterOwnerSecured('admin');
            setView('owner_login');
          }}
          onShowHelp={() => setView('help')}
        />
      )}

      {view === 'admin' && (
        <Admin 
          onBack={() => { setIsOwnerSecured(false); setView(currentUser?.email === 'prakharmishra00000@gmail.com' ? 'owner_portal' : 'chat'); }} 
          email={currentUser?.email} 
        />
      )}

      {view === 'help' && (
        <HelpSupport currentUser={currentUser || { email: 'anonymous' }} onBack={() => setView('chat')} />
      )}

      {view === 'legal' && (
        <Legal type={legalType} onBack={() => setView('chat')} />
      )}

      {/* Expiry Reminder Toast */}
      {showExpiryReminder && userPlanDetails && currentUser && (
        <div className="expiry-reminder-toast glass-panel">
          <AlertTriangle color="#ff3366" size={24} />
          <div className="reminder-content">
            <h4>Plan Expiring Soon!</h4>
            <p>Your {userPlanDetails.plan} plan is expiring in a few days. Upgrade now to avoid interruptions.</p>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => { setShowUpgradeModal(true); setShowExpiryReminder(false); }}>
              Upgrade Plan
            </button>
          </div>
          <button className="reminder-close" onClick={() => {
            setShowExpiryReminder(false);
            localStorage.setItem(`reminder_closed_${currentUser.email}`, new Date().toISOString().split('T')[0]);
          }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upgrade Subscription Modal — with login step for anonymous users */}
      {showUpgradeModal && (
        <UpgradeModal
          email={currentUser?.email || null}
          currentPlan={userPlanDetails?.plan || 'free'}
          onClose={() => { setShowUpgradeModal(false); setShowLoginForUpgrade(false); }}
          onPaymentSuccess={() => {
            if (currentUser?.email) fetchUserStatus(currentUser.email);
            setShowUpgradeModal(false);
            setShowLoginForUpgrade(false);
          }}
          preFetchedPlans={preFetchedPlans}
          preFetchedFeatureNames={preFetchedFeatureNames}
          preFetchedReceiverUpiId={preFetchedReceiverUpiId}
          preFetchedReceiverName={preFetchedReceiverName}
          preFetchedRazorpayKeyId={preFetchedRazorpayKeyId}
          preFetchedGoogleClientId={preFetchedGoogleClientId}
          needsLogin={!currentUser}
          onLoginSuccess={handleLogin}
        />
      )}
    </div>
  );
}

function OwnerPortal({ onContinueToBot, onChangeSetup, onEnterAdmin, onLogout }) {
  return (
    <div className="auth-container" style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2.2rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}>
          Owner Control Center
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '30px' }}>
          Authenticated as <strong>prakharmishra00000@gmail.com</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            className="btn" 
            onClick={onContinueToBot}
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
          >
            Continue to Bot Dashboard
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={onEnterAdmin}
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
          >
            Enter Admin Dashboard
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={onChangeSetup}
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
          >
            Change System Setup
          </button>

          <button 
            className="btn btn-danger" 
            onClick={onLogout}
            style={{ padding: '12px', fontSize: '0.9rem', marginTop: '10px' }}
          >
            Log Out Owner Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
