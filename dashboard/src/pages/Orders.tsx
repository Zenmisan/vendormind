import { useState, useEffect } from 'react';
import {
  CheckCircle, Clock3, CreditCard, Eye, PackageCheck, RefreshCw,
  Search, ShoppingBag, Truck, XCircle,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const VENDOR_ID = '1';

type OrderStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'DELIVERED';

interface Order {
  id: string;
  customer: string;
  total: string;
  status: OrderStatus;
  createdAt: string;
  expiresIn?: string;
  items: string[];
  payment: 'Awaiting Nomba payment' | 'Paid via Nomba' | 'Expired' | 'Fulfilled';
}

const statusStyle: Record<OrderStatus, { bg: string; color: string; Icon: any }> = {
  PENDING:   { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', Icon: Clock3 },
  PAID:      { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a', Icon: CheckCircle },
  CANCELED:  { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', Icon: XCircle },
  DELIVERED: { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', Icon: Truck },
};

const sampleOrders: Order[] = [
  {
    id: 'VM-1042',
    customer: '+234 801 234 8871',
    total: '12500',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    expiresIn: '18 min left',
    items: ['3x Party Jollof Rice', '2x Chapman Bottle'],
    payment: 'Awaiting Nomba payment',
  },
  {
    id: 'VM-1041',
    customer: '+234 806 811 0944',
    total: '7800',
    status: 'PAID',
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    items: ['2x Small Chops Combo', '1x Chapman Bottle'],
    payment: 'Paid via Nomba',
  },
  {
    id: 'VM-1040',
    customer: '+234 704 219 3302',
    total: '3000',
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    items: ['1x Small Chops Combo'],
    payment: 'Fulfilled',
  },
  {
    id: 'VM-1039',
    customer: '+234 905 117 0024',
    total: '2500',
    status: 'CANCELED',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    items: ['1x Party Jollof Rice'],
    payment: 'Expired',
  },
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/orders`);
      if (!res.ok) { console.error('Orders fetch failed:', res.status); setOrders([]); return; }
      const data = await res.json() as { orders?: Order[] };
      setOrders(data.orders ?? []);
    } catch (err) {
      console.error('Orders fetch error:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const displayOrders = orders.length ? orders : sampleOrders;
  const usingSamples = orders.length === 0;
  const filtered = displayOrders.filter(o => {
    const q = query.toLowerCase();
    const matchQ = query === '' || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.items.join(' ').toLowerCase().includes(q);
    const matchS = statusFilter === 'ALL' || o.status === statusFilter;
    return matchQ && matchS;
  });

  const totals = {
    pending: displayOrders.filter(o => o.status === 'PENDING').length,
    paid: displayOrders.filter(o => o.status === 'PAID').length,
    delivered: displayOrders.filter(o => o.status === 'DELIVERED').length,
    revenue: displayOrders.filter(o => ['PAID', 'DELIVERED'].includes(o.status)).reduce((sum, o) => sum + Number(o.total), 0),
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="orders" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem' }}>
        <div className="page-header animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              Orders
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              Track payment, reservation, and fulfilment status.
            </p>
          </div>
          <button className="btn-ghost" onClick={load}>
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        <div className="stat-grid animate-fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Pending payment', value: totals.pending, Icon: Clock3, color: '#d97706', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Paid orders', value: totals.paid, Icon: CreditCard, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
            { label: 'Delivered', value: totals.delivered, Icon: PackageCheck, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            { label: 'Paid revenue', value: `₦${totals.revenue.toLocaleString()}`, Icon: ShoppingBag, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-icon" style={{ background: s.bg }}>
                <s.Icon size={17} color={s.color} />
              </div>
              <div className="stat-card-value mono">{loading ? '...' : s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        <section className="card animate-fade-up-2" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          <div className="catalog-toolbar">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by order ID, customer, or item..." style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div className="filter-pills">
              {(['ALL', 'PENDING', 'PAID', 'DELIVERED', 'CANCELED'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? 'filter-pill active' : 'filter-pill'}>
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--text-2)' }}>
            {usingSamples ? 'Showing sample orders until the live orders endpoint is connected.' : `${orders.length} live orders loaded.`}
          </p>
        </section>

        <div className="card animate-fade-up-3" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '2rem 1.5rem', display: 'grid', gap: '0.75rem' }}>
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 54, borderRadius: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ShoppingBag size={22} color="var(--text-3)" /></div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.25rem', color: 'var(--text-2)' }}>No orders match this view</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: 0 }}>Try another status filter or search term.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => {
                    const s = statusStyle[o.status];
                    const StatusIcon = s.Icon;
                    return (
                      <tr key={o.id}>
                        <td>
                          <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 800 }}>{o.id}</span>
                          <p style={{ margin: '0.15rem 0 0', color: 'var(--text-3)', fontSize: '0.74rem' }}>
                            {new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </p>
                        </td>
                        <td style={{ fontWeight: 700 }}>{o.customer}</td>
                        <td>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{o.items.join(', ')}</p>
                        </td>
                        <td><span className="mono" style={{ fontWeight: 800 }}>₦{Number(o.total).toLocaleString()}</span></td>
                        <td>
                          <span className="badge" style={{ background: s.bg, color: s.color }}>
                            <StatusIcon size={12} />
                            {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                          </span>
                          {o.expiresIn && <p style={{ margin: '0.35rem 0 0', color: '#d97706', fontSize: '0.72rem' }}>{o.expiresIn}</p>}
                        </td>
                        <td style={{ color: 'var(--text-2)', fontSize: '0.8rem' }}>{o.payment}</td>
                        <td>
                          <button className="btn-ghost" style={{ padding: '0.45rem 0.7rem' }}>
                            <Eye size={13} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
