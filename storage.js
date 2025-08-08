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
    average_speed: data.average_speed,
    income: data.income,
    profit: data.profit
  };

  let logs = JSON.parse(localStorage.getItem("fuelLogs") || "{}");
  if (!logs[monthKey]) logs[monthKey] = [];

  // 🔍 Check for duplicate by same date & time
  const isDuplicate = logs[monthKey].some(e => 
    e.date === entry.date &&
    e.time === entry.time
  );

  if (isDuplicate) {
    alert("⚠️ This entry was already saved.\n\nTo see this entry, open the History section.");
    location.reload(); // 🔄 Refresh the page
    return;
  }

  logs[monthKey].push(entry);
  localStorage.setItem("fuelLogs", JSON.stringify(logs));
  alert("✅ Entry saved!");
}


function renderHistory() {
  const logs = JSON.parse(localStorage.getItem("fuelLogs") || "{}");
  const allEntries = Object.values(logs).flat();
  if (allEntries.length === 0) {
    document.getElementById("history-table-wrapper").innerHTML = "<p>No history available.</p>";
    return;
  }

  const dateGroups = {};
  allEntries.forEach(entry => {
    if (!dateGroups[entry.date]) dateGroups[entry.date] = [];
    dateGroups[entry.date].push(entry);
  });

  const sortedDates = Object.keys(dateGroups).sort().reverse();

  const filterDropdown = document.getElementById("date-filter");
  filterDropdown.innerHTML = "";
  sortedDates.forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    filterDropdown.appendChild(option);
  });

  renderTableForDate(sortedDates[0], dateGroups);

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

  const totalRides = entries.length;
  const totalCost = entries.reduce((sum, e) => sum + parseFloat(e.total_cost), 0).toFixed(2);
  const totalIncome = entries.reduce((sum, e) => sum + parseFloat(e.income), 0).toFixed(2);
  const totalProfit = entries.reduce((sum, e) => sum + parseFloat(e.profit), 0).toFixed(2);

  summaryDiv.innerHTML = `
    <p><strong>Total Rides:</strong> ${totalRides}</p>
    <p><strong>Total Cost:</strong> $${totalCost}</p>
    <p><strong>Total Income:</strong> $${totalIncome}</p>
    <p><strong>Total Profit:</strong> $${totalProfit}</p>
  `;

  const table = document.createElement("table");
  table.classList.add("history-table");

  table.innerHTML = `
    <thead>
      <tr>
        <th>Cost</th>
        <th>Income</th>
        <th>Profit</th>
        <th>Distance</th>
        <th>Mileage</th>
        <th>Fuel Price</th>
        <th>Avg Speed</th>
        <th>Time</th>
        <th>Edit</th>
      </tr>
    </thead>
    <tbody>
      ${entries.map((e, index) => `
        <tr>
          <td>$${e.total_cost}</td>
          <td>$${e.income}</td>
          <td>$${e.profit}</td>
          <td>${e.distance_km} km</td>
          <td>${e.fuel_efficiency} L/100km</td>
          <td>$${e.fuel_price}</td>
          <td>${e.average_speed} km/h</td>
          <td>${e.time}</td>
          <td><button class="edit-btn" data-date="${date}" data-index="${index}">✏️ Edit</button></td>
        </tr>
      `).join('')}
    </tbody>
  `;

  tableWrapper.innerHTML = "";
  tableWrapper.appendChild(table);

  // 🆕 Attach edit button listeners
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dateKey = btn.getAttribute("data-date");
      const entryIndex = parseInt(btn.getAttribute("data-index"));
      openEditModal(dateKey, entryIndex, groupedData);
    });
  });
}

function openEditModal(date, index, groupedData) {
  const entry = groupedData[date][index];

  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.style.display = "flex";

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Edit Entry</h3>
      <label>Distance (km):</label>
      <input type="number" id="edit-distance" value="${entry.distance_km}" step="0.1">
      <label>Mileage (L/100km):</label>
      <input type="number" id="edit-mileage" value="${entry.fuel_efficiency}" step="0.1">
      <label>Fuel Price ($):</label>
      <input type="number" id="edit-fuelprice" value="${entry.fuel_price}" step="0.01">
      <label>Income ($):</label>
      <input type="number" id="edit-income" value="${entry.income}" step="0.01">
      <div style="margin-top:10px;">
        <button id="save-edit">💾 Save Changes</button>
        <button id="cancel-edit">❌ Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Cancel button
  document.getElementById("cancel-edit").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Save button
  document.getElementById("save-edit").addEventListener("click", () => {
    const logs = JSON.parse(localStorage.getItem("fuelLogs") || "{}");
    const monthKey = date.slice(0, 7);

    if (!logs[monthKey]) {
      alert("❌ Could not find month data.");
      return;
    }

    // Find exact entry in stored logs by date + time
    const logIndex = logs[monthKey].findIndex(e => e.date === entry.date && e.time === entry.time);
    if (logIndex === -1) {
      alert("❌ Could not find entry in logs.");
      return;
    }

    // Update values
    logs[monthKey][logIndex].distance_km = parseFloat(document.getElementById("edit-distance").value);
    logs[monthKey][logIndex].fuel_efficiency = parseFloat(document.getElementById("edit-mileage").value);
    logs[monthKey][logIndex].fuel_price = parseFloat(document.getElementById("edit-fuelprice").value);
    logs[monthKey][logIndex].income = parseFloat(document.getElementById("edit-income").value);

    // Recalculate cost & profit
    const fuelUsed = (logs[monthKey][logIndex].distance_km * logs[monthKey][logIndex].fuel_efficiency) / 100;
    logs[monthKey][logIndex].total_cost = (fuelUsed * logs[monthKey][logIndex].fuel_price).toFixed(2);
    logs[monthKey][logIndex].profit = (logs[monthKey][logIndex].income - logs[monthKey][logIndex].total_cost).toFixed(2);

    // Save back to localStorage
    localStorage.setItem("fuelLogs", JSON.stringify(logs));

    alert("✅ Entry updated!");
    document.body.removeChild(modal);
    renderHistory(); // Refresh table
  });
}


