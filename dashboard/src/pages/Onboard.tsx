import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, Wifi, ArrowRight, Loader2, ShoppingCart } from 'lucide-react';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
type Step = 1 | 2 | 3;

interface Vendor { id: string; name: string; }

const steps = [
  { n: 1, label: 'Register' },
  { n: 2, label: 'Catalog' },
  { n: 3, label: 'WhatsApp' },
];

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
        if (data.status === 'connected') { setConnected(true); clearInterval(interval as unknown as number); }
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
    const files = (e.target as HTMLInputElement).files;
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
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div style={{ width: 30, height: 30, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={14} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              VendorMind
            </span>
          </button>
          {vendor && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}
            >
              Skip to dashboard <ArrowRight size={11} />
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Step indicator */}
          <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700,
                    border: `2px solid ${step > s.n ? 'var(--brand)' : step === s.n ? 'var(--brand)' : 'var(--border)'}`,
                    background: step > s.n ? 'var(--brand)' : 'var(--surface)',
                    color: step > s.n ? '#fff' : step === s.n ? 'var(--brand)' : 'var(--text-3)',
                    transition: 'all 0.3s',
                  }}>
                    {step > s.n ? <CheckCircle size={14} /> : s.n}
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600,
                    color: step === s.n ? 'var(--text)' : 'var(--text-3)',
                    whiteSpace: 'nowrap',
                  }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 0.5rem', marginBottom: '1.25rem',
                    background: step > s.n ? 'var(--brand)' : 'var(--border)',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="card-raised animate-fade-up-1" style={{ padding: '2rem' }}>

            {/* Step 1 — Register */}
            {step === 1 && (
              <>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 0.375rem' }}>
                  Create your account
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>
                  You'll get free credits to start immediately.
                </p>
                <form onSubmit={register} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.375rem', letterSpacing: '0.01em' }}>
                      Store name
                    </label>
                    <input className="input" name="name" required placeholder="e.g. Mama Cee's Kitchen" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.375rem', letterSpacing: '0.01em' }}>
                      Email
                    </label>
                    <input className="input" name="email" type="email" required placeholder="you@example.com" />
                  </div>
                  {error && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#ef4444' }}>
                      {error}
                    </div>
                  )}
                  <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.8rem' }}>
                    {loading ? <Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <ArrowRight size={15} />}
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2 — Catalog */}
            {step === 2 && (
              <>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 0.375rem' }}>
                  Upload your catalog
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>
                  Excel file with columns:{' '}
                  {['name', 'price', 'description', 'stock'].map(c => (
                    <code key={c} style={{ background: 'var(--bg)', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.75rem', marginRight: '0.25rem', fontFamily: 'var(--font-mono)' }}>{c}</code>
                  ))}
                </p>

                {!uploadDone ? (
                  <label style={{
                    display: 'block',
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,0.03)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={uploadCatalog} style={{ display: 'none' }} />
                    {loading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
                        <Loader2 size={26} color="var(--brand)" style={{ animation: 'spin-slow 1s linear infinite' }} />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: 0 }}>Ingesting products...</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Upload size={20} color="var(--text-3)" />
                        </div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)', margin: 0 }}>Click to upload catalog</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: 0 }}>.xlsx or .csv</p>
                      </div>
                    )}
                  </label>
                ) : (
                  <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <CheckCircle size={20} color="var(--brand)" />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#15803d', margin: 0 }}>Catalog uploaded</p>
                      <p style={{ fontSize: '0.75rem', color: '#16a34a', margin: '0.1rem 0 0', opacity: 0.8 }}>Products are being indexed in the background.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ marginTop: '0.875rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#ef4444' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => setStep(3)}
                    style={{ fontSize: '0.85rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '0.6rem 0.875rem' }}
                  >
                    Skip for now
                  </button>
                  <button className="btn-primary" onClick={() => setStep(3)} disabled={!uploadDone} style={{ flex: 1, padding: '0.75rem' }}>
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — WhatsApp */}
            {step === 3 && (
              <>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 0.375rem' }}>
                  Connect WhatsApp
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>
                  Scan this QR with the WhatsApp number you want to use.
                </p>

                {connected ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <Wifi size={26} color="var(--brand)" />
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.375rem' }}>Connected!</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: '0 0 1.5rem' }}>Your AI agent is live. Customers can message you now.</p>
                    <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: '0.8rem' }}>
                      Go to dashboard <ArrowRight size={14} />
                    </button>
                  </div>
                ) : qr ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'inline-block', marginBottom: '1rem' }}>
                      <div style={{ width: 192, height: 192, background: 'var(--surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
                          {qr.slice(0, 100)}...
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Waiting for scan...</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <Loader2 size={28} color="var(--brand)" style={{ animation: 'spin-slow 1s linear infinite', marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', margin: 0 }}>Generating QR code...</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>Make sure the backend is running</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
