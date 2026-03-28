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

// Helper: Parse OSRM response into Leaflet [lat, lng] array
const parseOSRMResponse = (data) => {
  if (data.routes && data.routes[0] && data.routes[0].geometry) {
    // OSRM GeoJSON coordinate format is [lng, lat], Leaflet wants [lat, lng]
    return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
  }
  return null;
};

// Helper: Fetch with timeout
const fetchWithTimeout = (url, timeoutMs = 6000, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return fetch(url, { ...options, signal: controller.signal })
    .then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .catch(err => {
      clearTimeout(timeoutId);
      throw err;
    });
};

/**
 * Fetches real driving road route — Google Maps style road directions!
 * 
 * Strategy (3-layer fallback for maximum reliability):
 *   1. Backend Proxy (/route) — Most reliable, no CORS, handles HTTP internally
 *   2. OSRM German HTTPS mirror — Direct browser call, works well from HTTPS pages
 *   3. Main OSRM HTTPS — Another public endpoint as last resort
 * 
 * Only returns null (straight-line fallback) if ALL 3 servers fail.
 */
export const fetchRoute = async (startLat, startLng, endLat, endLng) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ============ ATTEMPT 1: Backend Proxy (Most Reliable!) ============
  try {
    const proxyUrl = `${API_URL}/route?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`;
    const data = await fetchWithTimeout(proxyUrl, 7000);
    const route = parseOSRMResponse(data);
    if (route && route.length >= 2) {
      return route;
    }
  } catch (e) {
    console.warn("[Route] Backend proxy failed:", e.message);
  }

  // ============ ATTEMPT 2: Direct OSRM German Mirror (HTTPS) ============
  try {
    const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const data = await fetchWithTimeout(url, 6000);
    const route = parseOSRMResponse(data);
    if (route && route.length >= 2) {
      return route;
    }
  } catch (e) {
    console.warn("[Route] German OSRM mirror failed:", e.message);
  }

  // ============ ATTEMPT 3: Main OSRM Server (HTTPS) ============
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const data = await fetchWithTimeout(url, 6000);
    const route = parseOSRMResponse(data);
    if (route && route.length >= 2) {
      return route;
    }
  } catch (e) {
    console.warn("[Route] Main OSRM server failed:", e.message);
  }

  // ALL 3 FAILED — return null (caller will use straight line as last resort)
  console.error("[Route] ⚠️ All 3 routing servers failed! Falling back to straight line.");
  return null;
};
