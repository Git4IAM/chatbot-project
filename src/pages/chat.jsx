import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, PlusCircle, MessageSquare, User, Bot, LogOut, Loader2 } from 'lucide-react';
import '../App.css';
import { getCurrentUser, signOut, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_MODEL = "us.amazon.nova-2-lite-v1:0";

function Chat() {
  const [displayName, setDisplayName] = useState('');
  const [authToken, setAuthToken] = useState(''); // เก็บ JWT token

  useEffect(() => {
    const loadUser = async () => {
      const attrs = await fetchUserAttributes();
      console.log(attrs)
      setDisplayName(attrs.name || attrs.email.split('@')[0]);

      // ดึง JWT token จาก Cognito session
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      console.log(token);
      setAuthToken(token);
      await loadSessions(token);
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

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSend = async () => {
    if (!input.trim() || !authToken) return;
    console.log("authToken at send time:", authToken)
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    console.log("sending token:", authToken);
    try {
      const res = await axios.post(
        API_URL,
        {
          message: input,
          session_id: sessionId, // null = ให้ Lambda สร้าง session ใหม่
          model_id: selectedModel
          // ไม่ส่ง user_id — Lambda ดึงจาก JWT เอง
        },
        {
          headers: {
            Authorization: authToken // JWT token สำหรับ Cognito Authorizer
          }
        }
      );

      // ถ้าเป็น session ใหม่ → เซฟ session_id ที่ได้จาก    Lambda
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
              <span>{chat.title || 'New Chat'}</span>
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
                                  {String(children).replace(/\$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>{children}</code>
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      : msg.content
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
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message AI..."
              className="main-input"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="send-btn">
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