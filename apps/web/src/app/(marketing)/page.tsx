'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/stores/auth-store';
import {
  Compass, Sparkles, MapPin, Navigation, Heart, Camera, Wallet,
  ArrowRight, Shield, Zap, Search, Star, Coffee, Utensils,
  Landmark, Hotel, Sun, Moon, Users, ChevronRight,
} from 'lucide-react';

/* ── Animation helpers ── */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Malaysian destinations showcase ── */
const DESTINATIONS = [
  { name: 'Kuala Lumpur', tag: 'City & Culture', emoji: '🏙️', color: 'from-amber-500 to-orange-600' },
  { name: 'Penang', tag: 'Food Paradise', emoji: '🍜', color: 'from-red-500 to-rose-600' },
  { name: 'Langkawi', tag: 'Island Escape', emoji: '🏝️', color: 'from-cyan-500 to-blue-600' },
  { name: 'Kota Kinabalu', tag: 'Nature & Adventure', emoji: '🏔️', color: 'from-emerald-500 to-teal-600' },
  { name: 'Melaka', tag: 'Heritage Trail', emoji: '🏛️', color: 'from-purple-500 to-violet-600' },
  { name: 'Cameron Highlands', tag: 'Cool Retreat', emoji: '🍃', color: 'from-green-500 to-emerald-600' },
];

/* ── Core capabilities ── */
const CAPABILITIES = [
  { icon: Sparkles, title: 'AI Trip Planner', desc: 'Generate complete multi-day itineraries with routes, meals, budget breakdowns, and hidden gems — personalized to your travel style in seconds.', stat: '8 days max', statLabel: 'Trip length' },
  { icon: Navigation, title: 'Smart Navigation', desc: 'Compare walking, Grab, driving, MRT, LRT, KTM, flights, and ferries — with real costs, ETAs, and live traffic conditions.', stat: '14', statLabel: 'Transport modes' },
  { icon: Search, title: 'Discovery Engine', desc: 'Real-time GPS finds restaurants, attractions, viewpoints, and local secrets within your radius. Halal filters, price levels, photo spots included.', stat: '5km', statLabel: 'Search radius' },
  { icon: Heart, title: 'Date Planner', desc: 'AI-curated romantic experiences by relationship stage. From first dates to anniversary celebrations — every venue scored for romance, conversation, and photo potential.', stat: '5 stages', statLabel: 'Relationship types' },
  { icon: Wallet, title: 'Travel Wallet', desc: 'Set savings goals, track contributions, get AI coaching on daily targets. Solo, couple, or group wallets with milestone celebrations.', stat: 'RM 0', statLabel: 'Minimum to start' },
  { icon: Camera, title: 'Memory Vault', desc: 'Upload photos, create albums, write journals, and build your travel timeline. Your entire Malaysian adventure — beautifully organized.', stat: 'Unlimited', statLabel: 'Photo storage' },
];

