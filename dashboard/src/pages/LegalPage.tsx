import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Mail, ShieldCheck, FileText, CheckCircle2, Phone, MapPin, Send,
  MessageSquare, Clock, Zap, BookOpen, HelpCircle, Search, Sparkles, Building2, Users,
  CheckCircle, Bot, ShoppingCart, CreditCard, Lock, BarChart3, Layers, Mic
} from 'lucide-react';

export type PageKind = 'privacy' | 'terms' | 'contact' | 'about' | 'blog' | 'help' | 'how-it-works' | 'features' | 'pricing';

export default function LegalPage({ kind }: { kind: PageKind }) {
  const navigate = useNavigate();
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

  // Help search & FAQs state
  const [helpQuery, setHelpQuery] = useState('');
  const [activeFaqCategory, setActiveFaqCategory] = useState<string | null>(null);

  // Blog newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
      {/* ── Global Header Navigation ──────────────────────────── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <img src="/logo-dark.png" alt="VendorMind Logo" style={{ height: 32, width: 'auto', display: 'block' }} />
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap' }}>
            <Link to="/how-it-works" style={{ color: kind === 'how-it-works' ? '#818CF8' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'how-it-works' ? 700 : 500 }}>
              How it works
            </Link>
            <Link to="/features" style={{ color: kind === 'features' ? '#818CF8' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'features' ? 700 : 500 }}>
              Features
            </Link>
            <Link to="/pricing" style={{ color: kind === 'pricing' ? '#818CF8' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'pricing' ? 700 : 500 }}>
              Pricing
            </Link>
            <Link to="/about" style={{ color: kind === 'about' ? '#818CF8' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'about' ? 700 : 500 }}>
              About
            </Link>
            <Link to="/blog" style={{ color: kind === 'blog' ? '#818CF8' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'blog' ? 700 : 500 }}>
              Blog
            </Link>
            <Link to="/help" style={{ color: kind === 'help' ? '#818CF8' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'help' ? 700 : 500 }}>
              Help Center
            </Link>
            <Link to="/contact" style={{ color: kind === 'contact' ? '#818CF8' : 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: kind === 'contact' ? 700 : 500 }}>
              Contact
            </Link>

            <Link to="/" className="btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>
              <ArrowLeft size={13} /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main View Container ───────────────────────────────── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>

        {/* ════════════════════════════════════════════════════════ */}
        {/* 1. ABOUT PAGE                                           */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'about' && (
          <div>
            {/* Page Headline */}
            <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 3.5rem' }}>
              <div className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', margin: '0 auto 1.25rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={13} /> About VendorMind
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontWeight: 800, margin: '0 0 1.5rem', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                We built VendorMind because we got tired of watching great businesses lose sales to unanswered messages.
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '1.15rem', lineHeight: 1.7, margin: 0 }}>
                VendorMind started with a simple observation: millions of vendors across Africa are running real, thriving businesses entirely on WhatsApp - and they're doing it manually. Every product question answered by hand. Every payment link sent personally. Every order tracked in a notebook or a mental note. The business works, but the owner is the bottleneck.
              </p>
              <p style={{ color: '#818CF8', fontSize: '1.15rem', fontWeight: 600, marginTop: '1.25rem' }}>
                We asked one question: what if the business could run without the owner being available every minute?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: 900, margin: '0 auto' }}>
              {/* Our Mission */}
              <div className="card-raised" style={{ padding: '2.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#818CF8', margin: '0 0 1rem' }}>
                  Our Mission
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 1rem' }}>
                  Our mission is to give every African vendor access to the kind of sales infrastructure that was previously only available to large companies with tech teams and enterprise software budgets.
                </p>
                <p style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
                  Not a menu bot. Not a FAQ tree. A genuinely intelligent sales agent that understands your customers, knows your products, handles your payments, and tells you what's working - in plain English.
                </p>
              </div>

              {/* Why WhatsApp */}
              <div className="card-raised" style={{ padding: '2.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', margin: '0 0 1rem' }}>
                  Why WhatsApp
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 1rem' }}>
                  We didn't choose WhatsApp because it was trendy. We chose it because your customers are already there. They don't need to download an app. They don't need to create an account. They message you the same way they message their friends - and VendorMind makes sure someone is always there to reply.
                </p>
                <p style={{ fontSize: '1.1rem', color: '#F59E0B', fontWeight: 700, margin: 0 }}>
                  WhatsApp is Africa's storefront. We built the staff for it.
                </p>
              </div>

              {/* What We Believe */}
              <div className="card-raised" style={{ padding: '2.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#10B981', margin: '0 0 1rem' }}>
                  What We Believe
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 1.25rem' }}>
                  We believe financial intelligence shouldn't be a luxury.
                </p>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                  Large companies have sales teams, analytics platforms, business intelligence tools, and financial advisors. A vendor in Yaba Market has a phone and a WhatsApp group. VendorMind closes that gap.
                </p>
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>
                  Every vendor who uses VendorMind gets:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem', fontSize: '1rem', color: 'var(--text-2)' }}>
                  <div>- A 24/7 sales agent that never takes a day off</div>
                  <div>- A business advisor that tells them what their data means</div>
                  <div>- A payment system that closes sales inside the conversation</div>
                  <div>- Insights that were previously only available to businesses ten times their size</div>
                </div>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
                  We believe the vendor who sells the best jollof rice in Abuja deserves the same quality of business intelligence as a Shopify merchant in London. VendorMind makes that possible.
                </p>
              </div>

              {/* The Team */}
              <div className="card-raised" style={{ padding: '2.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#818CF8', margin: '0 0 1rem' }}>
                  The Team
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 1rem' }}>
                  We are builders, not consultants. We built VendorMind because we saw the problem firsthand - vendors losing sales, struggling with manual processes, making decisions without data.
                </p>
                <p style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
                  VendorMind is built in Nigeria, for Nigerian vendors first, with a clear path to every African market where WhatsApp commerce is the primary way people buy and sell.
                </p>
              </div>

              {/* Where We're Going */}
              <div className="card-raised" style={{ padding: '2.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', margin: '0 0 1rem' }}>
                  Where We're Going
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 1rem' }}>
                  Today, VendorMind handles sales conversations and gives vendors daily business intelligence. Tomorrow, it will predict when you'll run out of stock before you do. It will recommend which products to promote based on buying patterns. It will tell you when to reorder from your supplier. It will help you understand your cash flow - and eventually, help you access working capital based on your verified sales history.
                </p>
                <p style={{ fontSize: '1.1rem', color: '#F59E0B', fontWeight: 700, margin: 0 }}>
                  We are building the financial operating system for African commerce. WhatsApp is where we start. It is not where we stop.
                </p>
              </div>

              {/* Closing Line & CTA */}
              <div style={{ textAlign: 'center', marginTop: '2rem', padding: '3rem 2rem', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 20 }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.6, margin: '0 0 2rem' }}>
                  If you are a vendor who sells on WhatsApp and you are tired of being the bottleneck in your own business - VendorMind was built for you.
                </p>
                <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => navigate('/onboard')} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
                    Get started free →
                  </button>
                  <a href="https://wa.me/2349000000000" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem', textDecoration: 'none' }}>
                    Talk to us on WhatsApp →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 2. PRIVACY POLICY PAGE                                  */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'privacy' && (
          <div className="card-raised" style={{ padding: '3rem 2.5rem', maxWidth: 900, margin: '0 auto' }}>
            <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '1rem' }}>
              <ShieldCheck size={13} /> Privacy Policy
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-2)', margin: '0 0 2rem', fontSize: '0.95rem' }}>
              Last updated: July 30, 2026
            </p>

            <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.8, fontSize: '0.98rem', color: 'var(--text-2)' }}>
              <section>
                <p style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 500, margin: 0 }}>
                  VendorMind ("we," "our," or "us") is committed to protecting the privacy of vendors and their customers. This Privacy Policy explains what information we collect, how we use it, and what rights you have over your data.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  By using VendorMind, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>1. Information We Collect</h2>
                
                <p style={{ fontWeight: 700, color: '#818CF8', marginBottom: '0.5rem' }}>From Vendors (business owners who sign up):</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  <div>- Name and email address (for your VendorMind account)</div>
                  <div>- Business name and description</div>
                  <div>- Product catalog (names, prices, descriptions, stock levels)</div>
                  <div>- WhatsApp number connected to your VendorMind agent</div>
                  <div>- BMONI wallet credentials (we do not store your BMONI secret key after initial connection - it is passed through to BMONI and discarded)</div>
                  <div>- Order and transaction history generated through your agent</div>
                  <div>- Dashboard activity and usage data</div>
                </div>

                <p style={{ fontWeight: 700, color: '#F59E0B', marginBottom: '0.5rem' }}>From Customers (people who message your WhatsApp agent):</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div>- WhatsApp phone number (hashed - we store a non-reversible identifier, not the raw number)</div>
                  <div>- Conversation messages sent to your AI agent</div>
                  <div>- Cart contents and order history</div>
                  <div>- Delivery address if provided during checkout</div>
                  <div>- Payment status (paid / unpaid - not card details, which are handled entirely by BMONI)</div>
                </div>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>2. How We Use Your Information</h2>
                <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>We use vendor information to:</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  <div>- Operate and maintain your VendorMind account</div>
                  <div>- Power your AI sales agent with accurate product and business context</div>
                  <div>- Generate your daily AI Business Advisor briefings</div>
                  <div>- Send you important notifications (low stock alerts, handoff notifications, payment confirmations)</div>
                  <div>- Improve VendorMind's performance and accuracy</div>
                </div>

                <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>We use customer information to:</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  <div>- Enable your AI agent to hold contextual conversations</div>
                  <div>- Remember returning customers so they do not have to repeat themselves</div>
                  <div>- Track order and payment status</div>
                  <div>- Generate anonymized analytics for your Insights dashboard</div>
                </div>

                <p style={{ fontWeight: 700, color: '#10B981', margin: 0 }}>
                  We do not sell your data or your customers' data to third parties. Ever.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>3. Data Storage and Security</h2>
                <p>
                  All data is stored on encrypted servers. Data in transit is protected by TLS (HTTPS). Your product catalog, order history, and conversation logs are stored in isolated, vendor-specific databases. No vendor can access another vendor's data.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  Conversation logs are retained for 90 days by default. You can request earlier deletion at any time.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  We use BMONI for all payment processing. VendorMind never stores, processes, or has access to your customers' card details or bank account information. All financial data is governed by BMONI's own security standards and regulatory compliance.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>4. Data You Own</h2>
                <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Your data belongs to you. At any time you can:</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  <div>- Export your full product catalog as CSV</div>
                  <div>- Export your complete order history as CSV</div>
                  <div>- Export your conversation logs as JSON</div>
                  <div>- Request deletion of your account and all associated data</div>
                </div>
                <p>
                  To export or delete your data, go to Settings → Danger Zone, or contact us at <a href="mailto:privacy@vendormind.co" style={{ color: '#818CF8', fontWeight: 600 }}>privacy@vendormind.co</a>.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>5. WhatsApp and Third-Party Platforms</h2>
                <p>
                  VendorMind connects to WhatsApp to power your sales agent. By connecting your WhatsApp number to VendorMind, you acknowledge that customer messages sent to that number will be processed by our AI system.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  We recommend informing your customers that an AI agent handles initial conversations on your behalf. Your agent's persona and greeting message can be configured to disclose this in any way you choose.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>6. Cookies and Analytics</h2>
                <p>
                  Our website and dashboard use cookies for authentication and session management. We also use anonymized analytics to understand how vendors use the dashboard so we can improve it. We do not use third-party advertising trackers.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>7. Children's Privacy</h2>
                <p>
                  VendorMind is designed for business use and is not intended for use by anyone under the age of 18. We do not knowingly collect data from minors.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>8. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. When we do, we will notify you by email and update the "Last updated" date at the top of this page. Continued use of VendorMind after a policy update constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>9. Contact</h2>
                <p style={{ margin: 0 }}>For privacy-related questions or requests:</p>
                <div style={{ marginTop: '0.5rem' }}>
                  <div>Email: <a href="mailto:privacy@vendormind.co" style={{ color: '#818CF8', fontWeight: 600 }}>privacy@vendormind.co</a></div>
                  <div>Response time: within 48 hours</div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 3. TERMS OF SERVICE PAGE                                */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'terms' && (
          <div className="card-raised" style={{ padding: '3rem 2.5rem', maxWidth: 900, margin: '0 auto' }}>
            <div className="badge" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', marginBottom: '1rem' }}>
              <FileText size={13} /> Terms of Service
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Terms of Service
            </h1>
            <p style={{ color: 'var(--text-2)', margin: '0 0 2rem', fontSize: '0.95rem' }}>
              Last updated: July 30, 2026
            </p>

            <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.8, fontSize: '0.98rem', color: 'var(--text-2)' }}>
              <section>
                <p style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 500, margin: 0 }}>
                  These Terms of Service ("Terms") govern your use of VendorMind, operated by VendorMind Technologies. By creating an account and using VendorMind, you agree to be bound by these Terms.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  Please read them carefully. If you do not agree, do not use VendorMind.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>1. What VendorMind Provides</h2>
                <p style={{ margin: '0 0 0.5rem' }}>VendorMind provides:</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  <div>- An AI-powered sales agent that operates on WhatsApp on your behalf</div>
                  <div>- A vendor dashboard for managing products, orders, and business insights</div>
                  <div>- Integration with BMONI for payment processing</div>
                  <div>- Daily business intelligence briefings powered by AI</div>
                </div>
                <p>
                  VendorMind is a software service. We are not a payment processor, a logistics company, a bank, or a financial advisor. We are a technology platform that connects your business to these capabilities.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>2. Your Responsibilities as a Vendor</h2>
                <p style={{ margin: '0 0 0.5rem' }}>By using VendorMind, you agree to:</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  <div>- Provide accurate product information, pricing, and stock levels</div>
                  <div>- Honor orders placed and paid for through your VendorMind agent</div>
                  <div>- Comply with all applicable Nigerian laws and regulations governing your business and the products you sell</div>
                  <div>- Not use VendorMind to sell prohibited goods including but not limited to: weapons, illegal substances, counterfeit goods, or any product prohibited by Nigerian law</div>
                  <div>- Maintain the security of your VendorMind account credentials</div>
                  <div>- Not share your account with multiple businesses or individuals without written permission from VendorMind</div>
                </div>
                <p>
                  You are responsible for the products you sell and the promises your business makes to customers. VendorMind facilitates the sale - the responsibility for fulfillment is yours.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>3. AI Agent Behavior</h2>
                <p>
                  VendorMind's AI agent responds to customer messages based on the product and business information you provide. The quality and accuracy of your agent's responses depend directly on the accuracy of the information you upload.
                </p>
                <p style={{ marginTop: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>VendorMind is not liable for:</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <div>- Incorrect product information provided by the vendor</div>
                  <div>- AI responses that misrepresent a product due to vague or inaccurate product descriptions</div>
                  <div>- Customer dissatisfaction arising from fulfillment issues</div>
                </div>
                <p style={{ marginTop: '0.75rem' }}>
                  You should review your agent's persona and product data regularly to ensure accuracy.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>4. Payments and Credits</h2>
                <p>
                  VendorMind operates on a prepaid credit system. Credits are deducted as your agent processes messages. All payments for credits are processed through BMONI.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  Credits are non-refundable once consumed. Unused credits may be refunded within 7 days of purchase if your account has no activity - contact <a href="mailto:support@vendormind.co" style={{ color: '#818CF8' }}>support@vendormind.co</a> to request a refund.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  VendorMind does not hold, process, or take custody of any funds paid by your customers. All customer payments go directly to your BMONI wallet. VendorMind has no access to those funds.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>5. Availability and Uptime</h2>
                <p>
                  We aim for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be communicated via email at least 24 hours in advance. Emergency maintenance may occur without advance notice.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  In the event of downtime, your customers will not receive responses from your agent. We recommend informing your customers of your support hours separately for situations where the agent is unavailable.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>6. Prohibited Use</h2>
                <p style={{ margin: '0 0 0.5rem' }}>You may not use VendorMind to:</p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  <div>- Harass, deceive, or defraud customers</div>
                  <div>- Operate as a front for money laundering or financial crimes</div>
                  <div>- Collect customer data beyond what is needed for the sale</div>
                  <div>- Reverse-engineer, copy, or resell VendorMind's technology</div>
                  <div>- Use the platform to send unsolicited bulk messages (spam)</div>
                  <div>- Impersonate another business or individual</div>
                </div>
                <p style={{ fontWeight: 700, color: '#EF4444' }}>
                  Violation of these terms will result in immediate account suspension without refund.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>7. Termination</h2>
                <p>
                  You may cancel your VendorMind account at any time from Settings → Danger Zone. Upon cancellation:
                </p>
                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.5rem 0' }}>
                  <div>- Your agent will stop responding immediately</div>
                  <div>- Your data will be retained for 30 days then permanently deleted</div>
                  <div>- Unused credits are non-refundable unless within the 7-day window described in Section 4</div>
                </div>
                <p>
                  VendorMind may terminate or suspend your account for violation of these Terms, without notice.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>8. Limitation of Liability</h2>
                <p>
                  VendorMind's liability to you in any circumstance is limited to the amount you paid for credits in the 30 days preceding the claim.
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  VendorMind is not liable for lost revenue, lost customers, lost data (beyond what our backup systems cover), or any indirect or consequential damages arising from your use of the platform.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>9. Changes to These Terms</h2>
                <p>
                  We may update these Terms. We will notify you by email at least 14 days before material changes take effect. Continued use after the effective date constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>10. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State, Nigeria.
                </p>
              </section>

              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.75rem' }}>11. Contact</h2>
                <p style={{ margin: 0 }}>For legal and terms-related questions:</p>
                <div style={{ marginTop: '0.5rem' }}>
                  <div>Email: <a href="mailto:legal@vendormind.co" style={{ color: '#818CF8', fontWeight: 600 }}>legal@vendormind.co</a></div>
                  <div>Response time: within 5 business days</div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 4. HELP CENTER PAGE                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'help' && (
          <div>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3rem' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 1.25rem', letterSpacing: '-0.02em' }}>
                How can we help you?
              </h1>
              <div style={{ position: 'relative', maxWidth: 540, margin: '0 auto' }}>
                <Search size={18} color="var(--text-3)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search for answers…"
                  value={helpQuery}
                  onChange={e => setHelpQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '0.9rem 1rem 0.9rem 2.8rem', borderRadius: 14,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    color: 'var(--text)', fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            {/* 6 Visual Category Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
              {[
                { title: 'Getting Started', desc: 'Setting up your account and going live', icon: <Zap size={22} color="#818CF8" /> },
                { title: 'Managing Products', desc: 'Catalog, stock, and product settings', icon: <ShoppingCart size={22} color="#F59E0B" /> },
                { title: 'Orders & Payments', desc: 'How orders work and how you get paid', icon: <CreditCard size={22} color="#10B981" /> },
                { title: 'WhatsApp Agent', desc: 'Your AI agent, conversations, and handoffs', icon: <Bot size={22} color="#818CF8" /> },
                { title: 'Wallet & Billing', desc: 'Credits, top-ups, and usage', icon: <BarChart3 size={22} color="#F59E0B" /> },
                { title: 'Troubleshooting', desc: 'Common issues and how to fix them', icon: <ShieldCheck size={22} color="#10B981" /> }
              ].map((cat, idx) => (
                <div
                  key={idx}
                  className="card-raised"
                  onClick={() => setActiveFaqCategory(activeFaqCategory === cat.title ? null : cat.title)}
                  style={{
                    padding: '1.75rem', cursor: 'pointer',
                    border: activeFaqCategory === cat.title ? '2px solid #818CF8' : '1px solid var(--border)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    {cat.icon}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.35rem' }}>{cat.title}</h3>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', margin: 0 }}>{cat.desc}</p>
                </div>
              ))}
            </div>

            {/* Comprehensive FAQs */}
            <div style={{ maxWidth: 850, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              
              {/* Getting Started */}
              {(!activeFaqCategory || activeFaqCategory === 'Getting Started') && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#818CF8', marginBottom: '1.25rem' }}>
                    Getting Started
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How do I set up VendorMind?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Sign up with your email or Google account. You'll be taken through a 5-step setup: add your business details, upload your product catalog, customize your agent's name and personality, connect your WhatsApp number by scanning a QR code, and top up your wallet. The whole process takes under 10 minutes.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What WhatsApp number should I use?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Use a dedicated business number if you have one. You can use a personal number but note that once it's connected to VendorMind, all messages sent to that number will be handled by the AI agent first. You can take over any conversation manually from the Conversations page.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Can I use my existing WhatsApp Business account?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Yes. When you connect your number during setup, you'll scan a QR code exactly like you would on WhatsApp Web. Your number stays yours - we don't transfer or claim ownership of it.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What happens after I scan the QR code?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Your agent goes live immediately. The next customer who messages that number will receive a response from your AI agent. We recommend testing by sending a message from a different phone first.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Is there a free trial?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Your first ₦2,000 credit purchase is your entry point. There is no time-limited trial - your credits simply last as long as your agent is active. A quiet week uses fewer credits than a busy one.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Managing Products */}
              {(!activeFaqCategory || activeFaqCategory === 'Managing Products') && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B', marginBottom: '1.25rem' }}>
                    Managing Products
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How do I add my products?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Go to Catalog → Add product (or Import CSV for bulk upload). Each product needs a name, price, and description. Stock quantity is optional but recommended so the agent can tell customers when something is running low.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What format should my CSV be in?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Your CSV needs these columns: Name, Price, Description, Category, Stock. Download our template from the Catalog page for the exact format. Prices should be in naira as numbers only (e.g. 2500, not ₦2,500).</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How does the AI learn my products?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: When you add or update a product, our system automatically generates an AI embedding - a deep understanding of what that product is - within a few minutes. You'll see the status change from "Embedding..." to "AI indexed" on the Catalog page. Until a product is indexed, it uses basic text search as a fallback.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Can I have products in different languages?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Yes. Your agent responds in whatever language the customer uses. If your product descriptions are in English and a customer writes in Yoruba or Pidgin, the agent will respond in Pidgin or Yoruba and still find the right product.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What happens when a product goes out of stock?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: The agent will stop recommending that product and will tell customers it's currently unavailable if they ask specifically for it. You'll also receive an alert on your dashboard. You can mark products as back in stock at any time from the Catalog page.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Can I hide products without deleting them?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Yes. Toggle the "Active" switch on any product card to hide it from your agent without removing it from your catalog. Useful for seasonal products or items temporarily unavailable.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders & Payments */}
              {(!activeFaqCategory || activeFaqCategory === 'Orders & Payments') && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#10B981', marginBottom: '1.25rem' }}>
                    Orders & Payments
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How does payment work?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: When a customer is ready to checkout, your agent generates a secure BMONI payment link and sends it inside the WhatsApp conversation. The customer taps the link, completes payment, and receives a confirmation message. Your order is automatically marked as paid in your dashboard.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Where does the money go?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Directly to your BMONI wallet. VendorMind never holds or touches your customer payments. The money goes from your customer to your BMONI wallet - we are simply the connector.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How do I receive my money?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Log into your BMONI account and withdraw to your Nigerian bank account at any time. VendorMind does not control your withdrawal schedule.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What happens if a customer doesn't pay?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Payment links expire after 30 minutes. If a customer hasn't paid after 15 minutes, your agent sends a single follow-up message. After 30 minutes, the link expires, the stock reservation is released, and the order is marked as cancelled. The customer can restart the checkout process at any time.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Can I give a customer a discount?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Not automatically through the agent yet - this is on our roadmap. For now, you can take over the conversation manually and negotiate a price before the agent generates the payment link.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How do I mark an order as delivered?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Go to Orders, find the order, and click "View." You'll see a "Mark as delivered" button. This updates the order status and sends a delivery confirmation message to the customer.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Can I cancel or refund an order?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: You can cancel an unpaid order from the Orders page. For refunds on paid orders, you will need to process the refund directly through your BMONI account. VendorMind will update the order status to "Refunded" when you mark it accordingly.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Agent */}
              {(!activeFaqCategory || activeFaqCategory === 'WhatsApp Agent') && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#818CF8', marginBottom: '1.25rem' }}>
                    WhatsApp Agent
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What can my agent do?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Your agent can answer product questions, recommend products based on what the customer describes, add items to a cart, handle checkout, generate payment links, confirm payments, answer FAQs you've set up, understand voice notes, and hand off to you when needed.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What can't my agent do?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Your agent cannot process refunds, negotiate prices, access information outside your product catalog and business profile, or make promises you haven't authorized. It also cannot access external websites or look up information beyond what you've provided.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How does voice note support work?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: When a customer sends a voice note, your agent automatically transcribes it and responds as if the customer had typed the message. You don't need to configure anything - it works out of the box.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What happens if the agent doesn't know the answer?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: If a customer asks something outside your catalog or FAQs, the agent acknowledges it gracefully and offers to connect them with you. It never makes up information.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How does human handoff work?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: If a customer types "human," "agent," or "speak to someone," the agent immediately steps aside and sends you a notification via WhatsApp and email. You take over the conversation in your normal WhatsApp app. When you're done, go to the Conversations page and click "Resume AI" to hand back to the agent.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Can I see what the agent is saying to my customers?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Yes. Every conversation is logged in real time in the Conversations page. You can read the full transcript, see the outcome tag, and take over at any time.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Can I change my agent's name and personality?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Yes. Go to Settings → Agent Persona. You can change the name, tone (Friendly / Professional / Energetic), greeting message, and custom FAQs at any time. Changes take effect on the next conversation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet & Billing */}
              {(!activeFaqCategory || activeFaqCategory === 'Wallet & Billing') && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B', marginBottom: '1.25rem' }}>
                    Wallet & Billing
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How do credits work?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Credits are VendorMind's usage currency. Each interaction with your AI agent consumes a small amount of credits: ₦0.50 per inbound message, ₦0.50 per outbound reply, and ₦25 per AI response. A typical sales conversation costs approximately ₦50–₦80 in credits from greeting to payment confirmation.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: How do I top up?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Go to Wallet → Add credits. Select an amount (₦1,000 / ₦2,000 / ₦5,000 / ₦10,000) and pay via BMONI checkout. Credits are added to your account instantly after payment.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: What happens when I run out of credits?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Your agent will stop responding to new messages. Active conversations in progress will complete, but no new conversations will start until you top up. You'll receive email and WhatsApp alerts when your balance drops below ₦1,000.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Can I set up auto top-up?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Yes. In Wallet settings, enable Auto top-up and set your preferred top-up amount. When your balance drops below ₦1,000, we'll automatically charge your saved BMONI payment method for your chosen amount.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: Are credits refundable?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Unused credits purchased within the last 7 days with no account activity can be refunded. Contact support@vendormind.co. Credits already consumed are non-refundable.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Troubleshooting */}
              {(!activeFaqCategory || activeFaqCategory === 'Troubleshooting') && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#10B981', marginBottom: '1.25rem' }}>
                    Troubleshooting
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: My agent isn't responding to messages. What do I do?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Check three things in order:<br />1. Go to WhatsApp Setup in your dashboard and check your connection status. If it shows "Disconnected," click Reconnect and scan the QR code again.<br />2. Check your wallet balance - if it's zero, your agent is paused.<br />3. Check if the conversation has a "Handoff" tag - if a handoff is active, the agent is intentionally stepped aside.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: My WhatsApp got disconnected. Why?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: WhatsApp periodically requires re-authentication. When this happens, you'll receive an urgent email and WhatsApp notification. Go to WhatsApp Setup and scan the QR code to reconnect. Your agent will resume instantly.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: A customer says their payment link isn't working.</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Payment links expire after 30 minutes. If the customer's link has expired, go to the Orders page, find their order, and click "Resend payment link" to generate a fresh one.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: My products aren't showing up in conversations.</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Check the Catalog page. Products with "Embedding..." status haven't been indexed yet - wait a few minutes and try again. If a product shows "Failed," click the retry button next to it.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: I accidentally deleted a product that had orders.</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: Deleting a product removes it from future conversations but doesn't affect existing orders. Your order history is preserved. If you need to restore a product, re-add it to your catalog.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: The AI said something incorrect about my product.</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: This usually means the product description needs more detail. Go to Catalog, edit the product, and add more specific information. The agent's understanding will update within a few minutes of saving.</p>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>Q: I need help urgently. How do I reach you?</h4>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>A: WhatsApp us directly at +234 (0) 900 VENDORMIND - we respond within 2 hours during business hours (8am–8pm WAT, Monday–Saturday). For non-urgent issues, email support@vendormind.co.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 5. CONTACT PAGE                                         */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'contact' && (
          <div>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3.5rem' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
                We're real people. Talk to us.
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                Whether you have a question before signing up, a problem with your account, or a partnership idea - reach out. We respond fast.
              </p>
            </div>

            {/* Three Contact Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
              {/* Card 1 */}
              <div className="card-raised" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(22,163,74,0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Phone size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>WhatsApp Support</h3>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                    The fastest way to reach us. We respond within 2 hours on business days.
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 600 }}>Available: Mon–Sat, 8am–8pm WAT</p>
                </div>
                <a href="https://wa.me/2349000000000" target="_blank" rel="noreferrer" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', padding: '0.75rem', marginTop: '1.5rem', background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                  WhatsApp us →
                </a>
              </div>

              {/* Card 2 */}
              <div className="card-raised" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Mail size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Email</h3>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                    For detailed questions, account issues, and billing.
                  </p>
                  <a href="mailto:support@vendormind.co" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
                    support@vendormind.co
                  </a>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 600, marginTop: '1.5rem' }}>Response time: within 24 hours</div>
              </div>

              {/* Card 3 */}
              <div className="card-raised" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Building2 size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>For Partnerships & Enterprise</h3>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                    Building something bigger? Want to integrate VendorMind into your platform or serve a large merchant base?
                  </p>
                  <a href="mailto:hello@vendormind.co" style={{ color: '#F59E0B', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
                    hello@vendormind.co
                  </a>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 600, marginTop: '1.5rem' }}>Enterprise & Integration desk</div>
              </div>
            </div>

            {/* Contact Form & FAQ */}
            <div style={{ maxWidth: 850, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              <div className="card-raised" style={{ padding: '2.5rem' }}>
                {submitted ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.12)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                      <CheckCircle2 size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Message Received!</h2>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                      Thank you for contacting VendorMind. A merchant representative will get back to your email ({formData.email}) shortly.
                    </p>
                    <button onClick={() => { setSubmitted(false); setFormData({ name: '', storeName: '', email: '', phone: '', category: 'Sales & Onboarding', message: '' }); }} className="btn-secondary">
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageSquare size={18} color="var(--brand)" /> Send us a Message
                    </h2>

                    <div className="responsive-two-col">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Your Name *</label>
                        <input
                          type="text" required placeholder="e.g. Mama Cee"
                          value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Store / Business Name</label>
                        <input
                          type="text" placeholder="e.g. Cee Kitchen"
                          value={formData.storeName} onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>

                    <div className="responsive-two-col">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Email Address *</label>
                        <input
                          type="email" required placeholder="you@store.com"
                          value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>WhatsApp Number</label>
                        <input
                          type="tel" placeholder="08012345678"
                          value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Inquiry Category</label>
                      <select
                        value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
                      >
                        <option value="Sales & Onboarding">Sales & Onboarding Help</option>
                        <option value="Technical Support">Technical & WhatsApp Bot Support</option>
                        <option value="Billing & BMONI">Billing, Wallet & BMONI Smart Wallet</option>
                        <option value="Partnership Inquiry">Partnership / Enterprise Integration</option>
                        <option value="Other">Other Query</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-2)' }}>Your Message *</label>
                      <textarea
                        required rows={4} placeholder="Tell us how we can help your store..."
                        value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical' }}
                      />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {loading ? 'Sending Message...' : <><Send size={15} /> Send Message</>}
                    </button>
                  </form>
                )}
              </div>

              {/* FAQ section below contact cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Frequently Asked Questions</h3>
                
                <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Do you offer phone support?</h4>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>Not currently. WhatsApp and email cover everything faster and give us a written record to help you better.</p>
                </div>

                <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem' }}>What are your support hours?</h4>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>Monday to Saturday, 8am to 8pm West Africa Time. Outside these hours, your message is queued and answered first thing the next business day.</p>
                </div>

                <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem' }}>I'm a journalist or researcher. Who do I contact?</h4>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>Email hello@vendormind.co with your publication, topic, and deadline. We'll get back to you within 48 hours.</p>
                </div>

                <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem' }}>I found a security issue. What should I do?</h4>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>Please email security@vendormind.co immediately. Do not post about it publicly. We take security reports seriously and will respond within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 6. HOW IT WORKS PAGE                                    */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'how-it-works' && (
          <div>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3.5rem' }}>
              <div className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', margin: '0 auto 1rem', display: 'inline-flex' }}>
                <Clock size={13} /> Setup Guide
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
                From zero to selling in 10 minutes.
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                VendorMind is designed to be live before you finish your morning tea. Here's exactly what happens, step by step.
              </p>
            </div>

            {/* Visual Stepper */}
            <div style={{ maxWidth: 850, margin: '0 auto 4rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Step 1 */}
              <div className="card-raised" style={{ padding: '2.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#818CF8', fontFamily: 'var(--font-display)', lineHeight: 1 }}>01</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Create your account</h3>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
                  Sign up with your email address or Google account. No credit card required to get started.<br /><br />
                  Your account is ready in seconds.
                </p>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <CheckCircle size={20} color="#10B981" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-2)', fontWeight: 600 }}>Instant activation with Google or email auth</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="card-raised" style={{ padding: '2.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'var(--font-display)', lineHeight: 1 }}>02</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Tell us about your business</h3>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
                  Add your business name, what you sell, your location, and your delivery areas. This is what your agent uses to introduce your business to customers.<br /><br />
                  Takes about 2 minutes.
                </p>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Building2 size={20} color="#F59E0B" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-2)', fontWeight: 600 }}>Configures business context & delivery areas</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="card-raised" style={{ padding: '2.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-display)', lineHeight: 1 }}>03</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Upload your product catalog</h3>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
                  Add your products one by one or import them all at once from a CSV file. Each product gets a name, description, price, and stock quantity.<br /><br />
                  As soon as you save a product, VendorMind's AI begins learning it. Within minutes, your agent understands your entire catalog well enough to answer detailed questions about every item.<br /><br />
                  You can add products in any language. You can update prices and stock at any time. Your agent reflects changes immediately.
                </p>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Sparkles size={20} color="#10B981" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-2)', fontWeight: 600 }}>Automatic AI Vector Indexing ("AI indexed" badge)</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="card-raised" style={{ padding: '2.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#818CF8', fontFamily: 'var(--font-display)', lineHeight: 1 }}>04</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Name your agent and set the tone</h3>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
                  Give your agent a name your customers will see. Choose how it sounds - friendly and warm, professional and precise, or energetic and enthusiastic.<br /><br />
                  Write a custom greeting, add your frequently asked questions, and set your return and delivery policies. Your agent speaks your brand's language, not ours.
                </p>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Bot size={20} color="#818CF8" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-2)', fontWeight: 600 }}>Custom agent name, tone selector, and greetings</span>
                </div>
              </div>

              {/* Step 5 */}
              <div className="card-raised" style={{ padding: '2.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'var(--font-display)', lineHeight: 1 }}>05</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Connect WhatsApp and go live</h3>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
                  Scan a QR code - exactly like you would on WhatsApp Web. Your number stays yours. Nothing changes on your phone.<br /><br />
                  The moment you scan, your agent is live. The next customer who messages that number gets an instant, intelligent response.<br /><br />
                  Top up your wallet with a minimum of ₦2,000 in credits and your agent stays active 24 hours a day, 7 days a week.
                </p>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <span style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 700 }}>WhatsApp Pairing Connected • 24/7 Agent Live</span>
                </div>
              </div>
            </div>

            {/* What happens after you go live */}
            <div className="card-raised" style={{ padding: '3rem 2.5rem', maxWidth: 850, margin: '0 auto 3.5rem', background: 'var(--surface-raised)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 1rem' }}>
                What happens after you go live:
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
                Every conversation your agent has is logged in your dashboard. Every order is tracked. Every payment is confirmed automatically. Every morning, your AI Business Advisor sends you a plain-English summary of what your business did the day before.
              </p>
              <p style={{ color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                You don't need to check anything. If something needs your attention - a low stock alert, a handoff request, a payment waiting - you get a notification.
              </p>
              <p style={{ color: '#818CF8', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Your business runs. You stay informed. You stay in control.
              </p>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => navigate('/onboard')} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
                  Start your setup now →
                </button>
                <button className="btn-secondary" onClick={() => navigate('/pricing')} style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
                  See pricing →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 7. FEATURES PAGE                                        */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'features' && (
          <div>
            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 3.5rem' }}>
              <div className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', margin: '0 auto 1rem', display: 'inline-flex' }}>
                <Sparkles size={13} /> Complete Feature Set
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
                Everything your sales team would do. Without the payroll.
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                VendorMind is not a chatbot. It is a complete commerce and intelligence system that happens to live inside WhatsApp.
              </p>
            </div>

            {/* 10 Detailed Feature Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 900, margin: '0 auto 4rem' }}>
              
              {/* Feature 1 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Bot size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 1 - AI Sales Agent</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818CF8', margin: '0 0 0.75rem' }}>Headline: Your best salesperson. Available 24/7.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Your AI agent greets every customer, understands what they're looking for, recommends the right products, handles questions, and guides them to checkout - in natural language, not menu options.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  A customer who types "I'm looking for something for my wife's birthday, she likes floral scents, budget around ₦15,000" gets a personal recommendation, not a numbered list.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  Your agent sounds like your brand. It uses the name you chose. It has the personality you set. Your customers never know they're talking to AI unless you choose to tell them.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Search size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 2 - Semantic Product Search</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B', margin: '0 0 0.75rem' }}>Headline: Finds products the way humans think.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Traditional search requires exact words. If a customer types "red dress" and your product is called "Crimson Midi Gown," basic search misses it.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  VendorMind's AI understands meaning, not just keywords. It finds the right product even when the customer describes it differently from how you named it. It works across languages. It works with abbreviations and colloquial descriptions.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  The more detailed your product descriptions, the better the matches.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Mic size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 3 - Voice Commerce</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981', margin: '0 0 0.75rem' }}>Headline: Your customers can speak. You don't have to type.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Across Africa, WhatsApp voice notes are how people communicate naturally. A trader in a busy market doesn't have time to type. A customer in traffic sends a voice note.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  VendorMind transcribes every voice note automatically and responds as if the customer had typed it. No setup required. No extra cost.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  Your agent understands Nigerian English, Pidgin, and multiple local languages.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <ShoppingCart size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 4 - Smart Cart Management</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818CF8', margin: '0 0 0.75rem' }}>Headline: Tracks everything. Makes no mistakes.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Your agent maintains a precise cart for every customer. Items added, quantities updated, totals calculated - all handled by the system, not by the AI guessing.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  The cart persists across a conversation. A customer who adds something then comes back an hour later still has their cart. Nothing is lost.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  When the customer is ready to checkout, the agent summarizes the cart, confirms the total, and generates the payment link.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <CreditCard size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 5 - In-Chat Payment</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B', margin: '0 0 0.75rem' }}>Headline: From "I'll take it" to "Payment confirmed" without leaving WhatsApp.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Your agent generates a secure BMONI payment link and sends it directly inside the chat. The customer taps it, pays, and receives a confirmation - all within the same conversation.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  No redirect to a website. No "check your email for the payment link." No manual follow-up.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  Stock is reserved the moment the payment link is generated. If the customer doesn't pay within 30 minutes, the reservation is released automatically and the stock returns to available.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Users size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 6 - Human Handoff</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981', margin: '0 0 0.75rem' }}>Headline: The AI knows when to step aside.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  When a customer asks for a human, expresses frustration, or has a question outside what your agent can handle - the agent steps aside immediately and notifies you.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  You receive a WhatsApp message and email alert. You take over the conversation in your own WhatsApp. When you're done, one tap in the dashboard hands control back to the agent.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  You set your available hours. Outside those hours, the agent tells customers you'll respond the next business day - and logs the conversation for your review in the morning.
                </p>
              </div>

              {/* Feature 7 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Sparkles size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 7 - AI Business Advisor</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818CF8', margin: '0 0 0.75rem' }}>Headline: Your business, explained in plain English. Every morning.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Every morning, before you open your dashboard, VendorMind's AI has already analyzed everything that happened in your business the previous day.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  When you open the Overview page, you see a briefing written in plain language - not charts, not tables. Sentences. Like a business partner who stayed up all night reading your numbers.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  It tells you what sold, what didn't, why your revenue changed, which products are running low, and exactly one thing you should do today.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  Then you can ask it anything. "Which product should I promote this weekend?" "Why did three customers abandon checkout?" "Am I on track to beat last month?" It answers from your real data, in real time.
                </p>
              </div>

              {/* Feature 8 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Layers size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 8 - Inventory Intelligence</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B', margin: '0 0 0.75rem' }}>Headline: Know you're running low before you run out.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  VendorMind tracks stock in real time. Every order automatically decrements the quantity. Every soft reservation during checkout temporarily holds stock so two customers can't buy the last item simultaneously.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  When any product drops to 5 units or below, you get an alert. Your AI Business Advisor tells you when, at your current sales rate, you'll run out - so you can restock before your customers hit an out-of-stock wall.
                </p>
              </div>

              {/* Feature 9 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <BarChart3 size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 9 - Conversation Analytics</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981', margin: '0 0 0.75rem' }}>Headline: See exactly where your sales process wins and loses.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Your Insights page shows the full conversion funnel for every time period you choose: How many customers messaged → how many browsed → how many added to cart → how many received a payment link → how many paid.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Each drop-off point is a question worth asking. Your AI Business Advisor helps you answer it.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: 0 }}>
                  You also see your busiest hours, your top products by revenue, and which conversations converted vs which were abandoned - so you can make decisions based on reality, not assumption.
                </p>
              </div>

              {/* Feature 10 */}
              <div className="card-raised" style={{ padding: '2.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Building2 size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Feature 10 - Multi-Platform Ready</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818CF8', margin: '0 0 0.75rem' }}>Headline: WhatsApp today. Every channel tomorrow.</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  VendorMind launches on WhatsApp because that's where your customers are right now. But the platform is built to expand.
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  Telegram is next. Then Instagram DMs. Then TikTok. Each new channel your customers move to, your agent moves with them.
                </p>
                <p style={{ color: '#818CF8', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  One platform. One dashboard. Every channel.
                </p>
              </div>
            </div>

            {/* Bottom CTA section */}
            <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 20, maxWidth: 850, margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 1rem' }}>
                Every feature works together.
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.65, margin: '0 0 2rem' }}>
                You don't manage them separately. You set up once and the system handles everything - sales, payments, inventory, intelligence - as a single coordinated operation.
              </p>
              <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => navigate('/onboard')} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
                  Get started free →
                </button>
                <button className="btn-secondary" onClick={() => navigate('/pricing')} style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
                  See pricing →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 8. PRICING PAGE                                         */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'pricing' && (
          <div>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3.5rem' }}>
              <div className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', margin: '0 auto 1rem', display: 'inline-flex' }}>
                <CreditCard size={13} /> Transparent Pricing
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
                Pay for what you use. Nothing more.
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                VendorMind runs on prepaid credits. No monthly lock-in. No hidden fees. Your agent runs as long as your credits last - and topping up takes 30 seconds.
              </p>
            </div>

            {/* Three Pricing Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'stretch', marginBottom: '4rem' }}>
              {/* Starter */}
              <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Starter</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', margin: '0.75rem 0 0.35rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)' }}>₦2,000</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>Best for: Testing VendorMind and small stores just getting started</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem', flex: 1 }}>
                  {['~200 AI conversation responses', '1 WhatsApp number', 'Full product catalog (unlimited products)', 'BMONI payment collection', 'Order tracking dashboard', 'Email support'].map(feat => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-2)' }}>
                      <CheckCircle size={16} color="#10B981" /> {feat}
                    </div>
                  ))}
                </div>

                <button className="btn-secondary" onClick={() => navigate('/onboard')} style={{ width: '100%', padding: '0.85rem' }}>
                  Get started →
                </button>
              </div>

              {/* Growth */}
              <div className="card" style={{
                padding: '2.5rem', display: 'flex', flexDirection: 'column',
                background: 'var(--surface-raised)', border: '2px solid #6366F1',
                boxShadow: '0 0 32px rgba(99,102,241,0.25)', position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff',
                  padding: '0.3rem 1rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                  letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>
                  MOST POPULAR
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Growth</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', margin: '0.75rem 0 0.35rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: '#818CF8' }}>₦5,000</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>Best for: Active vendors doing consistent daily sales</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem', flex: 1 }}>
                  {[
                    '~600 AI conversation responses',
                    '1 WhatsApp number',
                    'Everything in Starter',
                    'AI Business Advisor daily briefings',
                    'Sales insights and conversion funnel',
                    'Human handoff alerts (WhatsApp + email)',
                    'Voice note transcription',
                    'Priority processing',
                    'WhatsApp support'
                  ].map(feat => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                      <CheckCircle size={16} color="#818CF8" /> {feat}
                    </div>
                  ))}
                </div>

                <button className="btn-primary" onClick={() => navigate('/onboard')} style={{ width: '100%', padding: '0.85rem' }}>
                  Get started →
                </button>
              </div>

              {/* Scale */}
              <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Scale</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', margin: '0.75rem 0 0.35rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)' }}>₦10,000</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>Best for: High-volume vendors and small teams</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem', flex: 1 }}>
                  {[
                    '~1,500 AI conversation responses',
                    'Up to 3 WhatsApp numbers',
                    'Everything in Growth',
                    'Advanced analytics',
                    'Custom agent persona per number',
                    'Dedicated support contact',
                    'Early access to new features'
                  ].map(feat => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-2)' }}>
                      <CheckCircle size={16} color="#10B981" /> {feat}
                    </div>
                  ))}
                </div>

                <button className="btn-secondary" onClick={() => navigate('/onboard')} style={{ width: '100%', padding: '0.85rem' }}>
                  Get started →
                </button>
              </div>
            </div>

            {/* How credits work section */}
            <div className="card-raised" style={{ padding: '2.5rem', maxWidth: 850, margin: '0 auto 4rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1rem' }}>
                What counts as one credit?
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
                Every interaction with your agent uses a tiny amount of credits from your balance.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem', color: 'var(--text)', marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Inbound message (customer texts your agent)</span>
                  <strong style={{ color: '#818CF8' }}>₦0.50</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Outbound reply (agent responds)</span>
                  <strong style={{ color: '#818CF8' }}>₦0.50</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>AI processing (smart sales response)</span>
                  <strong style={{ color: '#F59E0B' }}>₦25.00</strong>
                </div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: '0.98rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                A typical sales conversation from greeting to payment confirmation uses approximately ₦50–₦80.
              </p>
              <p style={{ color: '#10B981', fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                That means on the Growth plan (₦5,000), you get roughly 60–100 complete sales conversations. If your average order is ₦5,000, closing even 10 of those pays for the credits 10 times over.
              </p>
            </div>

            {/* Pricing FAQ */}
            <div style={{ maxWidth: 850, margin: '0 auto 4rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Pricing FAQs</h3>
              
              <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Do credits expire?</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>No. Your credits stay in your account until you use them. There's no monthly reset, no expiry date.</p>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Can I top up mid-month?</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>Yes. Any time. Top up with any amount you choose - you're not locked into the packages above. Those are just the recommended amounts.</p>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem' }}>What happens if I run out of credits mid-conversation?</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>Active conversations in progress finish. New conversations won't start until you top up. Your customers receive no error message - the agent simply won't respond to new conversations.</p>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Is there a free trial?</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>We don't offer a time-limited trial because credits don't expire - your ₦2,000 Starter pack is effectively a trial. Use it, test it, see how it works for your business.</p>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Can I switch between packages?</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>There are no packages to switch between - you buy credits as you need them. A month where you're very busy, buy ₦10,000. A quieter month, ₦2,000 might be enough.</p>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Do you offer discounts for larger purchases?</h4>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', margin: 0 }}>Contact us at hello@vendormind.co for bulk credit pricing if you're managing multiple businesses or have high monthly volumes.</p>
              </div>
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--surface-raised)', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 850, margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>Still have questions?</h3>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://wa.me/2349000000000" target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
                  WhatsApp us →
                </a>
                <button className="btn-secondary" onClick={() => navigate('/help')} style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
                  Read the help center →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* 9. BLOG PAGE                                            */}
        {/* ════════════════════════════════════════════════════════ */}
        {kind === 'blog' && (
          <div>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3.5rem' }}>
              <div className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', margin: '0 auto 1rem', display: 'inline-flex' }}>
                <BookOpen size={13} /> Official Blog
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
                The VendorMind Blog
              </h1>
              <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                Practical guides, business insights, and honest takes on selling in Africa's digital economy.
              </p>
            </div>

            {/* Grid of 6 Blog Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
              {[
                {
                  title: "Why your WhatsApp customers stop replying before they pay - and how to fix it",
                  cat: "Sales Tips", date: "July 2026",
                  preview: "The drop-off between \"I'll take it\" and actual payment is where most WhatsApp vendors lose 40% of their sales. Here's why it happens and what your checkout flow should look like."
                },
                {
                  title: "The 3am sale: what happens when a customer messages you while you sleep",
                  cat: "VendorMind Features", date: "July 2026",
                  preview: "We followed 100 WhatsApp conversations that happened between midnight and 6am. Here's what customers asked, how they responded to AI replies, and how many became paid orders."
                },
                {
                  title: "How to write product descriptions that sell for you",
                  cat: "Business Growth", date: "July 2026",
                  preview: "The quality of your AI agent's recommendations is directly tied to how you describe your products. This guide shows you exactly what good looks like vs what breaks the AI."
                },
                {
                  title: "Voice notes, Pidgin, and broken English: how VendorMind handles real Nigerian customers",
                  cat: "How It Works", date: "July 2026",
                  preview: "Real customers don't type perfectly. They send voice notes, abbreviate everything, switch languages mid-sentence. Here's how VendorMind handles every case."
                },
                {
                  title: "From fashion vendor to ₦500k/month: what the data actually shows",
                  cat: "Success Stories", date: "July 2026",
                  preview: "We looked at the top performing vendors on VendorMind and pulled out the patterns. Catalog size, response time, pricing - here's what actually moves the needle."
                },
                {
                  title: "The real cost of manual WhatsApp selling (we did the math)",
                  cat: "Business Growth", date: "July 2026",
                  preview: "If you're answering 50 messages a day manually, we calculated exactly how many hours that costs you per year and what that time is worth. The number will surprise you."
                }
              ].map((post, i) => (
                <div key={i} className="card-raised" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                        {post.cat}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{post.date}</span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.75rem', lineHeight: 1.4, color: 'var(--text)' }}>
                      {post.title}
                    </h3>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                      {post.preview}
                    </p>
                  </div>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#818CF8', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Read full guide →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Newsletter signup at bottom */}
            <div className="card-raised" style={{ padding: '3rem 2.5rem', maxWidth: 700, margin: '0 auto', textAlign: 'center', background: 'var(--surface-raised)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
                Get the next article in your inbox.
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', margin: '0 0 1.75rem' }}>
                We publish twice a month. No spam. Unsubscribe any time.
              </p>

              {newsletterSubscribed ? (
                <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid #10B981', color: '#10B981', padding: '1rem', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem' }}>
                  ✓ Thank you for subscribing! Check your inbox soon.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="email" required placeholder="Your email address"
                    value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)}
                    style={{
                      flex: 1, minWidth: 260, padding: '0.85rem 1rem', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.95rem'
                    }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
                    Subscribe →
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
