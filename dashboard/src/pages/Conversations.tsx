import { useState, useEffect } from 'react';
import {
  MessageSquare, User, Clock, ArrowRight, Shield, ShieldAlert,
  Bot, RefreshCw, Send, Loader2, Sparkles, MessageCircle, AlertCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const VENDOR_ID = localStorage.getItem('vendorId') ?? '1';

interface Conversation {
  id: string;
  customer: string;
  phoneNumber: string;
  lastMessage: string;
  timestamp: string;
  status: 'ACTIVE' | 'HANDED_OFF';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationDetail {
  customerId: string;
  customer: string;
  phoneNumber: string;
  summary: string;
  status: 'ACTIVE' | 'HANDED_OFF';
  messages: Message[];
}

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toggleHandoffLoading, setToggleHandoffLoading] = useState(false);

  // Mask phone numbers for demo compliance if needed, or keep it readable
  const maskPhone = (phone: string) => {
    if (phone.length < 7) return phone;
    return phone.replace(/(\+\d{3}\s?\d{2})\d{3}(\d{4})/, '$1***$2');
  };

  const loadList = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/conversations`);
      if (res.ok) {
        const data = await res.json() as { conversations: Conversation[] };
        setConversations(data.conversations ?? []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const loadDetail = async (customerId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/conversations/${customerId}`);
      if (res.ok) {
        const data = await res.json() as ConversationDetail;
        setDetail(data);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleHandoff = async () => {
    if (!detail) return;
    setToggleHandoffLoading(true);
    const newHandoffState = detail.status !== 'HANDED_OFF';
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/conversations/${detail.customerId}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoff: newHandoffState }),
      });
      if (res.ok) {
        const updatedStatus = newHandoffState ? 'HANDED_OFF' as const : 'ACTIVE' as const;
        setDetail(prev => prev ? { ...prev, status: updatedStatus } : null);
        setConversations(prev =>
          prev.map(c => c.id === detail.customerId ? { ...c, status: updatedStatus } : c)
        );
      }
    } catch (err) {
      console.error('Handoff toggle failed:', err);
    } finally {
      setToggleHandoffLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    const interval = setInterval(loadList, 8000); // refresh list every 8s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="conversations" />

      <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 2rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          flexShrink: 0
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              Live Conversations
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: '0.2rem 0 0' }}>
              Monitor and take over customer chats in real-time.
            </p>
          </div>
          <button className="btn-ghost" onClick={loadList} disabled={loadingList}>
            <RefreshCw size={13} style={{ animation: loadingList ? 'spin-slow 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Panel split */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left panel: List */}
          <div style={{
            width: 320, background: 'var(--surface)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }}>
            {loadingList && conversations.length === 0 ? (
              <div style={{ padding: '2rem 1.5rem', display: 'grid', gap: '0.75rem' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-state" style={{ padding: '4rem 1.5rem' }}>
                <div className="empty-state-icon"><MessageSquare size={20} color="var(--text-3)" /></div>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-2)', margin: '0 0 0.25rem' }}>No conversations yet</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: 0 }}>Scan WhatsApp QR and wait for customer messages.</p>
              </div>
            ) : (
              conversations.map(c => {
                const isSelected = selectedId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    style={{
                      padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer', background: isSelected ? 'var(--bg)' : 'transparent',
                      transition: 'background 0.15s', position: 'relative'
                    }}
                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'var(--surface-raised)'; }}
                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text)' }}>
                        {maskPhone(c.customer)}
                      </span>
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{
                      margin: 0, fontSize: '0.78rem', color: 'var(--text-2)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: '85%'
                    }}>
                      {c.lastMessage || '(Empty context)'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                      {c.status === 'HANDED_OFF' ? (
                        <span className="badge" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          Human Support
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          Bot Assistant
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right panel: Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
            {selectedId === null ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', padding: '2rem' }}>
                <MessageSquare size={36} style={{ strokeWidth: 1.5, marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Select a chat thread to view</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem' }}>Click any customer on the left to monitor their messages.</p>
              </div>
            ) : loadingDetail && !detail ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={24} className="spin-slow" color="var(--brand)" style={{ animation: 'spin-slow 1s linear infinite' }} />
              </div>
            ) : detail ? (
              <>
                {/* Chat header */}
                <div style={{
                  padding: '1rem 1.5rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{detail.customer}</h3>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-3)' }}>Session ID: {detail.customerId}</p>
                    </div>
                  </div>

                  <button
                    onClick={toggleHandoff}
                    disabled={toggleHandoffLoading}
                    className="btn-primary"
                    style={{
                      padding: '0.5rem 1rem', fontSize: '0.8rem',
                      background: detail.status === 'HANDED_OFF' ? 'var(--brand)' : '#ef4444',
                      boxShadow: detail.status === 'HANDED_OFF' ? 'var(--shadow-brand)' : '0 4px 14px rgba(239,68,68,0.2)'
                    }}
                  >
                    {toggleHandoffLoading ? (
                      <Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} />
                    ) : detail.status === 'HANDED_OFF' ? (
                      <Bot size={13} />
                    ) : (
                      <User size={13} />
                    )}
                    {detail.status === 'HANDED_OFF' ? 'Resume Bot Automation' : 'Take Over Chat (Handoff)'}
                  </button>
                </div>

                {/* Conversation Body split */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                  {/* Messages bubble feed */}
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    padding: '1.5rem', overflowY: 'auto', gap: '0.75rem'
                  }}>
                    {detail.messages.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--text-3)' }}>
                        <AlertCircle size={22} style={{ marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>No messages recorded in context</p>
                      </div>
                    ) : (
                      detail.messages.map((m) => {
                        const isUser = m.role === 'user';
                        return (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              justifyContent: isUser ? 'flex-start' : 'flex-end',
                            }}
                          >
                            <div style={{
                              background: isUser ? 'var(--surface)' : 'var(--brand)',
                              color: isUser ? 'var(--text)' : '#ffffff',
                              border: isUser ? '1px solid var(--border)' : 'none',
                              borderRadius: isUser ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                              padding: '0.65rem 0.9rem',
                              maxWidth: '75%',
                              fontSize: '0.84rem',
                              lineHeight: 1.5,
                              boxShadow: 'var(--shadow-xs)',
                              whiteSpace: 'pre-line'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                {isUser ? (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand)' }}>Customer</span>
                                ) : (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Bot size={10} /> AI Agent
                                  </span>
                                )}
                              </div>
                              {m.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right summary/context column */}
                  <div style={{
                    width: 250, background: 'var(--surface)', borderLeft: '1px solid var(--border)',
                    padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem',
                    flexShrink: 0
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Sparkles size={14} color="var(--brand)" />
                        <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Conversation Summary</h4>
                      </div>
                      <div style={{
                        background: 'rgba(22,163,74,0.03)', border: '1px solid rgba(22,163,74,0.1)',
                        borderRadius: 8, padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.65
                      }}>
                        {detail.summary || 'No summary generated yet. The conversation summary updates dynamically as messages flow.'}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chat Info</h4>
                      <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                          <span style={{ color: 'var(--text-3)' }}>Status</span>
                          <span style={{ fontWeight: 700, color: detail.status === 'HANDED_OFF' ? '#ef4444' : 'var(--brand)' }}>
                            {detail.status === 'HANDED_OFF' ? 'Handed Off' : 'Auto Bot'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                          <span style={{ color: 'var(--text-3)' }}>Phone</span>
                          <span className="mono" style={{ fontWeight: 600 }}>{detail.phoneNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
