import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import OfficerMarker from './OfficerMarker';
import FloatingDashboard from './FloatingDashboard';
import DispatchForm from './DispatchForm';
import BoothManager from './BoothManager';
import { Popup } from 'react-leaflet';
import { PoliceTopbar, PoliceGPSMarker } from './PoliceTrackerOverlay';
import { useNavigate } from 'react-router-dom';

// Advanced UI/UX Mapping Layer Collection for Judges!
const TILE_LAYERS = {
  standard: {
    id: 'standard',
    name: "Clean View",
    icon: "🗺️",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attr: "&copy; CARTO"
  },
  satellite: {
    id: 'satellite',
    name: "Satellite Eye",
    icon: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri"
  },
  tactical: {
    id: 'tactical',
    name: "Tactical Tracks", // Footpaths & Bicycles 
    icon: "🚲",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attr: "&copy; CyclOSM"
  },
  command: {
    id: 'command',
    name: "Night Command",
    icon: "🏙️",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr: "&copy; CARTO"
  }
};


// Custom CSS Radar Pulse for the Incident Location
const radarIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="radar-blip">
           <div class="radar-wave"></div>
           <div class="radar-wave radar-wave-delayed"></div>
           <div class="radar-core"></div>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// A standard user footprint icon for setting coordinates
const userDropIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="font-size: 24px; text-shadow: 0px 4px 10px rgba(0,0,0,0.5);">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

// Powerful Shield Outpost Icon
const shieldIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="font-size: 38px; filter: drop-shadow(0px 6px 8px rgba(0,0,0,0.5)); transform: translateY(-5px);">🛡️</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38]
});

// Live Peer Police Icon
const peerPoliceIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="peer-police-marker" style="filter: drop-shadow(0 0 10px #3b82f6); border: 3px solid #3b82f6; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
           <span style="font-size: 20px;">🚓</span>
           <span class="absolute -top-1 -right-1 flex h-3 w-3">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
             <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
           </span>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

