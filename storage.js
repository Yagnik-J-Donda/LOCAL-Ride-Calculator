// =======================
// Save Entry (uses entry datetime from app.js)
// =======================
function saveFuelEntry(data) {
  // Prefer the datetime the user chose; else use now.
  const dt = data.ride_datetime ? new Date(data.ride_datetime) : new Date();

  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const HH = String(dt.getHours()).padStart(2, "0");
  const MI = String(dt.getMinutes()).padStart(2, "0");

  const monthKey = `${yyyy}-${mm}`;
  const day = `${yyyy}-${mm}-${dd}`;
  const time = `${HH}:${MI}`;

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

  // 🔍 Check for duplicate by same date & time (entry timestamp)
  const isDuplicate = logs[monthKey].some(e => e.date === entry.date && e.time === entry.time);

  if (isDuplicate) {
    alert("⚠️ This entry was already saved.\n\nTo see this entry, open the History section.");
    location.reload(); // 🔄 Refresh the page
    return;
  }

  logs[monthKey].push(entry);
  localStorage.setItem("fuelLogs", JSON.stringify(logs));
  alert("✅ Entry saved!");
}


// =======================
// History Rendering
// =======================
function renderHistory() {
  const logs = JSON.parse(localStorage.getItem("fuelLogs") || "{}");
  const allEntries = Object.values(logs).flat();
  if (allEntries.length === 0) {
    document.getElementById("history-table-wrapper").innerHTML = "<p>No history available.</p>";
    return;
  }

  // Group by date
  const dateGroups = {};
  allEntries.forEach(entry => {
    if (!dateGroups[entry.date]) dateGroups[entry.date] = [];
    dateGroups[entry.date].push(entry);
  });

  const sortedDates = Object.keys(dateGroups).sort().reverse();

  // Populate dropdown
  const filterDropdown = document.getElementById("date-filter");
  filterDropdown.innerHTML = "";
  sortedDates.forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    filterDropdown.appendChild(option);
  });

  // Initial render
  renderTableForDate(sortedDates[0], dateGroups);

  // Avoid stacking multiple listeners
  filterDropdown.onchange = (e) => {
    renderTableForDate(e.target.value, dateGroups);
  };
}

// --- 12h time helper (uses date+time; falls back to string math) ---
function formatTime12h(dateStr, timeStr) {
  if (dateStr && timeStr) {
    try {
      const d = new Date(`${dateStr}T${timeStr}`);
      // If invalid, fallback below
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).format(d);
      }
    } catch {}
  }
  // Fallback for plain "HH:MM"
  if (!timeStr) return "";
  const [hStr = "0", mStr = "00"] = timeStr.trim().split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = String(parseInt(mStr || "0", 10)).padStart(2, "0");
  return `${h}:${mm} ${ampm}`;
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

  // Summary
  const totalRides = entries.length;
  const totalCost = entries.reduce((sum, e) => sum + parseFloat(e.total_cost), 0).toFixed(2);
  const totalIncome = entries.reduce((sum, e) => sum + parseFloat(e.income), 0).toFixed(2);
  const totalProfit = entries.reduce((sum, e) => sum + parseFloat(e.profit), 0).toFixed(2);

  summaryDiv.innerHTML = `
    <p><strong>Total Rides:</strong> <strong style="color: #333;">${totalRides}</strong></p>
    <p><strong>Total Cost:</strong> <strong style="color: #d9534f;">$${totalCost}</strong></p>
    <p><strong>Total Income:</strong> <strong style="color: #0275d8;">$${totalIncome}</strong></p>
    <p><strong>Total Profit:</strong> <span style="font-weight: 900; color: ${totalProfit >= 0 ? '#28a745' : '#d9534f'};">$${totalProfit}</span></p>
  `;

  // Table
  const table = document.createElement("table");
  table.classList.add("history-table");

  table.innerHTML = `
    <thead>
      <tr>
        <th>Cost</th>
        <th>Income</th>
        <th>Profit</th>
        <th>Distance</th>
        <th>Mileage L/100km</th>
        <th>Fuel Price</th>
        <th>Avg Speed  km/h</th>
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
          <td>${e.fuel_efficiency}</td>
          <td>$${e.fuel_price}</td>
          <td>${e.average_speed}</td>
          <td>${formatTime12h(e.date, e.time)}</td>
          <td><button class="edit-btn" data-date="${date}" data-index="${index}">✏️ Edit</button></td>
        </tr>
      `).join('')}
    </tbody>
  `;

  tableWrapper.innerHTML = "";
  tableWrapper.appendChild(table);

  // Edit listeners
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dateKey = btn.getAttribute("data-date");
      const entryIndex = parseInt(btn.getAttribute("data-index"));
      openEditModal(dateKey, entryIndex, groupedData);
    });
  });
}



// =======================
// Edit Modal with Back-button support
// =======================
function openEditModal(date, index, groupedData) {
  const entry = groupedData[date][index];

  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.id = "edit-modal";
  modal.style.display = "flex";
  modal.style.zIndex = "1001"; // above history
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  modal.innerHTML = `
    <div class="modal-content edit-modal" id="edit-modal-content" aria-labelledby="edit-modal-title">
      <span id="close-edit" class="modal-close" aria-label="Close">&times;</span>
      <h3 id="edit-modal-title">Edit Entry</h3>

      <label for="edit-distance">Distance (km):</label>
      <input type="number" id="edit-distance" value="${entry.distance_km}" step="0.1" inputmode="decimal">

      <label for="edit-mileage">Mileage (L/100km):</label>
      <input type="number" id="edit-mileage" value="${entry.fuel_efficiency}" step="0.1" inputmode="decimal">

      <label for="edit-fuelprice">Fuel Price ($):</label>
      <input type="number" id="edit-fuelprice" value="${entry.fuel_price}" step="0.01" inputmode="decimal">

      <label for="edit-income">Income ($):</label>
      <input type="number" id="edit-income" value="${entry.income}" step="0.01" inputmode="decimal">

      <div class="modal-actions">
        <button id="save-edit" type="button">💾 Save Changes</button>
        <button id="cancel-edit" type="button">❌ Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Prevent clicks inside the dialog from closing the History backdrop
  const content = document.getElementById("edit-modal-content");
  content.addEventListener("click", (e) => e.stopPropagation());

  // // Accessibility: focus the first field
  // const firstInput = document.getElementById("edit-distance");
  // if (firstInput) firstInput.focus();

  // Accessibility: Do not auto-focus to avoid mobile keyboard popping up
