// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, PiggyBank, ArrowLeft, Heart, Sparkles, TrendingUp, Target, Trophy, Zap, MapPin, X, Plus, Trash2, Edit3, ChevronRight, CalendarDays, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const WALLET_KEY = 'couple_wallet';
function lw(): any[] { try { return JSON.parse(localStorage.getItem(WALLET_KEY) || '[]'); } catch { return []; } }
function sw(d: any[]) { localStorage.setItem(WALLET_KEY, JSON.stringify(d)); }

const GOAL_COLORS = [
  { k:'pink', bg:'from-pink-500 to-rose-500', l:'#EC4899', s:'shadow-pink-200' },
  { k:'amber', bg:'from-amber-500 to-orange-500', l:'#F59E0B', s:'shadow-amber-200' },
  { k:'blue', bg:'from-blue-500 to-indigo-500', l:'#3B82F6', s:'shadow-blue-200' },
  { k:'green', bg:'from-emerald-500 to-teal-500', l:'#10B981', s:'shadow-emerald-200' },
  { k:'purple', bg:'from-purple-500 to-violet-500', l:'#8B5CF6', s:'shadow-purple-200' },
  { k:'coral', bg:'from-rose-400 to-pink-500', l:'#F43F5E', s:'shadow-rose-200' },
];

const MY_CITIES = ['Kuala Lumpur','George Town, Penang','Johor Bahru','Melaka','Ipoh, Perak','Langkawi, Kedah','Cameron Highlands, Pahang','Kota Kinabalu, Sabah','Kuching, Sarawak','Kuantan, Pahang','Kuala Terengganu','Putrajaya','Petaling Jaya, Selangor','Shah Alam, Selangor','Seremban, N. Sembilan','Alor Setar, Kedah','Kota Bharu, Kelantan','Port Dickson','Genting Highlands, Pahang',"Fraser's Hill, Pahang",'Miri, Sarawak','Sandakan, Sabah','Pulau Perhentian','Pulau Redang','Pulau Tioman','Sekinchan, Selangor','Taiping, Perak'];

function AnimatedCount({ value, duration = 800 }: { value: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let s = 0; const step = Math.ceil(value / (duration / 16));
    const t = setInterval(() => { s += step; if (s >= value) { setV(value); clearInterval(t); } else setV(s); }, 16);
    return () => clearInterval(t);
  }, [value, duration]);
  return <span>{v}</span>;
}

