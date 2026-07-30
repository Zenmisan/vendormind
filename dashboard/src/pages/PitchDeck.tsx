import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';

export default function PitchDeck() {
  useEffect(() => {
    document.title = "VendorMind - Investor Pitch Deck";
  }, []);

  return (
    <div style={{ background: '#07080b', color: '#f3f4f6', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", padding: '24px' }}>
      {/* Top Nav */}
      <div style={{ maxWidth: '1280px', margin: '0 auto 24px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#878a99', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '14px', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to VendorMind
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', background: 'rgba(223,254,0,0.15)', color: '#dffe00', padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>
            HACKATHON PRESENTATION
          </span>
        </div>
      </div>

      {/* Presentation Deck Container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Slide 1: Title */}
        <div style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(223,254,0,0.08) 0%, rgba(15,17,26,0.9) 100%)',
          borderRadius: '24px', border: '1px solid rgba(223, 254, 0, 0.2)', padding: '60px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)', minHeight: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#dffe00', letterSpacing: '2px', fontWeight: 800, marginBottom: '16px' }}>VENDORMIND PRESENTATION</div>
          <h1 style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #dffe00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Turn WhatsApp Chats Into Paid Orders.<br />Automatically.
          </h1>
          <p style={{ fontSize: '20px', color: '#878a99', maxWidth: '750px', lineHeight: 1.6, marginBottom: '40px' }}>
            VendorMind gives 40M+ African social commerce vendors a 24/7 autonomous AI sales agent that lives inside WhatsApp - answering inquiries, building carts, and collecting payments with zero human delay.
          </p>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 24px', borderRadius: '14px', fontSize: '15px' }}>
               <strong>100% WhatsApp Native</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 24px', borderRadius: '14px', fontSize: '15px' }}>
               <strong>BMONI Smart Wallet cNGN Rails</strong>
            </div>
          </div>
        </div>

        {/* Slide 2: Problem vs Solution */}
        <div style={{
          background: '#0f111a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', padding: '60px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px'
        }}>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '18px', padding: '32px' }}>
            <div style={{ color: '#fca5a5', fontWeight: 800, fontSize: '14px', letterSpacing: '1px', marginBottom: '16px' }}>THE PROBLEM</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: '#fff' }}>40% of WhatsApp Inquiries Die Unanswered</h2>
            <p style={{ color: '#d1d5db', lineHeight: 1.6, fontSize: '15px' }}>
              African vendors manage sales through manual chat messages. Slow response times during peak hours lead to abandoned carts, buyer fatigue, and lost revenue.
            </p>
          </div>

          <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '18px', padding: '32px' }}>
            <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '14px', letterSpacing: '1px', marginBottom: '16px' }}>THE VENDORMIND SOLUTION</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: '#fff' }}>Autonomous 24/7 AI Sales Agent</h2>
            <p style={{ color: '#d1d5db', lineHeight: 1.6, fontSize: '15px' }}>
              VendorMind ingests the vendor’s catalog, understands voice notes, runs pgvector semantic product searches, and processes on-chain cNGN payments in chat.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
