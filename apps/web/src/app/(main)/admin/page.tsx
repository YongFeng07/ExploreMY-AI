// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Bell, Search, Send, Trash2, Users, X, User, MapPin, Camera, Star, TrendingUp } from 'lucide-react';

const API = 'http://localhost:3001';

export default function AdminPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'system', targetEmail: 'all' });
  const [msg, setMsg] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [tab, setTab] = useState<'notifications' | 'users'>('users');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const loadAll = () => {
    fetch(`${API}/api/v1/admin/notifications`).then(r => r.json()).then(d => setNotifs(d.data || []));
    fetch(`${API}/api/v1/admin/users/all`, { headers }).then(r => r.json()).then(d => setAllUsers(d.data || [])).catch(() => {});
  };
  useEffect(() => { loadAll(); }, []);

  const searchUsers = (q: string) => {
    if (!q) { setSearchResults([]); return; }
    fetch(`${API}/api/v1/admin/users?q=${encodeURIComponent(q)}`, { headers }).then(r => r.json()).then(d => setSearchResults(d.data || [])).catch(() => {});
  };

  const sendNotif = async () => {
    if (!form.title || !form.message) return;
    const targetEmail = selectedUser ? selectedUser.email : 'all';
    await fetch(`${API}/api/v1/admin/notifications`, { method: 'POST', headers, body: JSON.stringify({ ...form, targetEmail }) });
    setForm({ title: '', message: '', type: 'system', targetEmail: 'all' }); setSelectedUser(null);
    loadAll(); setMsg('✅ Sent!'); setTimeout(() => setMsg(''), 2000);
  };

  const deleteNotif = async (id: string) => {
    await fetch(`${API}/api/v1/admin/notifications/${id}`, { method: 'DELETE', headers }); loadAll();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(`Delete user ${userId}? This cannot be undone.`)) return;
    await fetch(`${API}/api/v1/admin/users/${userId}`, { method: 'DELETE', headers });
    setDetailUser(null); loadAll();
  };

  // Stats
  const totalUsers = allUsers.length;
  const totalTrips = allUsers.reduce((s, u) => s + (u.travelHistory?.length || 0), 0);
  const totalCities = allUsers.reduce((s, u) => s + (u.visitedCities?.length || 0), 0);
  const totalPhotos = allUsers.reduce((s, u) => s + (u.myPhotos?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Back</Link>
        <h1 className="text-[28px] font-extrabold text-[#3C2415] flex items-center gap-2"><Shield className="h-6 w-6 text-[#C4956A]" /> Admin Panel</h1>
        <p className="text-[13px] text-[#8B7355] mt-1">Full system management</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4 flex gap-2">
        {[{ v: 'users', l: '👥 Users' }, { v: 'notifications', l: '🔔 Notifications' }].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as any)} className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all ${tab === t.v ? 'bg-[#C4956A] text-white shadow-md' : 'bg-white text-[#8B7355] border border-[#E8D5C4]'}`}>{t.l}</button>
        ))}
      </div>

      <div className="px-5 pb-24 space-y-5">
        {/* USER TAB */}
        {tab === 'users' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[{ l: 'Users', v: totalUsers, e: '👥' }, { l: 'Trips', v: totalTrips, e: '✈️' }, { l: 'Cities', v: totalCities, e: '🌍' }, { l: 'Photos', v: totalPhotos, e: '📸' }].map(s => (
                <div key={s.l} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-[#E8D5C4]/50">
                  <span className="text-lg">{s.e}</span><p className="text-[20px] font-extrabold text-[#3C2415]">{s.v}</p><p className="text-[10px] text-[#8B7355]">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <input value={search} onChange={e => { setSearch(e.target.value); searchUsers(e.target.value); }}
                placeholder="Search users by name or email..." className="flex-1 rounded-xl border border-[#E8D5C4] px-4 py-3 text-[15px] font-semibold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
            </div>

            {/* User List */}
            <div className="space-y-2">
              {(searchResults.length > 0 ? searchResults : allUsers).slice(0, 50).map((u: any) => (
                <div key={u.id} onClick={() => setDetailUser(u)}
                  className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#C4956A] to-[#D4A574] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">{u.displayName?.[0] || '?'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-extrabold text-[#3C2415] truncate">{u.displayName || 'No name'}</p>
                    <p className="text-[11px] text-[#8B7355] truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8B7355] flex-shrink-0">
                    <span>{u.travelHistory?.length || 0} trips</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteUser(u.id); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                    <span className="text-[#C4956A]">›</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <>
            {/* Send Notification */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
              <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3"><Send className="h-3.5 w-3.5 inline mr-1" />Send Notification</p>
              <div className="mb-3">
                <div className="flex gap-2 mb-2">
                  <button onClick={() => { setSelectedUser(null); setForm({ ...form, targetEmail: 'all' }); }}
                    className={`px-4 py-2 rounded-full text-[12px] font-bold ${!selectedUser ? 'bg-[#C4956A] text-white' : 'bg-gray-100 text-[#8B7355]'}`}>🌍 All Users</button>
                  <button onClick={() => setSelectedUser({ email: '' })}
                    className={`px-4 py-2 rounded-full text-[12px] font-bold ${selectedUser ? 'bg-[#C4956A] text-white' : 'bg-gray-100 text-[#8B7355]'}`}>👤 Specific User</button>
                </div>
                {selectedUser && (
                  <div className="mb-2 space-y-1 max-h-40 overflow-y-auto">
                    {allUsers.filter(u => (u.displayName || '').toLowerCase().includes((selectedUser.email || '').toLowerCase()) || u.email?.toLowerCase().includes((selectedUser.email || '').toLowerCase())).slice(0, 10).map((u: any) => (
                      <div key={u.id} onClick={() => setSelectedUser(u)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer ${selectedUser?.id === u.id ? 'bg-[#FDF0E0] border border-[#C4956A]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="w-8 h-8 rounded-full bg-[#C4956A] flex items-center justify-center text-white text-xs font-bold">{u.displayName?.[0] || '?'}</div>
                        <div className="flex-1"><p className="text-[13px] font-bold text-[#3C2415]">{u.displayName}</p><p className="text-[10px] text-[#8B7355]">{u.email}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[15px] font-bold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A] mb-2" />
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Message..." rows={3} className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A] resize-none mb-3" />
              <button onClick={sendNotif} className="w-full py-3 rounded-xl bg-[#C4956A] text-white text-[14px] font-extrabold hover:bg-[#B8860B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />{selectedUser?.id ? `Send to ${selectedUser.displayName}` : 'Send to All Users'}</button>
              {msg && <p className="text-center text-[13px] text-green-600 font-semibold mt-2">{msg}</p>}
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
              <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3"><Bell className="h-3.5 w-3.5 inline mr-1" />History</p>
              {notifs.map((n: any) => (
                <div key={n.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl mb-2">
                  <div className="flex-1 min-w-0"><p className="text-[13px] font-extrabold text-[#3C2415]">{n.title}</p><p className="text-[12px] text-[#8B7355]">{n.message}</p>
                    <span className="text-[10px] text-[#A08970]">{new Date(n.createdAt).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {n.targetEmail === 'all' ? '🌍 All' : `📧 ${n.targetEmail}`}</span>
                  </div>
                  <button onClick={() => deleteNotif(n.id)} className="p-2 hover:bg-red-50 rounded-lg flex-shrink-0"><Trash2 className="h-4 w-4 text-red-400" /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* User Detail Sheet — Instagram-style profile view */}
      {detailUser && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setDetailUser(null)}>
          <div className="w-full max-h-[88vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h2 className="text-[20px] font-extrabold text-[#3C2415]">User Profile</h2>
              <div className="flex gap-2">
                <button onClick={() => deleteUser(detailUser.id)} className="px-3 py-1.5 rounded-full bg-red-50 text-red-500 text-[12px] font-bold flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                <button onClick={() => setDetailUser(null)} className="p-2"><X className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Profile Header — Instagram style */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-[#C4956A] to-[#D4A574] flex items-center justify-center text-white text-[30px] font-bold flex-shrink-0 ring-3 ring-white shadow-lg">{detailUser.displayName?.[0] || '?'}</div>
                <div className="flex-1">
                  <h3 className="text-[20px] font-extrabold text-[#3C2415]">{detailUser.displayName}</h3>
                  <p className="text-[13px] text-[#8B7355]">{detailUser.email}</p>
                  <p className="text-[12px] text-[#A08970] mt-0.5">{detailUser.bio || 'No bio'}</p>
                  <p className="text-[10px] text-[#A08970] mt-0.5">ID: {detailUser.id?.slice(0,15)}... · {detailUser.role || 'USER'} · Lv.{detailUser.level || 1}</p>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[{ l: 'Trips', v: detailUser.travelHistory?.length || 0 }, { l: 'Cities', v: detailUser.visitedCities?.length || 0 }, { l: 'Photos', v: detailUser.myPhotos?.length || 0 }, { l: 'Journals', v: detailUser.journals?.length || 0 }].map(s => (
                  <div key={s.l} className="text-center"><p className="text-[18px] font-extrabold text-[#3C2415]">{s.v}</p><p className="text-[10px] text-[#8B7355]">{s.l}</p></div>
                ))}
              </div>
            </div>

            {/* Photos Grid — Instagram style */}
            {detailUser.myPhotos?.length > 0 && (
              <div className="px-5 mb-4">
                <p className="text-[11px] font-bold text-[#8B7355] uppercase mb-2">📸 Photos ({detailUser.myPhotos.length})</p>
                <div className="grid grid-cols-3 gap-1">
                  {detailUser.myPhotos.map((p: any, i: number) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#F5EDE3]">
                      <img src={p.url?.startsWith('http') ? p.url : `${API}${p.url}`} className="w-full h-full object-cover" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel History */}
            {detailUser.travelHistory?.length > 0 && (
              <div className="px-5 mb-4">
                <p className="text-[11px] font-bold text-[#8B7355] uppercase mb-2">✈️ Travel History ({detailUser.travelHistory.length})</p>
                <div className="space-y-1.5">
                  {detailUser.travelHistory.slice(0, 10).map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-[#FDF0E0] rounded-xl">
                      <span className="text-lg">{t.emoji || '✈️'}</span>
                      <div className="flex-1"><p className="text-[12px] font-bold text-[#3C2415]">{t.title}</p><p className="text-[10px] text-[#8B7355]">{t.city} · {t.date}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visited Cities */}
            {detailUser.visitedCities?.length > 0 && (
              <div className="px-5 mb-4">
                <p className="text-[11px] font-bold text-[#8B7355] uppercase mb-2">🌍 Visited Cities</p>
                <div className="flex flex-wrap gap-1.5">{detailUser.visitedCities.map((c: string) => (
                  <span key={c} className="px-3 py-1.5 bg-[#FDF0E0] rounded-full text-[11px] font-semibold text-[#6B4D3A] flex items-center gap-1"><MapPin className="h-3 w-3" />{c}</span>))}</div>
              </div>
            )}

            {/* Journals */}
            {detailUser.journals?.length > 0 && (
              <div className="px-5 mb-4">
                <p className="text-[11px] font-bold text-[#8B7355] uppercase mb-2">📝 Journals ({detailUser.journals.length})</p>
                {detailUser.journals.slice(0, 5).map((j: any, i: number) => (
                  <div key={i} className="p-3 bg-[#FDF0E0] rounded-xl mb-1.5">
                    <div className="flex items-center gap-2"><span className="text-lg">{j.mood || '📝'}</span><p className="text-[13px] font-bold text-[#3C2415]">{j.title}</p></div>
                    <p className="text-[11px] text-[#8B7355] mt-0.5">{j.place} · {j.date}</p>
                    <p className="text-[12px] text-[#6B4D3A] mt-1 line-clamp-2">{j.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 pb-8 flex gap-2">
              <button onClick={() => deleteUser(detailUser.id)} className="flex-1 py-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold">🗑️ Delete User</button>
              <button onClick={() => setDetailUser(null)} className="flex-1 py-3 rounded-xl bg-gray-100 text-[#3C2415] text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
