import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const changeLanguage = async (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lifeflow_lang', code);
    setOpen(false);
    try { await api.patch('/users/language', { preferredLanguage: code }); } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-colors text-sm text-gray-600"
        title="Change Language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">{current.flag} {current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[9999]">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-blood-50 transition-colors ${i18n.language === lang.code ? 'text-blood-700 font-bold bg-blood-50' : 'text-gray-700'}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.label}</span>
              {i18n.language === lang.code && <span className="ml-auto text-blood-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
