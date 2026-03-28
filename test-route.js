async function test() {
  try {
    const res = await fetch("http://localhost:5000/api/route?startLat=14.68&startLng=77.59&endLat=14.685&endLng=77.595");
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data keys:", Object.keys(data));
    if (data.routes) console.log("Routes count:", data.routes.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