export default function CoupleWalletPage() {
  const [goals, setGoals] = useState<any[]>(lw());
  const [selGoal, setSelGoal] = useState<any>(null);
  const [contributeAmount, setContributeAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyGoal, setHistoryGoal] = useState<any>(null);

  // New goal form
  const [newGoal, setNewGoal] = useState({ title:'', destination:'', targetAmount:2000, deadline:'', color:0 });

  const refresh = () => setGoals(lw());

  const saveGoals = (g: any[]) => { sw(g); setGoals(g); };

  const createGoal = () => {
    if (!newGoal.title) { toast.error('Enter a trip name'); return; }
    if (!newGoal.targetAmount || newGoal.targetAmount < 100) { toast.error('Min RM 100 target'); return; }
    const color = GOAL_COLORS[newGoal.color];
    const goal = {
      id: 'goal_' + Date.now(),
      title: newGoal.title,
      destination: newGoal.destination || '',
      targetAmount: newGoal.targetAmount,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
      deadline: newGoal.deadline || null,
      colorIdx: newGoal.color,
      color: color.k, colorBg: color.bg, colorVal: color.l, shadow: color.s,
      completed: false, completedAt: null,
      history: [] as { date: string; amount: number; note: string }[],
    };
    saveGoals([goal, ...goals]);
    setNewGoal({ title:'', destination:'', targetAmount:2000, deadline:'', color:0 });
    setShowCreate(false);
    toast.success('💰 Goal created! Start saving together');
  };

  const deleteGoal = (id: string) => {
    if (!confirm('Delete this goal?')) return;
    saveGoals(goals.filter(g => g.id !== id));
    if (selGoal?.id === id) setSelGoal(null);
    toast('Goal deleted');
  };

  const contribute = () => {
    if (!selGoal) return;
    const amt = customAmount ? parseInt(customAmount) : contributeAmount;
    if (!amt || amt <= 0) return;
    setContributing(true);
    const prevPct = Math.round(((selGoal.currentAmount || 0) / (selGoal.targetAmount || 1)) * 100);
    const newAmount = (selGoal.currentAmount || 0) + amt;
    const newPct = Math.round((newAmount / selGoal.targetAmount) * 100);
    const completed = newAmount >= selGoal.targetAmount;

    const updatedGoal = {
      ...selGoal,
      currentAmount: newAmount,
      completed,
      completedAt: completed ? new Date().toISOString() : null,
      history: [...(selGoal.history || []), { date: new Date().toISOString(), amount: amt, note: 'Couple contribution' }],
    };

    // Check milestone
    if ([25, 50, 75, 100].some(m => prevPct < m && newPct >= m)) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3500);
    }

    const updatedGoals = goals.map(g => g.id === selGoal.id ? updatedGoal : g);
    saveGoals(updatedGoals);
    setSelGoal(updatedGoal);
    setContributing(false);
    setCustomAmount('');
    toast.success(`💰 Added RM ${amt.toLocaleString()}!${completed ? ' Goal completed! 🎉' : ''}`);
  };

  const totalSaved = goals.reduce((s: number, g: any) => s + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((s: number, g: any) => s + (g.targetAmount || 0), 0);
  const combinedPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  /* ── GOAL DETAIL ── */
  if (selGoal) {
    const pct = Math.round(((selGoal.currentAmount || 0) / (selGoal.targetAmount || 1)) * 100);
    const remaining = (selGoal.targetAmount || 0) - (selGoal.currentAmount || 0);
    const history = selGoal.history || [];
    const hasDeadline = !!selGoal.deadline;
    const daysLeft = hasDeadline ? Math.ceil((new Date(selGoal.deadline).getTime() - Date.now()) / 86400000) : null;

    return (
      <div className="min-h-screen bg-[#FFFDF7]">
        {celebrate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none">
            <div className="animate-bounce text-center">
              <span className="text-8xl block">🎉</span>
              <p className="text-white text-2xl font-extrabold mt-3">Milestone Unlocked!</p>
              <p className="text-white/70 text-sm mt-1">{pct}% of the way there!</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={cn('px-5 pt-14 pb-8 text-white', `bg-gradient-to-br ${selGoal.colorBg || 'from-pink-500 to-rose-500'}`)}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSelGoal(null)} className="text-white/80 text-[13px] font-semibold flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <button onClick={() => deleteGoal(selGoal.id)} className="text-white/60 hover:text-white p-1.5"><Trash2 className="h-4 w-4" /></button>
          </div>
          {selGoal.completed && <span className="text-[10px] font-bold bg-white/20 rounded-full px-3 py-1 mb-2 inline-block">🎉 Completed!</span>}
          <h1 className="text-[24px] font-extrabold leading-tight">{selGoal.title}</h1>
          {selGoal.destination && <p className="text-white/70 text-[13px] mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{selGoal.destination}</p>}
          {daysLeft !== null && daysLeft > 0 && (
            <p className="text-white/60 text-[11px] mt-1 flex items-center gap-1"><CalendarDays className="h-3 w-3" />{daysLeft} days left</p>
          )}
        </div>

        <div className="px-5 pt-4 pb-24 space-y-4">
          {/* Progress Card with SVG Jar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{color: selGoal.colorVal}}>💰 Savings Progress</span>
              <span className="text-[13px] font-extrabold" style={{color: selGoal.colorVal}}>{pct}%</span>
            </div>
            {/* Jar Visualization */}
            <div className="flex justify-center mb-3">
              <div className="relative w-28 h-32 flex items-end justify-center">
                <svg viewBox="0 0 80 96" className="w-28 h-32">
                  <rect x="10" y="18" width="60" height="68" rx="10" fill="none" stroke={selGoal.colorVal} strokeWidth="2" opacity="0.25" />
                  <rect x="18" y="6" width="44" height="15" rx="8" fill="none" stroke={selGoal.colorVal} strokeWidth="2" opacity="0.25" />
                  <clipPath id={`jar-${selGoal.id}`}><rect x="12" y="20" width="56" height="64" rx="8" /></clipPath>
                  <rect x="12" y={20 + (64 * (1 - pct / 100))} width="56" height={64 * (pct / 100)} rx="8" fill={selGoal.colorVal} opacity="0.4" clipPath={`url(#jar-${selGoal.id})`} />
                  {pct > 10 && <circle cx="30" cy={78 - (pct * 0.5)} r="4" fill="#FBBF24" opacity="0.7" />}
                  {pct > 25 && <circle cx="50" cy={80 - (pct * 0.45)} r="4" fill="#F59E0B" opacity="0.6" />}
                  {pct > 50 && <circle cx="40" cy={82 - (pct * 0.42)} r="4" fill="#FBBF24" opacity="0.5" />}
                  <text x="40" y="63" textAnchor="middle" fill={selGoal.colorVal} fontSize="16" fontWeight="bold">{pct}%</text>
                </svg>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="flex justify-between text-[11px] text-[#8B7355] mb-1.5">
              <span className="font-bold">RM {(selGoal.currentAmount || 0).toLocaleString()}</span>
              <span>RM {(selGoal.targetAmount || 0).toLocaleString()}</span>
            </div>
            <div className="h-3 bg-[#F5EDE3] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: selGoal.colorVal }} />
            </div>
            <p className="text-center text-[12px] text-[#8B7355] mt-2 font-medium">
              {remaining > 0 ? `RM ${remaining.toLocaleString()} to go` : 'Goal reached! 🎉'}
            </p>
          </div>

          {/* Quick Contribute */}
          {!selGoal.completed && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{color: selGoal.colorVal}}>💕 Quick Contribute</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[20, 50, 100, 200, 500, 1000].map(a => (
                  <button key={a} onClick={() => { setContributeAmount(a); setCustomAmount(''); }}
                    className={cn('rounded-xl border-2 py-2.5 text-center font-bold text-[15px] transition-all',
                      contributeAmount === a && !customAmount ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-[#E8D5C4] bg-white text-[#8B7355] hover:border-pink-200')}>
                    RM{a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-3">
                <input type="number" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setContributeAmount(0); }}
                  placeholder="Custom amount" className="flex-1 rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] font-semibold outline-none focus:border-pink-400" />
              </div>
              <button onClick={contribute} disabled={contributing}
                className={cn('w-full py-3.5 rounded-xl text-white text-[15px] font-extrabold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2',
                  `bg-gradient-to-r ${selGoal.colorBg || 'from-pink-500 to-rose-500'}`, selGoal.shadow || 'shadow-pink-200')}>
                {contributing ? 'Adding...' : <><PiggyBank className="h-4 w-4" /> Add RM {customAmount ? parseInt(customAmount).toLocaleString() : contributeAmount}</>}
              </button>
            </div>
          )}

          {/* Milestones */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3"><Trophy className="h-3 w-3 inline mr-1" />Milestones</p>
            <div className="flex justify-between">
              {[25, 50, 75, 100].map(m => {
                const unlocked = pct >= m;
                return (
                  <div key={m} className="flex flex-col items-center gap-1.5">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-sm transition-all',
                      unlocked ? 'scale-110 shadow-md' : 'bg-[#F5EDE3]')}
                      style={unlocked ? { backgroundColor: selGoal.colorVal + '20', color: selGoal.colorVal } : {}}>
                      {unlocked ? '🎉' : '🔒'}
                    </div>
                    <span className={cn('text-[10px] font-bold', unlocked ? 'text-pink-500' : 'text-[#A08970]')}>{m}%</span>
                    {unlocked && <span className="text-[8px] text-green-500">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
              <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">📋 Contribution History</p>
              <div className="space-y-2">
                {history.slice().reverse().slice(0, 10).map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[12px] py-1.5 border-b border-[#F5EDE3] last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: selGoal.colorVal + '15', color: selGoal.colorVal }}>💰</div>
                      <span className="text-[#6B4D3A]">{h.note}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold" style={{color: selGoal.colorVal}}>+RM {h.amount.toLocaleString()}</p>
                      <p className="text-[9px] text-[#A08970]">{new Date(h.date).toLocaleDateString('en',{month:'short',day:'numeric'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book Now CTA */}
          {selGoal.destination && (
            <Link href={`/weekend-planner?dest=${encodeURIComponent(selGoal.destination)}`}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#FDF0E0] flex items-center gap-4 hover:bg-[#FDF6ED] transition-colors block">
              <div className="w-11 h-11 rounded-xl bg-[#C4956A] flex items-center justify-center flex-shrink-0"><Sparkles className="h-5 w-5 text-white" /></div>
              <div className="flex-1"><p className="text-[14px] font-bold text-[#3C2415]">Plan This Trip Together</p><p className="text-[12px] text-[#8B7355]">AI will build your perfect couple itinerary</p></div>
              <ChevronRight className="h-5 w-5 text-[#C4956A]" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  /* ── GOAL LIST ── */
  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile/couple" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Couple Space</Link>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[28px] font-extrabold text-[#3C2415]">💑 Shared Wallet</h1>
          <button onClick={() => setShowCreate(true)} className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md"><Plus className="h-5 w-5" /></button>
        </div>
        <p className="text-[13px] text-[#8B7355] mt-1">
          {goals.length > 0 ? (
            <>RM <span className="font-bold"><AnimatedCount value={totalSaved} /></span> saved of RM {totalTarget.toLocaleString()} · {activeGoals.length} active, {completedGoals.length} done</>
          ) : 'Save for dream trips together'}
        </p>
      </div>

      {/* Combined Progress */}
      {goals.length > 0 && (
        <div className="px-5 mb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">💕 Together Progress</span>
              <span className="text-[14px] font-extrabold text-pink-600"><AnimatedCount value={combinedPct} />%</span>
            </div>
            <div className="h-4 bg-[#F5EDE3] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-700" style={{ width: `${combinedPct}%` }} />
            </div>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C4956A] flex items-center justify-center text-white text-xs font-bold">Y</div>
                <span className="text-[11px] font-semibold text-[#3C2415]">You</span>
              </div>
              <Heart className="h-3 w-3 text-pink-400" fill="currentColor" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center text-white text-xs font-bold">P</div>
                <span className="text-[11px] font-semibold text-[#3C2415]">Partner</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Cards */}
      <div className="px-5 pb-24 space-y-3">
        {goals.length === 0 && !showCreate ? (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">💰</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No shared goals yet</p>
            <p className="text-[#8B7355] text-sm mt-1 mb-4">Save together for your dream trips</p>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-200">
              <Plus className="h-4 w-4" /> Create Your First Goal
            </button>
          </div>
        ) : (
          <>
            {goals.map((g: any) => {
              const pct = Math.round(((g.currentAmount || 0) / (g.targetAmount || 1)) * 100);
              const color = GOAL_COLORS[g.colorIdx || 0];
              const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : null;
              return (
                <div key={g.id} onClick={() => setSelGoal(g)}
                  className="bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] overflow-hidden">
                  {/* Color accent bar */}
                  <div className={cn('h-1.5', `bg-gradient-to-r ${g.colorBg || color.bg}`)} />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[15px] font-extrabold text-[#3C2415]">{g.title}</h3>
                          {g.completed && <span className="text-[9px] font-bold bg-green-100 text-green-600 rounded-full px-2 py-0.5 flex-shrink-0">✅ Done</span>}
                          {!g.completed && daysLeft !== null && daysLeft <= 30 && (
                            <span className={cn('text-[9px] font-bold rounded-full px-2 py-0.5 flex-shrink-0', daysLeft <= 7 ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600')}>
                              {daysLeft}d left
                            </span>
                          )}
                        </div>
                        {g.destination && <p className="text-[11px] text-[#8B7355] mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{g.destination}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#D4C4B0] flex-shrink-0 ml-2" />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#8B7355] mb-1.5">
                      <span className="font-bold">RM {(g.currentAmount || 0).toLocaleString()}</span>
                      <span>RM {(g.targetAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-[#F5EDE3] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: g.colorVal || color.l }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px]">
                      <span className="font-bold" style={{color: g.colorVal || color.l}}>{pct}% complete</span>
                      <span className="text-[#A08970]">{g.history?.length || 0} contributions</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ═══ CREATE GOAL MODAL ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setShowCreate(false)}>
          <div className="w-full max-h-[85vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-[20px] font-extrabold text-[#3C2415]">💰 Create Goal</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-[#3C2415]" /></button>
            </div>
            <div className="px-5 pb-8 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-1 block">Trip Name *</label>
                <input value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Bali Honeymoon" className="w-full rounded-xl border border-[#E8D5C4] px-4 py-3 text-[15px] font-semibold outline-none focus:border-[#C4956A]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-1 block">Destination</label>
                <input value={newGoal.destination} onChange={e => setNewGoal(p => ({ ...p, destination: e.target.value }))}
                  placeholder="e.g. Bali, Indonesia" list="goal-cities"
                  className="w-full rounded-xl border border-[#E8D5C4] px-4 py-3 text-[15px] font-semibold outline-none focus:border-[#C4956A]" />
                <datalist id="goal-cities">{MY_CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-1 block">Target Amount (RM) *</label>
                <input type="number" value={newGoal.targetAmount} onChange={e => setNewGoal(p => ({ ...p, targetAmount: parseInt(e.target.value) || 0 }))}
                  placeholder="2000" className="w-full rounded-xl border border-[#E8D5C4] px-4 py-3 text-[15px] font-semibold outline-none focus:border-[#C4956A]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-1 block">Deadline (optional)</label>
                <input type="date" value={newGoal.deadline} onChange={e => setNewGoal(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full rounded-xl border border-[#E8D5C4] px-4 py-3 text-[15px] font-semibold outline-none focus:border-[#C4956A]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-2 block">Color Theme</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map((c, i) => (
                    <button key={c.k} onClick={() => setNewGoal(p => ({ ...p, color: i }))}
                      className={cn('w-10 h-10 rounded-full transition-all', `bg-gradient-to-br ${c.bg}`,
                        newGoal.color === i ? 'ring-3 ring-offset-2 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100')}
                      style={{ ringColor: c.l }} />
                  ))}
                </div>
              </div>
              <button onClick={createGoal}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[15px] font-extrabold shadow-lg shadow-pink-200 mt-2">
                💰 Create Savings Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
