import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, ArrowRight, CheckCircle, X, Zap, Shield, BarChart3, FileText, Database, Users, Building2, Rocket } from "lucide-react";

const FONT = "'Google Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

const plans = [
  {
    name: "Starter",
    icon: <Zap size={22} />,
    accent: "#3b82f6",
    monthly: 0,
    annual: 0,
    tagline: "For individuals and students",
    cta: "Start Free",
    ctaVariant: "outline",
    features: [
      { text: "5 evaluations per month",        included: true  },
      { text: "All 5 dataset types",             included: true  },
      { text: "Mock ML mode (no GPU needed)",    included: true  },
      { text: "PDF & DOCX reports",              included: true  },
      { text: "Synthetic dataset generation",    included: true  },
      { text: "3 stressors per evaluation",      included: true  },
      { text: "Real dataset suggestions",        included: true  },
      { text: "Priority support",                included: false },
      { text: "Custom stressors",                included: false },
      { text: "API access",                      included: false },
      { text: "Team collaboration",              included: false },
    ],
  },
  {
    name: "Pro",
    icon: <Shield size={22} />,
    accent: "#facc15",
    monthly: 2499,
    annual: 1999,
    tagline: "For ML engineers & researchers",
    cta: "Start Pro Trial",
    ctaVariant: "primary",
    badge: "Most Popular",
    features: [
      { text: "Unlimited evaluations",           included: true  },
      { text: "All 5 dataset types",             included: true  },
      { text: "Mock ML + GPU mode",              included: true  },
      { text: "PDF & DOCX reports",              included: true  },
      { text: "Synthetic dataset generation",    included: true  },
      { text: "All 8 stressors",                 included: true  },
      { text: "Real dataset suggestions",        included: true  },
      { text: "Priority email support",          included: true  },
      { text: "Custom stressors",                included: true  },
      { text: "Full API access",                 included: true  },
      { text: "Team collaboration (up to 3)",    included: false },
    ],
  },
  {
    name: "Team",
    icon: <Users size={22} />,
    accent: "#a855f7",
    monthly: 7999,
    annual: 6399,
    tagline: "For ML teams & startups",
    cta: "Start Team Trial",
    ctaVariant: "outline",
    features: [
      { text: "Unlimited evaluations",           included: true  },
      { text: "All 5 dataset types",             included: true  },
      { text: "Mock ML + GPU mode",              included: true  },
      { text: "PDF & DOCX reports",              included: true  },
      { text: "Synthetic dataset generation",    included: true  },
      { text: "All 8 stressors",                 included: true  },
      { text: "Real dataset suggestions",        included: true  },
      { text: "Priority support (SLA 4h)",       included: true  },
      { text: "Custom stressors",                included: true  },
      { text: "Full API access",                 included: true  },
      { text: "Team collaboration (up to 10)",   included: true  },
    ],
  },
  {
    name: "Enterprise",
    icon: <Building2 size={22} />,
    accent: "#10b981",
    monthly: null,
    annual: null,
    tagline: "For large organizations",
    cta: "Contact Sales",
    ctaVariant: "outline",
    features: [
      { text: "Unlimited everything",            included: true  },
      { text: "On-premise deployment",           included: true  },
      { text: "Custom ML pipeline",              included: true  },
      { text: "White-label reports",             included: true  },
      { text: "Custom synthetic generators",     included: true  },
      { text: "Unlimited custom stressors",      included: true  },
      { text: "Dedicated dataset sources",       included: true  },
      { text: "24/7 dedicated support",          included: true  },
      { text: "Custom SLA",                      included: true  },
      { text: "SSO / SAML integration",          included: true  },
      { text: "Unlimited team members",          included: true  },
    ],
  },
];

