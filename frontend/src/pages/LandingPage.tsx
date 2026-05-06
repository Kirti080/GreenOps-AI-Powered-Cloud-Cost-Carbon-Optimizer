import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  Globe, Brain, Leaf, Zap, BarChart3, Shield, ArrowRight,
  TrendingDown, Server, Cloud, Activity, Cpu, ChevronRight,
  Github, Twitter, Linkedin, CheckCircle2, Star,
} from 'lucide-react';

/* ── Floating Particles ──────────────────────────────────────────────────── */
function FloatingParticles() {
  return (
    <div className="landing-particles">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="landing-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated Counter ────────────────────────────────────────────────────── */
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const step = end / (duration / 16);
    let cur = 0;
    const id = setInterval(() => {
      cur += step;
      if (cur >= end) { cur = end; clearInterval(id); }
      setCount(Math.round(cur));
    }, 16);
    return () => clearInterval(id);
  }, [started, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Feature Card ────────────────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, color, delay }: {
  icon: any; title: string; desc: string; color: string; delay: number;
}) {
  return (
    <motion.div
      className="landing-feature-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
    >
      <div className="landing-feature-icon" style={{ background: color }}>
        <Icon size={22} color="white" />
      </div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{desc}</p>
    </motion.div>
  );
}

/* ── Main Landing Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const features = [
    { icon: Activity,     title: 'Real-Time Monitoring',   desc: 'Track server health, CPU, memory, and network metrics live with WebSocket-powered dashboards.', color: 'linear-gradient(135deg, #10b981, #059669)' },
    { icon: Brain,        title: 'AI-Powered Forecasting',  desc: 'LSTM neural networks predict traffic 12 hours ahead for proactive resource scaling.', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
    { icon: Leaf,         title: 'Carbon Tracking',         desc: 'Measure, visualize, and reduce your cloud infrastructure\'s carbon footprint in real time.', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    { icon: Zap,          title: 'Smart Optimization',      desc: 'AI-driven recommendations to right-size resources and cut costs by up to 40%.', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { icon: Shield,       title: 'Anomaly Detection',       desc: 'Intelligent alerting spots anomalies before they become outages — zero false positives.', color: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    { icon: BarChart3,    title: 'Green Score Analytics',    desc: 'Sustainability scoring with granular breakdowns by region, service, and time window.', color: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  ];

  const stats = [
    { value: 42, suffix: '%', label: 'Cost Reduction' },
    { value: 3800, suffix: '+', label: 'Servers Monitored' },
    { value: 18, suffix: 'T', label: 'CO₂ Saved (tons)' },
    { value: 99.9, suffix: '%', label: 'Uptime Guaranteed' },
  ];

  const testimonials = [
    { name: 'Sarah Chen', role: 'VP Engineering, CloudScale', quote: 'GreenOps cut our cloud costs by 38% while reducing our carbon footprint. It\'s a win-win.', avatar: 'SC' },
    { name: 'Marcus Johnson', role: 'CTO, DataFlow Inc.', quote: 'The AI forecasting predicted a traffic spike 6 hours early. We scaled proactively for the first time.', avatar: 'MJ' },
    { name: 'Priya Sharma', role: 'DevOps Lead, EcoTech', quote: 'Finally, a sustainability tool that developers actually love to use. Beautiful interface, actionable data.', avatar: 'PS' },
  ];

  return (
    <div className="landing-page">
      <FloatingParticles />

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <motion.nav
        className="landing-nav"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="landing-nav-inner">
          <div className="landing-logo" onClick={() => navigate('/landing')}>
            <div className="landing-logo-icon">
              <Globe size={18} color="white" />
            </div>
            <span className="landing-logo-text">
              Green<span style={{ color: 'var(--green)' }}>Ops</span>
            </span>
          </div>

          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#stats" className="landing-nav-link">Impact</a>
            <a href="#testimonials" className="landing-nav-link">Testimonials</a>
          </div>

          <div className="landing-nav-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/auth?mode=login')}>
              Sign In
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth?mode=register')}>
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="landing-hero" ref={heroRef}>
        <motion.div className="landing-hero-content" style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div
            className="landing-hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Leaf size={14} />
            <span>Sustainable Cloud Infrastructure</span>
            <ChevronRight size={14} />
          </motion.div>

          <motion.h1
            className="landing-hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Make Your Cloud
            <br />
            <span className="text-gradient">Carbon Neutral</span>
          </motion.h1>

          <motion.p
            className="landing-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            AI-powered monitoring, forecasting, and optimization for sustainable
            cloud operations. Reduce costs, cut emissions, and scale smarter.
          </motion.p>

          <motion.div
            className="landing-hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register')}>
              Start Free Trial <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See How It Works
            </button>
          </motion.div>

          <motion.div
            className="landing-hero-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="landing-hero-trust-avatars">
              {['R', 'A', 'K', 'N', 'S'].map((l, i) => (
                <div key={i} className="landing-hero-trust-avatar" style={{ zIndex: 5 - i, marginLeft: i > 0 ? '-8px' : 0 }}>
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array(5).fill(0).map((_, i) => <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />)}
              </div>
              <span className="landing-hero-trust-text">Trusted by 500+ engineering teams</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Glow Orbs */}
        <div className="landing-hero-orb landing-hero-orb-1" />
        <div className="landing-hero-orb landing-hero-orb-2" />
        <div className="landing-hero-orb landing-hero-orb-3" />

        {/* Dashboard Preview */}
        <motion.div
          className="landing-hero-preview"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="landing-preview-window">
            <div className="landing-preview-topbar">
              <div className="landing-preview-dots">
                <span style={{ background: '#ef4444' }} />
                <span style={{ background: '#f59e0b' }} />
                <span style={{ background: '#10b981' }} />
              </div>
              <span className="landing-preview-url">greenops.cloud/dashboard</span>
            </div>
            <div className="landing-preview-body">
              <div className="landing-preview-sidebar">
                <div className="landing-preview-sidebar-item active"><Activity size={12} /> Live Monitor</div>
                <div className="landing-preview-sidebar-item"><Brain size={12} /> AI Forecast</div>
                <div className="landing-preview-sidebar-item"><Leaf size={12} /> Green Score</div>
                <div className="landing-preview-sidebar-item"><Zap size={12} /> Optimize</div>
              </div>
              <div className="landing-preview-main">
                <div className="landing-preview-kpi-row">
                  <div className="landing-preview-kpi" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-3)' }}>CPU Usage</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-l)' }}>23.4%</div>
                  </div>
                  <div className="landing-preview-kpi" style={{ borderColor: 'rgba(6,182,212,0.3)' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-3)' }}>Carbon</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22d3ee' }}>0.42t</div>
                  </div>
                  <div className="landing-preview-kpi" style={{ borderColor: 'rgba(139,92,246,0.3)' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-3)' }}>Savings</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>$2.4k</div>
                  </div>
                </div>
                <div className="landing-preview-chart">
                  <svg viewBox="0 0 300 80" className="landing-preview-svg">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,60 Q30,55 60,45 T120,35 T180,40 T240,25 T300,30 V80 H0 Z" fill="url(#chartGrad)" />
                    <path d="M0,60 Q30,55 60,45 T120,35 T180,40 T240,25 T300,30" fill="none" stroke="#10b981" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────── */}
      <section className="landing-stats" id="stats">
        <div className="landing-stats-inner">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              className="landing-stat"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="landing-stat-value">
                <AnimatedCounter end={s.value} suffix={s.suffix} />
              </div>
              <div className="landing-stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="landing-features" id="features">
        <motion.div
          className="landing-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="landing-section-badge">
            <Cpu size={14} /> Core Features
          </div>
          <h2 className="landing-section-title">
            Everything You Need for<br />
            <span className="text-gradient">Sustainable Operations</span>
          </h2>
          <p className="landing-section-desc">
            From real-time monitoring to AI-driven optimization — one platform to decarbonize your cloud.
          </p>
        </motion.div>

        <div className="landing-features-grid">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section className="landing-how">
        <motion.div
          className="landing-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="landing-section-badge">
            <Server size={14} /> How It Works
          </div>
          <h2 className="landing-section-title">
            Three Steps to a<br />
            <span className="text-gradient">Greener Cloud</span>
          </h2>
        </motion.div>

        <div className="landing-steps">
          {[
            { step: '01', title: 'Connect', desc: 'Point GreenOps at your cloud infrastructure. We support AWS, GCP, Azure, and on-prem servers.', icon: Cloud, color: '#10b981' },
            { step: '02', title: 'Analyze', desc: 'Our AI engine processes metrics, predicts demand, and calculates your carbon footprint in real time.', icon: Brain, color: '#8b5cf6' },
            { step: '03', title: 'Optimize', desc: 'Get actionable recommendations. Auto-scale resources, reduce waste, and track your sustainability progress.', icon: TrendingDown, color: '#06b6d4' },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="landing-step"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
            >
              <div className="landing-step-number" style={{ color: s.color }}>{s.step}</div>
              <div className="landing-step-icon" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}88)` }}>
                <s.icon size={24} color="white" />
              </div>
              <div>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
              {i < 2 && <div className="landing-step-connector" />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section className="landing-testimonials" id="testimonials">
        <motion.div
          className="landing-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="landing-section-badge">
            <Star size={14} /> Testimonials
          </div>
          <h2 className="landing-section-title">
            Loved by<br />
            <span className="text-gradient">Engineering Teams</span>
          </h2>
        </motion.div>

        <div className="landing-testimonials-grid">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="landing-testimonial-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="landing-testimonial-stars">
                {Array(5).fill(0).map((_, j) => <Star key={j} size={14} fill="#fbbf24" color="#fbbf24" />)}
              </div>
              <p className="landing-testimonial-quote">"{t.quote}"</p>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="landing-testimonial-name">{t.name}</div>
                  <div className="landing-testimonial-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="landing-cta">
        <motion.div
          className="landing-cta-inner"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="landing-cta-glow" />
          <h2 className="landing-cta-title">
            Ready to Build a<br />
            <span className="text-gradient">Sustainable Future?</span>
          </h2>
          <p className="landing-cta-desc">
            Join 500+ teams already reducing their cloud carbon footprint with GreenOps.
          </p>
          <div className="landing-cta-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register')}>
              Start Free — No Card Needed <ArrowRight size={16} />
            </button>
          </div>
          <div className="landing-cta-checks">
            <span><CheckCircle2 size={14} color="var(--green)" /> 14-day free trial</span>
            <span><CheckCircle2 size={14} color="var(--green)" /> No credit card</span>
            <span><CheckCircle2 size={14} color="var(--green)" /> Cancel anytime</span>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-icon">
                <Globe size={18} color="white" />
              </div>
              <span className="landing-logo-text">
                Green<span style={{ color: 'var(--green)' }}>Ops</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', maxWidth: 280, lineHeight: 1.6 }}>
              AI-powered cloud sustainability platform. Monitor, predict, and optimize your infrastructure's environmental impact.
            </p>
          </div>

          <div className="landing-footer-links">
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#stats">Impact</a>
              <a href="#">Pricing</a>
              <a href="#">Documentation</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>© 2026 GreenOps. All rights reserved.</span>
          <div className="landing-footer-socials">
            <a href="#"><Github size={18} /></a>
            <a href="#"><Twitter size={18} /></a>
            <a href="#"><Linkedin size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
