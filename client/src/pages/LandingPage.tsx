import { Link } from 'react-router-dom';
import { Droplets, Heart, Map, Users, Shield, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-blood-900 to-red-950 text-white">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
          <Droplets className="w-11 h-11 text-red-300 animate-heartbeat" />
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold mb-4">LifeFlow</h1>
        <p className="text-xl text-white/70 mb-3">Blood Donor Network</p>
        <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">Connecting blood donors with those in need. Every drop counts. Every life matters.</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/signup" className="flex items-center gap-2 bg-white text-blood-800 font-bold px-8 py-4 rounded-2xl hover:bg-red-50 transition-all shadow-xl hover:-translate-y-0.5 text-lg">
            <Heart className="w-5 h-5" /> Register as Donor <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all backdrop-blur text-lg border border-white/20">
            Sign In
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Map, title: 'Find Donors', desc: 'Locate eligible blood donors near you on an interactive live map' },
            { icon: Users, title: 'Community', desc: 'Join the blood donor community, share stories and ask for urgent help' },
            { icon: Shield, title: 'Verified & Safe', desc: 'All donors verified with eligibility checks and safety protocols' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors text-left">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-red-300" />
              </div>
              <h3 className="font-display text-lg font-bold mb-1">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-white/30 text-sm">Built with ❤️ to save lives across India</p>
      </div>
    </div>
  );
}
