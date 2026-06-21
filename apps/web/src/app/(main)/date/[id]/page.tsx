// @ts-nocheck
'use client';
import { use } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Sparkles, Star, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIP_DATA: Record<string, any> = {
  't1': { title: 'Penang Food Adventure', city: 'George Town', dates: 'Jul 15-17, 2026', days: 3, budget: 500, status: 'PLANNED', ai: true, emoji: '🍜', stops: [{ day: 1, theme: 'George Town Street Food', items: [{ time: '8:00 AM', name: 'Transfer Road Roti Canai', cost: 'RM5', desc: 'Flaky roti canai since 1950s' }, { time: '10:00 AM', name: 'Chew Jetty', cost: 'Free', desc: 'Historic waterfront settlements' }, { time: '12:30 PM', name: 'Penang Road Cendol', cost: 'RM4', desc: 'Iconic shaved ice dessert' }] }, { day: 2, theme: 'Temples & Hills', items: [{ time: '8:00 AM', name: 'Toh Soon Cafe', cost: 'RM6', desc: 'Charcoal-toasted bread since 1959' }, { time: '10:00 AM', name: 'Kek Lok Si Temple', cost: 'RM8', desc: 'SE Asia largest Buddhist temple' }, { time: '3:00 PM', name: 'Penang Hill', cost: 'RM30', desc: 'Cool mountain air, 360° views' }] }] },
  't2': { title: 'KL Weekend Getaway', city: 'Kuala Lumpur', dates: 'Jun 28-30, 2026', days: 2, budget: 300, status: 'DRAFT', ai: false, emoji: '🏙️', stops: [{ day: 1, theme: 'KL Icons', items: [{ time: '9:00 AM', name: 'Petronas Twin Towers', cost: 'RM80', desc: '452m iconic landmark' }, { time: '1:00 PM', name: 'Jalan Alor', cost: 'RM25', desc: 'Famous food street' }] }] },
};

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trip = TRIP_DATA[id] || TRIP_DATA['t1']!;

  return (
    <div className="min-h-dvh bg-[#FFFDF7]">
      <TopBar title={trip.title} showBack backHref="/date" />
      <div className="px-4 pt-20 pb-24 space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-[#C4956A] to-[#D4A574] p-6 text-white shadow-xl">
          <div className="flex items-center gap-2">{trip.ai && <Badge className="bg-white/20 text-white text-[10px]"><Sparkles className="h-3 w-3 mr-0.5" />AI</Badge>}<Badge className={cn('text-[10px]', trip.status === 'PLANNED' ? 'bg-white/20 text-white' : 'bg-white/20 text-white')}>{trip.status}</Badge></div>
          <h1 className="mt-2 text-2xl font-extrabold">{trip.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-white/80"><MapPin className="h-4 w-4" />{trip.city}<span>·</span><Calendar className="h-4 w-4" />{trip.dates}<span>·</span>{trip.days} days<span>·</span>RM{trip.budget}</div>
        </div>
        {trip.stops?.map((day: any) => (
          <div key={day.day} className="rounded-2xl border border-[#E8D5C4] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#3C2415] mb-3">Day {day.day} — {day.theme}</h3>
            <div className="space-y-2">
              {day.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E8D5C4] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FDF0E0] text-xs font-extrabold text-[#C4956A]">{i + 1}</div>
                  <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#8B7355]">{item.time}</p><p className="text-sm font-extrabold text-[#3C2415]">{item.name}</p><p className="text-xs text-[#8B7355]">{item.desc}</p></div>
                  <span className="text-xs font-extrabold text-[#C4956A]">{item.cost}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="w-full rounded-2xl bg-[#C4956A] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#C4956A]/25"><Navigation className="inline h-4 w-4 mr-1.5" />Start Navigation</button>
      </div>
    </div>
  );
}
