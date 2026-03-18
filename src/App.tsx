import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
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

// ─── Animated Counter (counts down from 1000 to target) ───
function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(1000);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const start = 1000;
    const end = target;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <>{value}</>;
}

// ─── Hero Background — diffuse fog glow ───
function HeroBackground() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse 80% 40% at 50% 40%, rgba(204,255,0,0.08) 0%, transparent 70%)',
    }} />
  );
}

// ─── Slot Machine Line (slides in from below with clip) ───
function SlotLine({ text, delay, style: extraStyle }: { text: string; delay: number; style?: React.CSSProperties }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div style={{ overflow: 'hidden', height: extraStyle?.fontSize ? `calc(${extraStyle.fontSize} * 1.6)` : '48px' }}>
      <AnimatePresence>
        {show && (
          <motion.p
            initial={{ y: '120%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              margin: 0,
              lineHeight: 1.5,
              ...extraStyle,
            }}
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
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
        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com" required
        style={{
          flex: '1 1 240px', padding: '16px 20px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
          color: '#fff', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s',
        }}
        onFocus={(e) => e.target.style.borderColor = 'rgba(204,255,0,0.4)'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      <button type="submit" disabled={status === 'loading'}
        style={{
          padding: '16px 28px', borderRadius: '12px', background: '#CCFF00', color: '#000',
          fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px', whiteSpace: 'nowrap',
          opacity: status === 'loading' ? 0.7 : 1, transition: 'all 0.2s',
        }}
      >{status === 'loading' ? 'JOINING...' : 'JOIN WAITLIST'}</button>
      {status === 'error' && (
        <p style={{ color: '#ff4444', fontSize: '13px', width: '100%', textAlign: 'center', marginTop: '4px' }}>{errorMsg}</p>
      )}
    </form>
  );
}

// ─── Spots Counter (with animated countdown) ───
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
      <motion.span
        animate={{ boxShadow: ['0 0 4px rgba(204,255,0,0.5)', '0 0 12px rgba(204,255,0,0.8)', '0 0 4px rgba(204,255,0,0.5)'] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: remaining !== null && remaining < 100 ? '#ff4444' : '#CCFF00',
          display: 'inline-block',
        }}
      />
      {remaining !== null ? (
        <span>
          <strong style={{ color: '#CCFF00', fontWeight: 700 }}>
            <AnimatedCounter target={remaining} duration={1500} />
          </strong> of 1,000 spots remaining
        </span>
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
function PricingTier({ name, price, spots, payback }: { name: string; price: number; spots: string; payback: string }) {
  return (
    <div style={{
      flex: '1 1 240px', maxWidth: '300px', padding: '28px', borderRadius: '16px',
      background: 'var(--bg-card)', border: '1px solid var(--border)', position: 'relative',
    }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '2px', color: 'var(--white-40)', textTransform: 'uppercase', marginBottom: '16px' }}>{name}</p>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '42px', fontWeight: 800, color: 'var(--white-90)', letterSpacing: '-1px' }}>${price}</span>
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
      background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'left',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: '#CCFF00', marginBottom: '14px', textTransform: 'uppercase' }}>0{index + 1}</div>
      <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--white-60)' }}>{text}</p>
    </div>
  );
}

// ─── FAQ Item ───
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '20px 0', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--white-90)', margin: 0 }}>{q}</p>
        <span style={{ color: '#CCFF00', fontSize: '20px', transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      {open && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--white-40)', marginTop: '12px', marginBottom: 0 }}
        >{a}</motion.p>
      )}
    </div>
  );
}

