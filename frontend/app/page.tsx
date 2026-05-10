"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Sparkles, LineChart, Brain, ShieldCheck } from "lucide-react";

const VIDEO_SRC =
  "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

const NAV_LINKS = [
  { label: "PLATFORM", href: "#platform" },
  { label: "AGENTS", href: "#agents" },
  { label: "ABOUT", href: "#about" },
  { label: "DASHBOARD", href: "/dashboard" },
];

/** NEX APEX wordmark — geometric sans, cyan glow per brand guidelines */
function NexApexLogo({ size = 22 }: { size?: number }) {
  return (
    <span
      className="rv-logo-word"
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.18em",
        color: "var(--rv-white)",
        textTransform: "uppercase",
        lineHeight: 1,
        filter: "drop-shadow(0 0 12px rgba(148,252,255,0.18))",
      }}
    >
      NEX<span style={{ color: "var(--rv-cyan)" }}>·</span>APEX
    </span>
  );
}

export default function Landing() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: { destroy: () => void } | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = VIDEO_SRC;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (Hls.isSupported() && video) {
          const instance = new Hls({ enableWorker: false });
          instance.loadSource(VIDEO_SRC);
          instance.attachMedia(video);
          hls = instance;
        }
      });
    }

    return () => {
      hls?.destroy();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <main className="rv-landing">
      {/* ====== HERO ====== */}
      <section className="rv-hero">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="rv-video"
        />
        <div className="rv-overlay-left" />
        <div className="rv-overlay-bottom" />

        <div className="rv-grid" aria-hidden="true">
          <span style={{ left: "25%" }} />
          <span style={{ left: "50%" }} />
          <span style={{ left: "75%" }} />
        </div>

        {/* Apex Cyan central glow — NEX APEX signature */}
        <svg className="rv-glow" viewBox="0 0 1200 400" aria-hidden="true">
          <defs>
            <filter id="rv-blur" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="25" />
            </filter>
            <radialGradient id="rv-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#94fcff" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#1a2630" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0e1418" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse
            cx="600"
            cy="200"
            rx="520"
            ry="120"
            fill="url(#rv-grad)"
            filter="url(#rv-blur)"
          />
        </svg>

        {/* Header */}
        <header className="rv-header">
          <Link href="/" className="rv-logo" aria-label="NEX APEX home">
            <span className="rv-logo-mark" aria-hidden="true">
              {/* Iconmark — apex/peak motif in Apex Cyan */}
              <svg viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 3 L25 24 L3 24 Z"
                  stroke="#94fcff"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 10 L20 22 L8 22 Z"
                  fill="#94fcff"
                  fillOpacity="0.85"
                />
              </svg>
            </span>
            <NexApexLogo />
          </Link>

          <nav className="rv-nav-desktop" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="rv-nav-link">
                {l.label}
              </a>
            ))}
            <Link href="/dashboard" className="rv-nav-cta">
              LAUNCH APP
            </Link>
          </nav>

          <button
            type="button"
            className="rv-burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {menuOpen && (
          <div className="rv-mobile-menu" role="dialog" aria-modal="true">
            <nav>
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rv-mobile-link"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="rv-mobile-cta"
              >
                LAUNCH APP <ArrowRight size={18} />
              </Link>
            </nav>
          </div>
        )}

        <div className="rv-hero-inner">
          {/* Liquid glass card */}
          <div className="rv-glass">
            <span className="rv-glass-tag">[ V2 · 2026 ]</span>
            <h3 className="rv-glass-title">
              Built for <em>Revenue</em> leaders
            </h3>
            <p className="rv-glass-desc">
              An autonomous pricing system tuned for luxury hospitality — by NEX APEX.
            </p>
          </div>

          <span className="rv-eyebrow">NEX APEX · AI TECH SOLUTIONS</span>
          <h1 className="rv-headline">
            PRICE EVERY ROOM.
            <br />
            BEAT EVERY MARKET<span className="rv-period">.</span>
          </h1>
          <p className="rv-sub">
            Multi-agent revenue intelligence engineered for precision, accuracy, and
            convergence. Forecast demand, model elasticity, and ship pricing decisions
            in seconds — defended by data, deployed with confidence.
          </p>

          <div className="rv-cta-row">
            <Link href="/dashboard" className="rv-cta-primary">
              Get Started <ArrowRight size={16} strokeWidth={2.4} />
            </Link>
            <a href="#agents" className="rv-cta-ghost">
              Explore the platform
            </a>
          </div>

          <div className="rv-trust">
            <span className="rv-trust-dot" />
            <span>Live on luxury properties across SE Asia</span>
          </div>
        </div>
      </section>

      {/* ====== AGENTS ====== */}
      <section id="agents" className="rv-section">
        <div className="rv-section-head">
          <span className="rv-kicker">— THE PIPELINE</span>
          <h2 className="rv-h2">
            Four agents. One <em>decision</em>.
          </h2>
          <p className="rv-sub-2">
            Every quote is the product of four NEX APEX specialists collaborating in
            real time — Convergence, by design.
          </p>
        </div>

        <div className="rv-grid-3">
          {[
            {
              icon: <Brain size={20} />,
              title: "Forecaster",
              copy: "Demand modelling across pace, lead-time, and seasonality — calibrated to your STR set.",
            },
            {
              icon: <LineChart size={20} />,
              title: "Pricing Strategist",
              copy: "Elastic pricing that respects parity, channel cost, and brand positioning.",
            },
            {
              icon: <Sparkles size={20} />,
              title: "Compositor",
              copy: "Stitches recommendations into a single, explainable revenue narrative.",
            },
            {
              icon: <ShieldCheck size={20} />,
              title: "Risk Steward",
              copy: "Guardrails on every move — caps, approvals, and audit-ready reasoning.",
            },
          ].map((c) => (
            <article key={c.title} className="rv-card">
              <span className="rv-card-icon">{c.icon}</span>
              <h3 className="rv-card-title">{c.title}</h3>
              <p className="rv-card-copy">{c.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ====== PLATFORM STRIP ====== */}
      <section id="platform" className="rv-section rv-strip">
        <div className="rv-strip-inner">
          <div>
            <span className="rv-kicker">— OUTCOMES</span>
            <h2 className="rv-h2">
              From <em>spreadsheet</em> to system of record.
            </h2>
          </div>
          <ul className="rv-stats">
            <li>
              <strong>+8.4%</strong>
              <span>RevPAR uplift, 90-day median</span>
            </li>
            <li>
              <strong>2.1s</strong>
              <span>Average decision latency</span>
            </li>
            <li>
              <strong>100%</strong>
              <span>Reasoning is auditable, every time</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ====== ABOUT / CTA ====== */}
      <section id="about" className="rv-section rv-cta-section">
        <h2 className="rv-h2 rv-h2-center">
          Run a property in <em>two minutes</em>.
        </h2>
        <p className="rv-sub-2 rv-center">
          Drop in an STR set, set the dates, and let the agents argue it out.
        </p>
        <div className="rv-cta-row rv-center-row">
          <Link href="/dashboard" className="rv-cta-primary">
            Open Dashboard <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="rv-footer">
        <div className="rv-footer-brand">
          <NexApexLogo size={14} />
        </div>
        <div className="rv-footer-meta">
          <span>© 2026 NEX APEX · AI Tech Solutions</span>
          <span className="rv-footer-sep">·</span>
          <a href="#">Privacy</a>
          <span className="rv-footer-sep">·</span>
          <a href="#">Terms</a>
        </div>
      </footer>

      {/* ============== STYLES ============== */}
      <style>{`
        :root {
          /* NEX APEX brand tokens */
          --rv-bg: #0e1418;
          --rv-surface: #162029;
          --rv-surface-2: #1d2d39;
          --rv-teal: #1a2630;
          --rv-cyan: #94fcff;
          --rv-mauve: #b9afbb;
          --rv-sage: #dfe4dc;
          --rv-slate: #45596d;
          --rv-red: #c63518;
          --rv-white: #f0f1ef;
          --rv-text: #c8ccc6;
          --rv-dim: #6e7a84;
          --rv-muted: rgba(240,241,239,0.7);
        }

        .rv-landing {
          background: var(--rv-bg);
          color: var(--rv-white);
          font-family: var(--font-body), 'Rajdhani', ui-sans-serif, system-ui, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ---------- HERO ---------- */
        .rv-hero {
          position: relative;
          min-height: 100vh;
          isolation: isolate;
          padding: 0 clamp(20px, 5vw, 64px);
          display: flex;
          flex-direction: column;
        }

        .rv-video {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.55;
          z-index: 0;
          filter: saturate(0.85) hue-rotate(-12deg);
        }
        .rv-overlay-left {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, var(--rv-bg) 0%, rgba(14,20,24,0.55) 40%, rgba(14,20,24,0) 100%);
          z-index: 1;
        }
        .rv-overlay-bottom {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(14,20,24,0.2) 0%, rgba(14,20,24,0.4) 50%, var(--rv-bg) 100%);
          z-index: 1;
        }
        .rv-grid {
          position: absolute; inset: 0;
          z-index: 2;
          pointer-events: none;
        }
        .rv-grid span {
          position: absolute;
          top: 0; bottom: 0;
          width: 1px;
          background: rgba(148,252,255,0.06);
        }
        @media (max-width: 768px) { .rv-grid { display: none; } }

        .rv-glow {
          position: absolute;
          top: 8%; left: 50%;
          transform: translateX(-50%);
          width: min(1200px, 110%);
          height: 400px;
          z-index: 2;
          pointer-events: none;
        }

        /* ---------- HEADER ---------- */
        .rv-header {
          position: relative;
          z-index: 20;
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 0;
        }
        .rv-logo {
          display: flex; align-items: center; gap: 12px;
          color: var(--rv-white);
          text-decoration: none;
        }
        .rv-logo-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          border: 1px solid rgba(148,252,255,0.22);
          border-radius: 8px;
          background: rgba(148,252,255,0.04);
          filter: drop-shadow(0 0 12px rgba(148,252,255,0.15));
        }
        .rv-logo-mark svg { width: 18px; height: 18px; }

        .rv-nav-desktop {
          display: flex; align-items: center; gap: 28px;
        }
        @media (max-width: 900px) { .rv-nav-desktop { display: none; } }

        .rv-nav-link {
          color: var(--rv-dim);
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-decoration: none;
          font-weight: 400;
          text-transform: uppercase;
          transition: color 200ms cubic-bezier(.22,.61,.36,1);
        }
        .rv-nav-link:hover { color: var(--rv-cyan); }

        .rv-nav-cta {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.18em;
          color: var(--rv-bg);
          background: var(--rv-cyan);
          padding: 10px 18px;
          border-radius: 4px;
          text-decoration: none;
          text-transform: uppercase;
          transition: box-shadow 200ms ease-out, transform 200ms ease-out;
          box-shadow: 0 0 24px rgba(148,252,255,0.18);
        }
        .rv-nav-cta:hover {
          box-shadow: 0 0 36px rgba(148,252,255,0.32);
          transform: translateY(-1px);
        }

        .rv-burger {
          display: none;
          background: transparent; border: 1px solid rgba(148,252,255,0.18);
          color: var(--rv-white);
          width: 40px; height: 40px;
          border-radius: 8px;
          align-items: center; justify-content: center;
          cursor: pointer;
        }
        @media (max-width: 900px) { .rv-burger { display: inline-flex; } }

        .rv-mobile-menu {
          position: fixed; inset: 0;
          background: rgba(14,20,24,0.96);
          backdrop-filter: blur(20px);
          z-index: 100;
          display: flex; align-items: center; justify-content: center;
        }
        .rv-mobile-menu nav {
          display: flex; flex-direction: column; gap: 24px; align-items: center;
        }
        .rv-mobile-link {
          color: var(--rv-white);
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-size: 18px;
          letter-spacing: 0.18em;
          text-decoration: none;
          text-transform: uppercase;
        }
        .rv-mobile-link:hover { color: var(--rv-cyan); }
        .rv-mobile-cta {
          margin-top: 12px;
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--rv-bg); background: var(--rv-cyan);
          padding: 12px 20px; border-radius: 4px; text-decoration: none;
          font-weight: 700; letter-spacing: 0.18em; font-size: 12px;
          font-family: var(--font-display), 'Orbitron', sans-serif;
          text-transform: uppercase;
          box-shadow: 0 0 28px rgba(148,252,255,0.22);
        }

        /* ---------- HERO INNER ---------- */
        .rv-hero-inner {
          position: relative; z-index: 5;
          flex: 1;
          display: flex; flex-direction: column; justify-content: center;
          padding: 40px 0 90px;
          max-width: 880px;
        }

        /* Liquid glass card */
        .rv-glass {
          width: 220px; height: 200px;
          border-radius: 18px;
          padding: 18px 20px;
          display: flex; flex-direction: column; justify-content: space-between;
          margin-bottom: 28px;
          transform: translateY(-50px);
          position: relative;
          background: rgba(255,255,255,0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px) saturate(140%);
          -webkit-backdrop-filter: blur(4px) saturate(140%);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 30px 60px -30px rgba(0,0,0,0.6);
        }
        .rv-glass::before {
          content: "";
          position: absolute; inset: 0;
          padding: 1.4px;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(148,252,255,0.55) 0%, rgba(255,255,255,0.06) 60%, rgba(148,252,255,0.22) 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .rv-glass-tag {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-size: 12px;
          color: var(--rv-cyan);
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .rv-glass-title {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.25;
          letter-spacing: 0.04em;
          margin: 0;
          text-transform: uppercase;
        }
        .rv-glass-title em {
          font-style: italic;
          font-weight: 400;
          color: var(--rv-cyan);
          text-transform: none;
          letter-spacing: 0;
        }
        .rv-glass-desc {
          font-family: var(--font-body), 'Rajdhani', sans-serif;
          font-size: 12px;
          line-height: 1.55;
          color: var(--rv-mauve);
          margin: 0;
        }

        .rv-eyebrow {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.24em;
          color: var(--rv-cyan);
          text-transform: uppercase;
          margin-bottom: 18px;
          display: inline-block;
          padding: 6px 12px;
          border: 1px solid rgba(148,252,255,0.22);
          border-radius: 999px;
          background: rgba(148,252,255,0.04);
        }
        .rv-headline {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-weight: 800;
          font-size: clamp(40px, 7vw, 72px);
          line-height: 0.98;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          margin: 0 0 22px;
          background: linear-gradient(135deg, var(--rv-white) 0%, var(--rv-mauve) 40%, var(--rv-cyan) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .rv-period {
          -webkit-text-fill-color: var(--rv-cyan);
          color: var(--rv-cyan);
        }

        .rv-sub {
          font-family: var(--font-body), 'Rajdhani', sans-serif;
          font-size: 16px;
          line-height: 1.65;
          color: var(--rv-text);
          max-width: 560px;
          margin: 0 0 32px;
          font-weight: 400;
        }
        .rv-sub-2 {
          font-family: var(--font-body), 'Rajdhani', sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: var(--rv-text);
          max-width: 580px;
        }

        .rv-cta-row {
          display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
        }
        .rv-cta-primary {
          display: inline-flex; align-items: center; gap: 10px;
          background: var(--rv-cyan); color: var(--rv-bg);
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;
          padding: 14px 22px;
          border-radius: 4px;
          text-decoration: none;
          transition: box-shadow 200ms ease-out, transform 200ms ease-out;
          box-shadow: 0 0 28px rgba(148,252,255,0.22);
        }
        .rv-cta-primary:hover {
          box-shadow: 0 0 44px rgba(148,252,255,0.4);
          transform: translateY(-1px);
        }
        .rv-cta-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--rv-white);
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;
          padding: 14px 18px;
          border: 1px solid rgba(148,252,255,0.18);
          border-radius: 4px;
          text-decoration: none;
          transition: border-color 200ms ease-out, color 200ms ease-out, background 200ms ease-out;
          background: rgba(148,252,255,0.02);
        }
        .rv-cta-ghost:hover {
          border-color: var(--rv-cyan);
          color: var(--rv-cyan);
          background: rgba(148,252,255,0.06);
        }

        .rv-trust {
          margin-top: 28px;
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--rv-dim);
        }
        .rv-trust-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--rv-cyan);
          box-shadow: 0 0 10px var(--rv-cyan);
        }

        /* ---------- SECTIONS ---------- */
        .rv-section {
          padding: clamp(80px, 10vw, 140px) clamp(20px, 5vw, 64px);
          position: relative;
        }
        .rv-section-head { max-width: 720px; margin-bottom: 56px; }
        .rv-kicker {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.22em;
          color: var(--rv-cyan);
          text-transform: uppercase;
        }
        .rv-h2 {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-weight: 800;
          font-size: clamp(32px, 5vw, 56px);
          line-height: 1.05;
          letter-spacing: 0.01em;
          margin: 14px 0 18px;
          text-transform: uppercase;
          background: linear-gradient(135deg, var(--rv-white) 0%, var(--rv-mauve) 50%, var(--rv-cyan) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .rv-h2 em {
          font-style: italic;
          font-weight: 400;
          -webkit-text-fill-color: var(--rv-cyan);
          color: var(--rv-cyan);
          text-transform: none;
          letter-spacing: 0;
        }
        .rv-h2-center { text-align: center; margin: 14px auto 18px; max-width: 800px; }
        .rv-center { text-align: center; margin-left: auto; margin-right: auto; }
        .rv-center-row { justify-content: center; margin-top: 28px; }

        .rv-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .rv-card {
          padding: 26px;
          border-radius: 12px;
          background: var(--rv-surface);
          border: 1px solid rgba(148,252,255,0.06);
          transition: border-color 220ms cubic-bezier(.22,.61,.36,1),
                      transform 220ms cubic-bezier(.22,.61,.36,1),
                      box-shadow 220ms cubic-bezier(.22,.61,.36,1);
        }
        .rv-card:hover {
          border-color: rgba(148,252,255,0.32);
          transform: translateY(-2px);
          box-shadow: 0 0 32px rgba(148,252,255,0.08);
        }
        .rv-card-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px;
          border-radius: 8px;
          background: rgba(148,252,255,0.08);
          color: var(--rv-cyan);
          margin-bottom: 18px;
          border: 1px solid rgba(148,252,255,0.18);
        }
        .rv-card-title {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.06em;
          margin: 0 0 8px;
          text-transform: uppercase;
          color: var(--rv-white);
        }
        .rv-card-copy {
          font-family: var(--font-body), 'Rajdhani', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: var(--rv-text);
          margin: 0;
        }

        .rv-strip {
          border-top: 1px solid rgba(148,252,255,0.06);
          border-bottom: 1px solid rgba(148,252,255,0.06);
          background: linear-gradient(180deg, rgba(26,38,48,0.4) 0%, var(--rv-bg) 100%);
        }
        .rv-strip-inner {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        @media (max-width: 880px) { .rv-strip-inner { grid-template-columns: 1fr; gap: 32px; } }
        .rv-stats {
          list-style: none; padding: 0; margin: 0;
          display: grid; gap: 22px;
        }
        .rv-stats li {
          display: flex; align-items: baseline; gap: 18px;
          padding-bottom: 18px;
          border-bottom: 1px dashed rgba(148,252,255,0.1);
        }
        .rv-stats li:last-child { border-bottom: none; padding-bottom: 0; }
        .rv-stats strong {
          font-family: var(--font-display), 'Orbitron', sans-serif;
          font-weight: 800;
          font-size: 38px;
          letter-spacing: 0.01em;
          color: var(--rv-cyan);
          min-width: 130px;
          filter: drop-shadow(0 0 16px rgba(148,252,255,0.2));
        }
        .rv-stats span {
          font-family: var(--font-body), 'Rajdhani', sans-serif;
          font-size: 14px;
          color: var(--rv-text);
        }

        .rv-cta-section { padding-bottom: 120px; }

        /* ---------- FOOTER ---------- */
        .rv-footer {
          padding: 32px clamp(20px, 5vw, 64px);
          border-top: 1px solid rgba(148,252,255,0.06);
          display: flex; gap: 18px; flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-body), 'Rajdhani', sans-serif;
          font-size: 12px;
          color: var(--rv-dim);
        }
        .rv-footer-meta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .rv-footer a { color: inherit; text-decoration: none; }
        .rv-footer a:hover { color: var(--rv-cyan); }
        .rv-footer-sep { opacity: 0.4; }

        @media (prefers-reduced-motion: reduce) {
          .rv-video { display: none; }
        }
      `}</style>
    </main>
  );
}
