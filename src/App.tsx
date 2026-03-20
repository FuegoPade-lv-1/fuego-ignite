import { useState, useRef, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// ─── Constants ───
const COUNTER_OFFSET = 300;
const TOTAL_SPOTS = 1000;

// ─── Waitlist Context (shared count + sold-out state) ───
const WaitlistContext = createContext<{ remaining: number | null; isSoldOut: boolean }>({
  remaining: null,
  isSoldOut: false,
});

function WaitlistProvider({ children }: { children: React.ReactNode }) {
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

  const remaining = count !== null ? Math.max(0, TOTAL_SPOTS - (count + COUNTER_OFFSET)) : null;
  const isSoldOut = remaining !== null && remaining <= 0;

  return (
    <WaitlistContext.Provider value={{ remaining, isSoldOut }}>
      {children}
    </WaitlistContext.Provider>
  );
}

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
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <>{value}</>;
}

// ─── Hero Background ───
function HeroBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 40% at 50% 40%, rgba(204,255,0,0.08) 0%, transparent 70%)',
      }}
    />
  );
}

// ─── Slot Machine Line ───
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
            style={{ margin: 0, lineHeight: 1.5, ...extraStyle }}
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
      fontFamily: 'var(--mono)',
      fontSize: '12px',
      letterSpacing: '3px',
      color: '#CCFF00',
      textTransform: 'uppercase',
      marginBottom: '12px',
      textAlign: 'center',
    }}>{text}</p>
  );
}

// ─── Section Headline ───
function SectionHeadline({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 'clamp(24px, 4vw, 40px)',
      fontWeight: 700,
      color: '#fff',
      textAlign: 'center',
      marginBottom: '16px',
      letterSpacing: '-1px',
    }}>{children}</h2>
  );
}

// ─── Waitlist Form (with Name Fields) ───
function WaitlistForm({ source = 'hero' }: { source?: string }) {
  const { isSoldOut } = useContext(WaitlistContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    const finalSource = isSoldOut ? 'sold_out_notify' : source;

    try {
      const { error } = await supabase
        .from('ignite_waitlist')
        .insert({
          email: email.toLowerCase().trim(),
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          source: finalSource,
        });
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
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '16px 24px',
          borderRadius: '12px',
          background: 'rgba(204, 255, 0, 0.1)',
          border: '1px solid rgba(204, 255, 0, 0.2)',
        }}
      >
        <span style={{ fontSize: '20px' }}>🔥</span>
        <span style={{ color: '#CCFF00', fontWeight: 600, fontSize: '15px' }}>
          {isSoldOut
            ? "You're on the notification list."
            : firstName
            ? `Welcome, ${firstName}. You're on the list.`
            : "You're on the list. We'll be in touch."}
        </span>
      </motion.div>
    );
  }

  const inputStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = 'rgba(204,255,0,0.4)');
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = 'rgba(255,255,255,0.1)');

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '480px',
        alignItems: 'center',
      }}
    >
      {/* Name fields: side by side on desktop, stacked on mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          width: '100%',
        }}
      >
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Email + Submit row */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          width: '100%',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            ...inputStyle,
            flex: '1 1 240px',
            width: 'auto',
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '16px 28px',
            borderRadius: '12px',
            background: '#CCFF00',
            color: '#000',
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            border: 'none',
            cursor: 'pointer',
            opacity: status === 'loading' ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {status === 'loading'
            ? 'JOINING...'
            : isSoldOut
            ? 'NOTIFY ME'
            : 'JOIN WAITLIST'}
        </button>
      </div>

      {status === 'error' && (
        <p style={{ color: '#ff4444', fontSize: '13px', width: '100%', textAlign: 'center', marginTop: '4px' }}>
          {errorMsg}
        </p>
      )}
    </form>
  );
}

