import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Routes, Route, Navigate } from 'react-router-dom';
import Map from './components/Map';
import Login from './components/Login';

// Connecting to backend
// Will use localhost or deployed URL based on ENV
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('patrol_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function HomeMap() {
  const [officers, setOfficers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stations, setStations] = useState([]);
  const [socket, setSocket] = useState(null);
  const [dispatchAlert, setDispatchAlert] = useState(null);
  // Initial Fetch & Socket Setup
  useEffect(() => {
    // 1. Fetch data
    const fetchPersonnel = async () => {
      try {
        const res = await fetch(`${API_URL}/personnel`);
        const data = await res.json();
        setOfficers(data);
      } catch (e) {
        console.error('API Error:', e);
      }
    };
    
    fetchPersonnel();
    
    // We can realistically fetch existing incidents here, but for hackathon demo we'll start fresh
    // or we fetch pending/active ones if doing a hard refresh.
    fetch(`${API_URL}/incidents`)
      .then(r => r.json())
      .then(data => setIncidents(data))
      .catch(e => console.error(e));

    // Fetch existing Police Booths (Stations)
    fetch(`${API_URL}/stations`)
      .then(r => r.json())
      .then(data => setStations(data))
      .catch(e => console.error("Error fetching booths:", e));

    // 2. Setup Socket.IO
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Socket Event Handlers
    newSocket.on('incident_created', (incident) => {
      setIncidents(prev => {
        // Remove any temporary optimistic incident drops before placing the real one
        const filtered = prev.filter(i => !i._id.toString().startsWith('temp-'));
        return [...filtered, incident];
      });
    });

    newSocket.on('incident_assigned', (updatedIncident) => {
      // SHOW ALERT FOR 6 SECONDS
      setDispatchAlert({
        officer: updatedIncident.assignedOfficer?.name || 'A patrol unit',
        type: updatedIncident.incidentType
      });
      setTimeout(() => setDispatchAlert(null), 6000);

      // Find and update or insert
      setIncidents(prev => {
        // IMPORTANT: Also remove optimistic UI pins here because the backend might skip 'incident_created' if it assigns immediately!
        const cleanPrev = prev.filter(i => !i._id.toString().startsWith('temp-'));
        
        const exists = cleanPrev.find(i => i._id === updatedIncident._id);
        if (exists) {
          return cleanPrev.map(i => i._id === updatedIncident._id ? updatedIncident : i);
        }
        return [...cleanPrev, updatedIncident];
      });
    });

    newSocket.on('officer_updated', (updatedOfficer) => {
      setOfficers(prev => prev.map(o => o._id === updatedOfficer._id ? updatedOfficer : o));
    });
    
    newSocket.on('incident_updated', (updatedIncident) => {
      if (updatedIncident.status === 'resolved') {
        // Remove from lively viewed tracker or keep as resolved
        setIncidents(prev => prev.filter(i => i._id !== updatedIncident._id));
      } else {
        setIncidents(prev => prev.map(i => i._id === updatedIncident._id ? updatedIncident : i));
      }
    });

    newSocket.on('station_created', (newStation) => {
      setStations(prev => [...prev, newStation]);
    });

    newSocket.on('station_deleted', (stationId) => {
      setStations(prev => prev.filter(s => s._id !== stationId));
    });

    return () => newSocket.close();
  }, []);

  // API Call to Report Location via Admin Panel
  const handleReportIncident = async (latLng, incidentType, severityLevel) => {
    // OPTIMISTIC UI: Instantly drop the location pin on the map so the user sees it immediately
    const optimisticId = 'temp-' + Date.now();
    const optimisticIncident = {
      _id: optimisticId,
      location: { lat: latLng.lat, lng: latLng.lng },
      incidentType,
      severityLevel,
      status: 'active'
    };
    
    setIncidents(prev => [...prev, optimisticIncident]);

    try {
      const res = await fetch(`${API_URL}/incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: { lat: latLng.lat, lng: latLng.lng },
          incidentType,
          severityLevel
        })
      });
      const data = await res.json();
      console.log('Incident reported:', data);
    } catch (error) {
      console.error('Error reporting:', error);
      // Remove the optimistic pin if the network failed
      setIncidents(prev => prev.filter(i => i._id !== optimisticId));
      alert('Failed to connect to Dispatch Center');
    }
  };

  // API Call to Resolve Incident
  const handleResolveIncident = async (incidentId) => {
    // OPTIMISTIC UI: Immediately remove from the screen so it feels instantly responsive!
    setIncidents(prev => prev.filter(i => i._id !== incidentId));
  
    try {
      const res = await fetch(`${API_URL}/incident/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          incidentId,
          status: 'resolved'
        })
      });
      console.log('Incident resolved', await res.json());
    } catch (error) {
      console.error('Error resolving:', error);
      // If it failed, it might re-appear on next socket sync, which is correct behavior for failure.
    }
  };

  const handleAddBooth = async (latLng) => {
    try {
      await fetch(`${API_URL}/station`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Shield Outpost', location: { lat: latLng.lat, lng: latLng.lng } })
      });
    } catch (e) {
      console.error('Failed to create booth:', e);
    }
  };

  const handleDeleteBooth = async (id) => {
    try {
      await fetch(`${API_URL}/station/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete booth:', e);
    }
  };

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden font-sans bg-gray-900">
      
      {/* DISPATCH NOTIFICATION OVERLAY */}
      {dispatchAlert && (
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-[3000] 
                        bg-red-600 outline outline-4 outline-red-500/50 text-white 
                        px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(220,38,38,0.5)] 
                        flex items-center gap-4 animate-bounce cursor-pointer"
             onClick={() => setDispatchAlert(null)}>
          <span className="text-4xl animate-pulse drop-shadow-md">🚨</span>
          <div className="flex flex-col">
            <span className="font-black tracking-widest uppercase text-xs opacity-90 drop-shadow-md">Instant Priority Dispatch</span>
            <span className="font-bold text-lg drop-shadow-md">{dispatchAlert.officer} responding to {dispatchAlert.type}!</span>
          </div>
        </div>
      )}

      <Map 
        officers={officers} 
        incidents={incidents} 
        stations={stations}
        onReportIncident={handleReportIncident} 
        onResolve={handleResolveIncident}
        onAddBooth={handleAddBooth}
        onDeleteBooth={handleDeleteBooth}
      />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/map" replace />} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/map" 
        element={
          <ProtectedRoute>
            <HomeMap />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
