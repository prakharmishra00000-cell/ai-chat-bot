import React, { useState, useEffect } from 'react';
import { X, Check, Award, Flame, Zap, Copy, Loader, CheckCircle, AlertCircle } from 'lucide-react';

function UpgradeModal({ email, currentPlan, onClose, onPaymentSuccess }) {
  const fallbackPlans = [
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
  const [selectedPlan, setSelectedPlan] = useState(fallbackPlans[0]);
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState(email || '');
  const [billingPhone, setBillingPhone] = useState('');

  // Multi-step flow: 1=select, 2=payment, 3=verify
  const [step, setStep] = useState(1);
  const [transactionId, setTransactionId] = useState('');
  const [upiIntentUrl, setUpiIntentUrl] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [receiverUpiId, setReceiverUpiId] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [utrVisible, setUtrVisible] = useState(false);

  // Detect mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Fetch dynamic plans from DB
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const data = await res.json();
          if (Object.keys(data).length > 0) {
            const ordered = ['standard', 'better', 'premium']
              .map(id => data[id])
              .filter(Boolean);
            
            if (ordered.length > 0) {
              setDbPlans(ordered);
              const defaultSel = ordered.find(p => p.id !== currentPlan) || ordered[0];
              setSelectedPlan(defaultSel);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load plans from DB, using fallbacks:', e);
      }
    };
    fetchPlans();
  }, [currentPlan]);

  // Step 2: Initiate payment
  const handleInitiatePayment = async () => {
    setError('');
    if (!billingName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!billingEmail.trim()) {
      setError('Email Address is required.');
      return;
    }
    if (!billingPhone.trim() || billingPhone.trim().length < 10) {
      setError('A valid Phone Number is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: billingEmail,
          planId: selectedPlan.id
        })
      });

      const data = await res.json();

      if (res.ok && data.transactionId) {
        setTransactionId(data.transactionId);
        setUpiIntentUrl(data.upiIntentUrl || '');
        setPaymentAmount(data.amount || selectedPlan.price);
        setReceiverUpiId(data.receiverUpiId || '6372843175@kotakbank');
        setStep(2);
      } else {
        setError(data.error || 'Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error while initiating payment.');
    } finally {
      setLoading(false);
    }
  };

  // Open UPI intent on mobile
  const handleOpenUpiApp = () => {
    if (upiIntentUrl) {
      window.location.href = upiIntentUrl;
    }
  };

  // Copy UPI ID to clipboard
  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(receiverUpiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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

  // Step 3: Verify UTR
  const handleVerifyUtr = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (utrInput.length !== 12) {
      setError('Please enter a valid 12-digit UTR number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          utr: utrInput
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || 'Payment verified successfully! Your plan has been activated.');
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      } else {
        setError(data.error || 'UTR verification failed. Please check the number and try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error during UTR verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-panel">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="plans-title">Upgrade Your Brain</h2>
        <p className="plans-subtitle">Unlock daily prompt capacity, rotation speed, and matrix features. Experience maximum cognitive power.</p>

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

        {/* ===== STEP 1: Plan Selection ===== */}
        {step === 1 && (
          <>
            <div className="plans-grid">
              {dbPlans.map((plan) => {
                const isActive = currentPlan === plan.id;
                const isPlanSelected = selectedPlan && selectedPlan.id === plan.id;
                
                return (
                  <div 
                    key={plan.id} 
                    className={`plan-card glass-panel ${plan.popular ? 'popular' : ''}`}
                    onClick={() => !isActive && setSelectedPlan(plan)}
                    style={{ 
                      cursor: isActive ? 'not-allowed' : 'pointer',
                      border: isPlanSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                      boxShadow: isPlanSelected ? 'var(--shadow-glow)' : 'none',
                      transform: isPlanSelected ? 'scale(1.02)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {plan.popular && <span className="plan-badge">Most Popular</span>}
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
                      {plan.features.map((f, idx) => (
                        <li key={idx}>
                          <Check size={16} color="var(--accent-cyan)" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      className={`btn plan-btn ${isActive ? 'btn-secondary' : isPlanSelected ? '' : 'btn-secondary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) setSelectedPlan(plan);
                      }}
                      disabled={isActive}
                    >
                      {isActive ? 'Current Plan' : isPlanSelected ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Billing & Checkout Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleInitiatePayment(); }} className="checkout-details-form glass-panel" style={{ marginTop: '30px', padding: '25px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', fontSize: '1.25rem', marginBottom: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Billing & Checkout Details
              </h3>

              <div className="keys-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Selected Tier</label>
                  <input 
                    type="text" 
                    value={selectedPlan ? selectedPlan.name : ''} 
                    readOnly 
                    style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', cursor: 'not-allowed' }} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Amount Box (INR)</label>
                  <input 
                    type="text" 
                    value={selectedPlan ? `₹ ${selectedPlan.price}` : ''} 
                    readOnly 
                    style={{ 
                      background: 'rgba(0,0,0,0.4)', 
                      color: 'var(--accent-cyan)', 
                      border: '1px solid var(--border-glass)', 
                      cursor: 'not-allowed', 
                      fontWeight: 800, 
                      fontSize: '1.1rem' 
                    }} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  value={billingName} 
                  onChange={(e) => setBillingName(e.target.value)} 
                  required 
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid var(--border-glass)' }}
                />
              </div>

              <div className="keys-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={billingEmail} 
                    onChange={(e) => setBillingEmail(e.target.value)} 
                    required 
                    style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid var(--border-glass)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="Enter phone number" 
                    value={billingPhone} 
                    onChange={(e) => setBillingPhone(e.target.value)} 
                    required 
                    maxLength="15"
                    style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid var(--border-glass)' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn" 
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '10px' }}
                disabled={loading || !selectedPlan}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Loader size={20} className="spin-animation" />
                    Initiating Payment...
                  </span>
                ) : (
                  `Pay ₹${selectedPlan ? selectedPlan.price : 0} via UPI`
                )}
              </button>
            </form>
          </>
        )}

        {/* ===== STEP 2: Payment Interface ===== */}
        {step === 2 && !success && (
          <div className="checkout-details-form glass-panel" style={{ padding: '30px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', fontSize: '1.25rem', marginBottom: '25px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
              Complete UPI Payment
            </h3>

            {/* Amount display */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Amount to Pay</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)' }}>
                ₹{paymentAmount}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                for {selectedPlan?.name} ({selectedPlan?.duration})
              </p>
            </div>

            {/* QR Code for desktop scanning */}
            {!isMobile && upiIntentUrl && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  📱 Scan this QR code with any UPI app on your phone
                </p>
                <div style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '12px' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUrl)}`}
                    alt="UPI Payment QR Code"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Amount ₹{paymentAmount} will be pre-filled automatically
                </p>
              </div>
            )}

            {/* UPI App buttons */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isMobile ? 'Tap to pay with your UPI app' : 'Or pay directly using'}
              </p>
              
              {/* Main UPI intent button */}
              {upiIntentUrl && (
                <a
                  href={upiIntentUrl}
                  className="btn"
                  style={{ 
                    width: '100%', padding: '16px', fontSize: '1.05rem', marginBottom: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    textDecoration: 'none', color: 'inherit', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)'
                  }}
                >
                  💳 Pay ₹{paymentAmount} via any UPI App
                </a>
              )}

              {/* Individual UPI app deep links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <a 
                  href={`tez://upi/pay?pa=${receiverUpiId}&pn=${encodeURIComponent('Prakhar Mishra')}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(transactionId)}`}
                  className="btn btn-secondary"
                  style={{ padding: '12px', fontSize: '0.85rem', textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'block' }}
                >
                  Google Pay
                </a>
                <a 
                  href={`phonepe://pay?pa=${receiverUpiId}&pn=${encodeURIComponent('Prakhar Mishra')}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(transactionId)}`}
                  className="btn btn-secondary"
                  style={{ padding: '12px', fontSize: '0.85rem', textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'block' }}
                >
                  PhonePe
                </a>
                <a 
                  href={`paytmmp://pay?pa=${receiverUpiId}&pn=${encodeURIComponent('Prakhar Mishra')}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(transactionId)}`}
                  className="btn btn-secondary"
                  style={{ padding: '12px', fontSize: '0.85rem', textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'block' }}
                >
                  Paytm
                </a>
                <a 
                  href={`upi://pay?pa=${receiverUpiId}&pn=${encodeURIComponent('Prakhar Mishra')}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(transactionId)}`}
                  className="btn btn-secondary"
                  style={{ padding: '12px', fontSize: '0.85rem', textDecoration: 'none', color: 'inherit', textAlign: 'center', display: 'block' }}
                >
                  BHIM / Other
                </a>
              </div>
            </div>

            {/* UPI ID for manual payment */}
            <div style={{ textAlign: 'center', margin: '15px 0', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px dashed var(--border-glass-glow)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                UPI ID (for manual payment)
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
            </div>

            {/* Step-by-step instructions */}
            <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '8px' }}>📋 Steps to complete payment:</p>
              <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.8, margin: 0, paddingLeft: '16px' }}>
                <li>{isMobile ? 'Tap "Pay via any UPI App" or select your preferred app above' : 'Scan the QR code above OR tap any UPI app button'}</li>
                <li>Amount <strong style={{ color: 'var(--accent-cyan)' }}>₹{paymentAmount}</strong> will be pre-filled automatically</li>
                <li>Enter your UPI PIN to complete payment securely</li>
                <li>After payment success, note the <strong style={{ color: '#ffe259' }}>12-digit UTR/Reference number</strong></li>
                <li>Click "I have completed payment" below and enter the UTR</li>
              </ol>
            </div>

            {/* Confirmation button — shows UTR input */}
            {!utrVisible ? (
              <button
                type="button"
                className="btn"
                onClick={() => setUtrVisible(true)}
                style={{ width: '100%', padding: '16px', fontSize: '1rem', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' }}
              >
                ✅ I have completed the payment
              </button>
            ) : (
              <>
                {/* UTR entry popup */}
                <div style={{ padding: '20px', background: 'rgba(0,242,254,0.05)', borderRadius: '12px', border: '1px solid rgba(0,242,254,0.2)', marginBottom: '15px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#ffe259', fontWeight: 700, textAlign: 'center', marginBottom: '15px' }}>
                    ⚠️ Enter the 12-digit UTR number from your payment receipt
                  </p>
                  
                  <form onSubmit={handleVerifyUtr}>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <input 
                        type="text" 
                        placeholder="Enter 12-digit UTR number" 
                        value={utrInput} 
                        onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 12))} 
                        required 
                        maxLength="12"
                        autoFocus
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
                          Verifying Payment with UroPay...
                        </span>
                      ) : (
                        '🔓 Verify & Activate Plan'
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setStep(1); setError(''); setSuccess(''); setUtrInput(''); setUtrVisible(false); }}
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '12px' }}
            >
              ← Back to Plan Selection
            </button>
          </div>
        )}

        {/* ===== SUCCESS STATE ===== */}
        {success && (
          <div className="checkout-details-form glass-panel" style={{ padding: '40px', width: '100%', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <CheckCircle size={64} color="#00f2fe" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', fontSize: '1.5rem', marginBottom: '15px', fontWeight: 700 }}>
              Payment Verified!
            </h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '10px' }}>
              {success}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Your plan is now active. Redirecting to your dashboard...
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
