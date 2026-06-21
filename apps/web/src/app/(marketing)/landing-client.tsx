'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/stores/auth-store';
import {
  Compass, Sparkles, MapPin, Star, Heart, Navigation,
  Search, Camera, Wallet, ChevronRight, ArrowRight,
  Shield, Zap, Globe, Users, Trophy, Coffee,
  Sun, Cloud, TrendingUp, Check,
} from 'lucide-react';

/* ── Fade-in animation helper ── */
function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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

/* ── Navigation ── */
function Nav({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <nav className="sticky top-0 z-50 bg-[#F7F9F5]/80 backdrop-blur-xl border-b border-[#E8EDE4]/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ExploreMY Home">
          <div className="w-9 h-9 rounded-xl bg-[#315B43] flex items-center justify-center shadow-sm">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <span className="text-[18px] font-bold text-[#171717] tracking-tight">
            ExploreMY
          </span>
          <span className="text-[11px] font-bold text-[#315B43] bg-[#E8F2EB] px-2 py-0.5 rounded-full">
            AI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/explore"
              className="text-[14px] font-bold text-white bg-[#315B43] hover:bg-[#234530] transition-colors px-5 py-2.5 rounded-full"
            >
              Go to App
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[14px] font-semibold text-[#6F6F6F] hover:text-[#171717] transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-[14px] font-bold text-white bg-[#315B43] hover:bg-[#234530] transition-colors px-5 py-2.5 rounded-full"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ── */
function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#315B43]/3 blur-[150px] rounded-full pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#D4A95F]/4 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-4xl mx-auto px-5 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8EDE4] shadow-sm mb-8"
        >
          <Sparkles className="h-4 w-4 text-[#D4A95F]" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-[#6F6F6F]">
            Malaysia&apos;s Intelligent Travel Platform
          </span>
        </motion.div>

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[44px] md:text-[64px] font-extrabold text-[#171717] tracking-tight leading-[1.05]"
        >
          Discover Malaysia<br />
          <span className="text-[#315B43]">Like Never Before</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-[17px] md:text-[19px] text-[#6F6F6F] leading-relaxed max-w-xl mx-auto"
        >
          AI-powered travel intelligence that replaces Google Maps, TripAdvisor, and
          ChatGPT — built specifically for exploring every corner of Malaysia.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {isAuthenticated ? (
            <Link
              href="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-[56px] px-10 bg-[#315B43] text-white font-bold text-[17px] rounded-full hover:bg-[#234530] transition-all shadow-lg shadow-[#315B43]/20 hover:shadow-xl hover:shadow-[#315B43]/30"
            >
              Go to App <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-[56px] px-10 bg-[#315B43] text-white font-bold text-[17px] rounded-full hover:bg-[#234530] transition-all shadow-lg shadow-[#315B43]/20 hover:shadow-xl hover:shadow-[#315B43]/30"
              >
                Start Exploring Free{' '}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-[56px] px-10 bg-white text-[#171717] font-semibold text-[17px] rounded-full border border-[#E8EDE4] hover:border-[#315B43] hover:text-[#315B43] transition-all"
              >
                See Demo <Compass className="h-5 w-5" aria-hidden="true" />
              </Link>
            </>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-[13px] text-[#9E9E9E]"
        >
          {isAuthenticated ? (
            <Link href="/profile" className="text-[#315B43] font-semibold hover:underline">
              Go to your profile
            </Link>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/login" className="text-[#315B43] font-semibold hover:underline">
                Sign in
              </Link>
            </>
          )}
        </motion.p>
      </div>
    </section>
  );
}

/* ── Stats ── */
function StatsSection() {
  return (
    <section className="max-w-3xl mx-auto px-5 pb-20" aria-label="Platform statistics">
      <FadeIn>
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E8EDE4]/50">
          <dl className="grid grid-cols-3 gap-6 text-center">
            {[
              { v: '10,000+', l: 'Places Mapped' },
              { v: '500+', l: 'Hidden Gems' },
              { v: '14', l: 'Transport Modes' },
            ].map((s) => (
              <div key={s.l}>
                <dt className="text-[28px] md:text-[36px] font-extrabold text-[#171717] tracking-tight">
                  {s.v}
                </dt>
                <dd className="text-[14px] text-[#6F6F6F] font-medium mt-1">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </FadeIn>
    </section>
  );
}

/* ── Features ── */
function FeaturesSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 pb-24" aria-labelledby="features-heading">
      <FadeIn className="text-center mb-14">
        <p className="text-[13px] font-bold text-[#315B43] uppercase tracking-widest mb-3">
          Everything in One App
        </p>
        <h2 id="features-heading" className="text-[32px] md:text-[40px] font-extrabold text-[#171717] tracking-tight">
          No more switching<br />between 5 different apps
        </h2>
      </FadeIn>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: MapPin,
            title: 'Smart Discovery',
            desc: 'Real-time GPS finds food, attractions, and hidden gems within your radius. One tap to navigate.',
            color: '#315B43',
            bg: '#E8F2EB',
          },
          {
            icon: Navigation,
            title: 'All Transport Modes',
            desc: 'Compare walking, Grab, MRT, LRT, KTM, flights, ferries — with real costs and ETAs.',
            color: '#B8893A',
            bg: '#FBF4E5',
          },
          {
            icon: Sparkles,
            title: 'AI Trip Planner',
            desc: 'Generate complete weekend itineraries with routes, meals, costs — personalized to your style.',
            color: '#5E876A',
            bg: '#EDF4EF',
          },
          {
            icon: Star,
            title: 'Hidden Gems Engine',
            desc: 'Our algorithm surfaces places tourists miss — street stalls, viewpoints, secret waterfalls.',
            color: '#D4736A',
            bg: '#FDF0EF',
          },
          {
            icon: Coffee,
            title: 'Food Intelligence',
            desc: 'Halal filters, hawker stalls, food trails. From RM5 nasi lemak to fine dining.',
            color: '#315B43',
            bg: '#E8F2EB',
          },
          {
            icon: Shield,
            title: 'Verified Reviews',
            desc: 'Real reviews from verified travelers. No fake ratings. No paid promotions.',
            color: '#8B6F4E',
            bg: '#F5F0E8',
          },
        ].map((f, i) => (
          <FadeIn key={i} delay={i * 0.06}>
            <article className="bg-white rounded-[28px] p-6 shadow-sm border border-[#E8EDE4]/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: f.bg }}
              >
                <f.icon className="h-6 w-6" style={{ color: f.color }} aria-hidden="true" />
              </div>
              <h3 className="text-[18px] font-bold text-[#171717] mb-2">{f.title}</h3>
              <p className="text-[14px] text-[#6F6F6F] leading-relaxed">{f.desc}</p>
            </article>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

/* ── How It Works ── */
function HowItWorks() {
  return (
    <section className="bg-[#EDF3EA] py-20 md:py-28" aria-labelledby="how-heading">
      <div className="max-w-4xl mx-auto px-5">
        <FadeIn className="text-center mb-14">
          <p className="text-[13px] font-bold text-[#315B43] uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 id="how-heading" className="text-[32px] md:text-[40px] font-extrabold text-[#171717] tracking-tight">
            Three steps to your<br />perfect adventure
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              icon: Search,
              title: 'Tell us your vibe',
              desc: 'Share your budget, travel style, and dates. Foodie? Adventurer? Romantic? We adapt.',
            },
            {
              step: '02',
              icon: Sparkles,
              title: 'AI builds your plan',
              desc: 'Our AI generates a complete itinerary — where to go, eat, stay, and how to get there.',
            },
            {
              step: '03',
              icon: Compass,
              title: 'Explore with confidence',
              desc: 'Navigate in real-time, track your budget, save memories. All in one app.',
            },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <s.icon className="h-8 w-8 text-[#315B43]" aria-hidden="true" />
                </div>
                <p className="text-[12px] font-extrabold text-[#315B43] tracking-widest mb-2">
                  {s.step}
                </p>
                <h3 className="text-[20px] font-bold text-[#171717] mb-2">{s.title}</h3>
                <p className="text-[14px] text-[#6F6F6F] leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Social Proof ── */
function SocialProof() {
  return (
    <section className="max-w-4xl mx-auto px-5 py-20 md:py-28 text-center" aria-label="Testimonial">
      <FadeIn>
        <div className="flex items-center justify-center gap-1 mb-4" aria-label="5 out of 5 stars">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className="h-5 w-5 text-[#D4A95F]"
              fill="#D4A95F"
              aria-hidden="true"
            />
          ))}
        </div>
        <blockquote className="text-[22px] md:text-[28px] font-bold text-[#171717] leading-snug max-w-2xl mx-auto">
          &quot;Finally — an app that actually understands{' '}
          <span className="text-[#315B43]">Malaysian travel</span>. It planned my entire
          Penang weekend in 30 seconds.&quot;
        </blockquote>
        <cite className="not-italic">
          <p className="mt-6 text-[15px] font-semibold text-[#171717]">Sarah R.</p>
          <p className="text-[13px] text-[#6F6F6F]">Verified Explorer · 12 trips planned</p>
        </cite>
      </FadeIn>
    </section>
  );
}

/* ── Final CTA ── */
function FinalCTA({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="max-w-3xl mx-auto px-5 pb-20 md:pb-28" aria-labelledby="cta-heading">
      <FadeIn>
        <div className="bg-[#315B43] rounded-[36px] p-10 md:p-14 text-center text-white relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-[#D4A95F]/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative z-10">
            <h2 id="cta-heading" className="text-[32px] md:text-[40px] font-extrabold tracking-tight leading-tight">
              Ready to fall in love
              <br />
              with Malaysia?
            </h2>
            <p className="mt-4 text-[17px] text-white/70 leading-relaxed max-w-md mx-auto">
              Your AI travel companion is ready. Free forever. No credit card needed.
            </p>
            {isAuthenticated ? (
              <Link
                href="/explore"
                className="mt-8 inline-flex items-center gap-2 h-[56px] px-10 bg-white text-[#315B43] font-bold text-[17px] rounded-full hover:bg-[#F7F9F5] transition-all shadow-lg"
              >
                Explore Now <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center gap-2 h-[56px] px-10 bg-white text-[#315B43] font-bold text-[17px] rounded-full hover:bg-[#F7F9F5] transition-all shadow-lg"
                >
                  Start Your Journey{' '}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <p className="mt-4 text-[13px] text-white/50">
                  Already exploring?{' '}
                  <Link
                    href="/login"
                    className="text-white/80 font-semibold hover:text-white underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="border-t border-[#E8EDE4] bg-white py-10" role="contentinfo">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2" aria-label="ExploreMY Home">
            <Compass className="h-5 w-5 text-[#315B43]" aria-hidden="true" />
            <span className="text-[15px] font-bold text-[#171717]">ExploreMY AI</span>
          </Link>
          <nav className="flex items-center gap-6 text-[13px] text-[#6F6F6F]" aria-label="Footer navigation">
            <Link href="/explore" className="hover:text-[#171717] transition-colors">
              Explore
            </Link>
            <Link href="/weekend-planner" className="hover:text-[#171717] transition-colors">
              Plan Trip
            </Link>
            <Link href="/search" className="hover:text-[#171717] transition-colors">
              Search
            </Link>
            <Link href="/login" className="hover:text-[#171717] transition-colors">
              Sign In
            </Link>
          </nav>
          <p className="text-[12px] text-[#9E9E9E]">
            © {new Date().getFullYear()} ExploreMY. Made in Malaysia 🇲🇾
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── Main Landing Page Client Component ── */
export function LandingPageClient() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div
        className="min-h-screen bg-[#F7F9F5] flex items-center justify-center"
        role="status"
        aria-label="Loading"
      >
        <div className="w-10 h-10 rounded-full border-2 border-[#315B43]/20 border-t-[#315B43] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9F5]">
      <Nav isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <SocialProof />
      <FinalCTA isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
}
