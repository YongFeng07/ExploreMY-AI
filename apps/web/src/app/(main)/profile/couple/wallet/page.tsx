// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, ChevronRight, PiggyBank, ArrowLeft, Heart, Sparkles, TrendingUp, Target, Trophy, Zap, CalendarDays, MapPin } from 'lucide-react';

const API = '';

export default function CoupleWalletPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [selGoal, setSelGoal] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [partnerId, setPartnerId] = useState('');
  const [contributeAmount, setContributeAmount] = useState(50);
  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const token = typeof window !== 'undefined' ? '' : '';
  const userId = typeof window !== 'undefined' ? '' || 'demo' : 'demo';
  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  const load = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const pr = await fetch(`${API}/api/v1/auth/me/couple`, { headers: authHeaders() });
      const pd = await pr.json();
      const p = pd.data;
      setPartner(p);
      const pid = p?.id || '';
      setPartnerId(pid);

      const [ur, pr2] = await Promise.all([
        fetch(`${API}/api/v1/travel-wallet/goals/user/${userId}`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ data: [] })),
        pid ? fetch(`${API}/api/v1/travel-wallet/goals/user/${pid}`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      const all = [
        ...(ur.data || []).map((g: any) => ({ ...g, owner: 'You', ownerInitial: 'Y' })),
        ...(pr2.data || []).map((g: any) => ({ ...g, owner: p?.displayName || 'Partner', ownerInitial: (p?.displayName?.[0] || 'P') })),
      ];
      setGoals(all);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const contribute = async () => {
    if (!selGoal || contributeAmount <= 0) return;
    const prevPct = selGoal.progressPct || 0;
    setContributing(true);
    try {
      await fetch(`${API}/api/v1/travel-wallet/goals/${selGoal.id}/contribute`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selGoal.userId || userId, amount: contributeAmount, note: 'Couple contribution' }),
      });
      const r = await fetch(`${API}/api/v1/travel-wallet/goals/${selGoal.id}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.data) {
        const newPct = d.data.progressPct || 0;
        if ([25, 50, 75, 100].some(m => prevPct < m && newPct >= m)) { setCelebrate(true); setTimeout(() => setCelebrate(false), 3000); }
        setSelGoal(d.data); load();
      }
    } catch {}
    setContributing(false);
  };

  /* ── GOAL DETAIL ── */
  if (selGoal) {
    const pct = selGoal.progressPct || 0;
    const remaining = (selGoal.targetAmount || 0) - (selGoal.currentSavings || 0);
    const plan = selGoal.savingsPlan || {};
    return (
      <div className="min-h-screen bg-[#FFFDF7]">
        {celebrate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none"><div className="animate-bounce text-center"><span className="text-7xl block">🎉</span><p className="text-white text-xl font-extrabold mt-3">Milestone Unlocked!</p></div></div>}

        {/* Header */}
        <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 px-5 pt-14 pb-8 text-white">
          <button onClick={() => setSelGoal(null)} className="text-white/80 text-[13px] font-semibold mb-3 flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold bg-white/20 rounded-full px-2.5 py-1">{selGoal.owner}</span>
            <Heart className="h-3 w-3 text-pink-200" fill="currentColor" />
          </div>
          <h1 className="text-[24px] font-extrabold leading-tight">{selGoal.tripName}</h1>
          <p className="text-white/70 text-[13px] mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{selGoal.destination}</p>
        </div>

        <div className="px-5 pt-4 pb-24 space-y-4">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">💰 Savings Progress</span>
              <span className="text-[12px] font-extrabold text-pink-600">{pct}%</span>
            </div>
            {/* Piggy visualization */}
            <div className="flex justify-center mb-3">
              <div className="relative w-28 h-32 flex items-end justify-center">
                <svg viewBox="0 0 80 96" className="w-28 h-32">
                  <rect x="10" y="18" width="60" height="68" rx="10" fill="none" stroke="#EC4899" strokeWidth="2" opacity="0.25" />
                  <rect x="18" y="6" width="44" height="15" rx="8" fill="none" stroke="#EC4899" strokeWidth="2" opacity="0.25" />
                  <clipPath id={`cpj-${selGoal.id}`}><rect x="12" y="20" width="56" height="64" rx="8" /></clipPath>
                  <rect x="12" y={20 + (64 * (1 - pct / 100))} width="56" height={64 * (pct / 100)} rx="8" fill="#EC4899" opacity="0.4" clipPath={`url(#cpj-${selGoal.id})`} />
                  {pct > 5 && <circle cx="30" cy={78 - (pct * 0.5)} r="4" fill="#FBBF24" opacity="0.7" />}
                  {pct > 15 && <circle cx="50" cy={80 - (pct * 0.45)} r="4" fill="#F59E0B" opacity="0.6" />}
                  {pct > 30 && <circle cx="40" cy={82 - (pct * 0.42)} r="4" fill="#FBBF24" opacity="0.5" />}
                  <text x="40" y="63" textAnchor="middle" fill="#EC4899" fontSize="16" fontWeight="bold">{pct}%</text>
                </svg>
              </div>
            </div>
            {/* Bar */}
            <div className="flex justify-between text-[11px] text-[#8B7355] mb-1.5">
              <span>RM {(selGoal.currentSavings || 0).toLocaleString()}</span>
              <span>RM {(selGoal.targetAmount || 0).toLocaleString()}</span>
            </div>
            <div className="h-3 bg-[#F5EDE3] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-center text-[12px] text-[#8B7355] mt-2 font-medium">RM {remaining.toLocaleString()} remaining</p>
          </div>

          {/* Quick Contribute */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
            <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-3">💕 Quick Contribute</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[20, 50, 100, 200, 500, 1000].map(a => (
                <button key={a} onClick={() => setContributeAmount(a)}
                  className={`rounded-xl border-2 py-2.5 text-center font-bold text-[15px] transition-all ${contributeAmount === a ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-[#E8D5C4] bg-white text-[#8B7355] hover:border-pink-200'}`}>
                  RM{a}
                </button>
              ))}
            </div>
            <button onClick={contribute} disabled={contributing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[15px] font-extrabold shadow-lg shadow-pink-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {contributing ? 'Adding...' : <><PiggyBank className="h-4 w-4" /> Add RM {contributeAmount}</>}
            </button>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3"><Trophy className="h-3 w-3 inline mr-1" />Milestones</p>
            <div className="flex justify-between">
              {[25, 50, 75, 100].map((m, i) => (
                <div key={m} className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all ${pct >= m ? 'bg-pink-100 text-pink-500 scale-110' : 'bg-[#F5EDE3] text-[#A08970]'}`}>
                    {pct >= m ? '🎉' : '🔒'}
                  </div>
                  <span className={`text-[10px] font-bold ${pct >= m ? 'text-pink-500' : 'text-[#A08970]'}`}>{m}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Trip Together CTA */}
          <Link href={`/weekend-planner?dest=${encodeURIComponent(selGoal.destination || '')}`}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#FDF0E0] flex items-center gap-4 hover:bg-[#FDF6ED] transition-colors block">
            <div className="w-11 h-11 rounded-xl bg-[#C4956A] flex items-center justify-center flex-shrink-0"><Sparkles className="h-5 w-5 text-white" /></div>
            <div className="flex-1"><p className="text-[14px] font-bold text-[#3C2415]">Plan This Trip Together</p><p className="text-[12px] text-[#8B7355]">AI will build your perfect couple itinerary</p></div>
            <ChevronRight className="h-5 w-5 text-[#C4956A]" />
          </Link>
        </div>
      </div>
    );
  }

  /* ── GOAL LIST ── */
  const totalSaved = goals.reduce((s: number, g: any) => s + (g.currentSavings || 0), 0);
  const totalTarget = goals.reduce((s: number, g: any) => s + (g.targetAmount || 0), 0);
  const combinedPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile/couple" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Couple Space</Link>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[28px] font-extrabold text-[#3C2415]">💑 Shared Wallet</h1>
        </div>
        <p className="text-[13px] text-[#8B7355] mt-1">{goals.length} goals · RM {totalSaved.toLocaleString()} saved of RM {totalTarget.toLocaleString()}</p>
      </div>

      {/* Combined Progress */}
      {goals.length > 0 && (
        <div className="px-5 mb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">💕 Together Progress</span>
              <span className="text-[13px] font-extrabold text-pink-600">{combinedPct}%</span>
            </div>
            <div className="h-4 bg-[#F5EDE3] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-700" style={{ width: `${combinedPct}%` }} />
            </div>
            {/* Partner avatars */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C4956A] flex items-center justify-center text-white text-xs font-bold">Y</div>
                <span className="text-[11px] font-semibold text-[#3C2415]">You</span>
              </div>
              <Heart className="h-3 w-3 text-pink-400" fill="currentColor" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center text-white text-xs font-bold">{partner?.displayName?.[0] || 'P'}</div>
                <span className="text-[11px] font-semibold text-[#3C2415]">{partner?.displayName || 'Partner'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal List */}
      <div className="px-5 pb-24 space-y-3">
        {loading && <div className="text-center py-10"><div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin mx-auto" /></div>}
        {!loading && goals.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">💰</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No shared goals yet</p>
            <p className="text-[#8B7355] text-sm mt-1 mb-4">Create savings goals together for your dream trips</p>
            <Link href="/wallet" className="inline-flex items-center gap-2 px-6 py-2.5 bg-pink-500 text-white rounded-xl font-bold text-sm"><Wallet className="h-4 w-4" /> Create a Goal</Link>
          </div>
        )}
        {goals.map((g: any) => (
          <div key={g.id} onClick={() => setSelGoal(g)}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-extrabold text-[#3C2415] truncate">{g.tripName}</h3>
                  <span className="text-[9px] font-bold bg-pink-100 text-pink-600 rounded-full px-2 py-0.5 flex-shrink-0">{g.owner}</span>
                </div>
                <p className="text-[11px] text-[#8B7355] mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{g.destination} · RM {g.targetAmount?.toLocaleString()}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#D4C4B0] flex-shrink-0 ml-2" />
            </div>
            <div className="h-2.5 bg-[#F5EDE3] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all" style={{ width: `${g.progressPct || 0}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-[#A08970]">
              <span>RM {(g.currentSavings || 0).toLocaleString()} saved</span>
              <span>{g.progressPct || 0}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
