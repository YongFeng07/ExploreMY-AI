'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── PlaceCard ── */
export function PlaceCard({ image, name, category, rating, distance, cost, onClick, className = '' }: {
  image: string; name: string; category?: string; rating?: number; distance?: string; cost?: string; onClick?: () => void; className?: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} onClick={onClick}
      className={`card-media group ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-bg-secondary)]">
        <img src={image} alt={name} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={e => { (e.target as any).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23EDF3EA"><text x="50%" y="50%" dy=".3em" text-anchor="middle" font-size="40">📷</text></svg>'; }} />
        <div className="absolute inset-0 photo-overlay-bottom" />
        <div className="absolute top-3 right-3"><SaveBtn /></div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {category && <span className="badge badge-green mb-1.5 inline-block">{category}</span>}
          <h3 className="text-white font-semibold text-[17px] leading-tight">{name}</h3>
          <div className="flex items-center gap-3 mt-1">
            {rating && <span className="text-white/85 text-[13px] font-medium">★ {rating}</span>}
            {distance && <span className="text-white/75 text-[13px]">{distance}</span>}
            {cost && <span className="text-white/85 text-[13px] font-medium ml-auto">{cost}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── SaveBtn ── */
export function SaveBtn({ saved = false, onToggle }: { saved?: boolean; onToggle?: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onToggle?.(); }}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors backdrop-blur-md ${saved ? 'bg-[var(--color-gold)] text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </motion.button>
  );
}

/* ── StatPill ── */
export function StatPill({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="card-filled text-center py-5 px-3">
      <span className="text-2xl mb-1.5 block">{icon}</span>
      <div className="text-card-title">{value}</div>
      <div className="text-small mt-1">{label}</div>
    </div>
  );
}

/* ── InsightCard ── */
export function InsightCard({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Comp = onClick ? motion.button : motion.div;
  return (
    <Comp whileHover={onClick ? { y: -1 } : undefined} whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`card ${onClick ? 'card-interactive text-left w-full' : ''} ${className}`}>
      {children}
    </Comp>
  );
}

/* ── BottomSheet ── */
export function BottomSheet({ children, open, onClose }: { children: ReactNode; open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] pointer-events-auto" onClick={onClose}>
          <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            onClick={e => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[40px] bg-[var(--color-surface)] shadow-[var(--shadow-xl)] pb-8 safe-bottom">
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" /></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Skeleton ── */
export function Skeleton({ className = '' }: { className?: string }) { return <div className={`skeleton ${className}`} />; }
export function CardSkeleton() {
  return <div className="card-media"><Skeleton className="aspect-[4/3] rounded-none" /><div className="p-5 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>;
}

/* ── EmptyState ── */
export function EmptyState({ emoji, title, description, action }: { emoji?: string; title: string; description: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center">
      {emoji && <div className="w-20 h-20 rounded-[24px] bg-[var(--color-bg-secondary)] flex items-center justify-center text-3xl mb-6">{emoji}</div>}
      <h3 className="text-card-title mb-2">{title}</h3>
      <p className="text-caption max-w-xs">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

/* ── AnimatedList ── */
export function AnimatedList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }} className={className}>{children}</motion.div>;
}
export function AnimatedItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } }} className={className}>{children}</motion.div>;
}

/* ── ProgressRing ── */
export function ProgressRing({ pct, size = 80, sw = 6, color = 'var(--color-primary)' }: { pct: number; size?: number; sw?: number; color?: string }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-secondary)" strokeWidth={sw} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - Math.min(100, pct) / 100) }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  );
}

/* ── TripStopCard ── */
export function TripStopCard({ image, time, duration, place, cost, reason, isLast }: {
  image: string; time: string; duration: string; place: string; cost: string; reason?: string; isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)] flex-shrink-0" />
        {!isLast && <div className="w-0.5 flex-1 bg-[var(--color-border-strong)] mt-1" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="card-media mb-2">
          <div className="relative aspect-[16/9] overflow-hidden bg-[var(--color-bg-secondary)]">
            <img src={image} alt={place} loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="badge badge-green">{time}</span>
              <span className="badge bg-white/80 text-[var(--color-text)]">{duration}</span>
            </div>
          </div>
        </div>
        <h4 className="text-body font-semibold">{place}</h4>
        <div className="flex items-center gap-3 mt-1"><span className="text-small">{cost}</span></div>
        {reason && (
          <div className="mt-2 p-3 rounded-[16px] bg-[var(--color-bg-secondary)]">
            <p className="text-small">💡 {reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