// ─── Spots Counter (uses shared context with offset) ───
function SpotsCounter() {
  const { remaining, isSoldOut } = useContext(WaitlistContext);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      justifyContent: 'center',
      fontFamily: 'var(--mono)',
      fontSize: '13px',
      color: 'var(--white-40)',
      letterSpacing: '0.5px',
    }}>
      <motion.span
        animate={{ boxShadow: ['0 0 4px rgba(204,255,0,0.5)', '0 0 12px rgba(204,255,0,0.8)', '0 0 4px rgba(204,255,0,0.5)'] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isSoldOut || (remaining !== null && remaining < 100) ? '#ff4444' : '#CCFF00',
          display: 'inline-block',
        }}
      />
      {remaining !== null ? (
        <span>
          <strong style={{ color: isSoldOut ? '#ff4444' : '#CCFF00', fontWeight: 700 }}>
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
      padding: '28px',
      borderRadius: '16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      textAlign: 'left',
      transition: 'all 0.3s',
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
      flex: '1 1 240px',
      maxWidth: '300px',
      padding: '28px',
      borderRadius: '16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      position: 'relative',
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
      padding: '28px',
      borderRadius: '16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      textAlign: 'left',
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
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--white-40)', marginTop: '12px', marginBottom: 0 }}
        >{a}</motion.p>
      )}
    </div>
  );
}

