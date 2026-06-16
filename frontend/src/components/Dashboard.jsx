import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Plus, Search, Trash2, Send, Mic, Paperclip, 
  Camera, FileText, Image, Download, RotateCcw, ShieldCheck, 
  BrainCircuit, LayoutGrid, Terminal, HelpCircle, Check, Info, LogOut
} from 'lucide-react';
import mermaid from 'mermaid';

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
  const [mode, setMode] = useState('normal'); // 'normal', 'matrix_simulation', 'optimize'
  const [loading, setLoading] = useState(false);

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
      title: 'New Chat Topic ' + (conversations.length + 1),
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
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() && !attachment) return;
    if (loading) return;

    // Check Plan limitations locally before calling backend
    if (userPlanDetails) {
      if (userPlanDetails.promptsUsed >= userPlanDetails.limit) {
        onTriggerUpgrade();
        return;
      }
    }

    const currentChat = conversations.find(c => c.id === activeChatId);
    if (!currentChat) return;

    const userMessageText = promptInput;
    const activeAttachment = attachment;

    // Append user message immediately to local state
    const userMsg = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: userMessageText,
      attachment: activeAttachment ? { name: activeAttachment.name, mimeType: activeAttachment.mimeType, base64: activeAttachment.base64 } : null,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...currentChat.messages, userMsg];
    
    // Auto re-title the chat from prompt
    let chatTitle = currentChat.title;
    if (currentChat.messages.length === 0) {
      chatTitle = userMessageText.substring(0, 30) + (userMessageText.length > 30 ? '...' : '');
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

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          message: userMessageText,
          history: currentChat.messages.slice(-10), // Send last 10 messages for context
          personality: personality,
          mode: mode,
          attachment: activeAttachment
        })
      });

      const responseData = await chatRes.json();
      
      if (chatRes.ok) {
        const botResponseText = responseData.response;

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

        saveChatsToLocal(finalChatList);
        refreshUserStatus(); // Refresh daily counts
      } else {
        if (responseData.error === 'LIMIT_EXCEEDED') {
          alert("You have reached your daily prompt limit for today. Please upgrade your plan to unlock higher capacity.");
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

  // Helper to render Markdown snippets (Basic support for tables, lists, code, and mermaid graphs)
  const renderMessageContent = (text) => {
    if (!text) return null;
    
    // Look for Mermaid diagram code blocks
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mermaidRegex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore });
      }
      parts.push({ type: 'mermaid', content: match[1].trim() });
      lastIndex = mermaidRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }

    return parts.map((part, i) => {
      if (part.type === 'mermaid') {
        return <MermaidChart key={i} chartCode={part.content} />;
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
    <div className="app-container" style={{ width: '100%' }}>
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
                Prompts Left Today: {Math.max(0, (userPlanDetails?.limit || 30) - (userPlanDetails?.promptsUsed || 0))} / {userPlanDetails?.limit || 30}
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
      <div className="main-chat-area">
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
            </div>
          </div>
        </div>

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
    </div>
  );
}

export default Dashboard;
