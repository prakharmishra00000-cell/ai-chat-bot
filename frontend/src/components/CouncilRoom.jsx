import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Users, Gavel, MessageSquare, Loader, ChevronRight, Swords, Handshake, Navigation } from 'lucide-react';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
    zIndex: 9999, display: 'flex', flexDirection: 'column',
    fontFamily: "'Inter', 'Segoe UI', sans-serif"
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(15,15,30,0.95)'
  },
  headerTitle: {
    display: 'flex', alignItems: 'center', gap: '12px',
    fontSize: '1.2rem', fontWeight: 700, color: '#fff'
  },
  headerBadge: {
    fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  promptBar: {
    padding: '12px 24px', background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'
  },
  promptText: {
    color: '#e0e0ff', fontWeight: 500, fontStyle: 'italic',
    maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  body: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden', position: 'relative'
  },
  roundHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 24px', background: 'rgba(102,126,234,0.08)',
    borderBottom: '1px solid rgba(102,126,234,0.15)',
    fontSize: '0.85rem', fontWeight: 700, color: '#a0b4ff',
    textTransform: 'uppercase', letterSpacing: '1px'
  },
  panelsContainer: {
    flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1px', background: 'rgba(255,255,255,0.04)', overflow: 'auto',
    padding: '0'
  },
  panel: {
    display: 'flex', flexDirection: 'column',
    background: 'rgba(10,10,25,0.95)', overflow: 'auto',
    borderRight: '1px solid rgba(255,255,255,0.06)'
  },
  panelHeader: (color) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 16px', borderBottom: `2px solid ${color}`,
    background: `linear-gradient(180deg, ${color}15, transparent)`,
    position: 'sticky', top: 0, zIndex: 2
  }),
  panelAvatar: (color) => ({
    width: '36px', height: '36px', borderRadius: '50%',
    background: `${color}25`, border: `2px solid ${color}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.1rem', flexShrink: 0
  }),
  panelName: { fontSize: '0.9rem', fontWeight: 700, color: '#fff' },
  panelFocus: { fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' },
  panelBody: { padding: '16px', flex: 1 },
  roundSection: { marginBottom: '20px' },
  roundLabel: (color) => ({
    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1.5px', color: color, marginBottom: '8px',
    display: 'flex', alignItems: 'center', gap: '6px'
  }),
  responseText: {
    fontSize: '0.85rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.85)',
    whiteSpace: 'pre-wrap'
  },
  footer: {
    padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(15,15,30,0.95)', display: 'flex', gap: '12px',
    alignItems: 'center'
  },
  steerInput: {
    flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px', padding: '10px 16px', color: '#fff',
    fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit'
  },
  btnPrimary: {
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.2s', whiteSpace: 'nowrap'
  },
  btnConsensus: {
    padding: '12px 28px', borderRadius: '12px', border: 'none',
    background: 'linear-gradient(135deg, #f093fb, #f5576c)',
    color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(245,87,108,0.3)',
    whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  btnClose: {
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px', padding: '8px 16px', color: '#fff',
    fontSize: '0.8rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: '6px'
  },
  loadingOverlay: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', flex: 1, gap: '20px', color: '#a0b4ff'
  },
  spinner: {
    animation: 'council-spin 1.2s linear infinite',
    width: '48px', height: '48px'
  },
  consensusPanel: {
    flex: 1, overflow: 'auto', padding: '32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  consensusCard: {
    maxWidth: '800px', width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(245,87,108,0.2)', borderRadius: '16px',
    padding: '32px', boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
  },
  consensusTitle: {
    fontSize: '1.3rem', fontWeight: 800, color: '#fff',
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '20px', paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  }
};

function CouncilRoom({ prompt, email, onClose, onConsensusComplete }) {
  const [phase, setPhase] = useState('starting');
  const [personas, setPersonas] = useState([]);
  const [round1, setRound1] = useState([]);
  const [round2, setRound2] = useState([]);
  const [round3, setRound3] = useState([]);
  const [consensus, setConsensus] = useState('');
  const [steerInput, setSteerInput] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => { startCouncil(); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [round1, round2, round3, consensus]);

  const startCouncil = async () => {
    setPhase('starting');
    setError('');
    try {
      const res = await fetch('/api/chat/council/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, prompt })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPersonas(data.personas);
        setRound1(data.round1);
        setPhase('round1');
        setTimeout(() => runDebate(data.personas, data.round1), 1500);
      } else {
        setError(data.error || 'Failed to start council.');
        setPhase('error');
      }
    } catch (e) {
      setError('Network error starting council.');
      setPhase('error');
    }
  };

  const runDebate = async (p, r1) => {
    setPhase('round2-loading');
    try {
      const res = await fetch('/api/chat/council/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, prompt, personas: p, round1: r1 })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRound2(data.round2);
        setPhase('round2');
      } else {
        setError('Cross-examination failed.');
      }
    } catch { setError('Network error during debate.'); }
  };

  const handleSteer = async () => {
    if (!steerInput.trim()) return;
    setPhase('steer-loading');
    try {
      const res = await fetch('/api/chat/council/steer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, prompt, personas, round1, round2, steerInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRound3(data.round3);
        setPhase('round3');
        setSteerInput('');
      }
    } catch { setError('Failed to process steering input.'); }
  };

  const handleConsensus = async () => {
    setPhase('consensus-loading');
    try {
      const res = await fetch('/api/chat/council/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, prompt, personas, rounds: { round1, round2, round3 } })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConsensus(data.consensus);
        setPhase('consensus');
      }
    } catch { setError('Failed to generate consensus.'); }
  };

  const getPersona = (id) => personas.find(p => p.id === id) || { name: id, emoji: '🤖', color: '#888', focus: '' };
  const isLoading = phase.includes('loading') || phase === 'starting';
  const canSteer = phase === 'round2' || phase === 'round3';
  const canConsensus = phase === 'round2' || phase === 'round3';

  const renderRound = (roundData, roundNum, label, icon) => {
    if (!roundData || roundData.length === 0) return null;
    return roundData.map((entry, i) => {
      const persona = getPersona(entry.personaId);
      return (
        <div key={`r${roundNum}-${i}`} style={styles.roundSection}>
          <div style={styles.roundLabel(persona.color)}>
            {icon} {label}
          </div>
          <div style={styles.responseText}>{entry.response}</div>
        </div>
      );
    });
  };

  const loadingMessages = {
    'starting': 'Analyzing your problem & assembling the council...',
    'round2-loading': 'Initiating cross-examination — agents critiquing each other...',
    'steer-loading': 'Agents processing your course correction...',
    'consensus-loading': 'Synthesizing debate into bulletproof action plan...'
  };

  return (
    <div style={styles.overlay}>
      {/* Inject keyframe */}
      <style>{`@keyframes council-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Users size={22} color="#667eea" />
          <span>The Council Room</span>
          <span style={styles.headerBadge}>Multi-Agent Debate</span>
          {phase !== 'consensus' && phase !== 'starting' && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
              {phase.includes('round1') ? '— Round 1: Initial Proposals' :
               phase.includes('round2') ? '— Round 2: Cross-Examination' :
               phase.includes('round3') ? '— Round 3: Steered Iteration' :
               ''}
            </span>
          )}
        </div>
        <button style={styles.btnClose} onClick={onClose}>
          <X size={16} /> Exit Council
        </button>
      </div>

      {/* Problem Statement */}
      <div style={styles.promptBar}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Problem Under Debate: </span>
        <span style={styles.promptText}>{prompt}</span>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {isLoading ? (
          <div style={styles.loadingOverlay}>
            <Loader size={48} style={styles.spinner} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>{loadingMessages[phase] || 'Processing...'}</p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
              {phase === 'starting' ? 'Selecting 3 opposing expert personas tailored to your problem...' :
               phase === 'round2-loading' ? 'Each agent is finding flaws in the others\' logic...' :
               phase === 'consensus-loading' ? 'Filtering hostile arguments, distilling survivable ideas...' :
               'The council is deliberating...'}
            </p>
          </div>
        ) : phase === 'consensus' ? (
          <div style={styles.consensusPanel}>
            <div style={styles.consensusCard}>
              <div style={styles.consensusTitle}>
                <Handshake size={24} color="#f5576c" />
                Consensus Decision — Stress-Tested Action Plan
              </div>
              <div style={{ ...styles.responseText, fontSize: '0.9rem', lineHeight: '1.8' }}>
                {consensus}
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button style={styles.btnPrimary} onClick={() => {
                if (onConsensusComplete) onConsensusComplete(consensus);
                onClose();
              }}>
                <ChevronRight size={16} /> Use This Plan in Chat
              </button>
              <button style={styles.btnClose} onClick={onClose}>
                <X size={16} /> Close
              </button>
            </div>
          </div>
        ) : phase === 'error' ? (
          <div style={styles.loadingOverlay}>
            <p style={{ color: '#ff6b6b', fontSize: '1rem' }}>⚠️ {error}</p>
            <button style={styles.btnPrimary} onClick={startCouncil}>Retry</button>
          </div>
        ) : (
          /* Multi-Panel Debate View */
          <div style={styles.panelsContainer} ref={scrollRef}>
            {personas.map((persona) => (
              <div key={persona.id} style={styles.panel}>
                {/* Persona Header */}
                <div style={styles.panelHeader(persona.color)}>
                  <div style={styles.panelAvatar(persona.color)}>{persona.emoji}</div>
                  <div>
                    <div style={styles.panelName}>{persona.name}</div>
                    <div style={styles.panelFocus}>{persona.focus}</div>
                  </div>
                </div>

                {/* Debate Content */}
                <div style={styles.panelBody}>
                  {/* Round 1 */}
                  {round1.filter(r => r.personaId === persona.id).map((entry, i) => (
                    <div key={`r1-${i}`} style={styles.roundSection}>
                      <div style={styles.roundLabel(persona.color)}>
                        <MessageSquare size={12} /> Round 1 — Initial Proposal
                      </div>
                      <div style={styles.responseText}>{entry.response}</div>
                    </div>
                  ))}

                  {/* Round 2 */}
                  {round2.filter(r => r.personaId === persona.id).map((entry, i) => (
                    <div key={`r2-${i}`} style={styles.roundSection}>
                      <div style={styles.roundLabel('#ffa94d')}>
                        <Swords size={12} /> Round 2 — Cross-Examination
                      </div>
                      <div style={styles.responseText}>{entry.response}</div>
                    </div>
                  ))}

                  {/* Round 3 (Steered) */}
                  {round3.filter(r => r.personaId === persona.id).map((entry, i) => (
                    <div key={`r3-${i}`} style={styles.roundSection}>
                      <div style={styles.roundLabel('#69db7c')}>
                        <Navigation size={12} /> Round 3 — Steered Iteration
                      </div>
                      <div style={styles.responseText}>{entry.response}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — Steer + Consensus controls */}
      {!isLoading && phase !== 'consensus' && phase !== 'error' && (
        <div style={styles.footer}>
          {canSteer && (
            <>
              <input
                style={styles.steerInput}
                placeholder="Steer the debate — give agents new constraints or redirect their focus..."
                value={steerInput}
                onChange={(e) => setSteerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSteer()}
              />
              <button style={styles.btnPrimary} onClick={handleSteer} disabled={!steerInput.trim()}>
                <Send size={14} /> Steer Debate
              </button>
            </>
          )}
          {canConsensus && (
            <button style={styles.btnConsensus} onClick={handleConsensus}>
              <Gavel size={16} /> Consensus Decision
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CouncilRoom;
