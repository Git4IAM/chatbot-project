import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Send, PlusCircle, MessageSquare, User, Bot, LogOut, Menu } from 'lucide-react';
import './App.css';

// --- CONFIG ---
const API_URL = "Your api";
const USER_ID = "630710317";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [chatHistory, setChatHistory] = useState([]); 

  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const initialSession = uuidv4();
    setSessionId(initialSession);
    setChatHistory([{ id: initialSession, title: 'New Chat' }]);
    setMessages([
      { role: 'ai', content: 'สวัสดี AI Assitant พร้อมให้บริการ' }
    ]);
  }, []);

  const startNewChat = () => {
    const newSession = uuidv4();
    setSessionId(newSession);
    setMessages([
      { role: 'ai', content: 'สร้างการสนทนาใหม่เรียบร้อย' }
    ]);
    setChatHistory(prev => [{ id: newSession, title: 'New Chat' }, ...prev]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        message: input,
        user_id: USER_ID,
        session_id: sessionId
      };

      const res = await axios.post(API_URL, payload);
      const aiMsg = { role: 'ai', content: res.data.reply };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Error:", error);
      const errorMsg = { role: 'ai', content: 'ขออภัย ระบบขัดข้องชั่วคราว' };
      setMessages(prev => [...prev, errorMsg]);
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

  const handleLogout = () => {
    if(window.confirm("ออกจากระบบ?")) {
      window.location.reload(); 
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
        
        {/* ส่วนท้าย Sidebar แบบใหม่ */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar-circle">
              <User size={20} />
            </div>
            <div className="user-details">
              <p className="username">Student ID</p>
              <p className="userid">{USER_ID}</p>
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
        {/* Header */}
        <div className="top-bar">
          <div className="model-selector">
            <span className="model-label">Model: </span>
            <span className="model-name">Claude 4.5 Sonnet</span>
          </div>
        </div>

        {/* Chat Scroll Area */}
        <div className="chat-scroll-area">
          <div className="chat-container">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-row ${msg.role === 'ai' ? 'ai-row' : ''}`}>
                <div className="row-avatar">
                   {msg.role === 'ai' ? (
                     <div className="icon-box ai-icon"><Bot size={24} /></div>
                   ) : (
                     <div className="icon-box user-icon"><User size={24} /></div>
                   )}
                </div>
                <div className="row-content">
                  <div className="sender-name">
                    {msg.role === 'ai' ? 'AI Assistant' : 'You'}
                  </div>
                  <div className="message-text">
                    {msg.content}
                  </div>
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

        {/* Input Area (Bottom) */}
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
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()} 
              className="send-btn"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="footer-disclaimer">
            AI answers can make mistakes. Please verify information.
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;