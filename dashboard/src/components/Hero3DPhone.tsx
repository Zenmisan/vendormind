import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { CheckCheck, ShieldCheck, TrendingUp, MessageCircle, Zap } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface ChatMsg {
  id: number;
  from: 'user' | 'agent';
  text: string;
  time: string;
  badge?: string;
}

// ── Chat script ──────────────────────────────────────────────
const MSGS: ChatMsg[] = [
  {
    id: 0, from: 'user',
    text: "Hi! Do you have Red Velvet Cake for today? It's for a birthday 🎂",
    time: "10:42"
  },
  {
    id: 1, from: 'agent',
    text: "Yes! 🎂 8\" Red Velvet (₦12,500) or 10\" (₦18,000) — both ready now. Ikeja delivery available.",
    time: "10:42",
    badge: "⚡ Auto-replied in 0.4s"
  },
  {
    id: 2, from: 'user',
    text: "Perfect — 8-inch please 🙌 Deliver to Ikeja GRA",
    time: "10:43"
  },
  {
    id: 3, from: 'agent',
    text: "Order reserved ✅\n\n₦14,500 total\n(₦12,500 + ₦2,000 delivery)\n\nTap below to pay via BMONI:",
    time: "10:43",
    badge: "💳 BMONI Payment"
  },
];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── Typing dots component ────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.92 }}
      transition={{ duration: 0.22 }}
      style={{
        alignSelf: 'flex-end',
        background: '#005c4b',
        borderRadius: '10px 1px 10px 10px',
        padding: '9px 13px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.17, ease: 'easeInOut' }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}
        />
      ))}
    </motion.div>
  );
}

// ── Chat bubble ──────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMsg }) {
  const isAgent = msg.from === 'agent';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 340 }}
      style={{
        alignSelf: isAgent ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {msg.badge && (
        <div style={{
          fontSize: '8.5px',
          color: '#4ade80',
          background: 'rgba(37,211,102,0.15)',
          border: '1px solid rgba(37,211,102,0.22)',
          padding: '2px 7px',
          borderRadius: 5,
          fontWeight: 700,
          letterSpacing: '0.03em',
          alignSelf: 'flex-end',
          width: 'fit-content',
        }}>
          {msg.badge}
        </div>
      )}
      <div style={{
        background: isAgent ? '#005c4b' : '#202c33',
        color: '#e9edef',
        padding: '8px 11px',
        borderRadius: isAgent ? '10px 1px 10px 10px' : '1px 10px 10px 10px',
        fontSize: '11px',
        lineHeight: 1.5,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        whiteSpace: 'pre-line',
      }}>
        {msg.text}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 3,
          fontSize: '9px',
          color: 'rgba(241,241,242,0.45)',
          marginTop: 3,
        }}>
          <span>{msg.time}</span>
          {isAgent && <CheckCheck size={10} color="#53bdeb" />}
        </div>
      </div>
    </motion.div>
  );
}

