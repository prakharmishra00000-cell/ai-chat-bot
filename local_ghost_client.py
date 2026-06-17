import time
import requests
import pyautogui
import base64
from io import BytesIO
from PIL import ImageGrab

# MatrixMind Bot Local OS Ghost Client
# This script bridges the web dashboard's "Take the Wheel" button to your physical OS.

SERVER_URL = "https://ai-chat-bot-gykb.onrender.com"  # Change this to your Render URL in production
USER_EMAIL = "prakharmishra00000@gmail.com" # Must match logged in email

def capture_screen_base64():
    try:
        # Capture screen and resize to 1024x768 for Gemini Vision API limits
        screen = ImageGrab.grab()
        screen = screen.resize((1024, 768))
        buffered = BytesIO()
        screen.save(buffered, format="JPEG", quality=80)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return "data:image/jpeg;base64," + img_str
    except Exception as e:
        print(f"[!] Screenshot Error: {e}")
        return None

def execute_action(action):
    try:
        if action['type'] == 'mouse_move':
            # Map 1000x1000 normalized coordinates to actual screen size
            screen_w, screen_h = pyautogui.size()
            target_x = int(action['x'] * (screen_w / 1000.0))
            target_y = int(action['y'] * (screen_h / 1000.0))
            print(f"[*] Moving mouse to ({target_x}, {target_y})")
            pyautogui.moveTo(target_x, target_y, duration=0.5)

        elif action['type'] == 'mouse_click':
            clicks = action.get('clicks', 1)
            button = action.get('button', 'left')
            print(f"[*] Clicking {button} {clicks} times")
            pyautogui.click(button=button, clicks=clicks, interval=0.1)

        elif action['type'] == 'key_press':
            keys = action.get('keys', [])
            print(f"[*] Pressing keys: {keys}")
            if keys:
                pyautogui.hotkey(*keys)

        # Brief pause between actions for safety and visual tracking
        time.sleep(0.5)

    except Exception as e:
        print(f"[!] Execution Error: {e}")

def main():
    print(f"==================================================")
    print(f" MatrixMind OS Ghost Client Started")
    print(f" Connecting to: {SERVER_URL}")
    print(f" Listening for commands for: {USER_EMAIL}")
    print(f" [Safety] Move physical mouse to corners to abort!")
    print(f"==================================================")

    # Disable PyAutoGUI failsafe so we don't crash randomly, but keep it available
    pyautogui.FAILSAFE = True

    while True:
        try:
            # Poll the server for approved actions
            response = requests.get(f"{SERVER_URL}/api/ghost/poll-client?email={USER_EMAIL}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                actions = data.get('actions', [])
                
                if actions:
                    print(f"\n[+] Received {len(actions)} approved actions! Executing...")
                    for action in actions:
                        if action.get('type') == 'error':
                            print(f"[!] API Error: {action.get('description')}")
                            continue
                        
                        print(f"  -> {action.get('description', 'Unnamed Action')}")
                        execute_action(action)
                        
                    print("[+] Action sequence complete. Resuming tracking...")

        except requests.exceptions.RequestException:
            pass # Ignore connection errors from polling
        except KeyboardInterrupt:
            print("\n[!] OS Ghost Client stopped by user.")
            break
        except Exception as e:
            print(f"[!] Error: {e}")

        # Poll every 2 seconds to not hammer the server
        time.sleep(2)

if __name__ == "__main__":
    main()
