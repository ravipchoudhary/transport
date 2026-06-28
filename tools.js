// --- Live Portal Scripts ---

document.addEventListener("DOMContentLoaded", () => {
  calculateFreightPrice(); // Initial calculation
});

// --- Tab Switcher Logic ---
function switchTab(tabName) {
  const trackerBtn = document.getElementById("tab-btn-tracker");
  const estimatorBtn = document.getElementById("tab-btn-estimator");
  const trackerContent = document.getElementById("tab-tracker");
  const estimatorContent = document.getElementById("tab-estimator");

  if (!trackerBtn || !estimatorBtn || !trackerContent || !estimatorContent) return;

  if (tabName === 'tracker') {
    trackerBtn.classList.add("active");
    estimatorBtn.classList.remove("active");
    trackerContent.classList.add("active");
    estimatorContent.classList.remove("active");
  } else {
    estimatorBtn.classList.add("active");
    trackerBtn.classList.remove("active");
    estimatorContent.classList.add("active");
    trackerContent.classList.remove("active");
  }
}

// --- Freight Estimator Calculation ---
function calculateFreightPrice() {
  const originSelect = document.getElementById("est-origin");
  const destSelect = document.getElementById("est-destination");
  const weightInput = document.getElementById("est-weight");
  const cargoSelect = document.getElementById("est-cargo-type");

  if (!originSelect || !destSelect || !weightInput || !cargoSelect) return;

  const origin = originSelect.value;
  const destination = destSelect.value;
  const weight = parseFloat(weightInput.value) || 1;
  const cargoType = cargoSelect.value;
  
  const priceOutput = document.getElementById("price-output");
  const distanceSpan = document.getElementById("price-distance");
  const durationSpan = document.getElementById("price-duration");

  if (!priceOutput) return;

  // Same origin destination handling
  if (origin === destination) {
    priceOutput.innerText = "₹ 0";
    if (distanceSpan) distanceSpan.innerHTML = `<i class="fa-solid fa-route"></i> Est. Distance: 0 km`;
    if (durationSpan) durationSpan.innerHTML = `<i class="fa-solid fa-clock"></i> Est. Transit: Immediate`;
    return;
  }

  const distance = distanceMatrix[origin][destination];
  
  // Rate factors per Ton-Kilometer
  let rateFactor = 3.0; // Standard FTL
  if (cargoType === 'express') rateFactor = 4.5;
  if (cargoType === 'refrigerated') rateFactor = 5.5;
  if (cargoType === 'odc') rateFactor = 7.5;

  const baseCharge = 4500;
  const rawTotal = baseCharge + (distance * weight * rateFactor);
  
  // Round to nearest 100 for clean figures
  const finalPrice = Math.round(rawTotal / 100) * 100;
  
  // Transit duration estimation (Average Speed 45 km/h on Indian highways)
  const durationHours = Math.round(distance / 45);
  let durationText = `${durationHours} Hours`;
  if (durationHours > 24) {
    const days = Math.floor(durationHours / 24);
    const remainingHours = durationHours % 24;
    durationText = `${days} Day${days > 1 ? 's' : ''} ${remainingHours} Hr${remainingHours !== 1 ? 's' : ''}`;
  }

  // Display outputs
  priceOutput.innerText = `₹ ${finalPrice.toLocaleString('en-IN')}`;
  if (distanceSpan) distanceSpan.innerHTML = `<i class="fa-solid fa-route"></i> Est. Distance: ${distance.toLocaleString()} km`;
  if (durationSpan) durationSpan.innerHTML = `<i class="fa-solid fa-clock"></i> Est. Transit: ${durationText}`;
}

