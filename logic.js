function calculateFuelCost(distance, mileage, hours, minutes, fuelPrice, income) {
  const timeHours = hours + minutes / 60;
  const fuelUsed = (distance * mileage) / 100;
  const cost = fuelUsed * fuelPrice;
  const speed = distance / timeHours;
  const profit = income - cost;

  return {
    fuelUsed: fuelUsed.toFixed(2),
    totalCost: cost.toFixed(2),
    avgSpeed: speed.toFixed(2),
    income: income.toFixed(2),
    profit: profit.toFixed(2)
  };
}

function renderOutput(result, input, fuelPrice) {
  document.getElementById("output-section").innerHTML = `
    <p><strong>Fuel Used:</strong> ${result.fuelUsed} L</p>
    <p><strong>Total Cost:</strong> $${result.totalCost}</p>
    <p><strong>Ride Income:</strong> $${result.income}</p>
    <p><strong>Profit:</strong> $${result.profit}</p>
    <p><strong>Avg Speed:</strong> ${result.avgSpeed} km/h</p>
    <button id="save-entry">💾 Save This Entry</button>
  `;

  document.getElementById("save-entry").addEventListener("click", () => {
    saveFuelEntry({
      ...input,
      fuel_price: fuelPrice,
      fuel_consumed: result.fuelUsed,
      total_cost: result.totalCost,
      average_speed: result.avgSpeed,
      income: result.income,
      profit: result.profit
    });
  });
}
