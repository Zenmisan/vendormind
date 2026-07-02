import { useState, useEffect } from 'react';
import {
  Settings, User, Bot, AlertTriangle, CheckCircle, RefreshCw,
  Loader2, WifiOff, Volume2, ShieldAlert
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000';
const VENDOR_ID = localStorage.getItem('vendorId') ?? '1';

const toneGreetings: Record<string, (store: string, agent: string) => string> = {
  Friendly:     (s, a) => `Hi there! 👋 Welcome to ${s}. I'm ${a}, your personal shopping assistant. What can I help you find today?`,
  Professional: (s, a) => `Hello, welcome to ${s}. I'm ${a}, here to assist you with your shopping needs. How may I help you today?`,
  Energetic:    (s, a) => `Hey! 🔥 Welcome to ${s}! I'm ${a} and I'm here to help you find exactly what you need! What are you shopping for? 🛍️`,
};

interface SettingsData {
  name: string;
  email: string;
  phoneNumber: string | null;
  agentName: string;
  agentTone: string;
  agentGreeting: string;
}

type Tab = 'profile' | 'persona' | 'danger';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { load(); }, []);

  const tabs = [
    { id: 'profile', label: 'Business Profile', Icon: User },
    { id: 'persona', label: 'Agent Persona', Icon: Bot },
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
        <div className="dashboard-grid animate-fade-up-1" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.75rem', alignItems: 'start' }}>
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
                {activeTab !== 'danger' && (
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
