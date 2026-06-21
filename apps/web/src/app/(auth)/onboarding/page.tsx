// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = ['Style', 'Budget', 'Location'];
const TRAVEL_STYLES = [
  { value: 'FOODIE', label: 'Food Hunter', icon: '🍜' },
  { value: 'ADVENTURE', label: 'Adventurer', icon: '🧗' },
  { value: 'CULTURAL', label: 'Culture Seeker', icon: '🏯' },
  { value: 'FAMILY', label: 'Family Traveler', icon: '👨‍👩‍👧‍👦' },
  { value: 'LUXURY', label: 'Luxury Seeker', icon: '✨' },
  { value: 'BUDGET', label: 'Budget Traveler', icon: '💰' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFFDF7]">
      <div className="px-4 pt-16">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium', i < step ? 'bg-[#C4956A] text-white' : i === step ? 'bg-[#C4956A] text-white ring-4 ring-[#C4956A]/20' : 'border-2 border-dashed border-[#D4C4B0] text-[#A08970]')}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('hidden text-sm sm:inline', i <= step ? 'font-medium text-[#3C2415]' : 'text-[#A08970]')}>{label}</span>
              {i < 2 && <div className="mx-2 h-px w-8 bg-[#E8D5C4]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {step === 0 && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#3C2415]">What's your travel style?</h2>
            <p className="mt-1 text-sm text-[#8B7355]">Pick as many as you like.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {TRAVEL_STYLES.map((s) => {
                const is = selected.includes(s.value);
                return (
                  <button key={s.value} onClick={() => setSelected(prev => is ? prev.filter(x => x !== s.value) : [...prev, s.value])}
                    className={cn('flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all', is ? 'border-[#C4956A] bg-[#FDF0E0]' : 'border-[#E8D5C4] hover:border-[#C4956A]/30')}>
                    <span className="text-2xl">{s.icon}</span><span className="text-sm font-medium text-[#3C2415]">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#3C2415]">What's your budget?</h2>
            {[{ v: 1, l: 'Budget', d: 'RM 0–50/day' },{ v: 2, l: 'Mid-Range', d: 'RM 50–150/day' },{ v: 3, l: 'Premium', d: 'RM 150–500/day' },{ v: 4, l: 'Luxury', d: 'RM 500+/day' }].map(l => {
              const is = selected.includes(String(l.v));
              return (
                <button key={l.v} onClick={() => setSelected([String(l.v)])}
                  className={cn('w-full rounded-2xl border-2 p-4 mt-3 text-left transition-all', is ? 'border-[#C4956A] bg-[#FDF0E0]' : 'border-[#E8D5C4]')}>
                  <div className="flex justify-between"><span className="font-medium text-[#3C2415]">{l.l}</span><span className="text-sm text-[#8B7355]">{l.d}</span></div>
                </button>
              );
            })}
          </div>
        )}
        {step === 2 && (
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-[#3C2415]">Enable Location</h2>
            <p className="mt-1 text-sm text-[#8B7355]">Allow location to discover places near you.</p>
            <div className="mt-8"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FDF0E0]">📍</div></div>
          </div>
        )}
      </div>

      <div className="border-t border-[#E8D5C4] bg-white px-4 py-4 pb-safe">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl border-[#E8D5C4]">Back</Button>}
          <Button onClick={() => step < 2 ? setStep(step + 1) : router.push('/explore')}
            className="btn-cream flex-1 gap-1 rounded-xl" size="lg" disabled={selected.length === 0}>
            {step === 2 ? 'Start Exploring' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
