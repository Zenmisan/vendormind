import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { useScrollReveal, useStaggerReveal } from '../lib/useScrollReveal';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowDown, Zap, Clock, ShieldCheck,
  CheckCircle, Sparkles, MessageCircle, Bot, ShoppingCart, CreditCard,
  Lock, Users, BarChart3, ChevronRight, X, Loader2, Heart, TrendingDown, Menu
} from 'lucide-react';
import Hero3DPhone from '../components/Hero3DPhone';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import DemoAgent from '../components/DemoAgent';

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
  const [menuOpen, setMenuOpen] = useState(false);

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
  const problemRef  = useStaggerReveal();
  const stepsRef    = useStaggerReveal();
  const featuresRef = useStaggerReveal();
  const pricingRef  = useScrollReveal();
  const trustRef    = useStaggerReveal();

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
        background: navScrolled || menuOpen ? 'rgba(10,10,15,0.97)' : 'rgba(10,10,15,0.85)',
        backdropFilter: `blur(${navScrolled || menuOpen ? 20 : 8}px)`,
        borderBottom: `1px solid ${navScrolled || menuOpen ? 'var(--border)' : 'transparent'}`,
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 1.5rem', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>
            <img src={logoSrc} alt="VendorMind logo" style={{ width: 32, height: 32 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap' }}>VendorMind</span>
          </div>

          {/* Desktop nav links — hidden below 1200px */}
          <div className="landing-nav-links" style={{ display: 'flex', gap: '2rem' }}>
            {[
              ['#problem', 'Problem'],
              ['#how-it-works', 'How it works'],
              ['#features', 'Features'],
              ['#pricing', 'Pricing']
            ].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: '0.9rem', color: 'var(--text-2)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right: CTAs + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {user ? (
              <button className="btn-secondary landing-nav-cta" onClick={() => navigate('/dashboard')} style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                Dashboard
              </button>
            ) : (
              <button className="btn-secondary landing-nav-cta" onClick={handleLogIn} style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                Log in
              </button>
            )}
            <button className="btn-primary" onClick={handleGetStarted} style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Get Started Free <ArrowRight size={14} />
            </button>

            {/* Hamburger — visible below 1200px */}
            <button
              className="landing-hamburger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
              style={{
                display: 'none', background: 'none', border: '1px solid var(--border)',
                borderRadius: 8, padding: '0.45rem', cursor: 'pointer',
                color: 'var(--text)', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.15s',
              }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className="landing-mobile-menu" style={{
          maxHeight: menuOpen ? '320px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
          borderTop: menuOpen ? '1px solid var(--border)' : '1px solid transparent',
        }}>
          <div style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {[
              ['#problem', 'Problem'],
              ['#how-it-works', 'How it works'],
              ['#features', 'Features'],
              ['#pricing', 'Pricing']
            ].map(([href, label]) => (
              <a
                key={href} href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '0.75rem 0.5rem', fontSize: '1rem', color: 'var(--text-2)',
                  textDecoration: 'none', fontWeight: 600, borderRadius: 8,
                  transition: 'color 0.15s, background 0.15s', display: 'block',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {label}
              </a>
            ))}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
              {user ? (
                <button className="btn-secondary" onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} style={{ flex: 1, padding: '0.65rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  Dashboard
                </button>
              ) : (
                <button className="btn-secondary" onClick={() => { handleLogIn(); setMenuOpen(false); }} style={{ flex: 1, padding: '0.65rem', fontSize: '0.9rem' }}>
                  Log in
                </button>
              )}
              <button className="btn-primary" onClick={() => { handleGetStarted(); setMenuOpen(false); }} style={{ flex: 2, padding: '0.65rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                Get Started Free <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────── */}
      <section className="hero-gradient" style={{ padding: '5.5rem 1.5rem 4rem', position: 'relative', overflow: 'hidden' }}>
        {/* Multi-layer backdrop */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '90%', height: '580px', background: 'radial-gradient(ellipse at 50% 0%, rgba(37,211,102,0.1) 0%, rgba(99,102,241,0.12) 40%, transparent 75%)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '-5%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: 1, background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.15), rgba(37,211,102,0.1), transparent)' }} />
        </div>

        <div className="landing-hero-grid" style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3.5rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          <div className="animate-fade-up">
            {/* Badge pill — WA green accent, not indigo */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(37,211,102,0.08)',
              border: '1px solid rgba(37,211,102,0.22)',
              borderRadius: 99, padding: '0.38rem 1rem', marginBottom: '1.75rem',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366', boxShadow: '0 0 6px rgba(37,211,102,0.7)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.01em' }}>
                Built for African vendors — no tech skills needed
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              margin: '0 0 1.5rem',
              fontSize: 'clamp(2.6rem, 5.2vw, 4rem)',
              color: 'var(--text)',
              textWrap: 'balance',
            }}>
              Turn WhatsApp chats<br />
              into <span style={{
                background: 'linear-gradient(120deg, #25D366 0%, #128C7E 50%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>paid orders.</span><br />
              <span style={{ color: 'var(--text-2)', fontWeight: 800 }}>While you sleep.</span>
            </h1>

            {/* Subheadline */}
            <p style={{ fontSize: '1.08rem', color: 'var(--text-2)', lineHeight: 1.72, margin: '0 0 2.25rem', maxWidth: 510, fontWeight: 400 }}>
              VendorMind gives your store a 24/7 AI sales agent inside WhatsApp. It answers questions, recommends products, processes orders, and collects payment — no code, no setup headaches.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.75rem' }}>
              <button
                className="btn-primary"
                onClick={handleGetStarted}
                style={{
                  padding: '0.875rem 2rem', fontSize: '0.96rem',
                  background: 'linear-gradient(135deg, #25D366 0%, #16a34a 100%)',
                  boxShadow: '0 4px 20px rgba(37,211,102,0.3), 0 1px 0 rgba(255,255,255,0.1) inset',
                  border: 'none',
                }}
              >
                Start for free <ArrowRight size={15} />
              </button>
              <a href="#how-it-works" className="btn-secondary" style={{ padding: '0.85rem 1.6rem', fontSize: '0.93rem', textDecoration: 'none' }}>
                See how it works <ArrowDown size={13} />
              </a>
            </div>

            {/* Trust micro-stats */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { v: '10 min', l: 'setup time' },
                { v: '0.4s', l: 'avg reply' },
                { v: '24/7', l: 'always on' },
              ].map(({ v, l }) => (
                <div key={v} style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{v}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>{l}</span>
                </div>
              ))}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500, marginLeft: '0.25rem' }}>No credit card needed</span>
            </div>
          </div>

          {/* 3D Phone Hero */}
          <div className="animate-fade-up-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Hero3DPhone />
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ────────────────────────────────── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 1.25rem' }}>
            Trusted by vendors in Lagos, Abuja, Port Harcourt, Accra &amp; beyond
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {['Fashion', 'Beauty', 'Food & Drinks', 'Electronics', 'Home Decor', 'Perfumes'].map(cat => (
              <span key={cat} style={{
                background: 'var(--surface-raised)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.82rem',
                fontWeight: 600, color: 'var(--text-2)'
              }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Section ─────────────────────────────────── */}
      <section id="problem" style={{ maxWidth: 1140, margin: '0 auto', padding: '6rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 3.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            THE PROBLEM
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>
            You're losing sales while you sleep.
          </h2>
        </div>

        <div ref={problemRef} className="stagger-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {/* Card 1 */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} color="#818CF8" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Customers message at 2am
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                You reply at 9am. They've already bought from someone else.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                You're doing everything
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                You're the salesperson, accountant, and delivery driver - all at once. There's no time to reply to everyone.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={24} color="#EF4444" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Unanswered money
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                Every unanswered message is money left on the table. You didn't know how much until now.
              </p>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem 2rem', textAlign: 'center', maxWidth: 780, margin: '0 auto' }}>
          <p style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
            The average Nigerian vendor misses <span style={{ color: '#F59E0B' }}>40% of customer inquiries</span> because they can't be available around the clock.<br />
            <span style={{ color: '#818CF8' }}>VendorMind fixes that.</span>
          </p>
        </div>
      </section>

      {/* ── How It Works Section ────────────────────────────── */}
      <section id="how-it-works" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              HOW IT WORKS
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>
              Your agent is live in three steps.
            </h2>
          </div>

          <div ref={stepsRef} className="stagger-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', position: 'relative' }}>
            {/* Step 1 */}
            <div className="card" style={{ padding: '2.25rem', position: 'relative', background: 'var(--bg)' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(99,102,241,0.25)', fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '1.25rem' }}>01</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--text)' }}>
                Upload your catalog
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                Add your products, prices, and stock. CSV upload or add them one by one. Takes less than 5 minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ padding: '2.25rem', position: 'relative', background: 'var(--bg)' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(99,102,241,0.25)', fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '1.25rem' }}>02</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--text)' }}>
                Customize your agent
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                Give it a name. Set the tone - friendly, professional, or energetic. It speaks your brand's language.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ padding: '2.25rem', position: 'relative', background: 'var(--bg)' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(99,102,241,0.25)', fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '1.25rem' }}>03</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--text)' }}>
                Scan and go live
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                Connect your WhatsApp number by scanning one QR code. Your AI agent is live instantly.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 20, padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-2)' }}>
              <Clock size={16} color="#F59E0B" /> Average setup time: 8 minutes
            </span>
          </div>
        </div>
      </section>

      {/* ── Product Demo Section ────────────────────────────── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto 3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
            Watch it sell for you.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', margin: 0 }}>
            This is a real conversation between a customer and a VendorMind agent. No human involved.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Hero3DPhone />
        </div>

        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#818CF8', margin: 0 }}>
          From "Hi" to "Payment confirmed" in under 3 minutes.
        </p>
      </section>

      {/* ── Features Section ────────────────────────────────── */}
      <section id="features" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              FEATURES
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>
              Everything your sales team would do.<br />Without the salary.
            </h2>
          </div>

          <div ref={featuresRef} className="stagger-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Card 1 */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Sparkles size={22} color="#818CF8" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Smart product search
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                Customers describe what they want in plain language. The agent finds it.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <ShoppingCart size={22} color="#F59E0B" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Cart management
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                Add, remove, update quantities. The agent tracks it all automatically.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <CreditCard size={22} color="#10B981" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Payment collection
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                Sends a secure payment link right inside the chat. Instantly.
              </p>
            </div>

            {/* Card 4 */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Lock size={22} color="#818CF8" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Stock reservation
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                Items are reserved the moment a customer starts checkout. No double-selling.
              </p>
            </div>

            {/* Card 5 */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Users size={22} color="#F59E0B" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Human handoff
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                When a customer needs you, the agent steps aside and notifies you immediately.
              </p>
            </div>

            {/* Card 6 */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <BarChart3 size={22} color="#10B981" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Sales insights
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                See which products sell, which conversations convert, and where customers drop off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust / Why VendorMind Section ─────────────────── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '6rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 4rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            WHY VENDORMIND
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>
            Built for the way African commerce actually works.
          </h2>
        </div>

        <div ref={trustRef} className="stagger-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Pillar 1 */}
          <div className="card" style={{ padding: '2.25rem', background: 'var(--surface)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#818CF8' }}>
              WhatsApp-first
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
              Your customers are already on WhatsApp. We didn't build an app they have to download. We met them where they already are.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="card" style={{ padding: '2.25rem', background: 'var(--surface)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#F59E0B' }}>
              Naira-native payments
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
              Every payment link, every checkout, every receipt is built for Nigerian payment infrastructure. No currency headaches.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="card" style={{ padding: '2.25rem', background: 'var(--surface)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#10B981' }}>
              Your brand, not ours
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
              Your customers never see "VendorMind." They see your business name, your agent's name, your personality.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats Section ───────────────────────────────────── */}
      <section style={{ background: 'var(--surface-raised)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '4rem 1.5rem' }}>
        <div ref={statsRef} className="stagger-container" style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', textAlign: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 900, color: '#818CF8', margin: 0, lineHeight: 1 }}>₦0</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '0.5rem', fontWeight: 500 }}>sales missed while your agent is online</p>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 900, color: '#F59E0B', margin: 0, lineHeight: 1 }}>3 min</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '0.5rem', fontWeight: 500 }}>average time from first message to payment</p>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 900, color: '#10B981', margin: 0, lineHeight: 1 }}>10 min</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '0.5rem', fontWeight: 500 }}>average vendor setup time</p>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 900, color: '#A5B4FC', margin: 0, lineHeight: 1 }}>24/7</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '0.5rem', fontWeight: 500 }}>your agent never sleeps, never calls in sick</p>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ─────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 1140, margin: '0 auto', padding: '6rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 4rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818CF8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            PRICING
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0.5rem 0 0.75rem', letterSpacing: '-0.02em' }}>
            Pay for what you use. Nothing more.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', margin: 0 }}>
            VendorMind runs on a prepaid credit system. Top up when you need to. No monthly lock-ins.
          </p>
        </div>

        <div ref={pricingRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'stretch', marginBottom: '3rem' }}>
          {/* Starter */}
          <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Starter</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', margin: '0.75rem 0 0.35rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)' }}>₦2,000</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>Good for testing and small stores</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem', flex: 1 }}>
              {['Up to 200 AI replies', '1 WhatsApp number', 'Full product catalog', 'Payment collection', 'Email support'].map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-2)' }}>
                  <CheckCircle size={16} color="#10B981" /> {feat}
                </div>
              ))}
            </div>

            <button className="btn-secondary" onClick={handleGetStarted} style={{ width: '100%', padding: '0.85rem' }}>
              Get Started →
            </button>
          </div>

          {/* Growth - Featured */}
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
            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>For active vendors doing daily sales</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem', flex: 1 }}>
              {[
                'Up to 600 AI replies',
                '1 WhatsApp number',
                'Priority queue processing',
                'Human handoff alerts',
                'Sales insights dashboard',
                'WhatsApp support'
              ].map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text)' }}>
                  <CheckCircle size={16} color="#818CF8" /> {feat}
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={handleGetStarted} style={{ width: '100%', padding: '0.85rem' }}>
              Get Started →
            </button>
          </div>

          {/* Scale */}
          <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.35rem' }}>Scale</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', margin: '0.75rem 0 0.35rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)' }}>₦10,000</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', margin: '0 0 1.75rem' }}>For high-volume vendors and small teams</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem', flex: 1 }}>
              {[
                'Up to 1,500 AI replies',
                'Up to 3 WhatsApp numbers',
                'Advanced analytics',
                'Custom agent persona',
                'Dedicated support'
              ].map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-2)' }}>
                  <CheckCircle size={16} color="#10B981" /> {feat}
                </div>
              ))}
            </div>

            <button className="btn-secondary" onClick={handleGetStarted} style={{ width: '100%', padding: '0.85rem' }}>
              Get Started →
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', textAlign: 'center', margin: 0, fontWeight: 500 }}>
          All plans include: Automatic stock reservation &nbsp;·&nbsp; Payment confirmation receipts &nbsp;·&nbsp; Conversation history &nbsp;·&nbsp; Cancel or pause anytime
        </p>
      </section>

      {/* ── Final CTA Section ───────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #13131A 0%, #1C1C28 100%)', borderTop: '1px solid var(--border)', padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontWeight: 900, margin: '0 0 1.25rem', letterSpacing: '-0.02em' }}>
            Your competitors are<br />still typing manually.
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 2.5rem' }}>
            Every minute your WhatsApp is unattended is a customer who found someone else. VendorMind makes sure that never happens again.
          </p>

          <button className="btn-primary" onClick={handleGetStarted} style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
            Start for free - no card needed →
          </button>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', margin: 0, fontWeight: 500 }}>
            Join vendors already closing sales while they sleep.
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ background: '#0A0A0F', borderTop: '1px solid var(--border)', padding: '4.5rem 1.5rem 2.5rem' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3.5rem' }}>
            {/* Brand Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <img src={logoSrc} alt="VendorMind logo" style={{ width: 28, height: 28 }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>VendorMind</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
                AI sales agents for WhatsApp commerce.<br />Built for African vendors.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-3)' }}>
                <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
                <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
                <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
                <a onClick={() => navigate('/dashboard')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Dashboard</a>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-3)' }}>
                <a onClick={() => navigate('/about')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>About</a>
                <a onClick={() => navigate('/blog')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Blog</a>
                <a onClick={() => navigate('/privacy')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Privacy policy</a>
                <a onClick={() => navigate('/terms')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Terms of service</a>
              </div>
            </div>

            {/* Support Links */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-3)' }}>
                <a onClick={() => navigate('/help')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Help center</a>
                <a href="https://wa.me/2349000000000" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>WhatsApp us</a>
                <a onClick={() => navigate('/contact')} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Contact</a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-3)' }}>
            <p style={{ margin: 0 }}>© 2026 VendorMind. All rights reserved.</p>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Made with <Heart size={14} color="#EF4444" fill="#EF4444" /> for African commerce.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Demo Agent Widget */}
      <DemoAgent />

      {/* ── Auth Modal ─────────────────────────────────────── */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
          background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card-raised animate-fade-up" style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', padding: '2.25rem', position: 'relative' }}>
            <button className="btn-ghost" onClick={() => { setShowAuthModal(false); resetAuthForm(); }} style={{ position: 'absolute', top: 18, right: 18, padding: '0.4rem', border: 'none' }}>
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <img src={logoSrc} alt="VendorMind logo" style={{ width: 36, height: 36, marginBottom: '0.75rem' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.35rem' }}>
                {isSignUp ? 'Create your VendorMind account' : 'Welcome back'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: 0 }}>
                {isSignUp ? 'Get your 24/7 WhatsApp AI sales agent live in minutes' : 'Log in to manage your WhatsApp sales agent'}
              </p>
            </div>

            {authError && (
              <div style={{ background: 'var(--bg-danger)', border: '1px solid var(--border-danger)', borderRadius: 8, padding: '0.65rem 0.85rem', fontSize: '0.82rem', color: 'var(--text-danger)', marginBottom: '1.25rem' }}>
                {authError}
              </div>
            )}

            <button
              onClick={() => signInWithGoogle(authDestination)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: 10,
                background: 'var(--surface-raised)', border: '1px solid var(--border)',
                color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                cursor: 'pointer', marginBottom: '1.25rem', transition: 'border-color 0.15s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.13C3.25 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.63H1.27C.46 8.24 0 10.06 0 12s.46 3.76 1.27 5.37l4.01-3.13z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4.01 3.13c.95-2.85 3.6-4.96 6.72-4.96z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>or email</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)' }}>
                Email address
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@company.com" />
              </label>

              <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)' }}>
                Password
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
              </label>

              <button type="submit" className="btn-primary" disabled={authLoading} style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
                {authLoading ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : (isSignUp ? 'Create Account' : 'Log In')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button onClick={() => { setIsSignUp(!isSignUp); resetAuthForm(); }} style={{ background: 'none', border: 'none', color: '#818CF8', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
