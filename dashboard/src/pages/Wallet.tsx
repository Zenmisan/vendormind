import { useState, useEffect } from 'react';
import {
  Wallet, RefreshCw, Plus, CheckCircle, Clock, TrendingUp, CreditCard,
  MessageCircle, Send, Sparkles, Loader2, DollarSign, ChevronDown
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const VENDOR_ID = localStorage.getItem('vendorId') ?? '1';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('2000');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/wallet`);
      if (res.ok) {
        const payload = await res.json() as WalletData;
        setData(payload);
      }
    } catch (err) {
      console.error('Failed to load wallet details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) return;
    setTopUpLoading(true);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const payload = await res.json() as { checkoutUrl?: string; newBalance?: number; mode?: string };
        if (payload.checkoutUrl) {
          // Real Monnify checkout — redirect vendor to payment page
          window.location.href = payload.checkoutUrl;
          return;
        }
        // Dev fallback (mock mode) — balance updated directly
        if (payload.newBalance !== undefined) {
          setData(prev => prev ? {
            ...prev,
            balance: payload.newBalance!,
            transactions: [
              { id: 'tx_' + Date.now(), description: 'Wallet Top Up (Dev)', amount, type: 'credit', createdAt: new Date().toISOString() },
              ...prev.transactions
            ]
          } : null);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 4000);
        }
      }
    } catch (err) {
      console.error('Top up failed:', err);
    } finally {
      setTopUpLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rates = [
    { name: 'Inbound message', cost: '₦0.50', desc: 'Received customer chat', Icon: MessageCircle, color: '#3b82f6' },
    { name: 'Outbound reply', cost: '₦0.50', desc: 'Delivered WhatsApp reply', Icon: Send, color: '#8b5cf6' },
    { name: 'AI processor (Claude)', cost: '₦25.00', desc: 'Smart sales response', Icon: Sparkles, color: '#16a34a' },
  ];

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="wallet" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem' }}>
        {/* Header */}
        <div className="page-header animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Wallet & Billing
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              Manage credits, view platform usage costs, and add funds.
            </p>
          </div>
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin-slow 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Content split */}
        <div className="dashboard-grid animate-fade-up-1" style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left section: balance, transactions */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Balance banner */}
            <div className="pricing-card" style={{
              background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
              border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)',
              padding: '2.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wallet size={16} color="var(--brand)" /> Available balance
                </span>
                <span className="badge" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                  Active Plan: Pre-paid
                </span>
              </div>
              <p className="display" style={{ fontSize: '3rem', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
                ₦{loading ? '...' : (data?.balance ?? 0.0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)' }}>
                <Clock size={12} style={{ marginTop: 2 }} />
                <span>Wallet automatically warns you when balance drops below ₦1,000 to keep the sales agent online.</span>
              </div>
            </div>

            {/* Transactions table */}
            <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 1rem' }}>Transaction History</h2>
              {loading ? (
                <div style={{ padding: '1rem 0', display: 'grid', gap: '0.6rem' }}>
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
                </div>
              ) : !data || data.transactions.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
                  <div className="empty-state-icon"><CreditCard size={20} color="var(--text-3)" /></div>
                  <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-2)' }}>No transactions yet</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Top up your wallet to activate credit logs.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td style={{ fontWeight: 700 }}>{tx.description}</td>
                          <td>
                            <span className="mono" style={{ fontWeight: 800, color: tx.type === 'credit' ? 'var(--brand)' : '#ef4444' }}>
                              {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{
                              background: tx.type === 'credit' ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
                              color: tx.type === 'credit' ? 'var(--brand)' : '#ef4444'
                            }}>
                              {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </span>
                          </td>
                          <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                            {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right section: Billing settings & Rates */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Top up card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Plus size={16} color="var(--brand)" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Add credits</h2>
              </div>
              <form onSubmit={handleTopUp} style={{ display: 'grid', gap: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                  Amount to top up (₦)
                  <input
                    type="number"
                    required
                    min="100"
                    className="input"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 2000)"
                    style={{
                      background: 'var(--surface)',
                      fontWeight: 600,
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </label>

                {/* Quick select pills */}
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '-0.25rem' }}>
                  {['1000', '2000', '5000', '10000'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={topUpAmount === amt ? 'filter-pill active' : 'filter-pill'}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                    >
                      ₦{Number(amt).toLocaleString()}
                    </button>
                  ))}
                </div>

                {showSuccess && (
                  <div className="success-panel" style={{ padding: '0.75rem' }}>
                    <CheckCircle size={15} color="var(--brand)" />
                    <p style={{ fontSize: '0.8rem' }}>Payment Simulated successfully! Balance updated.</p>
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={topUpLoading} style={{ padding: '0.75rem' }}>
                  {topUpLoading ? (
                    <Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} />
                  ) : (
                    <CreditCard size={15} />
                  )}
                  {topUpLoading ? 'Initializing Top-up...' : 'Pay via Monnify Checkout'}
                </button>
              </form>
            </div>

            {/* Platform Rates Info */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
                <TrendingUp size={16} color="var(--brand)" />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Billing Rates</h2>
              </div>
              <div style={{ display: 'grid', gap: '0.875rem' }}>
                {rates.map((rate) => (
                  <div key={rate.name} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: 'var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <rate.Icon size={14} color={rate.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>{rate.name}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-3)' }}>{rate.desc}</p>
                    </div>
                    <span className="mono" style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-2)' }}>{rate.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
