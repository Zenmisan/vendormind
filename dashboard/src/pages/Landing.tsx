import { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useScrollReveal, useStaggerReveal } from '../lib/useScrollReveal';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, Bot, Brain, Building2, CheckCircle, Clock3, CreditCard,
  FileSpreadsheet, MessageCircle, Mic, PackageCheck, Search,
  ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Store,
  WalletCards, ArrowRight, Zap,
} from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

const features = [
  { Icon: Bot,       title: 'Claude AI Agent',        desc: 'Understands product questions, remembers context, builds carts, and handles checkout from chat.',        color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
  { Icon: Mic,       title: 'Voice Notes',             desc: 'Customers can send voice notes. Groq Whisper transcribes them so ordering still feels natural.',        color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { Icon: CreditCard,title: 'Monnify Payments',          desc: 'Create Monnify payment links inside the conversation with stock reserved until checkout expires.',       color: '#16a34a', bg: 'rgba(22,163,74,0.08)'  },
  { Icon: Building2, title: 'Multi-vendor',            desc: 'One platform, multiple stores. Each vendor gets isolated data and their own WhatsApp number.',         color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { Icon: Search,    title: 'Semantic Search',         desc: 'pgvector similarity search finds the right product even when customers describe it vaguely.',          color: '#ec4899', bg: 'rgba(236,72,153,0.08)' },
  { Icon: Brain,     title: 'Conversation Memory',     desc: 'Rolling summaries keep context across long chats without exploding token costs.',                     color: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
];

const steps = [
  { n: '01', title: 'Register & Upload', desc: 'Create your vendor account and drop in an Excel sheet of your product catalog.' },
  { n: '02', title: 'Customize Persona', desc: 'Define your AI assistant name, tone (Friendly, Energetic, Professional), and custom greeting.' },
  { n: '03', title: 'Scan QR & Activate', desc: 'Scan the QR code with WhatsApp, top up your pre-paid wallet, and go live instantly.' },
];

const painPoints = [
  { Icon: Clock3, title: 'Slow replies lose ready buyers', desc: 'Customers often ask about price, size, delivery, and payment while you are packing orders or away from your phone.' },
  { Icon: MessageCircle, title: 'Every chat repeats the same questions', desc: 'VendorMind answers product, delivery, and policy questions from your catalog and uploaded documents.' },
  { Icon: WalletCards, title: 'Checkout is too manual', desc: 'The agent creates the order, reserves stock, and sends a Monnify payment link without a back-and-forth handoff.' },
];

const audiences = [
  'Food vendors',
  'Fashion stores',
  'Beauty sellers',
  'Grocery shops',
  'Pharmacies',
  'Home businesses',
];

const launchSignals = [
  { value: '3 steps', label: 'Register, upload catalog, scan QR' },
  { value: '24/7',    label: 'AI replies while you are busy' },
  { value: '30 min',  label: 'Stock reserved during checkout' },
  { value: 'Monnify', label: 'Payment links built into chat' },
];

const pricing = [
  ['Inbound message',    '₦0.50'],
  ['Outbound reply',     '₦0.50'],
  ['AI response',        '₦25.00'],
  ['Catalog upload',     'Free'],
  ['Monnify payment link', 'Free'],
];

const faqs = [
  ['Do I need a new WhatsApp number?', 'No. You can connect the WhatsApp number you want customers to message by scanning a QR code during onboarding.'],
  ['Can I upload Excel or CSV files?', 'Yes. VendorMind accepts catalog files with product names, prices, descriptions, and stock levels.'],
  ['What happens when stock runs out?', 'The agent checks available stock before adding products to cart and before checkout, so customers are not sold unavailable items.'],
  ['How does payment work?', 'When a customer is ready to pay, VendorMind creates an order and sends a Monnify payment link directly inside WhatsApp.'],
  ['Can a human take over?', 'Yes. The agent can hand off conversations when a customer needs support beyond automation.'],
  ['What if my wallet balance is low?', 'The wallet system includes warning states and an overdraft buffer designed to finish active conversations gracefully.'],
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDark = document.documentElement.classList.contains('dark');
  const logoSrc = isDark ? '/logo-dark.png' : '/logo-light.png';

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDestination, setAuthDestination] = useState<'/onboard' | '/dashboard'>('/onboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [navScrolled, setNavScrolled] = useState(false);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, duration: 1.2, smoothWheel: true });
    const onScroll = ({ scroll }: { scroll: number }) => setNavScrolled(scroll > 60);
    lenis.on('scroll', onScroll);
    let raf: number;
    const tick = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { lenis.destroy(); cancelAnimationFrame(raf); };
  }, []);

  // Scroll-reveal refs
  const statsRef    = useStaggerReveal();
  const painRef     = useStaggerReveal();
  const stepsRef    = useStaggerReveal();
  const featuresRef = useStaggerReveal();
  const pricingRef  = useScrollReveal();
  const faqRef      = useStaggerReveal();
  const audienceRef = useStaggerReveal();

  const resetAuthForm = () => {
    setEmail('');
    setPassword('');
    setAuthError(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      }
      const hasVendor = !!localStorage.getItem('vendorId');
      navigate(hasVendor ? '/dashboard' : authDestination);
      setShowAuthModal(false);
      resetAuthForm();
    } catch (err: any) {
      console.error('Email auth failed:', err.message);
      setAuthError(err.message.replace('Firebase: ', ''));
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithGoogle = async (destination: '/onboard' | '/dashboard' = '/onboard') => {
    try {
      await signInWithPopup(auth, googleProvider);
      const hasVendor = !!localStorage.getItem('vendorId');
      navigate(hasVendor ? '/dashboard' : destination);
    } catch (err: any) {
      console.error('Google sign-in failed:', err.message);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate(localStorage.getItem('vendorId') ? '/dashboard' : '/onboard');
    } else {
      setAuthDestination('/onboard');
      setShowAuthModal(true);
    }
  };

  const handleLogIn = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setAuthDestination('/dashboard');
      setShowAuthModal(true);
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: navScrolled ? 'rgba(8,12,20,0.97)' : 'rgba(8,12,20,0.72)',
        backdropFilter: `blur(${navScrolled ? 20 : 8}px)`,
        borderBottom: `1px solid ${navScrolled ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={logoSrc} alt="VendorMind logo" style={{ width: 28, height: 28 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: 0 }}>VendorMind</span>
          </div>

          <div className="landing-nav-actions">
            <div className="landing-nav-links">
              {[['#problem','Problem'],['#how-it-works','How it works'],['#features','Features'],['#pricing','Pricing']].map(([href, label]) => (
                <a key={href} href={href} style={{ fontSize: '0.875rem', color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}
                >
                  {label}
                </a>
              ))}
            </div>
            {user ? (
              <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem', border: 'none' }}>
                Dashboard
              </button>
            ) : (
              <button className="btn-ghost" onClick={handleLogIn} style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem', border: 'none' }}>
                Log in
              </button>
            )}
            <button className="btn-primary" onClick={handleGetStarted} style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}>
              Get Started <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="hero-gradient" style={{ padding: '5rem 1.5rem 4rem' }}>
        <div className="landing-hero-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

          <div className="animate-fade-up">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)',
              borderRadius: 99, padding: '0.3rem 0.875rem', marginBottom: '1.5rem',
            }}>
              <Zap size={11} color="var(--brand)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand)' }}>Built for Nigerian vendors</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800, letterSpacing: 0, lineHeight: 1.08,
              margin: '0 0 1.25rem', color: 'var(--text)',
            }} className="landing-hero-title">
              {['Turn', 'WhatsApp', 'chats', 'into'].map((w, i) => (
                <span key={w} className="hero-word" style={{ animationDelay: `${i * 80}ms`, marginRight: '0.25em' }}>{w}</span>
              ))}<br />
              <span className="hero-word" style={{ animationDelay: '320ms', color: 'var(--brand)' }}>paid orders</span>
            </h1>

            <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', lineHeight: 1.65, margin: '0 0 2rem', maxWidth: 440 }}>
              VendorMind gives your business an AI sales agent that answers customers,
              recommends products, creates carts, and sends Monnify payment links on WhatsApp.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleGetStarted} style={{ padding: '0.875rem 1.75rem', fontSize: '0.95rem' }}>
                Get Started Free <ArrowRight size={15} />
              </button>
              <a href="#how-it-works" style={{
                display: 'inline-flex', alignItems: 'center', padding: '0.875rem 1.5rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', fontWeight: 500,
                color: 'var(--text-2)', textDecoration: 'none', transition: 'background 0.15s',
              }}>
                See how it works
              </a>
            </div>
          </div>

          {/* Chat mockup */}
          <div className="animate-fade-up-2" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="landing-chat-mockup" style={{
              background: 'var(--surface)', borderRadius: 20,
              border: '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.48), 0 4px 16px rgba(0,0,0,0.16)',
              overflow: 'hidden',
            }}>
              {/* Chat header */}
              <div style={{ background: 'var(--brand)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={17} color="var(--brand)" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#05080e', margin: 0 }}>Mama Cee's Kitchen</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(5,8,14,0.7)', margin: 0 }}>AI Sales Agent • Online</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ background: 'var(--bg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { me: true,  text: 'Hi! Do you have jollof rice?' },
                  { me: false, text: 'Yes! Party Jollof Rice (₦2,500) and Small Chops Combo (₦3,000). Want to add any to your cart?' },
                  { me: true,  text: 'Add jollof rice and checkout' },
                  { me: false, text: 'Order created! Total: ₦2,500\n\nPay here → sandbox.monnify.com/checkout/...\nLink expires in 30 min' },
                ].map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.me ? 'flex-end' : 'flex-start', animation: `fadeUp 0.4s ${i * 0.1}s both` }}>
                    <div className={msg.me ? 'chat-bubble-user' : 'chat-bubble-bot'} style={{
                      fontSize: '0.78rem', padding: '0.5rem 0.75rem', maxWidth: '82%',
                      lineHeight: 1.5, whiteSpace: 'pre-line',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section style={{ background: 'var(--sidebar-bg)', padding: '3.5rem 1.5rem' }}>
        <div ref={statsRef} className="landing-signal-grid stagger-container" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2rem', textAlign: 'center' }}>
          {launchSignals.map(s => (
            <div key={s.label}>
              <p className="display" style={{ fontSize: '2rem', fontWeight: 800, color: '#4ade80', margin: 0, letterSpacing: 0 }}>{s.value}</p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.375rem' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ─────────────────────────────────────────── */}
      <section id="problem" style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div className="landing-split" style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '3rem', alignItems: 'start' }}>
          <div>
            <div className="badge" style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--brand)', marginBottom: '1rem' }}>
              <AlertCircle size={13} />
              Why this matters
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: 0, lineHeight: 1.15, margin: '0 0 1rem' }}>
              WhatsApp selling breaks when every order needs your full attention.
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.75, margin: 0 }}>
              VendorMind handles the repetitive parts of selling so you can focus on sourcing products,
              fulfilment, and customer relationships.
            </p>
          </div>
          <div ref={painRef} className="stagger-container" style={{ display: 'grid', gap: '1rem' }}>
            {painPoints.map(({ Icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '42px 1fr', gap: '1rem', alignItems: 'start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={19} color="var(--brand)" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.35rem' }}>{title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it is for ───────────────────────────────────── */}
      <section style={{ background: 'var(--bg)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ maxWidth: 620, marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: 0, margin: '0 0 0.625rem' }}>
              Built for vendors who already sell through chat
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.7 }}>
              If customers ask questions before they buy, VendorMind can help manage that conversation.
            </p>
          </div>
          <div ref={audienceRef} className="landing-audience-grid stagger-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
            {audiences.map((audience, i) => (
              <div key={audience} className="card" style={{ padding: '1rem', minHeight: 96, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Store size={18} color={i % 2 === 0 ? 'var(--brand)' : '#3b82f6'} />
                <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text)' }}>{audience}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: 0, margin: '0 0 0.625rem' }}>
            From catalog to checkout in 3 steps
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', margin: 0 }}>No developers needed. Upload your products, connect WhatsApp, and start taking orders.</p>
        </div>
        <div ref={stepsRef} className="landing-three-grid stagger-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
          {steps.map((s, i) => (
            <div key={s.n} className="card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
              <span style={{
                position: 'absolute', top: -8, right: 12,
                fontFamily: 'var(--font-display)', fontSize: '5rem', fontWeight: 800,
                color: 'rgba(22,163,74,0.06)', lineHeight: 1, userSelect: 'none',
              }}>{s.n}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(22,163,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--brand)' }}>{s.n}</span>
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dashboard preview ───────────────────────────────── */}
      <section style={{ background: 'var(--sidebar-bg)', padding: '5rem 1.5rem', color: '#fff' }}>
        <div className="landing-split" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div className="badge" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', marginBottom: '1rem' }}>
              <PackageCheck size={13} />
              Vendor workspace
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: 0, lineHeight: 1.15, margin: '0 0 1rem', color: '#fff' }}>
              Manage the store behind the WhatsApp agent.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.75, margin: '0 0 1.5rem' }}>
              Upload products, monitor queues, track orders, and see wallet health from one focused dashboard.
            </p>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {[
                ['Catalog upload', 'Excel or CSV files become searchable products.'],
                ['Orders and reservations', 'Pending orders reserve stock for 30 minutes.'],
                ['Wallet visibility', 'Track balance health before automation pauses.'],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  <CheckCircle size={15} color="#4ade80" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#fff' }}>{title}:</strong> {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-preview">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--text)' }}>Today at a glance</p>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-3)', margin: '0.2rem 0 0' }}>Store operations preview</p>
              </div>
              <span className="badge" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--brand)' }}>
                <Sparkles size={12} />
                Live
              </span>
            </div>
            <div className="dashboard-preview-grid">
              {[
                { Icon: MessageCircle, label: 'Active chats', value: '12', color: '#3b82f6' },
                { Icon: ShoppingBag, label: 'Pending orders', value: '5', color: '#16a34a' },
                { Icon: FileSpreadsheet, label: 'Catalog items', value: '248', color: '#f59e0b' },
                { Icon: ShieldCheck, label: 'Wallet status', value: 'Healthy', color: '#14b8a6' },
              ].map(({ Icon, label, value, color }) => (
                <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', background: 'var(--surface-raised)' }}>
                  <Icon size={17} color={color} />
                  <p className="display" style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.65rem 0 0.15rem', color: 'var(--text)' }}>{value}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {[
                ['Party Jollof Rice', '₦2,500', '42 left'],
                ['Small Chops Combo', '₦3,000', '18 left'],
                ['Chapman Bottle', '₦1,200', '31 left'],
              ].map(([name, price, stock]) => (
                <div key={name} className="landing-preview-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: name === 'Chapman Bottle' ? 'none' : '1px solid var(--border-subtle)', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>{name}</span>
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{price}</span>
                  <span className="landing-preview-stock" style={{ fontSize: '0.72rem', color: 'var(--brand)', fontWeight: 700 }}>{stock}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" style={{ background: 'var(--bg)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: 0, margin: '0 0 0.625rem' }}>
              Everything your store needs
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', margin: 0 }}>The pieces your WhatsApp store needs to answer, sell, collect payment, and keep context.</p>
          </div>
          <div ref={featuresRef} className="landing-three-grid stagger-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {features.map(({ Icon, title, desc, color, bg }) => (
              <div key={title} className="feature-card">
                <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.4rem' }}>{title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: 0, margin: '0 0 0.625rem' }}>
            Simple, usage-based pricing
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', margin: 0 }}>No monthly fees. No contracts. Pay only for what you use.</p>
        </div>
        <div ref={pricingRef} className="reveal-block" style={{ maxWidth: 420, margin: '0 auto' }}>
          <div className="pricing-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', margin: 0, letterSpacing: 0 }}>Pay-as-you-go</p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0.25rem 0 0' }}>Wallet credits, top up anytime</p>
              </div>
              <span style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: 99, border: '1px solid rgba(74,222,128,0.2)', whiteSpace: 'nowrap' }}>
                Free to start
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
              {pricing.map(([item, price]) => (
                <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={13} color="#4ade80" />
                    {item}
                  </span>
                  <span className="mono" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{price}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: 0 }}>
                Overdraft buffer of ₦1,250 included to finish active conversations even on an empty balance.
              </p>
            </div>
            <button className="btn-primary" onClick={handleGetStarted} style={{ width: '100%', padding: '0.875rem', background: '#4ade80', color: '#0d1117', boxShadow: '0 4px 16px rgba(74,222,128,0.25)' }}>
              Start with free credit <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" style={{ background: 'var(--bg)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: 0, margin: '0 0 0.625rem' }}>
              Questions vendors usually ask
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', margin: 0 }}>
              The basics before connecting your store.
            </p>
          </div>
          <div ref={faqRef} className="stagger-container" style={{ display: 'grid', gap: '0.75rem' }}>
            {faqs.map(([q, a]) => (
              <details key={q} className="faq-item">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{ background: 'var(--sidebar-bg)', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: 0, color: '#fff', margin: '0 0 1rem', lineHeight: 1.15 }}>
            Put your WhatsApp sales on autopilot
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 2rem', lineHeight: 1.65 }}>
            Start with a catalog upload, connect your WhatsApp number, and let VendorMind handle the first reply through checkout.
          </p>
          <button className="btn-primary" onClick={handleGetStarted} style={{ padding: '0.95rem 2.25rem', fontSize: '1rem' }}>
            Get Started Free <ArrowRight size={16} />
          </button>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', marginTop: '1rem' }}>No credit card required.</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ background: '#08090d', padding: '1.75rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={logoSrc} alt="VendorMind logo" style={{ width: 20, height: 20 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', letterSpacing: 0 }}>VendorMind</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', margin: 0 }}>© 2026 VendorMind. Built for Nigerian vendors.</p>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <Link to="/privacy" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Privacy</Link>
            <Link to="/terms" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Terms</Link>
            <Link to="/contact" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Contact</Link>
          </div>
        </div>
      </footer>

      {/* ── Auth Confirmation Modal ──────────────────────────── */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 14, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card-raised animate-scale-up" style={{
            maxWidth: 400, width: '100%', padding: '2rem',
            textAlign: 'center', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '1.15rem', border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <img src={logoSrc} alt="VendorMind logo" style={{ width: 32, height: 32 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>VendorMind</span>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--text)' }}>
                {isSignUp ? 'Create your account' : 'Sign in to your store'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
                Get instant access to your WhatsApp sales agent dashboard.
              </p>
            </div>

            {/* Google OAuth Option */}
            <div style={{ width: '100%' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowAuthModal(false);
                  signInWithGoogle(authDestination);
                }}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', margin: '0.1rem 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Email/Password Auth Form */}
            <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: '0.75rem', width: '100%', textAlign: 'left' }}>
              <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-2)', fontWeight: 700 }}>
                Email address
                <input
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@store.com"
                  style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-2)', fontWeight: 700 }}>
                Password
                <input
                  type="password"
                  required
                  className="input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}
                />
              </label>

              {authError && (
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#ef4444', lineHeight: 1.4 }}>
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={authLoading}
                style={{ padding: '0.75rem', fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {authLoading ? (
                  <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} />
                ) : isSignUp ? (
                  'Create Account with Email'
                ) : (
                  'Sign In with Email'
                )}
              </button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-3)' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: 700, padding: 0 }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>

            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setShowAuthModal(false);
                  resetAuthForm();
                }}
                style={{ padding: '0.7rem', fontSize: '0.85rem', width: '100%', border: 'none' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
