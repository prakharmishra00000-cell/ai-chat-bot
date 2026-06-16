import React, { useState } from 'react';
import { ArrowLeft, Send, HelpCircle, Mail, MessageSquare } from 'lucide-react';

function HelpSupport({ currentUser, onBack }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter your query.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/support/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          query: query
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Your query has been submitted successfully out team will connect with you shortly');
        setQuery('');
      } else {
        setError(data.error || 'Failed to submit support query.');
      }
    } catch (err) {
      console.error(err);
      setError('Network communication failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '580px', width: '100%', padding: '40px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={onBack}
          style={{ padding: '8px 16px', fontSize: '0.85rem', marginBottom: '25px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Chat
        </button>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <HelpCircle size={48} color="var(--accent-cyan)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Help & Support Center
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
            Have a question or run into an issue? Drop us a query and our team will get right back to you.
          </p>
        </div>

        {message && (
          <div style={{ color: 'var(--accent-neon-green)', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '25px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Mail size={14} /> Registered User Email
            </label>
            <input 
              type="email" 
              value={currentUser.email} 
              readOnly 
              style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', cursor: 'not-allowed' }} 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              Describe Your Query or Issue
            </label>
            <textarea 
              rows="5"
              placeholder="Explain your problem, request account updates, or share feature suggestions here..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
              style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', resize: 'vertical' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            disabled={loading}
          >
            <Send size={18} /> {loading ? 'Submitting Query...' : 'Submit Query'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default HelpSupport;
