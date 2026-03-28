async function test() {
  const url = "https://valhalla1.openstreetmap.de/route?json={\"locations\":[{\"lat\":14.68,\"lon\":77.59},{\"lat\":14.685,\"lon\":77.595}],\"costing\":\"auto\"}";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "SmartPatrolSystem/1.0" } });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Success! routes?", !!data.trip.legs);
  } catch (e) {
    console.error("Fetch Error:", e.cause || e);
  }
}
test();