// We can instead set focus to the modal container for screen readers
const modalContent = document.getElementById("edit-modal-content");
if (modalContent) modalContent.setAttribute("tabindex", "-1");
if (modalContent) modalContent.focus();


  // Push one state so Back closes Edit first
  history.pushState({ modal: "edit-modal" }, "");

  // Backdrop click closes ONLY edit modal
  modal.addEventListener("click", (evt) => {
    if (evt.target === modal) closeEditWithoutSubmitting(evt);
  });

  // Escape key closes ONLY edit modal
  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeEditWithoutSubmitting(e);
    }
  }
  document.addEventListener("keydown", onKeydown);

  // X / Cancel
  document.getElementById("close-edit").addEventListener("click", closeEditWithoutSubmitting);
  document.getElementById("cancel-edit").addEventListener("click", closeEditWithoutSubmitting);

  // Save
  document.getElementById("save-edit").addEventListener("click", (e) => {
    e.preventDefault();

    const logs = JSON.parse(localStorage.getItem("fuelLogs") || "{}");
    const monthKey = date.slice(0, 7);

    if (!logs[monthKey]) {
      alert("❌ Could not find month data.");
      return;
    }

    const logIndex = logs[monthKey].findIndex(
      (x) => x.date === entry.date && x.time === entry.time
    );
    if (logIndex === -1) {
      alert("❌ Could not find entry in logs.");
      return;
    }

    // Update fields
    logs[monthKey][logIndex].distance_km = parseFloat(document.getElementById("edit-distance").value);
    logs[monthKey][logIndex].fuel_efficiency = parseFloat(document.getElementById("edit-mileage").value);
    logs[monthKey][logIndex].fuel_price = parseFloat(document.getElementById("edit-fuelprice").value);
    logs[monthKey][logIndex].income = parseFloat(document.getElementById("edit-income").value);

    // Recalc cost & profit
    const fuelUsed = (logs[monthKey][logIndex].distance_km * logs[monthKey][logIndex].fuel_efficiency) / 100;
    logs[monthKey][logIndex].total_cost = (fuelUsed * logs[monthKey][logIndex].fuel_price).toFixed(2);
    logs[monthKey][logIndex].profit = (logs[monthKey][logIndex].income - logs[monthKey][logIndex].total_cost).toFixed(2);

    localStorage.setItem("fuelLogs", JSON.stringify(logs));

    alert("✅ Entry updated!");
    closeEditWithoutSubmitting(e);
    renderHistory();
  });

  function closeEditWithoutSubmitting(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Remove only the edit modal
    const m = document.getElementById("edit-modal");
    if (m) m.remove();

    // Remove Esc handler
    document.removeEventListener("keydown", onKeydown);

    // Replace the edit history state so Back now targets the History modal
    if (history.state && history.state.modal === "edit-modal") {
      history.replaceState({ modal: "history-modal" }, "");
    }
  }
}




