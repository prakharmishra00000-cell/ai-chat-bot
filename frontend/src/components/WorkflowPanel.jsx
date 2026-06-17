import React, { useState, useEffect, useRef } from 'react';
import { Play, Check, AlertCircle, Trash2, ArrowRight, Download, Send, X, Terminal, Loader2, Sparkles, Sliders } from 'lucide-react';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(5, 5, 12, 0.92)', backdropFilter: 'blur(16px)',
    zIndex: 9999, display: 'flex', flexDirection: 'column',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#f1f5f9'
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(12, 12, 28, 0.95)'
  },
  headerTitle: {
    display: 'flex', alignItems: 'center', gap: '12px',
    fontSize: '1.25rem', fontWeight: 800, color: '#fff',
    letterSpacing: '0.5px'
  },
  headerBadge: {
    fontSize: '0.7rem', padding: '4px 12px', borderRadius: '20px',
    background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
    color: '#090a0f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  goalBar: {
    padding: '14px 28px', background: 'rgba(0, 242, 254, 0.03)',
    borderBottom: '1px solid rgba(0, 242, 254, 0.1)',
    fontSize: '0.9rem', color: 'rgba(241, 245, 249, 0.8)'
  },
  goalLabel: {
    color: '#00f2fe', fontWeight: 600, marginRight: '8px'
  },
  body: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden', padding: '24px', gap: '20px'
  },
  progressContainer: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px', padding: '16px 20px'
  },
  progressBarBg: {
    height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px',
    overflow: 'hidden', position: 'relative', marginTop: '10px'
  },
  progressBarFill: (pct) => ({
    width: `${pct}%`, height: '100%',
    background: 'linear-gradient(90deg, #00f2fe, #9b51e0)',
    borderRadius: '4px', transition: 'width 0.6s ease-in-out',
    boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)'
  }),
  contentArea: {
    flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr',
    gap: '24px', overflow: 'hidden'
  },
  leftSidebar: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    overflowY: 'auto', paddingRight: '4px'
  },
  stepCard: (isActive, isDone, isFailed) => ({
    padding: '16px', borderRadius: '12px',
    background: isActive ? 'rgba(0, 242, 254, 0.06)' : 'rgba(255, 255, 255, 0.02)',
    border: `1px solid ${isActive ? 'rgba(0, 242, 254, 0.3)' : isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'}`,
    transition: 'all 0.3s ease', cursor: 'pointer',
    position: 'relative'
  }),
  stepHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontWeight: 600, fontSize: '0.88rem'
  },
  stepStatusBadge: (status) => {
    let bg = 'rgba(255,255,255,0.05)';
    let color = 'rgba(255,255,255,0.5)';
    if (status === 'running') { bg = 'rgba(0, 242, 254, 0.15)'; color = '#00f2fe'; }
    if (status === 'completed') { bg = 'rgba(16, 185, 129, 0.15)'; color = '#10b981'; }
    if (status === 'paused') { bg = 'rgba(245, 158, 11, 0.15)'; color = '#f59e0b'; }
    if (status === 'failed') { bg = 'rgba(239, 68, 68, 0.15)'; color = '#ef4444'; }
    return {
      fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px',
      background: bg, color: color, fontWeight: 700, textTransform: 'uppercase'
    };
  },
  mainWorkspace: {
    display: 'flex', flexDirection: 'column', gap: '20px',
    background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px', padding: '24px', overflowY: 'auto'
  },
  terminal: {
    background: 'rgba(6, 6, 16, 0.95)', border: '1px solid rgba(0, 242, 254, 0.15)',
    borderRadius: '10px', padding: '16px', fontFamily: "'Fira Code', 'Courier New', monospace",
    fontSize: '0.82rem', color: '#a5f3fc', overflowY: 'auto', minHeight: '180px', maxHeight: '300px',
    display: 'flex', flexDirection: 'column', gap: '6px'
  },
  terminalLine: {
    lineHeight: '1.4', wordBreak: 'break-all'
  },
  reviewTitle: {
    fontSize: '1.1rem', fontWeight: 700, color: '#fff',
    display: 'flex', alignItems: 'center', gap: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px',
    marginBottom: '10px'
  },
  reviewGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px', margin: '12px 0'
  },
  reviewCard: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '16px', position: 'relative',
    display: 'flex', flexDirection: 'column', gap: '8px',
    transition: 'all 0.2s ease',
    hover: { borderColor: 'rgba(0, 242, 254, 0.3)' }
  },
  trashBtn: {
    position: 'absolute', top: '12px', right: '12px',
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px', padding: '6px', color: '#ef4444', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  feedbackInput: {
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px', padding: '12px 16px', color: '#fff',
    fontSize: '0.85rem', width: '100%', outline: 'none', fontFamily: 'inherit',
    marginTop: '10px'
  },
  footer: {
    padding: '20px 28px', borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(12, 12, 28, 0.95)', display: 'flex', gap: '16px',
    alignItems: 'center', justifyContent: 'flex-end'
  },
  btn: {
    padding: '12px 24px', borderRadius: '10px', fontWeight: 700,
    fontSize: '0.85rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: '8px', border: 'none', transition: 'all 0.2s'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
    color: '#090a0f',
    boxShadow: '0 4px 15px rgba(0, 242, 254, 0.2)'
  },
  btnSuccess: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff'
  }
};

