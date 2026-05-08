<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>BlindSpot.AI — Product Requirements Document</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Grotesk:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
/* ── Reset & Base ─────────────────────────────────────────────── */
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:       #050709;
  --bg2:      #080c10;
  --bg3:      #0d1117;
  --card:     #0a0e14;
  --border:   rgba(255,255,255,0.06);
  --border2:  rgba(255,255,255,0.11);
  --text:     #dde3ec;
  --muted:    #6b7684;
  --dim:      #3d4654;
  --teal:     #00e5a0;
  --indigo:   #6c63ff;
  --amber:    #f59e0b;
  --red:      #f43f5e;
  --blue:     #38bdf8;
  --mono:     'IBM Plex Mono', monospace;
  --display:  'Syne', sans-serif;
  --body:     'Space Grotesk', sans-serif;
}
html{scroll-behavior:smooth}
body{
  background:var(--bg);
  color:var(--text);
  font-family:var(--body);
  font-size:15px;
  line-height:1.75;
  min-height:100vh;
}

/* ── Scrollbar ────────────────────────────────────────────────── */
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(0,229,160,0.2);border-radius:3px}

/* ── Cover Page ───────────────────────────────────────────────── */
.cover{
  min-height:100vh;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  padding:60px;
  position:relative;
  overflow:hidden;
  border-bottom:1px solid var(--border);
}
.cover::before{
  content:'';
  position:absolute;
  inset:0;
  background:
    radial-gradient(ellipse 70% 60% at 80% 20%, rgba(0,229,160,0.05) 0%, transparent 65%),
    radial-gradient(ellipse 50% 40% at 10% 80%, rgba(108,99,255,0.06) 0%, transparent 60%);
  pointer-events:none;
}
.cover-grid{
  position:absolute;
  inset:0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size:60px 60px;
  pointer-events:none;
}
.cover-top{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  position:relative;
  z-index:1;
}
.cover-logo{
  font-family:var(--display);
  font-size:18px;
  font-weight:800;
  letter-spacing:-0.02em;
}
.cover-logo span{color:var(--teal)}
.cover-meta{
  font-family:var(--mono);
  font-size:11px;
  color:var(--muted);
  text-align:right;
  line-height:2;
}
.cover-main{
  position:relative;
  z-index:1;
}
.cover-eyebrow{
  font-family:var(--mono);
  font-size:11px;
  color:var(--teal);
  letter-spacing:0.15em;
  text-transform:uppercase;
  margin-bottom:28px;
  display:flex;
  align-items:center;
  gap:12px;
}
.cover-eyebrow::before{
  content:'';
  display:block;
  width:32px;height:1px;
  background:var(--teal);
}
.cover-title{
  font-family:var(--display);
  font-size:clamp(52px,7vw,88px);
  font-weight:800;
  letter-spacing:-0.04em;
  line-height:1.0;
  margin-bottom:8px;
}
.cover-title .accent{color:var(--teal)}
.cover-subtitle{
  font-family:var(--display);
  font-size:clamp(20px,3vw,32px);
  font-weight:400;
  color:var(--muted);
  letter-spacing:-0.02em;
  margin-bottom:40px;
}
.cover-desc{
  max-width:600px;
  color:var(--muted);
  font-size:16px;
  line-height:1.7;
  margin-bottom:48px;
}
.cover-pills{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}
.pill{
  font-family:var(--mono);
  font-size:11px;
  padding:5px 14px;
  border-radius:20px;
  border:1px solid;
}
.pill-teal{border-color:rgba(0,229,160,0.3);color:var(--teal);background:rgba(0,229,160,0.05)}
.pill-indigo{border-color:rgba(108,99,255,0.3);color:#a5a0ff;background:rgba(108,99,255,0.05)}
.pill-amber{border-color:rgba(245,158,11,0.3);color:var(--amber);background:rgba(245,158,11,0.05)}
.pill-red{border-color:rgba(244,63,94,0.3);color:#fb7185;background:rgba(244,63,94,0.05)}
.pill-blue{border-color:rgba(56,189,248,0.3);color:var(--blue);background:rgba(56,189,248,0.05)}
.cover-bottom{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  position:relative;
  z-index:1;
}
.cover-version{
  font-family:var(--mono);
  font-size:11px;
  color:var(--dim);
}
.cover-team{
  text-align:right;
  font-family:var(--mono);
  font-size:11px;
  color:var(--dim);
  line-height:1.8;
}

/* ── Layout ───────────────────────────────────────────────────── */
.layout{
  display:grid;
  grid-template-columns:260px 1fr;
  min-height:100vh;
}
.sidebar{
  position:sticky;
  top:0;
  height:100vh;
  overflow-y:auto;
  background:var(--bg2);
  border-right:1px solid var(--border);
  padding:32px 0;
  scrollbar-width:none;
}
.sidebar::-webkit-scrollbar{display:none}
.sidebar-header{
  padding:0 24px 24px;
  border-bottom:1px solid var(--border);
  margin-bottom:16px;
}
.sidebar-logo{
  font-family:var(--display);
  font-size:15px;
  font-weight:800;
  letter-spacing:-0.02em;
}
.sidebar-logo span{color:var(--teal)}
.sidebar-doc{
  font-family:var(--mono);
  font-size:10px;
  color:var(--muted);
  margin-top:4px;
  letter-spacing:0.08em;
}
.nav-section{
  padding:8px 24px 4px;
  font-family:var(--mono);
  font-size:9px;
  color:var(--dim);
  letter-spacing:0.15em;
  text-transform:uppercase;
  margin-top:12px;
}
.nav-link{
  display:flex;
  align-items:center;
  gap:8px;
  padding:7px 24px;
  font-size:13px;
  color:var(--muted);
  text-decoration:none;
  transition:color 0.15s, background 0.15s;
  border-left:2px solid transparent;
  line-height:1.3;
}
.nav-link:hover{color:var(--text);background:rgba(255,255,255,0.03)}
.nav-link.active{color:var(--teal);border-left-color:var(--teal);background:rgba(0,229,160,0.04)}
.nav-num{
  font-family:var(--mono);
  font-size:10px;
  color:var(--dim);
  min-width:22px;
}

/* ── Main Content ─────────────────────────────────────────────── */
.main{
  padding:0;
  overflow:hidden;
}
.section{
  padding:72px 64px;
  border-bottom:1px solid var(--border);
  position:relative;
}
.section:last-child{border-bottom:none}
.section-inner{max-width:800px}

/* ── Section Headers ──────────────────────────────────────────── */
.section-label{
  font-family:var(--mono);
  font-size:10px;
  color:var(--teal);
  letter-spacing:0.15em;
  text-transform:uppercase;
  margin-bottom:8px;
  display:flex;
  align-items:center;
  gap:10px;
}
.section-label::after{
  content:'';
  flex:1;
  height:1px;
  background:rgba(0,229,160,0.15);
  max-width:60px;
}
h2{
  font-family:var(--display);
  font-size:32px;
  font-weight:800;
  letter-spacing:-0.03em;
  line-height:1.1;
  margin-bottom:8px;
}
h3{
  font-family:var(--display);
  font-size:18px;
  font-weight:700;
  letter-spacing:-0.02em;
  margin:36px 0 12px;
  color:var(--text);
}
h4{
  font-family:var(--body);
  font-size:14px;
  font-weight:600;
  margin:24px 0 8px;
  color:var(--text);
}
p{color:var(--muted);margin-bottom:14px;line-height:1.75}
p strong{color:var(--text);font-weight:500}
p em{color:var(--teal);font-style:normal}

/* ── Cards ────────────────────────────────────────────────────── */
.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:10px;
  padding:20px 22px;
  margin-bottom:12px;
}
.card-title{
  font-family:var(--display);
  font-size:14px;
  font-weight:700;
  margin-bottom:6px;
  display:flex;
  align-items:center;
  gap:8px;
}
.card p{margin-bottom:0;font-size:13px}
.dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.dot-teal{background:var(--teal)}
.dot-indigo{background:var(--indigo)}
.dot-amber{background:var(--amber)}
.dot-red{background:var(--red)}
.dot-blue{background:var(--blue)}
.dot-gray{background:var(--dim)}

/* ── Grid Layouts ─────────────────────────────────────────────── */
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0}

/* ── Tables ───────────────────────────────────────────────────── */
.tbl{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}
.tbl th{
  font-family:var(--mono);
  font-size:10px;
  text-transform:uppercase;
  letter-spacing:0.1em;
  color:var(--muted);
  padding:10px 14px;
  text-align:left;
  border-bottom:1px solid var(--border2);
  background:rgba(255,255,255,0.015);
}
.tbl td{
  padding:11px 14px;
  border-bottom:1px solid var(--border);
  color:var(--muted);
  vertical-align:top;
  line-height:1.5;
}
.tbl td:first-child{color:var(--text);font-weight:500}
.tbl tr:hover td{background:rgba(255,255,255,0.018)}
.tbl-code{font-family:var(--mono);font-size:11px;color:var(--teal)}

