// Haversine formula to mathematically calculate real-world spherical km distance
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};

// Extremely basic ETA based on straight-line speed (60km/h) for now
export const calculateETA = (distanceKm) => {
  const speedKmh = 60;
  return (distanceKm / speedKmh) * 60; // minutes
};

// Generates a random coordinate within roughly `radiusKm` of (lat, lng)
export const getRandomPatrolDestination = (lat, lng, radiusKm = 0.5) => {
  const rDegrees = radiusKm / 111.32; // 1 degree of latitude is ~111km
  const angle = Math.random() * Math.PI * 2;
  const dist = rDegrees * Math.sqrt(Math.random()); // Even spread in the circle

  const dLat = dist * Math.cos(angle);
  const dLng = (dist * Math.sin(angle)) / Math.cos(lat * Math.PI / 180);

  return { lat: lat + dLat, lng: lng + dLng };
};

// Fetches real driving directions dynamically over actual network (Proxied OSRM)
export const fetchRoute = async (startLat, startLng, endLat, endLng) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const url = `${API_URL}/route?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds before pure straight-line fallback

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("OSRM failed route fetch");
    const data = await response.json();

    if (data.routes && data.routes[0]) {
      // OSRM GeoJSON coordinate format is [lng, lat], Leaflet wants [lat, lng]
      return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }
    
  } catch (e) {
    console.warn("Routing server unavailable -> falling back to straight line.", e);
    return null; // Fallback to straight line logic in OfficerMarker.jsx
  }
};
