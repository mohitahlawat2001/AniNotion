import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'aninotion:dark-mode';

const DarkModeToggle = ({ className = '' }) => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const val = saved === 'true';
        setDark(val);
        if (val) document.documentElement.classList.add('dark');
      } else {
        // default to system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDark(prefersDark);
        if (prefersDark) document.documentElement.classList.add('dark');
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch (e) {
      // ignore
    }
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={
        `flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg
         border border-gray-300 hover:border-gray-400
         bg-white hover:bg-gray-50
         text-gray-600 hover:text-gray-800
         transition-all duration-200 touch-target ${className}`
      }
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default DarkModeToggle;
