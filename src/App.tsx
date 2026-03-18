import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { supabase } from './lib/supabase';

// ─── Animated Section Wrapper ───
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForceShow(true), (delay + 1.5) * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const show = inView || forceShow;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: forceShow && !inView ? 0 : delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Label ───
function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '3px',
      color: '#CCFF00', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center',
    }}>{text}</p>
  );
}

// ─── Section Headline ───
function SectionHeadline({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700,
      color: '#fff', textAlign: 'center', marginBottom: '16px', letterSpacing: '-1px',
    }}>{children}</h2>
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
        if (error.code === '23505') setStatus('success');
        else throw error;
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

// ─── Pricing Tier (updated — no tag, with payback) ───
function PricingTier({ name, price, spots, payback }: { name: string; price: number; spots: string; payback: string }) {
  return (
    <div style={{
      flex: '1 1 240px', maxWidth: '300px',
      padding: '28px', borderRadius: '16px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      position: 'relative',
    }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '2px', color: 'var(--white-40)', textTransform: 'uppercase', marginBottom: '16px' }}>{name}</p>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '42px', fontWeight: 800, color: 'var(--white-90)', letterSpacing: '-1px' }}>
          ${price}
        </span>
        <span style={{ fontSize: '14px', color: 'var(--white-20)', marginLeft: '4px' }}>one-time</span>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--white-40)', marginBottom: '16px' }}>{spots}</p>
      <p style={{ fontSize: '12px', color: '#CCFF00', fontFamily: 'var(--mono)', letterSpacing: '0.3px', lineHeight: 1.5 }}>{payback}</p>
    </div>
  );
}

// ─── Why Now Card ───
function WhyNowCard({ text, index }: { text: string; index: number }) {
  return (
    <div style={{
      padding: '28px', borderRadius: '16px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      textAlign: 'left',
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px',
        color: '#CCFF00', marginBottom: '14px', textTransform: 'uppercase',
      }}>0{index + 1}</div>
      <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--white-60)' }}>{text}</p>
    </div>
  );
}

// ─── FAQ Item ───
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)', padding: '20px 0', cursor: 'pointer',
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--white-90)', margin: 0 }}>{q}</p>
        <span style={{ color: '#CCFF00', fontSize: '20px', transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--white-40)', marginTop: '12px', marginBottom: 0 }}
        >{a}</motion.p>
      )}
    </div>
  );
}

