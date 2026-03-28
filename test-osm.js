async function test() {
  const url = "https://routing.openstreetmap.de/routed-car/route/v1/driving/77.59,14.68;77.595,14.685?overview=full&geometries=geojson";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "SmartPatrolSystem/1.0" } });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text.substring(0, 100)); // Print response
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}
test();
