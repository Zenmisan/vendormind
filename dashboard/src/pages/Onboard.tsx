import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, FileSpreadsheet, Loader2, MessageCircle,
  QrCode, ShoppingCart, Store, Upload, Wifi,
} from 'lucide-react';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
type Step = 1 | 2 | 3;

interface Vendor { id: string; name: string; }

const steps = [
  { n: 1, label: 'Store', desc: 'Business profile' },
  { n: 2, label: 'Catalog', desc: 'Products and stock' },
  { n: 3, label: 'WhatsApp', desc: 'Connect number' },
] as const;

export default function Onboard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);

  useEffect(() => {
    if (step !== 3 || !vendor || connected) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/vendors/${vendor.id}/whatsapp/qr`);
        const data = await res.json() as { status: string; qr?: string };
        if (data.status === 'ready') setQr(data.qr ?? null);
        if (data.status === 'connected') {
          setConnected(true);
          clearInterval(interval as unknown as number);
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval as unknown as number);
  }, [step, vendor, connected]);

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
      setVendor({ id: data.vendorId!, name: fd.get('name') as string });
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: 30, height: 30, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={14} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>VendorMind</span>
          </button>
          {vendor && (
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
              Skip to dashboard <ArrowRight size={13} />
            </button>
          )}
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
              Add your store details, upload your catalog, then connect the WhatsApp number customers already know.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {steps.map(s => (
                <div key={s.n} style={{
                  display: 'grid',
                  gridTemplateColumns: '34px 1fr',
                  gap: '0.75rem',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderRadius: 12,
                  background: step === s.n ? 'rgba(22,163,74,0.08)' : 'transparent',
                  border: `1px solid ${step === s.n ? 'rgba(22,163,74,0.16)' : 'var(--border-subtle)'}`,
                }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: step > s.n ? 'var(--brand)' : 'var(--surface)',
                    color: step > s.n ? '#fff' : step === s.n ? 'var(--brand)' : 'var(--text-3)',
                    border: `1px solid ${step >= s.n ? 'var(--brand)' : 'var(--border)'}`,
                    fontWeight: 800,
                    fontSize: '0.78rem',
                  }}>
                    {step > s.n ? <CheckCircle size={15} /> : s.n}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>{s.label}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.74rem', color: 'var(--text-3)' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
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
                    Connect WhatsApp <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <MessageCircle size={21} color="var(--brand)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem' }}>Connect WhatsApp</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>
                  Scan the QR code with the WhatsApp number customers should message.
                </p>

                {connected ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ width: 66, height: 66, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <Wifi size={28} color="var(--brand)" />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.375rem' }}>Your agent is live</h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-2)', margin: '0 0 1.5rem' }}>Customers can now message your WhatsApp number.</p>
                    <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: '0.85rem' }}>
                      Go to overview <ArrowRight size={14} />
                    </button>
                  </div>
                ) : qr ? (
                  <div style={{ textAlign: 'center' }}>
                    <div className="qr-panel">
                      <div>
                        <p>{qr.slice(0, 110)}...</p>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: '0.75rem 0 0' }}>Waiting for scan...</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <QrCode size={32} color="var(--brand)" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', margin: 0 }}>Generating QR code...</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>Make sure the backend worker is running.</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
