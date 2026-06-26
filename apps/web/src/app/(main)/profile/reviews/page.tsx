// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, MapPin, Plus, X, Calendar, Navigation, Trash2 } from 'lucide-react';
const REVIEW_KEY = 'profile_reviews';

function loadReviews() { try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '[]'); } catch { return []; } }
function saveReviews(r: any[]) { localStorage.setItem(REVIEW_KEY, JSON.stringify(r)); }

export default function ReviewsPage() {
  const [items, setItems] = useState<any[]>(loadReviews);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ placeName: '', city: '', rating: 5, text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!form.placeName.trim() || !form.text.trim()) { setError('Place name and review text are required'); return; }
    const newReview = { id: 'r_' + Date.now(), ...form, date: new Date().toISOString() };
    const updated = [newReview, ...items];
    saveReviews(updated); setItems(updated);
    setShowForm(false); setForm({ placeName: '', city: '', rating: 5, text: '' });
  };

  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/auth/me/reviews/${id}?userId=${uid}`, { method: 'DELETE', headers: getAuthHeaders() });
    load();
  };

  const openMaps = (name: string, city: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + city)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4 flex justify-between items-center">
        <div>
          <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Back</Link>
          <h1 className="text-[28px] font-extrabold text-[#3C2415]">⭐ My Reviews</h1>
          <p className="text-[13px] text-[#8B7355] mt-1">{items.length} reviews</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="w-11 h-11 rounded-full bg-[#C4956A] text-white flex items-center justify-center shadow-md hover:bg-[#B8860B] transition-colors text-xl">
          {showForm ? '✕' : <Plus className="h-5 w-5" />}
        </button>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="px-5 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4] space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[14px] font-bold text-[#3C2415]">Write a Review</h3>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-[#8B7355]" /></button>
            </div>
            <input value={form.placeName} onChange={e => setForm({ ...form, placeName: e.target.value })}
              placeholder="Place name (e.g. Nasi Kandar Line Clear)" className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[15px] font-bold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="City (e.g. Penang)" className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map(j => (
              <button key={j} onClick={() => setForm({ ...form, rating: j })}
                className={`text-3xl transition-all ${j <= form.rating ? 'text-amber-400 scale-110' : 'text-[#D4C4B0]'}`}>★</button>))}
              <span className="text-[13px] text-[#8B7355] ml-2 self-center">{form.rating}/5</span>
            </div>
            <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })}
              placeholder="Share your experience... What did you love? What should others know?" rows={4}
              className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A] resize-none leading-relaxed" />
            {error && <p className="text-[13px] text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <button onClick={submit} disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#C4956A] text-white text-[14px] font-extrabold hover:bg-[#B8860B] transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="px-5 pb-24 space-y-3">
        {loading && <div className="text-center py-10"><div className="w-10 h-10 rounded-full border-2 border-[#C4956A]/20 border-t-[#C4956A] animate-spin mx-auto" /></div>}
        {!loading && items.length === 0 && !showForm && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">⭐</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No reviews yet</p>
            <p className="text-[#8B7355] text-sm mt-1">Share your experiences at places you've visited</p>
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/70 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-extrabold text-[#3C2415] truncate">{item.placeName}</h3>
                <p className="text-[12px] text-[#8B7355] flex items-center gap-2 mt-0.5">
                  {item.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.city}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{item.date}</span>
                </p>
              </div>
              <button onClick={() => remove(item.id)}
                className="p-2 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"><Trash2 className="h-4 w-4 text-red-400" /></button>
            </div>
            <div className="flex gap-0.5 mb-2">{[1, 2, 3, 4, 5].map(j => (
              <Star key={j} className={`h-4 w-4 ${j <= (item.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-[#D4C4B0]'}`} />))}</div>
            <p className="text-[14px] text-[#6B4D3A] leading-relaxed">{item.text}</p>
            <button onClick={() => openMaps(item.placeName, item.city)}
              className="mt-2 text-[12px] font-semibold text-[#C4956A] flex items-center gap-1 hover:underline"><Navigation className="h-3 w-3" />View on Maps</button>
          </div>
        ))}
      </div>
    </div>
  );
}