// ─── Full FUEGO PADEL Logo ───
function FuegoLogo({ height = 48 }: { height?: number }) {
  return (
    <img
      src="/fuego-padel-logo.svg"
      alt="FUEGO PADEL"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PLAYER DNA ASSESSMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── DNA Question Data ───
const DNA_QUESTIONS = [
  {
    id: 'experience',
    label: 'How long have you been playing padel?',
    type: 'select' as const,
    options: ['Less than 6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
    weight: 0.20,
  },
  {
    id: 'frequency',
    label: 'How often do you play?',
    type: 'select' as const,
    options: ['Once a month or less', '2-3 times a month', 'Once a week', '2-3 times a week', '4+ times a week'],
    weight: 0.15,
  },
  {
    id: 'playstyle',
    label: 'How would you describe your play style?',
    type: 'slider' as const,
    leftLabel: 'Defensive',
    rightLabel: 'Aggressive',
    weight: 0.05,
  },
  {
    id: 'strongest_shots',
    label: 'What are your two strongest shots?',
    type: 'multi' as const,
    maxSelect: 2,
    options: ['Bandeja', 'Vibora', 'Smash', 'Lob', 'Volley', 'Chiquita', 'Bajada', 'Wall shot'],
    weight: 0.10,
  },
  {
    id: 'weakest_shot',
    label: 'What is your weakest shot?',
    type: 'select' as const,
    options: ['Bandeja', 'Vibora', 'Smash', 'Lob', 'Volley', 'Chiquita', 'Bajada', 'Wall shot'],
    weight: 0.05,
  },
  {
    id: 'power_precision',
    label: 'Power vs. Precision',
    type: 'slider' as const,
    leftLabel: 'Power',
    rightLabel: 'Precision',
    weight: 0.05,
  },
  {
    id: 'net_baseline',
    label: 'Where do you feel strongest on court?',
    type: 'slider' as const,
    leftLabel: 'Baseline',
    rightLabel: 'Net',
    weight: 0.10,
  },
  {
    id: 'mental',
    label: 'How strong is your mental game under pressure?',
    type: 'slider' as const,
    leftLabel: 'I crack',
    rightLabel: 'Ice cold',
    weight: 0.10,
  },
  {
    id: 'weakest_area',
    label: 'What area of your game needs the most work?',
    type: 'select' as const,
    options: ['Shot technique', 'Court positioning', 'Fitness / endurance', 'Mental toughness', 'Strategy / tactics', 'Communication with partner'],
    weight: 0.05,
  },
  {
    id: 'physicality',
    label: 'How would you rate your physical fitness for padel?',
    type: 'slider' as const,
    leftLabel: 'Couch potato',
    rightLabel: 'Athlete',
    weight: 0.10,
  },
  {
    id: 'ambition',
    label: 'What is your padel ambition?',
    type: 'select' as const,
    options: ['Just for fun', 'Social competitive', 'Club level', 'Tournament player', 'Want to go pro'],
    weight: 0.05,
  },
];

// ─── Scoring & Radar Calculation ───
function calculateDNA(answers: Record<string, any>): { score: number; radar: Record<string, number> } {
  // Normalize each answer to 0-1
  const normalize = (qId: string): number => {
    const q = DNA_QUESTIONS.find(q => q.id === qId);
    if (!q) return 0.5;
    const val = answers[qId];
    if (val === undefined || val === null) return 0.5;
    if (q.type === 'slider') return val / 100;
    if (q.type === 'select') {
      const idx = q.options!.indexOf(val);
      return idx >= 0 ? idx / (q.options!.length - 1) : 0.5;
    }
    if (q.type === 'multi') {
      // More advanced shots picked = higher score
      const advancedShots = ['Vibora', 'Bajada', 'Bandeja', 'Smash'];
      const picks = val as string[];
      const advCount = picks.filter(s => advancedShots.includes(s)).length;
      return advCount / 2;
    }
    return 0.5;
  };

  // Weighted overall score (1.0-10.0)
  let weightedSum = 0;
  for (const q of DNA_QUESTIONS) {
    weightedSum += normalize(q.id) * q.weight;
  }
  const score = Math.round((1 + weightedSum * 9) * 10) / 10; // 1.0-10.0

  // Radar chart: 6 axes mapped from answers
  const exp = normalize('experience');
  const freq = normalize('frequency');
  const style = normalize('playstyle'); // 0=defensive, 1=aggressive
  const pp = normalize('power_precision'); // 0=power, 1=precision
  const nb = normalize('net_baseline'); // 0=baseline, 1=net
  const mental = normalize('mental');
  const phys = normalize('physicality');
  const ambition = normalize('ambition');
  const strongest = normalize('strongest_shots');

  const radar = {
    PWR: Math.round(Math.min(10, Math.max(1, ((1 - pp) * 0.4 + style * 0.3 + phys * 0.2 + strongest * 0.1) * 9 + 1)) * 10) / 10,
    CTL: Math.round(Math.min(10, Math.max(1, (pp * 0.4 + (1 - style) * 0.3 + exp * 0.2 + freq * 0.1) * 9 + 1)) * 10) / 10,
    NET: Math.round(Math.min(10, Math.max(1, (nb * 0.5 + strongest * 0.2 + exp * 0.2 + style * 0.1) * 9 + 1)) * 10) / 10,
    DEF: Math.round(Math.min(10, Math.max(1, ((1 - style) * 0.4 + (1 - nb) * 0.3 + phys * 0.2 + mental * 0.1) * 9 + 1)) * 10) / 10,
    END: Math.round(Math.min(10, Math.max(1, (phys * 0.5 + freq * 0.3 + ambition * 0.1 + exp * 0.1) * 9 + 1)) * 10) / 10,
    MNT: Math.round(Math.min(10, Math.max(1, (mental * 0.5 + exp * 0.2 + ambition * 0.2 + freq * 0.1) * 9 + 1)) * 10) / 10,
  };

  return { score, radar };
}

// ─── Radar Chart SVG ───
function RadarChart({ values, size = 320 }: { values: Record<string, number>; size?: number }) {
  const axes = Object.keys(values);
  const count = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;

  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2; // start from top

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid rings at 2.5, 5.0, 7.5, 10
  const rings = [2.5, 5, 7.5, 10];

  // Data polygon
  const dataPoints = axes.map((_, i) => getPoint(i, values[axes[i]]));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid rings */}
      {rings.map(ring => {
        const pts = axes.map((_, i) => getPoint(i, ring));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
        return <path key={ring} d={path} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const p = getPoint(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}

      {/* Data fill */}
      <path d={dataPath} fill="rgba(204,255,0,0.15)" stroke="#CCFF00" strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#CCFF00" />
      ))}

      {/* Labels */}
      {axes.map((axis, i) => {
        const labelR = maxR + 24;
        const angle = startAngle + i * angleStep;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
        return (
          <text
            key={axis}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="central"
            fill="rgba(255,255,255,0.6)"
            fontSize="11"
            fontFamily="var(--mono)"
            letterSpacing="0.5px"
          >
            {axis}
          </text>
        );
      })}

      {/* Value labels on axes */}
      {axes.map((axis, i) => {
        const p = getPoint(i, values[axis]);
        const angle = startAngle + i * angleStep;
        const offsetX = Math.cos(angle) * 16;
        const offsetY = Math.sin(angle) * 16;
        return (
          <text
            key={`val-${axis}`}
            x={p.x + offsetX}
            y={p.y + offsetY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#CCFF00"
            fontSize="10"
            fontWeight="700"
            fontFamily="var(--mono)"
          >
            {values[axis].toFixed(1)}
          </text>
        );
      })}
    </svg>
  );
}

// ─── DNA Option Button ───
function DNAOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 18px',
        borderRadius: '10px',
        border: selected ? '1px solid #CCFF00' : '1px solid rgba(255,255,255,0.1)',
        background: selected ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.03)',
        color: selected ? '#CCFF00' : 'rgba(255,255,255,0.6)',
        fontSize: '14px',
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ─── DNA Slider ───
function DNASlider({
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', padding: '0 4px' }}>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, #CCFF00 0%, #CCFF00 ${value}%, rgba(255,255,255,0.1) ${value}%, rgba(255,255,255,0.1) 100%)`,
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)', letterSpacing: '0.5px' }}>{leftLabel}</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)', letterSpacing: '0.5px' }}>{rightLabel}</span>
      </div>
    </div>
  );
}

