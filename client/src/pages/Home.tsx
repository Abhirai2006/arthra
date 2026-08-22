import { BrandMark } from "@/components/BrandMark";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BadgeIndianRupee, BrainCircuit, Check, ChevronRight, FileOutput, Fingerprint, Moon, Orbit, ReceiptText, ShieldCheck, Sparkles, Sun, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useLocation } from "wouter";

const reveal = { hidden: { opacity: 0, y: 26 }, visible: { opacity: 1, y: 0 } };

const featureRail = [
  { eyebrow: "01 / Recognise", title: "Your money has an Indian context.", text: "Lakh/crore notation, Apr–Mar financial years, GST-aware transaction notes, and an export your CA can actually use.", icon: BadgeIndianRupee, tint: "violet" },
  { eyebrow: "02 / Share", title: "Keep Home and Office apart. Invite people in when it helps.", text: "Use private Expense Spaces for yourself, then add editors or viewers to a shared wallet—without blending every part of your life.", icon: UsersRound, tint: "coral" },
  { eyebrow: "03 / Understand", title: "See a useful nudge, not a wall of charts.", text: "Arthra turns spending patterns, budget pressure, and outliers into quiet plain-language prompts you can act on.", icon: BrainCircuit, tint: "cyan" },
];

function HeroPreview({ pointer }: { pointer: { x: number; y: number } }) {
  const transform = `rotateX(${pointer.y * -5}deg) rotateY(${pointer.x * 7}deg) translateZ(0)`;
  return <div className="hero-preview-wrap" aria-label="Illustrative Arthra product preview">
    <div className="hero-orbit hero-orbit--one" /><div className="hero-orbit hero-orbit--two" />
    <div className="hero-preview" style={{ transform }}>
      <div className="preview-topbar"><span className="preview-pulse" /><span>Private space</span><span className="preview-topbar__right">Live context</span></div>
      <div className="preview-body"><div><p className="preview-kicker">MONTHLY CLARITY</p><p className="preview-heading">Everything clicks into place.</p></div><div className="preview-circles" aria-hidden="true"><span /><span /><span /></div></div>
      <div className="preview-stat-grid"><div className="preview-stat preview-stat--feature"><span className="preview-stat__label">A calmer pulse</span><div className="preview-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></div><div className="preview-stat"><span className="preview-stat__label">Budget posture</span><strong>On track</strong><span className="preview-dotline"><i /> steady</span></div></div>
    </div>
    <div className="float-chip float-chip--one"><Sparkles size={14} /> personal rhythm</div><div className="float-chip float-chip--two"><ShieldCheck size={14} /> private by default</div>
  </div>;
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const ctaLabel = isAuthenticated ? "Open your workspace" : "Begin with a private space";
  const pointerVariables = useMemo(() => ({ "--pointer-x": pointer.x.toFixed(3), "--pointer-y": pointer.y.toFixed(3) }) as CSSProperties, [pointer]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const postAuthPath = sessionStorage.getItem("arthra-post-auth-path");
    if (postAuthPath) { sessionStorage.removeItem("arthra-post-auth-path"); navigate(postAuthPath); }
  }, [isAuthenticated, navigate]);
  const handlePrimaryAction = () => { if (isAuthenticated) navigate("/dashboard"); else startLogin(); };
  const trackHero = (event: MouseEvent<HTMLElement>) => {
    if (reduceMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setPointer({ x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 });
  };

  return <main className="arthra-site">
    <section className="arthra-hero" ref={heroRef} onMouseMove={trackHero} style={pointerVariables}>
      <nav className="arthra-nav container" aria-label="Primary navigation"><a href="#top" className="brand-link"><BrandMark /></a><div className="arthra-nav__links" aria-label="Page sections"><a href="#why-arthra">Why Arthra</a><a href="#flows">Inside the flow</a><a href="#trust">Privacy</a></div><div className="arthra-nav__actions"><button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><button className="nav-login" type="button" onClick={handlePrimaryAction}>{isAuthenticated ? "Workspace" : "Sign in"}</button></div></nav>
      <div id="top" className="hero-grid container">
        <motion.div className="hero-copy" initial={reduceMotion ? false : "hidden"} animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.p className="eyebrow" variants={reveal} transition={{ duration: 0.52 }}>Personal finance, with Indian context</motion.p><motion.h1 variants={reveal} transition={{ duration: 0.58 }}>A more <em>considered</em> way to stay close to your money.</motion.h1><motion.p className="hero-lede" variants={reveal} transition={{ duration: 0.58 }}>Arthra is a private finance workspace for the money you live with: your everyday, your people, and the records your future self will thank you for.</motion.p><motion.div className="hero-actions" variants={reveal} transition={{ duration: 0.55 }}><button className="button-primary" type="button" onClick={handlePrimaryAction}><span>{ctaLabel}</span><ArrowRight size={17} /></button><a className="text-link" href="#why-arthra">Explore the approach <ChevronRight size={16} /></a></motion.div><motion.div className="hero-note" variants={reveal} transition={{ duration: 0.5 }}><Fingerprint size={15} /><span>No account data is shown until you choose to sign in.</span></motion.div>
        </motion.div>
        <motion.div className="hero-visual" initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.16 }}><HeroPreview pointer={pointer} /></motion.div>
      </div>
      <div className="hero-trust container" aria-label="Product properties"><span><Check size={14} /> INR-native</span><span><Check size={14} /> Securely private</span><span><Check size={14} /> CA-ready exports</span></div>
    </section>

    <section id="why-arthra" className="bento-section container"><motion.div className="section-intro" initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={reveal} transition={{ duration: 0.55 }}><p className="eyebrow">Not another generic money app</p><h2>Built around the details that make your finances yours.</h2></motion.div><div className="bento-grid"><motion.article className="bento-card bento-card--wide bento-card--lavender" initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={reveal} transition={{ duration: 0.52 }}><div><span className="bento-icon"><BadgeIndianRupee size={22} /></span><p className="bento-number">01</p><h3>India is not an afterthought.</h3><p>Read every amount in lakh/crore notation. Work in the Apr–Mar financial year. Tag GST when a business expense needs more context.</p></div><div className="bento-rs" aria-hidden="true">₹</div></motion.article><motion.article className="bento-card bento-card--coral" initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={reveal} transition={{ duration: 0.52, delay: 0.07 }}><span className="bento-icon"><UsersRound size={22} /></span><p className="bento-number">02</p><h3>Shared when it matters.</h3><p>Give a home, trip, or flatmate wallet its own boundaries and permissions.</p><div className="avatar-stack" aria-hidden="true"><i>A</i><i>S</i><i>+</i></div></motion.article><motion.article className="bento-card bento-card--ink" initial={reduceMotion ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={reveal} transition={{ duration: 0.52, delay: 0.12 }}><span className="bento-icon"><FileOutput size={22} /></span><p className="bento-number">03</p><h3>Useful beyond the screen.</h3><p>Generate a CA-ready ledger, then share a time-limited read-only report when it is time to hand off.</p><ArrowUpRight className="bento-arrow" size={21} /></motion.article></div></section>

    <section id="flows" className="feature-rail-section"><div className="container feature-rail__intro"><p className="eyebrow">From signal to action</p><h2>Some finance tools collect. Arthra helps you <em>notice.</em></h2></div><div className="feature-rail" role="list">{featureRail.map((feature, index) => { const Icon = feature.icon; return <motion.article key={feature.title} className={`rail-card rail-card--${feature.tint}`} role="listitem" initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.48, delay: index * 0.06 }}><span className="rail-icon"><Icon size={24} /></span><p className="rail-eyebrow">{feature.eyebrow}</p><h3>{feature.title}</h3><p>{feature.text}</p><span className="rail-corner"><ArrowRight size={19} /></span></motion.article>; })}</div><p className="feature-rail__hint container">Swipe or scroll to move through the system <ArrowRight size={15} /></p></section>

    <section className="narrative-section container"><div className="narrative-sticky"><p className="eyebrow">A quieter dashboard</p><h2>Less performance.<br /><em>More perspective.</em></h2><p>Every number should earn its place. So Arthra gives you a calm landing zone, then lets detail unfold only when you ask for it.</p><button className="button-secondary" type="button" onClick={handlePrimaryAction}>See your private workspace <ArrowRight size={16} /></button></div><div className="narrative-steps"><article><span>01</span><div><ReceiptText size={23} /><h3>Log the moment</h3><p>Add an expense or income entry without having to decide everything upfront. Receipts can sit beside the record, not in your camera roll.</p></div></article><article><span>02</span><div><Orbit size={23} /><h3>Let the context build</h3><p>Budgets, categories, spaces, and recurring activity become a living picture instead of a retrospective spreadsheet.</p></div></article><article><span>03</span><div><Sparkles size={23} /><h3>Take the next useful step</h3><p>Read a plain-language observation, export a clean ledger, or share only the precise financial view someone needs.</p></div></article></div></section>

    <section id="trust" className="trust-section container"><div className="trust-orb" aria-hidden="true"><span>₹</span></div><div className="trust-copy"><p className="eyebrow">Private from the first click</p><h2>Your finances belong behind your sign-in.</h2><p>The public site contains product information only. Your transactions, reports, spaces, receipts, and insights are loaded only after an authenticated session is present.</p><button className="button-primary button-primary--light" type="button" onClick={handlePrimaryAction}>{isAuthenticated ? "Open workspace" : "Sign in securely"}<ArrowRight size={17} /></button></div></section>
    <footer className="arthra-footer container"><div><BrandMark /><p>Money, with a little more context.</p></div><div className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="#top">Back to top</a></div><p className="footer-meta">© {new Date().getFullYear()} Arthra. Built for deliberate money habits.</p></footer>
  </main>;
}