// ─── FuegoBall SVG ───
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
        fontWeight: 800, fontSize: textSize, letterSpacing: '-0.5px',
        lineHeight: 1.2, display: 'inline-block', whiteSpace: 'nowrap', color: '#FFFFFF',
      }}>
        FUEGO{' '}<span style={{ color: '#CCFF00' }}>PADEL</span>
      </span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN APP — 8 SECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  return (
    <div style={{ overflow: 'hidden' }}>

      {/* ━━━ 1. HERO ━━━ */}
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
            }}>IGNITE</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.1, letterSpacing: '-2px',
            maxWidth: '700px', textAlign: 'center', marginBottom: '20px',
          }}>
            Founding Members<br />
            <span style={{ color: '#CCFF00' }}>Program</span>
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

        <FadeIn delay={0.5}>
          <p style={{
            marginTop: '20px', fontSize: '11px', color: 'var(--white-20)',
            textAlign: 'center', maxWidth: '400px', lineHeight: 1.5,
          }}>
            We'll only use your email to notify you when IGNITE opens. No spam. Unsubscribe anytime.
          </p>
        </FadeIn>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', bottom: '40px', color: 'var(--white-20)', fontSize: '24px' }}
        >↓</motion.div>
      </section>

      {/* ━━━ 2. WHAT IS FUEGO PADEL ━━━ */}
      <section style={{ padding: '100px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <FadeIn>
          <SectionLabel text="What is FUEGO PADEL" />
          <SectionHeadline>AI-Powered Scores. Stats. Rankings.</SectionHeadline>
          <p style={{
            color: 'var(--white-40)', textAlign: 'center', fontSize: '16px',
            maxWidth: '600px', margin: '0 auto', lineHeight: 1.7,
          }}>
            FUEGO PADEL is your padel app. Real-time scoring, performance stats, player rankings and a global network of athletes — all in one place. Available on iOS, Android and Web.
          </p>
        </FadeIn>
      </section>

      {/* ━━━ 3. WHY NOW ━━━ */}
      <section style={{ padding: '100px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <FadeIn>
          <SectionLabel text="Why Now" />
          <SectionHeadline>Be part of something from day one.</SectionHeadline>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '48px' }}>
          <FadeIn delay={0.05}><WhyNowCard index={0} text="Hundreds of millions of athletes play every day with no data, no feedback, no way to track their game. We're changing that." /></FadeIn>
          <FadeIn delay={0.10}><WhyNowCard index={1} text="FUEGO PADEL launches April 2026. The first 1,000 members get in at a price that will never exist again." /></FadeIn>
          <FadeIn delay={0.15}><WhyNowCard index={2} text="Premium costs $7.90/month. That's $94.80 per year. In 2 years, $189. In 3 years, $284. Founding Members pay once. Do the math." /></FadeIn>
        </div>
      </section>

      {/* ━━━ 4. BENEFITS ━━━ */}
      <section style={{ padding: '100px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <FadeIn>
          <SectionLabel text="What you get" />
          <SectionHeadline>More than an app. A movement.</SectionHeadline>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '48px' }}>
          <FadeIn delay={0.05}><BenefitCard icon="♾️" title="Lifetime Premium Access" desc="Every feature. Every update. Forever. No subscriptions, no renewals — you're in for life. Premium is $7.90/month. That's $94.80/year. Founding Members pay once. Forever." /></FadeIn>
          <FadeIn delay={0.10}><BenefitCard icon="🏆" title="Founding Member Badge" desc="A permanent badge on your profile. Everyone will know you believed from day one." /></FadeIn>
          <FadeIn delay={0.15}><BenefitCard icon="#️⃣" title="Unique Number #0001–#1000" desc="Your personal Founding Member number. Permanently reserved. Non-transferable." /></FadeIn>
          <FadeIn delay={0.20}><BenefitCard icon="🚀" title="Early Access" desc="Be the first to test new features before anyone else. Shape the product with direct feedback." /></FadeIn>
          <FadeIn delay={0.25}><BenefitCard icon="🎽" title="Exclusive Gear" desc="Limited-edition FUEGO merch only available to Founding Members. Wear the fire." /></FadeIn>
          <FadeIn delay={0.30}><BenefitCard icon="🤝" title="Direct Line" desc="Private channel with the founding team. Your voice shapes FUEGO's future." /></FadeIn>
        </div>
      </section>

      {/* ━━━ 5. PRICING ━━━ */}
      <section style={{ padding: '100px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <FadeIn>
          <SectionLabel text="Pricing" />
          <SectionHeadline>One payment. Lifetime access.</SectionHeadline>
          <p style={{
            color: 'var(--white-40)', textAlign: 'center', fontSize: '16px',
            maxWidth: '500px', margin: '0 auto 50px',
          }}>Only 1,000 spots total. When they're gone, they're gone.</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center' }}>
            <PricingTier name="Early Ignite" price={79} spots="First 200 spots — lowest price ever" payback="Pays for itself in 11 months. Everything after that is free." />
            <PricingTier name="Ignite" price={99} spots="Spots 201–700" payback="Pays for itself in 13 months. Everything after that is free." />
            <PricingTier name="Late Ignite" price={149} spots="Final 300 spots" payback="Pays for itself in 19 months. Everything after that is free." />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p style={{
            textAlign: 'center', marginTop: '32px', fontSize: '14px',
            color: 'var(--white-40)', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6,
          }}>
            The average padel player stays active for 3+ years. That's $284 in subscriptions — or one payment of $79–149. Your call.
          </p>
        </FadeIn>

        <FadeIn delay={0.25}>
          <div style={{ textAlign: 'center', marginTop: '32px' }}><SpotsCounter /></div>
        </FadeIn>
      </section>

      {/* ━━━ 6. FAQ ━━━ */}
      <section style={{ padding: '100px 24px', maxWidth: '700px', margin: '0 auto' }}>
        <FadeIn>
          <SectionLabel text="FAQ" />
          <SectionHeadline>Questions? We got you.</SectionHeadline>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div style={{ marginTop: '40px' }}>
            <FAQItem q="What is FUEGO PADEL?" a="Your AI-powered padel app. Real-time scoring, performance stats, player rankings and a global network of athletes." />
            <FAQItem q="Is this a subscription?" a="No. One payment, lifetime access. No monthly fees, no renewals, no hidden costs." />
            <FAQItem q="What does Lifetime mean?" a="Access for the lifetime of the FUEGO PADEL platform. As long as FUEGO exists, your access exists." />
            <FAQItem q="When does the app launch?" a="April 2026. Founding Members get early access before everyone else." />
            <FAQItem q="What if I stop playing?" a="Your Founding Member status stays forever. Come back anytime — your number, your badge, your access will be waiting." />
            <FAQItem q="Can I transfer my membership?" a="No. Your Founding Member number is personal and non-transferable." />
          </div>
        </FadeIn>
      </section>

      {/* ━━━ 7. FINAL CTA ━━━ */}
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
          <SectionHeadline>Ready to ignite?</SectionHeadline>
          <p style={{
            color: 'var(--white-40)', textAlign: 'center', marginBottom: '40px', fontSize: '16px',
          }}>Join the waitlist. Secure your spot. Get notified when we launch.</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <WaitlistForm source="cta" />
        </FadeIn>
      </section>

      {/* ━━━ 8. FOOTER ━━━ */}
      <footer style={{
        padding: '40px 24px', borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
      }}>
        <FuegoLogo ballSize={28} textSize="18px" />
        <div style={{ display: 'flex', gap: '24px', fontSize: '13px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/terms">IGNITE Terms</a>
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
