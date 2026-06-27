'use client';
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  alt?: string;
}

/** Full-screen image viewer — tap any place photo to view it enlarged, with carousel navigation */
export function ImageViewer({ images, initialIndex = 0, onClose, alt = 'Photo' }: ImageViewerProps) {
  const [idx, setIdx] = useState(initialIndex);
  const filtered = (images || []).filter(Boolean);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(p => (p - 1 + filtered.length) % filtered.length);
      if (e.key === 'ArrowRight') setIdx(p => (p + 1) % filtered.length);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [filtered.length, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <button onClick={onClose} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="h-6 w-6" />
        </button>
        <span className="text-white text-[13px] font-bold">{idx + 1} / {filtered.length}</span>
        <div className="w-10" />
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-2" onClick={e => e.stopPropagation()}>
        <img
          src={filtered[idx]}
          className="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
          alt={`${alt} ${idx + 1}`}
          draggable={false}
        />
      </div>

      {/* Navigation */}
      {filtered.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(p => (p - 1 + filtered.length) % filtered.length); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(p => (p + 1) % filtered.length); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
            {filtered.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`rounded-full transition-all ${i === idx ? 'bg-white w-6 h-2' : 'bg-white/40 w-2 h-2'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
