import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, FileText, CheckCircle2, Phone, MapPin, Send, MessageSquare, Clock, Zap } from 'lucide-react';

type PageKind = 'privacy' | 'terms' | 'contact';

export default function LegalPage({ kind }: { kind: PageKind }) {
  const [formData, setFormData] = useState({
    name: '',
    storeName: '',
    email: '',
    phone: '',
    category: 'Sales & Onboarding',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', sticky: 'top', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <img src="/logo-dark.png" alt="VendorMind Logo" style={{ height: 32, width: 'auto', display: 'block' }} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/legal/privacy" style={{ color: kind === 'privacy' ? 'var(--brand)' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'privacy' ? 700 : 500 }}>
              Privacy
            </Link>
            <Link to="/legal/terms" style={{ color: kind === 'terms' ? 'var(--brand)' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'terms' ? 700 : 500 }}>
              Terms
            </Link>
            <Link to="/contact" style={{ color: kind === 'contact' ? 'var(--brand)' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'contact' ? 700 : 500 }}>
              Contact
            </Link>
            <Link to="/" className="btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>
              <ArrowLeft size={13} /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        
        {/* Contact Page View */}
        {kind === 'contact' && (
          <div>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3rem' }}>
              <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', margin: '0 auto 1rem', display: 'inline-flex' }}>
                <Mail size={13} />
                Get in Touch
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
                We'd love to hear from you
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.6 }}>
                Have questions about connecting your WhatsApp store, Monnify checkout, or custom setup? Drop us a message below.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Contact Information & Channels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card-raised" style={{ padding: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Email Support</h3>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>For merchant onboarding, billing, or general queries.</p>
                    <a href="mailto:hello@vendormind.app" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                      hello@vendormind.app
                    </a>
                  </div>
                </div>

                <div className="card-raised" style={{ padding: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22,163,74,0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>WhatsApp Merchant Desk</h3>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>Direct merchant support via WhatsApp.</p>
                    <a href="https://wa.me/2349000000000" target="_blank" rel="noreferrer" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                      +234 (0) 900 VENDORMIND
                    </a>
                  </div>
                </div>

                <div className="card-raised" style={{ padding: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Office Location</h3>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', margin: 0 }}>
                      Victoria Island, Lagos, Nigeria.
                    </p>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Zap size={18} color="var(--brand)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
                    <strong>Response SLA:</strong> Our team replies within 2 hours during business hours (8 AM - 8 PM WAT).
                  </span>
                </div>
              </div>

              {/* Interactive Form Card */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                {submitted ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.12)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                      <CheckCircle2 size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Message Received!</h2>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                      Thank you for contacting VendorMind. A merchant representative will get back to your email ({formData.email || 'provided email'}) shortly.
                    </p>
                    <button onClick={() => { setSubmitted(false); setFormData({ name: '', storeName: '', email: '', phone: '', category: 'Sales & Onboarding', message: '' }); }} className="btn-secondary">
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageSquare size={18} color="var(--brand)" /> Send us a Message
                    </h2>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                      Fill in your details and topic so we can assign the right team member.
                    </p>

                    <div className="responsive-two-col">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Your Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mama Cee"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Store / Business Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Cee Kitchen"
                          value={formData.storeName}
                          onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>

                    <div className="responsive-two-col">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="you@store.com"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>WhatsApp Number</label>
                        <input
                          type="tel"
                          placeholder="08012345678"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Inquiry Category</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                      >
                        <option value="Sales & Onboarding">Sales & Onboarding Help</option>
                        <option value="Technical Support">Technical & WhatsApp Bot Support</option>
                        <option value="Billing & Monnify">Billing, Wallet & Monnify Payments</option>
                        <option value="Partnership Inquiry">Partnership / Enterprise Integration</option>
                        <option value="Other">Other Query</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Your Message *</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us how we can help your store..."
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical' }}
                      />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {loading ? 'Sending Message...' : <><Send size={15} /> Send Message</>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Terms of Service View */}
        {kind === 'terms' && (
          <div className="card-raised" style={{ padding: '3rem 2.5rem' }}>
            <div className="badge" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', marginBottom: '1rem' }}>
              <FileText size={13} /> Legal Agreement
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Terms of Service
            </h1>
            <p style={{ color: 'var(--text-2)', margin: '0 0 2rem', fontSize: '0.95rem' }}>
              Effective Date: July 20, 2026 • VendorMind Technologies Limited
            </p>

            <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.8, fontSize: '0.95rem', color: 'var(--text-2)' }}>
              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>1. Agreement & Acceptance of Terms</h2>
                <p>
                  These Terms of Service ("Terms") govern your access to and use of the VendorMind platform, software applications, APIs, and AI conversational sales services (collectively, "VendorMind" or the "Service"). By creating a vendor account, scanning a WhatsApp QR code, or utilizing our services, you ("Merchant", "Vendor", or "User") enter into a legally binding contract with VendorMind Technologies Limited.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>2. Vendor Account & Merchant Obligations</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your vendor portal credentials. You represent that all catalog information, prices, product stock levels, descriptions, and fulfillment promises uploaded to VendorMind are accurate and compliant with Nigerian law. VendorMind reserves the right to suspend any account engaging in fraudulent sales, deceptive pricing, or unlawful trade.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>3. WhatsApp Automation & Meta Policy Compliance</h2>
                <p>
                  VendorMind operates as an automated sales assistant interfacing with WhatsApp via web sockets and official API protocols. Merchants agree to comply with WhatsApp Business Messaging Policies and Meta Terms of Service. You acknowledge that VendorMind provides human-takeover tools to allow manual intervention whenever a customer requires human assistance.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>4. Prepaid Wallet, Overdraft Buffer & Billing</h2>
                <p>
                  VendorMind operates on a pay-as-you-go prepaid wallet model. Messages and AI processing fees (e.g., ₦0.50 per outbound reply, ₦25.00 per AI response) are deducted automatically from your active merchant wallet balance. An overdraft buffer of ₦1,250 is extended to prevent abrupt conversation drops. If a merchant's balance falls below the overdraft threshold, AI automation pauses until top-up. Wallet credits are non-refundable but do not expire.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>5. Monnify Checkout & Payment Processing</h2>
                <p>
                  Online checkout links generated by VendorMind are processed via <strong>Monnify</strong>. Pending checkout orders place a 30-minute soft reservation lock on store inventory. VendorMind does not store credit card details or handle customer funds directly. Payout settlements, dispute handling, and transaction reconciliations are governed by Monnify's merchant terms.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>6. Intellectual Property & Catalog Rights</h2>
                <p>
                  Merchants retain all intellectual property rights to their product branding, trade names, catalog media, and custom descriptions. VendorMind retains all proprietary rights, source code, AI prompts, vectors, and software architecture powering the platform.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>7. Limitation of Liability & Warranties Disclaimer</h2>
                <p>
                  VendorMind is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all implied warranties including merchantability and fitness for a particular purpose. VendorMind shall not be liable for indirect, incidental, or lost-profit damages arising from network downtime, WhatsApp connectivity interruptions, or Monnify payment gateway outages.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>8. Governing Law & Dispute Resolution</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising out of these Terms shall be resolved through good-faith negotiation, failing which they shall be submitted to binding arbitration under the Arbitration and Mediation Act of Nigeria in Lagos State.
                </p>
              </section>
            </div>
          </div>
        )}

        {/* Privacy Policy View */}
        {kind === 'privacy' && (
          <div className="card-raised" style={{ padding: '3rem 2.5rem' }}>
            <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '1rem' }}>
              <ShieldCheck size={13} /> Data Protection & Privacy
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-2)', margin: '0 0 2rem', fontSize: '0.95rem' }}>
              Effective Date: July 20, 2026 • Compliant with NDPR (Nigeria Data Protection Regulation)
            </p>

            <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.8, fontSize: '0.95rem', color: 'var(--text-2)' }}>
              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>1. Overview & Commitment to Privacy</h2>
                <p>
                  VendorMind Technologies Limited ("VendorMind", "we", "our") respects the privacy of our merchant vendors and their end-user WhatsApp customers. This Privacy Policy details how we collect, store, process, and safeguard personal and business data across our web application, API servers, and WhatsApp conversational AI agents.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>2. Information We Collect</h2>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                  <li><strong>Merchant Account Data:</strong> Vendor store name, email address, phone number, hashed password, and prepaid wallet transaction logs.</li>
                  <li><strong>Catalog & Product Data:</strong> Uploaded Excel/CSV catalog files, product names, descriptions, prices, stock levels, and vector embeddings.</li>
                  <li><strong>WhatsApp Customer Data:</strong> Customer WhatsApp phone numbers (JIDs), chat transcript logs, voice note audio files (transcribed via Groq Whisper), shipping addresses, and cart items.</li>
                  <li><strong>Monnify Payment Data:</strong> Transaction references, payment status, settlement amounts, and timestamps. <em>Note: VendorMind never collects or stores credit/debit card numbers or bank PINs.</em></li>
                </ul>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>3. How We Process & Use Data</h2>
                <p>
                  Data is processed strictly to provide sales automation services:
                </p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                  <li>Generating intelligent, context-aware AI replies to WhatsApp customer product queries.</li>
                  <li>Building shopping carts, locking stock reservations, and generating Monnify payment checkout URLs.</li>
                  <li>Delivering merchant analytics, order management, and wallet billing accounting.</li>
                </ul>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>4. AI Infrastructure & Data Confidentiality Guarantee</h2>
                <p>
                  VendorMind integrates with enterprise AI infrastructure providers (Anthropic Claude API, Groq Whisper, OpenAI Embeddings). <strong>Zero Model Training Guarantee:</strong> Your customer messages, store catalog data, and business transactions are transmitted securely via encrypted API endpoints and are <strong>NEVER used to train public AI models</strong>.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>5. Third-Party Integrations</h2>
                <p>
                  We share minimum necessary data with trusted service providers:
                </p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                  <li><strong>Monnify:</strong> Payment initialization and webhook status verification.</li>
                  <li><strong>Supabase / PostgreSQL:</strong> Encrypted multi-tenant database storage.</li>
                  <li><strong>Groq / Anthropic:</strong> Real-time voice note transcription and AI conversational response generation.</li>
                </ul>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>6. Data Security & Storage Controls</h2>
                <p>
                  VendorMind enforces strict technical and organizational safeguards including TLS 1.3 encryption in transit, AES-256 database encryption at rest, role-based access controls (RBAC), and isolated multi-tenant database boundaries.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>7. Merchant & Customer Privacy Rights (NDPR Alignment)</h2>
                <p>
                  In accordance with the Nigeria Data Protection Regulation (NDPR), vendors and end-users have the right to request access to their personal data, request correction of inaccurate data, or request permanent deletion of customer transcripts or product catalogs by contacting our Data Protection Officer.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>8. Contact Our Data Protection Officer</h2>
                <p>
                  For privacy inquiries, data subject access requests, or regulatory questions, email our DPO directly at <a href="mailto:privacy@vendormind.app" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>privacy@vendormind.app</a>.
                </p>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
