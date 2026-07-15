import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  busy:      { label: 'Busy',      color: 'bg-amber-500',   ring: 'ring-amber-200',   text: 'text-amber-700',   bg: 'bg-amber-50'   },
  offline:   { label: 'Offline',   color: 'bg-gray-400',    ring: 'ring-gray-200',    text: 'text-gray-600',    bg: 'bg-gray-50'    },
};

export default function AvailabilityToggle() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const current = user?.availabilityStatus || 'available';
  const cfg = STATUS_CONFIG[current as keyof typeof STATUS_CONFIG];

  const changeStatus = async (status: string) => {
    setLoading(true);
    setOpen(false);
    try {
      const { data } = await api.patch('/users/availability', { availabilityStatus: status });
      updateUser(data.user);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        disabled={loading}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${cfg.bg} ${cfg.text} text-xs font-bold border ${cfg.ring} border-2 hover:opacity-90 transition-all`}
      >
        <div className={`w-2 h-2 rounded-full ${cfg.color} ${current === 'available' ? 'animate-pulse' : ''}`} />
        <span className="hidden sm:inline">{t(`common.${current}`)}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[9999]">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <button
              key={status}
              onClick={() => changeStatus(status)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${current === status ? config.text + ' font-bold' : 'text-gray-700'}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
              {t(`common.${status}`)}
              {current === status && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
