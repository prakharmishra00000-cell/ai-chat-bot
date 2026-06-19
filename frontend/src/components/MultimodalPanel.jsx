import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Check, AlertCircle, X, Terminal, Loader2, Sparkles, Cpu, Layers, Eye, MousePointer, Monitor, RotateCcw
} from 'lucide-react';

const steps = [
  { id: 1, label: 'Continuous Perception', desc: 'Ingesting pixels, sound, & code tokens directly' },
  { id: 2, label: 'Grounding & Understanding', desc: 'Mapping visual elements to coordinate grid (x, y)' },
  { id: 3, label: 'Predictive Strategy', desc: 'Formulating next step chain reasoning' },
  { id: 4, label: 'Action Token Output', desc: 'Spitting native hardware/OS click & type inputs' },
  { id: 5, label: 'Feedback & Self-Reflection', desc: 'Capturing new states, resolving blockers, & retrying' }
];

export default function MultimodalPanel({ onClose }) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 1 to 5
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused', 'completed'
  const [logs, setLogs] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: 200, y: 150 });
  const [cursorClick, setCursorClick] = useState(false);
  
  // OS Simulator States
  const [screenState, setScreenState] = useState('desktop'); // 'desktop', 'crm_loading', 'crm_empty', 'crm_search', 'crm_invoice', 'crm_approved'
  const [addressVal, setAddressVal] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const logsEndRef = useRef(null);

  const addLog = (tag, message) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), tag, message }]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Simulation Sequence
  const runSimulation = async () => {
    if (running) return;
    
    // Reset all states
    setRunning(true);
    setCurrentStep(1);
    setStatus('running');
    setLogs([]);
    setCursorPos({ x: 200, y: 150 });
    setScreenState('desktop');
    setAddressVal('');
    setSearchVal('');
    setShowPopup(false);

    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    // --- STEP 1: Perception ---
    addLog('PERCEPTION', 'Grabbing OS screen frame buffer (pixels)...');
    await wait(800);
    addLog('PERCEPTION', 'Visual input projected into Unified representation shared vector space.');
    await wait(800);
    addLog('PERCEPTION', 'Vision Transformer (ViT) mapping: Screen split into 16x16 pixel sub-patches.');
    await wait(800);

    // --- STEP 2: Grounding (CRM Navigate) ---
    setCurrentStep(2);
    addLog('GROUNDING', 'Scanning sub-patches for active UI targets...');
    await wait(800);
    addLog('GROUNDING', 'Detected browser address bar at coords: [x: 480, y: 52].');
    await wait(600);
    
    // Strategy
    setCurrentStep(3);
    addLog('PLANNING', 'Observation: Browser is open on blank tab. Next Action: Click URL bar, enter CRM URL.');
    await wait(800);

    // Move to URL bar
    setCursorPos({ x: 480, y: 52 });
    await wait(850);
    setCursorClick(true);
    await wait(150);
    setCursorClick(false);
    
    // Type URL
    setIsTyping(true);
    setCurrentStep(4);
    addLog('EXECUTION', 'Action Token: MOUSE_CLICK(480, 52) -> KEY_TYPE("http://crm.internal/invoices")');
    const url = 'http://crm.internal/invoices';
    for (let i = 0; i <= url.length; i++) {
      setAddressVal(url.substring(0, i));
      await wait(50);
    }
    setIsTyping(false);
    await wait(400);

    // Load CRM
    setScreenState('crm_loading');
    addLog('EXECUTION', 'Action Token: KEY_PRESS(ENTER)');
    await wait(1000);
    setScreenState('crm_empty');
    
    // --- STEP 5: Feedback / Reflection ---
    setCurrentStep(5);
    addLog('REFLECT', 'Ingested new screen state. CRM invoice dashboard loaded successfully.');
    await wait(1000);

    // --- STEP 2: Grounding (Search Acme) ---
    setCurrentStep(2);
    addLog('GROUNDING', 'Scanning sub-patches for search inputs...');
    await wait(800);
    addLog('GROUNDING', 'Detected search field input box at coords: [x: 310, y: 155].');
    await wait(600);

    // Strategy
    setCurrentStep(3);
    addLog('PLANNING', 'Observation: Invoices view loaded. Next Action: Type "Acme Corp" in search box.');
    await wait(800);

    // Move to search box
    setCursorPos({ x: 310, y: 155 });
    await wait(850);
    setCursorClick(true);
    await wait(150);
    setCursorClick(false);

    // Type "Acme Corp"
    setIsTyping(true);
    setCurrentStep(4);
    addLog('EXECUTION', 'Action Token: MOUSE_CLICK(310, 155) -> KEY_TYPE("Acme Corp")');
    const search = 'Acme Corp';
    for (let i = 0; i <= search.length; i++) {
      setSearchVal(search.substring(0, i));
      await wait(80);
    }
    setIsTyping(false);
    await wait(400);

    // Trigger Popup Obstructor!
    setShowPopup(true);
    addLog('ALERT', 'Intrusive system warning blocker loaded on top of dashboard.');
    await wait(800);

    // Self-Reflection Loop
    setCurrentStep(5);
    addLog('REFLECT', 'Visual obstruction detected. CRM search view fully blocked by alert window.');
    await wait(1000);
    addLog('PLANNING', 'Obstruction Resolution: Pivot strategy. Dismiss alert by clicking X at [x: 620, y: 220] first.');
    await wait(1000);

    // Move to Popup X
    setCursorPos({ x: 620, y: 220 });
    await wait(900);
    setCursorClick(true);
    await wait(150);
    setCursorClick(false);
    setShowPopup(false);
    addLog('EXECUTION', 'Action Token: MOUSE_CLICK(620, 220) -> Close alert banner.');
    await wait(800);

    // Retry & Search complete
    setCurrentStep(5);
    addLog('REFLECT', 'Obstruction cleared. Search field visible. Retrieving search database results...');
    setScreenState('crm_search');
    await wait(1000);

    // --- STEP 2: Grounding (Locate Acme Invoice) ---
    setCurrentStep(2);
    addLog('GROUNDING', 'Scanning sub-patches for Acme Corp matching invoice item...');
    await wait(800);
    addLog('GROUNDING', 'Detected Invoice card item "Acme Corp #9821" at coords: [x: 440, y: 295].');
    await wait(600);

    // Strategy
    setCurrentStep(3);
    addLog('PLANNING', 'Next Action: Move to Invoice card and click to open details.');
    await wait(800);

    // Move & Click invoice
    setCursorPos({ x: 440, y: 295 });
    await wait(850);
    setCursorClick(true);
    await wait(150);
    setCursorClick(false);
    setScreenState('crm_invoice');
    await wait(800);

    // --- STEP 2: Grounding (Locate Approve Button) ---
    setCurrentStep(2);
    addLog('GROUNDING', 'Scanning invoice details preview...');
    await wait(800);
    addLog('GROUNDING', 'Detected "APPROVE INVOICE" visual action button at coords: [x: 520, y: 440].');
    await wait(600);

    // Strategy
    setCurrentStep(3);
    addLog('PLANNING', 'Next Action: Move to Approve button, click, and verify screen updates.');
    await wait(800);

    // Move to Approve button
    setCursorPos({ x: 520, y: 440 });
    await wait(850);
    setCursorClick(true);
    await wait(150);
    setCursorClick(false);
    setScreenState('crm_approved');
    setCurrentStep(4);
    addLog('EXECUTION', 'Action Token: MOUSE_CLICK(520, 440) -> Trigger Invoice Approval webhook.');
    await wait(1000);

    // --- STEP 5: Verify & Complete ---
    setCurrentStep(5);
    addLog('REFLECT', 'Scanning pixels... SUCCESS tag with code checkmark detected at approval bounds.');
    await wait(800);
    addLog('REFLECT', 'Verification successful: Acme Corp Invoice #9821 approved. Session closed.');
    
    setStatus('completed');
    setRunning(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 5, 12, 0.94)', backdropFilter: 'blur(20px)',
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', sans-serif", color: '#f1f5f9'
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(12, 12, 28, 0.95)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cpu size={24} color="#00f2fe" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
              Native Multimodal Action Simulator
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Processing Raw Pixels, Vector Spaces, and Hardware Action Inputs Natively
            </span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          style={{
            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8', borderRadius: '50%', width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,51,102,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        >
          <X size={18} />
        </button>
      </div>

      {/* TOP DESCRIPTOR & COMMAND ENTRY */}
      <div style={{
        padding: '16px 24px', background: 'rgba(0, 242, 254, 0.03)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.1)',
        display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ flex: 1 }}>
          <span style={{ color: '#00f2fe', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Active Prompt / Action Directive
          </span>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.9rem', color: '#e2e8f0' }}>
            "Go to my CRM, find the latest invoice from Acme Corp, and approve it."
          </div>
        </div>
        <button 
          className="btn" 
          onClick={runSimulation} 
          disabled={running}
          style={{ 
            padding: '12px 24px', 
            fontSize: '0.9rem', 
            background: running ? 'rgba(255,255,255,0.1)' : 'var(--gradient-primary)',
            color: running ? '#94a3b8' : 'var(--text-dark)',
            opacity: running ? 0.7 : 1,
            cursor: running ? 'not-allowed' : 'pointer'
          }}
        >
          {running ? (
            <>
              <Loader2 size={16} className="animate-spin" /> In Flight...
            </>
          ) : status === 'completed' ? (
            <>
              <RotateCcw size={16} /> Re-run Agent
            </>
          ) : (
            <>
              <Play size={16} /> Run Multimodal Agent
            </>
          )}
        </button>
      </div>

      {/* WORKSPACE CONTENT AREA */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr',
        gap: '24px', padding: '24px', overflow: 'hidden'
      }}>
        
        {/* LEFT COLUMN: TELEMETRY & STRATEGY STEPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          {/* CHECKLIST */}
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe' }}>
              <Layers size={16} /> Microsecond Feedback Loop
            </h3>
            {steps.map((s) => {
              const isActive = currentStep === s.id;
              const isDone = currentStep > s.id || status === 'completed';
              return (
                <div 
                  key={s.id} 
                  style={{
                    display: 'flex', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                    background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isActive ? 'rgba(0, 242, 254, 0.25)' : 'transparent'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: isDone ? 'rgba(16, 185, 129, 0.2)' : isActive ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isDone ? '#10b981' : isActive ? '#00f2fe' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800, color: isDone ? '#10b981' : isActive ? '#00f2fe' : '#94a3b8',
                    flexShrink: 0
                  }}>
                    {isDone ? <Check size={12} /> : s.id}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? '#fff' : '#cbd5e1' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TELEMETRY LOGS */}
          <div className="glass-panel" style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe' }}>
              <Terminal size={16} /> Unified Reasoner Output
            </h3>
            
            <div style={{
              flex: 1, background: 'rgba(6, 6, 16, 0.95)', border: '1px solid rgba(0, 242, 254, 0.1)',
              borderRadius: '8px', padding: '12px', fontFamily: "'Courier New', monospace",
              fontSize: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              {logs.length === 0 ? (
                <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                  Awaiting Agent execution...
                </div>
              ) : (
                logs.map((log, idx) => {
                  let color = '#38bdf8'; // perception
                  if (log.tag === 'GROUNDING') color = '#a78bfa';
                  if (log.tag === 'PLANNING') color = '#fbbf24';
                  if (log.tag === 'EXECUTION') color = '#34d399';
                  if (log.tag === 'ALERT') color = '#f87171';
                  if (log.tag === 'REFLECT') color = '#2dd4bf';

                  return (
                    <div key={idx} style={{ lineHeight: '1.4' }}>
                      <span style={{ color: '#64748b', marginRight: '6px' }}>[{log.time}]</span>
                      <span style={{ color, fontWeight: 'bold', marginRight: '6px' }}>[{log.tag}]</span>
                      <span style={{ color: '#f1f5f9' }}>{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE OS DESKTOP SIMULATOR */}
        <div className="glass-panel" style={{ 
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative'
        }}>
          
          {/* OS Header bar */}
          <div style={{
            background: 'rgba(20, 20, 35, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Monitor size={12} /> OS Desktop Environment Simulator (1920x1080 canvas)
            </div>
            <div style={{ width: '30px' }} />
          </div>

          {/* DESKTOP SCREEN CANVAS */}
          <div style={{
            flex: 1, background: '#090a0f', position: 'relative', overflow: 'hidden',
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20, 20, 50, 0.4) 0%, transparent 80%)'
          }}>

            {/* MOCK BROWSER SCREEN */}
            <div style={{
              position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px',
              background: '#0e1017', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
              
              {/* Browser Address Bar panel */}
              <div style={{
                background: '#151822', borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <div style={{ display: 'flex', gap: '6px', color: '#64748b' }}>
                  <span style={{ fontSize: '0.8rem', cursor: 'pointer' }}>◀</span>
                  <span style={{ fontSize: '0.8rem', cursor: 'pointer' }}>▶</span>
                  <span style={{ fontSize: '0.8rem', cursor: 'pointer' }}>↻</span>
                </div>
                <div style={{
                  flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px', padding: '4px 10px', fontSize: '0.78rem', color: '#94a3b8',
                  fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <span style={{ color: '#00f2fe' }}>🔒</span>
                  <span>{addressVal || 'about:blank'}</span>
                  {isTyping && <span style={{ width: '2px', height: '12px', background: '#00f2fe', display: 'inline-block', animation: 'pulse 0.8s infinite' }} />}
                </div>
              </div>

              {/* BROWSER BODY VIEWPORTS */}
              <div style={{ flex: 1, position: 'relative', background: '#0a0c10' }}>
                
                {/* 1. Blank Slate / Desktop state */}
                {screenState === 'desktop' && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', gap: '15px', textAlign: 'center'
                  }}>
                    <Sparkles size={40} color="rgba(255,255,255,0.08)" />
                    <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                      Ready to navigate. Waiting for Multimodal Agent trigger.
                    </div>
                  </div>
                )}

                {/* 2. Loading state */}
                {screenState === 'crm_loading' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                    <Loader2 size={30} color="#00f2fe" className="animate-spin" />
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      Connecting to http://crm.internal...
                    </span>
                  </div>
                )}

                {/* 3. CRM dashboard - Empty state */}
                {(screenState === 'crm_empty' || screenState === 'crm_search' || screenState === 'crm_invoice' || screenState === 'crm_approved') && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    
                    {/* CRM Header */}
                    <div style={{ background: '#111420', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#00f2fe' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.5px' }}>APEX CRM v4.2</span>
                      </div>
                      
                      {/* Search container */}
                      <div style={{ position: 'relative', width: '220px' }}>
                        <input 
                          type="text" 
                          placeholder="Search Invoice database..." 
                          value={searchVal}
                          readOnly
                          style={{
                            width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#fff'
                          }}
                        />
                        {isTyping && searchVal && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '10px', background: '#00f2fe', animation: 'pulse 0.8s infinite' }} />}
                      </div>
                    </div>

                    {/* CRM Main content grid */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>
                      
                      {/* Table pane */}
                      <div style={{ padding: '15px', overflowY: 'auto' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Recent Invoices</h4>
                        
                        {screenState === 'crm_empty' ? (
                          <div style={{ border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '6px', padding: '30px', textAlign: 'center', color: '#475569', fontSize: '0.8rem' }}>
                            Perform database query to view records.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Acme Corp Invoice card */}
                            <div 
                              style={{
                                padding: '10px 12px', borderRadius: '6px', 
                                border: '1px solid rgba(0, 242, 254, 0.15)',
                                background: screenState !== 'crm_empty' ? 'rgba(0, 242, 254, 0.03)' : 'rgba(255,255,255,0.02)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>Acme Corp</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Inv #9821 • Due in 12 days</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ffaa55' }}>$14,250.00</div>
                                <span style={{
                                  fontSize: '0.62rem', padding: '2px 6px', borderRadius: '10px',
                                  background: (screenState === 'crm_approved') ? 'rgba(16,185,129,0.15)' : 'rgba(255,170,85,0.1)',
                                  color: (screenState === 'crm_approved') ? '#10b981' : '#ffaa55',
                                  fontWeight: 800
                                }}>
                                  {(screenState === 'crm_approved') ? 'APPROVED' : 'PENDING'}
                                </span>
                              </div>
                            </div>

                            {/* Legacy invoice card */}
                            <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', opacity: 0.4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>Stark Industries</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Inv #9819 • Paid</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>$8,400.00</div>
                                <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontWeight: 800 }}>PAID</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Panel: Invoice Detail Sheet */}
                      <div style={{
                        background: '#0c0e14', borderLeft: '1px solid rgba(255,255,255,0.05)',
                        padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px'
                      }}>
                        <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Invoice details</h4>
                        
                        {(screenState === 'crm_invoice' || screenState === 'crm_approved') ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <table style={{ width: '100%', fontSize: '0.72rem', color: '#94a3b8', borderCollapse: 'collapse' }}>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Vendor:</td>
                                    <td style={{ padding: '4px 0', color: '#fff', textAlign: 'right' }}>Acme Corp</td>
                                  </tr>
                                  <tr>
                                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Amount:</td>
                                    <td style={{ padding: '4px 0', color: '#ffaa55', textAlign: 'right', fontWeight: 'bold' }}>$14,250.00</td>
                                  </tr>
                                  <tr>
                                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Item:</td>
                                    <td style={{ padding: '4px 0', color: '#fff', textAlign: 'right' }}>Cloud Core Cluster API License</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Action Approve Button */}
                            <button
                              style={{
                                width: '100%', padding: '12px', borderRadius: '6px', border: 'none',
                                fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                                background: screenState === 'crm_approved' ? '#10b981' : '#ff4b2b',
                                color: '#fff',
                                boxShadow: screenState === 'crm_approved' ? '0 0 15px rgba(16,185,129,0.3)' : '0 0 15px rgba(255,75,43,0.2)',
                                transition: 'all 0.4s ease',
                                marginTop: 'auto'
                              }}
                            >
                              {screenState === 'crm_approved' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  <Check size={16} /> APPROVED ✓
                                </div>
                              ) : 'APPROVE INVOICE'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ color: '#475569', fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                            Select an invoice card from the list to display parameters.
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* SIMULATED AD POP-UP BLOCKER DIALOG */}
            {showPopup && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'rgba(30, 20, 20, 0.95)', border: '2px solid #ef4444',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)', borderRadius: '8px',
                width: '320px', padding: '20px', zIndex: 900, textAlign: 'center'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    🚨 System Warning
                  </span>
                  <button 
                    style={{ background: 'transparent', border: 'none', color: '#ff8888', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    [X]
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: '10px 0 20px 0', lineHeight: '1.4' }}>
                  Pop-up Blocker Active: Dynamic script execution is temporarily obstructed. Dismiss this banner to resume execution.
                </p>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Overlay Target Coordinate bounds: [620, 220]
                </div>
              </div>
            )}

            {/* CURSOR MOUSE POINTER */}
            <div 
              style={{
                position: 'absolute',
                top: `${cursorPos.y}px`,
                left: `${cursorPos.x}px`,
                zIndex: 9999,
                pointerEvents: 'none',
                transition: 'top 0.85s cubic-bezier(0.25, 0.8, 0.25, 1), left 0.85s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              <MousePointer 
                size={22} 
                style={{
                  color: cursorClick ? '#00f2fe' : '#ffffff',
                  fill: cursorClick ? '#00f2fe' : '#ffffff',
                  filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.6))',
                  transform: cursorClick ? 'scale(0.8) translate(-2px, -2px)' : 'scale(1)',
                  transition: 'transform 0.15s ease, color 0.15s ease'
                }} 
              />
              
              {/* Click pulse effect */}
              {cursorClick && (
                <div style={{
                  position: 'absolute',
                  top: '-12px', left: '-12px',
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  border: '2px solid #00f2fe',
                  animation: 'pulse 0.4s ease-out',
                  opacity: 0
                }} />
              )}
            </div>

          </div>

        </div>

      </div>
      
      {/* KEYFRAME ANIMATIONS FOR THE PANEL */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-spin {
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
