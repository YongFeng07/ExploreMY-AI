'use client';
import Link from 'next/link';
import { MapPin, CalendarDays } from 'lucide-react';

export function TripCard({ trip }: { trip: any }) {
  return (
    <Link href={`/trips/${trip.id}`} className="card-travel p-4 block hover:border-[#E87722]/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-extrabold text-[#1A1A1A]">{trip.title}</h3>
        <span className="text-[10px] font-bold bg-[#FFF3E8] text-[#E87722] rounded-full px-2.5 py-1 uppercase">{trip.status}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-[#6B7280]">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {trip.destinationCity}</span>
        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {trip.startDate} – {trip.endDate}</span>
      </div>
      {trip.totalCost && <p className="text-sm font-bold text-[#E87722] mt-2">RM {trip.totalCost}</p>}
    </Link>
  );
}
