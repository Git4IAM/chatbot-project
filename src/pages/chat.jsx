import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, PlusCircle, MessageSquare, User, Bot, LogOut, Loader2, Paperclip, Globe } from 'lucide-react';
import '../App.css';
import { signOut, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_MODEL = "us.amazon.nova-2-lite-v1:0";

const PROMPT_GUIDES = [
  { icon: '📝', label: 'สรุปบทเรียน', text: 'ช่วยสรุปเนื้อหาต่อไปนี้ให้กระชับ: ' },
  { icon: '💻', label: 'ช่วยเขียนโค้ด', text: 'ช่วยเขียนโค้ดสำหรับ: ' },
  { icon: '🌐', label: 'แปลภาษา', text: 'แปลข้อความต่อไปนี้เป็นภาษาอังกฤษ: ' },
  { icon: '✍️', label: 'ตรวจงานเขียน', text: 'ช่วยตรวจและแก้ไขงานเขียนต่อไปนี้: ' },
];

function Chat() {
  const [displayName, setDisplayName] = useState('');
  const [authToken, setAuthToken] = useState(''); // เก็บ JWT token

  useEffect(() => {
    const loadUser = async () => {
      try {
        const attrs = await fetchUserAttributes();
        setDisplayName(attrs.name || attrs.email?.split('@')[0] || '');

        // ดึง JWT token จาก Cognito session
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString() || '';

        if (!token) {
          throw new Error('Missing auth token from session');
        }

        setAuthToken(token);
        await loadSessions(token);
      } catch (err) {
        console.error('Auth bootstrap error:', err);
        setDisplayName('');
        setAuthToken('');
      }
    };
    loadUser();
  }, []);

  const [messages, setMessages] = useState([
    { role: 'ai', content: 'สวัสดี AI Assistant พร้อมให้บริการ' }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null); // null = ยังไม่มี session
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [editingId, setEditingId] = useState(null);//session ที่กำลัง rename
  const [editingTitle,setEditingTitle] = useState('');//ชื่อที่กำลังพิมพ์
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [webSearch, setWebSearch] = useState(false);

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (selectedFilePreviewUrl) {
        URL.revokeObjectURL(selectedFilePreviewUrl);
      }
    };
  }, [selectedFilePreviewUrl]);

  const clearSelectedFile = () => {
    if (selectedFilePreviewUrl) {
      URL.revokeObjectURL(selectedFilePreviewUrl);
    }
    setSelectedFile(null);
    setSelectedFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (selectedFilePreviewUrl) {
      URL.revokeObjectURL(selectedFilePreviewUrl);
    }
    setSelectedFile(file);
    setSelectedFilePreviewUrl(URL.createObjectURL(file));
  };

  const startNewChat = () => {
    setSessionId(null); // reset Lambda จะสร้าง session ใหม่
    setMessages([{ role: 'ai', content: 'สร้างการสนทนาใหม่เรียบร้อย' }]);
  };

  const loadSessions = async (token) => {
    if (!token) return;
    setLoadingSessions(true);
    try{
      const res = await axios.get(`${API_BASE_URL}/sessions`, {
        headers: {Authorization: token}
      });
      setChatHistory(res.data.sessions || []);
    } catch (err) {
      console.error('Load sessions error:', err);
    } finally {
      setLoadingSessions(false);
    }
};

const handleSelectSession = async (sid) => {
  if (sid===sessionId) return;
  setSessionId(sid);
  setMessages([]);
  setIsLoading(true);
  try {
    const res = await axios.get(`${API_BASE_URL}/sessions/${sid}`, {
      headers: {Authorization: authToken}
    });
    const loaded = (res.data.messages || []).map((m) => ({
      role: m.role === 'assistant' ? 'ai' : 'user',
      content: m.content
    }));
    setMessages(loaded.length > 0 ? loaded : [{ role: 'ai', content: 'ไม่พบประวัติการสนทนา' }]);
  } catch (err) {
    console.error('Load messages error:', err);
    setMessages([{ role: 'ai', content: 'ไม่สามารถโหลดประวัติได้' }]);
  } finally {
    setIsLoading(false);
  }
}