// ─── Full FUEGO PADEL Logo ───
function FuegoLogo({ height = 48 }: { height?: number }) {
  return (
    <img src="/fuego-padel-logo.svg" alt="FUEGO PADEL"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN APP — 8 SECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  // Punch line sizes
  const punchSize = 'clamp(22px, 4vw, 36px)';
  const midSize = '16px';
  const closerSize = 'clamp(16px, 2.5vw, 20px)';

  return (
    <div style={{ overflow: 'hidden' }}>

      {/* ━━━ 1. HERO ━━━ */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <HeroBackground />

        {/* Logo + IGNITE */}
        <FadeIn>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
            <FuegoLogo height={112} />
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700,
              letterSpacing: '4px', color: '#CCFF00', textTransform: 'uppercase',
            }}>IGNITE</span>
          </div>
        </FadeIn>

        {/* ── Punch Lines — Slot Machine Reveal ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '24px', maxWidth: '750px', textAlign: 'center' }}>
          <SlotLine text="Your weaknesses tackled." delay={600} style={{
            fontSize: punchSize, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px',
          }} />
          <SlotLine text="Your progress tracked." delay={1100} style={{
            fontSize: punchSize, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px',
          }} />
          <SlotLine text="Every match analyzed in real time." delay={1600} style={{
            fontSize: punchSize, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px',
          }} />
        </div>

        {/* ── Middle line — Fade in ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          style={{ marginBottom: '16px', maxWidth: '600px', textAlign: 'center' }}
        >
          <p style={{ margin: 0, fontSize: midSize, color: 'var(--white-40)', lineHeight: 1.7 }}>
            AI that watches your padel game and tells you where to position, which shot to play, and how to win.
          </p>
        </motion.div>

        {/* ── Closer — Slot Machine with glow ── */}
        <div style={{ marginBottom: '40px', maxWidth: '650px', textAlign: 'center' }}>
          <SlotLine text="This is how you become the best on your court." delay={2800} style={{
            fontSize: closerSize, fontWeight: 700, color: '#CCFF00',
            textShadow: '0 0 20px rgba(204,255,0,0.3), 0 0 40px rgba(204,255,0,0.15)',
          }} />
        </div>

        {/* ── Founding Members Program ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.8, duration: 0.7 }}
        >
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.1, letterSpacing: '-2px',
            maxWidth: '700px', textAlign: 'center', marginBottom: '20px',
          }}>
            Founding Members<br />
            <span style={{ color: '#CCFF00' }}>Program</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.2, duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--white-40)',
            maxWidth: '520px', textAlign: 'center', lineHeight: 1.6, marginBottom: '40px',
          }}>
            Be one of 1,000 Founding Members.<br />
            Lifetime Premium. One payment. Never again.
          </p>

          <WaitlistForm source="hero" />

          <div style={{ marginTop: '24px' }}><SpotsCounter /></div>

          <p style={{
            marginTop: '20px', fontSize: '11px', color: 'var(--white-20)',
            textAlign: 'center', maxWidth: '400px', lineHeight: 1.5,
          }}>
            We'll only use your email to notify you when IGNITE opens. No spam. Unsubscribe anytime.
          </p>
        </motion.div>

        {/* Scroll indicator — pulsing chevron */}
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
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
            FUEGO PADEL is your padel app. Real-time scoring, performance stats, player rankings and a global network of athletes, all in one place. Available on iOS, Android and Web.
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
          <FadeIn delay={0.05}><WhyNowCard index={0} text="Millions of padel players step on court every day with no data, no feedback, no way to track their game. We're changing that." /></FadeIn>
          <FadeIn delay={0.10}><WhyNowCard index={1} text="FUEGO PADEL launches Summer 2026. The first 1,000 members get in at a price that will never exist again." /></FadeIn>
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
          <FadeIn delay={0.05}><BenefitCard icon="♾️" title="Lifetime Premium Access" desc="Every feature. Every update. Forever. No subscriptions, no renewals, you're in for life. Premium is $7.90/month. That's $94.80/year. Founding Members pay once. Forever." /></FadeIn>
          <FadeIn delay={0.10}><BenefitCard icon="🏆" title="Founding Member Badge" desc="A permanent badge on your profile. Everyone will know you believed from day one." /></FadeIn>
          <FadeIn delay={0.15}><BenefitCard icon="#️⃣" title="Unique Number #0001-#1000" desc="Your personal Founding Member number. Permanently reserved. Non-transferable." /></FadeIn>
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
            <PricingTier name="Early Ignite" price={79} spots="First 200 spots. Lowest price ever." payback="Pays for itself in 11 months. Everything after that is free." />
            <PricingTier name="Ignite" price={99} spots="Spots 201-700" payback="Pays for itself in 13 months. Everything after that is free." />
            <PricingTier name="Late Ignite" price={149} spots="Final 300 spots" payback="Pays for itself in 19 months. Everything after that is free." />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p style={{
            textAlign: 'center', marginTop: '32px', fontSize: '14px',
            color: 'var(--white-40)', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6,
          }}>
            The average padel player stays active for 6+ years. That's $569 in subscriptions, or one payment of $79-149. Your call.
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
            <FAQItem q="When does the app launch?" a="Summer 2026. Founding Members get early access before everyone else." />
            <FAQItem q="What if I stop playing?" a="Your Founding Member status stays forever. Come back anytime. Your number, your badge, your access will be waiting." />
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
        <FuegoLogo height={48} />
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
