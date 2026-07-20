import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Upload, Wifi, ArrowRight, Loader2, ShoppingCart,
  Store, FileSpreadsheet, MessageCircle, QrCode, Sparkles, CreditCard, Phone
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
type Step = 1 | 2 | 3 | 4 | 5;

const toneGreetings: Record<string, (store: string, agent: string) => string> = {
  Friendly:     (s, a) => `Hi there! 👋 Welcome to ${s}. I'm ${a}, your personal shopping assistant. What can I help you find today?`,
  Professional: (s, a) => `Hello, welcome to ${s}. I'm ${a}, here to assist you with your shopping needs. How may I help you today?`,
  Energetic:    (s, a) => `Hey! 🔥 Welcome to ${s}! I'm ${a} and I'm here to help you find exactly what you need! What are you shopping for? 🛍️`,
};

interface Vendor { id: string; name: string; }
interface WalletData { balance: number; currency: string; }

const steps = [
  { n: 1, label: 'Store', desc: 'Business profile' },
  { n: 2, label: 'Catalog', desc: 'Products and stock' },
  { n: 3, label: 'Persona', desc: 'AI customization' },
  { n: 4, label: 'WhatsApp', desc: 'Connect number' },
  { n: 5, label: 'Wallet', desc: 'Prepaid balance' },
] as const;

