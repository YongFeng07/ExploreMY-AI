'use client';
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    const isDark = stored === 'true' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', String(next));
  };

  return (
    <button onClick={toggle} className="w-10 h-10 rounded-full bg-white dark:bg-[#1A231D] border border-[#E8D5C4] dark:border-[#2A302A] flex items-center justify-center hover:bg-[#F5EDE3] dark:hover:bg-[#242824] transition-colors shadow-sm"
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      {dark ? <Sun className="h-5 w-5 text-[#D4A95F]" /> : <Moon className="h-5 w-5 text-[#6B4D3A]" />}
    </button>
  );
}
