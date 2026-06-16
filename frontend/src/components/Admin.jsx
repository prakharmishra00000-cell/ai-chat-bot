import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, Eye, ShieldCheck, TrendingUp, Lock, 
  RefreshCw, Trash2, Plus, ShieldAlert, Cpu, Database, 
  HelpCircle, Save, Calendar, AlertTriangle, Upload, CreditCard
} from 'lucide-react';

function Admin({ onBack, email }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'plans', 'queries', 'threats', 'selfcode'
  
  // Plans Editor state
  const [editingPlans, setEditingPlans] = useState({});
  const [newFeatureText, setNewFeatureText] = useState({});
  const [showFeaturePrompt, setShowFeaturePrompt] = useState(null); // planId
  const [newFeatureInput, setNewFeatureInput] = useState('');
  
  // AI Self-Coder state
  const [coderPrompt, setCoderPrompt] = useState('');
  const [coderFile, setCoderFile] = useState('frontend/src/components/Dashboard.jsx');
  const [coderLoading, setCoderLoading] = useState(false);
  const [coderResult, setCoderResult] = useState('');
  const [coderError, setCoderError] = useState('');

  // Threat Audit state
  const [threatScanLoading, setThreatScanLoading] = useState(false);
  const [threatReport, setThreatReport] = useState('');

  // Payment Settings state
  const [payUpiId, setPayUpiId] = useState('6372843175@kotakbank');
  const [payName, setPayName] = useState('Prakhar Mishra');
  const [payQrPreview, setPayQrPreview] = useState(null);
  const [hasCustomQR, setHasCustomQR] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payMsg, setPayMsg] = useState('');

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setEditingPlans(data);
      }
    } catch (e) {
      console.error('Failed to fetch plans:', e);
    }
  };

  useEffect(() => {
    if (email !== 'prakharmishra00000@gmail.com') return;

    fetchAdminStats(email);
    
    // Auto-poll stats/approvals/backups every 10 seconds to keep dashboard updated globally
    const interval = setInterval(() => {
      fetchAdminStats(email);
    }, 10000);

    return () => clearInterval(interval);
  }, [email]);

  const fetchAdminStats = async (userEmail) => {
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        fetchPlans();
      } else {
        setError(data.error || 'Unauthorized admin access.');
      }
    } catch (e) {
      console.error(e);
      setError('Connection error: Failed to fetch admin stats.');
    }
  };

  // Update Subscription Plans in db.json
  const handleSavePlans = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/plans/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plans: editingPlans })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Subscription plan settings updated successfully!');
        fetchPlans();
        fetchAdminStats(email);
      } else {
        setError(data.error || 'Failed to update plans.');
      }
    } catch (e) {
      setError('Failed to save plans: Connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Add a feature metadata text to plan list
  const handleAddFeatureText = (planId) => {
    if (!newFeatureInput.trim()) return;
    
    const updated = { ...editingPlans };
    if (updated[planId]) {
      updated[planId].features = [...(updated[planId].features || []), newFeatureInput.trim()];
      setEditingPlans(updated);
      setNewFeatureInput('');
      setShowFeaturePrompt(null);
    }
  };

  // Remove a feature metadata text from plan list
  const handleRemoveFeatureText = (planId, featureIdx) => {
    const updated = { ...editingPlans };
    if (updated[planId] && updated[planId].features) {
      updated[planId].features = updated[planId].features.filter((_, idx) => idx !== featureIdx);
      setEditingPlans(updated);
    }
  };

  // ===== PAYMENT SETTINGS HANDLERS =====
  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch('/api/admin/payment-settings');
      if (res.ok) {
        const data = await res.json();
        setPayUpiId(data.receiverUpiId || '6372843175@kotakbank');
        setPayName(data.receiverName || 'Prakhar Mishra');
        setHasCustomQR(data.hasCustomQR || false);
        setPayQrPreview(null);
      }
    } catch (e) {
      console.error('Failed to fetch payment settings:', e);
    }
  };

  const handleSavePaymentSettings = async () => {
    setPayLoading(true);
    setPayMsg('');
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUpiId: payUpiId, receiverName: payName })
      });
      const data = await res.json();
      if (res.ok) {
        setPayMsg(data.message || 'Settings saved!');
        setTimeout(() => setPayMsg(''), 3000);
      } else {
        setPayMsg('Error: ' + (data.error || 'Failed to save.'));
      }
    } catch (e) {
      setPayMsg('Network error saving settings.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleQrFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPayMsg('Error: File too large. Max 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setPayQrPreview(base64);
      setPayLoading(true);
      setPayMsg('');
      try {
        const res = await fetch('/api/admin/upload-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: base64 })
        });
        const data = await res.json();
        if (res.ok) {
          setHasCustomQR(true);
          setPayMsg(data.message || 'QR uploaded!');
          setTimeout(() => setPayMsg(''), 3000);
        } else {
          setPayMsg('Error: ' + (data.error || 'Upload failed.'));
        }
      } catch (err) {
        setPayMsg('Network error uploading QR.');
      } finally {
        setPayLoading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset file input
  };

  const handleDeleteQr = async () => {
    setPayLoading(true);
    try {
      const res = await fetch('/api/admin/upload-qr', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setHasCustomQR(false);
        setPayQrPreview(null);
        setPayMsg(data.message || 'QR removed.');
        setTimeout(() => setPayMsg(''), 3000);
      }
    } catch (e) {
      setPayMsg('Error removing QR.');
    } finally {
      setPayLoading(false);
    }
  };

  // AI Self-Coding deployment trigger
  const handleTriggerSelfCode = async () => {
    setCoderError('');
    setCoderResult('');
    setCoderLoading(true);
    try {
      const res = await fetch('/api/admin/self-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          prompt: coderPrompt
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCoderResult(data.message);
        setCoderPrompt('');
        fetchAdminStats(email); // refresh backups list
      } else {
        setCoderError(data.message || data.error || 'Compilation errors occurred.');
      }
    } catch (e) {
      setCoderError('Self-coding server execution timed out or failed.');
    } finally {
      setCoderLoading(false);
    }
  };

  // Run AI Security threats assessment
  const handleRunThreatScan = async () => {
    setThreatReport('');
    setThreatScanLoading(true);
    try {
      const res = await fetch('/api/admin/threats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
      const data = await res.json();
      if (res.ok) {
        setThreatReport(data.report);
      } else {
        alert('Threat scan failed: ' + data.error);
      }
    } catch (e) {
      alert('Network scan error.');
    } finally {
      setThreatScanLoading(false);
    }
  };

  // Handle Approve/Reject for UPI payment requests
  const handleApprovalAction = async (requestId, action) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approvals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, requestId, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || `Request successfully ${action}ed.`);
        fetchAdminStats(email);
      } else {
        setError(data.error || 'Failed to perform approval action.');
      }
    } catch (e) {
      setError('Connection error: Failed to process approval request.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentage helper
  const getPercentage = (val, total) => {
    if (!total) return '0%';
    return `${Math.round((val / total) * 100)}%`;
  };

  if (email !== 'prakharmishra00000@gmail.com') {
    return (
      <div className="auth-container" style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card glass-panel" style={{ maxWidth: '450px', padding: '35px', textAlign: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onBack}
            style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: '20px', width: 'max-content', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h2 style={{ color: '#ff3366', fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.8rem', marginBottom: '15px' }}>Unauthorized Access</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Only the registered owner account <strong>prakharmishra00000@gmail.com</strong> is authorized to access the Admin Console.</p>
        </div>
      </div>
    );
  }

  // Find users whose plans have expired (plan === 'free' but has previous expiry)
  const expiredUsers = stats?.users?.filter(u => !u.expiry && u.plan === 'free') || [];
  
  // Current active plan expirations
  const activeExpirations = stats?.users?.filter(u => u.expiry && u.plan !== 'free') || [];

  return (
    <div className="admin-container" style={{ padding: '40px', width: '100vw', height: '100vh', overflowY: 'auto' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2.2rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            MatrixMind System Administration
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>Dynamically manage tier pricing, security assessments, and prompt features.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => fetchAdminStats(email)}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn" onClick={onBack}>
            <ArrowLeft size={16} /> Return
          </button>
        </div>
      </div>

      {/* Admin Tab navigation */}
      <div className="auth-tabs" style={{ marginBottom: '30px' }}>
        <button className={`auth-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics & Traffic</button>
        <button className={`auth-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users & Credentials</button>
        <button className={`auth-tab ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>Dynamic Plans Editor</button>
        <button className={`auth-tab ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>Pending Approvals ({stats?.pendingApprovals?.filter(r => r.status === 'pending').length || 0})</button>
        <button className={`auth-tab ${activeTab === 'queries' ? 'active' : ''}`} onClick={() => setActiveTab('queries')}>Support Queries ({stats?.supportQueries?.length || 0})</button>
        <button className={`auth-tab ${activeTab === 'threats' ? 'active' : ''}`} onClick={() => setActiveTab('threats')}>Security Threat Assessment</button>
        <button className={`auth-tab ${activeTab === 'selfcode' ? 'active' : ''}`} onClick={() => setActiveTab('selfcode')}>AI Self-Coding Developer</button>
        <button className={`auth-tab ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => { setActiveTab('payment'); fetchPaymentSettings(); }}>Payment Settings</button>
      </div>

      {error && (
        <div style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '25px' }}>
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* TAB 1: ANALYTICS & TRAFFIC */}
          {activeTab === 'analytics' && (
            <div>
              <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <div className="stat-label">Total Registered Users</div>
                  <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{stats.totalUsers}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Signed up accounts</p>
                </div>
                <div className="stat-card glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <div className="stat-label">Total Page views (Today)</div>
                  <div className="stat-value" style={{ color: '#ffe259' }}>{stats.visitorsToday}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Total traffic hits</p>
                </div>
                <div className="stat-card glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <div className="stat-label">Anonymous Visitors (Today)</div>
                  <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>
                    {stats.anonymousVisits[new Date().toISOString().split('T')[0]] || 0}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Visited but did not sign up</p>
                </div>
                <div className="stat-card glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <div className="stat-label">Total Revenue Generated</div>
                  <div className="stat-value" style={{ color: 'var(--accent-neon-green)' }}>₹{stats.totalRevenue}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>UPI & Razorpay checkouts</p>
                </div>
              </div>

              <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                {/* Transaction history logs */}
                <div className="admin-table-container glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
                  <h3 className="admin-section-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '20px' }}>
                    Recent Payments Logs
                  </h3>
                  {stats.transactions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>No payments logged yet.</p>
                  ) : (
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Email</th>
                          <th>Plan</th>
                          <th>Payment ID</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.transactions.map((t) => (
                          <tr key={t.id}>
                            <td>{new Date(t.date).toLocaleDateString()}</td>
                            <td style={{ fontWeight: 600 }}>{t.email}</td>
                            <td><span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-cyan)' }}>{t.plan.toUpperCase()}</span></td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.razorpayPaymentId}</td>
                            <td style={{ color: 'var(--accent-neon-green)', fontWeight: 700 }}>₹{t.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Plan distributions charts */}
                <div className="admin-chart-box glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
                  <h3 className="admin-section-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '20px' }}>
                    Active Plan Distribution
                  </h3>
                  <div className="bar-chart" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="chart-bar-row">
                      <span className="chart-label">Free</span>
                      <div className="chart-bar-wrapper" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', margin: '0 15px' }}>
                        <div className="chart-bar-fill" style={{ width: getPercentage(stats.planDistribution.free, stats.totalUsers), height: '100%', background: '#94a3b8', borderRadius: '6px' }}></div>
                      </div>
                      <span className="chart-value">{stats.planDistribution.free}</span>
                    </div>
                    <div className="chart-bar-row">
                      <span className="chart-label">Standard</span>
                      <div className="chart-bar-wrapper" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', margin: '0 15px' }}>
                        <div className="chart-bar-fill" style={{ width: getPercentage(stats.planDistribution.standard, stats.totalUsers), height: '100%', background: 'var(--accent-cyan)', borderRadius: '6px' }}></div>
                      </div>
                      <span className="chart-value">{stats.planDistribution.standard}</span>
                    </div>
                    <div className="chart-bar-row">
                      <span className="chart-label">Better</span>
                      <div className="chart-bar-wrapper" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', margin: '0 15px' }}>
                        <div className="chart-bar-fill" style={{ width: getPercentage(stats.planDistribution.better, stats.totalUsers), height: '100%', background: '#ffe259', borderRadius: '6px' }}></div>
                      </div>
                      <span className="chart-value">{stats.planDistribution.better}</span>
                    </div>
                    <div className="chart-bar-row">
                      <span className="chart-label">Premium</span>
                      <div className="chart-bar-wrapper" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', margin: '0 15px' }}>
                        <div className="chart-bar-fill" style={{ width: getPercentage(stats.planDistribution.premium, stats.totalUsers), height: '100%', background: '#ff3366', borderRadius: '6px' }}></div>
                      </div>
                      <span className="chart-value">{stats.planDistribution.premium}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS & CREDENTIALS (EXCLUDING CHATS) */}
          {activeTab === 'users' && (
            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
              <div className="admin-table-container glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
                <h3 className="admin-section-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '20px' }}>
                  Registered Profiles & Credentials
                </h3>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th>Signup Email</th>
                      <th>Plan Tier</th>
                      <th>Prompts Used</th>
                      <th>Expiration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.users.map((u, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.email}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: u.plan === 'free' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 242, 254, 0.1)', color: u.plan === 'free' ? '#94a3b8' : 'var(--accent-cyan)' }}>
                            {u.plan.toUpperCase()}
                          </span>
                        </td>
                        <td>{u.promptsUsed} prompts</td>
                        <td style={{ fontSize: '0.85rem', color: u.expiry ? 'var(--accent-neon-green)' : 'var(--text-muted)' }}>
                          {u.expiry ? new Date(u.expiry).toLocaleDateString() + ' ' + new Date(u.expiry).toLocaleTimeString() : 'None (Unlimited/Free)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expiry alerts & expired plans statistics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#ffb86c', marginBottom: '15px' }}>
                    <Calendar size={18} /> Active Subscriptions
                  </h4>
                  {activeExpirations.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No active premium members.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeExpirations.map((u, i) => (
                        <li key={i} style={{ fontSize: '0.8rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-glass)' }}>
                          <span style={{ fontWeight: 600 }}>{u.email}</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span>Tier: {u.plan.toUpperCase()}</span>
                            <span>Expires: {new Date(u.expiry).toLocaleDateString()}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#ff5555', marginBottom: '15px' }}>
                    <AlertTriangle size={18} /> Expired Members
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Users whose subscription terms have ended and downgraded to free tier:
                  </p>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ff5555' }}>
                    {expiredUsers.length} accounts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMIC PLANS EDITOR */}
          {activeTab === 'plans' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>
                  Subscription Tiers configuration
                </h3>
                <button className="btn" onClick={handleSavePlans} disabled={loading} style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                  <Save size={16} /> Save Plan Settings
                </button>
              </div>

              <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                {Object.keys(editingPlans).map((planId) => {
                  const plan = editingPlans[planId];
                  return (
                    <div key={planId} className="plan-card glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)', marginBottom: '15px', textTransform: 'uppercase', textAlign: 'center' }}>
                        {plan.name} configuration
                      </h4>
                      
                      <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Plan Price (₹)</label>
                        <input 
                          type="number" 
                          value={plan.price} 
                          onChange={(e) => {
                            const updated = { ...editingPlans };
                            updated[planId].price = parseInt(e.target.value) || 0;
                            setEditingPlans(updated);
                          }}
                          disabled={planId === 'free'}
                          style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px' }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Daily Prompts limit</label>
                        <input 
                          type="number" 
                          value={plan.prompts} 
                          onChange={(e) => {
                            const updated = { ...editingPlans };
                            updated[planId].prompts = parseInt(e.target.value) || 0;
                            setEditingPlans(updated);
                          }}
                          style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px' }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Billing Duration Description</label>
                        <input 
                          type="text" 
                          value={plan.duration || ''} 
                          onChange={(e) => {
                            const updated = { ...editingPlans };
                            updated[planId].duration = e.target.value;
                            setEditingPlans(updated);
                          }}
                          disabled={planId === 'free'}
                          placeholder="e.g. 1 Month, 1 Year"
                          style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px' }}
                        />
                      </div>

                      {planId !== 'free' && (
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Days Duration</label>
                          <input 
                            type="number" 
                            value={plan.days || 30} 
                            onChange={(e) => {
                              const updated = { ...editingPlans };
                              updated[planId].days = parseInt(e.target.value) || 30;
                              setEditingPlans(updated);
                            }}
                            style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px' }}
                          />
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '10px', paddingTop: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Features List</span>
                          <button 
                            type="button"
                            onClick={() => setShowFeaturePrompt(planId)} 
                            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {showFeaturePrompt === planId && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input 
                              type="text" 
                              placeholder="Enter feature prompt text" 
                              value={newFeatureInput}
                              onChange={(e) => setNewFeatureInput(e.target.value)}
                              style={{ padding: '6px', fontSize: '0.75rem', flex: 1, background: 'rgba(0,0,0,0.4)' }}
                            />
                            <button 
                              type="button" 
                              className="btn" 
                              onClick={() => handleAddFeatureText(planId)} 
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            >
                              Apply
                            </button>
                          </div>
                        )}

                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {plan.features?.map((f, idx) => (
                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>• {f}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveFeatureText(planId, idx)} 
                                style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: PENDING UPI APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="admin-table-container glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
              <h3 className="admin-section-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '20px' }}>
                Pending UPI Payments Verification
              </h3>
              {stats.pendingApprovals.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>No UPI transactions submitted for verification yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>User Email</th>
                        <th>Requested Plan</th>
                        <th>Amount</th>
                        <th>UTR / Transaction ID</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.pendingApprovals.map((req) => (
                        <tr key={req.id}>
                          <td>{new Date(req.date).toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{req.email}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-cyan)' }}>
                              {req.plan.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{req.amount}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 600 }}>{req.transactionId}</td>
                          <td>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              background: req.status === 'pending' ? 'rgba(255, 165, 0, 0.1)' : req.status === 'approved' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 51, 102, 0.1)', 
                              color: req.status === 'pending' ? 'orange' : req.status === 'approved' ? 'var(--accent-neon-green)' : '#ff3366' 
                            }}>
                              {req.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {req.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                  className="btn" 
                                  onClick={() => handleApprovalAction(req.id, 'approve')}
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--accent-neon-green)', color: '#000' }}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="btn btn-danger" 
                                  onClick={() => handleApprovalAction(req.id, 'reject')}
                                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUPPORT CENTER QUERY LOGS */}
          {activeTab === 'queries' && (
            <div className="admin-table-container glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)' }}>
              <h3 className="admin-section-title" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '20px' }}>
                User Queries & Support Tickets
              </h3>
              {stats.supportQueries.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>No queries submitted yet.</p>
              ) : (
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sender Email</th>
                      <th>Query Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.supportQueries.map((q) => (
                      <tr key={q.id}>
                        <td>{new Date(q.date).toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{q.email}</td>
                        <td style={{ padding: '12px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>{q.query}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY THREAT AUDIT */}
          {activeTab === 'threats' && (
            <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>
                    7-Day Website Cyber Threat Scan
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                    Queries Gemini model rotation credentials to run heuristics audits over system logs and suggest immediate solutions.
                  </p>
                </div>
                <button 
                  className="btn" 
                  onClick={handleRunThreatScan} 
                  disabled={threatScanLoading}
                  style={{ padding: '12px 24px', fontSize: '0.9rem' }}
                >
                  {threatScanLoading ? 'Scanning Codebase Logs...' : 'Execute AI Threat Audit'}
                </button>
              </div>

              {threatReport ? (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-glass)', maxHeight: '60vh', overflowY: 'auto' }}>
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: '1.6rem' }}>
                    {threatReport}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <ShieldAlert size={48} style={{ margin: '0 auto 15px', color: 'var(--text-muted)' }} />
                  <p>Execute audit scan to generate the predictive report.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AI SELF-CODING AGENT */}
          {activeTab === 'selfcode' && (
            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
              <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-cyan)', marginBottom: '15px' }}>
                  AI Developer Agent (Self-Coding Engine)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Describe a feature or code correction you want. The AI Dev-Agent will read the target file, write updated code, create a secure backup, verify compilation, and automatically deploy the edits.
                </p>

                {coderResult && (
                  <div style={{ color: 'var(--accent-neon-green)', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
                    <strong>Success:</strong> {coderResult}
                  </div>
                )}

                {coderError && (
                  <div style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                    <strong>Build Error:</strong> {coderError}
                  </div>
                )}



                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Feature Prompt Description</label>
                  <textarea 
                    rows="5"
                    placeholder="e.g. Add a light bulb icon in Dashboard.jsx next to chat topics that optimizes prompts when clicked..."
                    value={coderPrompt}
                    onChange={(e) => setCoderPrompt(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}
                  />
                </div>

                <button 
                  className="btn" 
                  onClick={handleTriggerSelfCode} 
                  disabled={coderLoading || !coderPrompt.trim()}
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Cpu size={18} /> {coderLoading ? 'Running Compiler Diagnostics & Build Loop...' : 'Deploy Feature & Rebuild Code'}
                </button>
              </div>

              {/* Backups log */}
              <div className="glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', maxHeight: '70vh', overflowY: 'auto' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', marginBottom: '15px', color: 'var(--accent-cyan)' }}>
                  <Database size={16} /> Codebase Backups
                </h4>
                {stats.backups.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No backups created yet.</p>
                ) : (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.backups.map((b, i) => (
                      <li key={i} style={{ fontSize: '0.8rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-glass)' }}>
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{b.filename}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <span>Size: {Math.round(b.size / 1024)} KB</span>
                          <span>{new Date(b.date).toLocaleDateString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-lg)', maxWidth: '700px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={22} /> Payment & UPI Settings
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '25px' }}>
                Configure the UPI ID where user payments will be credited. Upload a custom QR code or let the system auto-generate one.
              </p>

              {payMsg && (
                <div style={{ color: '#00f2fe', background: 'rgba(0,242,254,0.1)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
                  {payMsg}
                </div>
              )}

              {/* UPI ID */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Receiver UPI ID</label>
                <input
                  type="text"
                  value={payUpiId}
                  onChange={(e) => setPayUpiId(e.target.value)}
                  placeholder="e.g. 6372843175@kotakbank"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', fontSize: '1rem', fontFamily: 'monospace' }}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>All user payments will go to this UPI ID</p>
              </div>

              {/* Receiver Name */}
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Receiver Name</label>
                <input
                  type="text"
                  value={payName}
                  onChange={(e) => setPayName(e.target.value)}
                  placeholder="e.g. Prakhar Mishra"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid var(--border-glass)' }}
                />
              </div>

              {/* Save UPI Settings */}
              <button
                className="btn"
                onClick={handleSavePaymentSettings}
                disabled={payLoading}
                style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Save size={18} /> {payLoading ? 'Saving...' : 'Save UPI Settings'}
              </button>

              {/* Divider */}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '25px 0' }} />

              {/* QR Code Upload */}
              <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} /> Custom Payment QR Code
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                Upload your UPI QR code image. This QR will be shown to users on the payment screen. If no QR is uploaded, an auto-generated one will be used.
              </p>

              {/* Current QR preview */}
              {(payQrPreview || hasCustomQR) && (
                <div style={{ textAlign: 'center', marginBottom: '20px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed var(--border-glass-glow)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Current QR Code</p>
                  <div style={{ display: 'inline-block', padding: '10px', background: '#fff', borderRadius: '10px' }}>
                    <img
                      src={payQrPreview || `/api/payment-qr?t=${Date.now()}`}
                      alt="Payment QR"
                      style={{ width: '200px', height: '200px', display: 'block', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              {/* Upload button */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
                <label
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '14px', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Upload size={16} /> Browse & Upload QR Image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleQrFileSelect}
                  />
                </label>

                {hasCustomQR && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleDeleteQr}
                    style={{ padding: '14px 20px', fontSize: '0.9rem', color: '#ff3366', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Supported formats: PNG, JPG, JPEG. Max size: 5MB
              </p>
            </div>
          )}

        </>
      )}
    </div>
  );
}

export default Admin;
