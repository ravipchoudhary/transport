// Global Constants & State
const TOTAL_FRAMES = 51;
const frameImages = [];
let loadedFrames = 0;
let currentFrameIndex = 0;
let isAnimating = true;
let isDragging = false;
let startX = 0;
let animationFrameId = null;

// Matrix of distances between stations (in Kilometers)
const distanceMatrix = {
  'del': { 'del': 0, 'bom': 1415, 'blr': 2170, 'ccu': 1530, 'jai': 270, 'amd': 940 },
  'bom': { 'del': 1415, 'bom': 0, 'blr': 980, 'ccu': 1970, 'jai': 1150, 'amd': 530 },
  'blr': { 'del': 2170, 'bom': 980, 'blr': 0, 'ccu': 1870, 'jai': 1900, 'amd': 1440 },
  'ccu': { 'del': 1530, 'bom': 1970, 'blr': 1870, 'ccu': 0, 'jai': 1510, 'amd': 1950 },
  'jai': { 'del': 270, 'bom': 1150, 'blr': 1900, 'ccu': 1510, 'jai': 0, 'amd': 670 },
  'amd': { 'del': 940, 'bom': 530, 'blr': 1440, 'ccu': 1950, 'jai': 670, 'amd': 0 }
};

const cityNames = {
  'del': 'Delhi NCR',
  'bom': 'Mumbai',
  'blr': 'Bengaluru',
  'ccu': 'Kolkata',
  'jai': 'Jaipur',
  'amd': 'Ahmedabad'
};

// --- DOM Content Loaded Setup ---
document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initPreloader();
  initCanvasEvents();
  setDefaultBookingDate();
  calculateFreightPrice(); // Initial calculation
  initActiveNavHighlight();
  updateFleetImage(); // Initialize professional fleet slider
});

// --- Mobile Navigation ---
function initMobileNav() {
  const toggleBtn = document.getElementById("mobile-toggle");
  const mainNav = document.getElementById("main-nav");
  
  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener("click", () => {
      mainNav.classList.toggle("active");
      const icon = toggleBtn.querySelector("i");
      if (mainNav.classList.contains("active")) {
        icon.className = "fa-solid fa-xmark";
      } else {
        icon.className = "fa-solid fa-bars";
      }
    });

    // Close menu on link click
    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("active");
        toggleBtn.querySelector("i").className = "fa-solid fa-bars";
      });
    });
  }
}

// Active navigation highlight on scroll
function initActiveNavHighlight() {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - 150) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}

// --- Preload Sequence Frames ---
function initPreloader() {
  const loader = document.getElementById("canvas-loader");
  const progressBar = document.getElementById("load-progress");
  const loaderStatus = document.querySelector(".loader-status");
  
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(3, '0');
    img.src = `assets/frames/ezgif-frame-${frameNum}.jpg`;
    img.onload = () => {
      loadedFrames++;
      const progressPercent = Math.round((loadedFrames / TOTAL_FRAMES) * 100);
      if (progressBar) progressBar.style.width = `${progressPercent}%`;
      if (loaderStatus) loaderStatus.innerText = `Initializing Fleet Sequencer (${progressPercent}%)`;
      
      if (loadedFrames === TOTAL_FRAMES) {
        if (loader) {
          loader.style.opacity = 0;
          setTimeout(() => loader.classList.add("hidden"), 500);
        }
        startCanvasLoop();
      }
    };
    img.onerror = () => {
      console.error(`Failed to load frame ${frameNum}`);
      loadedFrames++;
      if (loadedFrames === TOTAL_FRAMES) {
        if (loader) {
          loader.style.opacity = 0;
          setTimeout(() => loader.classList.add("hidden"), 500);
        }
        startCanvasLoop();
      }
    };
    frameImages.push(img);
  }
}

