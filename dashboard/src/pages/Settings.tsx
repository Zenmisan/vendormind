import { useState, useEffect } from 'react';
import {
  Settings, User, Bot, CheckCircle, RefreshCw,
  Loader2, WifiOff, ShieldAlert, Wallet, Building2, ArrowDownToLine
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const VENDOR_ID = localStorage.getItem('vendorId') ?? '1';

const toneGreetings: Record<string, (store: string, agent: string) => string> = {
  Friendly:     (s, a) => `Hi there!  Welcome to ${s}. I'm ${a}, your personal shopping assistant. What can I help you find today?`,
  Professional: (s, a) => `Hello, welcome to ${s}. I'm ${a}, here to assist you with your shopping needs. How may I help you today?`,
  Energetic:    (s, a) => `Hey!  Welcome to ${s}! I'm ${a} and I'm here to help you find exactly what you need! What are you shopping for? `,
};

interface SettingsData {
  name: string;
  email: string;
  phoneNumber: string | null;
  agentName: string;
  agentTone: string;
  agentGreeting: string;
}

interface BmoniWalletInfo {
  bmoniUserId: string | null;
  smartWalletId: string | null;
  smartWalletAddress: string | null;
  ngnRailActive: boolean;
  depositAccount: string | null;
  depositBank: string | null;
  cngnBalance: string;
}

type Tab = 'profile' | 'persona' | 'payout' | 'danger';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bmoniWallet, setBmoniWallet] = useState<BmoniWalletInfo | null>(null);
  const [bmoniLoading, setBmoniLoading] = useState(false);
  const [withdrawBankCode, setWithdrawBankCode] = useState('035');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/settings`);
      if (res.ok) {
        const payload = await res.json() as { settings: SettingsData };
        setSettings(payload.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBmoniWallet = async () => {
    setBmoniLoading(true);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/bmoni/wallet`);
      if (res.ok) {
        const payload = await res.json() as BmoniWalletInfo;
        setBmoniWallet(payload);
      }
    } catch (err) {
      console.error('Failed to load BMONI wallet:', err);
    } finally {
      setBmoniLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;
    setSaveLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const payload = await res.json() as { settings: SettingsData };
        setSettings(payload.settings);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleProvisionWallet = async () => {
    setBmoniLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/bmoni/provision`, { method: 'POST' });
      if (res.ok) {
        await loadBmoniWallet();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json() as any;
        throw new Error(data.error || 'Failed to provision BMONI wallet');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBmoniLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAccount || !withdrawAmount) return;
    setWithdrawLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/vendors/${VENDOR_ID}/bmoni/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankCode: withdrawBankCode, accountNumber: withdrawAccount, amount: withdrawAmount }),
      });
      if (res.ok) {
        setWithdrawSuccess(true);
        setTimeout(() => setWithdrawSuccess(false), 4000);
        setWithdrawAmount('');
        setWithdrawAccount('');
        await loadBmoniWallet();
      } else {
        const data = await res.json() as any;
        throw new Error(data.error || 'Withdrawal failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  useEffect(() => { load(); loadBmoniWallet(); }, []);

  const tabs = [
    { id: 'profile', label: 'Business Profile', Icon: User },
    { id: 'persona', label: 'Agent Persona', Icon: Bot },
    { id: 'payout', label: 'BMONI Wallet', Icon: Wallet },
    { id: 'danger', label: 'Danger Zone', Icon: ShieldAlert },
  ] as const;

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active="settings" />

      <main className="app-main" style={{ flex: 1, padding: '2rem 2.5rem' }}>
        {/* Header */}
        <div className="page-header animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Settings
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
              Configure your business details and customize your AI sales assistant.
            </p>
          </div>
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin-slow 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Settings layout */}
        <div className="dashboard-grid animate-fade-up-1" style={{ alignItems: 'start' }}>
          {/* Navigation vertical tabs */}
          <aside className="card" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setError(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500,
                    border: 'none', background: isActive ? 'var(--brand-glow)' : 'transparent',
                    color: isActive ? 'var(--brand)' : 'var(--text-2)', cursor: 'pointer',
                    textAlign: 'left', width: '100%', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'var(--surface-raised)'; }}
                  onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <tab.Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </aside>

          {/* Form Editor panel */}
          <section className="card-raised" style={{ padding: '2rem', background: 'var(--surface)' }}>
            {loading ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div className="skeleton" style={{ height: 44, width: '40%' }} />
                <div className="skeleton" style={{ height: 72 }} />
                <div className="skeleton" style={{ height: 72 }} />
              </div>
            ) : settings ? (
              <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem' }}>
                {activeTab === 'profile' && (
                  <>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Business Profile</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: '-0.75rem 0 0.5rem' }}>Update store identification and contact email.</p>

                    <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                      Store Name
                      <input
                        className="input"
                        value={settings.name}
                        onChange={e => setSettings({ ...settings, name: e.target.value })}
                        required
                        placeholder="Mama Cee's Kitchen"
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                      Billing / Notification Email
                      <input
                        className="input"
                        type="email"
                        value={settings.email}
                        onChange={e => setSettings({ ...settings, email: e.target.value })}
                        required
                        placeholder="you@example.com"
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                      WhatsApp Phone Number
                      <input
                        className="input"
                        value={settings.phoneNumber || 'Not connected yet'}
                        disabled
                        style={{ opacity: 0.65, cursor: 'not-allowed' }}
                      />
                    </label>
                  </>
                )}

                {activeTab === 'persona' && (
                  <>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Agent Persona</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: '-0.75rem 0 0.5rem' }}>Customize how the AI behaves and greets customers on WhatsApp.</p>

                    <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                      AI Assistant Name
                      <input
                        className="input"
                        value={settings.agentName}
                        onChange={e => setSettings({ ...settings, agentName: e.target.value })}
                        required
                        placeholder="e.g. Zena"
                      />
                    </label>

                    <div style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                      Tone Selector
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                        {['Friendly', 'Professional', 'Energetic'].map((tone) => {
                          const isSel = settings.agentTone === tone;
                          return (
                            <button
                              key={tone}
                              type="button"
                              onClick={() => setSettings({
                                ...settings,
                                agentTone: tone,
                                agentGreeting: toneGreetings[tone](settings.name, settings.agentName),
                              })}
                              style={{
                                flex: 1, padding: '0.65rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                                cursor: 'pointer', border: `1px solid ${isSel ? 'var(--brand)' : 'var(--border)'}`,
                                background: isSel ? 'var(--brand-glow)' : 'var(--surface)',
                                color: isSel ? 'var(--brand)' : 'var(--text-2)', transition: 'all 0.15s'
                              }}
                            >
                              {tone}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                      Greeting Message
                      <textarea
                        className="input"
                        rows={3}
                        value={settings.agentGreeting}
                        onChange={e => setSettings({ ...settings, agentGreeting: e.target.value })}
                        required
                        placeholder="Type initial message customers receive..."
                        style={{ resize: 'vertical' }}
                      />
                    </label>
                  </>
                )}

                {activeTab === 'payout' && (
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>BMONI Smart Wallet</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: '-0.75rem 0 0.5rem' }}>On-chain CNGN smart wallet for instant in-chat settlement and NGN bank offramps.</p>

                    {bmoniLoading ? (
                      <div style={{ display: 'grid', gap: '0.6rem' }}>
                        {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10 }} />)}
                      </div>
                    ) : bmoniWallet?.bmoniUserId ? (
                      <>
                        {/* Wallet status */}
                        <div style={{ border: '1px solid rgba(22,163,74,0.2)', background: 'rgba(22,163,74,0.04)', padding: '1.25rem', borderRadius: 12, display: 'grid', gap: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Wallet size={16} color="var(--brand)" />
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--brand)' }}>BMONI Wallet Active</h3>
                          </div>
                          <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.78rem' }}>
                            <p style={{ margin: 0, color: 'var(--text-2)' }}>CNGN Balance: <strong style={{ fontFamily: 'var(--mono)' }}>₦{bmoniWallet.cngnBalance || '0.00'}</strong></p>
                            {bmoniWallet.depositAccount && (
                              <p style={{ margin: 0, color: 'var(--text-2)' }}>Virtual Account: <strong style={{ fontFamily: 'var(--mono)' }}>{bmoniWallet.depositBank} - {bmoniWallet.depositAccount}</strong></p>
                            )}
                            {bmoniWallet.smartWalletAddress && (
                              <p style={{ margin: 0, color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                {bmoniWallet.smartWalletAddress}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Offramp withdrawal form */}
                        <form onSubmit={handleWithdraw} style={{ display: 'grid', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowDownToLine size={15} color="var(--text-2)" />
                            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>Withdraw to Nigerian Bank</h3>
                          </div>

                          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-2)' }}>
                            Bank
                            <select className="input" value={withdrawBankCode} onChange={e => setWithdrawBankCode(e.target.value)} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                              <option value="035">Wema Bank</option>
                              <option value="058">GTBank</option>
                              <option value="011">First Bank</option>
                              <option value="057">Zenith Bank</option>
                              <option value="232">Sterling Bank</option>
                              <option value="044">Access Bank</option>
                              <option value="033">UBA</option>
                            </select>
                          </label>

                          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-2)' }}>
                            Account Number
                            <input className="input" value={withdrawAccount} onChange={e => setWithdrawAccount(e.target.value)} placeholder="0123456789" maxLength={10} required />
                          </label>

                          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-2)' }}>
                            Amount (₦)
                            <input className="input" type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="e.g. 5000" min="100" required />
                          </label>

                          {withdrawSuccess && (
                            <div className="success-panel">
                              <CheckCircle size={14} color="var(--brand)" />
                              <p style={{ fontSize: '0.8rem' }}>Withdrawal initiated! Funds will arrive within 24 hours.</p>
                            </div>
                          )}

                          <button type="submit" className="btn-primary" disabled={withdrawLoading} style={{ justifySelf: 'start', minWidth: 160 }}>
                            {withdrawLoading ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Building2 size={14} />}
                            {withdrawLoading ? 'Processing...' : 'Withdraw to Bank'}
                          </button>
                        </form>
                      </>
                    ) : (
                      <div style={{ display: 'grid', gap: '1rem', padding: '1.5rem', border: '1px dashed var(--border)', borderRadius: 12, textAlign: 'center' }}>
                        <Wallet size={32} color="var(--text-3)" style={{ margin: '0 auto' }} />
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', margin: 0, fontWeight: 600 }}>BMONI Smart Wallet not provisioned yet</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: 0 }}>Click below to create your on-chain CNGN wallet and NGN deposit account.</p>
                        <button type="button" className="btn-primary" onClick={handleProvisionWallet} disabled={bmoniLoading} style={{ justifySelf: 'center', minWidth: 180 }}>
                          {bmoniLoading ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Wallet size={14} />}
                          {bmoniLoading ? 'Provisioning...' : 'Provision BMONI Wallet'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'danger' && (
                  <>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ef4444' }}>Danger Zone</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: '-0.75rem 0 0.5rem' }}>Destructive actions regarding your WhatsApp automation.</p>

                    <div style={{ border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.03)', padding: '1.25rem', borderRadius: 12, display: 'grid', gap: '0.75rem' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#ef4444' }}>Disconnect WhatsApp Session</h3>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                        This will delete the WhatsApp session credentials from our server, pausing all chat automation until you scan the QR code again.
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ justifySelf: 'start', background: '#ef4444', color: '#fff', boxShadow: '0 4px 14px rgba(239,68,68,0.2)' }}
                        onClick={() => alert('Disconnecting WhatsApp session (mock)...')}
                      >
                        <WifiOff size={14} /> Disconnect WhatsApp
                      </button>
                    </div>
                  </>
                )}

                {/* Error and Success indicators */}
                {error && <div className="form-error">{error}</div>}
                {showSuccess && (
                  <div className="success-panel">
                    <CheckCircle size={16} color="var(--brand)" />
                    <p style={{ fontSize: '0.82rem' }}>Settings updated successfully!</p>
                  </div>
                )}

                {/* Submit button (only for form tabs) */}
                {activeTab !== 'danger' && activeTab !== 'payout' && (
                  <button type="submit" className="btn-primary" disabled={saveLoading} style={{ justifySelf: 'end', marginTop: '0.5rem', minWidth: 120 }}>
                    {saveLoading ? (
                      <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    {saveLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                )}
              </form>
            ) : (
              <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>Error loading settings.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
