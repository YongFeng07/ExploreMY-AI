'use client';
import { useState, useCallback } from 'react';

let toastFn: ((msg: string, type?: 'success'|'error'|'info') => void) | null = null;

export function showToast(msg: string, type: 'success'|'error'|'info' = 'success') {
  if (toastFn) toastFn(msg, type);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{msg:string;type:string;id:number}|null>(null);

  toastFn = useCallback((msg: string, type: string = 'success') => {
    const id = Date.now();
    setToast({ msg, type, id });
    setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 2500);
  }, []);

  return (
    <>
      {children}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up pointer-events-none">
          <div className={`rounded-2xl px-5 py-3 shadow-xl text-white text-[14px] font-extrabold backdrop-blur-md ${
            toast.type === 'success' ? 'bg-emerald-500/90' : toast.type === 'error' ? 'bg-red-500/90' : 'bg-gray-800/90'
          }`}>
            {toast.type === 'success' ? '✅ ' : toast.type === 'error' ? '❌ ' : 'ℹ️ '}
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}