export default function Onboard() {
  const navigate = useNavigate();
  const savedVendorId = localStorage.getItem('vendorId');
  const savedVendorName = localStorage.getItem('vendorName');

  const [step, setStep] = useState<Step>(1);
  const [vendor, setVendor] = useState<Vendor | null>(
    savedVendorId ? { id: savedVendorId, name: savedVendorName ?? '' } : null
  );

  // Persona states
  const [agentName, setAgentName] = useState('');
  const [agentTone, setAgentTone] = useState('Friendly');
  const [agentGreeting, setAgentGreeting] = useState('');

  // WhatsApp states
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [authMode, setAuthMode] = useState<'qr' | 'phone'>('qr');
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);

  // Wallet states
  const [balance, setBalance] = useState<number>(0);
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Progress states for Onboarding Gate
  const [progressTotal, setProgressTotal] = useState<number>(0);
  const [progressEmbedded, setProgressEmbedded] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressAllowed, setProgressAllowed] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);

  // Automatically advance step if vendor exists
  useEffect(() => {
    if (savedVendorId) {
      setStep(3); // Start from Persona if vendor exists
    }
  }, [savedVendorId]);

  const requestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !pairingPhone.trim()) return;
    setPairingLoading(true);
    setPairingCode(null);
    try {
      await fetch(`${API}/vendors/${vendor.id}/whatsapp/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pairingPhone }),
      });
    } catch {}
    setPairingLoading(false);
  };

  // Pairing code polling
  useEffect(() => {
    if (step !== 4 || authMode !== 'phone' || !vendor || connected) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/vendors/${vendor.id}/whatsapp/pairing-code`);
        const data = await res.json() as { status: string; code?: string };
        if (data.status === 'ready' && data.code) setPairingCode(data.code);
        if (data.status === 'connected') {
          setConnected(true);
          clearInterval(interval as unknown as number);
          setTimeout(() => setStep(5), 1500);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval as unknown as number);
  }, [step, authMode, vendor, connected]);

  // WhatsApp QR Polling Loop
  useEffect(() => {
    if (step !== 4 || authMode !== 'qr' || !vendor || connected) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/vendors/${vendor.id}/whatsapp/qr`);
        const data = await res.json() as { status: string; qr?: string };
        if (data.status === 'ready') setQr(data.qr ?? null);
        if (data.status === 'connected') {
          setConnected(true);
          clearInterval(interval as unknown as number);
          setTimeout(() => setStep(5), 1500); // Auto go to step 5 on scan success
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval as unknown as number);
  }, [step, authMode, vendor, connected]);

  // Load wallet balance if on step 5
  const loadWallet = async () => {
    if (!vendor) return;
    try {
      const res = await fetch(`${API}/vendors/${vendor.id}/wallet`);
      if (res.ok) {
        const data = await res.json() as WalletData;
        setBalance(data.balance);
      }
    } catch {}
  };

  const checkProgress = async () => {
    if (!vendor) return;
    try {
      const res = await fetch(`${API}/vendors/${vendor.id}/catalog/progress`);
      if (res.ok) {
        const data = await res.json() as { total: number; embedded: number; progress: number; allowed: boolean };
        setProgressTotal(data.total);
        setProgressEmbedded(data.embedded);
        setProgressPercent(data.progress);
        setProgressAllowed(data.allowed);
      }
    } catch {}
  };

  useEffect(() => {
    let interval: any = null;
    if (step === 5 && vendor) {
      loadWallet();
      checkProgress();
      interval = setInterval(checkProgress, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, vendor]);

  const register = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch(`${API}/vendors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fd.get('name'), email: fd.get('email') }),
      });
      const data = await res.json() as { vendorId?: string; message?: string };
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      const v = { id: data.vendorId!, name: fd.get('name') as string };
      localStorage.setItem('vendorId', v.id);
      localStorage.setItem('vendorName', v.name);
      setVendor(v);
      setAgentName(v.name);
      setAgentGreeting(`Hello! Welcome to ${v.name}. I am your AI assistant. How can I help you today?`);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadCatalog = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.[0] || !vendor) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', files[0]);
      const res = await fetch(`${API}/vendors/${vendor.id}/catalog`, { method: 'POST', body: fd });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setUploadDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/vendors/${vendor.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          agentTone,
          agentGreeting
        })
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCredits = async () => {
    if (!vendor) return;
    setTopUpLoading(true);
    try {
      const res = await fetch(`${API}/vendors/${vendor.id}/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 2000 })
      });
      if (res.ok) {
        const payload = await res.json() as { checkoutUrl?: string; newBalance?: number };
        if (payload.checkoutUrl) {
          window.location.href = payload.checkoutUrl;
          return;
        }
        if (payload.newBalance !== undefined) setBalance(payload.newBalance);
      }
    } catch {}
    setTopUpLoading(false);
  };

  const isDark = document.documentElement.classList.contains('dark');
  const logoSrc = isDark ? '/logo-dark.png' : '/logo-light.png';

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <img src={logoSrc} alt="VendorMind logo" style={{ width: 28, height: 28 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>VendorMind</span>
          </button>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            Skip to dashboard <ArrowRight size={13} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '3rem 1.5rem' }}>
        <div className="onboard-shell" style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '2rem', alignItems: 'start' }}>
          <aside className="card-raised animate-fade-up" style={{ padding: '1.5rem', position: 'sticky', top: 90 }}>
            <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '1rem' }}>
              <Wifi size={13} />
              Store setup
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.15, margin: '0 0 0.75rem' }}>
              Get your WhatsApp sales agent ready.
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              Add your store details, upload your catalog, customize the agent persona, and scan WhatsApp QR.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative', margin: '0.5rem 0' }}>
              <div style={{
                position: 'absolute',
                left: 21,
                top: 24,
                bottom: 24,
                width: 2,
                background: 'rgba(255, 255, 255, 0.08)',
                zIndex: 0
              }} />
              {steps.map(s => {
                const isActive = step === s.n;
                const isCompleted = step > s.n;
                return (
                  <div key={s.n} style={{
                    display: 'grid',
                    gridTemplateColumns: '26px 1fr',
                    gap: '1.25rem',
                    alignItems: 'start',
                    padding: '0.75rem 0.5rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCompleted ? 'var(--brand)' : isActive ? 'var(--bg)' : 'var(--surface-raised)',
                      color: isCompleted ? '#05080e' : isActive ? 'var(--brand)' : 'var(--text-3)',
                      border: `1px solid ${isActive || isCompleted ? 'var(--brand)' : 'var(--border)'}`,
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      boxShadow: isActive ? 'var(--shadow-brand)' : 'none',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      marginTop: '0.15rem'
                    }}>
                      {isCompleted ? '✓' : s.n}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--text)' : 'var(--text-2)', transition: 'color 0.2s' }}>{s.label}</p>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: isActive ? 'var(--text-2)' : 'var(--text-3)', transition: 'color 0.2s' }}>{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Tip Box inspired by inspo/01.jpeg */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem 1.15rem',
              background: 'rgba(74, 222, 128, 0.03)',
              border: '1px solid rgba(74, 222, 128, 0.08)',
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Sparkles size={14} color="var(--brand)" />
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Tip</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
                {step === 1 && "Create a distinct store profile name. This name is what customers will see and refer to your store as."}
                {step === 2 && "The AI persona guides the tone of responses. Friendly works best for retail stores, while Professional works best for tech/services."}
                {step === 3 && "You can upload files in CSV or XLSX format. Ensure columns for Name, Price, and Description are clearly marked."}
                {step === 4 && "Make sure your WhatsApp device has a stable internet connection before scanning the QR code to ensure seamless connection."}
                {step === 5 && "Adding credits helps test message delivery in real-time. Each message sent consumes a microscopic credit fraction."}
              </p>
            </div>
          </aside>

          <section className="card-raised animate-fade-up-1" style={{ padding: '2rem' }}>
            {step === 1 && (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Store size={21} color="var(--brand)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem' }}>Create your store profile</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>
                  This is the store your AI agent will represent in customer conversations.
                </p>
                <form onSubmit={register} style={{ display: 'grid', gap: '1rem' }}>
                  <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                    Store name
                    <input className="input" name="name" required placeholder="e.g. Mama Cee's Kitchen" />
                  </label>
                  <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                    Email
                    <input className="input" name="email" type="email" required placeholder="you@example.com" />
                  </label>
                  {error && <div className="form-error">{error}</div>}
                  <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
                    {loading ? <Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <ArrowRight size={15} />}
                    {loading ? 'Creating store...' : 'Continue to catalog'}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <FileSpreadsheet size={21} color="#3b82f6" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem' }}>Upload your catalog</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', margin: '0 0 1rem' }}>
                  Upload an Excel or CSV file. Required columns:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                  {['name', 'price', 'description', 'stock'].map(c => (
                    <code key={c} style={{ background: 'var(--bg)', padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{c}</code>
                  ))}
                </div>

                {!uploadDone ? (
                  <label className="upload-dropzone">
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={uploadCatalog} style={{ display: 'none' }} />
                    {loading ? (
                      <>
                        <Loader2 size={28} color="var(--brand)" style={{ animation: 'spin-slow 1s linear infinite' }} />
                        <p>Importing products...</p>
                        <span>Products will be indexed for search after upload.</span>
                      </>
                    ) : (
                      <>
                        <Upload size={28} color="var(--brand)" />
                        <p>Choose catalog file</p>
                        <span>.xlsx, .xls, or .csv</span>
                      </>
                    )}
                  </label>
                ) : (
                  <div className="success-panel">
                    <CheckCircle size={21} color="var(--brand)" />
                    <div>
                      <p>Catalog uploaded</p>
                      <span>Products are being indexed for AI search.</span>
                    </div>
                  </div>
                )}

                {error && <div className="form-error" style={{ marginTop: '0.875rem' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn-ghost" onClick={() => setStep(3)}>Skip for now</button>
                  <button className="btn-primary" onClick={() => setStep(3)} disabled={!uploadDone} style={{ flex: 1, padding: '0.75rem' }}>
                    Configure Persona <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Sparkles size={21} color="#8b5cf6" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem' }}>Customize AI Persona</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', margin: '0 0 1.5rem' }}>
                  Choose your assistant's name and speech style for WhatsApp customers.
                </p>
                <form onSubmit={savePersona} style={{ display: 'grid', gap: '1.25rem' }}>
                  <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                    Agent Name
                    <input className="input" value={agentName} onChange={e => setAgentName(e.target.value)} required placeholder="e.g. Zena, Mama Cee Bot" />
                  </label>

                  <div style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                    Agent Tone
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      {['Friendly', 'Professional', 'Energetic'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setAgentTone(t);
                            setAgentGreeting(toneGreetings[t](vendor?.name ?? 'our store', agentName || vendor?.name || 'your assistant'));
                          }}
                          style={{
                            flex: 1, padding: '0.65rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                            cursor: 'pointer', border: `1px solid ${agentTone === t ? 'var(--brand)' : 'var(--border)'}`,
                            background: agentTone === t ? 'var(--brand-glow)' : 'var(--surface)',
                            color: agentTone === t ? 'var(--brand)' : 'var(--text-2)', transition: 'all 0.15s'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label style={{ display: 'grid', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                    Greeting Message
                    <textarea
                      className="input"
                      rows={3}
                      value={agentGreeting}
                      onChange={e => setAgentGreeting(e.target.value)}
                      required
                      placeholder="Welcome message sent when customer first starts a conversation..."
                    />
                  </label>

                  {error && <div className="form-error">{error}</div>}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" className="btn-ghost" onClick={() => setStep(4)}>Skip</button>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.85rem' }}>
                      {loading ? <Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <ArrowRight size={15} />}
                      Save & Connect WhatsApp
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === 4 && (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <MessageCircle size={21} color="var(--brand)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem' }}>Connect WhatsApp</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', margin: '0 0 1.25rem' }}>
                  Link the WhatsApp number your customers should message.
                </p>

                {connected ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ width: 66, height: 66, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <Wifi size={28} color="var(--brand)" />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.375rem' }}>WhatsApp Connected!</h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-2)', margin: '0 0 1.5rem' }}>Loading payment setup...</p>
                  </div>
                ) : (
                  <>
                    {/* Auth mode toggle */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg)', borderRadius: 8, padding: '0.25rem' }}>
                      {(['qr', 'phone'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => { setAuthMode(mode); setQr(null); setPairingCode(null); }}
                          style={{
                            flex: 1, padding: '0.55rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            background: authMode === mode ? 'var(--surface)' : 'transparent',
                            color: authMode === mode ? 'var(--text)' : 'var(--text-3)',
                            boxShadow: authMode === mode ? 'var(--shadow-xs)' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                          }}
                        >
                          {mode === 'qr' ? <QrCode size={13} /> : <Phone size={13} />}
                          {mode === 'qr' ? 'Scan QR code' : 'Link with phone'}
                        </button>
                      ))}
                    </div>

                    {authMode === 'qr' && (
                      qr ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'inline-block', marginBottom: '0.75rem' }}>
                            <div style={{ width: 208, height: 208, background: '#ffffff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                              <QRCodeSVG value={qr} size={192} bgColor="#ffffff" fgColor="#0d1117" level="M" />
                            </div>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: 0 }}>Open WhatsApp → Linked Devices → Link a Device → scan</p>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                          <QrCode size={32} color="var(--brand)" style={{ marginBottom: '0.75rem' }} />
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', margin: 0 }}>Generating QR code...</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>This takes a few seconds.</p>
                        </div>
                      )
                    )}

                    {authMode === 'phone' && (
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <form onSubmit={requestPairingCode} style={{ display: 'grid', gap: '0.75rem' }}>
                          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                            WhatsApp phone number
                            <input
                              className="input"
                              value={pairingPhone}
                              onChange={e => setPairingPhone(e.target.value)}
                              placeholder="+2348012345678"
                              required
                            />
                          </label>
                          <button type="submit" className="btn-primary" disabled={pairingLoading} style={{ padding: '0.7rem' }}>
                            {pairingLoading ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Phone size={14} />}
                            {pairingLoading ? 'Requesting code...' : 'Get pairing code'}
                          </button>
                        </form>

                        {pairingCode ? (
                          <div style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--brand-dim)', borderRadius: 12, border: '1px solid rgba(22,163,74,0.2)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 700, margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your pairing code</p>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text)', margin: 0 }}>
                              {pairingCode.slice(0, 4)}-{pairingCode.slice(4)}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '0.75rem 0 0' }}>
                              WhatsApp → Linked Devices → Link with phone number → enter code
                            </p>
                          </div>
                        ) : pairingLoading === false && pairingPhone && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center' }}>
                            Enter your number above and tap "Get pairing code"
                          </p>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                      <button className="btn-ghost" onClick={() => setStep(5)}>Skip for now</button>
                    </div>
                  </>
                )}
              </>
            )}

            {step === 5 && (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <CreditCard size={21} color="var(--brand)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem' }}>Activate Prepaid Wallet</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', margin: '0 0 1.5rem' }}>
                  Each WhatsApp response costs credits. Top up your pre-paid wallet to activate your agent.
                </p>

                <div className="pricing-card" style={{
                  background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                  padding: '1.5rem', borderRadius: 12, color: '#fff', marginBottom: '1.5rem'
                }}>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>CURRENT WALLET BALANCE</p>
                  <p className="display" style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.25rem 0', color: '#fff' }}>
                    ₦{(balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </p>
                  {balance === 0 ? (
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>⚠️ Balance is zero. Add credits to enable the AI bot.</span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>✓ Wallet active! Ready to go live.</span>
                  )}
                </div>

                {progressTotal > 0 && (
                  <div className="progress-section" style={{
                    background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '0.35rem' }}>
                      <span>AI Catalog Indexing</span>
                      <span>{progressEmbedded} / {progressTotal} ({progressPercent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: progressPercent >= 80 ? 'var(--brand)' : '#f59e0b', transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: '0.725rem', margin: '0.5rem 0 0', color: progressPercent >= 80 ? '#4ade80' : '#f59e0b' }}>
                      {progressPercent >= 80 ? (
                        "✓ Catalog sufficiently indexed. You are ready to go live!"
                      ) : (
                        "⚡ Indexing in progress. Go-live is blocked until at least 80% of products are embedded."
                      )}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <button className="btn-ghost" onClick={addCredits} disabled={topUpLoading} style={{ padding: '0.85rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    {topUpLoading ? (
                      <Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} />
                    ) : (
                      <CreditCard size={15} />
                    )}
                    Top-up ₦2,000 (Monnify Checkout)
                  </button>

                  <button
                    className="btn-primary"
                    disabled={balance <= 0 || (progressTotal > 0 && !progressAllowed)}
                    onClick={() => navigate('/dashboard')}
                    style={{
                      padding: '0.85rem', width: '100%', marginTop: '0.5rem',
                      opacity: (balance <= 0 || (progressTotal > 0 && !progressAllowed)) ? 0.6 : 1,
                      cursor: (balance <= 0 || (progressTotal > 0 && !progressAllowed)) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Go Live & Access Dashboard
                    <ArrowRight size={15} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
