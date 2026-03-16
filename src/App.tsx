import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { supabase } from './lib/supabase';

// ─── Animated Section Wrapper ───
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Waitlist Form ───
function WaitlistForm({ source = 'hero' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    try {
      const { error } = await supabase
        .from('ignite_waitlist')
        .insert({ email: email.toLowerCase().trim(), source });

      if (error) {
        if (error.code === '23505') {
          setStatus('success');
        } else {
          throw error;
        }
      } else {
        setStatus('success');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Something went wrong. Try again.');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 24px', borderRadius: '12px',
          background: 'rgba(204, 255, 0, 0.1)',
          border: '1px solid rgba(204, 255, 0, 0.2)',
        }}
      >
        <span style={{ fontSize: '20px' }}>🔥</span>
        <span style={{ color: '#CCFF00', fontWeight: 600, fontSize: '15px' }}>
          You're on the list. We'll be in touch.
        </span>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '480px', position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        style={{
          flex: '1 1 240px', padding: '16px 20px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          color: '#fff', fontSize: '16px', outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => e.target.style.borderColor = 'rgba(204,255,0,0.4)'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '16px 28px', borderRadius: '12px',
          background: '#CCFF00', color: '#000',
          fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
          opacity: status === 'loading' ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {status === 'loading' ? 'JOINING...' : 'JOIN WAITLIST'}
      </button>
      {status === 'error' && (
        <p style={{ color: '#ff4444', fontSize: '13px', width: '100%', textAlign: 'center', marginTop: '4px' }}>
          {errorMsg}
        </p>
      )}
    </form>
  );
}

// ─── Spots Counter ───
function SpotsCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const { count: total } = await supabase
        .from('ignite_waitlist')
        .select('*', { count: 'exact', head: true });
      setCount(total ?? 0);
    };
    fetchCount();
  }, []);

  const remaining = count !== null ? Math.max(0, 1000 - count) : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
      fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--white-40)', letterSpacing: '0.5px',
    }}>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: remaining !== null && remaining < 100 ? '#ff4444' : '#CCFF00',
        boxShadow: `0 0 8px ${remaining !== null && remaining < 100 ? '#ff4444' : 'rgba(204,255,0,0.5)'}`,
      }} />
      {remaining !== null ? (
        <span><strong style={{ color: '#CCFF00', fontWeight: 700 }}>{remaining}</strong> of 1,000 spots remaining</span>
      ) : (
        <span>Loading...</span>
      )}
    </div>
  );
}

// ─── Benefit Card ───
function BenefitCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      padding: '28px', borderRadius: '16px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      textAlign: 'left', transition: 'all 0.3s',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '14px' }}>{icon}</div>
      <h3 style={{ color: 'var(--white-90)', fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--white-40)' }}>{desc}</p>
    </div>
  );
}

// ─── Pricing Tier ───
function PricingTier({ name, price, spots, highlighted = false, tag }: { name: string; price: number; spots: string; highlighted?: boolean; tag?: string }) {
  return (
    <div style={{
      flex: '1 1 240px', maxWidth: '300px',
      padding: highlighted ? '32px 28px' : '28px',
      borderRadius: '16px',
      background: highlighted ? 'rgba(204, 255, 0, 0.05)' : 'var(--bg-card)',
      border: `1px solid ${highlighted ? 'rgba(204, 255, 0, 0.25)' : 'var(--border)'}`,
      position: 'relative',
      transform: highlighted ? 'scale(1.03)' : 'none',
    }}>
      {tag && (
        <div style={{
          position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
          padding: '4px 14px', borderRadius: '20px',
          background: '#CCFF00', color: '#000',
          fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {tag}
        </div>
      )}
      <p style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '2px', color: 'var(--white-40)', textTransform: 'uppercase', marginBottom: '16px' }}>{name}</p>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '42px', fontWeight: 800, color: highlighted ? '#CCFF00' : 'var(--white-90)', letterSpacing: '-1px' }}>
          ${price}
        </span>
        <span style={{ fontSize: '14px', color: 'var(--white-20)', marginLeft: '4px' }}>one-time</span>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--white-40)' }}>{spots}</p>
    </div>
  );
}

