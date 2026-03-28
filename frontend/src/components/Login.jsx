import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CarFront, Lock, Users, MapPin } from 'lucide-react';

export default function Login() {
  const [activeTab, setActiveTab] = useState('police'); // 'police' | 'citizen'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePoliceLogin = (e) => {
    e.preventDefault();
    if (email === 'AP-POLICE-100' && password === 'admin123') {
      localStorage.setItem('patrol_token', 'temp_police_token_' + Date.now());
      localStorage.setItem('role', 'police');
      navigate('/map');
    } else {
      setError('Invalid Police ID or Security Key.');
    }
  };

  const handleCitizenLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('patrol_token', 'citizen_session_' + Date.now());
    localStorage.setItem('role', 'citizen');
    navigate('/map');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow based on active tab */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[150px] rounded-full pointer-events-none transition-colors duration-1000 ${
        activeTab === 'police' ? 'bg-blue-600/20' : 'bg-emerald-600/20'
      }`}></div>
      
      <div className="max-w-md w-full relative z-10 flex flex-col pt-8 pb-16">
        
        {/* TABS MENU */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-6 shadow-lg border border-slate-700/50 backdrop-blur-md">
          <button 
            onClick={() => { setActiveTab('police'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'police' 
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Police 
          </button>
          <button 
            onClick={() => { setActiveTab('citizen'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'citizen' 
                ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-4 h-4" /> Citizen 
          </button>
        </div>

        {/* MAIN CARD */}
        <div className="bg-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl transition-all duration-300">
          
          {activeTab === 'police' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                  <ShieldAlert className="w-10 h-10 text-blue-500" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-widest text-center">
                  Patrol Force
                  <span className="block text-blue-400 text-xs tracking-[0.2em] mt-1 font-bold">Secure Access</span>
                </h1>
              </div>

              <form onSubmit={handlePoliceLogin} className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Unique Police ID</label>
                  <div className="relative">
                    <CarFront className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="text" 
                      value={email}
                      onChange={(e) => { setEmail(e.target.value.toUpperCase()); setError(''); }}
                      placeholder="e.g. AP-POLICE-100"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Security Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="admin123"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono placeholder:text-slate-600 tracking-widest"
                      required
                    />
                  </div>
                </div>

                {error && <div className="text-red-400 text-xs font-bold text-center bg-red-900/20 border border-red-500/20 rounded-lg p-2 animate-pulse">{error}</div>}

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                  Confirm Identity <ShieldAlert className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'citizen' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-emerald-600/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                  <Users className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-widest text-center">
                  Citizen Portal
                  <span className="block text-emerald-400 text-xs tracking-[0.2em] mt-1 font-bold">Public Reporting Network</span>
                </h1>
              </div>
              
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 mb-8 border-dashed">
                <p className="text-slate-300 text-sm text-center leading-relaxed font-medium">
                  Use this portal to view the live GPS grid and immediately notify authorities of ongoing incidents. <br/><br/>
                  <span className="text-emerald-400 font-bold uppercase text-xs tracking-wider">No password required.</span>
                </p>
              </div>

              <form onSubmit={handleCitizenLogin}>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  Enter Map System <MapPin className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
      
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] pointer-events-none w-full">
        A.P. Smart Election Monitoring Grid
      </p>
    </div>
  );
}
