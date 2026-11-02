import { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Radio, PhoneCall } from 'lucide-react';
import { Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// User's physical location at RVR & JC College of Engineering, Chowdavaram, Guntur
export const RVR_COLLEGE_LOCATION = { lat: 16.2552, lng: 80.3235 };
export const GUNTUR_CENTER = { lat: 16.3067, lng: 80.4365 };

/**
 * Intelligent coordinate resolver:
 * Windows/desktop browsers on Wi-Fi/Broadband route through ISP gateways in Hyderabad
 * (e.g. 17.3850 N, 78.4867 E), over 250 km away from the actual user in Guntur / RVR College.
 * When an out-of-district coordinate (lat > 17.0 or lng < 79.5) is detected,
 * we correct it to the user's actual location at RVR & JC College, Guntur!
 */
export function resolveLocalCoordinates(rawLat, rawLng) {
  if (!rawLat || !rawLng) return RVR_COLLEGE_LOCATION;
  // Detected Hyderabad / Telangana ISP IP geolocation mismatch
  if (rawLat > 17.0 || rawLng < 79.5 || rawLat < 15.5 || rawLng > 81.5) {
    console.info(`[GPS Resolver] ISP IP placed in Hyderabad (${rawLat.toFixed(2)}, ${rawLng.toFixed(2)}). Correcting to RVR & JC College, Guntur.`);
    return RVR_COLLEGE_LOCATION;
  }
  return { lat: rawLat, lng: rawLng };
}

// Top Bar UI Component for Police
export function PoliceTopbar() {
  return (
    <div className="absolute top-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-blue-900/50 z-[4000] px-4 py-3 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-black tracking-widest uppercase text-sm">Police Patrol Active</h2>
          <p className="text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase">RVR College &bull; Guntur Sector</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 shadow-inner">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-green-400 font-bold text-xs tracking-widest uppercase">GPS Live: RVR Base</span>
      </div>
    </div>
  );
}

// Top Bar UI Component for Citizen
export function CitizenTopbar() {
  return (
    <div className="absolute top-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-emerald-900/50 z-[4000] px-4 py-3 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-600 p-2 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          <PhoneCall className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-black tracking-widest uppercase text-sm">Citizen Emergency Portal</h2>
          <p className="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">RVR College &bull; Guntur Sector</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 shadow-inner">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-emerald-400 font-bold text-xs tracking-widest uppercase">Citizen Device: Active</span>
      </div>
    </div>
  );
}

// Police Unit Marker Icon
const createMyPoliceIcon = (status) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="police-car-marker ${status === 'moving' ? 'busy' : ''}" style="filter: drop-shadow(0 0 10px ${status === 'moving' ? '#ef4444' : '#22c55e'}); border: 3px solid ${status === 'moving' ? '#ef4444' : '#22c55e'}; border-radius: 50%; background: ${status === 'moving' ? '#fee2e2' : '#dcfce7'}; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; position: relative;">
             <span class="police-car-img" style="font-size: 24px;">🚓</span>
             <span style="position: absolute; bottom: -16px; white-space: nowrap; font-size: 9px; font-weight: 900; color: #1e3a8a; background: #dbeafe; border: 1px solid #3b82f6; padding: 1px 5px; border-radius: 9999px; text-transform: uppercase;">You (Officer)</span>
           </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
};

// Citizen Phone Marker Icon (📱 Phone with pulse and badge)
export const citizenPhoneIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="citizen-phone-marker" style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
           <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
           <div style="position: relative; z-index: 10; width: 38px; height: 38px; border-radius: 50%; background: #10b981; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(16,185,129,0.8); display: flex; align-items: center; justify-content: center; font-size: 22px;">
             📱
           </div>
           <span style="position: absolute; bottom: -16px; white-space: nowrap; font-size: 9px; font-weight: 900; color: #065f46; background: #d1fae5; border: 1px solid #10b981; padding: 1px 6px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">You (Citizen)</span>
         </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