const faqs = [
  { q: "Is there a free trial for paid plans?", a: "Yes — Pro and Team plans include a 14-day free trial with no credit card required. You get full access to all features during the trial." },
  { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards (Visa, Mastercard, RuPay), UPI, net banking, and bank transfers for annual plans." },
  { q: "Can I switch plans at any time?", a: "Yes. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately; downgrades take effect at the next billing cycle." },
  { q: "What is mock ML mode?", a: "Mock ML mode runs the full evaluation pipeline without a GPU using PIL-based physics approximations. It's perfect for demos, testing, and development. Real ML mode uses Stable Diffusion XL and Mask R-CNN for production-quality results." },
  { q: "Do you offer student or academic discounts?", a: "Yes — students and academic researchers get 60% off Pro plans. Email us with your institutional email to apply." },
  { q: "What happens to my data?", a: "All model files and generated datasets are stored locally on your machine. We do not upload your model weights to any external server." },
  { q: "Is the API included in all plans?", a: "API access is available on Pro and above. The Starter plan has dashboard-only access." },
  { q: "Can I get a refund?", a: "We offer a 7-day money-back guarantee on all paid plans, no questions asked." },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ background: "#000", minHeight: "100vh", fontFamily: FONT }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
        zIndex: 50, width: "calc(100% - 4rem)", maxWidth: "900px",
        background: "#0a0a0a", border: "2px solid #facc15", borderRadius: "9999px",
        padding: "0 1.5rem", height: "56px", display: "flex", alignItems: "center",
        justifyContent: "space-between", boxShadow: "0 4px 32px rgba(250,204,21,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: "28px", height: "28px", background: "#facc15", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Cpu size={14} color="#000" />
          </div>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: "15px" }}>BlindSpot.AI</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {[["Docs", "/docs"], ["Dashboard", "/evaluations"]].map(([l, p]) => (
            <button key={l} onClick={() => navigate(p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: "14px", fontFamily: FONT, padding: "6px 12px", borderRadius: "9999px", transition: "all 150ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#cbd5e1"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >{l}</button>
          ))}
          <button onClick={() => navigate("/evaluations")} style={{ background: "#facc15", color: "#000", border: "none", borderRadius: "9999px", padding: "7px 18px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: FONT }}>
            Get Started <ArrowRight size={13} style={{ display: "inline", verticalAlign: "middle" }} />
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "120px 2rem 4rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "9999px", background: "#facc15", color: "#000", fontSize: "12px", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.06em", marginBottom: "20px" }}>
            <Rocket size={12} /> SIMPLE, TRANSPARENT PRICING
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: "16px" }}>
            Pay for what you use.<br />
            <span style={{ color: "#facc15" }}>No surprises.</span>
          </h1>
          <p style={{ fontSize: "17px", color: "#cbd5e1", maxWidth: "520px", margin: "0 auto 32px", lineHeight: 1.7 }}>
            All prices in Indian Rupees (₹). Cancel anytime. 14-day free trial on paid plans.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", background: "#0f0f0f", border: "1px solid #2d2d2d", borderRadius: "9999px", padding: "6px 8px" }}>
            <button onClick={() => setAnnual(false)} style={{
              padding: "8px 20px", borderRadius: "9999px", border: "none", cursor: "pointer",
              background: !annual ? "#facc15" : "transparent",
              color: !annual ? "#000" : "#94a3b8",
              fontWeight: 700, fontSize: "14px", fontFamily: FONT, transition: "all 150ms",
            }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{
              padding: "8px 20px", borderRadius: "9999px", border: "none", cursor: "pointer",
              background: annual ? "#facc15" : "transparent",
              color: annual ? "#000" : "#94a3b8",
              fontWeight: 700, fontSize: "14px", fontFamily: FONT, transition: "all 150ms",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              Annual
              <span style={{ background: "#10b981", color: "#000", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "9999px", fontFamily: MONO }}>SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "80px" }}>
          {plans.map(plan => (
            <div key={plan.name} style={{
              background: plan.name === "Pro" ? "#0f0f0f" : "#0a0a0a",
              border: `2px solid ${plan.accent}`,
              borderRadius: "16px", padding: "28px 24px",
              position: "relative",
              boxShadow: plan.name === "Pro" ? `0 0 40px ${plan.accent}22` : "none",
              display: "flex", flexDirection: "column",
            }}>
              {/* Badge */}
              {plan.badge && (
                <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", background: plan.accent, color: "#000", fontSize: "11px", fontWeight: 700, padding: "4px 14px", borderRadius: "9999px", fontFamily: MONO, whiteSpace: "nowrap" }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan header */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", background: plan.accent, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", flexShrink: 0 }}>
                  {plan.icon}
                </div>
                <div>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{plan.name}</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>{plan.tagline}</p>
                </div>
              </div>

              {/* Price */}
              <div style={{ margin: "20px 0 24px" }}>
                {plan.monthly === null ? (
                  <p style={{ fontSize: "28px", fontWeight: 700, color: plan.accent, fontFamily: MONO }}>Custom</p>
                ) : plan.monthly === 0 ? (
                  <div>
                    <p style={{ fontSize: "36px", fontWeight: 700, color: plan.accent, fontFamily: MONO, lineHeight: 1 }}>Free</p>
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Forever</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontSize: "20px", color: plan.accent, fontFamily: MONO, fontWeight: 700 }}>₹</span>
                      <span style={{ fontSize: "40px", fontWeight: 700, color: plan.accent, fontFamily: MONO, lineHeight: 1 }}>
                        {annual ? plan.annual?.toLocaleString("en-IN") : plan.monthly?.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                      per month{annual ? ", billed annually" : ""}
                    </p>
                    {annual && (
                      <p style={{ fontSize: "12px", color: "#10b981", marginTop: "2px", fontFamily: MONO }}>
                        Save ₹{((plan.monthly! - plan.annual!) * 12).toLocaleString("en-IN")}/year
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate("/evaluations")}
                style={{
                  width: "100%", padding: "12px", borderRadius: "9999px",
                  fontWeight: 700, fontSize: "15px", cursor: "pointer",
                  fontFamily: FONT, marginBottom: "24px", transition: "all 150ms",
                  background: plan.ctaVariant === "primary" ? plan.accent : "transparent",
                  color: plan.ctaVariant === "primary" ? "#000" : plan.accent,
                  border: `2px solid ${plan.accent}`,
                }}
                onMouseEnter={e => {
                  if (plan.ctaVariant !== "primary") {
                    (e.currentTarget as HTMLButtonElement).style.background = plan.accent;
                    (e.currentTarget as HTMLButtonElement).style.color = "#000";
                  } else {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                  }
                }}
                onMouseLeave={e => {
                  if (plan.ctaVariant !== "primary") {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = plan.accent;
                  } else {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  }
                }}
              >
                {plan.cta}
              </button>

              {/* Divider */}
              <div style={{ height: "1px", background: "#2d2d2d", marginBottom: "20px" }} />

              {/* Features */}
              <div style={{ flex: 1 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    {f.included
                      ? <CheckCircle size={15} color={plan.accent} style={{ flexShrink: 0 }} />
                      : <X size={15} color="#374151" style={{ flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: "14px", color: f.included ? "#e2e8f0" : "#4b5563" }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div style={{ marginBottom: "80px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: "32px" }}>
            Full Feature Comparison
          </h2>
          <div style={{ background: "#0a0a0a", border: "1px solid #2d2d2d", borderRadius: "16px", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", background: "#0f0f0f", borderBottom: "1px solid #2d2d2d" }}>
              <div style={{ padding: "16px 20px", fontSize: "13px", color: "#94a3b8", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em" }}>Feature</div>
              {["Starter", "Pro", "Team", "Enterprise"].map((p, i) => (
                <div key={p} style={{ padding: "16px 12px", textAlign: "center", fontSize: "14px", fontWeight: 700, color: [plans[0].accent, plans[1].accent, plans[2].accent, plans[3].accent][i] }}>{p}</div>
              ))}
            </div>
            {[
              { feature: "Evaluations / month",    vals: ["5", "Unlimited", "Unlimited", "Unlimited"] },
              { feature: "Dataset types",           vals: ["All 5", "All 5", "All 5", "All 5"] },
              { feature: "Stressors",               vals: ["3", "8", "8", "Custom"] },
              { feature: "Synthetic datasets",      vals: ["✓", "✓", "✓", "✓"] },
              { feature: "Real dataset suggestions",vals: ["✓", "✓", "✓", "✓"] },
              { feature: "PDF / DOCX reports",      vals: ["✓", "✓", "✓", "✓"] },
              { feature: "API access",              vals: ["—", "✓", "✓", "✓"] },
              { feature: "Custom stressors",        vals: ["—", "✓", "✓", "✓"] },
              { feature: "Team members",            vals: ["1", "1", "10", "Unlimited"] },
              { feature: "GPU mode",                vals: ["—", "✓", "✓", "✓"] },
              { feature: "On-premise deployment",   vals: ["—", "—", "—", "✓"] },
              { feature: "SLA / Support",           vals: ["Community", "Email 24h", "Email 4h", "24/7 Dedicated"] },
              { feature: "Price / month",           vals: ["Free", "₹2,499", "₹7,999", "Custom"] },
            ].map((row, i) => (
              <div key={row.feature} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid #1a1a1a", background: i % 2 === 0 ? "transparent" : "#0d0d0d" }}>
                <div style={{ padding: "14px 20px", fontSize: "14px", color: "#cbd5e1" }}>{row.feature}</div>
                {row.vals.map((v, j) => (
                  <div key={j} style={{ padding: "14px 12px", textAlign: "center", fontSize: "13px", fontFamily: MONO, color: v === "—" ? "#374151" : v === "✓" ? [plans[0].accent, plans[1].accent, plans[2].accent, plans[3].accent][j] : "#e2e8f0", fontWeight: v === "✓" ? 700 : 400 }}>{v}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: "720px", margin: "0 auto 80px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: "32px" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: "#0a0a0a", border: "1px solid #2d2d2d", borderRadius: "12px", padding: "20px 24px" }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#facc15", marginBottom: "8px" }}>{faq.q}</p>
                <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.7 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div style={{ background: "#facc15", borderRadius: "16px", padding: "48px 40px", textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#000", marginBottom: "12px" }}>
            Start evaluating your models today
          </h2>
          <p style={{ fontSize: "16px", color: "#000", opacity: 0.7, marginBottom: "28px" }}>
            Free plan available. No credit card required. Results in under 30 seconds.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/evaluations")} style={{ background: "#000", color: "#facc15", border: "none", borderRadius: "9999px", padding: "14px 32px", fontWeight: 700, fontSize: "16px", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: "8px" }}>
              Get Started Free <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate("/docs")} style={{ background: "transparent", color: "#000", border: "2px solid #000", borderRadius: "9999px", padding: "14px 32px", fontWeight: 700, fontSize: "16px", cursor: "pointer", fontFamily: FONT }}>
              Read the Docs
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ borderTop: "2px solid #facc15", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <p style={{ fontFamily: MONO, fontSize: "14px", color: "#94a3b8" }}>
          BlindSpot.AI — AI Robustness Evaluation Platform · HACKOLUTION 2026
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[["Docs", "/docs"], ["Dashboard", "/evaluations"]].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "14px", fontFamily: FONT, transition: "color 150ms" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#facc15"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"}
            >{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
