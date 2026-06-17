import React, { useState, useEffect } from 'react';
import Setup from './components/Setup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Legal from './components/Legal';
import UpgradeModal from './components/UpgradeModal';
import HelpSupport from './components/HelpSupport';
import OwnerSecureLogin from './components/OwnerSecureLogin';
import { AlertTriangle, X } from 'lucide-react';
import './App.css';

function App() {
  const [setupCompleted, setSetupCompleted] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'chat', 'admin', 'legal'
  const [legalType, setLegalType] = useState('tos'); // 'tos', 'privacy'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'default');
  const [isOwnerSecured, setIsOwnerSecured] = useState(false);
  const [nextViewAfterOwnerSecured, setNextViewAfterOwnerSecured] = useState('');
  
  // Subscription Plan Popup triggers
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userPlanDetails, setUserPlanDetails] = useState(null);
  const [showExpiryReminder, setShowExpiryReminder] = useState(false);

  // Configuration settings (Gemini API key checks)
  const [appConfig, setAppConfig] = useState(null);

  // 1. Check Setup Status & Load Configuration on Start
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
      // Setup is done — check if user is already logged in (auto-login)
      const savedUser = localStorage.getItem('logged_in_user');
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          setCurrentUser(userObj);
          fetchUserStatus(userObj.email);
          if (userObj.email === 'prakharmishra00000@gmail.com') {
            setView('owner_portal');
          } else {
            setView('chat');
          }
          return; // Already logged in — skip login screen
        } catch (e) {
          console.error('Corrupted localStorage, clearing:', e);
          localStorage.removeItem('logged_in_user');
        }
      }
      // No saved user — show login
      setView('login');
    } catch (e) {
      console.error('Failed to query setup status:', e);
      // Even on error, try auto-login
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
      setView('setup');
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

  // Update theme tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 4. Periodic User Status Sync — keeps plan/prompts/expiry synced across devices
  useEffect(() => {
    if (!currentUser?.email) return;
    const interval = setInterval(() => {
      fetchUserStatus(currentUser.email);
    }, 10000); // Refresh every 10 seconds for instant upgrades
    return () => clearInterval(interval);
  }, [currentUser?.email]);

  // Handle successful login
  const handleLogin = (userEmail) => {
    const userObj = { email: userEmail };
    setCurrentUser(userObj);
    localStorage.setItem('logged_in_user', JSON.stringify(userObj));
    fetchUserStatus(userEmail);
    if (userEmail === 'prakharmishra00000@gmail.com') {
      setView('owner_portal');
    } else {
      setView('chat');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('logged_in_user');
    setCurrentUser(null);
    setUserPlanDetails(null);
    setShowExpiryReminder(false);
    setIsOwnerSecured(false);
    setView('login');
  };

  // Check setup completed callback
  const handleSetupComplete = () => {
    setSetupCompleted(true);
    setIsOwnerSecured(false);
    setView(currentUser?.email === 'prakharmishra00000@gmail.com' ? 'owner_portal' : 'login');
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
    <div className="app-container">
      {view === 'setup' && (
        <Setup 
          onComplete={handleSetupComplete} 
          onBack={setupCompleted ? () => { setIsOwnerSecured(false); setView(currentUser?.email === 'prakharmishra00000@gmail.com' ? 'owner_portal' : 'login'); } : null} 
          currentUser={currentUser}
        />
      )}

      {view === 'login' && (
        <Login 
          onLogin={handleLogin} 
          onShowLegal={(type) => { setLegalType(type); setView('legal'); }} 
          onShowSetup={() => setView('setup')}
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

      {view === 'chat' && currentUser && (
        <Dashboard
          key={currentUser.email}
          currentUser={currentUser}
          userPlanDetails={userPlanDetails}
          refreshUserStatus={() => fetchUserStatus(currentUser.email)}
          onLogout={handleLogout}
          theme={theme}
          setTheme={setTheme}
          onTriggerUpgrade={() => setShowUpgradeModal(true)}
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

      {view === 'help' && currentUser && (
        <HelpSupport currentUser={currentUser} onBack={() => setView('chat')} />
      )}

      {view === 'legal' && (
        <Legal type={legalType} onBack={() => setView(currentUser ? 'chat' : 'login')} />
      )}

      {/* Expiry Reminder Toast */}
      {showExpiryReminder && userPlanDetails && (
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

      {/* Upgrade Subscription Modal */}
      {showUpgradeModal && currentUser && (
        <UpgradeModal
          email={currentUser.email}
          currentPlan={userPlanDetails?.plan || 'free'}
          onClose={() => setShowUpgradeModal(false)}
          onPaymentSuccess={() => {
            fetchUserStatus(currentUser.email);
            setShowUpgradeModal(false);
          }}
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
