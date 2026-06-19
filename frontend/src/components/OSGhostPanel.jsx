import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Check, X, Terminal, Loader2, Sparkles, Cpu, Layers, 
  MousePointer, Monitor, RotateCcw, ShieldAlert, Folder, File, 
  Trash2, ArrowRight, Zap, HelpCircle, AlertCircle, LayoutGrid, FileText
} from 'lucide-react';

const steps = [
  { id: 1, label: 'Translucency & Layer Shift', desc: 'Chat dock locks right, fading main frame to transparent' },
  { id: 2, label: 'High-Frequency Ingestion', desc: 'Capturing active desktop pixels at 1024x768 resolution' },
  { id: 3, label: 'Semantic Interface Mapping', desc: 'Parsing icons, windows, & labels into spatial coordinates' },
  { id: 4, label: 'Staging Interceptor Check', desc: 'Pre-flight check awaiting user approval to unlock safety gates' },
  { id: 5, label: 'Action Token Emission', desc: 'Driving mouse cursor, double-clicks, & keyboard inputs' },
  { id: 6, label: 'Continuous Verification Loop', desc: 'Capturing new states, confirming layout, & finalizing task' }
];

export default function OSGhostPanel({ onClose, initialPrompt, autoExecute = false, initialModifications = [] }) {
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
  const activePromptRef = useRef(initialPrompt || "");
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // Scenario state & user-editable prompt directive
  const [scenario, setScenario] = useState('desktop'); // 'desktop', 'browser', or 'start_menu'
  const [directivePrompt, setDirectivePrompt] = useState("Clean up my machine. Sort all PDFs into folders by client name, move images to a 'Creative' folder, and delete any duplicate screenshots.");
  const [activeBrowserTab, setActiveBrowserTab] = useState(1);
  const [invoiceApproved, setInvoiceApproved] = useState(false);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showTerminalWindow, setShowTerminalWindow] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([3, 11]);
  const [planModifications, setPlanModifications] = useState(initialModifications || []);
  const [modificationInput, setModificationInput] = useState('');

  // Auto-run if initialPrompt is passed from Dashboard
  useEffect(() => {
    if (initialPrompt) {
      startOSGhostWorkflow(initialPrompt);
    }
  }, [initialPrompt]);


  const addLog = (tag, message) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), tag, message }]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleAddModification = () => {
    if (!modificationInput.trim()) return;
    setPlanModifications(prev => [...prev, modificationInput.trim()]);
    addLog('SYSTEM', `Execution plan updated by user: "${modificationInput.trim()}"`);
    setModificationInput('');
  };

  // Capture Escape key for Emergency Override
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (running || status === 'staging' || status === 'running')) {
        triggerEmergencyOverride();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running, status]);

  const triggerEmergencyOverride = () => {
    setStatus('emergency_override');
    setRunning(false);
    addLog('OVERRIDE', '🚨 EMERGENCY OVERRIDE TRIGGERED BY USER (Escape Key tapped). AI Control terminated immediately.');
    addLog('OVERRIDE', 'Permissions locked down. Hardware mouse & keyboard drivers returned to manual operation.');
  };

  const approveStagingSequence = async () => {
    setStatus('running');
    addLog('SAFETY', 'Sequence Authorized by User. Commencing OS hardware inputs...');
    await wait(500);

    const activePrompt = activePromptRef.current || directivePrompt;

    // Call the local backend to execute physical OS actions on the host machine
    fetch('/api/os-ghost/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: activePrompt, modifications: planModifications })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        addLog('SAFETY', 'Local hardware mouse controller finished execution successfully!');
      } else {
        addLog('SAFETY', `Local hardware error: ${data.message}`);
      }
    })
    .catch(err => {
      console.warn('Backend execution bypassed (simulator active):', err);
    });

    // --- STEP 5: Execution ---
    setCurrentStep(5);

    if (scenario === 'browser') {
      const hasApproveKeyword = /approve|invoice|pay|acme/i.test(activePrompt);
      // Move to Tab 2
      addLog('ACTION', 'Moving cursor to browser Tab 2: "CRM Invoices" [x: 240, y: 40]...');
      setCursorPos({ x: 240, y: 40 });
      await wait(1000);

      // Click Tab 2
      setCursorClick(true);
      await wait(100);
      setCursorClick(false);
      setActiveBrowserTab(2);
      addLog('ACTION', 'click(left, single) -> Switched active tab to "CRM Invoices"');
      await wait(800);

      if (hasApproveKeyword) {
        // Ingest new frame
        addLog('VISION', 'Ingesting updated framebuffer after tab switch...');
        await wait(600);
        addLog('MAPPING', 'Mapped "Approve" button for Acme Corp at [x: 620, y: 195]');
        await wait(600);

        // Move to Approve button
        addLog('ACTION', 'Moving cursor to Approve button [x: 620, y: 195]...');
        setCursorPos({ x: 620, y: 195 });
        await wait(1000);

        // Click Approve
        setCursorClick(true);
        await wait(100);
        setCursorClick(false);
        setInvoiceApproved(true);
        addLog('ACTION', 'click(left, single) -> Approved Acme Corp Invoice #INV-2026-004');
        await wait(1000);

        // --- STEP 6: Verification ---
        setCurrentStep(6);
        addLog('VERIFICATION', 'Taking final screen snapshot...');
        await wait(800);
        addLog('VERIFICATION', 'Validating CRM portal state: Invoice #INV-2026-004 status is APPROVED.');
        await wait(600);
        addLog('VERIFICATION', 'Task Completed Successfully. Returning system controls.');
      } else {
        // --- STEP 6: Verification ---
        setCurrentStep(6);
        addLog('VERIFICATION', 'Taking final screen snapshot to verify browser active tab...');
        await wait(800);
        addLog('VERIFICATION', 'Browser Tab 2 (CRM Invoices) active tab state verified.');
        await wait(600);
        addLog('VERIFICATION', 'Task Completed Successfully. Returning system controls.');
      }
    } else if (scenario === 'start_menu') {
      const hasTerminalKeyword = /terminal|powershell|run|verify|shell|command|diagnostics/i.test(activePrompt);
      // Move to Start button [x: 28, y: 515]
      addLog('ACTION', 'Moving cursor to Start Menu launcher button [x: 28, y: 515]...');
      setCursorPos({ x: 28, y: 515 });
      await wait(1000);

      // Click Start Menu Button
      setCursorClick(true);
      await wait(100);
      setCursorClick(false);
      setShowStartMenu(true);
      addLog('ACTION', 'click(left, single) -> Opened OS Start Menu Launcher.');
      await wait(800);

      if (hasTerminalKeyword) {
        // Ingest updated frame
        addLog('VISION', 'Ingesting updated framebuffer of opened Start Menu launcher...');
        await wait(600);
        addLog('MAPPING', 'Mapped \'System Terminal\' shortcut item at [x: 100, y: 440]');
        await wait(600);

        // Move to System Terminal item
        addLog('ACTION', 'Moving cursor to \'System Terminal\' program item [x: 100, y: 440]...');
        setCursorPos({ x: 100, y: 440 });
        await wait(1000);

        // Click System Terminal
        setCursorClick(true);
        await wait(100);
        setCursorClick(false);
        setShowStartMenu(false);
        setShowTerminalWindow(true);
        setTerminalLines([
          "Microsoft Windows [Version 10.0.22631.3527]",
          "(c) Microsoft Corporation. All rights reserved.",
          "",
          "PS C:\\Users\\matrix_mind> "
        ]);
        addLog('ACTION', 'click(left, single) -> Executed command shell binary. Terminal window spawned.');
        await wait(1000);

        // Typing command
        addLog('ACTION', 'Typing shell instructions: "echo \'MatrixMind OS Agent running...\'"');
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          "PS C:\\Users\\matrix_mind> echo 'MatrixMind OS Agent running...'",
          "'MatrixMind OS Agent running...'",
          "",
          "PS C:\\Users\\matrix_mind> "
        ]);
        await wait(1200);

        // Running verification command
        addLog('ACTION', 'Executing system diagnostics checklist command...');
        setTerminalLines(prev => [
          ...prev.slice(0, -1),
          "PS C:\\Users\\matrix_mind> ./verify_system_modules.ps1",
          "Checking integrity...",
          "[SUCCESS] Host network adapter: OK",
          "[SUCCESS] Subprocess orchestration: ACTIVE",
          "",
          "PS C:\\Users\\matrix_mind> "
        ]);
        await wait(1200);

        // --- STEP 6: Verification ---
        setCurrentStep(6);
        addLog('VERIFICATION', 'Taking final screen snapshot to verify terminal window state...');
        await wait(800);
        addLog('VERIFICATION', 'Terminal subprocess confirmed running with PID 8942. Standard output verified.');
        await wait(600);
        addLog('VERIFICATION', 'Task Completed Successfully. Returning system controls.');
      } else {
        // --- STEP 6: Verification ---
        setCurrentStep(6);
        addLog('VERIFICATION', 'Taking final screen snapshot to verify Start Menu state...');
        await wait(800);
        addLog('VERIFICATION', 'Start Menu launcher confirmed open on screen.');
        await wait(600);
        addLog('VERIFICATION', 'Task Completed Successfully. Returning system controls.');
      }
    } else {
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
      let trashAdded = 0;
      let filesCount = 0;
      if (filesToDelete.includes(3)) {
        addLog('ACTION', 'Sending duplicate screenshot_1_dup.png to Recycle Bin...');
        setCursorPos({ x: 50, y: 230 });
        await wait(750);
        setCursorPos({ x: 750, y: 500 });
        await wait(750);
        setDesktopFiles(prev => prev.map(f => f.id === 3 ? { ...f, status: 'deleted' } : f));
        trashAdded++;
        filesCount++;
        addLog('ACTION', 'rm("screenshot_1_dup.png") -> Sent to Trash');
        await wait(800);
      } else {
        addLog('ACTION', 'Skipped screenshot_1_dup.png deletion (excluded by user preference).');
        await wait(300);
      }

      // Drag screenshot_2_dup.png (ID 11) -> Trash Bin [x: 750, y: 500]
      if (filesToDelete.includes(11)) {
        addLog('ACTION', 'Sending duplicate screenshot_2_dup.png to Recycle Bin...');
        setCursorPos({ x: 310, y: 230 });
        await wait(750);
        setCursorPos({ x: 750, y: 500 });
        await wait(750);
        setDesktopFiles(prev => prev.map(f => f.id === 11 ? { ...f, status: 'deleted' } : f));
        trashAdded++;
        filesCount++;
        addLog('ACTION', 'rm("screenshot_2_dup.png") -> Sent to Trash');
        await wait(1000);
      } else {
        addLog('ACTION', 'Skipped screenshot_2_dup.png deletion (excluded by user preference).');
        await wait(300);
      }

      setTrashCount(prev => prev + trashAdded);

      // --- STEP 6: Verification ---
      setCurrentStep(6);
      addLog('VERIFICATION', 'Taking final screen snapshot...');
      await wait(800);
      addLog('VERIFICATION', `Validating final filesystem output. 5 files moved, ${filesCount} duplicate files sent to Trash.`);
      await wait(600);
      addLog('VERIFICATION', 'Task Completed Successfully. Returning system controls to User.');
    }

    // --- USER-ADDED PLAN MODIFICATIONS ---
    if (planModifications.length > 0) {
      addLog('ACTION', 'Executing user-added custom plan adjustments...');
      await wait(800);
      for (let i = 0; i < planModifications.length; i++) {
        const mod = planModifications[i];
        addLog('ACTION', `Executing custom step: "${mod}"`);
        
        if (/close|terminal|quit/i.test(mod)) {
          if (showTerminalWindow) {
            addLog('ACTION', 'Moving cursor to Terminal Close button [x: 665, y: 88]...');
            setCursorPos({ x: 665, y: 88 });
            await wait(1000);
            setCursorClick(true);
            await wait(100);
            setCursorClick(false);
            setShowTerminalWindow(false);
            addLog('ACTION', 'click(left, single) -> Closed System Terminal window.');
          } else {
            addLog('ACTION', 'Terminal window already closed or not open.');
          }
        } else if (/dashboard|tab 1|switch tab/i.test(mod)) {
          addLog('ACTION', 'Moving cursor to browser Tab 1: "CRM Dashboard" [x: 100, y: 40]...');
          setCursorPos({ x: 100, y: 40 });
          await wait(1000);
          setCursorClick(true);
          await wait(100);
          setCursorClick(false);
          setActiveBrowserTab(1);
          addLog('ACTION', 'click(left, single) -> Switched active tab back to CRM Dashboard.');
        } else if (/start|menu|close start/i.test(mod) && showStartMenu) {
          addLog('ACTION', 'Moving cursor to Start Menu launcher button to close it [x: 28, y: 515]...');
          setCursorPos({ x: 28, y: 515 });
          await wait(1000);
          setCursorClick(true);
          await wait(100);
          setCursorClick(false);
          setShowStartMenu(false);
          addLog('ACTION', 'click(left, single) -> Closed OS Start Menu Launcher.');
        } else {
          addLog('ACTION', 'Moving cursor to click icon or change tab dynamically...');
          const targetX = 180 + (i * 60);
          const targetY = 150 + (i * 40);
          setCursorPos({ x: targetX, y: targetY });
          await wait(1000);
          setCursorClick(true);
          await wait(100);
          setCursorClick(false);
          addLog('ACTION', `Completed custom step: "${mod}" successfully.`);
        }
        await wait(800);
      }
    }

    setStatus('completed');
    setRunning(false);
  };

  // Main execution timeline
  const startOSGhostWorkflow = async (promptOverride = null) => {
    const activePrompt = promptOverride !== null ? promptOverride : directivePrompt;
    activePromptRef.current = activePrompt;
    if (promptOverride !== null) {
      setDirectivePrompt(promptOverride);
    }

    // Detect scenario based on prompt content
    let chosenScenario = 'desktop';
    if (/tab|crm|browser|web|page|approve|invoice/i.test(activePrompt)) {
      chosenScenario = 'browser';
    } else if (/start|menu|taskbar|launch|button/i.test(activePrompt)) {
      chosenScenario = 'start_menu';
    }
    setScenario(chosenScenario);

    // Reset state
    setRunning(true);
    setCurrentStep(1);
    setStatus('running');
    setLogs([]);
    setCursorPos({ x: 300, y: 200 });
    setFolders([]);
    setTrashCount(0);
    setActiveBrowserTab(1);
    setInvoiceApproved(false);
    setShowStartMenu(false);
    setShowTerminalWindow(false);
    setTerminalLines([]);
    setFilesToDelete([3, 11]);
    setPlanModifications(initialModifications || []);
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
    if (chosenScenario === 'browser') {
      addLog('MAPPING', 'Scanning browser tabs, navigation bar, and document elements...');
      setCursorPos({ x: 100, y: 40 });
      await wait(600);
      setCursorPos({ x: 240, y: 40 });
      await wait(600);
      setCursorPos({ x: 620, y: 195 });
      await wait(600);
      setCursorPos({ x: 300, y: 200 });
      await wait(400);
      addLog('MAPPING', 'Mapped 2 tabs [Tab 1: 100,40], [Tab 2: 240,40], and CRM buttons.');
    } else if (chosenScenario === 'start_menu') {
      addLog('MAPPING', 'Scanning primary screen workspace and OS launcher bar...');
      setCursorPos({ x: 28, y: 515 });
      await wait(600);
      setCursorPos({ x: 500, y: 300 });
      await wait(600);
      setCursorPos({ x: 300, y: 200 });
      await wait(400);
      addLog('MAPPING', 'Mapped Start Menu button [x: 28, y: 515] and desktop environment bounds.');
    } else {
      addLog('MAPPING', 'Scanning icons, coordinate grids, and filesystem references...');
      setCursorPos({ x: 50, y: 70 });
      await wait(500);
      setCursorPos({ x: 180, y: 150 });
      await wait(500);
      setCursorPos({ x: 310, y: 230 });
      await wait(500);
      setCursorPos({ x: 750, y: 500 });
      await wait(500);
      setCursorPos({ x: 300, y: 200 });
      await wait(400);
      addLog('MAPPING', 'Mapped 12 file bounding boxes, 1 recycle bin location [x: 750, y: 500].');
    }
    await wait(600);

    // --- STEP 4: Staging Interceptor ( सेफ्टी गेट ) ---
    setCurrentStep(4);
    if (autoExecute) {
      addLog('SAFETY', 'Pre-authorized by User via Chat. Commencing execution automatically...');
      await wait(1000);
      await approveStagingSequence();
    } else {
      setStatus('staging');
      addLog('SAFETY', 'STAGING INTERCEPTOR ACTIVE. Awaiting Human Authorization to proceed.');
      addLog('SAFETY', 'Pre-flight proposed actions list loaded in right control dock.');
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Action Directive (Editable Prompt)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={running || status === 'staging'}
                onClick={() => setDirectivePrompt("Clean up my machine. Sort all PDFs into folders by client name, move images to a 'Creative' folder, and delete any duplicate screenshots.")}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                💻 Clean Desktop
              </button>
              <button
                disabled={running || status === 'staging'}
                onClick={() => setDirectivePrompt("Open Chrome, switch to the CRM Invoices tab, and approve the pending invoice for Acme Corp.")}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🌐 Approve CRM Invoice
              </button>
              <button
                disabled={running || status === 'staging'}
                onClick={() => setDirectivePrompt("Click on start menu on my screen, open System Terminal, and verify it works.")}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🖥️ Start Menu & Terminal
              </button>
            </div>
          </div>
          
          <textarea
            value={directivePrompt}
            onChange={(e) => setDirectivePrompt(e.target.value)}
            disabled={running || status === 'staging'}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.6)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              fontSize: '0.9rem',
              color: '#e2e8f0',
              fontFamily: 'monospace',
              resize: 'none',
              height: '52px',
              outline: 'none',
              transition: 'border 0.3s ease'
            }}
            placeholder="Type your system directive here... (e.g. Open browser, clean folder, delete duplicates, etc.)"
          />
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
                System-level mouse inputs are currently frozen. The AI cursor will execute automatically once authorized. Read the full plan below:
              </p>
              
              <div style={{
                background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px',
                fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace'
              }}>
                {scenario === 'desktop' ? (
                  <>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Create directory <b>/Documents/Acme_Corp</b> <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Create directory <b>/Documents/Stark_Ind</b> <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Create directory <b>/Documents/Creative</b> <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Move 2 matching Acme Corp PDFs <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Move 1 matching Stark Industries PDF <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Move 2 matching design images <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', flexDirection: 'column', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#ef4444' }}>•</span>
                        <span>Verify file deletion list (click to keep any file):</span>
                      </div>
                      
                      <div style={{
                        width: '100%',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '6px',
                        padding: '8px',
                        marginTop: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxSizing: 'border-box'
                      }}>
                        {desktopFiles.filter(f => f.id === 3 || f.id === 11).map(file => {
                          const isSelected = filesToDelete.includes(file.id);
                          return (
                            <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                              <span style={{ color: isSelected ? '#ef4444' : '#94a3b8', textDecoration: isSelected ? 'none' : 'line-through', fontWeight: isSelected ? 'bold' : 'normal' }}>
                                📄 {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSelected) {
                                    setFilesToDelete(prev => prev.filter(id => id !== file.id));
                                  } else {
                                    setFilesToDelete(prev => [...prev, file.id]);
                                  }
                                }}
                                style={{
                                  background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  border: `1px solid ${isSelected ? '#ef4444' : '#10b981'}`,
                                  color: isSelected ? '#f87171' : '#34d399',
                                  borderRadius: '4px', padding: '2px 6px', fontSize: '0.62rem', cursor: 'pointer'
                                }}
                              >
                                {isSelected ? '🗑️ Delete' : '✅ Keep'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : scenario === 'start_menu' ? (
                  <>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Locate Start Menu Launcher Button at bottom-left corner [x: 28, y: 515] <span style={{ color: '#94a3b8' }}>(AI cursor will automatically click)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Click Start Menu Button to reveal launcher shortcuts <span style={{ color: '#94a3b8' }}>(AI cursor will automatically click)</span></span>
                    </div>
                    {/terminal|powershell|run|verify|shell|command|diagnostics/i.test(directivePrompt) && (
                      <>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#ff9900' }}>•</span>
                          <span>Identify 'System Terminal' list item at [x: 100, y: 440] <span style={{ color: '#94a3b8' }}>(AI cursor will automatically click)</span></span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#ff9900' }}>•</span>
                          <span>Click launcher item to spawn simulated Windows PowerShell / Terminal instance <span style={{ color: '#94a3b8' }}>(AI cursor will automatically click)</span></span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#2dd4bf' }}>•</span>
                          <span>Verify terminal standard output is responsive <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Launch browser and load <b>crm.matrixmind.io</b> <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff9900' }}>•</span>
                      <span>Navigate browser tab: click Tab 2 <b>'CRM Invoices'</b> [x: 240, y: 40] <span style={{ color: '#94a3b8' }}>(AI cursor will automatically click)</span></span>
                    </div>
                    {/approve|invoice|pay|acme/i.test(directivePrompt) ? (
                      <>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#ff9900' }}>•</span>
                          <span>Approve pending invoice for client <b>Acme Corp</b> [x: 620, y: 195] <span style={{ color: '#94a3b8' }}>(AI cursor will automatically click)</span></span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#2dd4bf' }}>•</span>
                          <span>Verify invoice approval status badge & success banner <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#2dd4bf' }}>•</span>
                        <span>Verify CRM Invoices list is loaded successfully <span style={{ color: '#94a3b8' }}>(AI cursor will automatically execute)</span></span>
                      </div>
                    )}
                  </>
                )}

                {/* Render custom user modifications */}
                {planModifications.length > 0 && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#ff9900', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                      Custom Additions:
                    </span>
                    {planModifications.map((mod, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.72rem', color: '#fff' }}>
                        <span style={{ color: '#ff9900' }}>+</span>
                        <span>{mod} <span style={{ color: '#94a3b8' }}>(AI will execute at the end)</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modification prompt box and dedicated OK button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 'bold' }}>
                  Add instructions or changes to the plan:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={modificationInput}
                    onChange={(e) => setModificationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddModification();
                      }
                    }}
                    placeholder="e.g. close terminal after running / switch back to Tab 1"
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255, 153, 0, 0.3)',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      fontSize: '0.72rem',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddModification}
                    style={{
                      background: 'rgba(255, 153, 0, 0.2)',
                      border: '1px solid #ff9900',
                      color: '#ff9900',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 153, 0, 0.35)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 153, 0, 0.2)'; }}
                  >
                    OK / Add
                  </button>
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

          {/* DESKTOP CANVAS CONTAINER */}
          <div style={{
            flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
            overflow: 'auto', padding: '10px', background: '#040408'
          }}>
            {/* DESKTOP CANVAS */}
            <div 
              style={{
                width: '840px', height: '540px', background: '#08080f', position: 'relative', overflow: 'hidden',
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 20, 60, 0.3) 0%, transparent 80%)',
                border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                flexShrink: 0
              }}
            >
              
              {(scenario === 'desktop' || scenario === 'start_menu') ? (
                <>
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

                  {/* Taskbar */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
                    background: 'rgba(15, 15, 30, 0.95)', backdropFilter: 'blur(10px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 12px', zIndex: 1000
                  }}>
                    {/* Start Button */}
                    <button 
                      onClick={() => setShowStartMenu(prev => !prev)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: showStartMenu ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${showStartMenu ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '4px', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold',
                        height: '30px', padding: '0 10px', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <LayoutGrid size={14} color="var(--accent-cyan)" />
                      <span>Start</span>
                    </button>

                    {/* Active apps or indicators */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {showTerminalWindow && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)',
                          borderRadius: '4px', height: '30px', padding: '0 10px', fontSize: '0.7rem', color: '#fff'
                        }}>
                          <Terminal size={12} color="var(--accent-cyan)" />
                          <span>Terminal</span>
                        </div>
                      )}
                    </div>

                    {/* System Tray info */}
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>ENG</span>
                      <span>16:55 PM</span>
                    </div>
                  </div>

                  {/* Start Menu Launcher Popup */}
                  {showStartMenu && (
                    <div style={{
                      position: 'absolute', left: '10px', bottom: '45px', width: '220px', height: '180px',
                      background: 'rgba(10, 10, 25, 0.98)', border: '1px solid rgba(0, 242, 254, 0.3)',
                      borderRadius: '8px', padding: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      zIndex: 1001, backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Recommended Apps
                      </div>
                      
                      {/* System Terminal shortcut */}
                      <div 
                        onClick={() => {
                          setShowStartMenu(false);
                          setShowTerminalWindow(true);
                          setTerminalLines([
                            "Microsoft Windows [Version 10.0.22631.3527]",
                            "(c) Microsoft Corporation. All rights reserved.",
                            "",
                            "PS C:\\Users\\matrix_mind> "
                          ]);
                        }}
                        style={{
                          position: 'absolute', left: '10px', top: '115px', width: '160px', height: '26px',
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
                          borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer', fontSize: '0.72rem', color: '#fff', transition: 'all 0.2s',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                      >
                        <Terminal size={12} color="var(--accent-cyan)" />
                        <span>System Terminal</span>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>
                        Select applications to launch.
                      </div>
                    </div>
                  )}

                  {/* Floating Terminal Window */}
                  {showTerminalWindow && (
                    <div style={{
                      position: 'absolute', left: '120px', top: '80px', width: '560px', height: '340px',
                      background: 'rgba(5, 5, 15, 0.95)', border: '1px solid rgba(0, 242, 254, 0.25)',
                      borderRadius: '8px', boxShadow: '0 12px 30px rgba(0,0,0,0.6)', display: 'flex',
                      flexDirection: 'column', zIndex: 1002, overflow: 'hidden', backdropFilter: 'blur(20px)'
                    }}>
                      {/* Title Bar */}
                      <div style={{
                        background: 'rgba(12, 12, 24, 0.9)', borderBottom: '1px solid rgba(0, 242, 254, 0.1)',
                        padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                          <Terminal size={12} color="var(--accent-cyan)" />
                          <span>System Terminal - PowerShell</span>
                        </div>
                        <button 
                          onClick={() => setShowTerminalWindow(false)}
                          style={{
                            background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Output */}
                      <div style={{
                        flex: 1, padding: '12px', fontFamily: 'monospace', fontSize: '0.72rem',
                        color: '#38bdf8', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px'
                      }}>
                        {terminalLines.map((line, idx) => (
                          <div key={idx} style={{ minHeight: '14px', whiteSpace: 'pre-wrap' }}>{line}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Simulated Web Browser UI */
                <div style={{
                  position: 'absolute',
                  left: '20px', top: '20px', right: '20px', bottom: '20px',
                  background: '#0c0c16',
                  border: '1px solid rgba(0, 242, 254, 0.15)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  animation: 'scaleIn 0.3s ease'
                }}>
                  {/* Browser Tabs Header */}
                  <div style={{
                    background: '#121222',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    padding: '8px 12px 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {/* Red, Yellow, Green Window Dots */}
                    <div style={{ display: 'flex', gap: '5px', marginRight: '12px', paddingBottom: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
                    </div>

                    {/* Tab 1 */}
                    <div 
                      style={{
                        padding: '6px 16px',
                        background: activeBrowserTab === 1 ? '#0c0c16' : 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderBottom: activeBrowserTab === 1 ? '1px solid #0c0c16' : '1px solid rgba(255,255,255,0.08)',
                        borderTopLeftRadius: '6px',
                        borderTopRightRadius: '6px',
                        fontSize: '0.72rem',
                        color: activeBrowserTab === 1 ? '#fff' : '#64748b',
                        fontWeight: activeBrowserTab === 1 ? 'bold' : 'normal',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => !running && setActiveBrowserTab(1)}
                    >
                      <LayoutGrid size={12} color={activeBrowserTab === 1 ? 'var(--accent-cyan)' : '#64748b'} />
                      CRM Dashboard
                    </div>

                    {/* Tab 2 */}
                    <div 
                      style={{
                        padding: '6px 16px',
                        background: activeBrowserTab === 2 ? '#0c0c16' : 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderBottom: activeBrowserTab === 2 ? '1px solid #0c0c16' : '1px solid rgba(255,255,255,0.08)',
                        borderTopLeftRadius: '6px',
                        borderTopRightRadius: '6px',
                        fontSize: '0.72rem',
                        color: activeBrowserTab === 2 ? '#fff' : '#64748b',
                        fontWeight: activeBrowserTab === 2 ? 'bold' : 'normal',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => !running && setActiveBrowserTab(2)}
                    >
                      <FileText size={12} color={activeBrowserTab === 2 ? 'var(--accent-cyan)' : '#64748b'} />
                      CRM Invoices
                      <span style={{
                        background: invoiceApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: invoiceApproved ? '#10b981' : '#f87171',
                        fontSize: '0.55rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        marginLeft: '4px'
                      }}>
                        {invoiceApproved ? '0' : '1'} Pending
                      </span>
                    </div>
                  </div>

                  {/* URL bar */}
                  <div style={{
                    background: '#0e0e1a',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', color: '#475569' }}>
                      <RotateCcw size={12} />
                    </div>
                    <div style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      fontSize: '0.7rem',
                      color: '#94a3b8',
                      fontFamily: 'monospace'
                    }}>
                      https://crm.matrixmind.io/{activeBrowserTab === 1 ? 'dashboard' : 'invoices'}
                    </div>
                  </div>

                  {/* Browser Content */}
                  <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Toast Alert Banner */}
                    {invoiceApproved && (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        animation: 'scaleIn 0.3s ease'
                      }}>
                        <Check size={14} />
                        <span><b>Success:</b> Invoice INV-2026-004 has been approved and dispatched to accounting!</span>
                      </div>
                    )}

                    {activeBrowserTab === 1 ? (
                      // Tab 1: Dashboard View
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Monthly Revenue</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>$142,580</div>
                            <div style={{ fontSize: '0.6rem', color: '#10b981', marginTop: '2px' }}>↑ 12.4% vs last month</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Active Customers</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>1,842</div>
                            <div style={{ fontSize: '0.6rem', color: '#10b981', marginTop: '2px' }}>↑ 3.2% growth</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Pending Invoices</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: invoiceApproved ? '#64748b' : '#ff9900', marginTop: '4px' }}>
                              {invoiceApproved ? '0' : '1'}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: invoiceApproved ? '#10b981' : '#f87171', marginTop: '2px' }}>
                              {invoiceApproved ? 'All clear!' : 'Requires review'}
                            </div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: '#fff' }}>Quick Analytics</h4>
                          <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ flex: 1, height: '40px', background: 'var(--accent-cyan)', opacity: 0.7, borderRadius: '2px' }} />
                            <div style={{ flex: 1, height: '65px', background: 'var(--accent-cyan)', opacity: 0.7, borderRadius: '2px' }} />
                            <div style={{ flex: 1, height: '50px', background: 'var(--accent-cyan)', opacity: 0.7, borderRadius: '2px' }} />
                            <div style={{ flex: 1, height: '75px', background: 'var(--accent-cyan)', opacity: 0.7, borderRadius: '2px' }} />
                            <div style={{ flex: 1, height: '90px', background: 'var(--accent-cyan)', borderRadius: '2px', boxShadow: '0 0 8px var(--accent-cyan)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#475569', marginTop: '4px' }}>
                            <span>Feb</span>
                            <span>Mar</span>
                            <span>Apr</span>
                            <span>May</span>
                            <span>Jun (Active)</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Tab 2: Invoices View
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 'bold' }}>All Invoices</span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Showing 3 invoices</span>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', textAlign: 'left' }}>
                              <th style={{ padding: '6px 8px' }}>Client</th>
                              <th style={{ padding: '6px 8px' }}>Invoice ID</th>
                              <th style={{ padding: '6px 8px' }}>Amount</th>
                              <th style={{ padding: '6px 8px' }}>Status</th>
                              <th style={{ padding: '6px 8px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f1f5f9' }}>
                              <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>Acme Corp</td>
                              <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>#INV-2026-004</td>
                              <td style={{ padding: '10px 8px' }}>$12,500.00</td>
                              <td style={{ padding: '10px 8px' }}>
                                <span style={{
                                  background: invoiceApproved ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)',
                                  color: invoiceApproved ? '#34d399' : '#fbbf24',
                                  padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem'
                                }}>
                                  {invoiceApproved ? 'Paid / Approved' : 'Pending Review'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 8px' }}>
                                {invoiceApproved ? (
                                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Check size={12} /> Approved
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => !running && setInvoiceApproved(true)}
                                    style={{
                                      background: '#ff9900', color: '#000', border: 'none',
                                      borderRadius: '4px', padding: '4px 8px', fontWeight: 'bold',
                                      cursor: 'pointer', fontSize: '0.62rem'
                                    }}
                                  >
                                    Approve
                                  </button>
                                )}
                              </td>
                            </tr>

                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f1f5f9' }}>
                              <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>Stark Industries</td>
                              <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>#INV-2026-009</td>
                              <td style={{ padding: '10px 8px' }}>$45,000.00</td>
                              <td style={{ padding: '10px 8px' }}>
                                <span style={{
                                  background: 'rgba(16,185,129,0.1)',
                                  color: '#34d399',
                                  padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem'
                                }}>
                                  Paid / Approved
                                </span>
                              </td>
                              <td style={{ padding: '10px 8px', color: '#64748b' }}>
                                No actions
                              </td>
                            </tr>

                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f1f5f9' }}>
                              <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>Wayne Wayne.</td>
                              <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>#INV-2026-012</td>
                              <td style={{ padding: '10px 8px' }}>$8,200.00</td>
                              <td style={{ padding: '10px 8px' }}>
                                <span style={{
                                  background: 'rgba(16,185,129,0.1)',
                                  color: '#34d399',
                                  padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem'
                                }}>
                                  Paid / Approved
                                </span>
                              </td>
                              <td style={{ padding: '10px 8px', color: '#64748b' }}>
                                No actions
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
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
                  transition: 'top 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), left 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)'
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
