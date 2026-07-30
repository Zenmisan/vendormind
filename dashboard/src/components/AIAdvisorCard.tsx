import { useState, useEffect } from 'react';
import { Sparkles, Send, TrendingUp, TrendingDown, AlertTriangle, MessageSquare, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const getVendorId = () => localStorage.getItem('vendorId') ?? '1';

export default function AIAdvisorCard() {
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<string>('');
  const [snapshot, setSnapshot] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const loadBriefing = async () => {
    setLoading(true);
    try {
      const vId = getVendorId();
      const res = await fetch(`${API}/vendors/${vId}/advisor/today`);
      if (res.ok) {
        const data = await res.json() as { briefingText: string; snapshot: any };
        setBriefing(data.briefingText);
        setSnapshot(data.snapshot);
      } else {
        setBriefing("Welcome! Your AI Advisor will analyze your sales metrics and compile your morning briefing here.");
      }
    } catch {
      setBriefing("Good morning! Track your catalog sales and customer orders here.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefing();
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || chatLoading) return;
    const userQ = question.trim();
    const newHistory = [...history, { role: 'user' as const, content: userQ }];
    setHistory(newHistory);
    setQuestion('');
    setChatLoading(true);

    try {
      const vId = getVendorId();
      const res = await fetch(`${API}/vendors/${vId}/advisor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQ, history: newHistory }),
      });
      if (res.ok) {
        const data = await res.json() as { reply: string };
        setHistory([...newHistory, { role: 'assistant', content: data.reply }]);
      } else {
        setHistory([...newHistory, { role: 'assistant', content: "Sorry, I couldn't process your request right now." }]);
      }
    } catch {
      setHistory([...newHistory, { role: 'assistant', content: "Network error asking AI Advisor." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(13, 17, 23, 0.95) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(22, 163, 74, 0.3)',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      fontFamily: 'var(--font-sans, sans-serif)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px',
        background: 'radial-gradient(circle, rgba(22, 163, 74, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: 6 }}>
              AI Business Advisor
              <span style={{ fontSize: '10px', background: 'rgba(22,163,74,0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>24H BRIEFING</span>
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3, #8b949e)' }}>Daily revenue insights & store recommendations</p>
          </div>
        </div>

        <button
          onClick={loadBriefing}
          disabled={loading}
          style={{ background: 'none', border: 'none', color: 'var(--text-3, #8b949e)', cursor: 'pointer', padding: 4 }}
          title="Refresh briefing"
        >
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Metric chips */}
      {snapshot && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3, #8b949e)' }}>Revenue Today</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
              ₦{snapshot.revenueToday.toLocaleString()}
              {snapshot.revenueChangePercent >= 0 ? (
                <span style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center' }}><TrendingUp size={12} />+{snapshot.revenueChangePercent}%</span>
              ) : (
                <span style={{ fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center' }}><TrendingDown size={12} />{snapshot.revenueChangePercent}%</span>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3, #8b949e)' }}>Orders Today</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f0f6fc' }}>{snapshot.ordersToday} <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 400 }}>({snapshot.ordersPending} pending)</span></div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3, #8b949e)' }}>New Customers</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#60a5fa' }}>+{snapshot.newCustomersToday}</div>
          </div>

          {snapshot.lowStockItems.length > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={12} /> Low Stock Alert
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fca5a5' }}>{snapshot.lowStockItems.length} items left &le; 5</div>
            </div>
          )}
        </div>
      )}

      {/* Briefing text body */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '14px 16px',
        fontSize: '13px', lineHeight: 1.6, color: '#e6edf3', borderLeft: '3px solid #16a34a',
        marginBottom: '14px', whitespace: 'pre-line'
      }}>
        {loading ? (
          <div style={{ color: 'var(--text-3, #8b949e)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating your AI morning briefing…
          </div>
        ) : (
          briefing
        )}
      </div>

      {/* Q&A Accordion toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: 0
          }}
        >
          <MessageSquare size={15} />
          {chatOpen ? 'Hide Advisor Q&A' : 'Ask Advisor a Question'}
          {chatOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Interactive Q&A chat drawer */}
      {chatOpen && (
        <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
          {history.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '180px', overflowY: 'auto' }}>
              {history.map((h, idx) => (
                <div key={idx} style={{
                  alignSelf: h.role === 'user' ? 'flex-end' : 'flex-start',
                  background: h.role === 'user' ? '#16a34a' : 'rgba(255,255,255,0.06)',
                  color: '#fff', padding: '8px 12px', borderRadius: '10px', fontSize: '12.5px', maxWidth: '85%'
                }}>
                  {h.content}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAsk} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Which item had the highest margin yesterday?"
              style={{
                flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle, #30363d)',
                borderRadius: '8px', padding: '8px 12px', fontSize: '12.5px', color: '#fff', outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={chatLoading || !question.trim()}
              style={{
                background: '#16a34a', border: 'none', borderRadius: '8px', padding: '0 14px',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: chatLoading || !question.trim() ? 0.5 : 1
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
