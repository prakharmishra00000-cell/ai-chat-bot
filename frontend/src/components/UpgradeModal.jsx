import React, { useState, useEffect } from 'react';
import { X, Check, Award, Flame, Zap, Copy, Loader, CheckCircle, AlertCircle } from 'lucide-react';

function UpgradeModal({ email, currentPlan, onClose, onPaymentSuccess }) {
  const fallbackPlans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: 0,
      duration: 'Forever',
      prompts: 30,
      efficiency: 'Standard Response Rate',
      features: [
        '30 daily prompts limit',
        'Standard processing priority',
        'Data Masking (5/day)',
        'Interview Mode (3/day)'
      ]
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      price: 99,
      duration: '1 Month',
      prompts: 100,
      efficiency: 'Standard Response Rate',
      features: [
        '100 daily prompts limit',
        'Standard processing priority',
        'Data Masking (20/day)',
        'Interview Mode (10/day)',
        'Includes Web Grounding Search',
        'Standard AI rotation support',
        'Valid for 30 Days'
      ]
    },
    {
      id: 'better',
      name: 'Better Plan',
      price: 199,
      duration: '3 Months',
      prompts: 150,
      efficiency: 'High Response Rate',
      popular: true,
      features: [
        '150 daily prompts limit',
        'Better response processing priority',
        'Data Masking (50/day)',
        'Interview Mode (30/day)',
        'Workflow Sequencer (10/day)',
        'Web Search & Matrix groundings',
        'Priority AI rotation support',
        'Valid for 90 Days'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 999,
      duration: '1 Year',
      prompts: 200,
      efficiency: 'Maximum Response Rate',
      features: [
        '200 daily prompts limit',
        'Maximum processing priority',
        'Data Masking (Unlimited)',
        'Interview Mode (Unlimited)',
        'Workflow Sequencer (Unlimited)',
        'Council Room (Unlimited)',
        'Live Diagrams & Mind maps',
        'Ultimate key-rotation priority',
        'Valid for 365 Days'
      ]
    }
  ];

  const iconsMap = {
    standard: <Zap size={32} color="#4facfe" />,
    better: <Award size={32} color="#ffe259" />,
    premium: <Flame size={32} color="#ff3366" />,
    free: <Zap size={32} color="#94a3b8" />
  };

  const [dbPlans, setDbPlans] = useState(fallbackPlans);
  const [featureNames, setFeatureNames] = useState({});
  const [utrInput, setUtrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [receiverUpiId, setReceiverUpiId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [hasCustomQR, setHasCustomQR] = useState(null); // null = loading, true/false = resolved

  // Detect mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Fetch plans from DB
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const data = await res.json();
          if (data.featureNames) {
            setFeatureNames(data.featureNames);
          }
          const plansObj = data.plans || data; // handle backward compat
          if (Object.keys(plansObj).length > 0) {
            const ordered = ['free', 'standard', 'better', 'premium']
              .map(id => plansObj[id])
              .filter(Boolean);
            if (ordered.length > 0) setDbPlans(ordered);
          }
        }
      } catch (e) {
        console.warn('Failed to load plans from DB, using fallbacks:', e);
      }
    };
    fetchPlans();
  }, []);

  // Fetch public config for UPI ID
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config/public');
        if (res.ok) {
          const data = await res.json();
          if (data.receiverUpiId) setReceiverUpiId(data.receiverUpiId);
          if (data.receiverName) setReceiverName(data.receiverName);
        }
      } catch (e) {
        console.warn('Failed to fetch public config:', e);
      }
    };
    fetchConfig();
  }, []);

  // Check if admin uploaded a custom QR
  useEffect(() => {
    const checkQR = async () => {
      try {
        const res = await fetch('/api/payment-qr', { method: 'HEAD' });
        setHasCustomQR(res.ok);
      } catch {
        setHasCustomQR(false);
      }
    };
    checkQR();
  }, []);

  // Copy UPI ID
  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(receiverUpiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = receiverUpiId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Submit UTR for admin verification
  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (utrInput.length !== 12) {
      setError('Please enter a valid 12-digit UTR number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payment/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, utr: utrInput, planRequested: '' })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Your UTR has been submitted! Your plan will be activated once admin verifies your payment.');
      } else {
        setError(data.error || 'Failed to submit UTR. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error while submitting UTR.');
    } finally {
      setLoading(false);
    }
  };

  // Build the auto-generated QR URL from the receiver UPI ID (no amount)
  const autoQrUrl = receiverUpiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${receiverUpiId}&pn=${encodeURIComponent(receiverName || 'Payment')}&cu=INR`)}`
    : '';

  // UPI intent URL for mobile (no amount — admin decides the plan)
  const upiIntentUrl = receiverUpiId
    ? `upi://pay?pa=${receiverUpiId}&pn=${encodeURIComponent(receiverName || 'Payment')}&cu=INR`
    : '';

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="plans-title">Choose Your Plan</h2>
        <p className="plans-subtitle">Review our plans below, then complete your UPI payment and submit the UTR for verification.</p>

        {/* Error / Success messages */}
        {error && (
          <div style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div style={{ color: '#00f2fe', background: 'rgba(0,242,254,0.1)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {/* ===== PLAN CARDS (View Only) ===== */}
        <div className="plans-grid">
          {dbPlans.map((plan) => {
            const isActive = currentPlan === plan.id;
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`plan-card glass-panel ${isPopular ? 'popular' : ''}`}
                style={{
                  cursor: 'default',
                  border: isActive ? '2px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {isPopular && <span className="plan-badge">Most Popular</span>}
                <div style={{ marginBottom: '15px' }}>{iconsMap[plan.id] || <Zap size={32} color="#4facfe" />}</div>
                <h3 className="plan-name">{plan.name}</h3>

                <div className="plan-price-row">
                  <span className="plan-price">₹{plan.price}</span>
                  <span className="plan-duration">/ {plan.duration || 'Month'}</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {plan.efficiency || (plan.id === 'premium' ? 'Maximum Response Rate' : 'High Response Rate')}
                </div>

                <ul className="plan-features">
                  {/* Render dynamic features if featureLimits exists, else fallback to hardcoded features array */}
                  {(() => {
                    let displayFeatures = plan.features || [];
                    if (plan.featureLimits && Object.keys(featureNames).length > 0) {
                      const baseFeatures = displayFeatures.filter(f => !f.includes('/day') && !f.includes('Unlimited') && !f.includes('Masking') && !f.includes('Workflow') && !f.includes('Council') && !f.includes('Interview') && !f.includes('PPT') && !f.includes('Mind Map') && !f.includes('Matrix') && !f.includes('Optimization'));
                      const dynamicFeatures = [];
                      Object.keys(plan.featureLimits).forEach(key => {
                        const limit = plan.featureLimits[key];
                        const name = featureNames[key] || key;
                        if (limit > 0) dynamicFeatures.push(`${name} (${limit}/day)`);
                        else if (limit === -1) dynamicFeatures.push(`${name} (Unlimited)`);
                      });
                      displayFeatures = [...baseFeatures, ...dynamicFeatures];
                    }
                    
                    return displayFeatures.map((feature, idx) => (
                      <li key={idx}>
                        <Check size={16} color="var(--accent-cyan)" />
                        <span>{feature}</span>
                      </li>
                    ));
                  })()}
                </ul>

                {isActive && (
                  <div style={{
                    marginTop: 'auto',
                    padding: '8px 16px',
                    background: 'rgba(0, 242, 254, 0.1)',
                    border: '1px solid var(--accent-cyan)',
                    borderRadius: '8px',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    ✓ Active
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ===== PAYMENT SECTION ===== */}
        {!success && (
          <div className="glass-panel" style={{ marginTop: '30px', padding: '25px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', fontSize: '1.25rem', marginBottom: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
              Complete Payment via UPI
            </h3>

            {/* QR Code */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                📱 Scan this QR code with any UPI app to pay
              </p>
              <div style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '12px' }}>
                <img
                  src={hasCustomQR ? `/api/payment-qr?t=${Date.now()}` : autoQrUrl}
                  alt="UPI Payment QR Code"
                  style={{ width: '220px', height: '220px', display: 'block', objectFit: 'contain' }}
                  onError={(e) => {
                    // If custom QR fails, fallback to auto-generated
                    if (autoQrUrl && e.target.src.indexOf('api.qrserver.com') === -1) {
                      e.target.src = autoQrUrl;
                    }
                  }}
                />
              </div>
            </div>

            {/* UPI ID display + Copy */}
            {receiverUpiId && (
              <div style={{ textAlign: 'center', margin: '15px 0', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px dashed var(--border-glass-glow)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  UPI ID — Pay to
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <p style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)', fontWeight: 800, fontFamily: 'monospace', margin: 0 }}>
                    {receiverUpiId}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyUpiId}
                    style={{ background: 'none', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '4px 8px', color: copied ? '#00f2fe' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                  >
                    <Copy size={14} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {receiverName && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Receiver: {receiverName}
                  </p>
                )}
              </div>
            )}

            {/* Mobile: Pay via UPI App button */}
            {isMobile && upiIntentUrl && (
              <a
                href={upiIntentUrl}
                className="btn"
                style={{
                  width: '100%', padding: '16px', fontSize: '1.05rem', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  textDecoration: 'none', color: 'inherit', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)'
                }}
              >
                💳 Pay via UPI App
              </a>
            )}

            {/* Instructions */}
            <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '8px' }}>📋 How to complete payment:</p>
              <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.8, margin: 0, paddingLeft: '16px' }}>
                <li>Make payment for your desired plan amount using the QR code{isMobile ? ' or UPI app button' : ''} above</li>
                <li>Enter the <strong style={{ color: 'var(--accent-cyan)' }}>exact plan amount</strong> — ₹99 (Standard), ₹199 (Better), or ₹999 (Premium)</li>
                <li>Complete the payment with your UPI PIN</li>
                <li>Note the <strong style={{ color: '#ffe259' }}>12-digit UTR/Reference number</strong> from your receipt</li>
                <li>Enter the UTR below and submit for verification</li>
              </ol>
            </div>

            {/* UTR Input + Submit */}
            <form onSubmit={handleSubmitUtr}>
              <div style={{ padding: '20px', background: 'rgba(0,242,254,0.05)', borderRadius: '12px', border: '1px solid rgba(0,242,254,0.2)' }}>
                <p style={{ fontSize: '0.9rem', color: '#ffe259', fontWeight: 700, textAlign: 'center', marginBottom: '15px' }}>
                  ⚠️ Enter the 12-digit UTR number from your payment receipt
                </p>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR number"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    required
                    maxLength="12"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: 'var(--text-main)',
                      border: '2px solid var(--accent-cyan)',
                      fontSize: '1.3rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.2em',
                      textAlign: 'center',
                      padding: '14px'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: utrInput.length === 12 ? '#00f2fe' : 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                    {utrInput.length}/12 digits entered {utrInput.length === 12 ? '✅' : ''}
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}
                  disabled={loading || utrInput.length !== 12}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Loader size={20} className="spin-animation" />
                      Submitting...
                    </span>
                  ) : (
                    '📤 Submit for Verification'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== SUCCESS STATE ===== */}
        {success && (
          <div className="glass-panel" style={{ marginTop: '30px', padding: '40px', width: '100%', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <CheckCircle size={64} color="#00f2fe" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', fontSize: '1.5rem', marginBottom: '15px', fontWeight: 700 }}>
              UTR Submitted!
            </h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '10px' }}>
              {success}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              You will be notified once the admin verifies your payment.
            </p>
          </div>
        )}
      </div>

      {/* Spinner animation style */}
      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default UpgradeModal;
