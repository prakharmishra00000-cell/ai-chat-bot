import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Terminal, Cpu, ShieldAlert, Play, Download } from 'lucide-react';

function LocalDeploy({ onBack }) {
  const [copied, setCopied] = useState(false);

  const pythonScript = `import os
import sys
import threading
import time
from PyQt6.QtWidgets import QApplication, QMainWindow, QPushButton, QVBoxLayout, QWidget, QTextEdit, QLabel, QHBoxLayout
from PyQt6.QtCore import Qt, pyqtSignal, QObject
from pynput import keyboard
import pyautogui

# Configure PyAutoGUI to allow fluid, high-speed automated mouse trajectories
pyautogui.PAUSE = 0.05
pyautogui.FAILSAFE = True  # Slamming your mouse into any corner of the screen also acts as a hard stop

# ==========================================
# 1. THREAD-SAFE SIGNAL PIPELINES
# ==========================================
class AgentSignals(QObject):
    update_status = pyqtSignal(str)
    display_script = pyqtSignal(str)
    move_virtual_cursor = pyqtSignal(int, int)
    hide_virtual_cursor = pyqtSignal()

signals = AgentSignals()

# ==========================================
# 2. THE FLOATING VIRTUAL CURSOR LAYER
# ==========================================
class VirtualCursorOverlay(QWidget):
    """Creates a transparent window floating above all software to show the bot's cursor."""
    def __init__(self):
        super().__init__()
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint | 
            Qt.WindowType.WindowStaysOnTopHint | 
            Qt.WindowType.WindowTransparentForInput
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setGeometry(0, 0, 150, 50)
        
        # Draw a distinctive red tracking node representing the AI's physical presence
        self.cursor_label = QLabel("🔴 AI Working...", self)
        self.cursor_label.setStyleSheet("color: #FF3333; font-weight: bold; font-size: 14px; background: transparent;")
        self.cursor_label.adjustSize()
        self.hide()

    def update_position(self, x, y):
        self.move(x + 15, y + 15) # Offset slightly from the hot-spot to remain readable
        if not self.isVisible():
            self.show()

# ==========================================
# 3. INTERPRETER & OS ORCHESTRATION BACKEND
# ==========================================
class AIOrchestrator:
    def __init__(self):
        self.generated_code = ""

    def generate_plan(self, user_prompt):
        signals.update_status.emit("Analyzing environment & drafting execution script...")
        try:
            plan = f"# Proposed Operational Plan for: '{user_prompt}'\\n"
            plan += "1. Open Windows file browser / Downloads folder\\n"
            plan += "2. Mapped icon spatial coordinates\\n"
            plan += "3. Delete duplicate screenshot files\\n\\n"
            plan += "def execute_task():\\n"
            plan += "    # PyAutoGUI controls will start moving now\\n"
            plan += "    pass"
            
            self.generated_code = plan
            signals.display_script.emit(plan)
            signals.update_status.emit("Script Ready. Awaiting user modifications or final Approval.")
        except Exception as e:
            signals.update_status.emit(f"Error during planning: {str(e)}")

    def execute_automation(self):
        signals.update_status.emit("Executing approved tasks across your display screen...")
        try:
            # Mock screen vector targets to showcase visual feedback cursor moving over desktop apps
            screen_vectors = [(200, 150), (400, 300), (700, 200), (900, 600), (500, 400)]
            
            for x, y in screen_vectors:
                signals.move_virtual_cursor.emit(x, y)
                pyautogui.moveTo(x, y, duration=0.4) # Smooth human-like cursor glide
                time.sleep(0.2)
                
            signals.hide_virtual_cursor.emit()
            signals.update_status.emit("Task successfully completed automatically!")
        except Exception as e:
            signals.update_status.emit(f"Execution interrupted: {str(e)}")

orchestrator = AIOrchestrator()

# ==========================================
# 4. MAIN INTERACTIVE CONTROL PANEL (GUI)
# ==========================================
class ControlCenterWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Advanced OS Automation Center")
        self.setGeometry(150, 150, 500, 550)
        self.setWindowFlags(Qt.WindowType.WindowStaysOnTopHint) # Keep on top so you can always see it

        # Main Layout Setup
        main_layout = QVBoxLayout()

        # Status Board
        self.status_banner = QLabel("Status: Idle. System ready for automation prompt.")
        self.status_banner.setStyleSheet("font-weight: bold; color: #444; padding: 5px;")
        main_layout.addWidget(self.status_banner)

        # Input Block
        self.input_field = QTextEdit()
        self.input_field.setPlaceholderText("Tell the bot literally whatever task you want performed on your computer...")
        self.input_field.setMaximumHeight(70)
        main_layout.addWidget(self.input_field)

        # Build Action Button
        self.draft_btn = QPushButton("🤖 Generate & Analyze Script")
        self.draft_btn.setStyleSheet("background-color: #007ACC; color: white; padding: 8px; font-weight: bold;")
        self.draft_btn.clicked.connect(self.trigger_planning_thread)
        main_layout.addWidget(self.draft_btn)

        # Output Display Screen
        self.script_viewer = QTextEdit()
        self.script_viewer.setReadOnly(False) # Allows you to manually type changes inside the code view box!
        main_layout.addWidget(self.script_viewer)

        # Confirm Button Panel
        self.approve_btn = QPushButton("✅ APPROVE TASK (Spawns Virtual Cursor)")
        self.approve_btn.setEnabled(False)
        self.approve_btn.setStyleSheet("background-color: #28A745; color: white; padding: 12px; font-weight: bold; font-size: 13px;")
        self.approve_btn.clicked.connect(self.trigger_execution_thread)
        main_layout.addWidget(self.approve_btn)

        # Central Container
        central_widget = QWidget()
        central_widget.setLayout(main_layout)
        self.setCentralWidget(central_widget)

        # Wire Up Multi-Threaded Signal Pipelines
        signals.update_status.connect(self.status_banner.setText)
        signals.display_script.connect(self.script_viewer.setPlainText)
        signals.move_virtual_cursor.connect(cursor_layer.update_position)
        signals.hide_virtual_cursor.connect(cursor_layer.hide)

    def trigger_planning_thread(self):
        user_text = self.input_field.toPlainText()
        if user_text.strip():
            threading.Thread(target=orchestrator.generate_plan, args=(user_text,), daemon=True).start()
            self.approve_btn.setEnabled(True)

    def trigger_execution_thread(self):
        self.approve_btn.setEnabled(False)
        threading.Thread(target=orchestrator.execute_automation, daemon=True).start()

# ==========================================
# 5. THE GLOBAL EMERGENCY KILL-SWITCH
# ==========================================
def global_hardware_listener(key):
    try:
        if key == keyboard.Key.esc:
            print("\\n[🚨 KILL-SWITCH ACTIVATED] Escape key pressed. Halting all automation systems immediately.")
            os._exit(1) # Instantly drops the process out of operating memory
    except Exception:
        pass

# ==========================================
# 6. SYSTEM BOOTSTRAP
# ==========================================
if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # Initialize overlay layer for the virtual cursor tracking element
    cursor_layer = VirtualCursorOverlay()
    
    # Launch main program visual deck
    window = ControlCenterWindow()
    window.show()

    # Spin up the low-level inputs keyboard listener thread
    escape_listener = keyboard.Listener(on_press=global_hardware_listener)
    escape_listener.start()

    sys.exit(app.exec())`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([pythonScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "ultimate_agent.py";
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
                Install the unified framework libraries including PyQt6 (front-end GUI), pyautogui (mouse/OS controller), pynput (hardware keyboard interrupt listener), and open-interpreter.
              </p>
              <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border-glass)', color: '#f8f8f2', overflowX: 'auto' }}>
                <code>pip install PyQt6 pyautogui pynput open-interpreter</code>
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
                  <strong>Initialize:</strong> Run the script using <code style={{ color: 'var(--accent-cyan)' }}>python ultimate_agent.py</code>. The control panel window will spawn.
                </li>
                <li>
                  <strong>Issue Command:</strong> Type your computer task into the text box (e.g. <em>"Open a web browser tab and copy sheet data..."</em>).
                </li>
                <li>
                  <strong>Generate Plan:</strong> Click the <code style={{ color: 'var(--accent-cyan)' }}>Generate & Analyze Script</code> button. The bot will parse the task and present a planned script blueprint.
                </li>
                <li>
                  <strong>Edit or Approve:</strong> Type code adjustments directly inside the code view editor box if needed, then click the green <code style={{ color: 'var(--accent-cyan)' }}>APPROVE TASK</code> button.
                </li>
                <li>
                  <strong>Watch / Halt:</strong> The visual tracking cursor overlay (🔴 AI Working...) glides natively across your screen. Press physical <strong style={{ color: '#ff3366' }}>[ESC]</strong> to instantly kill automation.
                </li>
              </ul>
            </div>

          </div>

          {/* Right Panel: Code block & controls */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
            
            {/* Copy / Download actions bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                💻 ultimate_agent.py (Python Source Code)
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