// ─── DNA Assessment Section ───
function PlayerDNASection() {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'questions' | 'loading' | 'result'>('questions');
  const [result, setResult] = useState<{ score: number; radar: Record<string, number>; position: number; profileText: string; upgradeText: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize slider defaults
  useEffect(() => {
    const defaults: Record<string, number> = {};
    DNA_QUESTIONS.forEach(q => {
      if (q.type === 'slider' && answers[q.id] === undefined) {
        defaults[q.id] = 50;
      }
    });
    if (Object.keys(defaults).length > 0) {
      setAnswers(prev => ({ ...defaults, ...prev }));
    }
  }, []);

  const setAnswer = useCallback((id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const toggleMulti = useCallback((id: string, option: string, maxSelect: number) => {
    setAnswers(prev => {
      const current: string[] = prev[id] || [];
      if (current.includes(option)) {
        return { ...prev, [id]: current.filter(o => o !== option) };
      }
      if (current.length >= maxSelect) {
        return { ...prev, [id]: [...current.slice(1), option] };
      }
      return { ...prev, [id]: [...current, option] };
    });
  }, []);

  // Check if all questions answered
  const allAnswered = useMemo(() => {
    return DNA_QUESTIONS.every(q => {
      const val = answers[q.id];
      if (q.type === 'slider') return val !== undefined;
      if (q.type === 'select') return val !== undefined && val !== null;
      if (q.type === 'multi') return Array.isArray(val) && val.length === q.maxSelect;
      return false;
    });
  }, [answers]);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) { setErrorMsg('Please enter a valid email.'); return; }
    if (!allAnswered) { setErrorMsg('Please answer all questions.'); return; }

    setPhase('loading');
    setErrorMsg('');

    const { score, radar } = calculateDNA(answers);

    try {
      // Save to player_dna table
      const { error: dnaError } = await supabase
        .from('player_dna')
        .insert({
          email: email.toLowerCase().trim(),
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          answers,
          score,
          radar_values: radar,
        });
      if (dnaError) throw dnaError;

      // Also add to waitlist (ignore duplicate)
      await supabase
        .from('ignite_waitlist')
        .insert({
          email: email.toLowerCase().trim(),
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          source: 'player_dna',
        })
        .then(() => {});

      // Get waitlist position
      const { count: wlCount } = await supabase
        .from('ignite_waitlist')
        .select('*', { count: 'exact', head: true });
      const position = (wlCount ?? 0) + 300;

      // Build profile text
      const radarEntries = Object.entries(radar);
      const strongest = radarEntries.reduce((a, b) => a[1] > b[1] ? a : b);
      const weakest = radarEntries.reduce((a, b) => a[1] < b[1] ? a : b);
      const axisFullNames: Record<string, string> = { PWR: 'power game', CTL: 'control game', NET: 'net game', DEF: 'defense', END: 'endurance', MNT: 'mental game' };
      let profileText = `Your ${axisFullNames[strongest[0]]} is your strongest asset at ${strongest[1].toFixed(1)}/10. `;
      if (score >= 7.0) profileText += 'You are an advanced player with a well-rounded game. ';
      else if (score >= 5.0) profileText += 'You have a solid foundation with clear strengths. ';
      else profileText += 'You are building your game and have great potential. ';
      profileText += `Your ${axisFullNames[weakest[0]]} has the most room for growth. Players with your DNA typically score between ${Math.max(1, score - 0.8).toFixed(1)} and ${Math.min(10, score + 0.8).toFixed(1)} on the FUEGO Scale.`;

      const upgradeText = `Focus area: ${weakest[0]}. Players who improve their ${axisFullNames[weakest[0]]} gain 0.6 to 1.0 FUEGO Score points within 3 months.`;

      setResult({ score, radar, position, profileText, upgradeText });
      setPhase('result');
    } catch (err: any) {
      setPhase('questions');
      setErrorMsg(err?.message || 'Something went wrong. Try again.');
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '14px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = 'rgba(204,255,0,0.4)');
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = 'rgba(255,255,255,0.1)');

  // ─── Result View ───
  if (phase === 'result' && result) {
    const posDisplay = String(result.position).padStart(4, '0');
    return (
      <section style={{ padding: '100px 24px', maxWidth: '700px', margin: '0 auto' }}>
        <FadeIn>
          <SectionLabel text="Your Player DNA" />
          {/* Score Card */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-block',
              padding: '32px 48px',
              borderRadius: '20px',
              background: 'rgba(17,17,17,0.9)',
              border: '1px solid rgba(34,34,34,1)',
            }}>
              <p style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                letterSpacing: '3px',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>YOUR SCORE</p>
              <div style={{
                fontSize: '64px',
                fontWeight: 800,
                color: '#CCFF00',
                fontFamily: "'Courier New', Courier, monospace",
                letterSpacing: '2px',
                lineHeight: 1,
              }}>
                {result.score.toFixed(1)}
              </div>
              <p style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.3)',
                marginTop: '8px',
                letterSpacing: '1px',
              }}>OUT OF 10.0</p>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontStyle: 'italic', marginBottom: '40px' }}>
            Provisional, based on self-assessment
          </p>
        </FadeIn>

        {/* Radar Chart */}
        <FadeIn delay={0.15}>
          <div style={{
            padding: '32px',
            borderRadius: '20px',
            background: 'rgba(17,17,17,0.9)',
            border: '1px solid rgba(34,34,34,1)',
            marginBottom: '24px',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              letterSpacing: '3px',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '24px',
            }}>YOUR RADAR</p>
            <RadarChart values={result.radar} size={320} />
          </div>
        </FadeIn>

        {/* Player Profile */}
        <FadeIn delay={0.25}>
          <div style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            marginBottom: '24px',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '3px',
              color: '#CCFF00',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>YOUR PLAYER PROFILE</p>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--white-60)', margin: 0 }}>
              {result.profileText}
            </p>
          </div>
        </FadeIn>

        {/* Upgrade Path */}
        <FadeIn delay={0.35}>
          <div style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            marginBottom: '24px',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '3px',
              color: '#CCFF00',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>YOUR UPGRADE PATH</p>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--white-60)', margin: 0 }}>
              {result.upgradeText}
            </p>
          </div>
        </FadeIn>

        {/* What FUEGO does */}
        <FadeIn delay={0.4}>
          <div style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            marginBottom: '24px',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '3px',
              color: '#CCFF00',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>WHAT FUEGO PADEL DOES FOR YOU</p>
            <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--white-40)', marginBottom: '16px' }}>
              This is your estimated DNA based on self-assessment. Your real FUEGO Score is calculated after 5 matches, based on actual results, opponent strength, and live performance data.
            </p>
            {[
              'Live Match Scoring, every point tracked in real time',
              'AI Performance Analysis after every match',
              'Rankings against every player in your city',
              'Player DNA updated in real time, match by match',
              'Coaching Insights, exactly what to work on next',
            ].map((item, i) => (
              <p key={i} style={{ fontSize: '13px', color: 'var(--white-60)', margin: '6px 0', lineHeight: 1.5 }}>
                {'✓ '}{item}
              </p>
            ))}
          </div>
        </FadeIn>

        {/* Waitlist Position */}
        <FadeIn delay={0.45}>
          <div style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'rgba(204,255,0,0.05)',
            border: '1px solid rgba(204,255,0,0.15)',
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '3px',
              color: '#CCFF00',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>YOU'RE ON THE LIST</p>
            <p style={{ color: 'var(--white-60)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              {firstName
                ? `${firstName}, you're #${posDisplay} of 1,000 Founding Members.`
                : `You're #${posDisplay} of 1,000 Founding Members.`}
              {' '}When IGNITE opens, you'll be the first to know.
            </p>
          </div>
        </FadeIn>

        {/* CTA to Pricing */}
        <FadeIn delay={0.5}>
          <div style={{ textAlign: 'center' }}>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('[data-section="pricing"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'inline-block',
                padding: '16px 40px',
                background: '#CCFF00',
                color: '#000',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '1.5px',
                textDecoration: 'none',
                borderRadius: '12px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              VIEW PRICING
            </a>
            <p style={{ fontSize: '12px', color: 'var(--white-20)', marginTop: '16px' }}>
              Your Player DNA will be loaded into your FUEGO profile when we launch.
            </p>
          </div>
        </FadeIn>
      </section>
    );
  }

  // ─── Questions View ───
  return (
    <section data-section="dna" style={{ padding: '100px 24px', maxWidth: '700px', margin: '0 auto' }}>
      <FadeIn>
        <SectionLabel text="Player DNA Assessment" />
        <SectionHeadline>Discover your padel identity.</SectionHeadline>
        <p style={{
          color: 'var(--white-40)',
          textAlign: 'center',
          fontSize: '16px',
          maxWidth: '520px',
          margin: '0 auto 48px',
          lineHeight: 1.7,
        }}>
          Answer 11 questions. Get your Player DNA score, a personalized radar chart, and see where your game stands.
        </p>
      </FadeIn>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {DNA_QUESTIONS.map((q, qIdx) => (
          <FadeIn key={q.id} delay={0.03 * qIdx}>
            <div style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'baseline' }}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  color: '#CCFF00',
                  fontWeight: 700,
                }}>{String(qIdx + 1).padStart(2, '0')}</span>
                <p style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--white-90)',
                  margin: 0,
                  lineHeight: 1.5,
                }}>{q.label}</p>
              </div>

              {q.type === 'select' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {q.options!.map(opt => (
                    <DNAOption
                      key={opt}
                      label={opt}
                      selected={answers[q.id] === opt}
                      onClick={() => setAnswer(q.id, opt)}
                    />
                  ))}
                </div>
              )}

              {q.type === 'multi' && (
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--white-40)', marginBottom: '10px', fontFamily: 'var(--mono)', letterSpacing: '0.5px' }}>
                    Pick {q.maxSelect} {'\u2014'} {(answers[q.id] || []).length}/{q.maxSelect} selected
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {q.options!.map(opt => (
                      <DNAOption
                        key={opt}
                        label={opt}
                        selected={(answers[q.id] || []).includes(opt)}
                        onClick={() => toggleMulti(q.id, opt, q.maxSelect!)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {q.type === 'slider' && (
                <DNASlider
                  value={answers[q.id] ?? 50}
                  onChange={(v) => setAnswer(q.id, v)}
                  leftLabel={q.leftLabel!}
                  rightLabel={q.rightLabel!}
                />
              )}
            </div>
          </FadeIn>
        ))}

        {/* ─── Submit Form ─── */}
        <FadeIn delay={0.4}>
          <div style={{
            padding: '32px 24px',
            borderRadius: '20px',
            background: 'rgba(17,17,17,0.9)',
            border: '1px solid rgba(34,34,34,1)',
          }}>
            <p style={{
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              letterSpacing: '3px',
              color: '#CCFF00',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '24px',
            }}>GET YOUR RESULTS</p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
              marginBottom: '10px',
            }}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{ ...inputStyle, marginBottom: '16px' }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={phase === 'loading' || !allAnswered || !email}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '12px',
                background: allAnswered && email ? '#CCFF00' : 'rgba(204,255,0,0.3)',
                color: '#000',
                fontWeight: 800,
                fontSize: '15px',
                letterSpacing: '1.5px',
                border: 'none',
                cursor: allAnswered && email ? 'pointer' : 'not-allowed',
                opacity: phase === 'loading' ? 0.7 : 1,
                transition: 'all 0.2s',
                textTransform: 'uppercase',
              }}
            >
              {phase === 'loading' ? 'ANALYZING...' : 'GET YOUR PLAYER DNA'}
            </button>

            {errorMsg && (
              <p style={{ color: '#ff4444', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
                {errorMsg}
              </p>
            )}

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
              Your results will be saved and loaded into your FUEGO profile when we launch. You'll also be added to the IGNITE waitlist.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  return (
    <WaitlistProvider>
      <AppContent />
    </WaitlistProvider>
  );
}

