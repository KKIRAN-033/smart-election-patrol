export default function FloatingDashboard({ activeTracker, onResolve, isPolice = false }) {
  if (!activeTracker) return null;

  const { officerName, distance, eta, incidentId, incidentType, severityLevel } = activeTracker;

  return (
    <div className={`absolute ${isPolice ? 'top-20' : 'top-4'} right-6 z-[2000] w-80 pointer-events-auto`}>
      <div className="bg-[#ffffff]/95 backdrop-blur-3xl border border-gray-200 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-500 ease-out transform translate-y-0 opacity-100">
        
        {/* Header Ribbon */}
        <div className={`p-4 relative overflow-hidden flex items-center gap-3 ${severityLevel === 'High' ? 'bg-red-600' : severityLevel === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`}>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
             <span className="text-xl">🚔</span>
          </div>
          <div>
            <h2 className="text-white font-black text-lg tracking-wide leading-tight flex items-center gap-2">
              {isPolice ? `Unit ${officerName} En Route` : `Officer ${officerName} Coming`}
              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            </h2>
            <p className="text-white text-xs font-bold uppercase tracking-widest mt-1 opacity-95 items-center flex gap-1">
              <span>{severityLevel} SEVERITY</span>
              <span className="opacity-50">•</span>
              <span>{incidentType}</span>
            </p>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="p-6">
          <div className="space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Live Distance</span>
                <span className="text-4xl font-black text-gray-800 font-mono tracking-tighter shadow-sm">
                  {distance.toFixed(2)}<span className="text-xl text-gray-400 font-medium ml-1">km</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Estimated Arrival</span>
                <span className="text-4xl font-black text-green-600 font-mono tracking-tighter">
                  {eta.toFixed(1)}<span className="text-xl text-green-800 font-medium ml-1">min</span>
                </span>
              </div>
            </div>

            {/* Police: Resolve Button */}
            {isPolice && (
              <button 
                onClick={() => onResolve(incidentId)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_5px_15px_rgba(239,68,68,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-wider text-sm mt-4 border border-red-400 cursor-pointer"
              >
                Force Scene Clear
              </button>
            )}

            {/* Citizen: Help message */}
            {!isPolice && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl py-3 px-4 text-center mt-4">
                <span className="text-blue-700 font-bold text-xs uppercase tracking-widest">
                  🔴 Stay calm — Help is on the way
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
