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

// ─── FuegoBall SVG (real logo from app) ───
function FuegoBall({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 264.71 312.73" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#CCFF00" d="M232.22,155.87c0-3-.26-7.42-1-11-6,3-9.41,3.85-14,5,2.11,18.29,6.9,43.29-8.51,57.86,18.93-8.68,23.51-28.86,23.51-51.86Z"/>
      <path fill="#CCFF00" d="M137.85,128.55c-46.24,17.09-111.68,12.01-117.24,76.92,16.02-48.06,108.92-32.43,130.57-66.48-4.81-3.01-9.28-6.52-13.33-10.45Z"/>
      <path fill="#CCFF00" d="M203.22,151.87c-9.14,1.04-19.46-.73-28.23-2.87-25.67,58.31-128.46,39.12-156.19,79.6C5.24,250.94.46,289.07,0,312.73c.6-1.9.82-3.88,1.44-5.78,11.25-28.66,46.09-36.31,72.25-45.96,60.89-22.92,143.2-20.87,129.54-109.12Z"/>
      <path fill="#CCFF00" d="M115.39,83.73c-49.68-2.79-93.85,17.01-96.22,70.76,6.74-17.23,24.47-27.74,40.42-35.55,19.53-8.93,41.66-6.84,62.02-12.63-3.46-7.01-4.93-14.6-6.22-22.58Z"/>
      <g>
        <path fill="#CCFF00" d="M199.86.36c2.52.92,1.71,2.81,1.35,4.58-6.76,33.52-37.06,57.44-71.59,56.5-5.37-.15-5.92-.89-4.75-6.35C132.26,21.41,164.85-3.28,199.86.36Z"/>
        <path fill="#CCFF00" d="M124.34,84.21c-.43-1.97-.82-5.22-.8-7.23.04-4.67,1.36-4.44,8.24-4.44,38.65.03,71.51-26.32,80.04-64.18,1.31-5.8,1.57-5.94,7.27-3.86,25.92,9.43,45.32,35.76,45.62,61.33.02,1.47-1.17,2.66-2.64,2.69-40.81.56-76.3,23.06-85.6,65.08-1.06,4.52-2.58,5.69-7.05,3.87-24.37-9.63-39.55-28.22-45.08-53.25Z"/>
        <path fill="#CCFF00" d="M188.61,141.54c-2.5-.78-2-2.7-1.68-4.51,5.83-33.3,38.79-58.8,72.98-56.69,4.55.28,4.16,2.65,3.58,5.65-6.39,33.97-40.51,58.4-74.89,55.55Z"/>
      </g>
    </svg>
  );
}

// ─── Full FUEGO PADEL Logo ───
function FuegoLogo({ ballSize = 32, textSize = '24px' }: { ballSize?: number; textSize?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: ballSize }}>
      <FuegoBall size={ballSize} />
      <span style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        fontWeight: 800,
        fontSize: textSize,
        letterSpacing: '-0.5px',
        lineHeight: 1.2,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        color: '#FFFFFF',
      }}>
        FUEGO{' '}
        <span style={{ color: '#CCFF00' }}>PADEL</span>
      </span>
    </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <FuegoLogo ballSize={44} textSize="28px" />
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700,
              letterSpacing: '4px', color: '#CCFF00', textTransform: 'uppercase',
            }}>
              IGNITE
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
        <FuegoLogo ballSize={28} textSize="18px" />
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
