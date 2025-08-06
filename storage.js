function saveFuelEntry(data) {
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const day = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);

  const entry = {
    date: day,
    time: time,
    distance_km: data.distance,
    fuel_efficiency: data.fuel_efficiency || data.mileage,
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

function renderHistory() {
  const historyContent = document.getElementById("history-content");
  const dateFilter = document.getElementById("date-filter");
  const summaryDiv = document.getElementById("daily-summary");
  const tableWrapper = document.getElementById("history-table-wrapper");

  historyContent.innerHTML = `
    <div id="history-controls" style="margin-bottom: 15px; text-align: center;">
      <label for="date-filter"><strong>Select Date:</strong></label>
      <select id="date-filter"></select>
    </div>
    <div id="daily-summary" style="margin-bottom: 15px;"></div>
    <div id="history-table-wrapper" style="overflow-x: auto;"></div>
  `;

  const logs = JSON.parse(localStorage.getItem("fuelLogs") || "{}");

  // Flatten entries into a single array
  const allEntries = Object.values(logs).flat();
  if (allEntries.length === 0) {
    document.getElementById("history-table-wrapper").innerHTML = "<p>No history available.</p>";
    return;
  }

  // ✅ Group by Date
  const dateGroups = {};
  allEntries.forEach(entry => {
    if (!dateGroups[entry.date]) dateGroups[entry.date] = [];
    dateGroups[entry.date].push(entry);
  });

  const sortedDates = Object.keys(dateGroups).sort().reverse();

  // ✅ Populate dropdown
  const filterDropdown = document.getElementById("date-filter");
  sortedDates.forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    filterDropdown.appendChild(option);
  });

  // ✅ Initial render
  renderTableForDate(sortedDates[0], dateGroups);

  // ✅ On dropdown change
  filterDropdown.addEventListener("change", (e) => {
    renderTableForDate(e.target.value, dateGroups);
  });
}

function renderTableForDate(date, groupedData) {
  const entries = groupedData[date];
  const tableWrapper = document.getElementById("history-table-wrapper");
  const summaryDiv = document.getElementById("daily-summary");

  if (!entries || entries.length === 0) {
    tableWrapper.innerHTML = "<p>No data for this date.</p>";
    summaryDiv.innerHTML = "";
    return;
  }

  // ✅ Summary
  const totalRides = entries.length;
  const totalCost = entries.reduce((sum, e) => sum + parseFloat(e.total_cost), 0).toFixed(2);

  summaryDiv.innerHTML = `
    <p><strong>Total Rides:</strong> ${totalRides}</p>
    <p><strong>Total Cost:</strong> $${totalCost}</p>
  `;

  // ✅ Table
  const table = document.createElement("table");
  table.classList.add("history-table");

  table.innerHTML = `
    <thead>
      <tr>
        <th>Cost</th>
        <th>Distance</th>
        <th>Mileage</th>
        <th>Fuel Price</th>
        <th>Avg Speed</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      ${entries.map(e => `
        <tr>
          <td>$${e.total_cost}</td>
          <td>${e.distance_km} km</td>
          <td>${e.fuel_efficiency} L/100km</td>
          <td>$${e.fuel_price}</td>
          <td>${e.average_speed} km/h</td>
          <td>${e.time}</td>
        </tr>
      `).join('')}
    </tbody>
  `;

  tableWrapper.innerHTML = "";
  tableWrapper.appendChild(table);
}

