document.getElementById("fuel-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const distance = parseFloat(document.getElementById("distance").value);
  const mileage = parseFloat(document.getElementById("mileage").value);
  const hours = parseInt(document.getElementById("hours").value);
  const minutes = parseInt(document.getElementById("minutes").value);

  window.tempFuelData = { distance, mileage, hours, minutes };

  // Show fuel price popup
  document.getElementById("fuel-price-modal").style.display = "flex";
});

document.getElementById("confirm-price").addEventListener("click", () => {
  const fuelPrice = parseFloat(document.getElementById("fuel-price-input").value);
  document.getElementById("fuel-price-modal").style.display = "none";

  const data = window.tempFuelData;
  const result = calculateFuelCost(data.distance, data.mileage, data.hours, data.minutes, fuelPrice);

  renderOutput(result, data, fuelPrice);
});
