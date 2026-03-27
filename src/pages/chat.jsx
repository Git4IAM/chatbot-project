import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, PlusCircle, MessageSquare, User, Bot, LogOut } from 'lucide-react';
import '../App.css';
import { getCurrentUser, signOut, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_MODEL = "us.anthropic.claude-haiku-4-5-20251001-v1:0";

function Chat() {
  const [displayName, setDisplayName] = useState('');
  const [authToken, setAuthToken] = useState(''); // เก็บ JWT token

  useEffect(() => {
    const loadUser = async () => {
      const attrs = await fetchUserAttributes();
      setDisplayName(attrs.name || attrs.email.split('@')[0]);

      // ดึง JWT token จาก Cognito session
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      console.log(token);
      setAuthToken(token);
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

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startNewChat = () => {
    setSessionId(null); // reset → Lambda จะสร้าง session ใหม่ให้
    setMessages([{ role: 'ai', content: 'สร้างการสนทนาใหม่เรียบร้อย' }]);
  };

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
          { id: res.data.session_id, title: 'New Chat' },
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
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`history-item ${sessionId === chat.id ? 'active' : ''}`}
            >
              <MessageSquare size={16} />
              <span className="history-text">Session: {chat.id.slice(0, 8)}...</span>
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
                  <div className="message-text">{msg.content}</div>
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