function WorkflowPanel({ prompt, email, onClose, onWorkflowComplete }) {
  const [phase, setPhase] = useState('starting'); // 'starting', 'running', 'paused', 'completed', 'failed', 'error'
  const [workflowId, setWorkflowId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [reviewItems, setReviewItems] = useState([]);
  const [steeringText, setSteeringText] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [finalReport, setFinalReport] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const terminalEndRef = useRef(null);

  // Auto scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Start workflow on mount
  useEffect(() => {
    initializeWorkflow();
  }, []);

  const addTerminalLog = (message, delay = 0) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}`;
    if (delay > 0) {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, formatted]);
      }, delay);
    } else {
      setTerminalLogs(prev => [...prev, formatted]);
    }
  };

  const initializeWorkflow = async () => {
    setPhase('starting');
    addTerminalLog('⚡ Initiating Workflow Orchestrator...');
    addTerminalLog('📡 Connecting to MatrixMind Agents cluster...');
    
    try {
      const res = await fetch('/api/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, goal: prompt })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setWorkflowId(data.workflowId);
        setSteps(data.steps);
        setPhase('running');
        addTerminalLog(`🚀 Workflow initialized with ID: ${data.workflowId}`);
        addTerminalLog(`📋 Total steps planned: ${data.steps.length}`);
        
        // Start processing first step
        processStep(0, data.steps, data.workflowId);
      } else {
        throw new Error(data.message || data.error || 'Failed to start workflow sequence.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
      setPhase('error');
      addTerminalLog(`❌ Error initiating sequence: ${e.message}`);
    }
  };

  const processStep = async (index, currentSteps, currentWorkflowId) => {
    if (index >= currentSteps.length) {
      // Reached end? Usually the consolidate handles the last phase.
      return;
    }

    setActiveStepIndex(index);
    
    // Update step status to running
    const updated = currentSteps.map((s, idx) => {
      if (idx === index) return { ...s, status: 'running' };
      return s;
    });
    setSteps(updated);

    const step = updated[index];
    addTerminalLog(`\n========================================`);
    addTerminalLog(`▶️ STARTING STEP ${index + 1}: ${step.label}`);
    addTerminalLog(`⚙️ Allocating sub-agents and web crawlers...`);

    try {
      const res = await fetch('/api/workflow/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          goal: prompt,
          workflowId: currentWorkflowId,
          stepId: step.id,
          stepIndex: index,
          stepsHistory: updated
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Execution failed.');
      }

      // Add execution logs to terminal
      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((log, logIdx) => {
          addTerminalLog(`🤖 [agent-log] ${log}`, (logIdx + 1) * 250);
        });
      }

      // Update step status with intermediate result
      setTimeout(() => {
        const stepStatus = step.requiresApproval ? 'paused' : 'completed';
        
        const finalSteps = updated.map((s, idx) => {
          if (idx === index) return { ...s, status: stepStatus, output: data.output };
          return s;
        });
        setSteps(finalSteps);
        
        addTerminalLog(`✅ Step ${index + 1} completed.`);

        if (step.requiresApproval) {
          addTerminalLog(`⚠️ Workflow Paused: Human verification and authorization required.`);
          setPhase('paused');
          setReviewItems(data.items || []);
        } else {
          // Proceed to next step
          processStep(index + 1, finalSteps, currentWorkflowId);
        }
      }, (data.logs ? data.logs.length : 1) * 250 + 200);

    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
      setPhase('failed');
      
      const failedSteps = updated.map((s, idx) => {
        if (idx === index) return { ...s, status: 'failed' };
        return s;
      });
      setSteps(failedSteps);
      addTerminalLog(`❌ Step execution failed: ${e.message}`);
    }
  };

  const handleDeleteReviewItem = (itemId) => {
    setReviewItems(prev => prev.filter(item => item.id !== itemId));
    addTerminalLog(`🗑️ Removed item: ${itemId} from staging area.`);
  };

  const handleApproveAndResume = async () => {
    setPhase('running');
    addTerminalLog(`\n========================================`);
    addTerminalLog(`🔓 Authorization Granted by Human Owner.`);
    addTerminalLog(`📤 Submitting ${reviewItems.length} approved items for consolidation...`);
    if (steeringText.trim()) {
      addTerminalLog(`✍️ Incorporating feedback constraints: "${steeringText}"`);
    }

    // Mark active step as completed
    const updatedSteps = steps.map((s, idx) => {
      if (idx === activeStepIndex) return { ...s, status: 'completed' };
      return s;
    });
    setSteps(updatedSteps);

    // Run final step: consolidation
    const finalStepIndex = activeStepIndex + 1;
    setActiveStepIndex(finalStepIndex);

    const finalStep = updatedSteps[finalStepIndex];
    if (finalStep) {
      const runningSteps = updatedSteps.map((s, idx) => {
        if (idx === finalStepIndex) return { ...s, status: 'running' };
        return s;
      });
      setSteps(runningSteps);
    }

    try {
      const res = await fetch('/api/workflow/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          goal: prompt,
          workflowId,
          filteredItems: reviewItems,
          steeringInput: steeringText
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Final consolidation failed.');
      }

      addTerminalLog(`🧠 Synching sub-tasks and assembling audit package...`);
      setTimeout(() => {
        addTerminalLog(`🎉 Consolidated final outreach and analysis outputs.`);
        setFinalReport(data.report);
        setPhase('completed');

        const completedSteps = steps.map((s, idx) => {
          if (idx === activeStepIndex) return { ...s, status: 'completed' };
          if (idx === finalStepIndex) return { ...s, status: 'completed', output: 'Final report compiled.' };
          return s;
        });
        setSteps(completedSteps);
      }, 1500);

    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
      setPhase('failed');
      addTerminalLog(`❌ Final consolidation failed: ${e.message}`);
    }
  };

  const handleDownload = () => {
    const text = `MatrixMind Workflow Sequence Report\n` +
                 `Goal: ${prompt}\n` +
                 `Date: ${new Date().toLocaleString()}\n` +
                 `=========================================\n\n` +
                 finalReport;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow_sequence_report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addTerminalLog('📥 Report downloaded locally.');
  };

  const handleSendToChat = () => {
    onWorkflowComplete(finalReport);
    onClose();
  };

  const getPercentage = () => {
    if (phase === 'completed') return 100;
    if (steps.length === 0) return 0;
    const completedCount = steps.filter(s => s.status === 'completed').length;
    let base = (completedCount / steps.length) * 100;
    if (phase === 'running' && base < 95) base += 5; // offset spinner progress
    return Math.min(Math.round(base), 95);
  };

  return (
    <div style={styles.overlay}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Sparkles size={22} color="#00f2fe" style={{ filter: 'drop-shadow(0 0 6px #00f2fe)' }} />
          <span>Workflow Execution Sequencer</span>
          <span style={styles.headerBadge}>Staging Room</span>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          title="Close staging room"
        >
          <X size={24} />
        </button>
      </div>

      {/* Goal details bar */}
      <div style={styles.goalBar}>
        <span style={styles.goalLabel}>MACRO GOAL:</span>
        <span>"{prompt}"</span>
      </div>

      {/* Body */}
      <div style={styles.body}>
        
        {/* Progress Bar Container */}
        <div style={styles.progressContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
            <span style={{ color: '#94a3b8' }}>Sequence Progress</span>
            <span style={{ color: '#00f2fe' }}>{getPercentage()}%</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={styles.progressBarFill(getPercentage())} />
          </div>
        </div>

        {/* Workspace split */}
        <div style={styles.contentArea}>
          
          {/* Steps list sidebar */}
          <div style={styles.leftSidebar}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>
              Planned Sub-tasks
            </h4>
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                style={styles.stepCard(idx === activeStepIndex, step.status === 'completed', step.status === 'failed')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>STEP {idx + 1}</span>
                  <span style={styles.stepStatusBadge(step.status)}>{step.status}</span>
                </div>
                <div style={styles.stepHeader}>
                  {step.status === 'running' ? (
                    <Loader2 size={16} color="#00f2fe" className="animate-spin" />
                  ) : step.status === 'completed' ? (
                    <Check size={16} color="#10b981" />
                  ) : step.status === 'paused' ? (
                    <Sliders size={16} color="#f59e0b" />
                  ) : step.status === 'failed' ? (
                    <AlertCircle size={16} color="#ef4444" />
                  ) : (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', marginLeft: '5px' }} />
                  )}
                  <span style={idx === activeStepIndex ? { color: '#00f2fe' } : {}}>{step.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Logs and Interaction Staging */}
          <div style={styles.mainWorkspace}>
            
            {/* Developer Log Console */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                <Terminal size={14} />
                <span>Console Log Output Stream</span>
              </div>
              <div style={styles.terminal}>
                {terminalLogs.map((log, idx) => (
                  <div key={idx} style={styles.terminalLine}>
                    {log}
                  </div>
                ))}
                {phase === 'running' && (
                  <div style={{ ...styles.terminalLine, display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe' }}>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Processing next sub-task batch...</span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* Error view */}
            {phase === 'error' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '16px', color: '#fca5a5' }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertCircle size={18} />
                  <span>Initialization Error</span>
                </div>
                <p style={{ fontSize: '0.85rem' }}>{errorMsg}</p>
              </div>
            )}

            {/* Paused - User Review State */}
            {phase === 'paused' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <div style={styles.reviewTitle}>
                  <Sliders size={18} color="#f59e0b" />
                  <span>Interactive Review & Filter: Competitors / Entities Found</span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  Click the trash icon to discard items/companies that are irrelevant to your objectives. MatrixMind will exclude these from the final audit & outreach plan.
                </p>

                <div style={styles.reviewGrid}>
                  {reviewItems.map((item) => (
                    <div key={item.id} style={styles.reviewCard}>
                      <button 
                        style={styles.trashBtn} 
                        onClick={() => handleDeleteReviewItem(item.id)}
                        title="Discard this option"
                      >
                        <Trash2 size={14} />
                      </button>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', paddingRight: '24px' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Relevance Match: <strong style={{ color: '#00f2fe' }}>{item.relevance || '90%'}</strong>
                      </span>
                      <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px', lineHeight: '1.4' }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                  {reviewItems.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px', color: '#94a3b8', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                      All items removed. You can type instructions below to steer next steps.
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                    Optional Course Correction / Additional Constraints:
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 'Draft outreach with a collaborative partnership tone', 'Ignore companies outside India'..."
                    style={styles.feedbackInput}
                    value={steeringText}
                    onChange={(e) => setSteeringText(e.target.value)}
                  />
                </div>

                <div style={{ alignSelf: 'flex-start' }}>
                  <button 
                    style={{ ...styles.btn, ...styles.btnPrimary }}
                    onClick={handleApproveAndResume}
                  >
                    <span>Approve Results & Resume Sequence</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Completed Final report preview */}
            {phase === 'completed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <div style={styles.reviewTitle}>
                  <Check size={18} color="#10b981" />
                  <span>Macro Sequence Complete: Final Results Staged</span>
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px', padding: '16px', maxHeight: '350px', overflowY: 'auto'
                }}>
                  {finalReport.split('\n').map((line, lidx) => (
                    <p key={lidx} style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Footer controls */}
      <div style={styles.footer}>
        {phase === 'completed' && (
          <>
            <button 
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleDownload}
            >
              <Download size={16} />
              <span>Download Report (.txt)</span>
            </button>
            <button 
              style={{ ...styles.btn, ...styles.btnSuccess }}
              onClick={handleSendToChat}
            >
              <Send size={16} />
              <span>Send Results to Main Chat</span>
            </button>
          </>
        )}
        <button 
          style={{ ...styles.btn, ...styles.btnSecondary }}
          onClick={onClose}
        >
          <span>Cancel & Exit</span>
        </button>
      </div>

      {/* Animation injection keyframes style tag */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes council-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: council-spin 1.5s linear infinite;
        }
      `}} />

    </div>
  );
}

export default WorkflowPanel;
