async function test() {
  const url = "https://routing.openstreetmap.de/routed-car/route/v1/driving/77.59,14.68;77.595,14.685?overview=full&geometries=geojson";
  const proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
  try {
    const res = await fetch(proxyUrl, { headers: { "User-Agent": "SmartPatrolSystem/1.0" } });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Success! routes length:", data.routes?.length);
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}
test();
