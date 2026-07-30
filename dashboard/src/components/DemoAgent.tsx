import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const TRIGGER_DELAY = 45000; // 45 seconds idle trigger

export default function DemoAgent() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: "Hi  Still reading? I'm Zinc - the AI sales agent that comes with every VendorMind account. Ask me anything about the product!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShown(true);
      setOpen(true);
    }, TRIGGER_DELAY);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const getSmartFallback = (userQuery: string): string => {
    const q = userQuery.toLowerCase();

    if (q.includes('what can') || q.includes('can you answer') || q.includes('cant you answer') || q.includes('questions') || q.includes('capabilities') || q.includes('what do you know')) {
      return "I can answer everything about VendorMind! Ask me about catalog uploads, WhatsApp QR pairing, BMONI cNGN payments, pricing plans (₦2k/₦5k/₦10k), human handoffs, or how your 24/7 sales agent works.";
    }
    if (q.includes('do you work') || q.includes('are you real') || q.includes('work do you') || q.includes('working')) {
      return "Yes, I am live and working right now! I'm Zinc, the AI sales assistant. Try asking me about our pricing, setting up your WhatsApp catalog, or how payment collection works.";
    }
    if (q.includes('what do') || q.includes('who are') || q.includes('what is') || q.includes('explain')) {
      return "I'm Zinc! VendorMind gives your business a 24/7 AI sales agent inside WhatsApp. I automatically answer customer questions, recommend items from your catalog, build carts, and collect payments while you sleep.";
    }
    if (q.includes('example') || q.includes('use it') || q.includes('how can i') || q.includes('sample')) {
      return "For example: A customer texts 'Do you have Red Velvet Cake in Ikeja?'. I check your inventory, confirm stock, compute delivery fee, and send a BMONI cNGN payment link - all in under 2 seconds without you opening your phone!";
    }
    if (q.includes('price') || q.includes('cost') || q.includes('how much') || q.includes('plan') || q.includes('tier') || q.includes('naira')) {
      return "We offer flexible credit plans: ₦2,000 Starter (200 replies), ₦5,000 Growth (600 replies & priority processing), and ₦10,000 Scale (1,500 replies & 3 numbers). No monthly lock-ins!";
    }
    if (q.includes('setup') || q.includes('start') || q.includes('time') || q.includes('register') || q.includes('qr')) {
      return "Setup takes under 10 minutes! Simply register, upload your product catalog (or Excel sheet), scan the WhatsApp QR code, and your AI agent goes live instantly.";
    }
    if (q.includes('payment') || q.includes('bmoni') || q.includes('transfer') || q.includes('cngn') || q.includes('bank') || q.includes('checkout')) {
      return "We integrate BMONI smart wallets natively inside WhatsApp! Customers receive instant payment links or cNGN transfers without ever leaving the chat. Stock is reserved immediately upon payment.";
    }
    if (q.includes('excel') || q.includes('csv') || q.includes('catalog') || q.includes('product') || q.includes('stock')) {
      return "You can upload your products manually or drop in an Excel/CSV file with product names, prices, and stock levels. Our AI automatically indexes your catalog semantically in under 5 minutes!";
    }
    if (q.includes('human') || q.includes('speak') || q.includes('hand off') || q.includes('takeover')) {
      return "When a customer asks to speak to a human or has an unusual request, the AI agent steps aside, flags the chat for Human Handoff, and notifies you immediately on your dashboard!";
    }

    const keywords = userQuery.split(/\s+/).filter(w => w.length > 3).slice(0, 3).join(' ');
    return `Great question about ${keywords || 'VendorMind'}! VendorMind automates 100% of your WhatsApp customer sales, catalog search, and payments. Feel free to ask me about setup time, pricing plans, or BMONI smart wallets!`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    const userMsg = { role: 'user' as const, content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/demo-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      if (res.ok) {
        const data = await res.json() as { reply: string };
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply || getSmartFallback(userText) }]);
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: getSmartFallback(userText) }]);
      }
    } catch {
      setMessages([...updatedMessages, { role: 'assistant', content: getSmartFallback(userText) }]);
    } finally {
      setLoading(false);
    }
  };

  if (!shown) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'var(--font-sans, sans-serif)' }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#25D366', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 8px 24px rgba(37,211,102,0.4)',
            transition: 'transform 0.2s ease'
          }}
          className="hover:scale-105"
        >
          <MessageCircle size={26} />
        </button>
      ) : (
        <div style={{
          width: 'min(340px, calc(100vw - 48px))', background: 'var(--surface, #161b22)', borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', border: '1px solid var(--border-subtle, #30363d)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)', padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#25D366', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '15px'
              }}>Z</div>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Zinc</div>
                <div style={{ color: '#90EE90', fontSize: '11px', fontWeight: 500 }}>VendorMind Demo · Online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            background: 'var(--bg, #0d1117)', padding: '12px', height: '280px',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                <div style={{
                  background: m.role === 'user' ? 'var(--brand, #16a34a)' : 'var(--surface-raised, #21262d)',
                  color: '#fff',
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  fontSize: '12.5px', lineHeight: 1.5,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  background: 'var(--surface-raised, #21262d)', color: 'var(--text-3, #8b949e)',
                  padding: '8px 12px', borderRadius: '4px 14px 14px 14px', fontSize: '12px',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <Loader2 size={12} style={{ animation: 'spin-slow 1s linear infinite' }} /> Zinc is typing…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', gap: '8px', padding: '10px 12px',
            borderTop: '1px solid var(--border-subtle, #30363d)', background: 'var(--surface, #161b22)'
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about VendorMind…"
              style={{
                flex: 1, border: '1px solid var(--border-subtle, #30363d)', borderRadius: '20px',
                padding: '8px 14px', fontSize: '12.5px', outline: 'none',
                background: 'var(--bg, #0d1117)', color: 'var(--text, #f0f6fc)'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background: '#25D366', border: 'none', borderRadius: '50%',
                width: '34px', height: '34px', cursor: 'pointer',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: loading || !input.trim() ? 0.5 : 1
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
