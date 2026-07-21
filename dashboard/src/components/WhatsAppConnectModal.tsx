import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Bot, Loader2, Phone, QrCode, RefreshCw, Wifi, X } from 'lucide-react';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';

interface Props {
  vendorId: string;
  onConnected: () => void;
  onClose: () => void;
}

export default function WhatsAppConnectModal({ vendorId, onConnected, onClose }: Props) {
  const [authMode, setAuthMode] = useState<'qr' | 'phone'>('qr');
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // QR polling
  useEffect(() => {
    if (authMode !== 'qr' || connected) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/vendors/${vendorId}/whatsapp/qr`);
        const data = await res.json() as { status: string; qr?: string };
        if (data.status === 'ready') setQr(data.qr ?? null);
        if (data.status === 'connected') {
          setConnected(true);
          clearInterval(interval as unknown as number);
          setTimeout(onConnected, 1500);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval as unknown as number);
  }, [authMode, connected, vendorId]);

  // Pairing code polling
  useEffect(() => {
    if (authMode !== 'phone' || connected) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/vendors/${vendorId}/whatsapp/pairing-code`);
        const data = await res.json() as { status: string; code?: string };
        if (data.status === 'ready' && data.code) {
          setPairingCode(data.code);
          setPairingLoading(false);
        }
        if (data.status === 'connected') {
          setConnected(true);
          setPairingLoading(false);
          clearInterval(interval as unknown as number);
          setTimeout(onConnected, 1500);
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval as unknown as number);
  }, [authMode, connected, vendorId]);

  const requestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) return;
    setPairingLoading(true);
    setPairingCode(null);
    try {
      await fetch(`${API}/vendors/${vendorId}/whatsapp/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pairingPhone }),
      });
    } catch {
      setPairingLoading(false);
    }
  };

  const forceResetConnection = async () => {
    setResetting(true);
    setQr(null);
    setPairingCode(null);
    try {
      await fetch(`${API}/vendors/${vendorId}/whatsapp/reset`, { method: 'POST' });
    } catch {}
    setResetting(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card-raised animate-fade-up" style={{
        width: '100%', maxWidth: 420, background: 'var(--surface)', padding: '2rem', position: 'relative'
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem', border: 'none' }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={18} color="var(--brand)" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Reconnect WhatsApp</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: 0 }}>Link your number to restore the AI agent</p>
          </div>
        </div>

        {connected ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Wifi size={26} color="var(--brand)" />
            </div>
            <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>Connected!</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.3rem' }}>Agent is back online.</p>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg)', borderRadius: 8, padding: '0.25rem', marginBottom: '1.25rem' }}>
              {(['qr', 'phone'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setAuthMode(mode); setQr(null); setPairingCode(null); setPairingLoading(false); }}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: authMode === mode ? 'var(--surface)' : 'transparent',
                    color: authMode === mode ? 'var(--text)' : 'var(--text-3)',
                    boxShadow: authMode === mode ? 'var(--shadow-xs)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                  }}
                >
                  {mode === 'qr' ? <QrCode size={12} /> : <Phone size={12} />}
                  {mode === 'qr' ? 'Scan QR' : 'Phone number'}
                </button>
              ))}
            </div>

            {authMode === 'qr' && (
              qr ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', display: 'inline-block', marginBottom: '0.75rem' }}>
                    <div style={{ width: 192, height: 192, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem' }}>
                      <QRCodeSVG value={qr} size={176} bgColor="#ffffff" fgColor="#0d1117" level="M" />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '0 0 0.75rem' }}>
                    WhatsApp → Linked Devices → Link a Device → scan
                  </p>
                  <button
                    type="button"
                    onClick={forceResetConnection}
                    disabled={resetting}
                    className="btn-ghost"
                    style={{ fontSize: '0.73rem', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={12} style={{ animation: resetting ? 'spin-slow 1s linear infinite' : 'none' }} />
                    {resetting ? 'Resetting...' : 'Generate fresh QR'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <QrCode size={30} color="var(--brand)" style={{ marginBottom: '0.65rem' }} />
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', margin: 0 }}>Generating QR code...</p>
                </div>
              )
            )}

            {authMode === 'phone' && (
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                <form onSubmit={requestPairingCode} style={{ display: 'grid', gap: '0.65rem' }}>
                  <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-2)' }}>
                    WhatsApp phone number
                    <input
                      className="input"
                      value={pairingPhone}
                      onChange={e => setPairingPhone(e.target.value)}
                      placeholder="+2348012345678"
                      required
                    />
                  </label>
                  <button type="submit" className="btn-primary" disabled={pairingLoading} style={{ padding: '0.65rem' }}>
                    {pairingLoading ? <Loader2 size={13} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Phone size={13} />}
                    {pairingLoading ? 'Requesting code...' : 'Get pairing code'}
                  </button>
                </form>

                {pairingLoading && !pairingCode ? (
                  <div style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--bg)', borderRadius: 10, border: '1px dashed var(--border)' }}>
                    <Loader2 size={24} color="var(--brand)" style={{ animation: 'spin-slow 1s linear infinite', margin: '0 auto 0.5rem', display: 'block' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 600, margin: 0 }}>Generating pairing code from WhatsApp...</p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>Please wait ~3–5 seconds</p>
                  </div>
                ) : pairingCode ? (
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--brand-dim)', borderRadius: 10, border: '1px solid rgba(22,163,74,0.2)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--brand)', fontWeight: 700, margin: '0 0 0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pairing code</p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '1.9rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text)', margin: 0 }}>
                      {pairingCode.slice(0, 4)}-{pairingCode.slice(4)}
                    </p>
                    <p style={{ fontSize: '0.71rem', color: 'var(--text-3)', margin: '0.65rem 0 0' }}>
                      WhatsApp → Linked Devices → Link with phone number
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
