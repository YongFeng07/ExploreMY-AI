// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Wallet, Target, TrendingUp, Clock, Users, Heart, Gift, Plus, ChevronRight, Zap, PiggyBank, CalendarDays, MapPin, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type Goal = {
  id: string;
  tripName: string;
  destination: string;
  targetAmount: number;
  currentSavings: number;
  progressPct: number;
  targetDate: string;
  description: string;
  walletType: string;
  tripDays: number;
  contributions: { amount: number; note: string; date: string }[];
  createdAt: string;
  forecastDate?: string;
  savingsPlan?: any;
  milestones?: any[];
  estimatedTripCost?: number;
  accommodationEst?: number;
  transportEst?: number;
  foodEst?: number;
  activitiesEst?: number;
  aiTips?: string[];
};

function loadGoals(): Goal[] {
  try { return JSON.parse(localStorage.getItem('wallet_goals') || '[]'); } catch { return []; }
}
function saveGoals(goals: Goal[]) {
  localStorage.setItem('wallet_goals', JSON.stringify(goals));
}

const WALLET_TYPES = [
  {v:'SOLO',e:'🧑',l:'Solo',d:'Personal travel goal'},
  {v:'COUPLE',e:'💑',l:'Couple',d:'Save together'},
  {v:'GROUP',e:'👥',l:'Group',d:'2-20 members'},
];

