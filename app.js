// ===== Entry Date & Time auto-update =====
let autoTimeInterval = null;
let autoTimeEnabled = true;

function pad2(n) { return String(n).padStart(2, "0"); }

function setDateTimeToNow() {
  const input = document.getElementById("ride-datetime");
  if (!input) return;

  const now = new Date();
  now.setSeconds(0, 0); // round to minute

  const yyyy = now.getFullYear();
  const mm = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());
  const hh = pad2(now.getHours());
  const mi = pad2(now.getMinutes());

  input.value = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function startAutoTime() {
  stopAutoTime();
  autoTimeEnabled = true;
  setDateTimeToNow();
  autoTimeInterval = setInterval(() => {
    if (autoTimeEnabled) setDateTimeToNow();
  }, 60 * 1000); // every minute
}

function stopAutoTime() {
  autoTimeEnabled = false;
  if (autoTimeInterval) {
    clearInterval(autoTimeInterval);
    autoTimeInterval = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  startAutoTime();

  const dtInput = document.getElementById("ride-datetime");
  dtInput.addEventListener("focus", () => stopAutoTime());
  dtInput.addEventListener("input", () => {
    if (!dtInput.value) startAutoTime();
  });
});

// ===== Entry Date & Time: live auto-update every minute (pauses on user edit) =====
(function setupLiveEntryTime() {
  const input = document.getElementById("ride-datetime");
  if (!input) return;

  let autoUpdate = true;
  let tickInterval = null;
  let tickTimeout = null;

  function pad(n) { return String(n).padStart(2, "0"); }
  function setToNow() {
    if (!autoUpdate) return;
    const now = new Date();
    now.setSeconds(0, 0); // round to minute
    const val = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    input.value = val;
  }

  function startMinuteTicks() {
    clearTimers();
    setToNow(); // set immediately
    // align to the next minute boundary
    const now = new Date();
    const msToNextMinute = 60000 - (now.getSeconds()*1000 + now.getMilliseconds());
    tickTimeout = setTimeout(() => {
      setToNow();
      tickInterval = setInterval(setToNow, 60000);
    }, msToNextMinute);
  }

  function clearTimers() {
    if (tickTimeout) { clearTimeout(tickTimeout); tickTimeout = null; }
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  }

  // Start live updates on load
  startMinuteTicks();

  // If the user focuses/edits, pause auto-update so we don't overwrite their value
  input.addEventListener("focus", () => { autoUpdate = false; clearTimers(); });
  input.addEventListener("input", () => { autoUpdate = false; clearTimers(); });

  // If they clear the field, resume live updates
  input.addEventListener("change", () => {
    if (!input.value) {
      autoUpdate = true;
      startMinuteTicks();
    }
  });

  // Keep the --vh fix if you added it; not required for this.
})();


// Mobile viewport height bug fix: keep --vh accurate on resize/orientation
function setVHUnit() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
window.addEventListener("resize", setVHUnit);
window.addEventListener("orientationchange", setVHUnit);
document.addEventListener("DOMContentLoaded", setVHUnit);


// ===== Modal helpers with history stack (focused, single source of truth) =====
function isOpen(id) {
  const el = document.getElementById(id);
  return el && el.style.display === "flex";
}

function openModal(modalId, opts = {}) {
  const el = document.getElementById(modalId);
  if (!el) return;
  if (!isOpen(modalId)) {
    if (opts.zIndex) el.style.zIndex = String(opts.zIndex);
    el.style.display = "flex";
    history.pushState({ modal: modalId }, "");
  }
}

function closeModal(modalId, fromPopstate = false) {
  const el = document.getElementById(modalId);
  if (!el || !isOpen(modalId)) return;
  el.style.display = "none";
  // If user closed (not back), consume one history state so back won't go further
  if (!fromPopstate && history.state && history.state.modal === modalId) {
    history.back();
  }
}

// Ensure a base state so the first Back doesn't exit
(function ensureBase() {
  if (!history.state || !history.state.base) {
    history.replaceState({ base: true }, "");
  }
})();

// Back button: close only the top-most modal (Edit first, then History, then Fuel Price)
window.addEventListener("popstate", () => {
  const order = ["edit-modal", "history-modal", "fuel-price-modal"];
  for (const id of order) {
    if (isOpen(id)) {
      closeModal(id, true); // close due to back
      return;               // stop after closing one
    }
  }
  // Re-assert base
  if (!history.state || !history.state.base) {
    history.replaceState({ base: true }, "");
  }
});


// ===== Form submit =====
document.getElementById("fuel-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const distance = parseFloat(document.getElementById("distance").value);
  const mileage = parseFloat(document.getElementById("mileage").value);
  const income = parseFloat(document.getElementById("income").value);
  const hours = parseInt(document.getElementById("hours").value);
  const minutes = parseInt(document.getElementById("minutes").value);
  const ride_datetime = document.getElementById("ride-datetime").value || null;

  window.tempFuelData = { distance, mileage, income, hours, minutes, ride_datetime };

  openModal("fuel-price-modal"); // uses back-stack
});

// ===== Confirm price =====
document.getElementById("confirm-price").addEventListener("click", () => {
  const fuelPrice = parseFloat(document.getElementById("fuel-price-input").value);
  closeModal("fuel-price-modal");

  const data = window.tempFuelData;
  const result = calculateFuelCost(
    data.distance,
    data.mileage,
    data.hours,
    data.minutes,
    fuelPrice,
    data.income
  );

  renderOutput(result, data, fuelPrice);
});

// ===== View history =====
document.getElementById("view-history-btn").addEventListener("click", () => {
  renderHistory();
  openModal("history-modal", { zIndex: 1000 });
});

// ===== Close history (X button) =====
document.getElementById("close-history").addEventListener("click", () => {
  closeModal("history-modal");
});

// Close modals when clicking the backdrop (closes only the clicked modal)
["history-modal", "fuel-price-modal"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("click", (evt) => {
    if (evt.target !== el) return; // only clicks on the overlay
    if (id === "history-modal" && isOpen("edit-modal")) return; // ignore when edit is on top
    closeModal(id);
  });
});