/* ── Landing Page ── */
function LandingPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="bg-[#FAFAF8]">
      {/* ═══════════════════════════════════════════════════════════════
          NAVIGATION — Clean, minimal, premium
          ═══════════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-[#FAFAF8]/80 backdrop-blur-xl border-b border-[#E8EDE4]/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#315B43] to-[#5E876A] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="text-[18px] font-bold text-[#171717] tracking-tight">ExploreMY</span>
            <span className="text-[10px] font-extrabold text-[#315B43] bg-[#E8F2EB] px-2 py-0.5 rounded-full tracking-wide">AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[14px] font-semibold text-[#6F6F6F] hover:text-[#171717] transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/register" className="text-[14px] font-bold text-white bg-[#315B43] hover:bg-[#234530] transition-all px-5 py-2.5 rounded-full shadow-sm hover:shadow-md">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Statement piece
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-[#315B43]/4 via-[#D4A95F]/3 to-transparent blur-[180px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-5 pt-24 pb-12 md:pt-32 md:pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8EDE4] shadow-sm mb-8"
          >
            <Sparkles className="h-4 w-4 text-[#D4A95F]" />
            <span className="text-[13px] font-semibold text-[#6F6F6F]">Malaysia's Most Advanced Travel AI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[48px] md:text-[72px] font-extrabold text-[#171717] tracking-[-0.02em] leading-[1.05]"
          >
            Explore every corner<br />
            <span className="bg-gradient-to-r from-[#315B43] via-[#5E876A] to-[#D4A95F] bg-clip-text text-transparent">
              of Malaysia
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-[18px] md:text-[20px] text-[#6F6F6F] leading-relaxed max-w-2xl mx-auto"
          >
            One app that replaces Google Maps, TripAdvisor, and your notes app.
            AI-powered itineraries, real-time navigation, budget tracking, and memory keeping — purpose-built for Malaysian travel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-[58px] px-12 bg-[#315B43] text-white font-bold text-[17px] rounded-full hover:bg-[#234530] transition-all shadow-lg shadow-[#315B43]/20 hover:shadow-xl hover:-translate-y-0.5">
              Start Exploring Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/weekend-planner"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-[58px] px-10 bg-white text-[#171717] font-semibold text-[17px] rounded-full border border-[#E8EDE4] hover:border-[#315B43] hover:text-[#315B43] transition-all hover:-translate-y-0.5">
              Plan a Trip <Compass className="h-5 w-5" />
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-[14px] text-[#9E9E9E]"
          >
            Free forever. No credit card. Already exploring? <Link href="/login" className="text-[#315B43] font-semibold hover:underline">Sign in</Link>
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          DESTINATION GRID — Visual showcase
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <FadeIn className="text-center mb-10">
          <p className="text-[13px] font-bold text-[#315B43] uppercase tracking-widest mb-3">Explore Malaysia</p>
          <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#171717] tracking-tight">
            Every state. Every island.<br />Every hidden corner.
          </h2>
        </FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DESTINATIONS.map((d, i) => (
            <FadeIn key={d.name} delay={i * 0.06}>
              <Link href={`/weekend-planner?dest=${encodeURIComponent(d.name)}`}
                className="group relative block rounded-2xl overflow-hidden h-36 md:h-44 bg-white border border-[#E8EDE4]/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${d.color} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  <div>
                    <span className="text-3xl block mb-2">{d.emoji}</span>
                    <h3 className="text-[16px] font-extrabold text-[#171717] group-hover:text-[#315B43] transition-colors">{d.name}</h3>
                  </div>
                  <p className="text-[11px] font-semibold text-[#9E9E9E] uppercase tracking-wider">{d.tag}</p>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CAPABILITIES — Detailed feature cards
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F3F5F0] py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <p className="text-[13px] font-bold text-[#315B43] uppercase tracking-widest mb-3">Everything You Need</p>
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#171717] tracking-tight">
              Six powerful tools.<br />One seamless experience.
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((f, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8EDE4]/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#E8F2EB] flex items-center justify-center">
                      <f.icon className="h-5 w-5 text-[#315B43]" />
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-extrabold text-[#171717] leading-none">{f.stat}</p>
                      <p className="text-[10px] text-[#9E9E9E] uppercase tracking-wider mt-0.5">{f.statLabel}</p>
                    </div>
                  </div>
                  <h3 className="text-[17px] font-bold text-[#171717] mb-2">{f.title}</h3>
                  <p className="text-[13px] text-[#6F6F6F] leading-relaxed flex-1">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS — Three simple steps
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <p className="text-[13px] font-bold text-[#315B43] uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#171717] tracking-tight">
              Three steps to your<br />perfect Malaysian trip
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: MapPin, title: 'Pick your destination', desc: 'Choose any city in Malaysia — from KL to Semporna. Set your budget, dates, and travel style in seconds.' },
              { step: '02', icon: Sparkles, title: 'AI builds your plan', desc: 'Get a complete day-by-day itinerary with activities, restaurants, transport, costs, and hidden gems.', },
              { step: '03', icon: Heart, title: 'Travel & remember', desc: 'Navigate in real-time, save photos and journals, track your budget. Your entire trip — beautifully preserved.', },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="text-center group">
                  <div className="w-20 h-20 rounded-3xl bg-white border border-[#E8EDE4]/50 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:shadow-md group-hover:border-[#315B43]/20 transition-all duration-300">
                    <s.icon className="h-9 w-9 text-[#315B43]" />
                  </div>
                  <p className="text-[12px] font-extrabold text-[#315B43] tracking-widest mb-2">STEP {s.step}</p>
                  <h3 className="text-[20px] font-bold text-[#171717] mb-2">{s.title}</h3>
                  <p className="text-[14px] text-[#6F6F6F] leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TRUST — What makes us different
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F3F5F0] py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#171717] tracking-tight">
              Built different
            </h2>
            <p className="mt-4 text-[17px] text-[#6F6F6F]">What makes ExploreMY unlike anything else</p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { emoji: '🇲🇾', title: 'Malaysia-First Design', desc: 'Every feature — from halal food filters to LRT route planning — is built specifically for Malaysian travelers. Not a generic travel app translated to BM.' },
              { emoji: '🧠', title: 'Real AI, Real Plans', desc: 'Our AI generates actual itineraries with real Malaysian venues — not templates. Weather-aware, budget-optimized, and personalized to your travel DNA.' },
              { emoji: '💰', title: 'Complete Budget Control', desc: 'Every plan includes a detailed budget breakdown: fuel, tolls, parking, food, activities, hotels. No surprises. Track savings with AI coaching.' },
              { emoji: '🔒', title: 'Privacy by Default', desc: 'Your data stays yours. No ads, no selling data to travel agencies, no creepy tracking. Built for travelers, not advertisers.' },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8EDE4]/30 h-full hover:shadow-md transition-shadow">
                  <span className="text-3xl block mb-3">{item.emoji}</span>
                  <h3 className="text-[17px] font-bold text-[#171717] mb-2">{item.title}</h3>
                  <p className="text-[13px] text-[#6F6F6F] leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA — Bold, confident, warm
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-5 py-20 md:py-28">
        <FadeIn>
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#1A3323] via-[#315B43] to-[#234530] p-10 md:p-16 text-center text-white">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A95F]/8 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5E876A]/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-[36px] md:text-[48px] font-extrabold tracking-[-0.02em] leading-tight">
                Your Malaysian<br />adventure starts here
              </h2>
              <p className="mt-5 text-[18px] text-white/60 leading-relaxed max-w-lg mx-auto">
                No ads. No credit card. No nonsense. Just the most powerful travel AI ever built for Malaysia.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-[58px] px-12 bg-white text-[#315B43] font-bold text-[17px] rounded-full hover:bg-[#F7F9F5] transition-all shadow-lg hover:-translate-y-0.5">
                  Create Free Account <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-[58px] px-8 text-white/70 font-semibold text-[16px] rounded-full border border-white/20 hover:bg-white/10 hover:text-white transition-all">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER — Minimal, elegant
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#E8EDE4] bg-white py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#315B43]" />
            <span className="text-[14px] font-bold text-[#171717]">ExploreMY AI</span>
            <span className="text-[12px] text-[#9E9E9E]">· Made in Malaysia 🇲🇾</span>
          </div>
          <div className="flex items-center gap-5 text-[12px] text-[#6F6F6F]">
            <Link href="/explore" className="hover:text-[#171717] transition-colors">Explore</Link>
            <Link href="/weekend-planner" className="hover:text-[#171717] transition-colors">Plan Trip</Link>
            <Link href="/date" className="hover:text-[#171717] transition-colors">Date Planner</Link>
            <Link href="/wallet" className="hover:text-[#171717] transition-colors">Wallet</Link>
            <Link href="/login" className="hover:text-[#171717] transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Main Page ── */
export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#315B43]/20 border-t-[#315B43] animate-spin" />
      </div>
    );
  }

  return <LandingPage isAuthenticated={isAuthenticated} />;
}