export default function WalletPage() {
  const [view, setView] = useState<'list'|'create'|'detail'>('list');
  const [goals, setGoals] = useState<any[]>([]);
  const [selGoal, setSelGoal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // Create form
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [targetAmount, setTargetAmount] = useState(1000);
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [walletType, setWalletType] = useState('SOLO');
  const [tripDays, setTripDays] = useState(3);
  const [contributeAmount, setContributeAmount] = useState(50);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [contributedAmount, setContributedAmount] = useState(0);
  const [showCoinDrop, setShowCoinDrop] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Load goals from localStorage
  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  // Trip estimate (simple calculation)
  useEffect(() => {
    if (!selGoal?.destination) return;
    const days = tripDays || 3;
    const base = days * 200;
    setSelGoal((prev: any) => ({
      ...prev,
      accommodationEst: Math.round(base * 0.35),
      transportEst: Math.round(base * 0.25),
      foodEst: Math.round(base * 0.2),
      activitiesEst: Math.round(base * 0.2),
      estimatedTripCost: base,
      tripDays: days,
    }));
  }, [selGoal?.destination, tripDays]);

  const createGoal = async () => {
    if (!tripName || !destination) { setSaveError('Trip name and destination are required'); return; }
    setLoading(true); setSaveError('');
    const newGoal: Goal = {
      id: 'goal_' + Date.now(),
      tripName, destination,
      targetAmount: Number(targetAmount),
      currentSavings: 0, progressPct: 0,
      targetDate: targetDate || '',
      description, walletType, tripDays,
      contributions: [],
      createdAt: new Date().toISOString(),
      savingsPlan: { dailyTarget: Math.round(targetAmount / 90), weeklyTarget: Math.round(targetAmount / 13), monthlyTarget: Math.round(targetAmount / 3), feasibilityNote: `Save RM ${Math.round(targetAmount / 90)}/day to reach your goal in ~3 months.` },
      milestones: [25,50,75,100].map(p => ({ title: `${p}% of Goal`, reached: false, badgeEmoji: ['🌱','🌿','🌳','🏆'][p/25-1], remaining: Math.round(targetAmount * (1 - p/100)) })),
      aiTips: ['Set up auto-transfer on payday', 'Cut one dining-out meal per week', 'Use cashback apps for groceries', 'Track expenses in a simple note'],
    };
    const all = [newGoal, ...goals];
    saveGoals(all);
    setGoals(all);
    setView('detail');
    setSelGoal(newGoal);
    setLoading(false);
  };

  const contribute = async () => {
    if (!selGoal || contributeAmount <= 0) return;
    const updated = { ...selGoal };
    updated.currentSavings = (updated.currentSavings || 0) + contributeAmount;
    updated.progressPct = Math.round((updated.currentSavings / updated.targetAmount) * 100);
    updated.contributions = [...(updated.contributions || []), { amount: contributeAmount, note: 'Manual contribution', date: new Date().toISOString() }];
    setSelGoal(updated);
    setGoals(prev => { const n = prev.map(g => g.id === updated.id ? updated : g); saveGoals(n); return n; });
    setContributedAmount(prev => prev + contributeAmount);
  };

  /* ── LIST VIEW ── */
  if (view==='list') return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50/50 via-white to-white">
      <div className="px-5 pt-14 pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-3">
          <Wallet className="h-3 w-3"/> Travel Wallet
        </span>
        <h1 className="text-[36px] font-extrabold text-[#1A1A1A] leading-[1.1] tracking-[-0.02em]">
          Save for<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">your dream trip</span>
        </h1>
        <p className="text-[15px] text-gray-500 mt-2">AI-powered savings goals for every adventure.</p>
      </div>

      <div className="px-5 pb-36 space-y-4">
        {goals.length===0 && (
          <div className="text-center py-20">
            <PiggyBank className="h-16 w-16 mx-auto text-emerald-200"/>
            <p className="mt-4 font-extrabold text-gray-800">No savings goals yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first travel savings goal</p>
          </div>
        )}
        {goals.map(g=>(
          <div key={g.id} onClick={()=>{setSelGoal(g);setView('detail');}}
            className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[15px] font-extrabold text-gray-800">{g.tripName}</p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3"/>{g.destination}</p>
              </div>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-600 rounded-full px-3 py-1">{g.walletType==='SOLO'?'🧑 Solo':g.walletType==='COUPLE'?'💑 Couple':'👥 Group'}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]"><span className="text-gray-500">Progress</span><span className="font-bold text-emerald-600">{g.progressPct||0}%</span></div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700" style={{width:`${g.progressPct||0}%`}}/>
              </div>
              <div className="flex justify-between text-[11px]"><span className="text-gray-400">RM {(g.currentSavings||0).toLocaleString()} saved</span><span className="text-gray-400">Target: RM {g.targetAmount.toLocaleString()}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-5 pb-6 pt-4 z-40" style={{background:'linear-gradient(to top, white 60%, transparent)'}}>
        <button onClick={()=>setView('create')} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg font-extrabold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
          <Plus className="h-5 w-5"/> New Savings Goal
        </button>
      </div>
    </div>
  );

  /* ── CREATE VIEW ── */
  if (view==='create') return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50/50 via-white to-white">
      <div className="px-5 pt-14 pb-6">
        <button onClick={()=>setView('list')} className="text-emerald-600 text-[13px] font-semibold mb-3">← Back</button>
        <h1 className="text-[28px] font-extrabold text-gray-800">Create Savings Goal</h1>
      </div>
      <div className="px-5 pb-36 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 block">🏷️ Trip Name</label>
          <input value={tripName} onChange={e=>setTripName(e.target.value)} placeholder="e.g. Langkawi Island Escape 2026"
            className="w-full rounded-xl border-2 border-emerald-300 bg-white py-4 px-4 text-[16px] font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"/>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 block">📍 Destination</label>
          <input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="e.g. Penang, Melaka, Kota Kinabalu..."
            className="w-full rounded-xl border-2 border-emerald-300 bg-white py-4 px-4 text-[16px] font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
            <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 block">💰 Target (MYR)</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {[500,1000,2000,5000,10000].map(b=>(
                <button key={b} onClick={()=>setTargetAmount(b)} className={cn('rounded-lg border px-3 py-1.5 text-[12px] font-bold',targetAmount===b?'border-emerald-400 bg-emerald-50 text-emerald-600':'border-gray-200 text-gray-500')}>RM {b.toLocaleString()}</button>
              ))}
            </div>
            <input type="number" value={targetAmount} onChange={e=>setTargetAmount(+e.target.value)}
              className="w-full rounded-lg border-2 border-emerald-200 bg-white px-3 py-3 text-[16px] font-bold text-gray-900 outline-none focus:border-emerald-400 transition-all"/>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
            <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 block">📅 Target Date</label>
            <input type="date" value={targetDate} onChange={e=>setTargetDate(e.target.value)}
              className="w-full rounded-xl border-2 border-emerald-200 bg-white py-4 px-4 text-[16px] font-bold text-gray-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer"
              style={{colorScheme:'light' as any}}/>
            <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">{targetDate ? `Trip by ${new Date(targetDate).toLocaleDateString('en-MY',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}` : 'Select your target completion date'}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 block">📅 Trip Duration</label>
          <div className="flex items-center gap-3">
            <button onClick={()=>setTripDays(Math.max(1,tripDays-1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-lg">−</button>
            <span className="text-[24px] font-extrabold">{tripDays}<span className="text-sm text-gray-400 font-medium"> days</span></span>
            <button onClick={()=>setTripDays(Math.min(30,tripDays+1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-lg">+</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 block">👥 Wallet Type</label>
          <div className="flex gap-2">
            {WALLET_TYPES.map(w=>(
              <button key={w.v} onClick={()=>setWalletType(w.v)}
                className={cn('flex-1 rounded-xl border-2 py-3 text-center transition-all',walletType===w.v?'border-emerald-400 bg-emerald-50':'border-gray-100 hover:border-emerald-100')}>
                <div className="text-2xl">{w.e}</div><div className="text-[11px] font-extrabold mt-0.5">{w.l}</div><div className="text-[9px] text-gray-400">{w.d}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2 block">📝 Description (optional)</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Why this trip matters to you..."
            className="w-full rounded-xl border-2 border-emerald-200 bg-white py-3 px-4 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-emerald-400 transition-all" rows={2}/>
        </div>
      </div>
      <div className="fixed bottom-20 left-0 right-0 px-5 pb-6 pt-4 z-40" style={{background:'linear-gradient(to top, white 60%, transparent)'}}>
        {saveError && <p className="text-[13px] text-red-500 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>}
        <button onClick={createGoal} disabled={loading||!tripName||!destination}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg font-extrabold shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading?'Creating...':<><Sparkles className="h-5 w-5"/> Create Savings Goal</>}
        </button>
      </div>
    </div>
  );

  /* ── DETAIL VIEW ── */
  if (!selGoal) return null;
  const pct = selGoal.progressPct || 0;
  const savingsPlan = selGoal.savingsPlan || selGoal || {};
  const milestones = Array.isArray(selGoal.milestones) ? selGoal.milestones : (selGoal.milestones?.milestones || []);
  const tripEstimate = selGoal.tripEstimate || selGoal;
  const aiTips = selGoal.aiTips || [];
  const contributeWithFeedback = async () => {
    if (!selGoal||contributeAmount<=0) return;
    setShowCoinDrop(true);
    const prevPct = selGoal.progressPct || 0;
    await contribute();
    const newPct = Math.round(((selGoal.currentSavings||0) + contributeAmount) / selGoal.targetAmount * 100);
    const crossed = [25,50,75,100].find(m => prevPct < m && newPct >= m);
    if (crossed) setTimeout(() => setShowCelebrate(true), 600);
    setTimeout(() => setShowCoinDrop(false), 1000);
    if (showCelebrate) setTimeout(() => setShowCelebrate(false), 3000);
  };

  const fillHeight = Math.min(100, pct);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50/50 via-white to-white">
      {/* Celebration overlay */}
      {showCelebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none">
          <div className="text-center animate-bounce">
            <span className="text-7xl block">🎉</span>
            <p className="text-white text-xl font-extrabold mt-3 drop-shadow-lg">Milestone Unlocked!</p>
          </div>
        </div>
      )}

      {/* Coin drop animation */}
      {showCoinDrop && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <span className="text-5xl drop-shadow-xl">🪙</span>
          <p className="text-white text-sm font-extrabold text-center drop-shadow-lg mt-1">+RM {contributeAmount}!</p>
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 px-5 pt-14 pb-8 text-white">
        <button onClick={()=>{setView('list');setSelGoal(null);}} className="text-white/70 text-[13px] font-semibold mb-3 hover:text-white">← Back</button>
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            <h1 className="text-[24px] font-extrabold leading-[1.15]">{selGoal.tripName}</h1>
            <p className="text-white/70 text-[13px] mt-1 flex items-center gap-1"><MapPin className="h-3 w-3"/>{selGoal.destination} · {selGoal.walletType==='SOLO'?'🧑 Solo':selGoal.walletType==='COUPLE'?'💑 Couple':'👥 Group'}</p>
          </div>
          {/* Piggy Bank Visual */}
          <div className="relative w-20 h-24 flex-shrink-0 flex items-end justify-center">
            <svg viewBox="0 0 80 96" className="w-20 h-24">
              {/* Jar outline */}
              <rect x="12" y="20" width="56" height="65" rx="8" fill="none" stroke="white" strokeWidth="2.5" opacity="0.6"/>
              <rect x="20" y="8" width="40" height="14" rx="6" fill="none" stroke="white" strokeWidth="2.5" opacity="0.6"/>
              {/* Fill level */}
              <defs><clipPath id={`jarClip-${selGoal.id}`}><rect x="14" y="22" width="52" height="61" rx="6"/></clipPath></defs>
              <rect x="14" y={22+(61*(1-fillHeight/100))} width="52" height={61*(fillHeight/100)} rx="6" fill="white" opacity="0.9" clipPath={`url(#jarClip-${selGoal.id})`} style={{transition:'all 0.8s cubic-bezier(0.4,0,0.2,1)'}}/>
              {/* Coins visible in jar when > 0 */}
              {fillHeight > 5 && <circle cx="32" cy={75-(fillHeight*0.5)} r="4" fill="#FBBF24" opacity="0.8"/>}
              {fillHeight > 15 && <circle cx="48" cy={78-(fillHeight*0.48)} r="4" fill="#F59E0B" opacity="0.7"/>}
              {fillHeight > 30 && <circle cx="38" cy={82-(fillHeight*0.46)} r="4" fill="#FBBF24" opacity="0.6"/>}
              {/* % label */}
              <text x="40" y="65" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{pct}%</text>
            </svg>
          </div>
        </div>
        <div className="flex gap-2 mt-3 text-[11px] flex-wrap">
          <span className="bg-white/20 rounded-full px-3 py-1 font-bold">RM {(selGoal.currentSavings||0).toLocaleString()} saved</span>
          <span className="bg-white/20 rounded-full px-3 py-1 font-bold">RM {(selGoal.targetAmount||0).toLocaleString()} target</span>
          {selGoal.forecastDate && <span className="bg-white/20 rounded-full px-3 py-1">🎯 {new Date(selGoal.forecastDate).toLocaleDateString('en-MY',{month:'short',day:'numeric'})}</span>}
        </div>
      </div>

      <div className="px-5 pt-4 pb-36 space-y-4">
        {/* Savings Bar with visual progress */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">💰 Savings Progress</span>
            <span className="text-[12px] font-extrabold text-emerald-600">{pct}%</span>
          </div>
          <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="absolute inset-0 h-full bg-gradient-to-r from-emerald-300 via-teal-400 to-emerald-500 rounded-full transition-all duration-700 ease-out" style={{width:`${pct}%`}}/>
            {/* Tick marks */}
            {[25,50,75].map(t=>(
              <div key={t} className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{left:`${t}%`}}/>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>RM {(selGoal.currentSavings||0).toLocaleString()}</span>
            <span>{[25,50,75].map(t=><span key={t} className="mx-1.5">{t}%</span>)}</span>
            <span>RM {(selGoal.targetAmount||0).toLocaleString()}</span>
          </div>
        </div>

        {/* AI Savings Coach */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-3"><Zap className="h-3 w-3 inline mr-1"/>AI Savings Coach</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[{l:'Daily',v:`RM ${savingsPlan.dailyTarget||0}`,e:'📅'},{l:'Weekly',v:`RM ${savingsPlan.weeklyTarget||0}`,e:'📊'},{l:'Monthly',v:`RM ${savingsPlan.monthlyTarget||0}`,e:'🗓️'}].map(d=>(
              <div key={d.l} className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-lg">{d.e}</p><p className="text-[16px] font-extrabold text-emerald-600">{d.v}</p><p className="text-[9px] text-emerald-400 uppercase">{d.l}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-600">{savingsPlan.feasibilityNote||'Create a goal to see your savings plan.'}</p>
        </div>

        {/* Quick Contribute — Redesigned with impact */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-3">💰 Quick Contribute</p>
          {/* Preset amounts */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[20,50,100,200,500,1000].map(a=>(
              <button key={a} onClick={()=>setContributeAmount(a)}
                className={cn('rounded-xl border-2 py-3 text-center font-bold transition-all active:scale-95',
                  contributeAmount===a
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-md shadow-emerald-100'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/30')}>
                <span className="text-[11px] text-gray-400 block">RM</span>
                <span className="text-[18px] font-extrabold">{a}</span>
              </button>
            ))}
          </div>
          {/* Custom amount + Add button */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[16px]">RM</span>
              <input type="number" value={contributeAmount} onChange={e=>setContributeAmount(+e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-[18px] font-extrabold text-gray-900 outline-none focus:border-emerald-400 transition-all"/>
            </div>
            <button onClick={contributeWithFeedback}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[15px] font-extrabold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all active:scale-95 flex items-center gap-1.5">
              <span>+Add</span>
            </button>
          </div>
          {contributedAmount > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-50 flex items-center justify-between">
              <span className="text-[11px] text-emerald-500 font-bold">✅ This session: +RM {contributedAmount.toLocaleString()}</span>
              <span className="text-[11px] text-gray-400">Total: RM {(selGoal.currentSavings||0).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3"><Trophy className="h-3 w-3 inline mr-1"/>Milestones</p>
          <div className="space-y-2">
            {milestones.map((m:any,i:number)=>(
              <div key={i} className={cn('flex items-center gap-3 p-3 rounded-xl transition-all duration-500',m.reached?'bg-amber-50 border border-amber-200 scale-105':'bg-gray-50 opacity-50')}>
                <span className="text-2xl">{m.reached?m.badgeEmoji:'🔒'}</span>
                <div className="flex-1">
                  <p className="text-[12px] font-extrabold text-gray-800">{m.title}</p>
                  {!m.reached && <p className="text-[10px] text-gray-400">RM {m.remaining?.toLocaleString()} to go</p>}
                  {m.reached && <p className="text-[10px] text-amber-500 font-bold">Achieved! 🎉</p>}
                </div>
                <span className={cn('text-[11px] font-bold',m.reached?'text-amber-500':'text-gray-300')}>{m.reached?'✅':'⏳'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Cost Estimate — Accurate from backend */}
        <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm">
          <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider mb-3">✈️ Trip Cost Estimate · {selGoal.destination}</p>
          <div className="space-y-2 mb-3">
            {[
              {l:'🏨 Accommodation',v:selGoal.accommodationEst||tripEstimate.accommodation},
              {l:'🚗 Transport',v:selGoal.transportEst||tripEstimate.transport},
              {l:'🍽️ Food & Drink',v:selGoal.foodEst||tripEstimate.food},
              {l:'🎯 Activities',v:selGoal.activitiesEst||tripEstimate.activities},
            ].map(d=>{
              const barPct = selGoal.estimatedTripCost ? Math.round((d.v/selGoal.estimatedTripCost)*100) : 25;
              return (
                <div key={d.l}>
                  <div className="flex justify-between text-[12px] mb-1"><span className="text-gray-500">{d.l}</span><span className="font-bold text-gray-800">RM {(d.v||0).toLocaleString()}</span></div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-sky-400 rounded-full" style={{width:`${barPct}%`}}/></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[14px] pt-3 border-t border-sky-50">
            <span className="font-extrabold text-gray-800">Total Estimate ({tripDays || 3} days)</span>
            <span className="font-extrabold text-sky-500">RM {(selGoal.estimatedTripCost||tripEstimate.totalCost||0).toLocaleString()}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-sky-50 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              {selGoal.estimatedTripCost && selGoal.currentSavings
                ? `${selGoal.currentSavings >= selGoal.estimatedTripCost ? '✅ You have enough!' : `📊 ${Math.round((selGoal.currentSavings/selGoal.estimatedTripCost)*100)}% funded`}`
                : 'Add savings to see funding progress'}
            </span>
            {selGoal.estimatedTripCost && selGoal.currentSavings > 0 && (
              <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', (selGoal.currentSavings/selGoal.estimatedTripCost)>=1?'bg-emerald-400':(selGoal.currentSavings/selGoal.estimatedTripCost)>=0.5?'bg-amber-400':'bg-red-400')}
                  style={{width:`${Math.min(100,(selGoal.currentSavings/(selGoal.estimatedTripCost||1))*100)}%`}}/>
              </div>
            )}
          </div>
        </div>

        {/* Plan This Trip */}
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/weekend-planner?dest=${encodeURIComponent(selGoal?.destination||'')}`} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <span className="text-2xl block mb-1">🗺️</span>
            <p className="text-[11px] font-extrabold text-gray-800">Plan Trip</p>
            <p className="text-[9px] text-gray-400">AI itinerary</p>
          </Link>
          <Link href={`/date?city=${encodeURIComponent(selGoal?.destination||'')}`} className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm hover:shadow-md transition-shadow text-center">
            <span className="text-2xl block mb-1">💕</span>
            <p className="text-[11px] font-extrabold text-gray-800">Plan Date</p>
            <p className="text-[9px] text-gray-400">Romantic experience</p>
          </Link>
        </div>

        {/* AI Tips */}
        {aiTips.length>0 && (
          <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
            <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-3">💡 AI Savings Tips</p>
            <div className="space-y-2">
              {aiTips.slice(0,6).map((t:string,i:number)=>(
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[9px] font-bold text-purple-600 flex-shrink-0 mt-0.5">{i+1}</span>
                  <p className="text-[11px] text-gray-700">{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
