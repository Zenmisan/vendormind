import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, MessageSquare,
  Package, RefreshCw, ShoppingBag, TrendingUp, Wallet, Wifi, WifiOff, Users,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import WhatsAppConnectModal from '../components/WhatsAppConnectModal';
import AIAdvisorCard from '../components/AIAdvisorCard';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';

interface OpsData {
  queues: {
    inbound:  { waiting: number; active: number; completed: number; failed: number };
    outbound: { waiting: number; active: number; completed: number; failed: number };
  };
  activeConversations: number;
  lowBalanceVendors: Array<{ id: string; name: string; balance: number }>;
}

interface Order {
  id: string;
  customer: string;
  total: string;
  status: string;
  createdAt: string;
  items: string[];
}

const sampleOrders = [
  { id: 'VM-1042', customer: '+234 801 234 8871', total: 12500, status: 'Pending payment', time: '12 min ago' },
  { id: 'VM-1041', customer: '+234 806 811 0944', total: 7800, status: 'Paid', time: '32 min ago' },
  { id: 'VM-1040', customer: '+234 704 219 3302', total: 3000, status: 'Reserved', time: '48 min ago' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [ops, setOps] = useState<OpsData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [waConnected, setWaConnected] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const getVendorId = () => localStorage.getItem('vendorId') ?? '1';

  const load = async (isInitial = false) => {
    if (isInitial && !ops) setLoading(true);
    try {
      const [opsRes, ordersRes, waRes, walletRes] = await Promise.all([
        fetch(`${API}/ops/dashboard`),
        fetch(`${API}/vendors/${getVendorId()}/orders?limit=5`),
        fetch(`${API}/vendors/${getVendorId()}/whatsapp/status`),
        fetch(`${API}/vendors/${getVendorId()}/wallet`)
      ]);

      if (opsRes.ok) setOps(await opsRes.json());
      if (ordersRes.ok) {
        const data = await ordersRes.json() as { orders: Order[] };
        setOrders(data.orders || []);
      }
      if (waRes.ok) {
        const data = await waRes.json() as { connected: boolean; status: string };
        setWaConnected(data.connected || data.status === 'connected');
      }
      if (walletRes.ok) {
        const data = await walletRes.json() as { balance: number };
        setWalletBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      if (isInitial) setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    load(true);
    // Poll WA status quietly every 15s so disconnections/connections reflect in-place without page refresh
    const waInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/vendors/${getVendorId()}/whatsapp/status`);
        if (res.ok) {
          const data = await res.json() as { connected: boolean; status: string };
          setWaConnected(data.connected || data.status === 'connected');
          setLastRefresh(new Date());
        }
      } catch {}
    }, 15_000);
    return () => clearInterval(waInterval);
  }, []);

  const activeChats = ops?.activeConversations ?? 0;
  const failedJobs = (ops?.queues.inbound.failed ?? 0) + (ops?.queues.outbound.failed ?? 0);

  const displayOrders = orders.length > 0 ? orders : [];
  const walletLow = walletBalance !== null && walletBalance < 2.0;

  const todayRevenue = displayOrders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + Number(o.total), 0);
  const paidCount = displayOrders.filter(o => o.status === 'PAID').length;

  const stats = [
    { label: 'Revenue today', value: `₦${todayRevenue.toLocaleString()}`, sub: `${paidCount} paid orders`, Icon: TrendingUp, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
    { label: 'Orders today', value: displayOrders.length, sub: 'AI-processed orders', Icon: ShoppingBag, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Conversations', value: activeChats, sub: `${failedJobs} need attention`, Icon: MessageSquare, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Credits left', value: walletBalance !== null ? `₦${Number(walletBalance).toFixed(2)}` : '-', sub: walletLow ? '⚠ Top up soon' : 'Wallet healthy', Icon: Wallet, color: walletLow ? '#ef4444' : '#14b8a6', bg: walletLow ? 'rgba(239,68,68,0.1)' : 'rgba(20,184,166,0.1)' },
  ];

  const weekBars = [
    { label: 'Mon', h: 40 }, { label: 'Tue', h: 65 }, { label: 'Wed', h: 50 },
    { label: 'Thu', h: 80 }, { label: 'Fri', h: 45 }, { label: 'Sat', h: 90 },
    { label: 'Today', h: 70, today: true },
  ];

  const inboundTotal = ops?.queues.inbound.completed ?? 23;
  const funnelSteps = [
    { label: 'Messaged', count: inboundTotal, pct: 100 },
    { label: 'Browsed', count: Math.round(inboundTotal * 0.78), pct: 78 },
    { label: 'Added cart', count: Math.round(inboundTotal * 0.52), pct: 52 },
    { label: 'Paid', count: paidCount || Math.round(inboundTotal * 0.30), pct: 30 },
  ];

  const getOutcomeTag = (status: string) => {
    if (status === 'PAID') return { label: 'Paid', bg: 'rgba(22,163,74,0.1)', color: '#16a34a' };
    if (status === 'HANDOFF') return { label: 'Handoff', bg: 'rgba(245,158,11,0.1)', color: '#d97706' };
    if (status === 'PENDING') return { label: 'Active', bg: 'rgba(99,102,241,0.1)', color: '#6366f1' };
    return { label: 'Browsing', bg: 'var(--border-subtle)', color: 'var(--text-3)' };
  };

  const getInitials = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-4, -2).toUpperCase() || 'VM';
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="dashboard" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem', overflowX: 'hidden' }}>
        <div className="page-header animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            {waConnected ? (
              <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '0.65rem' }}>
                <Wifi size={13} />
                WhatsApp agent online
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                  <WifiOff size={13} />
                  WhatsApp agent offline
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setShowReconnectModal(true)}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}
                >
                  Reconnect
                </button>
              </div>
            )}
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

        {/* ── AI Business Advisor Card ────────────────────────────────────── */}
        <AIAdvisorCard />

        <div className="stat-grid animate-fade-up-1" style={{ marginBottom: '1.5rem' }}>
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

        {/* Revenue chart + Conversion funnel row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="animate-fade-up-2">
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Revenue this week</h2>
              <button className="btn-ghost" onClick={() => navigate('/insights')} style={{ padding: '0.3rem 0.7rem', fontSize: '0.74rem' }}>
                View all <ArrowRight size={11} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 90, marginBottom: '0.75rem' }}>
              {weekBars.map(b => (
                <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: b.h, borderRadius: '4px 4px 0 0', background: b.today ? 'var(--brand)' : 'rgba(22,163,74,0.2)', transition: 'height 0.3s' }} />
                  <span style={{ fontSize: '0.65rem', color: b.today ? 'var(--brand)' : 'var(--text-3)', fontWeight: b.today ? 700 : 400 }}>{b.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-3)' }}>
              <span>Total: <span className="mono" style={{ color: 'var(--text-2)', fontWeight: 700 }}>₦{(todayRevenue * 3.5).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} est.</span></span>
              <span style={{ color: '#16a34a' }}>Best day: Sat</span>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 1rem' }}>Conversion funnel</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {funnelSteps.map(step => (
                <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-3)', width: 72, flexShrink: 0 }}>{step.label}</span>
                  <div style={{ flex: 1, background: 'var(--border-subtle)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${step.pct}%`, height: '100%', background: 'var(--brand)', borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-2)', fontWeight: 700, width: 24, textAlign: 'right' }}>{loading ? '-' : step.count}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.74rem', color: 'var(--text-3)' }}>
              Conversion rate: <span style={{ color: '#16a34a', fontWeight: 700 }}>{paidCount && inboundTotal ? Math.round((paidCount / inboundTotal) * 100) : 30}%</span>
            </p>
          </div>
        </div>

        {/* Recent conversations + Alerts */}
        <div className="dashboard-grid animate-fade-up-3">
          <section className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Recent conversations</h2>
              <button className="btn-ghost" onClick={() => navigate('/conversations')} style={{ padding: '0.3rem 0.7rem', fontSize: '0.74rem' }}>
                View all <ArrowRight size={11} />
              </button>
            </div>
            {loading ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div className="skeleton" style={{ height: 52 }} />
                <div className="skeleton" style={{ height: 52 }} />
                <div className="skeleton" style={{ height: 52 }} />
              </div>
            ) : displayOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-3)' }}>
                <Users size={24} style={{ strokeWidth: 1.5, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>No conversations yet</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem' }}>Customers will appear here when they message your agent.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {displayOrders.map(order => {
                  const tag = getOutcomeTag(order.status);
                  const initials = getInitials(order.customer);
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate('/conversations')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', background: 'var(--bg)', borderRadius: 8, cursor: 'pointer' }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: tag.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: tag.color, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)' }}>{order.customer}</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Order #{order.id} · ₦{Number(order.total).toLocaleString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="badge" style={{ background: tag.bg, color: tag.color, fontSize: '0.68rem', padding: '2px 7px' }}>{tag.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.875rem' }}>Alerts</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {walletLow && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.7rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                    <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>Wallet low</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-3)' }}>Balance: ₦{Number(walletBalance).toFixed(2)}</p>
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/wallet')} style={{ marginLeft: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.72rem', height: 'auto', flexShrink: 0 }}>Top up</button>
                  </div>
                )}
                {failedJobs > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.7rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                    <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>Queue failures</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-3)' }}>{failedJobs} failed jobs</p>
                    </div>
                  </div>
                )}
                {!waConnected && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.7rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                    <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>WhatsApp offline</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-3)' }}>Agent not receiving messages</p>
                    </div>
                    <button className="btn-ghost" onClick={() => setShowReconnectModal(true)} style={{ marginLeft: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.72rem', height: 'auto', flexShrink: 0 }}>Reconnect</button>
                  </div>
                )}
                {!walletLow && failedJobs === 0 && waConnected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 8 }}>
                    <Package size={15} color="#16a34a" />
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>All systems healthy</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.875rem' }}>Quick actions</h2>
              {[
                { Icon: Package, text: 'Update catalog', path: '/products' },
                { Icon: ShoppingBag, text: 'View all orders', path: '/orders' },
                { Icon: Wallet, text: 'Wallet & billing', path: '/wallet' },
              ].map(({ Icon, text, path }) => (
                <div
                  key={text}
                  onClick={() => navigate(path)}
                  style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  <Icon size={14} color="var(--text-3)" />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-2)', fontWeight: 600 }}>{text}</span>
                  <ArrowRight size={12} color="var(--text-3)" style={{ marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      {showReconnectModal && (
        <WhatsAppConnectModal
          vendorId={getVendorId()}
          onConnected={() => {
            setWaConnected(true);
            setShowReconnectModal(false);
          }}
          onClose={() => setShowReconnectModal(false)}
        />
      )}
    </div>
  );
}