// --- Canvas Image Aspect Crop (Cover Fit) ---
function drawCoverImage(ctx, img) {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const w = canvas.width;
  const h = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  
  // Calculate crop scale to cover canvas area
  const r = Math.max(w / iw, h / ih);
  const nw = iw * r;
  const nh = ih * r;
  
  // Center alignment offset crop
  const cx = (iw - (w / r)) / 2;
  const cy = (ih - (h / r)) / 2;
  
  ctx.drawImage(img, cx, cy, w / r, h / r, 0, 0, w, h);
}

// --- Canvas Sequencer Player ---
function startCanvasLoop() {
  const canvas = document.getElementById("animation-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hudRotation = document.getElementById("hud-rotation");

  function renderFrame() {
    const img = frameImages[currentFrameIndex];
    if (img && img.complete && img.naturalWidth !== 0) {
      drawCoverImage(ctx, img);
      
      // Update rotation status in HUD
      if (hudRotation) {
        const angle = Math.round((currentFrameIndex / TOTAL_FRAMES) * 360);
        hudRotation.innerHTML = `<i class="fa-solid fa-compass"></i> ROT: ${angle}°`;
      }
    } else {
      // Draw placeholder text or loader if frame is not ready
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px Outfit";
      ctx.textAlign = "center";
      ctx.fillText("Syncing...", canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (isAnimating) {
      currentFrameIndex = (currentFrameIndex + 1) % TOTAL_FRAMES;
      renderFrame();
    }
    setTimeout(() => {
      animationFrameId = requestAnimationFrame(loop);
    }, 45); // Approx 22 FPS loop speed
  }

  // Draw initial frame immediately
  renderFrame();
  loop();
}

// --- Canvas Interactive Drag-to-Rotate ---
function initCanvasEvents() {
  const canvas = document.getElementById("animation-canvas");
  if (!canvas) return;

  function handleStart(clientX) {
    isAnimating = false; // Pause auto-rotation when user interacts
    isDragging = true;
    startX = clientX;
  }

  function handleMove(clientX) {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    const hudRotation = document.getElementById("hud-rotation");
    
    // Sensitivity factor: 10 pixels of drag moves 1 frame
    const sensitivity = 10;
    if (Math.abs(deltaX) > sensitivity) {
      const framesMoved = Math.floor(deltaX / sensitivity);
      
      // Update frame index based on drag direction
      currentFrameIndex = (currentFrameIndex - framesMoved + TOTAL_FRAMES) % TOTAL_FRAMES;
      startX = clientX; // Reset start x position
      
      // Redraw immediately
      const ctx = canvas.getContext("2d");
      const img = frameImages[currentFrameIndex];
      if (img && img.complete) {
        drawCoverImage(ctx, img);
        
        // Update rotation status in HUD
        if (hudRotation) {
          const angle = Math.round((currentFrameIndex / TOTAL_FRAMES) * 360);
          hudRotation.innerHTML = `<i class="fa-solid fa-compass"></i> ROT: ${angle}°`;
        }
      }
    }
  }

  function handleEnd() {
    isDragging = false;
    // Resume auto-rotation after 2 seconds of inactivity
    setTimeout(() => {
      if (!isDragging) isAnimating = true;
    }, 2000);
  }

  // Mouse Listeners
  canvas.addEventListener("mousedown", (e) => handleStart(e.clientX));
  window.addEventListener("mousemove", (e) => handleMove(e.clientX));
  window.addEventListener("mouseup", handleEnd);

  // Touch Listeners (Mobile compatibility)
  canvas.addEventListener("touchstart", (e) => handleStart(e.touches[0].clientX), { passive: true });
  window.addEventListener("touchmove", (e) => handleMove(e.touches[0].clientX), { passive: true });
  window.addEventListener("touchend", handleEnd);
}

// --- Tab Switcher Logic ---
function switchTab(tabName) {
  const trackerBtn = document.getElementById("tab-btn-tracker");
  const estimatorBtn = document.getElementById("tab-btn-estimator");
  const trackerContent = document.getElementById("tab-tracker");
  const estimatorContent = document.getElementById("tab-estimator");

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
  const origin = document.getElementById("est-origin").value;
  const destination = document.getElementById("est-destination").value;
  const weight = parseFloat(document.getElementById("est-weight").value) || 1;
  const cargoType = document.getElementById("est-cargo-type").value;
  
  const priceOutput = document.getElementById("price-output");
  const distanceSpan = document.getElementById("price-distance");
  const durationSpan = document.getElementById("price-duration");

  if (!priceOutput) return;

  // Same origin destination handling
  if (origin === destination) {
    priceOutput.innerText = "₹ 0";
    distanceSpan.innerHTML = `<i class="fa-solid fa-route"></i> Est. Distance: 0 km`;
    durationSpan.innerHTML = `<i class="fa-solid fa-clock"></i> Est. Transit: Immediate`;
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
  distanceSpan.innerHTML = `<i class="fa-solid fa-route"></i> Est. Distance: ${distance.toLocaleString()} km`;
  durationSpan.innerHTML = `<i class="fa-solid fa-clock"></i> Est. Transit: ${durationText}`;
}

// Transfer Estimate values into the Booking Form automatically
function selectEstimateForBooking() {
  const originCode = document.getElementById("est-origin").value;
  const destinationCode = document.getElementById("est-destination").value;
  const weightVal = document.getElementById("est-weight").value;

  const bookOrigin = document.getElementById("book-origin");
  const bookDestination = document.getElementById("book-destination");
  const bookWeight = document.getElementById("book-weight");

  if (bookOrigin && bookDestination && bookWeight) {
    // Match dropdown display strings
    bookOrigin.value = cityNames[originCode];
    bookDestination.value = cityNames[destinationCode];
    bookWeight.value = weightVal;

    // Scroll smoothly to booking form
    document.getElementById("booking").scrollIntoView({ behavior: 'smooth' });
  }
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
      badgeClass = "pulse-green";
    }

    // Build random details or fixed details
    const origin = citiesList[Math.floor(Math.random() * 3)];
    let destination = citiesList[Math.floor(Math.random() * 3) + 3];
    if (origin === destination) destination = "Mumbai Hub";

    document.getElementById("shipment-status-badge").innerText = status;
    document.getElementById("shipment-origin").innerText = origin;
    document.getElementById("shipment-dest").innerText = destination;
    document.getElementById("shipment-eta").innerText = status === "Delivered" ? "Completed" : "Expected in 24 Hours";

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
      <div class="timeline-item ${status === 'Delivered' ? 'active' : 'active'}">
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

    document.getElementById("tracking-timeline").innerHTML = timelineHTML;
    resultPanel.classList.remove("hidden");
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 1000);
}

// --- Dynamic Booking Form Submission & Invoice Simulation ---
function setDefaultBookingDate() {
  const dateInput = document.getElementById("book-date");
  if (dateInput) {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Tomorrow
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

function handleBookingSubmit(event) {
  event.preventDefault();

  const senderName = document.getElementById("book-sender-name").value;
  const senderPhone = document.getElementById("book-sender-phone").value;
  const origin = document.getElementById("book-origin").value;
  const destination = document.getElementById("book-destination").value;
  const weight = parseFloat(document.getElementById("book-weight").value);
  const cargoDesc = document.getElementById("book-desc").value;
  const dateVal = document.getElementById("book-date").value;

  if (origin === destination) {
    alert("Origin Station and Destination Station cannot be the same.");
    return;
  }

  // Show dynamic submission processing
  const submitBtn = document.getElementById("btn-submit-booking");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Securing Carrier Allocation...`;

  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;

    // Calculate simulated price
    // Find matching short codes
    let origCode = 'del', destCode = 'bom';
    for (const [code, name] of Object.entries(cityNames)) {
      if (name.toLowerCase() === origin.toLowerCase()) origCode = code;
      if (name.toLowerCase() === destination.toLowerCase()) destCode = code;
    }

    const dist = distanceMatrix[origCode][destCode] || 800;
    const ratePerTon = 5300; // Average FTL rate
    const subtotal = Math.round((dist * weight * 3.8) / 100) * 100;
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);
    const grandTotal = subtotal + cgst + sgst;

    // Random invoice number generator
    const invNum = `CT-${Math.floor(100000 + Math.random() * 900000)}-IN`;

    // Populate invoice elements
    document.getElementById("inv-num").innerText = invNum;
    document.getElementById("inv-date").innerText = formatDate(dateVal);
    document.getElementById("inv-shipper-name").innerHTML = `${senderName}<br>Ph: ${senderPhone}`;
    document.getElementById("inv-desc-col").innerText = cargoDesc;
    document.getElementById("inv-route-col").innerText = `${origin} to ${destination}`;
    document.getElementById("inv-qty-col").innerText = `${weight} Tons`;
    document.getElementById("inv-rate-col").innerText = `₹ ${(Math.round(subtotal / weight)).toLocaleString('en-IN')}`;
    document.getElementById("inv-total-col").innerText = `₹ ${subtotal.toLocaleString('en-IN')}`;

    document.getElementById("inv-subtotal").innerText = `₹ ${subtotal.toLocaleString('en-IN')}`;
    document.getElementById("inv-cgst").innerText = `₹ ${cgst.toLocaleString('en-IN')}`;
    document.getElementById("inv-sgst").innerText = `₹ ${sgst.toLocaleString('en-IN')}`;
    document.getElementById("inv-grandtotal").innerText = `₹ ${grandTotal.toLocaleString('en-IN')}`;

    // Display Invoice
    const invoiceCard = document.getElementById("invoice-card");
    const emptyMsg = document.getElementById("invoice-empty-msg");
    const activeContent = document.getElementById("invoice-actual-content");

    if (invoiceCard && emptyMsg && activeContent) {
      invoiceCard.classList.remove("empty");
      emptyMsg.classList.add("hidden");
      activeContent.classList.remove("hidden");
      
      // Scroll smoothly to invoice output
      invoiceCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 1200);
}

function resetInvoice() {
  const invoiceCard = document.getElementById("invoice-card");
  const emptyMsg = document.getElementById("invoice-empty-msg");
  const activeContent = document.getElementById("invoice-actual-content");
  const form = document.getElementById("booking-form");

  if (invoiceCard && emptyMsg && activeContent) {
    invoiceCard.classList.add("empty");
    emptyMsg.classList.remove("hidden");
    activeContent.classList.add("hidden");
  }
  
  if (form) {
    form.reset();
    setDefaultBookingDate();
  }
}

// Utility date formatter
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// --- Secondary Fleet Showcase Slider ---
const fleetSlides = [
  {
    src: 'assets/fleet-truck.png',
    title: 'Heavy Carrier FTL',
    desc: 'High payload container trucks optimized for long-distance FTL transit.'
  },
  {
    src: 'assets/warehouse.png',
    title: 'Smart Warehouses',
    desc: 'Climate-controlled, secure, and digitally tracked inventory facilities.'
  },
  {
    src: 'assets/depot.png',
    title: 'Express Delivery Depot',
    desc: 'Automated loading bays ensuring prompt parcel dispatches.'
  }
];
let currentFleetIndex = 0;

function updateFleetImage() {
  const imgElement = document.getElementById("fleet-showcase-img");
  const counterElement = document.getElementById("fleet-counter");
  const slide = fleetSlides[currentFleetIndex];
  if (imgElement && counterElement && slide) {
    imgElement.style.opacity = 0;
    setTimeout(() => {
      imgElement.src = slide.src;
      counterElement.innerText = `${slide.title} (${currentFleetIndex + 1} / ${fleetSlides.length})`;
      imgElement.style.opacity = 1;
    }, 250);
  }
}

function nextFleetImage() {
  currentFleetIndex = (currentFleetIndex + 1) % fleetSlides.length;
  updateFleetImage();
}

function prevFleetImage() {
  currentFleetIndex = (currentFleetIndex - 1 + fleetSlides.length) % fleetSlides.length;
  updateFleetImage();
}