/* ── Priority / Status Badges ─────────────────────────────────── */
.badge{
  display:inline-flex;
  align-items:center;
  gap:5px;
  padding:2px 10px;
  border-radius:20px;
  font-family:var(--mono);
  font-size:10px;
  border:1px solid;
  white-space:nowrap;
}
.badge-p0{border-color:rgba(244,63,94,0.35);color:#fb7185;background:rgba(244,63,94,0.07)}
.badge-p1{border-color:rgba(245,158,11,0.35);color:var(--amber);background:rgba(245,158,11,0.07)}
.badge-p2{border-color:rgba(56,189,248,0.35);color:var(--blue);background:rgba(56,189,248,0.07)}
.badge-done{border-color:rgba(0,229,160,0.35);color:var(--teal);background:rgba(0,229,160,0.07)}
.badge-wip{border-color:rgba(108,99,255,0.35);color:#a5a0ff;background:rgba(108,99,255,0.07)}
.badge-future{border-color:rgba(255,255,255,0.12);color:var(--dim);background:rgba(255,255,255,0.03)}
.badge-mvp{border-color:rgba(0,229,160,0.4);color:var(--teal);background:rgba(0,229,160,0.08);font-weight:600}

/* ── Code Blocks ──────────────────────────────────────────────── */
.code{
  background:var(--bg3);
  border:1px solid var(--border);
  border-radius:8px;
  padding:18px 20px;
  font-family:var(--mono);
  font-size:12px;
  line-height:1.8;
  overflow-x:auto;
  margin:14px 0;
  color:#9db4cc;
}
.kw{color:#7dd3fc}
.str{color:#86efac}
.cmt{color:#3d4654}
.fn{color:var(--teal)}
.num{color:var(--amber)}

/* ── Pipeline / Flow Diagrams ─────────────────────────────────── */
.pipeline{
  display:flex;
  align-items:center;
  gap:0;
  margin:24px 0;
  flex-wrap:wrap;
}
.pipe-node{
  background:var(--card);
  border:1px solid var(--border2);
  border-radius:8px;
  padding:10px 16px;
  font-family:var(--mono);
  font-size:11px;
  color:var(--text);
  white-space:nowrap;
  flex-shrink:0;
}
.pipe-node.active{border-color:rgba(0,229,160,0.4);color:var(--teal);background:rgba(0,229,160,0.05)}
.pipe-node.amber{border-color:rgba(245,158,11,0.4);color:var(--amber);background:rgba(245,158,11,0.05)}
.pipe-node.indigo{border-color:rgba(108,99,255,0.4);color:#a5a0ff;background:rgba(108,99,255,0.05)}
.pipe-arrow{
  color:var(--dim);
  padding:0 6px;
  font-size:14px;
  flex-shrink:0;
}

/* ── Callout Boxes ────────────────────────────────────────────── */
.callout{
  border-radius:8px;
  padding:16px 20px;
  margin:18px 0;
  border-left:3px solid;
  font-size:13.5px;
}
.callout-teal{border-color:var(--teal);background:rgba(0,229,160,0.04);color:var(--text)}
.callout-amber{border-color:var(--amber);background:rgba(245,158,11,0.04);color:var(--text)}
.callout-red{border-color:var(--red);background:rgba(244,63,94,0.04);color:var(--text)}
.callout-indigo{border-color:var(--indigo);background:rgba(108,99,255,0.04);color:var(--text)}
.callout strong{font-weight:600;display:block;margin-bottom:4px}

/* ── Metric Cards ─────────────────────────────────────────────── */
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
.metric{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:10px;
  padding:20px;
  text-align:center;
}
.metric-val{
  font-family:var(--display);
  font-size:28px;
  font-weight:800;
  letter-spacing:-0.03em;
  margin-bottom:4px;
}
.metric-lbl{
  font-family:var(--mono);
  font-size:10px;
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:0.08em;
}

/* ── Numbered List ────────────────────────────────────────────── */
.num-list{list-style:none;margin:16px 0}
.num-list li{
  display:flex;
  gap:16px;
  margin-bottom:18px;
  align-items:flex-start;
}
.num-list .num-badge{
  font-family:var(--mono);
  font-size:11px;
  color:var(--teal);
  background:rgba(0,229,160,0.07);
  border:1px solid rgba(0,229,160,0.2);
  border-radius:5px;
  padding:3px 8px;
  flex-shrink:0;
  margin-top:2px;
}
.num-list .num-content h4{margin:0 0 4px;font-size:14px}
.num-list .num-content p{margin:0;font-size:13px}

/* ── Roadmap ──────────────────────────────────────────────────── */
.roadmap-phase{
  border:1px solid var(--border);
  border-radius:10px;
  margin-bottom:16px;
  overflow:hidden;
}
.roadmap-header{
  background:rgba(255,255,255,0.02);
  padding:14px 20px;
  display:flex;
  align-items:center;
  gap:12px;
  border-bottom:1px solid var(--border);
}
.roadmap-phase-name{
  font-family:var(--display);
  font-size:15px;
  font-weight:700;
  flex:1;
}
.roadmap-body{padding:16px 20px}
.roadmap-body ul{list-style:none;padding:0}
.roadmap-body li{
  display:flex;
  align-items:flex-start;
  gap:10px;
  padding:8px 0;
  border-bottom:1px solid var(--border);
  font-size:13px;
  color:var(--muted);
}
.roadmap-body li:last-child{border-bottom:none}
.roadmap-body li::before{
  content:'›';
  color:var(--teal);
  font-size:16px;
  line-height:1.3;
  flex-shrink:0;
}

/* ── Risk Matrix ──────────────────────────────────────────────── */
.risk-row{
  display:grid;
  grid-template-columns:180px 80px 80px 1fr;
  gap:12px;
  padding:12px 0;
  border-bottom:1px solid var(--border);
  font-size:13px;
  align-items:start;
}
.risk-header{
  font-family:var(--mono);
  font-size:10px;
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:0.08em;
  margin-bottom:8px;
}
.risk-impact{
  font-family:var(--mono);
  font-size:11px;
  padding:2px 8px;
  border-radius:4px;
  text-align:center;
}
.impact-high{background:rgba(244,63,94,0.15);color:#fb7185}
.impact-med{background:rgba(245,158,11,0.15);color:var(--amber)}
.impact-low{background:rgba(0,229,160,0.12);color:var(--teal)}

/* ── Architecture Box ─────────────────────────────────────────── */
.arch-layer{
  background:var(--bg3);
  border:1px solid var(--border);
  border-radius:8px;
  padding:14px 18px;
  margin-bottom:8px;
  display:flex;
  align-items:center;
  gap:14px;
}
.arch-layer-label{
  font-family:var(--mono);
  font-size:10px;
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:0.1em;
  min-width:100px;
}
.arch-layer-items{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.arch-chip{
  font-family:var(--mono);
  font-size:11px;
  padding:4px 10px;
  border-radius:5px;
  border:1px solid;
}

/* ── User Story Table ─────────────────────────────────────────── */
.story-id{
  font-family:var(--mono);
  font-size:11px;
  color:var(--teal);
  white-space:nowrap;
}

/* ── Divider ──────────────────────────────────────────────────── */
hr{border:none;border-top:1px solid var(--border);margin:28px 0}
.hr-teal{border-color:rgba(0,229,160,0.2)}

/* ── TOC Page ─────────────────────────────────────────────────── */
.toc-section{margin-bottom:24px}
.toc-section-title{
  font-family:var(--mono);
  font-size:10px;
  color:var(--teal);
  text-transform:uppercase;
  letter-spacing:0.15em;
  margin-bottom:8px;
  padding-bottom:6px;
  border-bottom:1px solid rgba(0,229,160,0.12);
}
.toc-item{
  display:flex;
  justify-content:space-between;
  padding:5px 0;
  font-size:14px;
  color:var(--muted);
  border-bottom:1px dashed var(--border);
  text-decoration:none;
  transition:color 0.15s;
}
.toc-item:hover{color:var(--text)}
.toc-item-num{
  font-family:var(--mono);
  font-size:11px;
  color:var(--dim);
}
.toc-sub{padding-left:16px;font-size:13px;border-bottom:1px dashed rgba(255,255,255,0.03)}

/* ── Print / Page marks ───────────────────────────────────────── */
.page-tag{
  font-family:var(--mono);
  font-size:10px;
  color:var(--dim);
  margin-bottom:48px;
  display:flex;
  align-items:center;
  gap:10px;
}
.page-tag::before{content:'';display:block;width:20px;height:1px;background:var(--dim)}

@media print{
  body{background:#fff;color:#000}
  .sidebar{display:none}
  .layout{grid-template-columns:1fr}
  .section{padding:40px 0}
}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════ COVER PAGE -->
<div class="cover">
  <div class="cover-grid"></div>

  <div class="cover-top">
    <div class="cover-logo">Blind<span>Spot</span>.AI</div>
    <div class="cover-meta">
      DOCUMENT TYPE: PRD<br>
      VERSION: 1.0.0<br>
      STATUS: DRAFT<br>
      CLASSIFICATION: INTERNAL
    </div>
  </div>

  <div class="cover-main">
    <div class="cover-eyebrow">Product Requirements Document</div>
    <div class="cover-title">BLIND<span class="accent">SPOT</span><br>.AI</div>
    <div class="cover-subtitle">AxiomSynth Synthetic Data Platform</div>
    <p class="cover-desc">
      A complete product specification for the BlindSpot.AI industrial-grade synthetic data generation ecosystem — covering problem definition, product vision, system architecture, feature requirements, API contracts, success metrics, risks, and phased roadmap.
    </p>
    <div class="cover-pills">
      <span class="pill pill-teal">Synthetic Data</span>
      <span class="pill pill-indigo">Adversarial ML</span>
      <span class="pill pill-amber">Physics Simulation</span>
      <span class="pill pill-red">B2B SaaS</span>
      <span class="pill pill-blue">Computer Vision</span>
    </div>
  </div>

  <div class="cover-bottom">
    <div class="cover-version">
      PRD v1.0 · April 2026<br>
      Last Updated: 15 Apr 2026
    </div>
    <div class="cover-team">
      Camp Nou Coders<br>
      Chayan Mal (Team Lead)<br>
      Netaji Subhash Engineering College, Kolkata<br>
      HACKTONIX 2026
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════ MAIN LAYOUT -->
<div class="layout">

<!-- ── SIDEBAR NAV ────────────────────────────────────────────── -->
<nav class="sidebar">
  <div class="sidebar-header">
    <div class="sidebar-logo">Blind<span>Spot</span>.AI</div>
    <div class="sidebar-doc">PRD · v1.0</div>
  </div>

  <div class="nav-section">Document</div>
  <a href="#toc" class="nav-link"><span class="nav-num">00</span>Table of Contents</a>

  <div class="nav-section">Product</div>
  <a href="#overview" class="nav-link"><span class="nav-num">01</span>Executive Summary</a>
  <a href="#problem" class="nav-link"><span class="nav-num">02</span>Problem Statement</a>
  <a href="#vision" class="nav-link"><span class="nav-num">03</span>Product Vision</a>
  <a href="#users" class="nav-link"><span class="nav-num">04</span>Users & Personas</a>

  <div class="nav-section">Requirements</div>
  <a href="#features" class="nav-link"><span class="nav-num">05</span>Feature Requirements</a>
  <a href="#stories" class="nav-link"><span class="nav-num">06</span>User Stories</a>
  <a href="#functional" class="nav-link"><span class="nav-num">07</span>Functional Specs</a>
  <a href="#nonfunctional" class="nav-link"><span class="nav-num">08</span>Non-Functional Reqs</a>

  <div class="nav-section">Architecture</div>
  <a href="#architecture" class="nav-link"><span class="nav-num">09</span>System Architecture</a>
  <a href="#api" class="nav-link"><span class="nav-num">10</span>API Contract</a>
  <a href="#data" class="nav-link"><span class="nav-num">11</span>Data Models</a>
  <a href="#ml" class="nav-link"><span class="nav-num">12</span>ML Pipeline Spec</a>

  <div class="nav-section">Delivery</div>
  <a href="#metrics" class="nav-link"><span class="nav-num">13</span>Success Metrics</a>
  <a href="#roadmap" class="nav-link"><span class="nav-num">14</span>Roadmap</a>
  <a href="#risks" class="nav-link"><span class="nav-num">15</span>Risks & Mitigation</a>
  <a href="#gtm" class="nav-link"><span class="nav-num">16</span>Go-To-Market</a>
  <a href="#appendix" class="nav-link"><span class="nav-num">17</span>Appendix</a>
</nav>

<!-- ── MAIN CONTENT ────────────────────────────────────────────── -->
<main class="main">

<!-- 00 · TABLE OF CONTENTS -->
<section id="toc" class="section">
  <div class="section-inner">
    <div class="section-label">00</div>
    <h2>Table of Contents</h2>
    <p>Complete index of all sections in this Product Requirements Document.</p>
    <hr>

    <div class="toc-section">
      <div class="toc-section-title">Product</div>
      <a href="#overview" class="toc-item">01 · Executive Summary <span class="toc-item-num">§1</span></a>
      <a href="#problem" class="toc-item">02 · Problem Statement <span class="toc-item-num">§2</span></a>
      <a href="#vision" class="toc-item toc-sub">  ↳ Product Vision & Goals <span class="toc-item-num">§3</span></a>
      <a href="#users" class="toc-item">04 · Target Users & Personas <span class="toc-item-num">§4</span></a>
    </div>

    <div class="toc-section">
      <div class="toc-section-title">Requirements</div>
      <a href="#features" class="toc-item">05 · Feature Requirements (MoSCoW) <span class="toc-item-num">§5</span></a>
      <a href="#stories" class="toc-item">06 · User Stories <span class="toc-item-num">§6</span></a>
      <a href="#functional" class="toc-item">07 · Functional Specifications <span class="toc-item-num">§7</span></a>
      <a href="#nonfunctional" class="toc-item">08 · Non-Functional Requirements <span class="toc-item-num">§8</span></a>
    </div>

    <div class="toc-section">
      <div class="toc-section-title">Architecture & Technical</div>
      <a href="#architecture" class="toc-item">09 · System Architecture <span class="toc-item-num">§9</span></a>
      <a href="#api" class="toc-item">10 · API Contract <span class="toc-item-num">§10</span></a>
      <a href="#data" class="toc-item">11 · Data Models <span class="toc-item-num">§11</span></a>
      <a href="#ml" class="toc-item">12 · ML Pipeline Specification <span class="toc-item-num">§12</span></a>
    </div>

    <div class="toc-section">
      <div class="toc-section-title">Delivery</div>
      <a href="#metrics" class="toc-item">13 · Success Metrics & KPIs <span class="toc-item-num">§13</span></a>
      <a href="#roadmap" class="toc-item">14 · Product Roadmap <span class="toc-item-num">§14</span></a>
      <a href="#risks" class="toc-item">15 · Risk Register & Mitigation <span class="toc-item-num">§15</span></a>
      <a href="#gtm" class="toc-item">16 · Go-To-Market Strategy <span class="toc-item-num">§16</span></a>
      <a href="#appendix" class="toc-item">17 · Appendix & Glossary <span class="toc-item-num">§17</span></a>
    </div>
  </div>
</section>

<!-- 01 · EXECUTIVE SUMMARY -->
<section id="overview" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 01</div>
    <div class="section-label">01</div>
    <h2>Executive Summary</h2>
    <p>BlindSpot.AI is an <strong>industrial-grade synthetic data generation platform</strong> built to solve the critical "Edge-Case Crisis" afflicting modern AI systems. It enables any AI team — from a two-person startup to an enterprise robotics division — to generate physically accurate, adversarially targeted, fully labeled synthetic training datasets from as few as five seed images, in under 24 hours, at a fraction of the cost of real-world data collection.</p>

    <div class="callout callout-teal">
      <strong>Core Value Proposition</strong>
      BlindSpot.AI eliminates the multi-million dollar "Data Moat" by generating the exact training data points an AI model struggles with — without staging dangerous real-world events, without privacy violations, and without months of manual labeling.
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-val" style="color:var(--teal)">$47M</div>
        <div class="metric-lbl">Avg cost of mission-critical training data</div>
      </div>
      <div class="metric">
        <div class="metric-val" style="color:var(--blue)">18mo</div>
        <div class="metric-lbl">Typical data collection cycle</div>
      </div>
      <div class="metric">
        <div class="metric-val" style="color:var(--amber)">&lt;24hr</div>
        <div class="metric-lbl">BlindSpot.AI generation cycle</div>
      </div>
      <div class="metric">
        <div class="metric-val" style="color:var(--red)">$3.5B</div>
        <div class="metric-lbl">Synthetic data market by 2030</div>
      </div>
    </div>

    <h3>Document Purpose</h3>
    <p>This PRD defines the complete product requirements for BlindSpot.AI v1.0, including the AxiomSynth core engine, the web dashboard, all REST API endpoints, the ML pipeline specification, and the phased delivery roadmap. It is the authoritative reference document for all engineering, design, and product decisions.</p>

    <h3>Scope</h3>
    <div class="grid2">
      <div class="card">
        <div class="card-title"><span class="dot dot-teal"></span>In Scope (v1.0)</div>
        <p>Web dashboard, REST API, LoRA trainer, adversarial agent, image generative engine, PIL physics layer, Mask R-CNN auto-labeler, COCO/YOLO export, Docker deployment.</p>
      </div>
      <div class="card">
        <div class="card-title"><span class="dot dot-gray"></span>Out of Scope (v1.0)</div>
        <p>LLM adversarial text generation, Blender real-time physics, multi-user teams/roles, billing system, mobile app, custom model training support beyond SDXL.</p>
      </div>
    </div>
  </div>
</section>

<!-- 02 · PROBLEM STATEMENT -->
<section id="problem" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 02</div>
    <div class="section-label">02</div>
    <h2>Problem Statement</h2>

    <h3>The Edge-Case Crisis</h3>
    <p>Modern AI systems — perception models in autonomous vehicles, diagnostic AIs in healthcare, anomaly detectors in industrial QA — are trained on curated, "clean" datasets. They achieve high benchmark accuracy in controlled lab conditions but <strong>fail catastrophically in the real world</strong> when confronted with rare, dangerous, or statistically unusual scenarios.</p>

    <div class="callout callout-red">
      <strong>The Root Cause</strong>
      Real-world edge cases are statistically rare by definition. A model trained on 100,000 standard-condition images may encounter a foggy night-time occluded scene only 12 times. 12 examples is not enough to generalize.
    </div>

    <h3>The Data Moat</h3>
    <p>The only current solution is to collect real-world edge-case data — which means physically staging dangerous scenarios. Waymo drives millions of miles. Tesla runs hardware crash tests. Medical AI teams wait years for rare pathology cases. This creates a <strong>structural competitive moat</strong> accessible only to well-funded organizations.</p>

    <div class="grid3">
      <div class="card">
        <div class="card-title"><span class="dot dot-red"></span>The Cost Problem</div>
        <p>Staging a single autonomous vehicle failure scenario costs $50,000–$500,000. Rare medical imaging data requires IRB approvals, patient consent, and years of collection.</p>
      </div>
      <div class="card">
        <div class="card-title"><span class="dot dot-amber"></span>The Privacy Problem</div>
        <p>Real-world data collection in healthcare, surveillance, and finance violates HIPAA, GDPR, and other regulations. Synthetic data sidesteps all compliance barriers.</p>
      </div>
      <div class="card">
        <div class="card-title"><span class="dot dot-indigo"></span>The Time Problem</div>
        <p>Even with budget, collecting, labeling, and validating 50,000 edge-case images takes 12–18 months. AI development cycles are 3–6 months. The math doesn't work.</p>
      </div>
    </div>

    <h3>Who Is Suffering</h3>
    <table class="tbl">
      <thead><tr><th>Industry</th><th>Edge Case</th><th>Current Solution</th><th>Cost</th></tr></thead>
      <tbody>
        <tr><td>Autonomous Vehicles</td><td>Flooded road at night, 80% occluded pedestrian</td><td>Fleet driving, crash testing</td><td>$M+</td></tr>
        <tr><td>Medical Imaging AI</td><td>Rare Stage-1 pathology, sensor artifact overlap</td><td>Wait for patients, IRB process</td><td>Years</td></tr>
        <tr><td>Drone Inspection</td><td>80% occluded corrosion, lens flare on metal</td><td>Manual inspection, staged setups</td><td>$100K+</td></tr>
        <tr><td>Defense / Robotics</td><td>Camouflaged target in fog, motion blur</td><td>Classified simulation facilities</td><td>Inaccessible</td></tr>
        <tr><td>Industrial QA</td><td>Defect under poor lighting, partial occlusion</td><td>Manual defect creation</td><td>$50K+</td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- 03 · VISION -->
<section id="vision" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 03</div>
    <div class="section-label">03</div>
    <h2>Product Vision & Goals</h2>

    <div class="callout callout-indigo">
      <strong>Vision Statement</strong>
      "To make real-world AI safety accessible to every team on Earth — not just the ones with a billion-dollar data budget."
    </div>

    <h3>Strategic Goals</h3>
    <ul class="num-list">
      <li>
        <span class="num-badge">G-01</span>
        <div class="num-content">
          <h4>Democratize Edge-Case Data</h4>
          <p>Any team with 5 seed images and an internet connection should be able to generate a production-quality labeled dataset within 24 hours for under $50.</p>
        </div>
      </li>
      <li>
        <span class="num-badge">G-02</span>
        <div class="num-content">
          <h4>Physics-First Synthetic Quality</h4>
          <p>Generated images must be statistically indistinguishable from real sensor data — validated by FID score below 30 against a real-world validation set.</p>
        </div>
      </li>
      <li>
        <span class="num-badge">G-03</span>
        <div class="num-content">
          <h4>Zero Human Labeling Effort</h4>
          <p>Every generated image must ship with auto-generated COCO JSON annotations and YOLO labels requiring zero manual correction for standard use cases.</p>
        </div>
      </li>
      <li>
        <span class="num-badge">G-04</span>
        <div class="num-content">
          <h4>Adversarial Precision</h4>
          <p>Data generation must target the model's actual mathematical weaknesses — not generic augmentation. The adversarial scan → generate loop must measurably improve client model accuracy.</p>
        </div>
      </li>
    </ul>

    <h3>Design Principles</h3>
    <div class="grid2">
      <div class="card"><div class="card-title"><span class="dot dot-teal"></span>Physics Before Prompts</div><p>Every generated image is grounded in physical laws. A prompt is a starting point; the physics layer is the validation step.</p></div>
      <div class="card"><div class="card-title"><span class="dot dot-blue"></span>Adversarial by Default</div><p>The system always probes before generating. Random augmentation is a last resort, not the default behavior.</p></div>
      <div class="card"><div class="card-title"><span class="dot dot-amber"></span>API-First Architecture</div><p>Every action available in the UI is available via API. The platform is as useful to a Python script as it is to a product manager.</p></div>
      <div class="card"><div class="card-title"><span class="dot dot-indigo"></span>Async Everything</div><p>No ML pipeline operation ever blocks the API response. All long-running tasks are queued, tracked, and resumable.</p></div>
    </div>
  </div>
</section>

<!-- 04 · USERS -->
<section id="users" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 04</div>
    <div class="section-label">04</div>
    <h2>Target Users & Personas</h2>

    <div class="card" style="border-color:rgba(0,229,160,0.2);margin-bottom:16px">
      <div class="card-title" style="font-size:16px"><span class="dot dot-teal"></span>Persona 1 — The ML Engineer</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
        <div>
          <p style="font-size:12px;color:var(--dim);font-family:var(--mono);margin-bottom:4px">PROFILE</p>
          <p>Mid-level ML engineer at an autonomous systems startup. Has a YOLOv8 model that works in daylight but fails in rain. Needs 5,000 labeled rainy images. Has never used synthetic data before. Uses Python daily, comfortable with REST APIs.</p>
        </div>
        <div>
          <p style="font-size:12px;color:var(--dim);font-family:var(--mono);margin-bottom:4px">GOALS & PAIN POINTS</p>
          <p><strong>Goal:</strong> Improve model mAP from 0.71 to 0.85 in adverse weather. <strong>Pain:</strong> No budget to drive a fleet through storms. Manager wants results in 2 weeks. Manual labeling takes 8 weeks and $12K.</p>
        </div>
      </div>
    </div>

    <div class="card" style="border-color:rgba(56,189,248,0.2);margin-bottom:16px">
      <div class="card-title" style="font-size:16px"><span class="dot dot-blue"></span>Persona 2 — The Research Scientist</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
        <div>
          <p style="font-size:12px;color:var(--dim);font-family:var(--mono);margin-bottom:4px">PROFILE</p>
          <p>PhD researcher at a medical AI lab. Building a diagnostic model for a rare bone condition that affects 1 in 50,000 patients. Has 12 real X-ray samples. Needs to demonstrate generalization for publication.</p>
        </div>
        <div>
          <p style="font-size:12px;color:var(--dim);font-family:var(--mono);margin-bottom:4px">GOALS & PAIN POINTS</p>
          <p><strong>Goal:</strong> Generate 2,000 synthetic variants of rare pathology cases. <strong>Pain:</strong> IRB approval takes 18 months. Patient data is locked behind HIPAA. Synthetic data sidesteps both barriers legally and ethically.</p>
        </div>
      </div>
    </div>

    <div class="card" style="border-color:rgba(245,158,11,0.2);margin-bottom:16px">
      <div class="card-title" style="font-size:16px"><span class="dot dot-amber"></span>Persona 3 — The AI Product Lead</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
        <div>
          <p style="font-size:12px;color:var(--dim);font-family:var(--mono);margin-bottom:4px">PROFILE</p>
          <p>Product manager at a Series A drone inspection company. Non-technical but understands AI. Manages a 3-person ML team. Responsible for ensuring their model passes safety certifications before Q3 product launch.</p>
        </div>
        <div>
          <p style="font-size:12px;color:var(--dim);font-family:var(--mono);margin-bottom:4px">GOALS & PAIN POINTS</p>
          <p><strong>Goal:</strong> Ship a safety-certified model on time. <strong>Pain:</strong> ML team says they need more edge-case data but can't explain how to get it. BlindSpot.AI needs to be usable by a non-ML person through the dashboard.</p>
        </div>
      </div>
    </div>

    <h3>User Segments by Tier</h3>
    <table class="tbl">
      <thead><tr><th>Segment</th><th>Primary User</th><th>Volume Needs</th><th>Key Feature</th><th>Pricing Tier</th></tr></thead>
      <tbody>
        <tr><td>Indie / Research</td><td>Solo researcher, student</td><td>&lt;500 img/mo</td><td>Free tier, COCO export</td><td>Prototype (Free)</td></tr>
        <tr><td>Startup / SMB</td><td>ML Engineer, CTO</td><td>1K–10K img/mo</td><td>Adversarial scan, all stressors</td><td>Studio ($299/mo)</td></tr>
        <tr><td>Enterprise</td><td>Director of AI, VP Eng</td><td>Unlimited</td><td>Air-gapped, SLA, Blender physics</td><td>Enterprise (Custom)</td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- 05 · FEATURES -->
<section id="features" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 05</div>
    <div class="section-label">05</div>
    <h2>Feature Requirements — MoSCoW</h2>

    <h3>Must Have (v1.0 MVP)</h3>
    <table class="tbl">
      <thead><tr><th>ID</th><th>Feature</th><th>Description</th><th>Priority</th></tr></thead>
      <tbody>
        <tr><td class="tbl-code">F-001</td><td>Project Management</td><td>Create, list, update, delete projects. Each project is an isolated workspace with its own seed images, weights, and dataset output.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-002</td><td>Seed Image Upload</td><td>Upload 1–10 seed images per project via drag-and-drop UI or multipart API. Images stored in MinIO. Thumbnails served via presigned URLs.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-003</td><td>LoRA Fine-Tuning</td><td>Automatically fine-tune SDXL LoRA adapter on uploaded seed images. Run as async Celery task. Support mock mode for non-GPU environments.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-004</td><td>Adversarial Vulnerability Scan</td><td>Probe user's model endpoint with 8 stressor types. Return vulnerability_vector with confidence scores. Support both real endpoint and mock simulation.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-005</td><td>Synthetic Image Generation</td><td>Run SDXL + LoRA + ControlNet to generate N images per identified blind spot. Auto-construct prompts from vulnerability_vector.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-006</td><td>Physics Stressor Layer</td><td>Apply physically accurate environmental stressors (rain, fog, night, flare, occlusion, motion blur) via PIL/NumPy pipeline. Blender support optional.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-007</td><td>Auto-Labeling Pipeline</td><td>Run Mask R-CNN inference on generated images. Output COCO JSON annotations and YOLO .txt labels. Confidence threshold configurable (default 0.50).</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-008</td><td>Dataset Export</td><td>Package all images, COCO JSON, YOLO labels, and dataset.yaml into a ZIP. Upload to MinIO. Serve via 7-day presigned download URL.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-009</td><td>Real-Time Progress Polling</td><td>Every pipeline stage reports progress (0–100%) and stage name to DB. Frontend polls /status every 3 seconds. No WebSocket required for v1.0.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
        <tr><td class="tbl-code">F-010</td><td>Web Dashboard</td><td>React + TypeScript dashboard with Projects list, 4-tab project detail view (Seeds, Vulnerability Map, Generation, Dataset), dark theme, Recharts bar chart for vulnerability visualization.</td><td><span class="badge badge-p0">P0 · Must</span></td></tr>
      </tbody>
    </table>

    <h3>Should Have (v1.1)</h3>
    <table class="tbl">
      <thead><tr><th>ID</th><th>Feature</th><th>Description</th><th>Priority</th></tr></thead>
      <tbody>
        <tr><td class="tbl-code">F-011</td><td>Blender Physics Integration</td><td>Full Blender Python API integration for volumetric fog, particle rain systems, and PBR lens flare. Activated via USE_BLENDER=true.</td><td><span class="badge badge-p1">P1 · Should</span></td></tr>
        <tr><td class="tbl-code">F-012</td><td>FID Score Validation</td><td>After physics layer, compute Fréchet Inception Distance between generated set and seed images. Fail/warn if FID > 50.</td><td><span class="badge badge-p1">P1 · Should</span></td></tr>
        <tr><td class="tbl-code">F-013</td><td>Stressor Preview</td><td>Dashboard shows before/after image preview for each stressor type before committing to full generation run.</td><td><span class="badge badge-p1">P1 · Should</span></td></tr>
        <tr><td class="tbl-code">F-014</td><td>API Key Authentication</td><td>Generate per-project API keys. All API endpoints require Bearer token. Rate limiting per key (100 req/min standard, 10 req/min free).</td><td><span class="badge badge-p1">P1 · Should</span></td></tr>
        <tr><td class="tbl-code">F-015</td><td>WebSocket Live Updates</td><td>Replace polling with WebSocket connection for real-time pipeline stage updates and image preview streaming.</td><td><span class="badge badge-p1">P1 · Should</span></td></tr>
      </tbody>
    </table>

    <h3>Could Have (v1.2+)</h3>
    <table class="tbl">
      <thead><tr><th>ID</th><th>Feature</th><th>Description</th><th>Priority</th></tr></thead>
      <tbody>
        <tr><td class="tbl-code">F-016</td><td>LLM Adversarial Text Gen</td><td>Fine-tuned Llama-3/Mistral for adversarial prompt string generation targeting LLM blind spots. Separate text pipeline.</td><td><span class="badge badge-p2">P2 · Could</span></td></tr>
        <tr><td class="tbl-code">F-017</td><td>Multi-User Teams</td><td>Workspace-level user accounts with role-based access (Owner, Editor, Viewer). SSO via Google/GitHub OAuth.</td><td><span class="badge badge-p2">P2 · Could</span></td></tr>
        <tr><td class="tbl-code">F-018</td><td>Billing Integration</td><td>Stripe integration for pay-per-generation and subscription tiers. Usage metering per project.</td><td><span class="badge badge-p2">P2 · Could</span></td></tr>
        <tr><td class="tbl-code">F-019</td><td>Dataset Versioning</td><td>Each generation run creates a versioned dataset snapshot. Diff viewer showing delta between versions.</td><td><span class="badge badge-p2">P2 · Could</span></td></tr>
        <tr><td class="tbl-code">F-020</td><td>Custom Stressor Editor</td><td>UI for defining custom stressor parameters (rain intensity, fog density, occlusion %, etc.) beyond presets.</td><td><span class="badge badge-p2">P2 · Could</span></td></tr>
      </tbody>
    </table>

    <h3>Won't Have (v1.0)</h3>
    <div class="callout callout-amber">
      <strong>Explicitly Excluded from v1.0</strong>
      Video/temporal data generation, 3D point cloud labeling, mobile application, on-device inference optimization, real-time Blender rendering, custom labeling categories beyond bounding box, payment processing, user authentication/multi-tenancy.
    </div>
  </div>
</section>

<!-- 06 · USER STORIES -->
<section id="stories" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 06</div>
    <div class="section-label">06</div>
    <h2>User Stories</h2>

    <h3>Core Pipeline Stories</h3>
    <table class="tbl">
      <thead><tr><th>ID</th><th>As a...</th><th>I want to...</th><th>So that...</th><th>Acceptance Criteria</th></tr></thead>
      <tbody>
        <tr>
          <td class="story-id">US-001</td>
          <td>ML Engineer</td>
          <td>Create a new project with a name and description</td>
          <td>I can organize my data generation work by model/task</td>
          <td>Project created in &lt;500ms. ID returned. Appears in projects list immediately.</td>
        </tr>
        <tr>
          <td class="story-id">US-002</td>
          <td>ML Engineer</td>
          <td>Upload 8 seed images of my custom sensor</td>
          <td>The system can learn what my object looks like</td>
          <td>All 8 images accepted, stored, and preview thumbnails visible in UI within 5s.</td>
        </tr>
        <tr>
          <td class="story-id">US-003</td>
          <td>ML Engineer</td>
          <td>Run an adversarial scan against my deployed model endpoint</td>
          <td>I know exactly which stressors my model fails on</td>
          <td>Scan completes in &lt;3 minutes. Returns confidence score per stressor. Blind spots (conf &lt;0.6) highlighted in red on vulnerability map.</td>
        </tr>
        <tr>
          <td class="story-id">US-004</td>
          <td>ML Engineer</td>
          <td>Trigger the generation pipeline with one click</td>
          <td>I don't have to manually chain together ML operations</td>
          <td>Single POST to /generate starts all 4 stages sequentially. Progress visible in dashboard within 10 seconds.</td>
        </tr>
        <tr>
          <td class="story-id">US-005</td>
          <td>ML Engineer</td>
          <td>See real-time progress of the generation pipeline</td>
          <td>I know how long to wait and what's happening</td>
          <td>Progress bar updates within 3 seconds of each stage transition. Stage name ("Applying physics refinement") always visible.</td>
        </tr>
        <tr>
          <td class="story-id">US-006</td>
          <td>ML Engineer</td>
          <td>Download my labeled dataset as a ZIP file</td>
          <td>I can immediately plug it into my training pipeline</td>
          <td>ZIP contains: /images/, /annotations/instances_train.json (COCO), /yolo_labels/, dataset.yaml. Download link valid for 7 days.</td>
        </tr>
        <tr>
          <td class="story-id">US-007</td>
          <td>Research Scientist</td>
          <td>Run the pipeline without providing a model endpoint</td>
          <td>I can still get useful synthetic data even if I don't have a deployed model yet</td>
          <td>System uses default stressor set (fog, rain, occlusion_50, night) when no endpoint is provided. Clearly communicated in UI.</td>
        </tr>
        <tr>
          <td class="story-id">US-008</td>
          <td>AI Product Lead</td>
          <td>See the vulnerability map as a visual chart, not raw numbers</td>
          <td>I can communicate the findings to my CTO without reading JSON</td>
          <td>Bar chart renders with color coding: red (&lt;40%), amber (40–60%), green (&gt;60%). Labels are human-readable ("Heavy Rain", not "rain_heavy").</td>
        </tr>
      </tbody>
    </table>

    <h3>Infrastructure & Operational Stories</h3>
    <table class="tbl">
      <thead><tr><th>ID</th><th>Story</th><th>Acceptance Criteria</th></tr></thead>
      <tbody>
        <tr><td class="story-id">US-009</td><td>As a DevOps engineer, I want to deploy the entire stack with a single docker compose up command.</td><td>All 6 services start and pass healthchecks within 90 seconds on a fresh machine with Docker installed.</td></tr>
        <tr><td class="story-id">US-010</td><td>As a developer, I want to run the full pipeline without a GPU using MOCK_ML=true.</td><td>Complete pipeline runs end-to-end in &lt;3 minutes producing placeholder images. All DB records and ZIP output still created.</td></tr>
        <tr><td class="story-id">US-011</td><td>As a developer, I want the API to never time out on ML operations.</td><td>All /generate and /train-lora endpoints return immediately with task_id. Pipeline runs in Celery worker. API response &lt;200ms.</td></tr>
        <tr><td class="story-id">US-012</td><td>As a developer, I want to delete a project and all associated data.</td><td>DELETE /projects/{id} removes project, seed images, generated images, and MinIO objects within 5 seconds.</td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- 07 · FUNCTIONAL SPECS -->
<section id="functional" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 07</div>
    <div class="section-label">07</div>
    <h2>Functional Specifications</h2>

    <h3>7.1 — Project Lifecycle State Machine</h3>
    <div class="pipeline" style="flex-wrap:wrap;gap:6px;margin:16px 0">
      <div class="pipe-node">created</div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-node amber">training_lora</div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-node amber">scanning</div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-node indigo">generating</div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-node indigo">labeling</div>
      <div class="pipe-arrow">→</div>
      <div class="pipe-node active">ready</div>
    </div>
    <p>Any transition can also lead to <code style="font-family:var(--mono);font-size:12px;color:var(--red)">failed</code> state if a Celery task raises an unhandled exception. Failed projects display the error message in the dashboard. Users may retry generation from any failed state.</p>

    <h3>7.2 — Adversarial Scan Specification</h3>
    <p>The scan sends each stressor variant to the user-provided model endpoint as a <code style="font-family:var(--mono);font-size:12px;color:var(--teal)">POST</code> with <code style="font-family:var(--mono);font-size:12px;color:var(--teal)">multipart/form-data</code> containing an <code style="font-family:var(--mono);font-size:12px;color:var(--teal)">image</code> field. The endpoint must return JSON with a <code style="font-family:var(--mono);font-size:12px;color:var(--teal)">confidence</code> float (0.0–1.0).</p>
    <table class="tbl">
      <thead><tr><th>Stressor Key</th><th>Human Label</th><th>Severity</th><th>Physical Basis</th></tr></thead>
      <tbody>
        <tr><td class="tbl-code">occlusion_20</td><td>20% Occlusion</td><td>0.2</td><td>Foreground object partially blocking target (20% area)</td></tr>
        <tr><td class="tbl-code">occlusion_50</td><td>50% Occlusion</td><td>0.5</td><td>Half the target hidden by debris or other objects</td></tr>
        <tr><td class="tbl-code">occlusion_80</td><td>80% Occlusion</td><td>0.8</td><td>Only 20% of target visible — extreme scenario</td></tr>
        <tr><td class="tbl-code">rain_heavy</td><td>Heavy Rain</td><td>0.75</td><td>4,000+ rain streaks, blue-channel boost, 0.8px lens blur</td></tr>
        <tr><td class="tbl-code">fog_dense</td><td>Dense Fog</td><td>0.7</td><td>Exponential density falloff, ground-level concentration</td></tr>
        <tr><td class="tbl-code">night_low</td><td>Night / Low Contrast</td><td>0.65</td><td>82% luminance reduction, ISO noise, blue temperature shift</td></tr>
        <tr><td class="tbl-code">lens_flare</td><td>Lens Flare</td><td>0.4</td><td>Airy-disk pattern + chromatic aberration streak</td></tr>
        <tr><td class="tbl-code">motion_blur</td><td>Motion Blur</td><td>0.5</td><td>Gaussian directional blur, radius 6–18px</td></tr>
      </tbody>
    </table>

    <h3>7.3 — Generation Prompt Construction</h3>
    <p>For each stressor in the vulnerability_vector, a prompt is auto-constructed as:</p>
    <div class="code">
<span class="cmt"># Template</span>
<span class="str">"photorealistic image of {object_name} in {scene_context}, {stressor_descriptor},
professional photography, RAW photo, high detail, 8k resolution,
realistic sensor data, ground truth training image"</span>

<span class="cmt"># Example output for rain_heavy stressor</span>
<span class="str">"photorealistic image of industrial pressure sensor in warehouse environment,
torrential rain, heavy downpour, water droplets on lens, wet surfaces, storm,
professional photography, RAW photo, high detail, 8k resolution,
realistic sensor data, ground truth training image"</span>
    </div>

    <h3>7.4 — Auto-Labeling Output Format</h3>
    <p>Output format is COCO JSON. Each annotation record contains:</p>
    <div class="code">
{
  <span class="kw">"id"</span>: <span class="num">1</span>,
  <span class="kw">"image_id"</span>: <span class="num">42</span>,
  <span class="kw">"category_id"</span>: <span class="num">1</span>,
  <span class="kw">"bbox"</span>: [<span class="num">120.5</span>, <span class="num">80.2</span>, <span class="num">340.0</span>, <span class="num">280.1</span>],  <span class="cmt">// [x, y, width, height]</span>
  <span class="kw">"area"</span>: <span class="num">95240.0</span>,
  <span class="kw">"iscrowd"</span>: <span class="num">0</span>,
  <span class="kw">"score"</span>: <span class="num">0.9124</span>,
  <span class="kw">"segmentation"</span>: [[<span class="num">120.5</span>, <span class="num">80.2</span>, <span class="num">460.5</span>, <span class="num">80.2</span>, <span class="num">460.5</span>, <span class="num">360.3</span>, <span class="num">120.5</span>, <span class="num">360.3</span>]]
}
    </div>
  </div>
</section>

<!-- 08 · NON-FUNCTIONAL -->
<section id="nonfunctional" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 08</div>
    <div class="section-label">08</div>
    <h2>Non-Functional Requirements</h2>

    <h3>Performance</h3>
    <table class="tbl">
      <thead><tr><th>Requirement</th><th>Target</th><th>Measurement</th></tr></thead>
      <tbody>
        <tr><td>API response time (non-ML endpoints)</td><td>&lt; 200ms p95</td><td>Load tested with 50 concurrent users</td></tr>
        <tr><td>Status poll response time</td><td>&lt; 100ms p99</td><td>Postgres query time for single row</td></tr>
        <tr><td>Seed image upload (10 × 5MB)</td><td>&lt; 8 seconds</td><td>MinIO upload via multipart</td></tr>
        <tr><td>Adversarial scan (mock mode)</td><td>&lt; 15 seconds</td><td>8 stressors × ~1.5s mock delay</td></tr>
        <tr><td>Full pipeline (mock mode, 8 imgs/stressor)</td><td>&lt; 3 minutes</td><td>End-to-end, all 4 stages</td></tr>
        <tr><td>Full pipeline (real ML, RTX 4090)</td><td>&lt; 45 minutes</td><td>4 stressors × 50 images each</td></tr>
      </tbody>
    </table>

    <h3>Reliability & Availability</h3>
    <div class="grid2">
      <div class="card"><div class="card-title"><span class="dot dot-teal"></span>Task Durability</div><p>Celery tasks persist in Redis. If the worker crashes mid-pipeline, the task is retried automatically (max 3 retries, 60s backoff).</p></div>
      <div class="card"><div class="card-title"><span class="dot dot-blue"></span>Data Persistence</div><p>All project metadata in PostgreSQL with nightly backups. MinIO data replicated to a secondary volume in production.</p></div>
      <div class="card"><div class="card-title"><span class="dot dot-amber"></span>Graceful Degradation</div><p>If MinIO is unreachable, the API returns 503 with a clear message. Pipeline tasks queue until storage is available.</p></div>
      <div class="card"><div class="card-title"><span class="dot dot-indigo"></span>Health Checks</div><p>All Docker services expose /health endpoints. Docker Compose uses health conditions before dependent services start.</p></div>
    </div>

    <h3>Security</h3>
    <table class="tbl">
      <thead><tr><th>Concern</th><th>Requirement</th></tr></thead>
      <tbody>
        <tr><td>File uploads</td><td>Validate MIME type server-side. Reject non-image files. Max file size: 20MB per image, 100MB per request.</td></tr>
        <tr><td>Model endpoint</td><td>Only HTTPS endpoints allowed in production. HTTP allowed in development (env-gated).</td></tr>
        <tr><td>Presigned URLs</td><td>All dataset download URLs expire in 7 days. Regenerated on each /dataset request.</td></tr>
        <tr><td>CORS</td><td>Origin whitelist in production. Wildcard only in development (MOCK_ML=true).</td></tr>
        <tr><td>SQL injection</td><td>All DB queries via SQLAlchemy ORM with parameterized inputs. No raw SQL.</td></tr>
      </tbody>
    </table>

    <h3>Scalability Targets</h3>
    <p><strong>v1.0:</strong> Single Celery worker, single PostgreSQL instance, single MinIO node. Supports ~20 concurrent projects in generation. <strong>v2.0 target:</strong> Horizontal Celery worker scaling (up to 10 workers), PostgreSQL read replicas, MinIO distributed mode (4 nodes), support 200+ concurrent projects.</p>
  </div>
</section>

<!-- 09 · ARCHITECTURE -->
<section id="architecture" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 09</div>
    <div class="section-label">09</div>
    <h2>System Architecture</h2>

    <h3>Layer Overview</h3>
    <div class="arch-layer">
      <div class="arch-layer-label" style="color:var(--blue)">Client Layer</div>
      <div class="arch-layer-items">
        <span class="arch-chip" style="border-color:rgba(56,189,248,0.3);color:var(--blue)">React 18</span>
        <span class="arch-chip" style="border-color:rgba(56,189,248,0.3);color:var(--blue)">TypeScript</span>
        <span class="arch-chip" style="border-color:rgba(56,189,248,0.3);color:var(--blue)">TailwindCSS</span>
        <span class="arch-chip" style="border-color:rgba(56,189,248,0.3);color:var(--blue)">Recharts</span>
        <span class="arch-chip" style="border-color:rgba(56,189,248,0.3);color:var(--blue)">Nginx</span>
      </div>
    </div>
    <div class="arch-layer">
      <div class="arch-layer-label" style="color:var(--teal)">API Layer</div>
      <div class="arch-layer-items">
        <span class="arch-chip" style="border-color:rgba(0,229,160,0.3);color:var(--teal)">FastAPI</span>
        <span class="arch-chip" style="border-color:rgba(0,229,160,0.3);color:var(--teal)">SQLAlchemy</span>
        <span class="arch-chip" style="border-color:rgba(0,229,160,0.3);color:var(--teal)">Pydantic v2</span>
        <span class="arch-chip" style="border-color:rgba(0,229,160,0.3);color:var(--teal)">Uvicorn</span>
      </div>
    </div>
    <div class="arch-layer">
      <div class="arch-layer-label" style="color:var(--amber)">Task Layer</div>
      <div class="arch-layer-items">
        <span class="arch-chip" style="border-color:rgba(245,158,11,0.3);color:var(--amber)">Celery 5</span>
        <span class="arch-chip" style="border-color:rgba(245,158,11,0.3);color:var(--amber)">Redis 7</span>
        <span class="arch-chip" style="border-color:rgba(245,158,11,0.3);color:var(--amber)">Flower (monitoring)</span>
      </div>
    </div>
    <div class="arch-layer">
      <div class="arch-layer-label" style="color:var(--indigo)">ML Layer</div>
      <div class="arch-layer-items">
        <span class="arch-chip" style="border-color:rgba(108,99,255,0.3);color:#a5a0ff">Stable Diffusion XL</span>
        <span class="arch-chip" style="border-color:rgba(108,99,255,0.3);color:#a5a0ff">PEFT LoRA</span>
        <span class="arch-chip" style="border-color:rgba(108,99,255,0.3);color:#a5a0ff">ControlNet</span>
        <span class="arch-chip" style="border-color:rgba(108,99,255,0.3);color:#a5a0ff">Mask R-CNN</span>
        <span class="arch-chip" style="border-color:rgba(108,99,255,0.3);color:#a5a0ff">PIL / NumPy</span>
      </div>
    </div>
    <div class="arch-layer">
      <div class="arch-layer-label" style="color:var(--muted)">Storage Layer</div>
      <div class="arch-layer-items">
        <span class="arch-chip" style="border-color:var(--border2);color:var(--muted)">PostgreSQL 15</span>
        <span class="arch-chip" style="border-color:var(--border2);color:var(--muted)">MinIO (S3-compat)</span>
        <span class="arch-chip" style="border-color:var(--border2);color:var(--muted)">Local filesystem (weights)</span>
      </div>
    </div>

    <h3>Docker Services</h3>
    <table class="tbl">
      <thead><tr><th>Service</th><th>Image</th><th>Port</th><th>Purpose</th></tr></thead>
      <tbody>
        <tr><td>frontend</td><td>blindspot-frontend (Nginx)</td><td>3000:80</td><td>Serves React SPA, proxies /api/ to FastAPI</td></tr>
        <tr><td>api</td><td>blindspot-api (Python 3.11)</td><td>8000 (internal)</td><td>FastAPI REST application</td></tr>
        <tr><td>worker</td><td>blindspot-worker (Python 3.11)</td><td>—</td><td>Celery ML pipeline worker</td></tr>
        <tr><td>postgres</td><td>postgres:15-alpine</td><td>5432 (internal)</td><td>Project metadata, seed images, annotations</td></tr>
        <tr><td>redis</td><td>redis:7-alpine</td><td>6379 (internal)</td><td>Celery broker and result backend</td></tr>
        <tr><td>minio</td><td>minio/minio:latest</td><td>9001 (console)</td><td>Object storage for images, weights, datasets</td></tr>
        <tr><td>flower</td><td>blindspot-worker</td><td>5555</td><td>Celery task monitoring UI (optional profile)</td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- 10 · API CONTRACT -->
<section id="api" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 10</div>
    <div class="section-label">10</div>
    <h2>API Contract</h2>
    <p>Base URL: <code style="font-family:var(--mono);font-size:12px;color:var(--teal)">http://localhost:3000</code> (via Nginx proxy). All responses are <code style="font-family:var(--mono);font-size:12px;color:var(--teal)">application/json</code>.</p>

    <table class="tbl">
      <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th><th>Auth</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-done">GET</span></td><td class="tbl-code">/api/health</td><td>Health check. Returns <code style="font-family:var(--mono);font-size:11px">{"status":"ok"}</code></td><td>None</td></tr>
        <tr><td><span class="badge badge-done">GET</span></td><td class="tbl-code">/api/stressors</td><td>List all 8 stressor types with metadata</td><td>None</td></tr>
        <tr><td><span class="badge badge-wip">POST</span></td><td class="tbl-code">/api/projects</td><td>Create project. Body: <code style="font-family:var(--mono);font-size:11px">{name, description?}</code></td><td>None (v1)</td></tr>
        <tr><td><span class="badge badge-done">GET</span></td><td class="tbl-code">/api/projects</td><td>List all projects, ordered by created_at desc</td><td>None</td></tr>
        <tr><td><span class="badge badge-done">GET</span></td><td class="tbl-code">/api/projects/{id}</td><td>Get single project with seed_images array</td><td>None</td></tr>
        <tr><td><span class="badge badge-red" style="border-color:rgba(244,63,94,0.35);color:#fb7185;background:rgba(244,63,94,0.07)">DEL</span></td><td class="tbl-code">/api/projects/{id}</td><td>Delete project. Cascades to seed images and generated images in DB.</td><td>None</td></tr>
        <tr><td><span class="badge badge-wip">POST</span></td><td class="tbl-code">/api/projects/{id}/seed-images</td><td>Upload 1–10 images. Multipart form, field: <code style="font-family:var(--mono);font-size:11px">files[]</code></td><td>None</td></tr>
        <tr><td><span class="badge badge-wip">POST</span></td><td class="tbl-code">/api/projects/{id}/model-endpoint</td><td>Register model URL. Body: <code style="font-family:var(--mono);font-size:11px">{endpoint}</code></td><td>None</td></tr>
        <tr><td><span class="badge badge-wip">POST</span></td><td class="tbl-code">/api/projects/{id}/train-lora</td><td>Queue LoRA training Celery task. Returns task_id.</td><td>None</td></tr>
        <tr><td><span class="badge badge-wip">POST</span></td><td class="tbl-code">/api/projects/{id}/run-adversarial-scan</td><td>Synchronous scan (runs in request thread). Returns vulnerability_vector.</td><td>None</td></tr>
        <tr><td><span class="badge badge-wip">POST</span></td><td class="tbl-code">/api/projects/{id}/generate</td><td>Queue full pipeline Celery task. Returns task_id.</td><td>None</td></tr>
        <tr><td><span class="badge badge-done">GET</span></td><td class="tbl-code">/api/projects/{id}/status</td><td>Returns <code style="font-family:var(--mono);font-size:11px">{status, progress, current_stage, image_count, label_count}</code></td><td>None</td></tr>
        <tr><td><span class="badge badge-done">GET</span></td><td class="tbl-code">/api/projects/{id}/dataset</td><td>Returns presigned download URL. Error 400 if status ≠ ready.</td><td>None</td></tr>
      </tbody>
    </table>

    <h3>Error Response Format</h3>
    <div class="code">
{
  <span class="kw">"detail"</span>: <span class="str">"Project not found"</span>,   <span class="cmt">// Human-readable message</span>
  <span class="kw">"status_code"</span>: <span class="num">404</span>,
  <span class="kw">"error_type"</span>: <span class="str">"NOT_FOUND"</span>
}
    </div>

    <h3>Standard HTTP Status Codes Used</h3>
    <div class="grid2">
      <div><code style="font-family:var(--mono);font-size:12px;color:var(--teal)">200</code> — Success (GET, synchronous POST)<br><code style="font-family:var(--mono);font-size:12px;color:var(--teal)">202</code> — Accepted (async task queued)<br><code style="font-family:var(--mono);font-size:12px;color:var(--teal)">400</code> — Bad request (validation error)</div>
      <div><code style="font-family:var(--mono);font-size:12px;color:var(--red)">404</code> — Resource not found<br><code style="font-family:var(--mono);font-size:12px;color:var(--red)">422</code> — Unprocessable entity (Pydantic)<br><code style="font-family:var(--mono);font-size:12px;color:var(--red)">503</code> — Service unavailable (MinIO/Redis down)</div>
    </div>
  </div>
</section>

<!-- 11 · DATA MODELS -->
<section id="data" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 11</div>
    <div class="section-label">11</div>
    <h2>Data Models</h2>

    <h3>Project</h3>
    <table class="tbl">
      <thead><tr><th>Field</th><th>Type</th><th>Description</th><th>Nullable</th></tr></thead>
      <tbody>
        <tr><td class="tbl-code">id</td><td>UUID string</td><td>Primary key, auto-generated</td><td>No</td></tr>
        <tr><td class="tbl-code">name</td><td>VARCHAR(200)</td><td>User-defined project name</td><td>No</td></tr>
        <tr><td class="tbl-code">description</td><td>TEXT</td><td>Optional project description</td><td>Yes</td></tr>
        <tr><td class="tbl-code">status</td><td>ENUM</td><td>created | training_lora | scanning | generating | labeling | ready | failed</td><td>No</td></tr>
        <tr><td class="tbl-code">model_endpoint</td><td>VARCHAR(500)</td><td>Client's AI model HTTP endpoint</td><td>Yes</td></tr>
        <tr><td class="tbl-code">lora_weights_path</td><td>VARCHAR(500)</td><td>Local filesystem path to LoRA adapter .safetensors</td><td>Yes</td></tr>
        <tr><td class="tbl-code">vulnerability_vector</td><td>JSON</td><td>{"stressor_key": confidence_float} map</td><td>Yes</td></tr>
        <tr><td class="tbl-code">celery_task_id</td><td>VARCHAR(200)</td><td>Current active Celery task UUID</td><td>Yes</td></tr>
        <tr><td class="tbl-code">progress</td><td>INTEGER</td><td>0–100 pipeline progress percentage</td><td>No</td></tr>
        <tr><td class="tbl-code">current_stage</td><td>VARCHAR(100)</td><td>Human-readable current stage description</td><td>Yes</td></tr>
        <tr><td class="tbl-code">dataset_url</td><td>VARCHAR(1000)</td><td>MinIO presigned URL for dataset ZIP download</td><td>Yes</td></tr>
        <tr><td class="tbl-code">image_count</td><td>INTEGER</td><td>Total generated images in final dataset</td><td>No</td></tr>
        <tr><td class="tbl-code">label_count</td><td>INTEGER</td><td>Total COCO annotations generated</td><td>No</td></tr>
        <tr><td class="tbl-code">error_message</td><td>TEXT</td><td>Error detail if status = failed</td><td>Yes</td></tr>
        <tr><td class="tbl-code">created_at</td><td>TIMESTAMPTZ</td><td>Auto-set on insert</td><td>No</td></tr>
        <tr><td class="tbl-code">updated_at</td><td>TIMESTAMPTZ</td><td>Auto-updated on every change</td><td>No</td></tr>
      </tbody>
    </table>

    <h3>SeedImage</h3>
    <table class="tbl">
      <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td class="tbl-code">id</td><td>UUID string</td><td>Primary key</td></tr>
        <tr><td class="tbl-code">project_id</td><td>UUID FK → projects.id</td><td>Parent project (CASCADE DELETE)</td></tr>
        <tr><td class="tbl-code">filename</td><td>VARCHAR(500)</td><td>Original filename from upload</td></tr>
        <tr><td class="tbl-code">storage_key</td><td>VARCHAR(500)</td><td>MinIO object key: seeds/{project_id}/{uuid}{ext}</td></tr>
        <tr><td class="tbl-code">url</td><td>VARCHAR(1000)</td><td>Presigned URL (regenerated on GET /projects/{id})</td></tr>
        <tr><td class="tbl-code">created_at</td><td>TIMESTAMPTZ</td><td>Upload timestamp</td></tr>
      </tbody>
    </table>

    <h3>MinIO Storage Layout</h3>
    <div class="code">
<span class="cmt"># Bucket: blindspot</span>
seeds/{project_id}/{uuid}{ext}          <span class="cmt"># Raw uploaded seed images</span>
datasets/{project_id}/dataset_{id}.zip  <span class="cmt"># Final labeled dataset ZIP</span>
    </div>
  </div>
</section>

<!-- 12 · ML PIPELINE -->
<section id="ml" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 12</div>
    <div class="section-label">12</div>
    <h2>ML Pipeline Specification</h2>

    <h3>Stage 1 — LoRA Fine-Tuning</h3>
    <table class="tbl">
      <thead><tr><th>Parameter</th><th>Value</th><th>Rationale</th></tr></thead>
      <tbody>
        <tr><td>Base model</td><td>stabilityai/stable-diffusion-xl-base-1.0</td><td>State-of-art open image generation, 7GB, HuggingFace hosted</td></tr>
        <tr><td>LoRA rank (r)</td><td>16</td><td>Balance between expressiveness and VRAM. r=16 uses ~180MB adapter vs 7GB full fine-tune</td></tr>
        <tr><td>LoRA alpha</td><td>32</td><td>Scaling factor = alpha/r = 2. Standard practice for stable training</td></tr>
        <tr><td>Target modules</td><td>to_q, to_v, to_k, to_out.0</td><td>Cross-attention layers in UNet — control object identity</td></tr>
        <tr><td>LoRA dropout</td><td>0.05</td><td>Light regularization for small seed sets</td></tr>
        <tr><td>Optimizer</td><td>AdamW, lr=1e-4</td><td>Standard for LoRA fine-tuning</td></tr>
        <tr><td>Training steps</td><td>500</td><td>Sufficient for 5–10 seed images without overfitting</td></tr>
        <tr><td>VRAM requirement</td><td>~14 GB</td><td>vs ~40 GB for full fine-tuning. Fits on RTX 3090/4090</td></tr>
      </tbody>
    </table>

    <div class="callout callout-teal">
      <strong>Why LoRA and not full fine-tuning?</strong>
      Full fine-tuning of SDXL on 5–10 images would cause severe catastrophic forgetting — the model would lose all its knowledge of physics, weather, and environments. LoRA only adapts the cross-attention weights responsible for object identity, preserving all other learned knowledge intact.
    </div>

    <h3>Stage 2 — Adversarial Agent</h3>
    <p>The agent iterates through all 8 stressor types, applies each via the PIL stressor functions, sends the stressed image to the client's model endpoint, and records the confidence score. Any stressor scoring below <code style="font-family:var(--mono);font-size:12px;color:var(--amber)">0.60</code> is added to the vulnerability_vector. If no model endpoint is provided, mock scores are returned.</p>

    <h3>Stage 3 — Generative Engine</h3>
    <p>Runs <code style="font-family:var(--mono);font-size:12px;color:var(--teal)">IMAGES_PER_STRESSOR</code> generations per identified blind spot using:</p>
    <ul style="list-style:none;padding:0;margin:12px 0">
      <li style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--muted)"><span style="color:var(--teal);margin-right:10px">›</span> SDXL base pipeline from HuggingFace diffusers</li>
      <li style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--muted)"><span style="color:var(--teal);margin-right:10px">›</span> LoRA adapter loaded if available (falls back to base SDXL)</li>
      <li style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--muted)"><span style="color:var(--teal);margin-right:10px">›</span> ControlNet depth model for structural integrity (prevents impossible geometry)</li>
      <li style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--muted)"><span style="color:var(--teal);margin-right:10px">›</span> 30 inference steps, guidance scale 7.5, 1024×1024 output</li>
      <li style="padding:6px 0;font-size:13px;color:var(--muted)"><span style="color:var(--teal);margin-right:10px">›</span> Negative prompt blocks: unrealistic geometry, watermarks, duplicate objects</li>
    </ul>

    <h3>Stage 4 — Physics Refinement</h3>
    <p>Each generated image passes through the appropriate PIL/NumPy physics function. The physics layer does NOT re-generate using diffusion — it post-processes the existing image with mathematically grounded transformations: correct Airy-disk lens flare, exponential fog density falloff, ISO noise simulation, and refraction-consistent rain streaks.</p>

    <h3>Stage 5 — Auto-Labeling (Mask R-CNN)</h3>
    <table class="tbl">
      <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Model</td><td>MaskRCNN_ResNet50_FPN (torchvision pretrained COCO weights)</td></tr>
        <tr><td>Confidence threshold</td><td>0.50 (configurable per project in v1.1)</td></tr>
        <tr><td>Output format</td><td>COCO JSON (instances_train.json) + YOLO .txt + dataset.yaml</td></tr>
        <tr><td>YOLO compatibility</td><td>Ultralytics YOLOv8/v11, standard COCO→YOLO conversion</td></tr>
        <tr><td>Segmentation</td><td>Polygon segmentation included in COCO output (from instance masks)</td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- 13 · METRICS -->
<section id="metrics" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 13</div>
    <div class="section-label">13</div>
    <h2>Success Metrics & KPIs</h2>

    <h3>Product Quality Metrics</h3>
    <table class="tbl">
      <thead><tr><th>Metric</th><th>Target v1.0</th><th>How Measured</th></tr></thead>
      <tbody>
        <tr><td>FID Score (generated vs real)</td><td>&lt; 30</td><td>pytorch-fid library against seed validation set</td></tr>
        <tr><td>Auto-label accuracy (mAP@0.5)</td><td>&gt; 85%</td><td>Mask R-CNN predictions vs hand-labeled ground truth on 200-image test set</td></tr>
        <tr><td>Pipeline success rate</td><td>&gt; 95%</td><td>Ratio of tasks reaching "ready" state vs total triggered</td></tr>
        <tr><td>COCO JSON validity</td><td>100%</td><td>All outputs validate against official COCO schema (pycocotools)</td></tr>
        <tr><td>YOLO training compatibility</td><td>100%</td><td>Output dataset.yaml loadable by ultralytics without modification</td></tr>
      </tbody>
    </table>

    <h3>Business / Product KPIs (Post-Launch)</h3>
    <table class="tbl">
      <thead><tr><th>KPI</th><th>Target (30 days)</th><th>Target (90 days)</th></tr></thead>
      <tbody>
        <tr><td>Projects created</td><td>50</td><td>300</td></tr>
        <tr><td>Datasets downloaded</td><td>30</td><td>200</td></tr>
        <tr><td>Median time to first dataset</td><td>&lt; 45 min</td><td>&lt; 30 min</td></tr>
        <tr><td>User-reported model accuracy improvement</td><td>N/A</td><td>+12% avg mAP improvement after training on BlindSpot.AI data</td></tr>
        <tr><td>Pipeline completion rate</td><td>&gt; 90%</td><td>&gt; 95%</td></tr>
      </tbody>
    </table>

    <h3>Developer Experience Metrics</h3>
    <div class="grid3">
      <div class="metric">
        <div class="metric-val" style="color:var(--teal)">&lt;90s</div>
        <div class="metric-lbl">docker compose up to ready</div>
      </div>
      <div class="metric">
        <div class="metric-val" style="color:var(--blue)">&lt;3min</div>
        <div class="metric-lbl">full pipeline mock mode</div>
      </div>
      <div class="metric">
        <div class="metric-val" style="color:var(--amber)">1 cmd</div>
        <div class="metric-lbl">full stack deployment</div>
      </div>
    </div>
  </div>
</section>

<!-- 14 · ROADMAP -->
<section id="roadmap" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 14</div>
    <div class="section-label">14</div>
    <h2>Product Roadmap</h2>

    <div class="roadmap-phase">
      <div class="roadmap-header">
        <span class="badge badge-mvp">MVP</span>
        <div class="roadmap-phase-name">Phase 1 — AxiomSynth Core</div>
        <span style="font-family:var(--mono);font-size:11px;color:var(--muted)">Hackathon · April 2026</span>
      </div>
      <div class="roadmap-body">
        <ul>
          <li>Full Docker stack: api, worker, redis, postgres, minio, frontend</li>
          <li>Project CRUD API with PostgreSQL persistence</li>
          <li>Seed image upload to MinIO via multipart</li>
          <li>Mock + Real LoRA training pipeline (PEFT SDXL)</li>
          <li>8-stressor adversarial vulnerability scan (mock + real endpoint)</li>
          <li>Full SDXL + LoRA + ControlNet generative engine</li>
          <li>PIL/NumPy physics refinement layer (all 8 stressors)</li>
          <li>Mask R-CNN auto-labeling → COCO JSON + YOLO output</li>
          <li>Dataset ZIP packaging and presigned URL delivery</li>
          <li>React dashboard: Projects list, 4-tab project detail, vulnerability bar chart</li>
          <li>Real-time progress polling (3s interval)</li>
        </ul>
      </div>
    </div>

    <div class="roadmap-phase">
      <div class="roadmap-header">
        <span class="badge badge-wip">v1.1</span>
        <div class="roadmap-phase-name">Phase 2 — Quality & Security</div>
        <span style="font-family:var(--mono);font-size:11px;color:var(--muted)">June 2026</span>
      </div>
      <div class="roadmap-body">
        <ul>
          <li>FID Score validation gate after physics layer</li>
          <li>Blender Python API integration for volumetric physics</li>
          <li>API key authentication with Bearer tokens</li>
          <li>Rate limiting per API key (100 req/min standard tier)</li>
          <li>WebSocket live updates replacing polling</li>
          <li>Stressor preview modal (before/after comparison)</li>
          <li>Celery task retry on failure with exponential backoff</li>
          <li>Swagger / OpenAPI documentation at /api/docs</li>
        </ul>
      </div>
    </div>

    <div class="roadmap-phase">
      <div class="roadmap-header">
        <span class="badge badge-p2">v2.0</span>
        <div class="roadmap-phase-name">Phase 3 — Platform & Scale</div>
        <span style="font-family:var(--mono);font-size:11px;color:var(--muted)">Q4 2026</span>
      </div>
      <div class="roadmap-body">
        <ul>
          <li>Multi-user workspaces with RBAC (Owner / Editor / Viewer)</li>
          <li>Google / GitHub OAuth SSO</li>
          <li>Stripe billing integration: pay-per-generation + subscriptions</li>
          <li>LLM adversarial text generation pipeline (Llama-3 / Mistral)</li>
          <li>Custom stressor editor: adjust rain intensity, fog density, etc.</li>
          <li>Dataset versioning with diff viewer</li>
          <li>Horizontal Celery worker scaling (10 workers)</li>
          <li>MinIO distributed mode (4-node cluster)</li>
          <li>Marketing website (BlindSpot.AI public launch)</li>
        </ul>
      </div>
    </div>

    <div class="roadmap-phase">
      <div class="roadmap-header">
        <span class="badge badge-future">v3.0</span>
        <div class="roadmap-phase-name">Phase 4 — Enterprise</div>
        <span style="font-family:var(--mono);font-size:11px;color:var(--muted)">H1 2027</span>
      </div>
      <div class="roadmap-body">
        <ul>
          <li>Air-gapped enterprise deployment with Kubernetes Helm chart</li>
          <li>Video / temporal synthetic data generation</li>
          <li>3D point cloud and LiDAR stressor simulation</li>
          <li>SOC 2 Type II compliance certification</li>
          <li>Custom model support (beyond SDXL: DiT, Flux, etc.)</li>
          <li>On-premise Blender render farm integration</li>
          <li>SLA with 99.9% uptime guarantee for enterprise tier</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- 15 · RISKS -->
<section id="risks" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 15</div>
    <div class="section-label">15</div>
    <h2>Risk Register & Mitigation</h2>

    <div style="margin:16px 0">
      <div class="risk-row" style="border-bottom:none">
        <div class="risk-header">Risk</div>
        <div class="risk-header">Impact</div>
        <div class="risk-header">Probability</div>
        <div class="risk-header">Mitigation</div>
      </div>
      <div class="risk-row">
        <div style="color:var(--text);font-weight:500;font-size:13px">Domain Gap — Synthetic images lack real statistical distribution</div>
        <div><span class="risk-impact impact-high">High</span></div>
        <div><span class="risk-impact impact-med">Medium</span></div>
        <div style="font-size:13px;color:var(--muted)">Physics layer grounds outputs in real laws. FID score gate rejects low-quality batches. Statistical distribution check against seed validation set.</div>
      </div>
      <div class="risk-row">
        <div style="color:var(--text);font-weight:500;font-size:13px">VRAM OOM — SDXL + LoRA + ControlNet exceed GPU memory</div>
        <div><span class="risk-impact impact-high">High</span></div>
        <div><span class="risk-impact impact-med">Medium</span></div>
        <div style="font-size:13px;color:var(--muted)">Attention slicing + model CPU offload enabled by default. LoRA (not full fine-tune) keeps VRAM to ~14GB. Async batch processing. MOCK_ML fallback for low-VRAM environments.</div>
      </div>
      <div class="risk-row">
        <div style="color:var(--text);font-weight:500;font-size:13px">ControlNet impossible geometry — objects morph unnaturally</div>
        <div><span class="risk-impact impact-med">Medium</span></div>
        <div><span class="risk-impact impact-low">Low</span></div>
        <div style="font-size:13px;color:var(--muted)">ControlNet depth conditioning enforces spatial constraints. Strong negative prompt blocks unnatural morphing. Visual QA sample shown in dashboard before bulk generation.</div>
      </div>
      <div class="risk-row">
        <div style="color:var(--text);font-weight:500;font-size:13px">Celery worker crash mid-pipeline — data loss</div>
        <div><span class="risk-impact impact-high">High</span></div>
        <div><span class="risk-impact impact-low">Low</span></div>
        <div style="font-size:13px;color:var(--muted)">Task retries with max_retries=3, countdown=60. Progress persisted to PostgreSQL after each stage. Pipeline is resumable from any stage checkpoint.</div>
      </div>
      <div class="risk-row">
        <div style="color:var(--text);font-weight:500;font-size:13px">Mask R-CNN poor labeling on niche objects</div>
        <div><span class="risk-impact impact-med">Medium</span></div>
        <div><span class="risk-impact impact-med">Medium</span></div>
        <div style="font-size:13px;color:var(--muted)">Confidence threshold configurable. v1.1 adds CVAT API integration for human-in-the-loop spot checking. FID gate rejects visually poor batches before labeling.</div>
      </div>
      <div class="risk-row" style="border-bottom:none">
        <div style="color:var(--text);font-weight:500;font-size:13px">Stable Diffusion license restrictions on commercial output</div>
        <div><span class="risk-impact impact-high">High</span></div>
        <div><span class="risk-impact impact-low">Low</span></div>
        <div style="font-size:13px;color:var(--muted)">SDXL uses CreativeML Open RAIL-M license — commercial use permitted with restrictions. Legal review before enterprise launch. Alternative: FLUX.1 (Apache 2.0) as drop-in replacement.</div>
      </div>
    </div>
  </div>
</section>

<!-- 16 · GO-TO-MARKET -->
<section id="gtm" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 16</div>
    <div class="section-label">16</div>
    <h2>Go-To-Market Strategy</h2>

    <h3>Positioning</h3>
    <div class="callout callout-indigo">
      <strong>Positioning Statement</strong>
      For AI teams who need edge-case training data but can't afford Big Tech's data collection budget, BlindSpot.AI is the synthetic data platform that generates physically accurate, adversarially targeted, auto-labeled datasets from just 5 seed images — unlike generic augmentation tools, we probe your model first to generate exactly what it needs.
    </div>

    <h3>Business Model (B2B SaaS)</h3>
    <div class="grid3">
      <div class="card">
        <div class="card-title"><span class="dot dot-teal"></span>Prototype — Free</div>
        <p>500 images/month. 2 projects. COCO export only. No adversarial scan. Community support. Designed for evaluation and research.</p>
      </div>
      <div class="card" style="border-color:rgba(0,229,160,0.2)">
        <div class="card-title"><span class="dot dot-teal"></span>Studio — $299/mo</div>
        <p>10,000 images/month. Unlimited projects. All 8 stressors. Adversarial scan. YOLO + COCO export. Email support. 14-day free trial.</p>
      </div>
      <div class="card" style="border-color:rgba(245,158,11,0.2)">
        <div class="card-title"><span class="dot dot-amber"></span>Enterprise — Custom</div>
        <p>Unlimited. Air-gapped deployment. Blender physics. SLA. Dedicated CSM. Annual contract. Defense, healthcare, finance verticals.</p>
      </div>
    </div>

    <h3>Target Market</h3>
    <table class="tbl">
      <thead><tr><th>Segment</th><th>Pain Level</th><th>Willingness to Pay</th><th>Sales Motion</th></tr></thead>
      <tbody>
        <tr><td>Autonomous Vehicle startups</td><td>Critical</td><td>High ($50K+/yr)</td><td>Outbound + demo</td></tr>
        <tr><td>Medical AI research labs</td><td>High</td><td>Medium (grant-funded)</td><td>Academic partnerships</td></tr>
        <tr><td>Drone inspection companies</td><td>High</td><td>Medium ($10K–50K/yr)</td><td>Self-serve + upsell</td></tr>
        <tr><td>Defense / Robotics contractors</td><td>Critical</td><td>Very High ($500K+/yr)</td><td>Enterprise sales cycle</td></tr>
        <tr><td>AI startups (general CV)</td><td>Medium</td><td>Low–Medium ($300/mo)</td><td>Self-serve product-led</td></tr>
      </tbody>
    </table>

    <h3>Launch Channels</h3>
    <ul class="num-list">
      <li><span class="num-badge">CH-1</span><div class="num-content"><h4>Product Hunt Launch</h4><p>Day-1 launch on Product Hunt targeting ML Engineer and AI founder communities. Goal: Top 5 of the day.</p></div></li>
      <li><span class="num-badge">CH-2</span><div class="num-content"><h4>HuggingFace Model Card + Space</h4><p>Publish BlindSpot.AI as an open demo on HuggingFace Spaces. Reach 500K+ ML practitioners directly where they work.</p></div></li>
      <li><span class="num-badge">CH-3</span><div class="num-content"><h4>GitHub Open Core</h4><p>Open source the core pipeline under MIT license. Enterprise features (Blender, air-gap, teams) remain proprietary. GitHub stars drive enterprise discovery.</p></div></li>
      <li><span class="num-badge">CH-4</span><div class="num-content"><h4>Technical Content</h4><p>Publish deep-dives: "How we ground synthetic images in physics", "LoRA fine-tuning from 5 images". Target ArXiv, Towards Data Science, Substack ML newsletters.</p></div></li>
    </ul>
  </div>
</section>

<!-- 17 · APPENDIX -->
<section id="appendix" class="section">
  <div class="section-inner">
    <div class="page-tag">Section 17</div>
    <div class="section-label">17</div>
    <h2>Appendix & Glossary</h2>

    <h3>Glossary</h3>
    <table class="tbl">
      <thead><tr><th>Term</th><th>Definition</th></tr></thead>
      <tbody>
        <tr><td><strong>AxiomSynth</strong></td><td>The internal codename for the BlindSpot.AI core ML pipeline engine.</td></tr>
        <tr><td><strong>Edge Case</strong></td><td>A scenario that occurs rarely in training data but can cause critical model failure in production (e.g., heavy rain, severe occlusion).</td></tr>
        <tr><td><strong>Data Moat</strong></td><td>The structural competitive advantage held by large companies who can afford to collect real-world edge-case training data at scale.</td></tr>
        <tr><td><strong>LoRA</strong></td><td>Low-Rank Adaptation. A parameter-efficient fine-tuning technique that adds small trainable adapter layers to a frozen pre-trained model, enabling customization with minimal data and compute.</td></tr>
        <tr><td><strong>Vulnerability Vector</strong></td><td>The output of the adversarial scan: a dictionary mapping stressor_key → average confidence score for all stressors below the 0.60 threshold.</td></tr>
        <tr><td><strong>SDXL</strong></td><td>Stable Diffusion XL — the 7B parameter open-source image generation model by Stability AI, the base model used by the AxiomSynth generative engine.</td></tr>
        <tr><td><strong>ControlNet</strong></td><td>A neural network architecture that adds conditional control to diffusion models using structural inputs like depth maps, enforcing spatial consistency in generated images.</td></tr>
        <tr><td><strong>COCO JSON</strong></td><td>Common Objects in Context — the standard annotation format for object detection and segmentation, used by virtually all major training frameworks.</td></tr>
        <tr><td><strong>FID Score</strong></td><td>Fréchet Inception Distance — a metric measuring the similarity between real and generated image distributions. Lower is better; &lt;30 indicates high-quality generation.</td></tr>
        <tr><td><strong>Physics Layer</strong></td><td>The post-processing stage that applies physically accurate environmental stressors to generated images using PIL/NumPy or Blender.</td></tr>
        <tr><td><strong>Presigned URL</strong></td><td>A time-limited URL that grants temporary access to a private MinIO object without requiring authentication credentials.</td></tr>
        <tr><td><strong>Mock Mode</strong></td><td>Operation mode (MOCK_ML=true) that simulates all ML operations with fast placeholder outputs, enabling development and testing without a GPU.</td></tr>
      </tbody>
    </table>

    <h3>External Dependencies</h3>
    <table class="tbl">
      <thead><tr><th>Dependency</th><th>Version</th><th>License</th><th>Risk</th></tr></thead>
      <tbody>
        <tr><td>stabilityai/stable-diffusion-xl-base-1.0</td><td>1.0</td><td>CreativeML Open RAIL-M</td><td>Commercial use permitted with restrictions</td></tr>
        <tr><td>HuggingFace diffusers</td><td>≥0.27.0</td><td>Apache 2.0</td><td>Low — stable API, backed by major VCs</td></tr>
        <tr><td>PEFT (LoRA library)</td><td>≥0.11.0</td><td>Apache 2.0</td><td>Low — HuggingFace maintained</td></tr>
        <tr><td>PyTorch + torchvision</td><td>≥2.2.0</td><td>BSD</td><td>Very low — industry standard</td></tr>
        <tr><td>FastAPI</td><td>≥0.111.0</td><td>MIT</td><td>Very low — widely adopted</td></tr>
        <tr><td>Celery</td><td>≥5.4.0</td><td>BSD</td><td>Low — 20+ year project</td></tr>
        <tr><td>MinIO</td><td>latest</td><td>AGPL-3.0 (OSS)</td><td>Medium — AGPL may require OSS compliance in products that expose MinIO directly</td></tr>
      </tbody>
    </table>

    <h3>Document Revision History</h3>
    <table class="tbl">
      <thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Changes</th></tr></thead>
      <tbody>
        <tr><td>1.0.0</td><td>15 Apr 2026</td><td>Chayan Mal</td><td>Initial PRD — full v1.0 specification</td></tr>
      </tbody>
    </table>

    <div class="callout callout-teal" style="margin-top:32px">
      <strong>Document Sign-Off</strong>
      This PRD represents the complete product specification for BlindSpot.AI v1.0 as submitted for HACKTONIX 2026. All feature requirements, API contracts, ML pipeline parameters, and delivery milestones are binding for the v1.0 development sprint.
    </div>

    <div style="margin-top:40px;padding-top:24px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--mono);font-size:11px;color:var(--dim)">BlindSpot.AI PRD v1.0.0 · Camp Nou Coders · HACKTONIX 2026</div>
      <div style="font-family:var(--mono);font-size:11px;color:var(--dim)">Netaji Subhash Engineering College, Kolkata</div>
    </div>
  </div>
</section>

</main>
</div><!-- end layout -->

<script>
// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove('active'));
      const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.classList.add('active');
    }
  });
}, { threshold: 0.3 });
sections.forEach(s => observer.observe(s));
</script>
</body>
</html>