// Transfer Estimate values into Booking page via sessionStorage
function selectEstimateForBooking() {
  const originSelect = document.getElementById("est-origin");
  const destSelect = document.getElementById("est-destination");
  const weightInput = document.getElementById("est-weight");

  if (!originSelect || !destSelect || !weightInput) return;

  const originCode = originSelect.value;
  const destinationCode = destSelect.value;
  const weightVal = weightInput.value;

  const bookingSession = {
    origin: cityNames[originCode],
    destination: cityNames[destinationCode],
    weight: weightVal
  };

  // Store in sessionStorage
  sessionStorage.setItem("pendingBookingEstimate", JSON.stringify(bookingSession));

  // Redirect to booking page
  window.location.href = "/booking";
}

// --- Consignment Tracker Simulator ---
function simulateTracking() {
  const consignmentInput = document.getElementById("consignment-id").value.trim().toUpperCase();
  const searchBtn = document.getElementById("btn-track-action");
  const resultPanel = document.getElementById("tracker-result-panel");
  
  if (!consignmentInput) {
    alert("Please enter a valid Consignment Reference Number.");
    return;
  }

  // Visual feedback: disable search and show loader inside button
  const originalBtnHTML = searchBtn.innerHTML;
  searchBtn.disabled = true;
  searchBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Searching...`;
  resultPanel.classList.add("hidden");

  // Simulate remote network database lookup
  setTimeout(() => {
    searchBtn.disabled = false;
    searchBtn.innerHTML = originalBtnHTML;
    
    // Pick cities randomly for random lookup simulation
    const citiesList = ["Jaipur Gateway", "Delhi Terminal", "Mumbai Hub", "Kolkata Cargo Bay", "Ahmedabad Station", "Bengaluru Plaza"];
    const statusCodes = ["In Transit", "Outbound Hub", "Delivered", "Customs Inspection"];
    
    // Choose status based on text
    let status = statusCodes[0];
    let badgeClass = "pulse-green";
    let timelineHTML = "";

    // Generate random nodes
    if (consignmentInput.includes("DELIVER")) {
      status = "Delivered";
    }

    // Build random details or fixed details
    const origin = citiesList[Math.floor(Math.random() * 3)];
    let destination = citiesList[Math.floor(Math.random() * 3) + 3];
    if (origin === destination) destination = "Mumbai Hub";

    const badgeEl = document.getElementById("shipment-status-badge");
    const originEl = document.getElementById("shipment-origin");
    const destEl = document.getElementById("shipment-dest");
    const etaEl = document.getElementById("shipment-eta");
    const timelineEl = document.getElementById("tracking-timeline");

    if (badgeEl) badgeEl.innerText = status;
    if (originEl) originEl.innerText = origin;
    if (destEl) destEl.innerText = destination;
    if (etaEl) etaEl.innerText = status === "Delivered" ? "Completed" : "Expected in 24 Hours";

    // Setup timeline dynamically
    timelineHTML = `
      <div class="timeline-item active">
        <div class="timeline-dot"><i class="fa-solid fa-circle-check"></i></div>
        <div class="timeline-info">
          <h4>Consignment Documented</h4>
          <span class="timeline-time">Today, 09:30 AM</span>
          <p>Initial loading list registered at ${origin}.</p>
        </div>
      </div>
      <div class="timeline-item active">
        <div class="timeline-dot"><i class="fa-solid fa-truck"></i></div>
        <div class="timeline-info">
          <h4>In Transit - High Speed Highway</h4>
          <span class="timeline-time">Today, 01:15 PM</span>
          <p>Cargo container route optimized. Transport vehicle en route.</p>
        </div>
      </div>
      <div class="timeline-item ${status === 'Delivered' ? 'active' : 'pending'}">
        <div class="timeline-dot"><i class="fa-solid fa-warehouse"></i></div>
        <div class="timeline-info">
          <h4>Arrival Scan at ${destination}</h4>
          <span class="timeline-time">${status === 'Delivered' ? 'Today, 04:30 PM' : 'Pending Transit'}</span>
          <p>Local distribution depot dispatch scheduling.</p>
        </div>
      </div>
    `;

    if (timelineEl) timelineEl.innerHTML = timelineHTML;
    resultPanel.classList.remove("hidden");
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 1000);
}
