import { useEffect, useRef, useState } from 'react';
import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { calculateDistance, calculateETA, fetchRoute, getRandomPatrolDestination } from '../utils/geo';

const createPoliceIcon = (status) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="police-car-marker ${status === 'busy' ? 'busy' : ''}">
             <span class="police-car-img" style="display:inline-block; transition: none;">🚓</span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export default function OfficerMarker({ officer, assignedIncident, onTrackingUpdate, onResolve, activeLayerId }) {
  const markerRef = useRef(null);
  const currentPosRef = useRef({ lat: officer.location.lat, lng: officer.location.lng });

  const [shrinkingRoute, setShrinkingRoute] = useState([]);

  useEffect(() => {
    if (assignedIncident) return; // Only patrol when free

    let isCancelled = false;
    let interval;
    let patrolTimeout;

    const startPatrol = async () => {
      if (isCancelled) return;

      // 1. Pick a random destination (Increased radius to 1.5km for wider roaming)
      const target = getRandomPatrolDestination(currentPosRef.current.lat, currentPosRef.current.lng, 1.5); 

      // 2. Fetch road route for wandering
      let fetchedPath = await fetchRoute(currentPosRef.current.lat, currentPosRef.current.lng, target.lat, target.lng);
      if (isCancelled) return;

      let pathNodes = [];
      if (fetchedPath && fetchedPath.length >= 2) {
        pathNodes = fetchedPath;
        pathNodes.unshift([currentPosRef.current.lat, currentPosRef.current.lng]);
      } else {
        pathNodes = [
          [currentPosRef.current.lat, currentPosRef.current.lng],
          [target.lat, target.lng]
        ];
      }

      setShrinkingRoute([]); // Hide route line during patrol for clean UI
      let currentIndex = 1;
      let tickCount = 0;
      
      interval = setInterval(() => {
        if (currentIndex >= pathNodes.length) {
          clearInterval(interval);
          if (!isCancelled) patrolTimeout = setTimeout(startPatrol, 500); // Only 0.5s wait before next patrol leg!
          return;
        }

        let moveBudget = 0.005; // FASTER patrol roaming speed so it's highly visible
        let currentLat = currentPosRef.current.lat;
        let currentLng = currentPosRef.current.lng;

        while (moveBudget > 0 && currentIndex < pathNodes.length) {
          let nodeLat = pathNodes[currentIndex][0];
          let nodeLng = pathNodes[currentIndex][1];
          let dist = calculateDistance(currentLat, currentLng, nodeLat, nodeLng);

          if (dist <= moveBudget) {
            currentLat = nodeLat;
            currentLng = nodeLng;
            moveBudget -= dist;
            currentIndex++;
          } else {
            const ratio = moveBudget / dist;
            currentLat += (nodeLat - currentLat) * ratio;
            currentLng += (nodeLng - currentLng) * ratio;
            moveBudget = 0;
          }
        }

        currentPosRef.current = { lat: currentLat, lng: currentLng };
        if (markerRef.current) markerRef.current.setLatLng([currentLat, currentLng]);

        tickCount++;
        // Sync live patrol coordinate to Database silently every ~1.5 seconds
        if (tickCount % 30 === 0) {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          fetch(`${API_URL}/officer/${officer._id}/location`, {
             method: 'PATCH',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({lat: currentLat, lng: currentLng})
          }).catch(()=>{}); // Fire and forget
        }

        if (currentIndex >= pathNodes.length) {
          clearInterval(interval);
          if (!isCancelled) patrolTimeout = setTimeout(startPatrol, 500);
        }
      }, 50);
    };

    // Stagger starts randomly to avoid spamming the OSRM routing API
    patrolTimeout = setTimeout(startPatrol, Math.random() * 3000);

    return () => {
      isCancelled = true;
      clearTimeout(patrolTimeout);
      if (interval) clearInterval(interval);
    };
  }, [assignedIncident]);

  useEffect(() => {
    if (!assignedIncident) {
      setShrinkingRoute([]);
      return;
    }

    let isCancelled = false;
    let interval;

    const startRouting = async () => {
      let targetLat = assignedIncident.location.lat;
      let targetLng = assignedIncident.location.lng;

      // EXTREMELY FAST ROAD DISPATCH: Dynamic routing via OSRM
      let fetchedPath = await fetchRoute(currentPosRef.current.lat, currentPosRef.current.lng, targetLat, targetLng);

      if (isCancelled) return;

      let pathNodes = [];
      if (!fetchedPath || fetchedPath.length < 2) {
        // Fallback ONLY if all servers are completely down (meaning it instantly falls back)
        pathNodes = [
          [currentPosRef.current.lat, currentPosRef.current.lng],
          [targetLat, targetLng]
        ];
      } else {
        pathNodes = fetchedPath;
        pathNodes.unshift([currentPosRef.current.lat, currentPosRef.current.lng]);
      }

      setShrinkingRoute(pathNodes);
      let currentIndex = 1;

      // EXTREMELY FAST NODE DRIVING PROCESS (Matches Base Code speed while glued to the map roads)
      interval = setInterval(() => {
        if (currentIndex >= pathNodes.length) {
          clearInterval(interval);
          return;
        }

        // SWIGGY MODE: Perfect, smooth tracing of every road curve. 
        // 0.008 km = 8 meters per 50ms tick (which is exactly ~576 km/h for fast demo) 
        // Changed back to be faster based on user request!
        let moveBudget = 0.008; 
        let currentLat = currentPosRef.current.lat;
        let currentLng = currentPosRef.current.lng;

        while (moveBudget > 0 && currentIndex < pathNodes.length) {
          let nodeTargetLat = pathNodes[currentIndex][0];
          let nodeTargetLng = pathNodes[currentIndex][1];
          let distToNode = calculateDistance(currentLat, currentLng, nodeTargetLat, nodeTargetLng);

          if (distToNode <= moveBudget) {
            currentLat = nodeTargetLat;
            currentLng = nodeTargetLng;
            moveBudget -= distToNode;
            currentIndex++;
          } else {
            const ratio = moveBudget / distToNode;
            currentLat = currentLat + (nodeTargetLat - currentLat) * ratio;
            currentLng = currentLng + (nodeTargetLng - currentLng) * ratio;
            moveBudget = 0;
          }
        }

        currentPosRef.current = { lat: currentLat, lng: currentLng };
        setShrinkingRoute([[currentLat, currentLng], ...pathNodes.slice(currentIndex)]);

        if (markerRef.current) {
          markerRef.current.setLatLng([currentLat, currentLng]);
        }

        if (currentIndex >= pathNodes.length) {
          clearInterval(interval);
          onTrackingUpdate({
            officerName: officer.name,
            incidentId: assignedIncident._id,
            distance: 0,
            eta: 0,
            incidentType: assignedIncident.incidentType,
            severityLevel: assignedIncident.severityLevel
          });
          if (onResolve) onResolve(assignedIncident._id);
          return;
        }

        if (Math.random() < 0.1) {
          const totalDist = calculateDistance(currentLat, currentLng, targetLat, targetLng);
          onTrackingUpdate({
            officerName: officer.name,
            incidentId: assignedIncident._id,
            distance: totalDist,
            eta: calculateETA(totalDist),
            incidentType: assignedIncident.incidentType,
            severityLevel: assignedIncident.severityLevel
          });
        }
      }, 50);
    };

    startRouting();

    return () => {
      isCancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [assignedIncident]);

  return (
    <>
      <Marker
        position={[currentPosRef.current.lat, currentPosRef.current.lng]}
        icon={createPoliceIcon(officer.status)}
        ref={markerRef}
        zIndexOffset={officer.status === 'busy' ? 1000 : 0}
      />
      {shrinkingRoute.length > 1 && (
        <Polyline
          positions={shrinkingRoute}
          color={activeLayerId === 'satellite' ? '#22d3ee' : activeLayerId === 'command' ? '#38bdf8' : '#ef4444'}
          dashArray="10, 10"
          weight={6}
          opacity={0.8}
          className="animate-pulse shadow-xl"
        />
      )}
    </>
  );
}