// ── Back phone (blurred depth layer) ────────────────────────
function BackPhone() {
  return (
    <div style={{
      width: 222,
      height: 452,
      background: 'linear-gradient(175deg, #161921 0%, #0b0d10 100%)',
      borderRadius: 41,
      boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.7)',
      overflow: 'hidden',
    }}>
      <div style={{ background: '#054640', height: 48, display: 'flex', alignItems: 'center', paddingLeft: 10, paddingTop: 8, gap: 7 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#fff' }}>VM</div>
        <div>
          <div style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>Zinc (AI)</div>
          <div style={{ color: '#90EE90', fontSize: '8px' }}>online</div>
        </div>
      </div>
      <div style={{ background: '#0b141a', flex: 1, height: '100%' }} />
    </div>
  );
}

// ── Floating stat card ───────────────────────────────────────
function StatCard({
  icon: Icon, value, label, color, bg, entryDelay
}: {
  icon: typeof TrendingUp;
  value: string;
  label: string;
  color: string;
  bg: string;
  entryDelay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, delay: entryDelay, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: entryDelay + 0.3 }}
        style={{
          background: 'rgba(10,10,18,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 13,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
          minWidth: 148,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={15} color={color} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{
            fontSize: '14px', fontWeight: 800, color: '#f1f0ff',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
          }}>{value}</div>
          <div style={{ fontSize: '10px', color: 'rgba(241,240,255,0.4)', fontWeight: 500, marginTop: 2 }}>{label}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function Hero3DPhone() {
  const [visibleMsgs, setVisibleMsgs] = useState<ChatMsg[]>([MSGS[0]]);
  const [showTyping, setShowTyping] = useState(false);
  const mountedRef = useRef(true);

  // Mouse tilt physics
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const mxSpring = useSpring(mx, { stiffness: 130, damping: 20 });
  const mySpring = useSpring(my, { stiffness: 130, damping: 20 });
  const rotateX = useTransform(mySpring, [-0.5, 0.5], ['13deg', '-13deg']);
  const rotateY = useTransform(mxSpring, [-0.5, 0.5], ['-13deg', '13deg']);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onMouseLeave = () => { mx.set(0); my.set(0); };

  // Chat sequence loop
  useEffect(() => {
    mountedRef.current = true;
    const run = async () => {
      while (mountedRef.current) {
        setVisibleMsgs([MSGS[0]]); setShowTyping(false);
        await sleep(2000); if (!mountedRef.current) break;
        setShowTyping(true);
        await sleep(1200); if (!mountedRef.current) break;
        setShowTyping(false); setVisibleMsgs([MSGS[0], MSGS[1]]);
        await sleep(2600); if (!mountedRef.current) break;
        setVisibleMsgs([MSGS[0], MSGS[1], MSGS[2]]);
        await sleep(1700); if (!mountedRef.current) break;
        setShowTyping(true);
        await sleep(1300); if (!mountedRef.current) break;
        setShowTyping(false); setVisibleMsgs([MSGS[0], MSGS[1], MSGS[2], MSGS[3]]);
        await sleep(4000); if (!mountedRef.current) break;
      }
    };
    run();
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        perspective: '1400px',
        position: 'relative',
        width: 440,
        height: 630,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Ambient glow orbs ──────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '8%', left: '18%',
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,211,102,0.22) 0%, transparent 70%)',
            filter: 'blur(38px)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{
            position: 'absolute', top: '25%', right: '8%',
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
            filter: 'blur(36px)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute', bottom: '10%', left: '28%',
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(252,211,77,0.1) 0%, transparent 70%)',
            filter: 'blur(38px)',
          }}
        />
      </div>

      {/* ── Phone tilt + float wrapper ─────────────────────── */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', position: 'relative', zIndex: 2 }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Back phone (depth layer) */}
        <div style={{
          position: 'absolute',
          left: -62, top: -18,
          opacity: 0.28,
          filter: 'blur(1.5px)',
          transform: 'scale(0.82)',
          transformOrigin: 'top center',
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          <BackPhone />
        </div>

        {/* ── Front phone ────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Left buttons: mute switch, vol up, vol down */}
          <div style={{ position: 'absolute', left: -5, top: 88, width: 4, height: 22, background: 'linear-gradient(to right, #1a2030, #2c3444)', borderRadius: '3px 0 0 3px', boxShadow: '-2px 0 5px rgba(0,0,0,0.5), inset 1px 0 rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', left: -5, top: 120, width: 4, height: 38, background: 'linear-gradient(to right, #1a2030, #2c3444)', borderRadius: '3px 0 0 3px', boxShadow: '-2px 0 5px rgba(0,0,0,0.5), inset 1px 0 rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', left: -5, top: 166, width: 4, height: 38, background: 'linear-gradient(to right, #1a2030, #2c3444)', borderRadius: '3px 0 0 3px', boxShadow: '-2px 0 5px rgba(0,0,0,0.5), inset 1px 0 rgba(255,255,255,0.05)' }} />
          {/* Right button: power */}
          <div style={{ position: 'absolute', right: -5, top: 132, width: 4, height: 52, background: 'linear-gradient(to left, #1a2030, #2c3444)', borderRadius: '0 3px 3px 0', boxShadow: '2px 0 5px rgba(0,0,0,0.5), inset -1px 0 rgba(255,255,255,0.05)' }} />

          {/* Outer shell */}
          <div style={{
            width: 268,
            height: 544,
            background: 'linear-gradient(175deg, #1c2028 0%, #0d0f13 32%, #0c0e11 62%, #17191f 100%)',
            borderRadius: 50,
            padding: '3px',
            boxShadow: [
              '0 0 0 1px rgba(255,255,255,0.13)',
              '0 0 0 2px rgba(0,0,0,0.75)',
              '0 28px 80px -12px rgba(0,0,0,0.9)',
              '0 10px 40px rgba(0,0,0,0.55)',
              '0 -1px 0 1px rgba(255,255,255,0.03)',
              '0 0 90px -25px rgba(37,211,102,0.25)',
              '0 0 130px -35px rgba(99,102,241,0.2)',
            ].join(', '),
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Screen surface */}
            <div style={{
              borderRadius: 47,
              overflow: 'hidden',
              height: '100%',
              background: '#0b141a',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Glass reflection */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '48%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.042) 0%, rgba(255,255,255,0.016) 38%, transparent 65%)',
                pointerEvents: 'none',
                zIndex: 10,
                borderRadius: '47px 47px 0 0',
              }} />

              {/* Dynamic Island */}
              <div style={{
                position: 'absolute',
                top: 13, left: '50%',
                transform: 'translateX(-50%)',
                width: 88, height: 22,
                background: '#000',
                borderRadius: 20,
                zIndex: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 7,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#1db954',
                  boxShadow: '0 0 6px rgba(29,185,84,0.7)',
                }} />
              </div>

              {/* WA Header */}
              <div style={{
                background: 'linear-gradient(180deg, #054640 0%, #054640 100%)',
                padding: '34px 12px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                flexShrink: 0,
              }}>
                <div style={{
                  width: 33, height: 33, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                  flexShrink: 0,
                }}>VM</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff', fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    Zinc (AI Agent)
                    <ShieldCheck size={11} color="#90EE90" strokeWidth={2.5} />
                  </div>
                  <div style={{
                    color: '#90EE90', fontSize: '9.5px',
                    display: 'flex', alignItems: 'center', gap: 5,
                    marginTop: 1,
                  }}>
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: '#25D366', flexShrink: 0 }}
                    />
                    online · VendorMind Verified
                  </div>
                </div>
              </div>

              {/* Chat body */}
              <div style={{
                background: '#0b141a',
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 0)',
                backgroundSize: '18px 18px',
                flex: 1,
                padding: '10px 10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                overflowY: 'hidden',
              }}>
                {visibleMsgs.map(msg => <Bubble key={msg.id} msg={msg} />)}
                <AnimatePresence>
                  {showTyping && <TypingIndicator />}
                </AnimatePresence>
              </div>

              {/* Input bar */}
              <div style={{
                background: '#1f2937',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}>
                <div style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 12,
                }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>Message</span>
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#25D366',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37,211,102,0.35)',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Floating stat cards ─────────────────────────────── */}
      <div style={{ position: 'absolute', top: '7%', right: '0', zIndex: 5 }}>
        <StatCard
          icon={TrendingUp} value="₦84,500" label="Revenue today"
          color="#25D366" bg="rgba(37,211,102,0.14)" entryDelay={0.5}
        />
      </div>
      <div style={{ position: 'absolute', top: '44%', right: '-4px', zIndex: 5 }}>
        <StatCard
          icon={MessageCircle} value="23" label="Active chats"
          color="#818CF8" bg="rgba(129,140,248,0.12)" entryDelay={0.9}
        />
      </div>
      <div style={{ position: 'absolute', bottom: '14%', left: '0', zIndex: 5 }}>
        <StatCard
          icon={Zap} value="0.4s" label="Avg response"
          color="#FCD34D" bg="rgba(252,211,77,0.1)" entryDelay={1.3}
        />
      </div>
    </div>
  );
}
