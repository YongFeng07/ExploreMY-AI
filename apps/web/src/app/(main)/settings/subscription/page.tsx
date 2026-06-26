// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

export default function SubscriptionPage() {
  const [tiers, setTiers] = useState<any>({});
  useEffect(() => { fetch('/api/weekend-planner/pricing').then(r => r.json()).then(d => setTiers(d.data || {})); }, []);

  return (
    <div className="min-h-dvh bg-[#FAFAF8] px-5 pt-16 pb-24">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-6">Subscription</h1>
      <div className="space-y-3">
        {Object.entries(tiers).map(([name, price]: any) => (
          <div key={name} className={`card-travel p-5 ${name === 'PRO' ? 'border-[#E87722] ring-2 ring-[#E87722]/10' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-extrabold text-[#1A1A1A]">{name}</span>
              <span className="text-lg font-extrabold text-[#E87722]">RM {price.monthly}/mo</span>
            </div>
            <p className="text-xs text-[#6B7280]">Yearly: RM {price.yearly}</p>
            {name === 'PRO' && <span className="inline-block mt-2 text-[10px] font-bold bg-[#FFF3E8] text-[#E87722] rounded-full px-2.5 py-1">RECOMMENDED</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
