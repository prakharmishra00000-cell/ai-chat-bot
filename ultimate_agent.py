import os
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
            plan = f"# Proposed Operational Plan for: '{user_prompt}'\n"
            plan += "1. Open Windows file browser / Downloads folder\n"
            plan += "2. Mapped icon spatial coordinates\n"
            plan += "3. Delete duplicate screenshot files\n\n"
            plan += "def execute_task():\n"
            plan += "    # PyAutoGUI controls will start moving now\n"
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
            print("\n[🚨 KILL-SWITCH ACTIVATED] Escape key pressed. Halting all automation systems immediately.")
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

    sys.exit(app.exec())