// ─── FuegoBall SVG ───
function FuegoBall({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" stroke="#CCFF00" strokeWidth="2" opacity="0.3" />
      <circle cx="50" cy="50" r="35" stroke="#CCFF00" strokeWidth="1.5" opacity="0.2" />
      <path d="M35 50 Q50 20 65 50 Q50 80 35 50Z" fill="#CCFF00" opacity="0.6" />
    </svg>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  return (
    <div style={{ overflow: 'hidden' }}>
      {/* ━━━ HERO ━━━ */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(204,255,0,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <FadeIn>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', justifyContent: 'center' }}>
            <FuegoBall size={36} />
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700,
              letterSpacing: '4px', color: '#CCFF00', textTransform: 'uppercase',
            }}>
              FUEGO IGNITE
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.1, letterSpacing: '-2px',
            maxWidth: '700px', textAlign: 'center', marginBottom: '20px',
          }}>
            Founding Members<br />
            <span style={{ color: '#CCFF00' }}>Programme</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--white-40)',
            maxWidth: '520px', textAlign: 'center', lineHeight: 1.6, marginBottom: '40px',
          }}>
            Be one of 1,000 Founding Members.<br />
            Lifetime Premium. One payment. Never again.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <WaitlistForm source="hero" />
        </FadeIn>

        <FadeIn delay={0.4}>
          <div style={{ marginTop: '24px' }}><SpotsCounter /></div>
        </FadeIn>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', bottom: '40px', color: 'var(--white-20)', fontSize: '24px' }}
        >↓</motion.div>
      </section>

      {/* ━━━ WHAT YOU GET ━━━ */}
      <section style={{ padding: '100px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <FadeIn>
          <p style={{
            fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '3px',
            color: '#CCFF00', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center',
          }}>What you get</p>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700,
            color: '#fff', textAlign: 'center', marginBottom: '60px', letterSpacing: '-1px',
          }}>More than an app. A movement.</h2>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <FadeIn delay={0.05}><BenefitCard icon="♾️" title="Lifetime Premium Access" desc="Every feature. Every update. Forever. No subscriptions, no renewals — you're in for life." /></FadeIn>
          <FadeIn delay={0.10}><BenefitCard icon="🏆" title="Founding Member Badge" desc="A permanent badge on your profile. Everyone will know you believed from day one." /></FadeIn>
          <FadeIn delay={0.15}><BenefitCard icon="#️⃣" title="Unique Number #0001–#1000" desc="Your personal Founding Member number. Permanently reserved. Non-transferable." /></FadeIn>
          <FadeIn delay={0.20}><BenefitCard icon="🚀" title="Early Access" desc="Be the first to test new features before anyone else. Shape the product with direct feedback." /></FadeIn>
          <FadeIn delay={0.25}><BenefitCard icon="🎽" title="Exclusive Gear" desc="Limited-edition FUEGO merch only available to Founding Members. Wear the fire." /></FadeIn>
          <FadeIn delay={0.30}><BenefitCard icon="🤝" title="Direct Line to CEO & CTO" desc="Private channel with Darmas and Marco. Your voice shapes FUEGO's future." /></FadeIn>
        </div>
      </section>

      {/* ━━━ PRICING PREVIEW ━━━ */}
      <section style={{ padding: '100px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <FadeIn>
          <p style={{
            fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '3px',
            color: '#CCFF00', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center',
          }}>Pricing</p>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700,
            color: '#fff', textAlign: 'center', marginBottom: '16px', letterSpacing: '-1px',
          }}>One payment. Lifetime access.</h2>
          <p style={{
            color: 'var(--white-40)', textAlign: 'center', fontSize: '16px',
            maxWidth: '500px', margin: '0 auto 50px',
          }}>Only 1,000 spots total. When they're gone, they're gone.</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <PricingTier name="Early Ignite" price={79} spots="First 200 spots" />
            <PricingTier name="Ignite" price={99} spots="Spots 201–700" highlighted tag="Most Popular" />
            <PricingTier name="Late Ignite" price={149} spots="Final 300 spots" />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ textAlign: 'center', marginTop: '32px' }}><SpotsCounter /></div>
        </FadeIn>
      </section>

      {/* ━━━ WAITLIST CTA ━━━ */}
      <section style={{
        padding: '100px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(204,255,0,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <FadeIn>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700,
            color: '#fff', textAlign: 'center', marginBottom: '16px', letterSpacing: '-1px',
          }}>Ready to ignite?</h2>
          <p style={{
            color: 'var(--white-40)', textAlign: 'center', marginBottom: '40px', fontSize: '16px',
          }}>Join the waitlist. Secure your spot. Get notified when we launch.</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <WaitlistForm source="cta" />
        </FadeIn>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer style={{
        padding: '40px 24px', borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FuegoBall size={24} />
          <span style={{ fontWeight: 700, color: '#CCFF00', fontSize: '14px' }}>FUEGO</span>
          <span style={{ color: 'var(--white-20)', fontSize: '14px' }}>PADEL</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
          <a href="https://app.fuego-padel.com/terms" target="_blank" rel="noopener">Terms</a>
          <a href="https://app.fuego-padel.com/privacy" target="_blank" rel="noopener">Privacy</a>
          <a href="https://app.fuego-padel.com" target="_blank" rel="noopener">App</a>
        </div>
        <p style={{
          fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
          color: 'var(--white-20)', textTransform: 'uppercase',
        }}>Nobody knows the score. We do.</p>
      </footer>
    </div>
  );
}
