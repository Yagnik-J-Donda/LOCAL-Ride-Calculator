function saveFuelEntry(data) {
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const day = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);

  const entry = {
    date: day,
    time: time,
    distance_km: data.distance,
    fuel_efficiency: data.mileage,
    fuel_price: data.fuel_price,
    duration: `${data.hours}h ${data.minutes}m`,
    fuel_consumed: data.fuel_consumed,
    total_cost: data.total_cost,
    average_speed: data.average_speed
  };

  let logs = JSON.parse(localStorage.getItem("fuelLogs") || "{}");
  if (!logs[monthKey]) logs[monthKey] = [];
  logs[monthKey].push(entry);

  localStorage.setItem("fuelLogs", JSON.stringify(logs));
  alert("Entry saved!");
}
