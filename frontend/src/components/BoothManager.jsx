import { useState, useEffect } from 'react';

export default function BoothManager({ selectedPos, onAddBooth }) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Auto-fill from map click (but do NOT force open the panel)
  useEffect(() => {
    if (selectedPos) {
      setLat(selectedPos.lat.toFixed(5));
      setLng(selectedPos.lng.toFixed(5));
    }
  }, [selectedPos]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 z-[2000] bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-[0_10px_25px_rgba(37,99,235,0.5)] transition-all hover:scale-110 active:scale-95 border-[3px] border-white/50"
        title="Add Police Outpost"
      >
        🛡️
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 right-6 z-[2000] bg-white/60 backdrop-blur-xl border border-white/50 p-5 rounded-3xl shadow-2xl w-72 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl drop-shadow-md">🛡️</span>
          <h3 className="font-black text-slate-800 tracking-tight leading-tight">Add Outpost <br/><span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Admin / Officers</span></h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl leading-none">&times;</button>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="Latitude" 
            value={lat} 
            onChange={e => setLat(e.target.value)}
            className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:font-normal"
          />
          <input 
            type="number" 
            placeholder="Longitude" 
            value={lng} 
            onChange={e => setLng(e.target.value)}
            className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:font-normal"
          />
        </div>
        
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Type coords or click on the map</p>
        
        <button 
          onClick={() => {
            if(lat && lng) {
              onAddBooth({ lat: parseFloat(lat), lng: parseFloat(lng) });
              setLat('');
              setLng('');
              setIsOpen(false);
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest uppercase text-xs py-3 rounded-xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95"
        >
          Deploy
        </button>
      </div>
    </div>
  );
}
