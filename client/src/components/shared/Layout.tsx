import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Map, MessageSquare, Heart, User, LayoutDashboard, LogOut, Droplets, Users, Calendar, Home, Building, Trophy, Tent } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import LanguageSwitcher from './LanguageSwitcher';
import AvailabilityToggle from './AvailabilityToggle';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleLogout = () => { logout(); navigate('/'); };

  const isOrgUser = user?.role === 'organization';

  const navItems = [
    { to: '/dashboard', icon: Home,          label: t('nav.dashboard') },
    { to: '/map',          icon: Map,            label: t('nav.map')          },
    { to: '/requests',     icon: Heart,          label: t('nav.requests')     },
    ...(!isOrgUser ? [{ to: '/appointments', icon: Calendar, label: t('nav.appointments') }] : []),
    { to: '/camps',        icon: Tent,            label: 'Camps'               },
    { to: '/leaderboard',  icon: Trophy,          label: 'Leaderboard'         },
    { to: '/compatibility',icon: Droplets,        label: 'Compatibility'       },
    { to: '/chat',         icon: MessageSquare,   label: t('nav.chat')         },
    { to: '/community',    icon: Users,           label: t('nav.community')    },
    { to: '/profile',      icon: User,            label: t('nav.profile')      },
    ...(user?.role === 'admin'        ? [{ to: '/admin',        icon: LayoutDashboard, label: t('nav.admin') }]  : []),
    ...(user?.role === 'organization' ? [{ to: '/org-dashboard',icon: Building,        label: t('nav.org')   }] : []),
  ];

  const mobileNav = [
    { to: '/map',          icon: Map,       label: t('nav.map') },
    { to: '/requests',     icon: Heart,     label: t('nav.requests') },
    ...(!isOrgUser ? [{ to: '/appointments', icon: Calendar, label: t('nav.appointments') }] : []),
    { to: '/camps',        icon: Tent,      label: 'Camps' },
    { to: '/profile',      icon: User,      label: t('nav.profile') },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <nav className="glass sticky top-0 z-50 border-b border-red-100/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blood-600 to-blood-800 rounded-xl flex items-center justify-center shadow-md">
                <Droplets className="w-5 h-5 text-white animate-heartbeat" />
              </div>
              <span className="font-display text-xl font-bold text-blood-800 hidden sm:block">LifeFlow</span>
            </NavLink>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blood-50 text-blood-700 shadow-sm' : 'text-gray-500 hover:text-blood-600 hover:bg-red-50'}`
                }>
                  <Icon className="w-4 h-4" />{label}
                </NavLink>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1.5">
              <AvailabilityToggle />
              <LanguageSwitcher />
              <NotificationPanel />
              <NavLink to="/profile" className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm leading-tight">
                  <p className="font-semibold text-gray-800">{user?.name?.split(' ')[0]}</p>
                  <p className="text-blood-600 font-black text-xs">{user?.bloodType}</p>
                </div>
              </NavLink>
              <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1">
                <LogOut className="w-4 h-4" /><span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-red-100/60 z-50">
        <div className="flex justify-around py-1.5">
          {mobileNav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0 ${isActive ? 'text-blood-700' : 'text-gray-400'}`
            }>
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 pb-20 md:pb-0"><Outlet /></main>
    </div>
  );
}
