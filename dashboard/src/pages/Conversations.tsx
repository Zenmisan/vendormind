import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, User, Clock, Shield, ShieldAlert,
  Bot, RefreshCw, Send, Loader2, Sparkles, MessageCircle,
  AlertCircle, ArrowLeft, ChevronRight, ChevronLeft, Phone
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const getVendorId = () => localStorage.getItem('vendorId') ?? '1';

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

function getAvatar(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4, -2);
  if (digits.length >= 2) return digits.slice(-2);
  return phone.slice(0, 2).toUpperCase();
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.replace(/(\+?\d{3}\s?\d{2})\d{3}(\d{4})/, '$1•••$2');
}

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toggleHandoffLoading, setToggleHandoffLoading] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [convFilter, setConvFilter] = useState<'all' | 'active' | 'handoff'>('all');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConvs = conversations.filter(c => {
    const q = convSearch.toLowerCase();
    const matchesSearch = !q || c.customer.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q);
    const matchesFilter =
      convFilter === 'all' ||
      (convFilter === 'active' && c.status === 'ACTIVE') ||
      (convFilter === 'handoff' && c.status === 'HANDED_OFF');
    return matchesSearch && matchesFilter;
  });

  const loadList = async (silent = false) => {
    if (!silent && conversations.length === 0) setLoadingList(true);
    try {
      const res = await fetch(`${API}/vendors/${getVendorId()}/conversations`);
      if (res.ok) {
        const data = await res.json() as { conversations: Conversation[] };
        setConversations(data.conversations ?? []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  const loadDetail = async (customerId: string, silent = false) => {
    if (!silent) setLoadingDetail(true);
    try {
      const res = await fetch(`${API}/vendors/${getVendorId()}/conversations/${customerId}`);
      if (res.ok) {
        const data = await res.json() as ConversationDetail;
        setDetail(data);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      if (!silent) setLoadingDetail(false);
    }
  };

  const toggleHandoff = async () => {
    if (!detail) return;
    setToggleHandoffLoading(true);
    const newHandoffState = detail.status !== 'HANDED_OFF';
    try {
      const res = await fetch(
        `${API}/vendors/${getVendorId()}/conversations/${detail.customerId}/handoff`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handoff: newHandoffState }) }
      );
      if (res.ok) {
        const updatedStatus = newHandoffState ? 'HANDED_OFF' as const : 'ACTIVE' as const;
        setDetail(prev => prev ? { ...prev, status: updatedStatus } : null);
        setConversations(prev => prev.map(c => c.id === detail.customerId ? { ...c, status: updatedStatus } : c));
      }
    } catch (err) {
      console.error('Handoff toggle failed:', err);
    } finally {
      setToggleHandoffLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !detail) return;
    setSendLoading(true);
    try {
      const res = await fetch(
        `${API}/vendors/${getVendorId()}/conversations/${detail.customerId}/messages`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: typedMessage.trim(), text: typedMessage.trim() }) }
      );
      if (res.ok) {
        const newMsg: Message = { id: 'temp-' + Date.now(), role: 'assistant', content: typedMessage.trim(), timestamp: new Date().toISOString() };
        setDetail(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null);
        setTypedMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendLoading(false);
    }
  };

  const handleSelectConv = (id: string) => {
    setSelectedId(id);
    setMobileView('chat');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages?.length]);

  useEffect(() => {
    loadList();
    const interval = setInterval(() => loadList(true), 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  // Periodic silent refresh of open conversation
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => loadDetail(selectedId, true), 10000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const isHandoff = detail?.status === 'HANDED_OFF';

  return (
    <div className="app-shell conv-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="conversations" />

      <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', padding: 0, overflow: 'hidden' }}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.1rem 1.5rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {/* Mobile back button */}
          {mobileView === 'chat' && (
            <button
              className="conv-back-btn btn-ghost"
              onClick={handleBackToList}
              style={{ marginRight: '0.75rem', padding: '0.4rem 0.6rem', display: 'none', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
              Live Conversations
            </h1>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-3)', margin: '0.15rem 0 0' }}>
              Last updated {fmtTime(lastRefreshed.toISOString())}
            </p>
          </div>
          <button className="btn-ghost" onClick={() => loadList()} disabled={loadingList} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            <RefreshCw size={13} style={{ animation: loadingList ? 'spin-slow 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* ── Panel split ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── Left: conversation list ── */}
          <div
            className={`conv-list-panel${mobileView === 'chat' ? ' conv-mobile-hidden' : ''}`}
            style={{ width: 300, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}
          >
            {/* Search + filter */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <MessageCircle size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  className="input"
                  value={convSearch}
                  onChange={e => setConvSearch(e.target.value)}
                  placeholder="Search conversations…"
                  style={{ paddingLeft: '2.1rem', fontSize: '0.8rem', padding: '0.48rem 0.75rem 0.48rem 2.1rem', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {(['all', 'active', 'handoff'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setConvFilter(f)}
                    style={{
                      padding: '0.22rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      border: '1px solid',
                      borderColor: convFilter === f ? 'var(--brand)' : 'var(--border)',
                      background: convFilter === f ? 'rgba(22,163,74,0.1)' : 'transparent',
                      color: convFilter === f ? 'var(--brand)' : 'var(--text-3)',
                      transition: 'all 0.12s',
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingList && conversations.length === 0 ? (
                <div style={{ padding: '1rem', display: 'grid', gap: '0.6rem' }}>
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 10 }} />)}
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
                  <div className="empty-state-icon"><MessageSquare size={18} color="var(--text-3)" /></div>
                  <p style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-2)', margin: '0 0 0.2rem' }}>No conversations</p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-3)', margin: 0 }}>
                    {conversations.length === 0 ? 'Connect WhatsApp and wait for messages.' : 'No matches for this filter.'}
                  </p>
                </div>
              ) : (
                filteredConvs.map(c => {
                  const isSelected = selectedId === c.id;
                  const cHandoff = c.status === 'HANDED_OFF';
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConv(c.id)}
                      style={{
                        padding: '0.8rem 1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(22,163,74,0.06)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent',
                        transition: 'background 0.12s, border-color 0.12s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: cHandoff ? 'rgba(245,158,11,0.15)' : 'rgba(22,163,74,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.72rem', fontWeight: 800,
                          color: cHandoff ? '#f59e0b' : 'var(--brand)',
                          letterSpacing: '0.02em',
                        }}>
                          {getAvatar(c.customer)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>{maskPhone(c.customer)}</span>
                            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-3)', flexShrink: 0, marginLeft: '0.5rem' }}>{fmtTime(c.timestamp)}</span>
                          </div>
                          <p style={{ margin: '0 0 0.3rem', fontSize: '0.76rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.lastMessage || 'No messages yet'}
                          </p>
                          <span style={{
                            display: 'inline-block',
                            background: cHandoff ? 'rgba(245,158,11,0.12)' : 'rgba(22,163,74,0.08)',
                            color: cHandoff ? '#f59e0b' : 'var(--brand)',
                            fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                          }}>
                            {cHandoff ? 'Handoff' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: chat detail ── */}
          <div
            className={`conv-chat-panel${mobileView === 'list' ? ' conv-mobile-hidden' : ''}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {selectedId === null ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', padding: '2rem', gap: '0.75rem' }}>
                <MessageSquare size={40} style={{ strokeWidth: 1.2 }} />
                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-2)' }}>Select a conversation</p>
                <p style={{ margin: 0, fontSize: '0.78rem', textAlign: 'center', maxWidth: 260 }}>Tap any customer on the left to monitor and respond to their chat.</p>
              </div>
            ) : loadingDetail && !detail ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={24} color="var(--brand)" style={{ animation: 'spin-slow 1s linear infinite' }} />
              </div>
            ) : detail ? (
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Chat column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                  {/* Chat header */}
                  <div style={{
                    padding: '0.9rem 1.25rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: isHandoff ? 'rgba(245,158,11,0.15)' : 'rgba(22,163,74,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 800,
                        color: isHandoff ? '#f59e0b' : 'var(--brand)',
                      }}>
                        {getAvatar(detail.customer)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {maskPhone(detail.phoneNumber || detail.customer)}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isHandoff ? '#f59e0b' : '#22c55e', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                            {isHandoff ? 'Awaiting your reply' : 'AI is handling this chat'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {/* Summary toggle (desktop) */}
                      <button
                        className="btn-ghost conv-summary-toggle"
                        onClick={() => setSummaryOpen(o => !o)}
                        style={{ padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                        title={summaryOpen ? 'Hide summary' : 'Show summary'}
                      >
                        {summaryOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                      </button>

                      <button
                        onClick={toggleHandoff}
                        disabled={toggleHandoffLoading}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.5rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.15s', whiteSpace: 'nowrap',
                          background: isHandoff ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)',
                          color: isHandoff ? 'var(--brand)' : '#f59e0b',
                          border: `1px solid ${isHandoff ? 'rgba(22,163,74,0.25)' : 'rgba(245,158,11,0.25)'}` as any,
                        }}
                      >
                        {toggleHandoffLoading ? (
                          <Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} />
                        ) : isHandoff ? <Bot size={14} /> : <User size={14} />}
                        {isHandoff ? 'Resume Bot' : 'Take Over'}
                      </button>
                    </div>
                  </div>

                  {/* Messages feed */}
                  <div style={{
                    flex: 1, overflowY: 'auto', padding: '1.25rem',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                    background: 'rgba(255,255,255,0.015)',
                  }}>
                    {detail.messages.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: '0.5rem' }}>
                        <AlertCircle size={22} />
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>No messages recorded yet</p>
                      </div>
                    ) : (
                      detail.messages.map((m) => {
                        const isUser = m.role === 'user';
                        return (
                          <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                            <div style={{
                              background: isUser ? 'var(--surface)' : 'rgba(22,163,74,0.14)',
                              color: 'var(--text)',
                              border: `1px solid ${isUser ? 'var(--border-subtle)' : 'rgba(22,163,74,0.18)'}`,
                              borderRadius: isUser ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
                              padding: '0.55rem 0.85rem',
                              maxWidth: '72%',
                              fontSize: '0.84rem',
                              lineHeight: 1.55,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                              whiteSpace: 'pre-line',
                            }}>
                              {m.content}
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '0.25rem', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                {fmtTime(m.timestamp)}
                                {!isUser && <span style={{ color: 'var(--brand)', letterSpacing: '-1px' }}>✓✓</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Footer */}
                  {isHandoff ? (
                    <form onSubmit={handleSendMessage} style={{
                      padding: '0.75rem 1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)',
                      display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0,
                    }}>
                      <input
                        type="text"
                        className="input"
                        value={typedMessage}
                        onChange={e => setTypedMessage(e.target.value)}
                        placeholder="Type a reply…"
                        disabled={sendLoading}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any); }}}
                        style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: 8, fontSize: '0.84rem' }}
                      />
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={sendLoading || !typedMessage.trim()}
                        style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', flexShrink: 0 }}
                      >
                        {sendLoading ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Send size={14} />}
                        Send
                      </button>
                    </form>
                  ) : (
                    <div style={{
                      padding: '0.65rem 1rem', background: 'var(--surface)',
                      borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                      gap: '0.75rem', flexShrink: 0,
                    }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-3)', fontSize: '0.78rem' }}>
                        <Bot size={14} color="var(--brand)" />
                        <span>AI is managing this chat</span>
                      </div>
                      <button
                        onClick={toggleHandoff}
                        disabled={toggleHandoffLoading}
                        style={{
                          padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)',
                          background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.78rem',
                          fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                          whiteSpace: 'nowrap', transition: 'all 0.15s',
                        }}
                      >
                        <User size={13} />
                        Take Over to Reply
                      </button>
                    </div>
                  )}
                </div>

                {/* Summary sidebar */}
                {summaryOpen && (
                  <div className="conv-summary-panel" style={{
                    width: 240, background: 'var(--surface)', borderLeft: '1px solid var(--border)',
                    padding: '1.1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column',
                    gap: '1.1rem', flexShrink: 0,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Sparkles size={13} color="var(--brand)" />
                        <h4 style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>AI Summary</h4>
                      </div>
                      <div style={{
                        background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.12)',
                        borderRadius: 8, padding: '0.7rem', fontSize: '0.76rem', color: 'var(--text-2)', lineHeight: 1.65,
                      }}>
                        {detail.summary || 'No summary yet. Updates dynamically as the conversation progresses.'}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>Chat Info</h4>
                      <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.76rem' }}>
                        {[
                          ['Status', isHandoff ? 'Handed Off' : 'AI Active', isHandoff ? '#f59e0b' : 'var(--brand)'],
                          ['Phone', maskPhone(detail.phoneNumber), 'var(--text)'],
                          ['Messages', String(detail.messages.length), 'var(--text)'],
                        ].map(([label, value, color]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
                            <span style={{ color: 'var(--text-3)' }}>{label}</span>
                            <span style={{ fontWeight: 700, color: color as string, fontFamily: label === 'Phone' ? 'var(--font-mono)' : undefined, fontSize: label === 'Phone' ? '0.7rem' : undefined }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
