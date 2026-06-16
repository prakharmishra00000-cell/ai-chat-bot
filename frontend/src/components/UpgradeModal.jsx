import React, { useState, useEffect } from 'react';
import { X, Check, Award, Flame, Zap } from 'lucide-react';

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
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'upi'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Fetch dynamic plans from DB
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const data = await res.json();
          if (Object.keys(data).length > 0) {
            // Re-map backend object plans to array ordered by price
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

  const handlePay = async (plan) => {
    setError('');
    setLoading(true);

    try {
      // 1. Create order on backend
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          plan: plan.id
        })
      });

      const orderData = await orderRes.ok ? await orderRes.json() : null;

      // Handle configuration missing or test fallback simulation
      if (!orderRes.ok || !orderData || !orderData.id || !window.Razorpay) {
        console.warn('Razorpay credentials missing or blocked. Transitioning to UPI fallback scan...');
        setPaymentMethod('upi');
        setLoading(false);
        return;
      }

      // Launch Razorpay Checkout
      const options = {
        key: orderData.key || '',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MatrixMind Premium',
        description: `Upgrade to ${plan.name}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                plan: plan.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert("Thank you for choosing our plan! Hope you enjoy it.");
              onPaymentSuccess();
            } else {
              setError(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (e) {
            setError('Error verifying payment signature.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: billingName,
          email: billingEmail,
          contact: billingPhone
        },
        theme: {
          color: '#00f2fe'
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error(err);
      setError('Payment gateway error. Initializing transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  const simulatePaymentSuccess = async (planId) => {
    setLoading(true);
    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          plan: planId,
          razorpay_order_id: 'sim_order_' + Date.now(),
          razorpay_payment_id: 'sim_pay_' + Date.now(),
          razorpay_signature: 'simulated_success'
        })
      });
      const data = await verifyRes.json();
      if (data.success) {
        alert("Thank you for choosing our plan! Hope you enjoy it.");
        onPaymentSuccess();
      } else {
        setError(data.error || 'Failed to apply plan upgrade.');
      }
    } catch (e) {
      setError('Plan upgrade failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedPayment = async (e) => {
    if (e) e.preventDefault();
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

    if (paymentMethod === 'upi') {
      if (transactionId.length !== 12) {
        setError('A valid 12-digit Transaction ID is required for UPI QR payment verification.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/payment/submit-upi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            plan: selectedPlan.id,
            transactionId
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          alert(data.message || 'Your payment transaction ID has been submitted successfully. The plan will unlock once the admin approves it.');
          onClose();
        } else {
          setError(data.error || 'Failed to submit UPI verification request.');
        }
      } catch (err) {
        console.error(err);
        setError('Error submitting UPI transaction ID.');
      } finally {
        setLoading(false);
      }
    } else {
      handlePay(selectedPlan);
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
          <div style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

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

        {/* Checkout Form */}
        <form onSubmit={handleProceedPayment} className="checkout-details-form glass-panel" style={{ marginTop: '30px', padding: '25px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', fontSize: '1.25rem', marginBottom: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Billing & Checkout Details
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Payment Method</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                type="button" 
                className={`btn ${paymentMethod === 'razorpay' ? '' : 'btn-secondary'}`} 
                onClick={() => setPaymentMethod('razorpay')}
                style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
              >
                Razorpay Card/UPI
              </button>
              <button 
                type="button" 
                className={`btn ${paymentMethod === 'upi' ? '' : 'btn-secondary'}`} 
                onClick={() => setPaymentMethod('upi')}
                style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
              >
                Direct UPI QR (Kotak Bank)
              </button>
            </div>
          </div>

          {paymentMethod === 'upi' && (
            <>
              <div style={{ textAlign: 'center', margin: '20px 0', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px dashed var(--border-glass-glow)' }}>
                <p style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', fontWeight: 800, margin: '10px 0' }}>
                  UPI ID: 6372843175@kotakbank
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Please transfer the amount ₹{selectedPlan.price} to this UPI ID using your mobile UPI app and enter the 12-digit transaction ID (UTR) below for verification.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>12-Digit UPI Transaction ID / UTR</label>
                <input 
                  type="text" 
                  placeholder="Enter 12-digit transaction ID" 
                  value={transactionId} 
                  onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, '').slice(0, 12))} 
                  required 
                  maxLength="12"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid var(--border-glass)' }}
                />
              </div>
            </>
          )}

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
            {loading ? 'Processing Transaction...' : paymentMethod === 'upi' ? 'Confirm Transfer & Instantly Unlock Plan' : `Proceed to Secure Payment (₹${selectedPlan ? selectedPlan.price : 0})`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpgradeModal;
