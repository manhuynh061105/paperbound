import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { aiService } from '../services/api';


const API_BASE_URL = import.meta.env?.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : window.location.origin);

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const userContainer = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userId = userContainer?.id || null; 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (userId) {
      const fetchChatHistory = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/ai/history/${userId}`);
          if (res.data.success && res.data.data.length > 0) {
            const historyMessages = res.data.data.map(item => ({
              sender: item.is_from_ai ? 'bot' : 'user',
              text: item.message_content
            }));
            setMessages(historyMessages);
          } else {
            initDefaultGreeting();
          }
        } catch (error) {
          console.error("Lỗi lấy lịch sử chat:", error);
          initDefaultGreeting();
        }
      };
      fetchChatHistory();
    } else {
      initDefaultGreeting();
    }
  }, [userId]);

  const initDefaultGreeting = () => {
    setMessages([
      { sender: 'bot', text: '👋 Xin chào! Tôi là trợ lý ảo Paperbound AI. Tôi hiểu rõ toàn bộ kho sách của cửa hàng, bạn cần tôi tư vấn hay tìm kiếm cuốn sách nào không?' }
    ]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.sendMessage({
        userId: userId, 
        message: userText
      });

      const aiReply = res.data?.data?.message_content || 
                      res.data?.data?.message || 
                      res.data?.data ||
                      res.data?.reply;

      if ((res.data?.success || res.status === 200) && aiReply) {
        setMessages(prev => [...prev, { sender: 'bot', text: aiReply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: '💔 Hệ thống AI đang bận xử lý dữ liệu kho sách, bạn vui lòng thử lại sau nhé!' }]);
      }
    } catch (error) {
      console.error("❌ Lỗi kết nối AI tại Frontend:", error);
      const errorMsg = error.response?.data?.message || '😥 Kết nối máy chủ AI thất bại. Vui lòng kiểm tra lại mạng!';
      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          ...styles.launcherBtn,
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
        title="Trợ lý sách AI Paperbound"
      >
        {isOpen ? (
          <span style={{ fontSize: '20px' }}>✕</span>
        ) : (
          <div style={styles.iconContent}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <span style={styles.launcherText}>AI Chat</span>
          </div>
        )}
      </button>

      <div style={{
        ...styles.chatWindow,
        display: isOpen ? 'flex' : 'none', 
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
        pointerEvents: isOpen ? 'all' : 'none',
      }}>
        <div style={styles.chatHeader}>
          <div style={styles.headerInfo}>
            <div style={styles.avatarCircle}>📖</div>
            <div>
              <div style={styles.headerTitle}>PAPERBOUND AI</div>
              <div style={styles.headerSubtitle}>● Trực tuyến • Trợ lý hiệu sách</div>
            </div>
          </div>
        </div>
        
        <div style={styles.messageArea}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              ...styles.messageRow,
              justify: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                ...styles.bubble,
                backgroundColor: msg.sender === 'user' ? '#1a202c' : '#ffffff',
                color: msg.sender === 'user' ? '#ffffff' : '#2d3748',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
              }}>
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={styles.loadingRow}>
              <div style={styles.loadingBubble}>
                <span>🤖 Đang lục tìm kho sách...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input 
            type="text" 
            placeholder="Tìm sách trinh thám, kinh tế, kỹ năng..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={styles.chatInput}
            disabled={loading}
          />
          <button 
            type="submit" 
            style={{
              ...styles.sendBtn,
              backgroundColor: input.trim() && !loading ? '#1a202c' : '#cbd5e0',
              cursor: input.trim() && !loading ? 'pointer' : 'default'
            }} 
            disabled={loading || !input.trim()}
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999, fontFamily: '"Inter", system-ui, sans-serif' },
  launcherBtn: { width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#1a202c', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  iconContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' },
  launcherText: { fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', color: '#e2e8f0' },
  chatWindow: { position: 'absolute', bottom: '80px', right: '0', width: '370px', height: '520px', backgroundColor: '#f7fafc', borderRadius: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  chatHeader: { backgroundColor: '#1a202c', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #2d3748' },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatarCircle: { width: '35px', height: '35px', backgroundColor: '#2d3748', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  headerTitle: { fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' },
  headerSubtitle: { fontSize: '11px', color: '#68d391', marginTop: '2px' },
  messageArea: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' },
  messageRow: { display: 'flex', width: '100%' },
  bubble: { padding: '12px 16px', fontSize: '13.5px', maxWidth: '80%', lineHeight: '1.5', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' },
  loadingRow: { display: 'flex', width: '100%' },
  loadingBubble: { padding: '10px 14px', fontSize: '12px', color: '#718096', backgroundColor: '#edf2f7', borderRadius: '14px 14px 14px 4px' },
  inputForm: { display: 'flex', borderTop: '1px solid #e2e8f0', padding: '14px', backgroundColor: '#fff', gap: '10px', alignItems: 'center' },
  chatInput: { flex: 1, border: '1px solid #e2e8f0', borderRadius: '30px', padding: '12px 18px', outline: 'none', fontSize: '13.5px', backgroundColor: '#f7fafc', transition: 'border 0.2s' },
  sendBtn: { color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '30px', fontSize: '13.5px', fontWeight: '600', transition: 'all 0.2s' }
};

export default AIChatbot;