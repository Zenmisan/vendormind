import { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const statusStyle: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  PAID:      { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a' },
  CANCELED:  { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  DELIVERED: { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    setOrders([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    const matchQ = query === '' || o.id?.includes(query) || o.customer?.includes(query);
    const matchS = statusFilter === 'ALL' || o.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="orders" />

      <main style={{ flex: 1, padding: '2rem 2.5rem' }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>
              Orders
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              {orders.length} total orders
            </p>
          </div>
          <button className="btn-ghost" onClick={load} style={{ marginTop: '0.25rem' }}>
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="animate-fade-up-1" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by order ID or customer..."
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            {['ALL', 'PENDING', 'PAID', 'CANCELED', 'DELIVERED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.15s, color 0.15s',
                  background: statusFilter === s ? 'var(--text)' : 'var(--surface)',
                  color: statusFilter === s ? '#fff' : 'var(--text-2)',
                  boxShadow: statusFilter === s ? 'none' : 'var(--shadow-xs)',
                  outline: statusFilter === s ? 'none' : '1px solid var(--border)',
                }}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card animate-fade-up-2" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <ShoppingBag size={22} color="var(--text-3)" />
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 0.25rem', color: 'var(--text-2)' }}>No orders yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: 0 }}>Orders appear here once customers checkout</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const s = (statusStyle[o.status as string] ?? statusStyle['CANCELED'])!;
                  return (
                    <tr key={o.id}>
                      <td>
                        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                          #{String(o.id).slice(-6)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.customer}</td>
                      <td>
                        <span className="mono" style={{ fontWeight: 600 }}>
                          ₦{Number(o.total).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: s.bg, color: s.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                          {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