function AppContent() {
  const { isSoldOut } = useContext(WaitlistContext);

  const punchSize = 'clamp(22px, 4vw, 36px)';
  const midSize = '16px';
  const closerSize = 'clamp(16px, 2.5vw, 20px)';

  return (
    <div style={{ overflow: 'hidden' }}>

      {/* ━━━ 1. HERO ━━━ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <HeroBackground />

        {/* Logo + IGNITE */}
        <FadeIn>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
            <FuegoLogo height={112} />
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '4px',
              color: '#CCFF00',
              textTransform: 'uppercase',
            }}>IGNITE</span>
          </div>
        </FadeIn>

        {/* Punch Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '24px', maxWidth: '750px', textAlign: 'center' }}>
          <SlotLine text="Your weaknesses tackled." delay={600} style={{ fontSize: punchSize, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }} />
          <SlotLine text="Your progress tracked." delay={1100} style={{ fontSize: punchSize, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }} />
          <SlotLine text="Every match analyzed in real time." delay={1600} style={{ fontSize: punchSize, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }} />
        </div>

        {/* Middle line */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.8 }} style={{ marginBottom: '16px', maxWidth: '600px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: midSize, color: 'var(--white-40)', lineHeight: 1.7 }}>
            AI that watches your padel game and tells you where to position, which shot to play, and how to win.
          </p>
        </motion.div>

        {/* Closer */}
        <div style={{ marginBottom: '40px', maxWidth: '650px', textAlign: 'center' }}>
          <SlotLine text="This is how you become the best on your court." delay={2800} style={{ fontSize: closerSize, fontWeight: 700, color: '#CCFF00', textShadow: '0 0 20px rgba(204,255,0,0.3), 0 0 40px rgba(204,255,0,0.15)' }} />
        </div>

        {/* Founding Members / Sold Out */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.8, duration: 0.7 }}>
          {isSoldOut ? (
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 800, color: '#ff4444', lineHeight: 1.1, letterSpacing: '-2px', maxWidth: '700px', textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase' }}>
              FUEGO IGNITE IS SOLD OUT.
            </h1>
          ) : (
            <h1 style={{ fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-2px', maxWidth: '700px', textAlign: 'center', marginBottom: '20px' }}>
              Founding Members<br /><span style={{ color: '#CCFF00' }}>Program</span>
            </h1>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.2, duration: 0.6 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {isSoldOut ? (
            <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--white-40)', maxWidth: '520px', textAlign: 'center', lineHeight: 1.6, marginBottom: '40px' }}>
              All 1,000 Founding Member spots have been claimed.<br />Join the notification list for future openings.
            </p>
          ) : (
            <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--white-40)', maxWidth: '520px', textAlign: 'center', lineHeight: 1.6, marginBottom: '40px' }}>
              Be one of 1,000 Founding Members.<br />Lifetime Premium. One payment. Never again.
            </p>
          )}

          {isSoldOut ? (
            <WaitlistForm source="hero" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => document.querySelector('[data-section="dna"]')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  padding: '18px 44px',
                  borderRadius: '12px',
                  background: '#CCFF00',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '15px',
                  letterSpacing: '1.5px',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                DISCOVER YOUR PLAYER DNA
              </button>
              <button
                onClick={() => document.querySelector('[data-section="cta"]')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--white-40)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  transition: 'color 0.2s',
                }}
              >
                or join the waitlist directly
              </button>
            </div>
          )}
          <div style={{ marginTop: '24px' }}><SpotsCounter /></div>
        </motion.div>

        {/* Scroll indicator */}
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

      {/* ━━━ 2. PLAYER DNA ASSESSMENT ━━━ */}
      <PlayerDNASection />

      {/* ━━━ 3. WHAT IS FUEGO PADEL ━━━ */}
      <section style={{ padding: '100px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <FadeIn>
          <SectionLabel text="What is FUEGO PADEL" />
          <SectionHeadline>AI-Powered Scores. Stats. Rankings.</SectionHeadline>
          <p style={{ color: 'var(--white-40)', textAlign: 'center', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
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
      <section data-section="pricing" style={{ padding: '100px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <FadeIn>
          <SectionLabel text="Pricing" />
          <SectionHeadline>One payment. Lifetime access.</SectionHeadline>
          <p style={{ color: 'var(--white-40)', textAlign: 'center', fontSize: '16px', maxWidth: '500px', margin: '0 auto 50px' }}>Only 1,000 spots total. When they're gone, they're gone.</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center' }}>
            <PricingTier name="Early Ignite" price={79} spots="First 200 spots. Lowest price ever." payback="Pays for itself in 11 months. Everything after that is free." />
            <PricingTier name="Ignite" price={99} spots="Spots 201-700" payback="Pays for itself in 13 months. Everything after that is free." />
            <PricingTier name="Late Ignite" price={149} spots="Final 300 spots" payback="Pays for itself in 19 months. Everything after that is free." />
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--white-40)', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
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
      <section data-section="cta" style={{
        padding: '100px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(204,255,0,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <FadeIn>
          <SectionHeadline>Ready to ignite?</SectionHeadline>
          <p style={{ color: 'var(--white-40)', textAlign: 'center', marginBottom: '40px', fontSize: '16px' }}>Join the waitlist. Secure your spot. Get notified when we launch.</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <WaitlistForm source="cta" />
        </FadeIn>
      </section>

      {/* ━━━ 8. FOOTER ━━━ */}
      <footer style={{
        padding: '40px 24px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <FuegoLogo height={48} />
        <div style={{ display: 'flex', gap: '24px', fontSize: '13px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/terms">IGNITE Terms</a>
          <a href="https://app.fuego-padel.com/terms" target="_blank" rel="noopener">Terms</a>
          <a href="https://app.fuego-padel.com/privacy" target="_blank" rel="noopener">Privacy</a>
          <a href="https://app.fuego-padel.com" target="_blank" rel="noopener">App</a>
        </div>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--white-20)', textTransform: 'uppercase' }}>Nobody knows the score. We do.</p>
      </footer>
    </div>
  );
}
