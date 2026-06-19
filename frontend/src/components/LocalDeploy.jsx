import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Terminal, Cpu, ShieldAlert, Play, Download } from 'lucide-react';

function LocalDeploy({ onBack }) {
  const [copied, setCopied] = useState(false);

  const pythonScript = `import os
import sys
import threading
from pynput import keyboard
from interpreter import interpreter

# ==========================================
# 1. ORCHESTRATOR CONFIGURATION & SYSTEM RULESETS
# ==========================================

# Use a highly resilient model capable of complex desktop sequencing
interpreter.llm.model = "gpt-4o"

# CRITICAL: Disables automatic code execution. 
# This forces the bot to pause and await your interactive verification.
interpreter.auto_run = False

# Establish the strict review loop behavior
interpreter.system_message += """
Strict Operational Protocol:
1. When given a goal (e.g., managing files, searching data, moving windows), break it down into a comprehensive programmatic plan.
2. Output a clean, detailed text description of your intended script/commands to the user first.
3. Explicitly ask the user to verify the script. Do NOT attempt to run any code until approval is validated.
4. If the user suggests modifications, process the new instructions, rewrite the proposed script, and present it for verification again.
"""

# ==========================================
# 2. EMERGENCY HARD KILL-SWITCH (THE ESCAPE KEY)
# ==========================================

def monitor_kill_switch(key):
    """
    Listens globally for user input at the hardware layer.
    If the Escape key is hit at any point during planning or execution,
    the program immediately kills its own process tree.
    """
    try:
        if key == keyboard.Key.esc:
            print("\\n\\n[🚨] EMERGENCY INTERRUPT TRIGGERED: Escape key pressed.")
            print("[🚨] Terminating all background agent processes immediately.")
            # os._exit(1) shuts down the python runtime instantly, killing all running threads
            os._exit(1)
    except Exception:
        pass

def launch_keyboard_listener():
    """Starts the global hook to catch input events without blocking the main chat thread."""
    with keyboard.Listener(on_press=monitor_kill_switch) as listener:
        listener.join()

# ==========================================
# 3. INTERACTIVE RUNTIME LOOP
# ==========================================

def run_orchestrator():
    print("=" * 70)
    print("  🚀 SYSTEM-LEVEL DESKTOP AUTOMATION AGENT ACTIVE")
    print("  👉 WORKFLOW: Request -> Review Plan -> Modify OR Press 'y' to run.")
    print("  🛑 EMERGENCY: Press [ESC] at any microsecond to instantly kill the bot.")
    print("=" * 70)
    
    # Check for authentication variables before initialization
    if not os.environ.get("OPENAI_API_KEY") and not os.environ.get("ANTHROPIC_API_KEY"):
        print("\\n[❌] ERROR: Missing API credentials. Please set your OPENAI_API_KEY variable.")
        sys.exit(1)

    try:
        # Launches the interactive conversation framework directly in the terminal
        interpreter.chat()
    except KeyboardInterrupt:
        print("\\nSession ended cleanly by user.")
        sys.exit(0)

if __name__ == "__main__":
    # 1. Fire up the background listener thread for safety
    listener_thread = threading.Thread(target=launch_keyboard_listener, daemon=True)
    listener_thread.start()

    # 2. Launch the conversational interface
    run_orchestrator()`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([pythonScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "core_agent.py";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="auth-container" style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '1200px', width: '92%', height: '88vh', padding: '30px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px', flexShrink: 0 }}>
          <button 
            className="btn btn-secondary" 
            onClick={onBack}
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', margin: 0 }}
          >
            <ArrowLeft size={16} /> Back to Chat
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={24} color="var(--accent-cyan)" />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Local Agent Deployment Center
            </span>
          </div>
        </div>

        {/* Content Body Layout */}
        <div style={{ display: 'flex', gap: '25px', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          
          {/* Left Panel: Guide & Architecture */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Prereq Alert */}
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)', borderRadius: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                <Terminal size={18} /> Environment Prerequisites
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                Combined setup using an orchestrator for local system command interpretation, low-level global input listener, and a verified review gate.
              </p>
              <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border-glass)', color: '#f8f8f2', overflowX: 'auto' }}>
                <code>pip install open-interpreter pynput</code>
              </pre>
            </div>

            {/* Auth Keys Alert */}
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
                🔑 Set API Credentials
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>MacOS / Linux:</span>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    export OPENAI_API_KEY="your-api-key-here"
                  </pre>
                </div>
                <div>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Windows (Command Prompt):</span>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    set OPENAI_API_KEY="your-api-key-here"
                  </pre>
                </div>
                <div>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Windows (PowerShell):</span>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    $env:OPENAI_API_KEY="your-api-key-here"
                  </pre>
                </div>
              </div>
            </div>

            {/* Step by Step workflow */}
            <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0' }}>
                <Play size={18} color="var(--accent-cyan)" /> Step-by-Step Execution
              </h3>
              <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <li>
                  <strong>Initialize:</strong> Run the script using <code style={{ color: 'var(--accent-cyan)' }}>python core_agent.py</code>. The emergency kill-switch hook will load in the background.
                </li>
                <li>
                  <strong>Issue Command:</strong> Type your desktop request (e.g., <em>"Find all screenshots on Desktop and archive them..."</em>).
                </li>
                <li>
                  <strong>Review Script:</strong> The agent compiles your request and shows you the script. The prompt will pause and wait: <code style={{ color: '#ffb86c' }}>Proceed with code execution? (y/n)</code>.
                </li>
                <li>
                  <strong>Approve/Edit:</strong> Type <code style={{ color: 'var(--accent-cyan)' }}>y</code> to run, or request changes directly in the chat to dynamically recreate the workflow.
                </li>
                <li>
                  <strong>Safety Interrupt:</strong> Press the physical <strong style={{ color: '#ff3366' }}>[ESC]</strong> key at any microsecond to instantly kill all running scripts and the Python runtime.
                </li>
              </ul>
            </div>

          </div>

          {/* Right Panel: Code block & controls */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
            
            {/* Copy / Download actions bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                💻 core_agent.py (Python Source Code)
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCopy}
                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}
                >
                  {copied ? <Check size={14} color="var(--accent-cyan)" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button 
                  className="btn"
                  onClick={handleDownload}
                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, background: 'var(--gradient-primary)' }}
                >
                  <Download size={14} />
                  Download Script
                </button>
              </div>
            </div>

            {/* Fenced Code Editor Panel */}
            <div style={{ flex: 1, minHeight: 0, background: '#050a15', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '15px', overflowY: 'auto', fontFamily: 'Courier New, monospace', fontSize: '0.82rem', color: '#a6accd', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              <span style={{ color: '#6272a4', display: 'block', marginBottom: '10px' }}># Click "Copy Code" or "Download Script" to save locally</span>
              {pythonScript}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default LocalDeploy;