const handleRename = async (sid, newTitle) => {
  if (!newTitle.trim()) return;
  try {
    await axios.patch(`${API_BASE_URL}/sessions/${sid}`,
      { title: newTitle },
      { headers: { Authorization: authToken} }
    );
    setChatHistory(prev => prev.map(c => 
      c.sessionId === sid ? { ...c, title: newTitle} : c
    ));
  } catch (err) {
    console.error('Rename error:', err);
  } finally {
    setEditingId(null);
  }
};

const handleDelete = async (sid) => {
  if (!window.confirm('ลบการสนทนานี้?')) return;
  try {
    await axios.delete(`${API_BASE_URL}/sessions/${sid}`,
      { headers: { Authorization: authToken } }
    );
    setChatHistory(prev => prev.filter(c => c.sessionId !== sid));
    if (sessionId == sid) startNewChat();
  } catch (err) {
    console.error('Delete error:', err);
  }
};

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || !authToken) return;
    //console.log("authToken at send time:", authToken)

    const pendingInput = input;
    const pendingFile = selectedFile;
    const pendingPreviewUrl = selectedFilePreviewUrl;

    const userMsg = { role: 'user', content: pendingInput };
    if (pendingPreviewUrl) {
      userMsg.imageUrl = pendingPreviewUrl;
    }
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedFile(null);
    setSelectedFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(true);
    //console.log("sending token:", authToken);
    let file_key = null;

    if (pendingFile) {
      try {
        const urlRes = await axios.post(`${API_BASE_URL}/upload-url`,
          { file_type: pendingFile.type, sessionId: sessionId || 'new'},
          { headers: { Authorization: authToken} }
        );
        await axios.put(urlRes.data.upload_url, pendingFile, {
          headers: { 'Content-Type': pendingFile.type}
        });
        file_key = urlRes.data.file_key;
      } catch (err) {
        console.error('Upload error:', err);
        setMessages(prev => [...prev, { role: 'ai', content: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }]);
        setIsLoading(false);
        if (pendingPreviewUrl) {
          URL.revokeObjectURL(pendingPreviewUrl);
        }
        return;
      }
    }

    try {
      const res = await axios.post(API_URL,
        {
          message: pendingInput,
          session_id: sessionId, // null = ให้ Lambda สร้าง session ใหม่
          model_id: selectedModel,
          file_key
          // ไม่ส่ง user_id — Lambda ดึงจาก JWT เอง
        },
        {
          headers: {
            Authorization: authToken // JWT token สำหรับ Cognito Authorizer
          }
        }
      );

      // ถ้าเป็น session ใหม่ -> เซฟ session_id ที่ได้จาก Lambda
      if (res.data.is_new_session) {
        setSessionId(res.data.session_id);
        setChatHistory(prev => [
          { sessionId: res.data.session_id, title: input.slice(0, 40) || 'New Chat' },
          ...prev
        ]);
      }

      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);

    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: 'ขออภัย ระบบขัดข้องชั่วคราว' }]);
    } finally {
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = async () => {
    if (window.confirm("ออกจากระบบ?")) {
      await signOut();
      window.location.href = '/login';
    }
  };

  return (
    <div className="app-layout">
      {/* --- SIDEBAR --- */}
      <div className="sidebar">
        <div className="sidebar-top">
          <button onClick={startNewChat} className="btn-new-chat">
            <PlusCircle size={18} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="history-list">
          <p className="section-label">Recent</p>
          {loadingSessions ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', color: '#888'}}>
              <Loader2 size={14} className="spin" />
              <span>กำลังโหลด...</span>
              </div>
          ) : chatHistory.map((chat) => (
            <div
              key={chat.sessionId}
              className={`history-item ${sessionId === chat.sessionId ? 'active' : ''}`}
              onClick={() => handleSelectSession(chat.sessionId)}
            >
              <MessageSquare size={16} />

              {editingId === chat.sessionId ? (
                // rename
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(chat.sessionId, editingTitle);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => handleRename(chat.sessionId, editingTitle)}
                  className="rename-input"
                  onClick={(e) => e.stopPropagation()}
                />
                ) : (
                  <span>{chat.title || 'New Chat'}</span>
              )}
              
              {/* buttom*/}
              <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setEditingId(chat.sessionId); setEditingTitle(chat.title); }}>เปลี่ยนชื่อ</button>
                <button onClick={() => handleDelete(chat.sessionId)}>ลบ</button>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar-circle"><User size={20} /></div>
            <div className="user-details">
              <p className="username">ผู้ใช้งาน</p>
              <p className="userid">{displayName}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main-content">
        <div className="top-bar">
          {/* Model Switcher */}
          <div className="model-selector">
            <span className="model-label">Model: </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-dropdown"
            >
              <option value="us.anthropic.claude-haiku-4-5-20251001-v1:0">Claude Haiku 4.5 (Fast)</option>
              <option value="us.anthropic.claude-sonnet-4-6">Claude Sonnet 4.6 (Balanced)</option>
              <option value="us.anthropic.claude-opus-4-5-20251101-v1:0">Claude Opus 4.5 (Smart)</option>
              <option value="us.amazon.nova-2-lite-v1:0">Amazon Nova 2 Lite (Balanced)</option>
              <option value="us.amazon.nova-pro-v1:0">Amazon Nova Pro (Reason)</option>
            </select>
          </div>
        </div>

        {/* Prompt Guide — แสดงตลอดเวลา */}
        <div className="prompt-guide">
          <div className="prompt-grid">
            {PROMPT_GUIDES.map((p, i) => (
              <div key={i} className="prompt-card"
                onClick={() => setInput(p.text)}>
                <span className="prompt-icon">{p.icon}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-scroll-area">
          <div className="chat-container">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-row ${msg.role === 'ai' ? 'ai-row' : ''}`}>
                <div className="row-avatar">
                  {msg.role === 'ai'
                    ? <div className="icon-box ai-icon"><Bot size={24} /></div>
                    : <div className="icon-box user-icon"><User size={24} /></div>}
                </div>
                <div className="row-content">
                  <div className="sender-name">{msg.role === 'ai' ? 'AI Assistant' : 'You'}</div>
                  <div className="message-text">
                    {msg.role === 'ai'
                      ? <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>{children}</code>
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      : (
                        <>
                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="uploaded"
                              className="message-image"
                            />
                          )}
                          {msg.content}
                        </>
                      )
                    }</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-row ai-row">
                <div className="row-avatar">
                  <div className="icon-box ai-icon"><Bot size={24} /></div>
                </div>
                <div className="row-content">
                  <div className="sender-name">AI Assistant</div>
                  <div className="message-text loading-text">Thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-container">
          <div className="input-box-wrapper">
            <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            />
            <button
            className="upload-btn"
            onClick={() => fileInputRef.current.click()}
            disabled={isLoading}
            title={'แนบไฟล์'}
            >
              <Paperclip size={16} />
            </button>

            <button
              className={`upload-btn ${webSearch ? 'web-search-active' : ''}`}
              onClick={() => setWebSearch(prev => !prev)}
              disabled={isLoading}
              title={webSearch ? 'Web Search เปิดอยู่' : 'เปิด Web Search'}  
            >
              <Globe size={16} />
            </button>

            {selectedFile && (
              <span className="file-preview">
                {selectedFilePreviewUrl && (
                  <img
                    src={selectedFilePreviewUrl}
                    alt="preview"
                    className="file-preview-image"
                  />
                )}
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="file-preview-remove"
                  aria-label="Remove selected image"
                >
                  ยกเลิก
                </button>
              </span>
            )}
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="ส่งข้อความเลย..."
              className="main-input"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedFile)} className="send-btn">
              <Send size={18} />
            </button>
          </div>
          <div className="footer-disclaimer">AI answers can make mistakes. Please verify information.</div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
