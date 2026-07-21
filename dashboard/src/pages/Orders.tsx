import { useState, useEffect } from 'react';
import {
  CheckCircle, Clock3, CreditCard, Eye, PackageCheck, RefreshCw,
  Search, ShoppingBag, Truck, XCircle, Download, X, Loader2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';

type OrderStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'DELIVERED';

interface Order {
  id: string;
  customer: string;
  total: string;
  status: OrderStatus;
  createdAt: string;
  items: string[];
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
    items: ['3x Party Jollof Rice', '2x Chapman Bottle'],
  },
  {
    id: 'VM-1041',
    customer: '+234 806 811 0944',
    total: '7800',
    status: 'PAID',
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    items: ['2x Small Chops Combo', '1x Chapman Bottle'],
  },
  {
    id: 'VM-1040',
    customer: '+234 704 219 3302',
    total: '3000',
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    items: ['1x Small Chops Combo'],
  },
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');

  // Drawer status
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const VENDOR_ID = localStorage.getItem('vendorId') ?? '1';

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

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        load();
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const exportCSV = () => {
    const headers = 'Order ID,Customer,Items,Total,Status,Date\n';
    const rows = filtered.map(o => 
      `"${o.id}","${o.customer}","${o.items.join('; ')}","₦${Number(o.total)}","${o.status}","${new Date(o.createdAt).toLocaleDateString()}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vendormind_orders_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const getPaymentStatusText = (status: OrderStatus) => {
    if (status === 'PENDING') return 'Awaiting payment';
    if (status === 'PAID') return 'Paid via Monnify';
    if (status === 'DELIVERED') return 'Fulfilled';
    return 'Expired / Cancelled';
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="orders" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem' }}>
        {/* Header */}
        <div className="page-header animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              Orders
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              Track payment, stock reservation, and fulfilment status.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button className="btn-ghost" onClick={load}>
              <RefreshCw size={13} />
              Refresh
            </button>
            <button className="btn-ghost" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid animate-fade-up-1" style={{ marginBottom: '1.25rem' }}>
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

        {/* Toolbar */}
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

        {/* Table list */}
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
                    <th>Order ID</th>
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
                    const s = statusStyle[o.status] || statusStyle.PENDING;
                    const StatusIcon = s.Icon;
                    return (
                      <tr key={o.id}>
                        <td>
                          <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 800 }}>#{o.id}</span>
                          <p style={{ margin: '0.15rem 0 0', color: 'var(--text-3)', fontSize: '0.74rem' }}>
                            {new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </p>
                        </td>
                        <td style={{ fontWeight: 700 }}>{o.customer}</td>
                        <td>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
                            {o.items.join(', ')}
                          </p>
                        </td>
                        <td><span className="mono" style={{ fontWeight: 800 }}>₦{Number(o.total).toLocaleString()}</span></td>
                        <td>
                          <span className="badge" style={{ background: s.bg, color: s.color }}>
                            <StatusIcon size={12} />
                            {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-2)', fontSize: '0.8rem' }}>
                          {getPaymentStatusText(o.status)}
                        </td>
                        <td>
                          <button className="btn-ghost" onClick={() => setSelectedOrder(o)} style={{ padding: '0.45rem 0.7rem' }}>
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

      {/* ── Order Detail Drawer Slide-over ────────────────────────── */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(13,17,23,0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', justifyContent: 'flex-end'
        }}>
          {/* Drawer container */}
          <div className="card-raised" style={{
            width: '100%', maxWidth: 440, height: '100%', background: 'var(--surface)',
            boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.2s ease both', borderLeft: '1px solid var(--border)'
          }}>
            {/* Drawer Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0
            }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Order Details
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '0.15rem 0 0' }}>
                  ID: #{selectedOrder.id}
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedOrder(null)} style={{ padding: '0.4rem', border: 'none' }}>
                <X size={16} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
              {/* Status and Actions Card */}
              <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '0.875rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Current Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span className="badge" style={{
                      background: statusStyle[selectedOrder.status]?.bg || 'rgba(0,0,0,0.05)',
                      color: statusStyle[selectedOrder.status]?.color || 'var(--text-2)',
                      fontSize: '0.8rem', padding: '0.35rem 0.75rem'
                    }}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {!usingSamples ? (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Override Status</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        className="btn-ghost"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('DELIVERED')}
                        style={{ fontSize: '0.75rem', padding: '0.5rem', justifyContent: 'center' }}
                      >
                        <Truck size={12} /> Mark Delivered
                      </button>
                      <button
                        className="btn-ghost"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('CANCELED')}
                        style={{ fontSize: '0.75rem', padding: '0.5rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)', justifyContent: 'center' }}
                      >
                        <XCircle size={12} /> Cancel Order
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
                    Status overrides are locked on demo sample orders. Register and connect a live store to test live state management.
                  </p>
                )}
              </div>

              {/* Order Info */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.04em', margin: '0 0 0.75rem' }}>
                  Customer Details
                </h4>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-2)' }}>WhatsApp Number</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{selectedOrder.customer}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-2)' }}>Date Created</span>
                    <span className="mono">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.04em', margin: '0 0 0.75rem' }}>
                  Order Items
                </h4>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between',
                      borderBottom: idx === selectedOrder.items.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                      fontSize: '0.84rem'
                    }}>
                      <span style={{ fontWeight: 600 }}>{item}</span>
                    </div>
                  ))}
                  <div style={{
                    padding: '1rem', background: 'var(--surface-raised)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 800
                  }}>
                    <span>Total Amount</span>
                    <span className="mono" style={{ color: 'var(--brand)', fontSize: '1rem' }}>
                      ₦{Number(selectedOrder.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
