import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Plus, Search, Trash2, Send, Mic, Paperclip, 
  Camera, FileText, Image, Download, RotateCcw, ShieldCheck, 
  BrainCircuit, LayoutGrid, Terminal, HelpCircle, Check, Info, LogOut, Shield, Users, Cpu, Play, Loader2, Code, MonitorPlay, Share2
} from 'lucide-react';
import mermaid from 'mermaid';
import CouncilRoom from './CouncilRoom';
import WorkflowPanel from './WorkflowPanel';
import KnowledgeGraph from './KnowledgeGraph';

// Initialize Mermaid.js configuration
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      background: '#0c152b',
      primaryColor: '#00f2fe',
      primaryTextColor: '#f1f5f9',
      lineColor: '#4facfe'
    }
  });
} catch (e) {
  console.error('Mermaid init error:', e);
}

// Mermaid Chart Renderer Component
function MermaidChart({ chartCode }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const elementId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const renderChart = async () => {
      try {
        setError(false);
        // Clear any previous graphs
        const { svg: renderedSvg } = await mermaid.render(elementId, chartCode);
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid render failure:', err);
        setError(true);
        // Clean up elements that mermaid leaves on error
        const badElement = document.getElementById(elementId);
        if (badElement) badElement.remove();
      }
    };
    renderChart();
  }, [chartCode]);

  if (error) {
    return (
      <pre style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', padding: '10px' }}>
        <code>{chartCode}</code>
      </pre>
    );
  }

  return (
    <div 
      className="mermaid-graph-container" 
      style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px', margin: '15px 0', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}

// ==================== INTERVIEW MODE FORM WIDGET ====================
function InterviewFormWidget({ message, currentUser, conversations, activeChatId, saveChatsToLocal, personality, refreshUserStatus }) {
  const [selections, setSelections] = useState(() => {
    const init = {};
    message.questions.forEach(q => {
      if (q.type === 'checkbox') {
        init[q.id] = [];
      } else {
        init[q.id] = q.options && q.options.length > 0 ? q.options[0] : '';
      }
    });
    return init;
  });

  const [loading, setLoading] = useState(false);

  const handleValueChange = (qid, val) => {
    if (message.submitted) return;
    setSelections(prev => ({ ...prev, [qid]: val }));
  };

  const handleCheckboxChange = (qid, option, checked) => {
    if (message.submitted) return;
    setSelections(prev => {
      const current = prev[qid] || [];
      const updated = checked 
        ? [...current, option]
        : current.filter(o => o !== option);
      return { ...prev, [qid]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || message.submitted) return;
    setLoading(true);

    const answersList = message.questions.map(q => ({
      label: q.label,
      selection: selections[q.id]
    }));

    try {
      // Find history up to this interview point to maintain context
      const currentChat = conversations.find(c => c.id === activeChatId);
      let history = [];
      if (currentChat) {
        const messageIndex = currentChat.messages.findIndex(m => m.id === message.id);
        if (messageIndex > -1) {
          history = currentChat.messages.slice(0, messageIndex).map(m => ({ sender: m.sender, text: m.text || '' }));
        }
      }

      const res = await fetch('/api/chat/interview/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          originalPrompt: message.originalPrompt,
          answers: answersList,
          history: history,
          personality: personality
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const currentChat = conversations.find(c => c.id === activeChatId);
        if (!currentChat) return;

        const summaryText = `🔧 **Diagnostic Parameters Selected:**\n` + 
          answersList.map(a => `- ${a.label}: *${Array.isArray(a.selection) ? a.selection.join(', ') : a.selection}*`).join('\n');

        const userSummaryMsg = {
          id: 'msg_user_param_' + Date.now(),
          sender: 'user',
          text: summaryText,
          timestamp: new Date().toISOString()
        };

        const botResponseMsg = {
          id: 'msg_bot_' + Date.now(),
          sender: 'bot',
          text: data.response,
          timestamp: new Date().toISOString()
        };

        // Update the form message and append new messages
        const updatedMessages = currentChat.messages.map(m => {
          if (m.id === message.id) {
            return { ...m, submitted: true, submittedAnswers: answersList };
          }
          return m;
        });

        const finalMessages = [...updatedMessages, userSummaryMsg, botResponseMsg];

        const updatedChatList = conversations.map(c => {
          if (c.id === activeChatId) {
            return { ...c, messages: finalMessages };
          }
          return c;
        });

        saveChatsToLocal(updatedChatList);
        refreshUserStatus();
      } else {
        alert(data.message || 'Failed to submit parameters.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#bd93f9', fontWeight: 600, fontSize: '0.9rem' }}>
        <Sparkles size={16} />
        <span>Diagnostic Form — Interview Mode</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {message.questions.map((q) => (
          <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>{q.label}</label>
            
            {/* Dropdown Select */}
            {q.type === 'select' && (
              <select
                disabled={message.submitted || loading}
                value={selections[q.id]}
                onChange={(e) => handleValueChange(q.id, e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {q.options.map(opt => (
                  <option key={opt} value={opt} style={{ background: '#0f0f1e', color: '#fff' }}>{opt}</option>
                ))}
              </select>
            )}

            {/* Checkbox Group */}
            {q.type === 'checkbox' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                {q.options.map(opt => {
                  const isChecked = selections[q.id]?.includes(opt);
                  return (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        disabled={message.submitted || loading}
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(q.id, opt, e.target.checked)}
                        style={{ accentColor: '#ff79c6' }}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Radio Button Group */}
            {q.type === 'radio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                {q.options.map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name={`radio_${message.id}_${q.id}`}
                      disabled={message.submitted || loading}
                      checked={selections[q.id] === opt}
                      onChange={() => handleValueChange(q.id, opt)}
                      style={{ accentColor: '#ff79c6' }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {!message.submitted ? (
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #ff79c6, #bd93f9)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              boxShadow: '0 4px 12px rgba(253, 121, 198, 0.25)'
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>{loading ? 'Compiling Parameters...' : 'Submit Parameters'}</span>
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: '#a3e635',
            fontWeight: 700,
            marginTop: '4px',
            background: 'rgba(163,230,53,0.08)',
            border: '1px solid rgba(163,230,53,0.15)',
            padding: '6px 10px',
            borderRadius: '6px'
          }}>
            <Check size={14} />
            <span>Parameters Submitted successfully!</span>
          </div>
        )}
      </form>
    </div>
  );
}

function Dashboard({ 
  currentUser, 
  userPlanDetails, 
  refreshUserStatus, 
  onLogout, 
  theme, 
  setTheme, 
  onTriggerUpgrade,
  onShowAdmin,
  onShowHelp
}) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  
  // Search bar for filtering chats
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Prompt states
  const [promptInput, setPromptInput] = useState('');
  const [personality, setPersonality] = useState('standard'); // 'standard', 'architect', 'analyst'
  const [mode, setMode] = useState('normal'); // 'normal', 'matrix_simulation', 'optimize', 'generate'
  const [loading, setLoading] = useState(false);
  const [livePreviewApp, setLivePreviewApp] = useState(null);
  const [isGraphMode, setIsGraphMode] = useState(false);
  const [graphData, setGraphData] = useState(null);

  // App Credentials State for Generate Mode
  const [showCredentials, setShowCredentials] = useState(false);
  const [appCredentials, setAppCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem('appCredentials');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const handleAddCredentialRow = () => {
    setAppCredentials([...appCredentials, { name: '', value: '' }]);
  };

  const handleCredentialChange = (index, field, val) => {
    const updated = [...appCredentials];
    updated[index][field] = val;
    setAppCredentials(updated);
  };

  const handleRemoveCredentialRow = (index) => {
    const updated = [...appCredentials];
    updated.splice(index, 1);
    setAppCredentials(updated);
  };

  const handleSaveCredentials = () => {
    localStorage.setItem('appCredentials', JSON.stringify(appCredentials));
    alert('Credentials saved securely to your local browser storage.');
  };
  const handleShareApp = async (htmlContent) => {
    try {
      const res = await fetch('/api/apps/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlCode: htmlContent })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const fullUrl = window.location.origin + data.url;
        navigator.clipboard.writeText(fullUrl);
        alert(`App hosted locally!\nLink: ${fullUrl}\n(Copied to clipboard)`);
      } else {
        alert('Failed to host app: ' + data.error);
      }
    } catch (err) {
      alert('Error hosting app locally.');
    }
  };

  // Anonymize Input feature
  const [anonymizeEnabled, setAnonymizeEnabled] = useState(false);
  const anonymizeMapRef = useRef({});

  // Council Room state (desktop only)
  const [councilMode, setCouncilMode] = useState(false);
  const [councilPrompt, setCouncilPrompt] = useState('');
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 1024;

  // Interview Mode state
  const [interviewModeActive, setInterviewModeActive] = useState(false);



  const handleCallCouncil = () => {
    if (!promptInput.trim()) return;
    setCouncilPrompt(promptInput);
    setCouncilMode(true);
  };

  const handleCouncilConsensus = (consensusText) => {
    // Inject consensus result into the active chat as a bot message
    const currentChat = conversations.find(c => c.id === activeChatId);
    if (!currentChat) return;

    const councilMsg = {
      id: 'msg_council_' + Date.now(),
      sender: 'bot',
      text: `🏛️ **Council Room — Consensus Decision**\n\n${consensusText}`,
      timestamp: new Date().toISOString()
    };

    const updated = conversations.map(c => {
      if (c.id === activeChatId) return { ...c, messages: [...c.messages, councilMsg] };
      return c;
    });
    saveChatsToLocal(updated);
    setPromptInput('');
  };

  // Workflow Sequencer states
  const [workflowMode, setWorkflowMode] = useState(false);
  const [workflowGoal, setWorkflowGoal] = useState('');

  const handleCallWorkflow = () => {
    if (!promptInput.trim()) return;
    setWorkflowGoal(promptInput);
    setWorkflowMode(true);
  };

  const handleWorkflowComplete = (finalReport) => {
    const currentChat = conversations.find(c => c.id === activeChatId);
    if (!currentChat) return;

    const workflowMsg = {
      id: 'msg_workflow_' + Date.now(),
      sender: 'bot',
      text: `⚙️ **Workflow Execution — Final Report**\n\n${finalReport}`,
      timestamp: new Date().toISOString()
    };

    const updated = conversations.map(c => {
      if (c.id === activeChatId) return { ...c, messages: [...c.messages, workflowMsg] };
      return c;
    });
    saveChatsToLocal(updated);
    setPromptInput('');
  };

  // Anonymize: scan text and replace sensitive data with labels
  const anonymizeText = (text) => {
    const map = {};
    let counter = { email: 0, phone: 0, apikey: 0, ip: 0, upi: 0, name: 0 };
    let result = text;

    // Emails
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => {
      counter.email++;
      const label = `[REDACTED_EMAIL_${counter.email}]`;
      map[label] = match;
      return label;
    });

    // Phone numbers (Indian & international formats)
    result = result.replace(/(\+?\d{1,4}[\s-]?)?(\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}/g, (match) => {
      if (match.replace(/[\s\-()]/g, '').length >= 10) {
        counter.phone++;
        const label = `[REDACTED_PHONE_${counter.phone}]`;
        map[label] = match;
        return label;
      }
      return match;
    });

    // API keys / tokens (long alphanumeric strings 20+ chars)
    result = result.replace(/\b[A-Za-z0-9_\-]{20,}\b/g, (match) => {
      // Skip if it looks like a normal word or URL path
      if (/^[a-z]+$/i.test(match)) return match;
      if (match.length < 24) return match;
      counter.apikey++;
      const label = `[REDACTED_KEY_${counter.apikey}]`;
      map[label] = match;
      return label;
    });

    // IP addresses
    result = result.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, (match) => {
      counter.ip++;
      const label = `[REDACTED_IP_${counter.ip}]`;
      map[label] = match;
      return label;
    });

    // UPI IDs
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-z]{2,}bank\b/gi, (match) => {
      counter.upi++;
      const label = `[REDACTED_UPI_${counter.upi}]`;
      map[label] = match;
      return label;
    });

    return { anonymized: result, map };
  };

  // De-anonymize: replace labels back with original values
  const deanonymizeText = (text, map) => {
    let result = text;
    for (const [label, original] of Object.entries(map)) {
      result = result.split(label).join(original);
    }
    return result;
  };

  // Attachment states
  const [attachment, setAttachment] = useState(null); // { name: '', mimeType: '', base64: '' }
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Camera capture modal state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Bottom scroll Ref
  const messagesEndRef = useRef(null);

  // 1. Fetch Local Chat History on Mount
  useEffect(() => {
    const savedChats = localStorage.getItem(`chats_${currentUser.email}`);
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveChatId(parsed[0].id);
        }
      } catch (e) {
        console.error('Corrupted chat history, resetting:', e);
        localStorage.removeItem(`chats_${currentUser.email}`);
      }
    } else {
      // Start a welcome conversation automatically
      const welcomeMessage = { id: Date.now(), sender: 'model', text: 'Welcome to MatrixMind! How can I assist you today?' };
      const initialChat = {
        id: 'chat_' + Date.now(),
        title: 'New Conversation Topic',
        messages: [welcomeMessage],
        personality: 'standard',
        created_at: new Date().toISOString()
      };
      setConversations([initialChat]);
      setActiveChatId(initialChat.id);
      localStorage.setItem(`chats_${currentUser.email}`, JSON.stringify([initialChat]));
    }
  }, [currentUser.email]);

  // Sync scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatId]);

  // 2. Local Chat CRUD Operations
  const saveChatsToLocal = (updatedChats) => {
    setConversations(updatedChats);
    localStorage.setItem(`chats_${currentUser.email}`, JSON.stringify(updatedChats));
  };

  const handleCreateChat = () => {
    const welcomeMessage = { id: Date.now(), sender: 'model', text: 'Welcome to MatrixMind! How can I assist you today?' };
    const newChat = {
      id: 'chat_' + Date.now(),
      title: 'New Conversation',
      messages: [welcomeMessage],
      personality: personality,
      created_at: new Date().toISOString()
    };
    const updated = [newChat, ...conversations];
    saveChatsToLocal(updated);
    setActiveChatId(newChat.id);
  };

  const handleDeleteChat = (id, e) => {
    e.stopPropagation();
    if (conversations.length <= 1) return; // Prevent deleting the only chat

    const updated = conversations.filter(c => c.id !== id);
    saveChatsToLocal(updated);
    
    if (activeChatId === id) {
      setActiveChatId(updated[0].id);
    }
  };

  const handleEraseChatMemory = () => {
    if (!activeChatId) return;
    const confirmErase = window.confirm('Are you sure you want to clear the memory of this chat? This will remove all previous context.');
    if (!confirmErase) return;

    const updated = conversations.map(c => {
      if (c.id === activeChatId) {
        return { ...c, messages: [] };
      }
      return c;
    });
    saveChatsToLocal(updated);
  };

  const handleDownloadChat = () => {
    const activeChat = conversations.find(c => c.id === activeChatId);
    if (!activeChat || activeChat.messages.length === 0) return;

    let docContent = `Chat Title: ${activeChat.title}\nDate: ${new Date(activeChat.created_at).toLocaleDateString()}\n`;
    docContent += `Personality Profile: ${activeChat.personality.toUpperCase()}\n`;
    docContent += `=========================================\n\n`;

    activeChat.messages.forEach((m, idx) => {
      const senderName = m.sender === 'user' ? 'USER' : 'MATRIXMIND BOT';
      docContent += `[${senderName}] - ${new Date(m.timestamp || Date.now()).toLocaleTimeString()}\n`;
      docContent += `${m.text}\n\n`;
    });

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeChat.title.replace(/\s+/g, '_')}_chat_history.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. VOICE SPEECH TRANSCRIPTION ENGINE
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US'; // standard fallback, works nicely with Hinglish in modern Chromium browsers

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPromptInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      rec.onerror = (e) => {
        console.error('Voice recognition error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported on your browser. Please use Chrome or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // 4. ATTACHMENTS (Camera capture & File Browse)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setShowAttachmentMenu(false);
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          mimeType: file.type,
          base64: reader.result
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'text/plain' || file.type === 'application/pdf') {
      // For documents, we convert text or attach details
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          mimeType: file.type,
          base64: reader.result // Encode full base64 or pass content
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert('Unsupported file format. Please attach images (.png, .jpg) or documents (.txt, .pdf).');
    }
  };

  const startCamera = async () => {
    setShowAttachmentMenu(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.error('Camera access denied:', e);
      alert('Could not access camera. Please check your browser permissions.');
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg');

    setAttachment({
      name: 'cam_snapshot_' + Date.now() + '.jpg',
      mimeType: 'image/jpeg',
      base64
    });

    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  // 5. CHAT GENERATION DISPATCH
  const handleSendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || promptInput;
    if (!textToSend.trim() && !attachment) return;
    if (loading) return;

    // Check Plan limitations locally before calling backend
    if (userPlanDetails) {
      if (Number(userPlanDetails.limit) !== -1 && userPlanDetails.promptsUsed >= userPlanDetails.limit) {
        onTriggerUpgrade();
        return;
      }
    }

    const currentChat = conversations.find(c => c.id === activeChatId);
    if (!currentChat) return;

    // Store original raw input (what user sees in their chat bubble)
    const originalRawInput = textToSend;

    // Prepare the message that will be SENT to the server
    let messageForServer = textToSend;
    let activeAnonymizeMap = {};

    // Anonymize if enabled — masking runs locally in the browser before any data leaves
    if (anonymizeEnabled) {
      try {
        const trackRes = await fetch('/api/feature/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, feature: 'masking' })
        });
        const trackData = await trackRes.json();
        if (!trackRes.ok) {
          setLoading(false);
          onTriggerUpgrade();
          alert(trackData.message || 'Daily limit reached for Data Masking. Please upgrade.');
          return;
        }
      } catch (e) {
        console.warn('Failed to track masking feature limit:', e);
      }

      const { anonymized, map } = anonymizeText(textToSend);
      messageForServer = anonymized; // This is what goes over the internet
      activeAnonymizeMap = map;       // Translation map stays in browser memory only
      anonymizeMapRef.current = map;
      console.log('[ANONYMIZE] Local masking applied. Items masked:', Object.keys(map).length);
    }
    const activeAttachment = attachment;

    // Append user message immediately to local state — user sees their ORIGINAL text
    const userMsg = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: originalRawInput, // User always sees their raw, unmasked input
      attachment: activeAttachment ? { name: activeAttachment.name, mimeType: activeAttachment.mimeType, base64: activeAttachment.base64 } : null,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...currentChat.messages, userMsg];
    
    // Use placeholder title initially — smart title will be generated after bot responds
    let chatTitle = currentChat.title;
    if (currentChat.messages.length === 0) {
      chatTitle = originalRawInput.substring(0, 40) + (originalRawInput.length > 40 ? '...' : '');
    }

    const updatedChatList = conversations.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          title: chatTitle,
          messages: updatedMessages,
          personality: personality
        };
      }
      return c;
    });

    saveChatsToLocal(updatedChatList);
    setPromptInput('');
    setAttachment(null);
    setLoading(true);

    if (interviewModeActive) {
      try {
        const interviewStartRes = await fetch('/api/chat/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            message: messageForServer,
            personality: personality
          })
        });

        const startData = await interviewStartRes.json();
        
        if (interviewStartRes.ok && startData.success) {
          const botMsg = {
            id: 'msg_bot_interview_' + Date.now(),
            sender: 'bot',
            type: 'interview_form',
            text: 'I need to clarify some details before generating the solution. Please complete the diagnostic questions below:',
            questions: startData.questions,
            originalPrompt: originalRawInput,
            submitted: false,
            timestamp: new Date().toISOString()
          };

          const finalChatList = conversations.map(c => {
            if (c.id === activeChatId) {
              return {
                ...c,
                messages: [...updatedMessages, botMsg]
              };
            }
            return c;
          });

          saveChatsToLocal(finalChatList);
          setInterviewModeActive(false);
        } else {
          alert(`Error initializing Interview Mode: ${startData.message || 'Server error.'}`);
        }
      } catch (err) {
        console.error(err);
        alert('Network error initiating Interview Mode.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          message: messageForServer, // MASKED version sent over the internet
          history: currentChat.messages.slice(-10),
          personality: personality,
          mode: mode,
          attachment: activeAttachment,
          appCredentials: mode === 'generate' ? appCredentials : [],
          isGraphRequest: isGraphMode
        })
      });

      const responseData = await chatRes.json();
      
      if (chatRes.ok) {
        let botResponseText = responseData.response;

        // De-anonymize bot response if anonymize was used
        if (anonymizeEnabled && Object.keys(activeAnonymizeMap).length > 0) {
          botResponseText = deanonymizeText(botResponseText, activeAnonymizeMap);
        }

        if (isGraphMode) {
          setGraphData(botResponseText);
          botResponseText = "✅ **Knowledge Graph Generated!** The canvas has been updated on the right panel.";
        }

        // PPT GENERATION: Detect if user asked for a presentation
        const isPPTRequest = /\b(presentation|ppt|powerpoint|pptx|slides)\b/i.test(originalRawInput) && 
                             /\b(create|make|generate|build|prepare|design)\b/i.test(originalRawInput);
        
        if (isPPTRequest) {
          try {
            // Extract slide count from user message
            const countMatch = originalRawInput.match(/(\d+)\s*(slide|page|ppt)/i);
            const pageCount = countMatch ? parseInt(countMatch[1]) : 8;
            
            // Detect style preference
            let style = 'balanced';
            if (/more\s*visual|image|picture|graphic/i.test(originalRawInput)) style = 'visual';
            if (/more\s*text|detailed|content|heavy/i.test(originalRawInput)) style = 'text-heavy';

            botResponseText += '\n\n⏳ **Generating your PowerPoint presentation...** Please wait.';
            
            // Show intermediate message
            const tempMsg = {
              id: 'msg_bot_' + Date.now(),
              sender: 'bot',
              text: botResponseText,
              timestamp: new Date().toISOString()
            };
            const tempChatList = conversations.map(c => {
              if (c.id === activeChatId) return { ...c, messages: [...updatedMessages, tempMsg] };
              return c;
            });
            saveChatsToLocal(tempChatList);

                // Extract clean topic name from the user message
                let cleanTopic = originalRawInput
                  .replace(/\b(create|make|generate|build|prepare|design|give|write|draft)\b/gi, '')
                  .replace(/\b(a|an|the|my|me|please|can you|could you|i want|i need)\b/gi, '')
                  .replace(/\b(presentation|ppt|powerpoint|pptx|slides?)\b/gi, '')
                  .replace(/\b(on|about|for|regarding|related to|based on|of|with)\b/gi, '')
                  .replace(/\b(more|visuals?|texts?|images?|detailed|professional|beautiful|attractive)\b/gi, '')
                  .replace(/\b(pages?|number|both)\b/gi, '')
                  .replace(/\d+\s*(slide|page)/gi, '')
                  .replace(/\s+/g, ' ')
                  .trim();
                if (cleanTopic.length < 3) cleanTopic = originalRawInput.substring(0, 80);

                const pptRes = await fetch('/api/generate-ppt', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: currentUser.email,
                    topic: cleanTopic,
                pageCount,
                style
              })
            });

            const pptData = await pptRes.json();
            
            if (pptRes.ok && pptData.success) {
              botResponseText += `\n\n✅ **Your presentation is ready!** (${pptData.slideCount} slides)\n\n📥 [**Click here to download your PPT**](${pptData.downloadUrl})\n\n*File: ${pptData.fileName}*`;
            } else if (pptData.error === 'FEATURE_LIMIT') {
              botResponseText += `\n\n🔒 **PPT daily limit reached!** ${pptData.message}\n\nUpgrade your plan for more PPT generations per day.`;
            } else {
              botResponseText += `\n\n⚠️ PPT generation failed: ${pptData.message || pptData.error || 'Unknown error'}. You can still use the information above to create your presentation manually.`;
            }
          } catch (pptErr) {
            console.error('PPT generation error:', pptErr);
            botResponseText += '\n\n⚠️ Could not generate PPT file. Please try again.';
          }
        }

        const botMsg = {
          id: 'msg_bot_' + Date.now(),
          sender: 'bot',
          text: botResponseText,
          timestamp: new Date().toISOString()
        };

        const finalChatList = conversations.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: [...updatedMessages, botMsg]
            };
          }
          return c;
        });

        // AUTO-DOWNLOAD ZIP FOR APP GENERATION
        if (mode === 'generate') {
          const blockRegex = /```html\s*\n([\s\S]*?)```/;
          const match = blockRegex.exec(botResponseText);
          if (match && match[1]) {
            const htmlCode = match[1].trim();
            setLivePreviewApp(htmlCode); // Auto-open live preview
            try {
              Promise.all([
                import('jszip'),
                import('file-saver')
              ]).then(([JSZipModule, FileSaverModule]) => {
                const JSZip = JSZipModule.default;
                const saveAs = FileSaverModule.saveAs;
                const zip = new JSZip();
                zip.file("index.html", htmlCode);
                zip.generateAsync({ type: "blob" }).then((content) => {
                  saveAs(content, "MatrixMind_GeneratedApp.zip");
                });
              }).catch(err => console.error("Auto-zip module load failed", err));
            } catch (err) {
              console.error("Auto-zip failed", err);
            }
          }
        }

        saveChatsToLocal(finalChatList);
        refreshUserStatus(); // Refresh daily counts

        // Generate smart AI title for the chat (only for first message in this chat)
        if (currentChat.messages.length === 0 || currentChat.title.startsWith('New Conversation')) {
          try {
            const titleRes = await fetch('/api/chat/generate-title', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userMessage: originalRawInput.substring(0, 200),
                botResponse: botResponseText.substring(0, 200)
              })
            });
            if (titleRes.ok) {
              const titleData = await titleRes.json();
              if (titleData.title && titleData.title.length > 1) {
                const titledChatList = finalChatList.map(c => {
                  if (c.id === activeChatId) return { ...c, title: titleData.title };
                  return c;
                });
                saveChatsToLocal(titledChatList);
              }
            }
          } catch (titleErr) {
            console.warn('Smart title generation failed:', titleErr);
          }
        }
      } else {
        if (responseData.error === 'LIMIT_EXCEEDED') {
          alert("You have reached your daily prompt limit for today. Please upgrade your plan to unlock higher capacity.");
          onTriggerUpgrade();
        } else if (responseData.error === 'FEATURE_LIMIT') {
          alert(responseData.message || "You've reached the daily limit for this feature. Upgrade your plan for more.");
          onTriggerUpgrade();
        } else if (responseData.error === 'FEATURE_LOCKED') {
          alert(responseData.message || "This feature is not available in your current plan. Please upgrade.");
          onTriggerUpgrade();
        } else {
          alert(`Error: ${responseData.message || 'AI engine failed to respond.'}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to reach the chatbot backend.');
    } finally {
      setLoading(false);
    }
  };

  const activeChat = conversations.find(c => c.id === activeChatId) || null;
  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  // Helper to render Markdown snippets
  const renderMessageContent = (text) => {
    if (!text) return null;
    
    // Pattern to catch both mermaid and html blocks
    const blockRegex = /```(mermaid|html)\s*\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore });
      }
      parts.push({ type: match[1], content: match[2].trim() });
      lastIndex = blockRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }

    return parts.map((part, i) => {
      if (part.type === 'mermaid') {
        return <MermaidChart key={i} chartCode={part.content} />;
      }
      
      if (part.type === 'html') {
        return (
          <div key={i} className="html-app-block glass-panel" style={{ padding: '15px', marginTop: '10px', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-cyan)' }}><Code size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Live App Generated</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setLivePreviewApp(part.content)} 
                style={{ flex: 1, padding: '10px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                <MonitorPlay size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Live Preview
              </button>
              <button 
                onClick={() => handleShareApp(part.content)}
                style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer' }}
                title="Host Locally & Get Link"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        );
      }
      
      // Basic split formatting for lists, links, tables, and pre blocks
      return (
        <div key={i} className="markdown-render">
          {part.content.split('\n').map((line, lineIdx) => {
            // Check headers
            if (line.startsWith('### ')) {
              return <h4 key={lineIdx} style={{ margin: '15px 0 5px' }}>{line.replace('### ', '')}</h4>;
            }
            if (line.startsWith('## ')) {
              return <h3 key={lineIdx} style={{ margin: '20px 0 8px', fontFamily: 'var(--font-heading)' }}>{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('# ')) {
              return <h2 key={lineIdx} style={{ margin: '22px 0 10px', fontFamily: 'var(--font-heading)' }}>{line.replace('# ', '')}</h2>;
            }

            // Bullet Lists
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return <li key={lineIdx} style={{ marginLeft: '20px', marginBottom: '4px' }}>{formatInlineStyles(line.substring(2))}</li>;
            }

            // Format markdown links [text](url)
            return <p key={lineIdx}>{formatInlineStyles(line)}</p>;
          })}
        </div>
      );
    });
  };

  const formatInlineStyles = (line) => {
    // Basic inline bold and link replacement
    const boldRegex = /\*\*(.*?)\*\*/g;
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;

    let elements = [];
    let lastIndex = 0;
    let match;
    let counter = 0;

    // Bold tags
    let cleanLine = line.replace(boldRegex, '<b>$1</b>');
    
    // Links
    // For simplicity, we split and map them:
    const linkParts = [];
    let linkMatch;
    let linkLastIndex = 0;

    while ((linkMatch = linkRegex.exec(cleanLine)) !== null) {
      const textBefore = cleanLine.substring(linkLastIndex, linkMatch.index);
      if (textBefore) {
        linkParts.push(<span key={counter++} dangerouslySetInnerHTML={{ __html: textBefore }} />);
      }
      linkParts.push(
        <a key={counter++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>
          {linkMatch[1]}
        </a>
      );
      linkLastIndex = linkRegex.lastIndex;
    }

    const remaining = cleanLine.substring(linkLastIndex);
    if (remaining) {
      linkParts.push(<span key={counter++} dangerouslySetInnerHTML={{ __html: remaining }} />);
    }

    return linkParts.length > 0 ? linkParts : <span dangerouslySetInnerHTML={{ __html: cleanLine }} />;
  };

  // Auto-close sidebar on mobile when chat selected
  const handleChatSelect = (chatId) => {
    setActiveChatId(chatId);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  return (
    <div className="dashboard-container" style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100vh', backgroundColor: 'transparent' }}>
      {/* Sidebar backdrop — tap to close on mobile */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Responsive Sidebar */}
      <div className={`sidebar glass-panel ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <div className="logo-container">
              <BrainCircuit size={28} color="var(--accent-cyan)" />
              <span className="logo-text">MatrixMind</span>
            </div>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <button className="btn btn-secondary" onClick={handleCreateChat} style={{ width: '100%', padding: '10px' }}>
            <Plus size={16} /> New Chat Topic
          </button>

          <div className="search-chat-container">
            <Search size={16} className="search-icon-inside" />
            <input 
              type="text" 
              className="search-chat-input" 
              placeholder="Search chat topics..." 
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chats History list */}
        <div className="chats-list">
          {filteredConversations.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => handleChatSelect(chat.id)}
            >
              <span className="chat-item-text">{chat.title}</span>
              {conversations.length > 1 && (
                <button className="chat-delete-btn" onClick={(e) => handleDeleteChat(chat.id, e)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          {/* Theme switcher */}
          <div className="theme-switcher">
            <button className={`theme-btn ${theme === 'default' ? 'active' : ''}`} onClick={() => setTheme('default')}>Dark</button>
            <button className={`theme-btn ${theme === 'cyberpunk' ? 'active' : ''}`} onClick={() => setTheme('cyberpunk')}>Cyber</button>
            <button className={`theme-btn ${theme === 'light-aurora' ? 'active' : ''}`} onClick={() => setTheme('light-aurora')}>Light</button>
          </div>

          {/* Help & Support button */}
          <button className="btn btn-secondary" onClick={onShowHelp} style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', marginBottom: '8px' }}>
            <HelpCircle size={14} /> Help & Support
          </button>



          {/* Upgrade Plan button */}
          <button className="btn" onClick={onTriggerUpgrade} style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', background: 'var(--gradient-primary)' }}>
            Upgrade Subscription
          </button>

          {/* User badge */}
          <div className="user-badge">
            <div className="user-badge-info">
              <span className="user-badge-email" style={{ fontWeight: 'bold' }}>{currentUser.email}</span>
              <span className="user-badge-plan" style={{ color: 'var(--accent-cyan)' }}>
                {userPlanDetails?.plan ? userPlanDetails.plan.toUpperCase() : 'FREE'} PLAN
              </span>
              <span style={{ fontSize: '0.8rem', color: '#ffb86c', marginTop: '2px' }}>
                Prompts Left Today: {Number(userPlanDetails?.limit) === -1 ? 'Unlimited' : Math.max(0, (userPlanDetails?.limit || 30) - (userPlanDetails?.promptsUsed || 0)) + ' / ' + (userPlanDetails?.limit || 30)}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button className="btn btn-secondary" onClick={onLogout} style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-neon-red)', borderColor: 'rgba(255,51,102,0.3)' }}>
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>

      {/* Main chat viewport */}
      {/* Main chat viewport */}
      <div className={(livePreviewApp && mode === 'generate') || isGraphMode ? "workspace-split" : "main-chat-area-wrapper"} style={{ flex: 1, overflow: 'hidden' }}>
        
        <div className={isGraphMode ? "main-chat-area split-view" : `main-chat-area ${livePreviewApp && mode === 'generate' ? 'chat-pane' : ''}`}>
          <div className={isGraphMode ? "chat-panel" : "chat-container-inner"} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', flex: 1 }}>
          <div className="main-header">
          <div className="header-row-top">
            {!sidebarOpen && (
              <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
                <Menu size={24} />
              </button>
            )}

            {/* Personality switcher */}
            <div className="personality-bar">
              <button 
                className={`personality-btn ${personality === 'standard' ? 'active' : ''}`}
                onClick={() => setPersonality('standard')}
              >
                Standard
              </button>
              <button 
                className={`personality-btn ${personality === 'architect' ? 'active' : ''}`}
                onClick={() => setPersonality('architect')}
              >
                Architect
              </button>
              <button 
                className={`personality-btn ${personality === 'analyst' ? 'active' : ''}`}
                onClick={() => setPersonality('analyst')}
              >
                Analyst
              </button>
            </div>

            {/* Mode toggle buttons */}
            <div className="header-modes">
              <button 
                className={`mode-toggle-btn ${mode === 'generate' ? 'active' : ''}`}
                style={mode === 'generate' ? { background: 'linear-gradient(90deg, #ff007f, #7928ca)', color: '#fff', border: 'none' } : {}}
                onClick={() => setMode(prev => prev === 'generate' ? 'normal' : 'generate')}
              >
                Generate App
              </button>
              <button 
                className={`mode-toggle-btn ${mode === 'optimize' ? 'active' : ''}`}
                onClick={() => setMode(prev => prev === 'optimize' ? 'normal' : 'optimize')}
              >
                Optimize
              </button>
              <button 
                className={`mode-toggle-btn matrix ${mode === 'matrix_simulation' ? 'active' : ''}`}
                onClick={() => setMode(prev => prev === 'matrix_simulation' ? 'normal' : 'matrix_simulation')}
              >
                Matrix
              </button>
              
              <div className="tooltip-container">
                <button 
                  className={`mode-toggle-btn ${isGraphMode ? 'active' : ''}`}
                  style={isGraphMode ? { background: '#202025', color: '#ff79c6', border: '1px solid #ff79c6' } : {}}
                  onClick={() => setIsGraphMode(prev => !prev)}
                >
                  <BrainCircuit size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  🕸️ View Canvas
                </button>
                <div className="tooltip-text">
                  Transforms your long prompts into an interactive spatial network map (nodes and links). Great for dissecting complex plans, plots, or codebases!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Panel - Only visible in Generate Mode */}
        {mode === 'generate' && (
          <div className="credentials-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '5px' }} onClick={() => setShowCredentials(!showCredentials)}>
              <h4 style={{ margin: 0, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} /> App Credentials (Local)
              </h4>
              <div style={{ fontSize: '0.75rem', color: '#8b9bb4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{appCredentials.length} Saved</span>
                <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                  {showCredentials ? 'Hide' : 'Show / Add'}
                </button>
              </div>
            </div>
            
            {showCredentials && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '0.75rem', color: '#8b9bb4', marginBottom: '10px' }}>
                  These are saved securely in your browser and injected into your generated apps automatically.
                </div>
                {appCredentials.map((cred, index) => (
                  <div key={index} className="credential-row">
                    <input 
                      type="text" 
                      placeholder="Credential Name (e.g., WEATHER_API_KEY)" 
                      className="credential-input"
                      value={cred.name}
                      onChange={(e) => handleCredentialChange(index, 'name', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Actual Value (e.g., 12345ABC)" 
                      className="credential-input"
                      value={cred.value}
                      onChange={(e) => handleCredentialChange(index, 'value', e.target.value)}
                    />
                    <button onClick={() => handleRemoveCredentialRow(index)} style={{ background: 'transparent', border: 'none', color: '#ff3366', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={handleAddCredentialRow} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <Plus size={14} style={{ verticalAlign: 'middle' }} /> Add Row
                  </button>
                  <button onClick={handleSaveCredentials} style={{ background: 'var(--accent-purple)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Save Credentials
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message view */}
        <div className="messages-container">
          {activeChat && activeChat.messages.length === 0 ? (
            <div className="empty-chat-state">
              <h1>Welcome to MatrixMind</h1>
              <p>An advanced AI assistant utilizing real-time internet search grounding, Hinglish translations, voice inputs, and rotative Gemini credits.</p>
              
              <div className="features-grid">
                <div className="feature-box glass-panel" onClick={() => setPromptInput('Search who won the football match today and give links')}>
                  <HelpCircle size={28} color="var(--accent-cyan)" />
                  <h3>Real-time Facts</h3>
                  <p>Asks the bot to scrape the web live to verify news, events, or facts with authentic reference links.</p>
                </div>
                <div className="feature-box glass-panel" onClick={() => { setPersonality('architect'); setPromptInput('Create a mermaid mind map for web development learning paths'); }}>
                  <Terminal size={28} color="#ffe259" />
                  <h3>Architect Diagrams</h3>
                  <p>Switch to Architect personality and request structural designs, flows, or live interactive mind maps.</p>
                </div>
                <div className="feature-box glass-panel" onClick={() => { setPersonality('analyst'); setPromptInput('Analyze the statistics of global warming trends and present them in a table'); }}>
                  <LayoutGrid size={28} color="#ff3366" />
                  <h3>Analyst Statistics</h3>
                  <p>Switch to Analyst personality to dissect problems, generate metrics tables, and inspect trends.</p>
                </div>
              </div>
            </div>
          ) : (
            activeChat && (
              <>
                {/* Erase & Download buttons for active chat */}
                <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end', marginBottom: '-10px' }}>
                  <button className="chat-action-btn" onClick={handleDownloadChat}>
                    <Download size={14} /> Download Chat File
                  </button>
                  <button className="chat-action-btn" onClick={handleEraseChatMemory} style={{ color: 'var(--accent-neon-red)' }}>
                    <RotateCcw size={14} /> Erase Memory
                  </button>
                </div>

                {activeChat.messages.map((m) => (
                  <div key={m.id} className={`chat-bubble-wrapper ${m.sender}`}>
                    <div className="chat-bubble">
                      <div className="chat-bubble-header">
                        <span>{m.sender === 'user' ? 'You' : 'MatrixMind Bot'}</span>
                      </div>
                      
                      {/* Attachment in chat */}
                      {m.attachment && (
                        <div className="chat-bubble-attachment">
                          {m.attachment.mimeType.startsWith('image/') ? (
                            <img src={m.attachment.base64} alt={m.attachment.name} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                              <FileText size={20} />
                              <span style={{ fontSize: '0.8rem' }}>{m.attachment.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bot/User text */}
                      {renderMessageContent(m.text)}

                      {/* Interview Mode Widget */}
                      {m.type === 'interview_form' && (
                        <InterviewFormWidget
                          message={m}
                          currentUser={currentUser}
                          conversations={conversations}
                          activeChatId={activeChatId}
                          saveChatsToLocal={saveChatsToLocal}
                          personality={personality}
                          refreshUserStatus={refreshUserStatus}
                        />
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="chat-bubble-wrapper bot">
                    <div className="chat-bubble">
                      <div className="chat-bubble-header">
                        <span>MatrixMind Bot</span>
                      </div>
                      <p style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Calculating response...</p>
                    </div>
                  </div>
                )}
              </>
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input typings */}
        <div className="chat-input-container">
          <div className="chat-input-bar-wrapper">
            
            {/* Anonymize indicator */}
            {anonymizeEnabled && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '6px 14px', marginBottom: '6px',
                background: 'rgba(0, 242, 254, 0.08)', 
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: '8px', fontSize: '0.75rem', color: '#00f2fe'
              }}>
                <Shield size={14} />
                <span><strong>Anonymize ON</strong> — Emails, phones, API keys & IPs will be masked before sending</span>
              </div>
            )}

            {/* Interview Mode indicator */}
            {interviewModeActive && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '6px 14px', marginBottom: '6px',
                background: 'rgba(189, 147, 249, 0.08)', 
                border: '1px solid rgba(189, 147, 249, 0.2)',
                borderRadius: '8px', fontSize: '0.75rem', color: '#bd93f9'
              }}>
                <HelpCircle size={14} />
                <span><strong>Interview Mode ON</strong> — The AI will generate a dynamic clarifying form instead of an immediate generic response</span>
              </div>
            )}

            {/* Attachment preview above bar */}
            {attachment && (
              <div className="attachment-preview-card">
                <div className="attachment-preview-info">
                  {attachment.mimeType.startsWith('image/') ? <Image size={16} /> : <FileText size={16} />}
                  <span className="attachment-preview-name">{attachment.name}</span>
                </div>
                <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="chat-input-bar glass-panel">
              {/* Attachment selector */}
              <button 
                type="button" 
                className="chat-input-btn"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              >
                <Paperclip size={20} />
              </button>

              <input 
                type="text" 
                placeholder={isRecording ? "Listening to voice input..." : "Ask a query, write Hinglish, build designs..."}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                disabled={loading}
              />

              {/* Voice recognition mic */}
              <button 
                type="button" 
                className={`chat-input-btn voice-rec ${isRecording ? 'recording' : ''}`}
                onClick={toggleVoiceInput}
                title="Voice Input (English/Hinglish)"
              >
                <Mic size={20} />
              </button>

              {/* Anonymize toggle */}
              <button 
                type="button" 
                className={`chat-input-btn ${anonymizeEnabled ? 'anonymize-active' : ''}`}
                onClick={() => setAnonymizeEnabled(!anonymizeEnabled)}
                title={anonymizeEnabled ? 'Anonymize ON — sensitive data will be masked' : 'Anonymize OFF — click to protect sensitive data'}
                style={anonymizeEnabled ? { color: '#00f2fe', background: 'rgba(0, 242, 254, 0.15)', borderRadius: '8px' } : {}}
              >
                <Shield size={20} />
              </button>

              {/* Call Council button (desktop only) */}
              {isDesktop && (
                <button 
                  type="button" 
                  className="chat-input-btn"
                  onClick={handleCallCouncil}
                  disabled={loading || !promptInput.trim()}
                  title="Call Council — Multi-Agent Debate (Desktop Only)"
                  style={promptInput.trim() ? { color: '#667eea' } : {}}
                >
                  <Users size={20} />
                </button>
              )}

              {/* Execute Workflow Sequence button */}
              <button 
                type="button" 
                className="chat-input-btn"
                onClick={handleCallWorkflow}
                disabled={loading || !promptInput.trim()}
                title="Execute Workflow Sequence"
                style={promptInput.trim() ? { color: '#00f2fe' } : {}}
              >
                <Cpu size={20} />
              </button>

              {/* Interview Mode toggle */}
              <button 
                type="button" 
                className={`chat-input-btn ${interviewModeActive ? 'interview-active' : ''}`}
                onClick={() => setInterviewModeActive(!interviewModeActive)}
                title={interviewModeActive ? 'Interview Mode ON — AI will ask clarifying questions first' : 'Interview Mode OFF — click to activate interactive questions'}
                style={interviewModeActive ? { color: '#bd93f9', background: 'rgba(189, 147, 249, 0.15)', borderRadius: '8px' } : {}}
              >
                <HelpCircle size={20} />
              </button>

              {/* Send message */}
              <button type="submit" className="chat-input-btn send-msg" disabled={loading}>
                <Send size={20} />
              </button>
            </form>

            {/* Floating Attachment Menu */}
            {showAttachmentMenu && (
              <div className="attachment-popover glass-panel">
                <button className="attachment-popover-item" onClick={startCamera}>
                  <Camera size={16} /> Take a Picture
                </button>
                <label className="attachment-popover-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Image size={16} /> Browse Devices
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }}
                    accept="image/*,text/plain,application/pdf"
                  />
                </label>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Graph Canvas Panel (Split Screen) */}
        {isGraphMode && <KnowledgeGraph data={graphData} onNodeClickAction={(text) => handleSendMessage(null, text)} />}
      </div>

      {/* Live Preview Pane (Split Screen) */}
      {livePreviewApp && mode === 'generate' && (
        <div className="preview-pane">
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#000', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>
              <MonitorPlay size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> 
              Live App Preview
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleShareApp(livePreviewApp)} 
                className="btn" style={{ background: '#00f2fe', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem' }}
              >
                <Share2 size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Share Locally
              </button>
              <button 
                onClick={() => setLivePreviewApp(null)} 
                className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <X size={14} style={{ verticalAlign: 'middle' }}/> Close
              </button>
            </div>
          </div>
          <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
            <iframe 
              srcDoc={livePreviewApp} 
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              title="App Preview Sandbox"
            />
          </div>
        </div>
      )}
      
      </div>
      {/* Camera modal view overlay */}
      {showCamera && (
        <div className="camera-overlay">
          <div className="camera-preview-box">
            <video ref={videoRef} autoPlay playsInline />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn" onClick={capturePhoto}>Capture Photo</button>
            <button className="btn btn-secondary" onClick={stopCamera}>Close Camera</button>
          </div>
        </div>
      )}

      {/* Council Room overlay (desktop only) */}
      {councilMode && (
        <CouncilRoom
          prompt={councilPrompt}
          email={currentUser.email}
          onClose={() => setCouncilMode(false)}
          onConsensusComplete={handleCouncilConsensus}
        />
      )}

      {/* Workflow Sequencer overlay */}
      {workflowMode && (
        <WorkflowPanel
          prompt={workflowGoal}
          email={currentUser.email}
          onClose={() => setWorkflowMode(false)}
          onWorkflowComplete={handleWorkflowComplete}
        />
      )}

    </div>
  );
}

export default Dashboard;
