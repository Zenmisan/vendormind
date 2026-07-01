import { useState, useEffect } from 'react';
import {
  AlertTriangle, ArrowRight, CheckCircle, CreditCard, MessageSquare,
  Package, RefreshCw, Send, ShoppingBag, TrendingUp, Wallet, Wifi,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';

interface OpsData {
  queues: {
    inbound:  { waiting: number; active: number; completed: number; failed: number };
    outbound: { waiting: number; active: number; completed: number; failed: number };
  };
  activeConversations: number;
  lowBalanceVendors: Array<{ id: string; name: string; balance: number }>;
}

const sampleOrders = [
  { id: 'VM-1042', customer: '+234 801 234 8871', total: 12500, status: 'Pending payment', time: '12 min ago' },
  { id: 'VM-1041', customer: '+234 806 811 0944', total: 7800, status: 'Paid', time: '32 min ago' },
  { id: 'VM-1040', customer: '+234 704 219 3302', total: 3000, status: 'Reserved', time: '48 min ago' },
];

export default function Dashboard() {
  const [ops, setOps] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ops/dashboard`);
      if (res.ok) setOps(await res.json() as OpsData);
    } catch {}
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => { load(); }, []);

  const activeChats = ops?.activeConversations ?? 0;
  const inboundDone = ops?.queues.inbound.completed ?? 0;
  const outboundDone = ops?.queues.outbound.completed ?? 0;
  const failedJobs = (ops?.queues.inbound.failed ?? 0) + (ops?.queues.outbound.failed ?? 0);
  const lowBalance = ops?.lowBalanceVendors[0];

  const stats = [
    { label: 'Active chats', value: activeChats, sub: 'Customers in conversation', Icon: MessageSquare, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Messages handled', value: inboundDone.toLocaleString(), sub: 'Inbound customer messages', Icon: TrendingUp, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
    { label: 'Replies sent', value: outboundDone.toLocaleString(), sub: 'Agent responses delivered', Icon: Send, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Needs attention', value: failedJobs, sub: 'Failed queue jobs', Icon: AlertTriangle, color: failedJobs ? '#ef4444' : '#14b8a6', bg: failedJobs ? 'rgba(239,68,68,0.1)' : 'rgba(20,184,166,0.1)' },
  ];

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="dashboard" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem', overflowX: 'hidden' }}>
        <div className="page-header animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '0.65rem' }}>
              <Wifi size={13} />
              WhatsApp agent online
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Store overview
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button className="btn-ghost" onClick={load} disabled={loading} style={{ marginTop: '0.25rem' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin-slow 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        <div className="stat-grid animate-fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-icon" style={{ background: s.bg }}>
                <s.Icon size={17} color={s.color} />
              </div>
              <div className="stat-card-value mono">{loading ? '...' : s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid animate-fade-up-2" style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.65fr', gap: '1.25rem' }}>
          <section className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Recent orders</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0.2rem 0 0' }}>Preview until live order endpoint is connected</p>
              </div>
              <a className="btn-ghost" href="/orders" style={{ textDecoration: 'none' }}>
                View all <ArrowRight size={13} />
              </a>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {sampleOrders.map(order => (
                <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', padding: '0.9rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>{order.id}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: 'var(--text-3)' }}>{order.customer} · {order.time}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="mono" style={{ margin: 0, fontWeight: 800 }}>₦{order.total.toLocaleString()}</p>
                    <span className="badge" style={{ marginTop: '0.25rem', background: order.status === 'Paid' ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', color: order.status === 'Paid' ? '#16a34a' : '#d97706' }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside style={{ display: 'grid', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Wallet size={16} color="var(--brand)" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Wallet health</h2>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 80 }} />
              ) : lowBalance ? (
                <>
                  <p style={{ margin: 0, color: '#d97706', fontWeight: 800 }}>{lowBalance.name} needs top up</p>
                  <p style={{ margin: '0.35rem 0 1rem', color: 'var(--text-3)', fontSize: '0.8rem' }}>Balance: ₦{(lowBalance.balance * 500).toFixed(0)}</p>
                  <button className="btn-primary" style={{ width: '100%' }}>Top up wallet</button>
                </>
              ) : (
                <div className="success-panel" style={{ padding: '0.9rem' }}>
                  <CheckCircle size={18} color="var(--brand)" />
                  <div>
                    <p>Wallet is healthy</p>
                    <span>Automation can continue normally.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 1rem' }}>Next setup actions</h2>
              {[
                { Icon: Package, text: 'Upload or refresh catalog' },
                { Icon: CreditCard, text: 'Confirm Nomba checkout settings' },
                { Icon: ShoppingBag, text: 'Review order fulfilment flow' },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Icon size={15} color="var(--text-3)" />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-2)', fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
