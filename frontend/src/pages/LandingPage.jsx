import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ScanLine,
  FileText,
  Users,
  BarChart2,
  Cpu,
  Layers,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Database,
  ArrowUpRight,
  Lock,
  Download,
  Filter,
  Sun,
  Moon
} from 'lucide-react';
import { RecommendationBadge } from '../components/common/Badge';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage({ onLaunchApp, onOpenAuth }) {
  const { isDark, toggleTheme } = useTheme();
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-[#F8FAFC] selection:bg-[#8B5CF6] selection:text-white font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Grid & Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none bg-subtle-grid opacity-50 dark:opacity-60 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-500/10 via-violet-600/5 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      {/* 1. MINIMAL PUBLIC NAVIGATION */}
      <header className="relative z-30 border-b border-navy-700/60 bg-navy-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <span className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              HireNova
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block shadow-[0_0_8px_#818CF8]" />
            </span>
            <span className="hidden md:inline-block text-[11px] font-mono uppercase tracking-widest text-navy-400 border-l border-navy-700 pl-3">
              Next-Gen Recruitment
            </span>
          </div>

          {/* Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-sans text-navy-300">
            <a href="#product" className="hover:text-white transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#screening" className="hover:text-white transition-colors">Screening</a>
            <a href="#ranking" className="hover:text-white transition-colors">Ranking</a>
            <a href="#analytics" className="hover:text-white transition-colors">Analytics</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Sun/Moon Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-navy-700/80 bg-navy-850 hover:bg-navy-800 text-navy-400 hover:text-cyan-400 transition-all flex items-center justify-center shadow-sm"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            <button
              onClick={() => onOpenAuth ? onOpenAuth() : onLaunchApp('dashboard')}
              className="px-3.5 py-1.5 text-xs font-medium text-navy-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onLaunchApp('screening')}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded transition-all shadow-[0_0_20px_rgba(79,209,255,0.25)] flex items-center gap-1.5 active:scale-[0.98]"
            >
              <span>Start Screening</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC SPLIT HERO */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Eyebrow + Huge Editorial Typography */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-navy-700 bg-navy-900/80 text-[11px] font-mono tracking-wider text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>HIRENOVA / NEXT-GEN RECRUITMENT</span>
            </div>

            {/* Giant Editorial Headline */}
            <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white">
              SCREEN RESUMES.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
                DISCOVER TALENT.
              </span><br />
              MOVE FASTER.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-navy-300 max-w-xl font-sans leading-relaxed">
              HireNova evaluates candidate resumes against real role specifications, extracts verified technical competencies, calculates multi-dimensional match scores, and shortlists top talent in seconds.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onLaunchApp('screening')}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-display rounded transition-all shadow-[0_0_25px_rgba(79,209,255,0.4)] flex items-center justify-center gap-2"
              >
                <span>Start Screening</span>
                <ArrowRight className="w-4 h-4 text-navy-950 stroke-[2.5]" />
              </button>

              <button
                onClick={() => onLaunchApp('dashboard')}
                className="px-6 py-3.5 text-sm font-medium text-navy-200 hover:text-white bg-navy-900/80 hover:bg-navy-850 border border-navy-700 rounded transition-colors flex items-center justify-center gap-2"
              >
                <span>Launch Recruiter Workspace</span>
                <ArrowUpRight className="w-4 h-4 text-navy-400" />
              </button>
            </div>

            {/* Micro Signal Strip */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-navy-400 border-t border-navy-800">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>LinearSVC Classifier (24 Categories)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>TF-IDF Semantic Matching</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span>Zero Hallucinations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Product UI Visual (SafalHires / Intervue / Flowmingo style) */}
          <div className="lg:col-span-6 relative">
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/30 to-cyan-500/30 rounded-2xl blur-xl opacity-70" />

            {/* Browser / Application Frame */}
            <div className="relative rounded-xl border border-navy-700/80 bg-navy-900/95 shadow-2xl overflow-hidden backdrop-blur-md">
              {/* Window Titlebar */}
              <div className="px-4 py-3 border-b border-navy-800 bg-navy-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                </div>
                <div className="text-[11px] font-mono text-navy-400 bg-navy-900 px-3 py-0.5 rounded border border-navy-800 truncate max-w-[240px]">
                  app.hirenova.io/jobs/python-developer
                </div>
                <div className="text-[10px] font-mono text-cyan-400">● LIVE</div>
              </div>

              {/* Product Header inside Mockup */}
              <div className="p-4 sm:p-5 border-b border-navy-800 bg-navy-900/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base text-white">
                        Python Developer
                      </h3>
                      <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                        REQ-204
                      </span>
                    </div>
                    <p className="text-xs text-navy-400 mt-0.5">
                      Mumbai / Remote · Engineering · Full-time
                    </p>
                  </div>

                  {/* Stat Chips */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <div className="px-2.5 py-1 rounded bg-navy-800/80 border border-navy-700 text-center">
                      <div className="text-[10px] text-navy-400 uppercase">Sourced</div>
                      <div className="font-bold text-white">184</div>
                    </div>
                    <div className="px-2.5 py-1 rounded bg-navy-800/80 border border-navy-700 text-center">
                      <div className="text-[10px] text-navy-400 uppercase">Scored</div>
                      <div className="font-bold text-cyan-400">132</div>
                    </div>
                    <div className="px-2.5 py-1 rounded bg-navy-800/80 border border-navy-700 text-center">
                      <div className="text-[10px] text-navy-400 uppercase">Shortlist</div>
                      <div className="font-bold text-violet-400">27</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Realistic Candidate Rows */}
              <div className="divide-y divide-navy-800/80">
                {/* Candidate 1 */}
                <div
                  onClick={() => onLaunchApp('result')}
                  className="p-3.5 sm:p-4 hover:bg-navy-800/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-violet-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      R
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-xs text-white truncate">
                          Candidate #2048
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">Python Dev</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['Python', 'SQL', 'Git', 'Django'].map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-navy-800 text-navy-300 border border-navy-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-display font-extrabold text-base text-cyan-400 tabular-nums">
                        87%
                      </span>
                      <span className="text-[9px] font-mono text-navy-400 uppercase">MATCH</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hidden sm:inline-block">
                      Strong alignment
                    </span>
                  </div>
                </div>

                {/* Candidate 2 */}
                <div
                  onClick={() => onLaunchApp('result')}
                  className="p-3.5 sm:p-4 hover:bg-navy-800/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-navy-800 text-violet-400 border border-violet-500/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      P
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-xs text-white truncate">
                          Candidate #1983
                        </span>
                        <span className="text-[10px] font-mono text-navy-400">Software Eng</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['Python', 'SQL', 'Flask'].map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-navy-800 text-navy-300 border border-navy-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-display font-extrabold text-base text-violet-400 tabular-nums">
                        82%
                      </span>
                      <span className="text-[9px] font-mono text-navy-400 uppercase">MATCH</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded border border-violet-500/40 bg-violet-950/40 text-violet-300 hidden sm:inline-block">
                      Strong alignment
                    </span>
                  </div>
                </div>

                {/* Candidate 3 */}
                <div
                  onClick={() => onLaunchApp('result')}
                  className="p-3.5 sm:p-4 hover:bg-navy-800/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-navy-800 text-navy-400 border border-navy-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      A
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-xs text-white truncate">
                          Candidate #1872
                        </span>
                        <span className="text-[10px] font-mono text-navy-400">Full Stack</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['Python', 'Git', 'REST API'].map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-navy-800 text-navy-300 border border-navy-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-display font-extrabold text-base text-navy-200 tabular-nums">
                        76%
                      </span>
                      <span className="text-[9px] font-mono text-navy-400 uppercase">MATCH</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded border border-navy-700 bg-navy-800 text-navy-300 hidden sm:inline-block">
                      Good alignment
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="p-3 border-t border-navy-800 bg-navy-950/70 flex items-center justify-between text-[11px] font-mono text-navy-400">
                <span>130–200 Profiles ranked per role</span>
                <span className="text-cyan-400 font-semibold">90% Screening time eliminated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST / CAPABILITY SIGNAL STRIP */}
      <section className="relative z-10 border-y border-navy-800 bg-navy-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 text-xs font-mono tracking-widest text-navy-400 uppercase">
            <span className="hover:text-white transition-colors">RESUME PARSING</span>
            <span className="text-navy-700">•</span>
            <span className="hover:text-cyan-400 transition-colors">SKILL MATCHING</span>
            <span className="text-navy-700">•</span>
            <span className="hover:text-white transition-colors">CANDIDATE RANKING</span>
            <span className="text-navy-700">•</span>
            <span className="hover:text-violet-400 transition-colors">ROLE CLASSIFICATION</span>
            <span className="text-navy-700">•</span>
            <span className="hover:text-white transition-colors">SCREENING ANALYTICS</span>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT STORY SECTION (Intervue + Flowmingo 3-step storytelling) */}
      <section id="how-it-works" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-violet-400">
            WORKFLOW ARCHITECTURE
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-white">
            FROM RESUME TO SHORTLIST.
          </h2>
          <p className="text-sm text-navy-300 max-w-lg mx-auto">
            Three precision steps convert raw candidate documents into actionable intelligence reports.
          </p>
        </div>

        {/* 3 Steps with Real Mini Product Interfaces */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 01 */}
          <div className="rounded-xl border border-navy-700/70 bg-navy-900/60 p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-colors group">
            <div>
              <div className="text-4xl font-display font-black text-navy-700 group-hover:text-cyan-400/40 transition-colors font-mono">
                01
              </div>
              <h3 className="font-display font-bold text-lg text-white mt-2">
                UPLOAD
              </h3>
              <p className="text-xs text-navy-400 mt-1">
                Candidate document enters the system in PDF, DOCX, or TXT format.
              </p>
            </div>

            {/* Mini UI: Upload & Tokens */}
            <div className="mt-6 p-4 rounded-lg bg-navy-950 border border-navy-800 text-left space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-white font-medium">resume_akash.pdf</span>
                <span className="text-cyan-400">142 KB</span>
              </div>
              <div className="w-full h-1 bg-navy-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-cyan-400" />
              </div>
              <div className="text-[10px] font-mono text-navy-400 truncate">
                Tokens: Python, Django, SQL, REST APIs, Git, Algorithms...
              </div>
            </div>
          </div>

          {/* Step 02 */}
          <div className="rounded-xl border border-navy-700/70 bg-navy-900/60 p-6 flex flex-col justify-between hover:border-violet-500/50 transition-colors group">
            <div>
              <div className="text-4xl font-display font-black text-navy-700 group-hover:text-violet-400/40 transition-colors font-mono">
                02
              </div>
              <h3 className="font-display font-bold text-lg text-white mt-2">
                ANALYZE
              </h3>
              <p className="text-xs text-navy-400 mt-1">
                Skills, domain category, and role similarity are vector-calculated.
              </p>
            </div>

            {/* Mini UI: Vectors & Classification */}
            <div className="mt-6 p-4 rounded-lg bg-navy-950 border border-navy-800 text-left space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-navy-400">Domain:</span>
                <span className="text-violet-300">INFORMATION-TECH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-400">TF-IDF Overlap:</span>
                <span className="text-cyan-300">78.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-400">Skill Alignment:</span>
                <span className="text-white font-semibold">87.5%</span>
              </div>
            </div>
          </div>

          {/* Step 03 */}
          <div className="rounded-xl border border-navy-700/70 bg-navy-900/60 p-6 flex flex-col justify-between hover:border-orange-500/50 transition-colors group">
            <div>
              <div className="text-4xl font-display font-black text-navy-700 group-hover:text-orange-400/40 transition-colors font-mono">
                03
              </div>
              <h3 className="font-display font-bold text-lg text-white mt-2">
                SHORTLIST
              </h3>
              <p className="text-xs text-navy-400 mt-1">
                Candidates are ranked by composite score with instant shortlist decisioning.
              </p>
            </div>

            {/* Mini UI: Ranking Badge */}
            <div className="mt-6 p-4 rounded-lg bg-navy-950 border border-navy-800 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-xs text-white">#2048 Ranked #1</span>
                <span className="text-sm font-extrabold font-display text-cyan-400">87.4%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-orange-300">Status: Shortlisted</span>
                <span className="text-navy-400">Score &gt; 50%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SCREENING SHOWCASE (Dark Cinematic Section: ONE RESUME. A COMPLETE SIGNAL.) */}
      <section id="screening" className="relative z-10 py-24 bg-navy-950/80 border-y border-navy-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              CANDIDATE INTELLIGENCE
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-white">
              ONE RESUME. A COMPLETE SIGNAL.
            </h2>
            <p className="text-sm text-navy-300 max-w-lg mx-auto">
              Every analyzed document generates a comprehensive recruiter dossier with evidence-based reasoning.
            </p>
          </div>

          {/* Dossier Card Mockup */}
          <div className="rounded-2xl border border-navy-700 bg-navy-900/90 shadow-2xl p-6 sm:p-8 backdrop-blur-md">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-navy-800">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-navy-400">
                  CANDIDATE ID: #2048 · AUDITED EVALUATION
                </div>
                <h3 className="font-display font-bold text-2xl text-white mt-1">
                  Candidate #2048 · Python Developer
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <RecommendationBadge recommendation="Strong alignment" size="sm" />
                <button
                  onClick={() => onLaunchApp('screening')}
                  className="px-3 py-1.5 text-xs font-mono text-white bg-navy-800 hover:bg-navy-700 border border-navy-600 rounded transition-colors"
                >
                  Test this candidate
                </button>
              </div>
            </div>

            {/* Score & Sub-Metric Strip */}
            <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-navy-800 items-center">
              {/* Large Score */}
              <div className="space-y-1">
                <div className="text-6xl font-display font-black text-cyan-400 tracking-tight tabular-nums">
                  87.4<span className="text-3xl font-light text-navy-400">%</span>
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-navy-300 font-semibold">
                  COMPOSITE MATCH SCORE
                </div>
                <p className="text-[11px] text-navy-400">
                  Calculated from 40% role similarity + 60% skill alignment.
                </p>
              </div>

              {/* Similarity */}
              <div className="p-4 rounded-lg bg-navy-950 border border-navy-800 space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-navy-400">ROLE SIMILARITY</span>
                  <span className="font-bold text-white tabular-nums">78.2%</span>
                </div>
                <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: '78.2%' }} />
                </div>
                <span className="text-[10px] text-navy-500 font-mono block">
                  TF-IDF vector cosine overlap
                </span>
              </div>

              {/* Skill Alignment */}
              <div className="p-4 rounded-lg bg-navy-950 border border-navy-800 space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-navy-400">SKILL ALIGNMENT</span>
                  <span className="font-bold text-violet-400 tabular-nums">93.3%</span>
                </div>
                <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-400" style={{ width: '93.3%' }} />
                </div>
                <span className="text-[10px] text-navy-500 font-mono block">
                  7 of 8 mandatory technical skills detected
                </span>
              </div>
            </div>

            {/* Skills & Evidence */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched vs Missing */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-medium mb-2">
                    MATCHED SKILLS (5)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Python', 'SQL', 'Git', 'Django', 'Data Structures'].map(s => (
                      <span key={s} className="px-2.5 py-1 rounded text-xs font-mono bg-cyan-950/60 text-cyan-200 border border-cyan-500/30">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-navy-400 font-medium mb-2">
                    MISSING SKILLS (1)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['REST API'].map(s => (
                      <span key={s} className="px-2.5 py-1 rounded text-xs font-mono bg-navy-950 text-navy-400 border border-navy-800 line-through">
                        &minus; {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Explainability Block */}
              <div className="p-4 rounded-lg bg-navy-950 border border-navy-800 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  WHY THIS MATCH?
                </div>
                <div className="space-y-2 text-xs text-navy-300 leading-relaxed font-sans">
                  <p>
                    <strong className="text-white">Skill Verification: </strong> Candidate profile demonstrates strong proficiency in core backend Python frameworks, SQL query architecture, and version control.
                  </p>
                  <p>
                    <strong className="text-white">Classification: </strong> LinearSVC model classified resume into <span className="font-mono text-cyan-300">ENGINEERING</span> with high confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CANDIDATE RANKING SHOWCASE (High-contrast light section: STOP READING RESUMES ONE BY ONE.) */}
      <section id="ranking" className="relative z-10 py-24 bg-[#F8F9FA] text-[#0F172A] border-y border-navy-700/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-violet-600 font-semibold">
              HIGH DENSITY TALENT PIPELINE
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-[#0F172A]">
              STOP READING RESUMES ONE BY ONE.
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Sort and prioritize entire applicant cohorts by verified technical competencies and match suitability.
            </p>
          </div>

          {/* High-Contrast Table Container */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5 w-16 text-center">RANK</th>
                    <th className="py-3 px-5">CANDIDATE</th>
                    <th className="py-3 px-5">ROLE</th>
                    <th className="py-3 px-5 text-right w-28">MATCH</th>
                    <th className="py-3 px-5">SKILLS</th>
                    <th className="py-3 px-5 text-right w-36">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {[
                    { rank: 1, name: 'Candidate #2048', role: 'Python Developer', score: 87, skills: ['Python', 'SQL', 'Git', 'Django'], status: 'Strong alignment', color: 'text-cyan-600' },
                    { rank: 2, name: 'Candidate #1983', role: 'Software Engineer', score: 82, skills: ['Python', 'SQL', 'Flask'], status: 'Strong alignment', color: 'text-violet-600' },
                    { rank: 3, name: 'Candidate #1872', role: 'Full Stack Engineer', score: 76, skills: ['Python', 'Git', 'REST API'], status: 'Good alignment', color: 'text-slate-800' },
                    { rank: 4, name: 'Candidate #1650', role: 'Data & Backend Specialist', score: 71, skills: ['Python', 'SQL', 'Docker'], status: 'Good alignment', color: 'text-slate-800' },
                    { rank: 5, name: 'Candidate #1540', role: 'Python Developer', score: 68, skills: ['Python', 'Data Structures'], status: 'Moderate alignment', color: 'text-orange-600' },
                  ].map((row) => (
                    <tr key={row.rank} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-400">
                        #{row.rank}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 font-display">{row.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">Verified Profile</div>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-700">
                        {row.role}
                      </td>
                      <td className="py-3.5 px-5 text-right font-display font-extrabold text-base tabular-nums">
                        <span className={row.color}>{row.score}%</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap gap-1">
                          {row.skills.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200 bg-slate-50 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          <span>{row.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Showing Top 5 of 2,484 analyzed candidates</span>
              <button
                onClick={() => onLaunchApp('rankings')}
                className="text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1"
              >
                <span>View full rankings in workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. JOB INTELLIGENCE SECTION (ONE ROLE. EVERY CANDIDATE.) */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Role Specification */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-mono uppercase tracking-widest text-orange-400">
              JOB-CENTRIC SCREENING
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-white leading-tight">
              ONE ROLE.<br />
              EVERY CANDIDATE.
            </h2>
            <p className="text-sm text-navy-300 leading-relaxed font-sans">
              Map job descriptions to mandatory skills and let HireNova measure applicant fit without bias or keyword stuffing tricks.
            </p>

            <div className="p-5 rounded-xl border border-navy-700 bg-navy-900/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-white text-sm">Python Developer</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">REQ-204</span>
              </div>
              <div className="text-xs text-navy-400">
                Required Technical Competencies (5):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Python', 'Django', 'SQL', 'Git', 'REST API'].map(s => (
                  <span key={s} className="px-2 py-1 rounded text-xs font-mono bg-navy-800 text-cyan-200 border border-navy-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Ranked Candidate Pool Card */}
          <div className="lg:col-span-7 rounded-xl border border-navy-700 bg-navy-900/90 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <span className="font-display font-semibold text-sm text-white">
                Matched Talent Pool for REQ-204
              </span>
              <span className="text-xs font-mono text-cyan-400">
                184 Candidates Evaluated
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Candidate #2048', match: '87.4%', verified: '5 of 5 skills', status: 'Shortlisted' },
                { name: 'Candidate #1983', match: '82.0%', verified: '4 of 5 skills', status: 'Shortlisted' },
                { name: 'Candidate #1872', match: '76.5%', verified: '4 of 5 skills', status: 'Review' },
              ].map((c, i) => (
                <div key={i} className="p-3.5 rounded bg-navy-950 border border-navy-800 flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold text-xs text-white">{c.name}</div>
                    <div className="text-[10px] font-mono text-navy-400 mt-0.5">{c.verified} detected</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-extrabold text-sm text-cyan-400 tabular-nums">{c.match}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-navy-800 border border-navy-700 text-navy-300">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onLaunchApp('jobs')}
              className="w-full py-2.5 text-xs font-semibold text-white bg-navy-800 hover:bg-navy-750 border border-navy-700 rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage Job Profiles &amp; Criteria</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 8. ANALYTICS SECTION (SEE THE SIGNAL BEHIND THE SHORTLIST.) */}
      <section id="analytics" className="relative z-10 py-24 bg-navy-950/90 border-t border-navy-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              CORPUS INSIGHTS
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-white">
              SEE THE SIGNAL BEHIND THE SHORTLIST.
            </h2>
            <p className="text-sm text-navy-300 max-w-lg mx-auto">
              Real backend distribution analytics across 2,484 resumes and 24 industry categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-navy-800 bg-navy-900/60 text-center space-y-1">
              <div className="text-4xl font-display font-black text-white tabular-nums">2,484</div>
              <div className="text-xs font-mono text-navy-400 uppercase">Analyzed Resumes</div>
            </div>
            <div className="p-6 rounded-xl border border-navy-800 bg-navy-900/60 text-center space-y-1">
              <div className="text-4xl font-display font-black text-cyan-400 tabular-nums">24</div>
              <div className="text-xs font-mono text-navy-400 uppercase">Career Domains</div>
            </div>
            <div className="p-6 rounded-xl border border-navy-800 bg-navy-900/60 text-center space-y-1">
              <div className="text-4xl font-display font-black text-violet-400 tabular-nums">94.2%</div>
              <div className="text-xs font-mono text-navy-400 uppercase">Peak Match Score</div>
            </div>
            <div className="p-6 rounded-xl border border-navy-800 bg-navy-900/60 text-center space-y-1">
              <div className="text-4xl font-display font-black text-orange-400 tabular-nums">184</div>
              <div className="text-xs font-mono text-navy-400 uppercase">Shortlisted Candidates</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. DISTINCTIVE FEATURE GRID (6 varied layout sections) */}
      <section id="product" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            ENGINE CAPABILITIES
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-white">
            BUILT FOR MODERN RECRUITERS.
          </h2>
        </div>

        {/* 6 varied features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 (Large - Spans 2 cols on md) */}
          <div className="md:col-span-2 rounded-xl border border-navy-700 bg-navy-900/80 p-8 space-y-4">
            <Cpu className="w-8 h-8 text-cyan-400 stroke-[1.5]" />
            <h3 className="font-display font-bold text-xl text-white">
              LinearSVC Multi-Class Classifier
            </h3>
            <p className="text-sm text-navy-300 leading-relaxed max-w-xl">
              Trained on 24 distinct professional sectors—including Engineering, Information Technology, Finance, Healthcare, and Operations—to categorize candidate backgrounds automatically.
            </p>
          </div>

          {/* Feature 2 (Small) */}
          <div className="rounded-xl border border-navy-700 bg-navy-900/80 p-8 space-y-4">
            <ScanLine className="w-8 h-8 text-violet-400 stroke-[1.5]" />
            <h3 className="font-display font-bold text-xl text-white">
              Multi-Format Parser
            </h3>
            <p className="text-sm text-navy-300 leading-relaxed">
              Accepts PDF, DOCX, and plain text files with automated token extraction and text normalization.
            </p>
          </div>

          {/* Feature 3 (Small) */}
          <div className="rounded-xl border border-navy-700 bg-navy-900/80 p-8 space-y-4">
            <ShieldCheck className="w-8 h-8 text-orange-400 stroke-[1.5]" />
            <h3 className="font-display font-bold text-xl text-white">
              Deterministic Scoring
            </h3>
            <p className="text-sm text-navy-300 leading-relaxed">
              40% TF-IDF Cosine Similarity + 60% Mandatory Skill Match ensures transparent, verifiable scoring.
            </p>
          </div>

          {/* Feature 4 (Large - Spans 2 cols on md) */}
          <div className="md:col-span-2 rounded-xl border border-navy-700 bg-navy-900/80 p-8 space-y-4">
            <Download className="w-8 h-8 text-cyan-400 stroke-[1.5]" />
            <h3 className="font-display font-bold text-xl text-white">
              1-Click Shortlist &amp; CSV Data Export
            </h3>
            <p className="text-sm text-navy-300 leading-relaxed max-w-xl">
              Export ranked candidate pools, verified technical competencies, and screening audit records to CSV directly for ATS sync or recruiter review.
            </p>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-navy-950 to-void border-t border-navy-800 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="font-display font-black text-4xl sm:text-6xl tracking-tight text-white">
            YOUR NEXT SHORTLIST<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
              STARTS HERE.
            </span>
          </h2>
          <p className="text-base text-navy-300 max-w-xl mx-auto font-sans">
            Ready to evaluate candidates faster with candidate intelligence? Launch the recruiter workspace or screen a test resume right now.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onLaunchApp('screening')}
              className="px-8 py-4 text-sm font-semibold text-navy-950 bg-cyan-400 hover:bg-cyan-300 rounded font-display transition-all shadow-[0_0_30px_rgba(79,209,255,0.4)] flex items-center gap-2"
            >
              <span>Start Screening Now</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => onLaunchApp('dashboard')}
              className="px-8 py-4 text-sm font-medium text-navy-200 hover:text-white bg-navy-900 border border-navy-700 rounded transition-colors"
            >
              Explore HireNova Workspace
            </button>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="relative z-10 border-t border-navy-800 bg-navy-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-navy-500">
          <div>
            HireNova — Next-Gen Recruitment © 2026. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onLaunchApp('dashboard')} className="hover:text-cyan-400 transition-colors">
              Workspace
            </button>
            <span>•</span>
            <button onClick={() => onLaunchApp('screening')} className="hover:text-cyan-400 transition-colors">
              Screening
            </button>
            <span>•</span>
            <button onClick={() => onLaunchApp('settings')} className="hover:text-cyan-400 transition-colors">
              System Telemetry
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