function LocationSelector({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export default function Map({ socket, liveActivePolice = {}, officers, incidents, stations = [], onReportIncident, onResolve, onAddBooth, onDeleteBooth }) {
  const [selectedPos, setSelectedPos] = useState(null);
  const [activeTracker, setActiveTracker] = useState(null);
  const navigate = useNavigate();

  const isPolice = localStorage.getItem('role') === 'police';

  // High-End Map Tactical Layer State
  const [activeLayer, setActiveLayer] = useState(TILE_LAYERS.standard);

  const handleTrackingUpdate = (data) => setActiveTracker(data);

  const handleDashboardResolve = (id) => {
    setActiveTracker(null);
    onResolve(id);
  };

  const activeIncidentExists = incidents.some(i => i.status === 'active');
  if (!activeIncidentExists && activeTracker) setActiveTracker(null);

  return (
    <div className={`relative w-full h-screen font-sans overflow-hidden ${activeLayer.id === 'command' || activeLayer.id === 'satellite' ? 'bg-black' : 'bg-gray-100'}`}>
      {isPolice && <PoliceTopbar />}
      <FloatingDashboard
        activeTracker={activeTracker}
        onResolve={handleDashboardResolve}
        isPolice={isPolice}
      />

      {/* GLOBAL LOGOUT BUTTON */}
      <button 
        onClick={() => {
          localStorage.removeItem('patrol_token');
          localStorage.removeItem('role');
          navigate('/login');
        }}
        className="absolute top-4 right-4 z-[4000] bg-slate-900/90 hover:bg-red-600 text-white border border-slate-700 hover:border-red-500 font-bold uppercase tracking-widest text-[10px] py-2 px-4 rounded-full shadow-lg transition-all backdrop-blur-md"
      >
        Logout
      </button>

      {/* TACTICAL MAP SELECTOR OVERLAY (GLASSMORPHIC) */}
      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-[2000] flex flex-col gap-3">
        {Object.values(TILE_LAYERS).map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer)}
            className={`group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 backdrop-blur-md shadow-lg border ${activeLayer.id === layer.id
                ? 'bg-blue-600/90 border-blue-400 text-white w-48'
                : 'bg-white/70 border-white/50 text-slate-700 hover:bg-white/95 w-14 hover:w-48 overflow-hidden'
              }`}
          >
            <span className="text-2xl flex-shrink-0 relative">
              {layer.icon}
              {activeLayer.id === layer.id && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
              )}
            </span>
            <span className={`font-black text-sm uppercase tracking-wider whitespace-nowrap transition-opacity duration-300 ${activeLayer.id === layer.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
              {layer.name}
            </span>
          </button>
        ))}
      </div>

      {/* CORE LEAFLET MAP */}
      <MapContainer
        center={[14.68, 77.59]}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          key={activeLayer.id} // Forces instantaneous re-render trick on layer swap
          url={activeLayer.url}
          attribution={activeLayer.attr}
        />

        {isPolice && <PoliceGPSMarker incidents={incidents} socket={socket} />}

        <LocationSelector onLocationSelect={setSelectedPos} />

        {/* Live Active Connected Peers (Other Police Officers streaming their GPS) */}
        {Object.values(liveActivePolice).map(peer => (
          <Marker
            key={`peer-${peer.id}`}
            position={[peer.lat, peer.lng]}
            icon={peerPoliceIcon}
            zIndexOffset={1900}
          >
            <Popup className="outpost-popup" closeButton={false}>
              <div className="flex flex-col items-center gap-1 p-1">
                <span className="font-black text-blue-800 text-xs">Active Patrol Unit</span>
                <span className="text-[10px] text-blue-600 font-bold">Live GPS Tracker Relay</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Selected Coordinates Pin - Instantly displays the Massive Radar Ping on click! */}
        {selectedPos && (
          <Marker position={[selectedPos.lat, selectedPos.lng]} icon={radarIcon} />
        )}

        {/* Huge Pulsing Red Radar rings for the actual incident location! */}
        {incidents.map(inc => (
          <Marker
            key={inc._id}
            position={[inc.location.lat, inc.location.lng]}
            icon={radarIcon}
          />
        ))}

        {/* Massive Police Fleet with Embedded Auto-Shrinking Real-Road Tracers */}
        {officers.map(officer => {
          const assignedIncident = incidents.find(
            i => i.status === 'active' &&
              (i.assignedOfficer?._id === officer._id || i.assignedOfficer === officer._id)
          );

          return (
            <OfficerMarker
              key={officer._id}
              officer={officer}
              assignedIncident={assignedIncident}
              onTrackingUpdate={handleTrackingUpdate}
              onResolve={handleDashboardResolve}
              activeLayerId={activeLayer.id}
            />
          );
        })}

        {/* Persistent Police Shield Outposts */}
        {stations.map(station => (
          <Marker 
            key={station._id}
            position={[station.location.lat, station.location.lng]}
            icon={shieldIcon}
          >
            <Popup className="outpost-popup" closeButton={false}>
              <div className="flex flex-col items-center gap-2 p-1">
                <span className="font-black text-slate-800 text-sm">{station.name}</span>
                <span className="text-xs text-slate-500 font-bold mb-1">Fixed Location</span>
                {isPolice && (
                  <button 
                    onClick={() => onDeleteBooth(station._id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] py-2 px-4 rounded-lg shadow-md transition-transform active:scale-95"
                  >
                    Delete Outpost
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      {/* ADMIN CONTROL PANEL (REPLACES RAW DISPATCH BUTTON) */}
      {selectedPos && (
        <DispatchForm
          selectedPos={selectedPos}
          onSubmit={(latLng, type, severity) => {
            onReportIncident(latLng, type, severity);
            setSelectedPos(null);
          }}
          onCancel={() => setSelectedPos(null)}
        />
      )}

      {!selectedPos && (
        <button 
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => setSelectedPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => alert("Please allow location access, or tap the map manually.")
              );
            } else {
              alert("Geolocation is not supported by this browser.");
            }
          }}
          className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-lg px-8 py-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
        >
          <p className="text-gray-800 font-bold flex items-center gap-3 text-sm tracking-widest uppercase">
            <span className="w-4 h-4 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] rounded-full animate-ping"></span>
            Tap Map Or Auto-Locate
          </p>
        </button>
      )}

      {/* ADMIN ADD BOOTH WIDGET */}
      {isPolice && (
        <BoothManager 
          selectedPos={selectedPos} 
          onAddBooth={(latLng) => {
            onAddBooth(latLng);
            setSelectedPos(null); // Clear map selection after placing booth
          }} 
        />
      )}

    </div>
  );
}
