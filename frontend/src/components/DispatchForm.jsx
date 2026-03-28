import { useState } from 'react';

export default function DispatchForm({ selectedPos, onSubmit, onCancel }) {
  const [incidentType, setIncidentType] = useState('Booth Capture');
  const [severityLevel, setSeverityLevel] = useState('High');

  if (!selectedPos) return null;

  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-lg px-4">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-[0_15px_60px_rgba(0,0,0,0.2)] overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-white font-black text-lg tracking-wider flex items-center gap-2">
            <span className="text-red-500 animate-pulse">●</span> ADMIN CONTROL PANEL
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white font-bold transition">✕</button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Incident Type</label>
            <select 
              value={incidentType} 
              onChange={e => setIncidentType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Booth Capture">Booth Capture</option>
              <option value="Violence">Violence</option>
              <option value="EVM Tampering">EVM Tampering</option>
              <option value="Suspicious Activity">Suspicious Activity</option>
            </select>
          </div>

          <div>
             <label className="block text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Severity Level</label>
             <div className="grid grid-cols-3 gap-3">
               {['Low', 'Medium', 'High'].map(level => (
                 <button
                   key={level}
                   onClick={() => setSeverityLevel(level)}
                   className={`py-2 px-3 rounded-lg font-bold text-sm tracking-wide transition border ${
                     severityLevel === level 
                       ? level === 'High' ? 'bg-red-500 text-white border-red-600 shadow-md' 
                       : level === 'Medium' ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                       : 'bg-yellow-500 text-white border-yellow-600 shadow-md'
                       : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   {level.toUpperCase()}
                 </button>
               ))}
             </div>
          </div>

          <button 
            onClick={() => {
              onSubmit(selectedPos, incidentType, severityLevel);
            }}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xl font-black py-4 rounded-xl shadow-[0_5px_15px_rgba(220,38,38,0.4)] transform transition hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 border-2 border-white ring-2 ring-red-500/30 tracking-widest"
          >
            <span className="text-2xl animate-spin-slow">🚨</span> 
            RUSH TO LOCATION
          </button>
        </div>
      </div>
    </div>
  );
}
