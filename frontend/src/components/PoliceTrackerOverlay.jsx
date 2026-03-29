import { useEffect, useState, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Top Bar UI Component
export function PoliceTopbar() {
  return (
    <div className="absolute top-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-blue-900/50 z-[4000] px-4 py-3 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-black tracking-widest uppercase text-sm">Police Patrol Active</h2>
          <p className="text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase">Secure Network</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 shadow-inner">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-green-400 font-bold text-xs tracking-widest uppercase">Tracking: ON</span>
      </div>
    </div>
  );
}

// Marker Logic Component
const createMyPoliceIcon = (status) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="police-car-marker ${status === 'moving' ? 'busy' : ''}" style="filter: drop-shadow(0 0 10px ${status === 'moving' ? '#ef4444' : '#22c55e'}); border: 3px solid ${status === 'moving' ? '#ef4444' : '#22c55e'}; border-radius: 50%; background: ${status === 'moving' ? '#fee2e2' : '#dcfce7'}; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
             <span class="police-car-img" style="font-size: 24px;">🚓</span>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

export function PoliceGPSMarker({ incidents, socket }) {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState('idle'); // idle or moving
  const [route, setRoute] = useState([]);
  
  const currentPosRef = useRef(null);
  
  // 1. Initial GPS Tracking
  useEffect(() => {
    let watchId;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          // If this is the very first fix, snap map to it to give the user context
          if (!currentPosRef.current) {
            map.flyTo([newPos.lat, newPos.lng], 14, { duration: 2 });
          }
          if (status === 'idle') {
            setPosition(newPos);
            currentPosRef.current = newPos;
            
            // Broadcast location to all peers globally
            if (socket) {
              socket.emit('live_police_location', { lat: newPos.lat, lng: newPos.lng, status });
            }
          }
        },
        (err) => console.warn("GPS Error:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    
    // Fallback if no GPS is available after 3 seconds: Start at a random default
    const fallbackTimeout = setTimeout(() => {
      if (!currentPosRef.current) {
         const fallbackPos = { lat: 14.68, lng: 77.59 };
         setPosition(fallbackPos);
         currentPosRef.current = fallbackPos;
         map.flyTo([14.68, 77.59], 14, { duration: 2 });
         
         if (socket) {
           socket.emit('live_police_location', { lat: fallbackPos.lat, lng: fallbackPos.lng, status });
         }
      }
    }, 3000);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallbackTimeout);
    };
  }, [map, status]);

  // 2. Incident Handling Removed to prevent duplicate responders.
  // The local police marker will now strictly represent the logged-in officer's actual physical location.
  // The backend will perfectly assign ONLY the single closest available patrolling officer.
  
  if (!position) return null;

  return (
    <>
      <Marker 
        position={[position.lat, position.lng]} 
        icon={createMyPoliceIcon(status)} 
        zIndexOffset={2000} 
      />
      {route.length > 1 && (
        <Polyline
          positions={route}
          color={status === 'moving' ? '#ef4444' : '#22c55e'}
          dashArray="10, 10"
          weight={6}
          opacity={0.8}
          className="animate-pulse shadow-xl"
        />
      )}
    </>
  );
}
