import React from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Cpu, Shield, Zap, BarChart3, ArrowRight, CheckCircle, Activity } from "lucide-react";

// ─── Keyframes ────────────────────────────────────────────────────────────────

const dots = keyframes`
  0%   { background-position: 0 0, 4px 4px; }
  100% { background-position: 8px 0, 12px 4px; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`;

// ─── Styled Button (from your design) ────────────────────────────────────────

const StyledButton = styled.button`
  --bg:     #000000;
  --yellow: #facc15;
  --white:  #ffffff;

  font-size: 1rem;
  cursor: pointer;
  position: relative;
  font-family: 'Google Sans', sans-serif;
  font-weight: 700;
  line-height: 1;
  padding: 1px;
  transform: translate(-4px, -4px);
  outline: 2px solid transparent;
  outline-offset: 5px;
  border-radius: 9999px;
  background-color: var(--bg);
  color: var(--bg);
  transition: transform 150ms ease, box-shadow 150ms ease;
  text-align: center;
  border: none;
  box-shadow:
    0.5px 0.5px 0 0 var(--bg), 1px 1px 0 0 var(--bg),
    1.5px 1.5px 0 0 var(--bg), 2px 2px 0 0 var(--bg),
    2.5px 2.5px 0 0 var(--bg), 3px 3px 0 0 var(--bg),
    0 0 0 2px var(--white),
    0.5px 0.5px 0 2px var(--white), 1px 1px 0 2px var(--white),
    1.5px 1.5px 0 2px var(--white), 2px 2px 0 2px var(--white),
    2.5px 2.5px 0 2px var(--white), 3px 3px 0 2px var(--white),
    3.5px 3.5px 0 2px var(--white), 4px 4px 0 2px var(--white);

  &:hover {
    transform: translate(0, 0);
    box-shadow: 0 0 0 2px var(--white);
  }
  &:active, &:focus-visible { outline-color: var(--yellow); }
  &:focus-visible { outline-style: dashed; }

  & > div {
    position: relative;
    pointer-events: none;
    background-color: var(--yellow);
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 9999px;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      opacity: 0.5;
      background-image:
        radial-gradient(rgb(255 255 255 / 80%) 20%, transparent 20%),
        radial-gradient(rgb(255 255 255 / 100%) 20%, transparent 20%);
      background-position: 0 0, 4px 4px;
      background-size: 8px 8px;
      mix-blend-mode: hard-light;
      animation: ${dots} 0.5s infinite linear;
    }

    & > span {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      gap: 0.4rem;
      color: #000;
      font-weight: 700;
      font-size: 0.95rem;
      filter: drop-shadow(0 -1px 0 rgba(255,255,255,0.25));

      &:active { transform: translateY(2px); }
    }
  }
`;

// ─── Ghost button ─────────────────────────────────────────────────────────────

const GhostButton = styled.button`
  font-family: 'Google Sans', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  border: 2px solid #ffffff;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    background: #ffffff;
    color: #000000;
  }
`;

// ─── Feature card ─────────────────────────────────────────────────────────────

const FeatureCard = styled.div<{ $accent: string }>`
  background: #000000;
  border: 2px solid ${p => p.$accent};
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  transition: transform 150ms ease, box-shadow 150ms ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px ${p => p.$accent}44;
  }

  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: ${p => p.$accent};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    color: #000;
  }

  .step-num {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: ${p => p.$accent};
    opacity: 0.6;
  }

  h3 {
    font-family: 'Google Sans', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.78rem;
    color: #94a3b8;
    line-height: 1.6;
  }
`;

// ─── Tilted yellow highlight ──────────────────────────────────────────────────

const YellowHighlight = styled.span`
  position: relative;
  display: inline-block;
  color: #000000;
  font-weight: 700;
  z-index: 1;

  &::before {
    content: "";
    position: absolute;
    inset: -2px -6px;
    background: #facc15;
    transform: rotate(-2deg) skewX(-3deg);
    z-index: -1;
    border-radius: 4px;
  }
`;

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Nav = styled.nav`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: calc(100% - 4rem);
  max-width: 900px;
  background: #0a0a0a;
  border: 2px solid #facc15;
  border-radius: 9999px;
  padding: 0 1.5rem;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 32px rgba(250, 204, 21, 0.15);
`;

const NavLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .logo-icon {
    width: 32px;
    height: 32px;
    background: #facc15;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
  }

  span {
    font-family: 'Google Sans Display', sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    color: #ffffff;
    letter-spacing: -0.02em;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .nav-link {
    font-family: 'Google Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: #cbd5e1;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 150ms;
    padding: 0.4rem 0.75rem;
    border-radius: 9999px;

    &:hover {
      color: #ffffff;
      background: rgba(255,255,255,0.06);
    }
  }
`;

// ─── Pill badge ───────────────────────────────────────────────────────────────

const PillBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: #facc15;
  color: #000;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 2rem;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #000;
    animation: ${pulse} 2s infinite;
  }
`;

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  const steps = [
    { step: 1, icon: <Cpu size={18} />,         title: "Model Upload",   desc: "Upload .pt .pth .onnx .h5 .pkl .joblib with architecture & metrics", accent: "#3b82f6" },
    { step: 2, icon: <Shield size={18} />,       title: "Analysis",       desc: "Detect task type, vulnerabilities, and edge cases automatically",    accent: "#a855f7" },
    { step: 3, icon: <BarChart3 size={18} />,    title: "Dataset Fetch",  desc: "Fetch targeted datasets from Kaggle, HuggingFace, Roboflow",         accent: "#f59e0b" },
    { step: 4, icon: <Zap size={18} />,          title: "Stress Testing", desc: "Evaluate model against all detected stressors and edge cases",       accent: "#ef4444" },
    { step: 5, icon: <CheckCircle size={18} />,  title: "Report",         desc: "Download deployment readiness PDF/DOCX with robustness score",       accent: "#10b981" },
  ];

  const formats = [
    { label: "Model Formats",  items: [".pt", ".pth", ".onnx", ".h5", ".pkl", ".joblib"], accent: "#3b82f6" },
    { label: "Dataset Types",  items: ["Image", "Tabular", "Time Series", "Sequential", "Vector"], accent: "#a855f7" },
    { label: "Data Sources",   items: ["Kaggle", "HuggingFace", "Roboflow", "Synthetic"], accent: "#f59e0b" },
    { label: "Report Outputs", items: ["Robustness Score", "Risk Level", "PDF Report", "DOCX Report"], accent: "#10b981" },
  ];

  return (
    <div style={{ background: "#000000", minHeight: "100vh", fontFamily: "'Google Sans', sans-serif" }}>

      {/* ── Navbar ── */}
      <Nav>
        <NavLogo>
          <div className="logo-icon"><Cpu size={16} /></div>
          <span>BlindSpot.AI</span>
        </NavLogo>
        <NavLinks>
          <button className="nav-link" onClick={() => navigate("/docs")}>Docs</button>
          <button className="nav-link" onClick={() => navigate("/pricing")}>Pricing</button>
          <button className="nav-link" onClick={() => navigate("/evaluations")}>Dashboard</button>
          <button
            onClick={() => navigate("/evaluations")}
            style={{
              background: "#facc15",
              color: "#000",
              border: "none",
              borderRadius: "9999px",
              padding: "6px 16px",
              fontFamily: "'Google Sans', sans-serif",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "opacity 150ms",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
          >
            Get Started <ArrowRight size={13} />
          </button>
        </NavLinks>
      </Nav>

      {/* ── Hero ── */}
      <section style={{ padding: "140px 2rem 80px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <PillBadge>
          <span className="dot" />
          AI Robustness Evaluation Platform v2.0
        </PillBadge>

        <h1 style={{
          fontFamily: "'Google Sans Display', 'Google Sans', sans-serif",
          fontSize: "clamp(2.8rem, 6vw, 5rem)",
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          marginBottom: "1.5rem",
        }}>
          Find your model's blind spots<br />
          before{" "}
          <YellowHighlight>failure</YellowHighlight>
          {" "}finds you.
        </h1>

        <p style={{
          fontSize: "1.1rem",
          color: "#94a3b8",
          maxWidth: "600px",
          margin: "0 auto 2.5rem",
          lineHeight: 1.7,
        }}>
          Upload any AI model. BlindSpot.AI analyzes vulnerabilities, fetches targeted
          stress-test datasets, runs automated robustness evaluation, and generates a
          deployment readiness report.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <StyledButton onClick={() => navigate("/evaluations")}>
            <div><span>Start Evaluation <ArrowRight size={15} /></span></div>
          </StyledButton>
          <GhostButton>
            <Activity size={15} /> View Demo
          </GhostButton>
        </div>
      </section>

      {/* ── 5-Step Pipeline ── */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{
          textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "13px",
          color: "#facc15",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: "2.5rem",
        }}>
          5-Step Evaluation Pipeline
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {steps.map(s => (
            <FeatureCard key={s.step} $accent={s.accent}>
              <div className="icon-box">{s.icon}</div>
              <div className="step-num">0{s.step}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </FeatureCard>
          ))}
        </div>
      </section>

      {/* ── Supported Formats ── */}
      <section style={{
        padding: "4rem 2rem",
        maxWidth: "1100px",
        margin: "0 auto",
        borderTop: "2px solid #facc15",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
          {formats.map(col => (
            <div key={col.label}>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
                color: col.accent,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                marginBottom: "1rem",
              }}>
                {col.label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {col.items.map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: col.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        margin: "0 2rem 4rem",
        maxWidth: "1100px",
        marginLeft: "auto",
        marginRight: "auto",
        background: "#facc15",
        borderRadius: "16px",
        padding: "3rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.5rem",
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Google Sans Display', sans-serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#000000",
            marginBottom: "0.5rem",
          }}>
            Ready to stress-test your model?
          </h2>
          <p style={{ color: "#000000", opacity: 0.7, fontSize: "0.95rem" }}>
            No GPU required. Runs fully in mock mode. Results in under 30 seconds.
          </p>
        </div>
        <button
          onClick={() => navigate("/evaluations")}
          style={{
            background: "#000000",
            color: "#facc15",
            border: "none",
            borderRadius: "9999px",
            padding: "0.85rem 2rem",
            fontFamily: "'Google Sans', sans-serif",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap",
          }}
        >
          Open Dashboard <ArrowRight size={16} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "2px solid #facc15", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", color: "#94a3b8" }}>
          BlindSpot.AI — AI Robustness Evaluation Platform · HACKOLUTION 2026
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[["Docs", "/docs"], ["Pricing", "/pricing"], ["Dashboard", "/evaluations"]].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "14px", fontFamily: "'Google Sans', sans-serif", transition: "color 150ms" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#facc15"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"}
            >{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