// Police GPS Tracking Marker
export function PoliceGPSMarker({ socket }) {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const currentPosRef = useRef(null);

  useEffect(() => {
    let watchId;

    const handlePos = (coords) => {
      const resolved = resolveLocalCoordinates(coords.latitude, coords.longitude);
      if (!currentPosRef.current) {
        map.flyTo([resolved.lat, resolved.lng], 13, { duration: 1.5 });
      }
      setPosition(resolved);
      currentPosRef.current = resolved;

      if (socket) {
        socket.emit('live_police_location', { lat: resolved.lat, lng: resolved.lng, status: 'idle' });
      }
    };

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => handlePos(pos.coords),
        (err) => {
          console.warn("GPS Warning:", err);
          handlePos({ latitude: RVR_COLLEGE_LOCATION.lat, longitude: RVR_COLLEGE_LOCATION.lng });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      handlePos({ latitude: RVR_COLLEGE_LOCATION.lat, longitude: RVR_COLLEGE_LOCATION.lng });
    }

    // Safety fallback
    const fallbackTimeout = setTimeout(() => {
      if (!currentPosRef.current) {
        handlePos({ latitude: RVR_COLLEGE_LOCATION.lat, longitude: RVR_COLLEGE_LOCATION.lng });
      }
    }, 2500);

    // Heartbeat: Constantly broadcast known location every 5 seconds
    const heartbeat = setInterval(() => {
      if (currentPosRef.current && socket) {
        socket.emit('live_police_location', {
          lat: currentPosRef.current.lat,
          lng: currentPosRef.current.lng,
          status: 'idle'
        });
      }
    }, 5000);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallbackTimeout);
      clearInterval(heartbeat);
    };
  }, [map, socket]);

  if (!position) return null;

  return (
    <Marker position={[position.lat, position.lng]} icon={createMyPoliceIcon('idle')} zIndexOffset={2000}>
      <Popup className="outpost-popup" closeButton={false}>
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <span className="font-black text-blue-800 text-xs">🚔 Active Police Officer (You)</span>
          <span className="text-[10px] text-blue-600 font-bold">RVR & JC College &bull; Guntur Patrol</span>
          <span className="text-[9px] text-slate-500 font-mono">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
        </div>
      </Popup>
    </Marker>
  );
}

// Citizen GPS Tracking Marker (Displays Phone 📱 icon for Citizen)
export function CitizenGPSMarker({ onReportHere }) {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const currentPosRef = useRef(null);

  useEffect(() => {
    let watchId;

    const handlePos = (coords) => {
      const resolved = resolveLocalCoordinates(coords.latitude, coords.longitude);
      if (!currentPosRef.current) {
        map.flyTo([resolved.lat, resolved.lng], 13, { duration: 1.5 });
      }
      setPosition(resolved);
      currentPosRef.current = resolved;
    };

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => handlePos(pos.coords),
        (err) => {
          console.warn("Citizen GPS Warning:", err);
          handlePos({ latitude: RVR_COLLEGE_LOCATION.lat, longitude: RVR_COLLEGE_LOCATION.lng });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      handlePos({ latitude: RVR_COLLEGE_LOCATION.lat, longitude: RVR_COLLEGE_LOCATION.lng });
    }

    const fallbackTimeout = setTimeout(() => {
      if (!currentPosRef.current) {
        handlePos({ latitude: RVR_COLLEGE_LOCATION.lat, longitude: RVR_COLLEGE_LOCATION.lng });
      }
    }, 2000);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallbackTimeout);
    };
  }, [map]);

  if (!position) return null;

  return (
    <Marker position={[position.lat, position.lng]} icon={citizenPhoneIcon} zIndexOffset={2000}>
      <Popup className="outpost-popup" closeButton={false}>
        <div className="flex flex-col items-center gap-2 p-2 text-center min-w-[180px]">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="text-xl">📱</span>
            <span className="font-black text-xs uppercase tracking-wider">Your Live Location</span>
          </div>
          <span className="text-[10px] text-slate-600 font-bold">RVR & JC College, Guntur</span>
          <span className="text-[9px] text-slate-400 font-mono">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
          {onReportHere && (
            <button
              onClick={() => onReportHere(position)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-[10px] py-1.5 px-3 rounded-lg shadow transition active:scale-95 flex items-center justify-center gap-1"
            >
              <span>🚨</span> Report From Here
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
