import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Check, X, Terminal, Loader2, Sparkles, Cpu, Layers, 
  MousePointer, Monitor, RotateCcw, ShieldAlert, Folder, File, 
  Trash2, ArrowRight, Zap, HelpCircle, AlertCircle
} from 'lucide-react';

const steps = [
  { id: 1, label: 'Translucency & Layer Shift', desc: 'Chat dock locks right, fading main frame to transparent' },
  { id: 2, label: 'High-Frequency Ingestion', desc: 'Capturing active desktop pixels at 1024x768 resolution' },
  { id: 3, label: 'Semantic Interface Mapping', desc: 'Parsing icons, windows, & labels into spatial coordinates' },
  { id: 4, label: 'Staging Interceptor Check', desc: 'Pre-flight check awaiting user approval to unlock safety gates' },
  { id: 5, label: 'Action Token Emission', desc: 'Driving mouse cursor, double-clicks, & keyboard inputs' },
  { id: 6, label: 'Continuous Verification Loop', desc: 'Capturing new states, confirming layout, & finalizing task' }
];

export default function OSGhostPanel({ onClose }) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); 
  const [status, setStatus] = useState('idle'); // 'idle', 'staging', 'running', 'emergency_override', 'completed'
  const [logs, setLogs] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: 300, y: 200 });
  const [cursorClick, setCursorClick] = useState(false);
  
  // OS Simulator States
  const [desktopFiles, setDesktopFiles] = useState([
    { id: 1, name: 'invoice_acme_corp.pdf', type: 'pdf', size: '145 KB', x: 50, y: 70, status: 'visible' },
    { id: 2, name: 'invoice_stark_ind.pdf', type: 'pdf', size: '280 KB', x: 50, y: 150, status: 'visible' },
    { id: 3, name: 'screenshot_1_dup.png', type: 'image', size: '1.2 MB', x: 50, y: 230, status: 'visible' },
    { id: 4, name: 'screenshot_1.png', type: 'image', size: '1.2 MB', x: 50, y: 310, status: 'visible' },
    { id: 5, name: 'banner_design.jpg', type: 'image', size: '4.5 MB', x: 180, y: 70, status: 'visible' },
    { id: 6, name: 'code_snippet.js', type: 'code', size: '4 KB', x: 180, y: 150, status: 'visible' },
    { id: 7, name: 'logo_new.png', type: 'image', size: '350 KB', x: 180, y: 230, status: 'visible' },
    { id: 8, name: 'tax_statement_2025.pdf', type: 'pdf', size: '920 KB', x: 180, y: 310, status: 'visible' },
    { id: 9, name: 'invoice_acme_copy.pdf', type: 'pdf', size: '145 KB', x: 310, y: 70, status: 'visible' },
    { id: 10, name: 'screenshot_2.png', type: 'image', size: '890 KB', x: 310, y: 150, status: 'visible' },
    { id: 11, name: 'screenshot_2_dup.png', type: 'image', size: '890 KB', x: 310, y: 230, status: 'visible' },
    { id: 12, name: 'notes.txt', type: 'text', size: '1.2 KB', x: 310, y: 310, status: 'visible' }
  ]);

  const [folders, setFolders] = useState([]); // { name: '', x: , y: , files: [] }
  const [trashCount, setTrashCount] = useState(0);
  const logsEndRef = useRef(null);
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));


  const addLog = (tag, message) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), tag, message }]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Capture Escape key for Emergency Override
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && running) {
        triggerEmergencyOverride();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running]);

  const triggerEmergencyOverride = () => {
    setStatus('emergency_override');
    setRunning(false);
    addLog('OVERRIDE', '🚨 EMERGENCY OVERRIDE TRIGGERED BY USER (Escape Key tapped). AI Control terminated immediately.');
    addLog('OVERRIDE', 'Permissions locked down. Hardware mouse & keyboard drivers returned to manual operation.');
  };

  // Main execution timeline
  const startOSGhostWorkflow = async () => {
    // Reset state
    setRunning(true);
    setCurrentStep(1);
    setStatus('running');
    setLogs([]);
    setCursorPos({ x: 300, y: 200 });
    setFolders([]);
    setTrashCount(0);
    setDesktopFiles([
      { id: 1, name: 'invoice_acme_corp.pdf', type: 'pdf', size: '145 KB', x: 50, y: 70, status: 'visible' },
      { id: 2, name: 'invoice_stark_ind.pdf', type: 'pdf', size: '280 KB', x: 50, y: 150, status: 'visible' },
      { id: 3, name: 'screenshot_1_dup.png', type: 'image', size: '1.2 MB', x: 50, y: 230, status: 'visible' },
      { id: 4, name: 'screenshot_1.png', type: 'image', size: '1.2 MB', x: 50, y: 310, status: 'visible' },
      { id: 5, name: 'banner_design.jpg', type: 'image', size: '4.5 MB', x: 180, y: 70, status: 'visible' },
      { id: 6, name: 'code_snippet.js', type: 'code', size: '4 KB', x: 180, y: 150, status: 'visible' },
      { id: 7, name: 'logo_new.png', type: 'image', size: '350 KB', x: 180, y: 230, status: 'visible' },
      { id: 8, name: 'tax_statement_2025.pdf', type: 'pdf', size: '920 KB', x: 180, y: 310, status: 'visible' },
      { id: 9, name: 'invoice_acme_copy.pdf', type: 'pdf', size: '145 KB', x: 310, y: 70, status: 'visible' },
      { id: 10, name: 'screenshot_2.png', type: 'image', size: '890 KB', x: 310, y: 150, status: 'visible' },
      { id: 11, name: 'screenshot_2_dup.png', type: 'image', size: '890 KB', x: 310, y: 230, status: 'visible' },
      { id: 12, name: 'notes.txt', type: 'text', size: '1.2 KB', x: 310, y: 310, status: 'visible' }
    ]);

    // --- STEP 1: Layer Shift ---
    addLog('SYSTEM', 'Initiating OS Ghost layer shift...');
    await wait(800);
    addLog('SYSTEM', 'Fading text chat viewport to translucent dock. Attaching to right screen margin.');
    await wait(600);

    // --- STEP 2: Ingest Screen ---
    setCurrentStep(2);
    addLog('VISION', 'Grabbing active display framebuffer (1024x768 optimized pixels)...');
    await wait(800);
    addLog('VISION', 'Screen captured successfully. Formulating structural scene graph...');
    await wait(600);

    // --- STEP 3: Mapping ---
    setCurrentStep(3);
    addLog('MAPPING', 'Scanning icons, coordinate grids, and filesystem references...');
    await wait(800);
    addLog('MAPPING', 'Mapped 12 file bounding boxes, 1 recycle bin location [x: 750, y: 500].');
    await wait(600);

    // --- STEP 4: Staging Interceptor ( सेफ्टी गेट ) ---
    setCurrentStep(4);
    setStatus('staging');
    addLog('SAFETY', 'STAGING INTERCEPTOR ACTIVE. Awaiting Human Authorization to proceed.');
    addLog('SAFETY', 'Pre-flight proposed actions list loaded in right control dock.');
  };

  const approveStagingSequence = async () => {
    setStatus('running');
    addLog('SAFETY', 'Sequence Authorized by User. Commencing OS hardware inputs...');
    await wait(500);


    // --- STEP 5: Execution ---
    setCurrentStep(5);

    // Create folders
    addLog('ACTION', 'Creating target subdirectories for clean grouping...');
    await wait(600);

    // Create Acme Corp folder
    setCursorPos({ x: 500, y: 100 });
    await wait(700);
    setCursorClick(true); await wait(100); setCursorClick(false);
    addLog('ACTION', 'mkdir("/Documents/Acme_Corp")');
    setFolders(prev => [...prev, { name: 'Acme_Corp', x: 500, y: 100, count: 0 }]);
    await wait(800);

    // Create Stark Industries folder
    setCursorPos({ x: 500, y: 220 });
    await wait(700);
    setCursorClick(true); await wait(100); setCursorClick(false);
    addLog('ACTION', 'mkdir("/Documents/Stark_Ind")');
    setFolders(prev => [...prev, { name: 'Stark_Ind', x: 500, y: 220, count: 0 }]);
    await wait(800);

    // Create Creative folder
    setCursorPos({ x: 500, y: 340 });
    await wait(700);
    setCursorClick(true); await wait(100); setCursorClick(false);
    addLog('ACTION', 'mkdir("/Documents/Creative")');
    setFolders(prev => [...prev, { name: 'Creative', x: 500, y: 340, count: 0 }]);
    await wait(800);

    // Drag invoice_acme_corp.pdf (ID 1) -> Acme_Corp folder
    addLog('ACTION', 'Moving Acme Corp PDF records to new location...');
    setCursorPos({ x: 50, y: 70 });
    await wait(750);
    setCursorPos({ x: 500, y: 100 });
    await wait(750);
    setDesktopFiles(prev => prev.map(f => f.id === 1 ? { ...f, status: 'moved' } : f));
    setFolders(prev => prev.map(f => f.name === 'Acme_Corp' ? { ...f, count: f.count + 1 } : f));
    addLog('ACTION', 'mv("invoice_acme_corp.pdf", "/Documents/Acme_Corp/")');
    await wait(800);

    // Drag invoice_acme_copy.pdf (ID 9) -> Acme_Corp folder
    setCursorPos({ x: 310, y: 70 });
    await wait(750);
    setCursorPos({ x: 500, y: 100 });
    await wait(750);
    setDesktopFiles(prev => prev.map(f => f.id === 9 ? { ...f, status: 'moved' } : f));
    setFolders(prev => prev.map(f => f.name === 'Acme_Corp' ? { ...f, count: f.count + 1 } : f));
    addLog('ACTION', 'mv("invoice_acme_copy.pdf", "/Documents/Acme_Corp/")');
    await wait(800);

    // Drag invoice_stark_ind.pdf (ID 2) -> Stark_Ind folder
    addLog('ACTION', 'Moving Stark Industries PDF records...');
    setCursorPos({ x: 50, y: 150 });
    await wait(750);
    setCursorPos({ x: 500, y: 220 });
    await wait(750);
    setDesktopFiles(prev => prev.map(f => f.id === 2 ? { ...f, status: 'moved' } : f));
    setFolders(prev => prev.map(f => f.name === 'Stark_Ind' ? { ...f, count: f.count + 1 } : f));
    addLog('ACTION', 'mv("invoice_stark_ind.pdf", "/Documents/Stark_Ind/")');
    await wait(800);

    // Drag banner_design.jpg (ID 5) -> Creative folder
    addLog('ACTION', 'Grouping creative assets together...');
    setCursorPos({ x: 180, y: 70 });
    await wait(750);
    setCursorPos({ x: 500, y: 340 });
    await wait(750);
    setDesktopFiles(prev => prev.map(f => f.id === 5 ? { ...f, status: 'moved' } : f));
    setFolders(prev => prev.map(f => f.name === 'Creative' ? { ...f, count: f.count + 1 } : f));
    addLog('ACTION', 'mv("banner_design.jpg", "/Documents/Creative/")');
    await wait(800);

    // Drag logo_new.png (ID 7) -> Creative folder
    setCursorPos({ x: 180, y: 230 });
    await wait(750);
    setCursorPos({ x: 500, y: 340 });
    await wait(750);
    setDesktopFiles(prev => prev.map(f => f.id === 7 ? { ...f, status: 'moved' } : f));
    setFolders(prev => prev.map(f => f.name === 'Creative' ? { ...f, count: f.count + 1 } : f));
    addLog('ACTION', 'mv("logo_new.png", "/Documents/Creative/")');
    await wait(800);

    // Drag screenshot_1_dup.png (ID 3) -> Trash Bin [x: 750, y: 500]
    addLog('ACTION', 'Sending duplicate screenshots to Recycle Bin...');
    setCursorPos({ x: 50, y: 230 });
    await wait(750);
    setCursorPos({ x: 750, y: 500 });
    await wait(750);
    setDesktopFiles(prev => prev.map(f => f.id === 3 ? { ...f, status: 'deleted' } : f));
    setTrashCount(prev => prev + 1);
    addLog('ACTION', 'rm("screenshot_1_dup.png") -> Sent to Trash');
    await wait(800);

    // Drag screenshot_2_dup.png (ID 11) -> Trash Bin [x: 750, y: 500]
    setCursorPos({ x: 310, y: 230 });
    await wait(750);
    setCursorPos({ x: 750, y: 500 });
    await wait(750);
    setDesktopFiles(prev => prev.map(f => f.id === 11 ? { ...f, status: 'deleted' } : f));
    setTrashCount(prev => prev + 1);
    addLog('ACTION', 'rm("screenshot_2_dup.png") -> Sent to Trash');
    await wait(1000);

    // --- STEP 6: Verification ---
    setCurrentStep(6);
    addLog('VERIFICATION', 'Taking final screen snapshot...');
    await wait(800);
    addLog('VERIFICATION', 'Validating final filesystem output. 5 files moved, 2 duplicate files sent to Trash.');
    await wait(600);
    addLog('VERIFICATION', 'Task Completed Successfully. Returning system controls to User.');
    
    setStatus('completed');
    setRunning(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 5, 12, 0.95)', backdropFilter: 'blur(20px)',
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', sans-serif", color: '#f1f5f9'
    }}>
      
      {/* HEADER PANEL */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(12, 12, 28, 0.95)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cpu size={24} color="var(--accent-cyan)" style={{ filter: 'drop-shadow(0 0 8px var(--border-glass-glow))' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
              System-Wide OS Ghost Panel
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Securely driving system mouse coordinates, folder allocations, and duplication filters
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

      {/* ACTIVE ACTION INPUT DIRECTIVE BAR */}
      <div style={{
        padding: '16px 24px', background: 'rgba(0, 242, 254, 0.03)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.1)',
        display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ flex: 1 }}>
          <span style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Action Directive
          </span>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.9rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
            "Clean up my machine. Sort all PDFs into folders by client name, move images to a 'Creative' folder, and delete any duplicate screenshots."
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {status === 'emergency_override' && (
            <button 
              className="btn btn-secondary"
              onClick={startOSGhostWorkflow}
              style={{ padding: '12px 20px', fontSize: '0.9rem', color: 'var(--accent-cyan)' }}
            >
              Reset Session
            </button>
          )}

          <button 
            className="btn" 
            onClick={startOSGhostWorkflow} 
            disabled={running || status === 'staging'}
            style={{ 
              padding: '12px 24px', 
              fontSize: '0.9rem', 
              background: running || status === 'staging' ? 'rgba(255,255,255,0.1)' : 'var(--gradient-primary)',
              color: running || status === 'staging' ? '#94a3b8' : 'var(--text-dark)',
              opacity: running || status === 'staging' ? 0.7 : 1,
              cursor: running || status === 'staging' ? 'not-allowed' : 'pointer'
            }}
          >
            {running ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Moving Mouse...
              </>
            ) : status === 'staging' ? (
              <>
                <ShieldAlert size={16} /> Awaiting Approval
              </>
            ) : status === 'completed' ? (
              <>
                <RotateCcw size={16} /> Re-run OS Ghost
              </>
            ) : (
              <>
                <Play size={16} /> Take the Wheel
              </>
            )}
          </button>
        </div>
      </div>

      {/* WORKSPACE CONTENT GRID */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '400px 1fr',
        gap: '24px', padding: '24px', overflow: 'hidden'
      }}>
        
        {/* LEFT COLUMN: TELEMETRY & STRATEGY STEPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          {/* STAGING INTERCEPTOR OVERVIEW */}
          {status === 'staging' && (
            <div className="glass-panel" style={{ padding: '18px', border: '1px solid #ff9900', background: 'rgba(255, 153, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff9900' }}>
                <ShieldAlert size={20} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Safety Gates: Proposed Action List</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>
                System-level mouse inputs are currently frozen. Authorize the following operations before proceeding:
              </p>
              
              <div style={{
                background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px',
                fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace'
              }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff9900' }}>•</span>
                  <span>Create directory <b>/Documents/Acme_Corp</b></span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff9900' }}>•</span>
                  <span>Create directory <b>/Documents/Stark_Ind</b></span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff9900' }}>•</span>
                  <span>Create directory <b>/Documents/Creative</b></span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff9900' }}>•</span>
                  <span>Move 2 matching Acme Corp PDFs</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff9900' }}>•</span>
                  <span>Move 1 matching Stark Industries PDF</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ff9900' }}>•</span>
                  <span>Move 2 matching design images</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ef4444' }}>•</span>
                  <span>Permanently delete 2 duplicate screenshots</span>
                </div>
              </div>

              <button
                onClick={approveStagingSequence}
                style={{
                  width: '100%', padding: '10px', background: '#ff9900', color: '#000',
                  border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer',
                  fontSize: '0.85rem', boxShadow: '0 0 15px rgba(255, 153, 0, 0.3)'
                }}
              >
                Approve Action Sequence
              </button>
            </div>
          )}

          {/* EMERGENCY WARNING */}
          {status === 'emergency_override' && (
            <div className="glass-panel" style={{ padding: '18px', border: '1px solid var(--accent-neon-red)', background: 'rgba(255,0,85,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-neon-red)' }}>
                <AlertCircle size={20} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>AI Control Terminated</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>
                Emergency takeover triggered. Mouse cursor lock has been completely released, hardware overrides have been suspended, and system parameters are frozen.
              </p>
            </div>
          )}

          {/* STEPS LIST */}
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
              <Layers size={16} /> Loop Execution Steps
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
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
              <Terminal size={16} /> OS Ghost Reasoner logs
            </h3>
            
            <div style={{
              flex: 1, background: 'rgba(6, 6, 16, 0.95)', border: '1px solid rgba(0, 242, 254, 0.1)',
              borderRadius: '8px', padding: '12px', fontFamily: "'Courier New', monospace",
              fontSize: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              {logs.length === 0 ? (
                <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                  Awaiting Take the Wheel activation...
                </div>
              ) : (
                logs.map((log, idx) => {
                  let color = '#38bdf8'; 
                  if (log.tag === 'VISION') color = '#a78bfa';
                  if (log.tag === 'MAPPING') color = '#fbbf24';
                  if (log.tag === 'ACTION') color = '#34d399';
                  if (log.tag === 'OVERRIDE') color = 'var(--accent-neon-red)';
                  if (log.tag === 'SAFETY') color = '#ff9900';
                  if (log.tag === 'VERIFICATION') color = '#2dd4bf';

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
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Monitor size={12} /> OS Desktop Layer (Translucent Mode Active)
            </div>
            <div style={{ fontSize: '0.7rem', color: '#ff9900', fontWeight: 'bold' }}>
              {running && "⚠️ ESC Key to Abort / Takeover"}
            </div>
          </div>

          {/* DESKTOP CANVAS */}
          <div 
            style={{
              flex: 1, background: '#08080f', position: 'relative', overflow: 'hidden',
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 20, 60, 0.3) 0%, transparent 80%)'
            }}
          >
            
            {/* Folder targets rendering */}
            {folders.map((f, idx) => (
              <div 
                key={idx}
                style={{
                  position: 'absolute', left: `${f.x}px`, top: `${f.y}px`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  width: '90px', padding: '10px', borderRadius: '6px',
                  border: '1px solid rgba(0, 242, 254, 0.2)', background: 'rgba(0, 242, 254, 0.05)',
                  boxShadow: '0 0 10px rgba(0, 242, 254, 0.05)', animation: 'scaleIn 0.3s ease'
                }}
              >
                <Folder size={32} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-all' }}>
                  {f.name}
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  ({f.count} items)
                </span>
              </div>
            ))}

            {/* Desktop files rendering */}
            {desktopFiles.map((file) => {
              if (file.status !== 'visible') return null;
              
              let fileColor = '#38bdf8';
              if (file.type === 'image') fileColor = '#fb7185';
              if (file.type === 'code') fileColor = '#34d399';
              if (file.type === 'text') fileColor = '#fbbf24';

              return (
                <div 
                  key={file.id}
                  style={{
                    position: 'absolute', left: `${file.x}px`, top: `${file.y}px`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    width: '90px', padding: '10px', borderRadius: '6px',
                    border: '1px solid transparent', cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <File size={28} color={fileColor} />
                  <span style={{ fontSize: '0.65rem', color: '#cbd5e1', textAlign: 'center', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: '0.58rem', color: '#475569' }}>
                    {file.size}
                  </span>
                </div>
              );
            })}

            {/* Recycle Trash Bin */}
            <div 
              style={{
                position: 'absolute', left: '740px', top: '480px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                width: '90px', padding: '10px', opacity: 0.85
              }}
            >
              <Trash2 size={34} color={trashCount > 0 ? '#ef4444' : '#64748b'} style={{ filter: trashCount > 0 ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' : 'none' }} />
              <span style={{ fontSize: '0.68rem', color: trashCount > 0 ? '#f87171' : '#94a3b8', fontWeight: 'bold' }}>
                Recycle Bin
              </span>
              <span style={{ fontSize: '0.6rem', color: '#475569' }}>
                ({trashCount} items)
              </span>
            </div>

            {/* CURSOR MOUSE POINTER */}
            <div 
              style={{
                position: 'absolute',
                top: `${cursorPos.y}px`,
                left: `${cursorPos.x}px`,
                zIndex: 9999,
                pointerEvents: 'none',
                transition: 'top 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), left 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              <MousePointer 
                size={22} 
                style={{
                  color: cursorClick ? 'var(--accent-cyan)' : '#ffffff',
                  fill: cursorClick ? 'var(--accent-cyan)' : '#ffffff',
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
                  border: '2px solid var(--accent-cyan)',
                  animation: 'pulseCircle 0.4s ease-out',
                  opacity: 0
                }} />
              )}
            </div>

          </div>

        </div>

      </div>
      
      {/* KEYFRAME ANIMATIONS */}
      <style>{`
        @keyframes pulseCircle {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-spin {
          animation: spinOsc 1s linear infinite;
        }
        @keyframes spinOsc {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
