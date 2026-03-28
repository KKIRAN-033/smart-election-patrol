async function test() {
  const url = "https://valhalla1.openstreetmap.de/route?json={\"locations\":[{\"lat\":14.68,\"lon\":77.59},{\"lat\":14.685,\"lon\":77.595}],\"costing\":\"auto\"}";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "SmartPatrolSystem/1.0" } });
    const data = await res.json();
    console.log(JSON.stringify(data.trip.legs[0].shape));
  } catch (e) {
    console.error(e);
  }
}
test();
