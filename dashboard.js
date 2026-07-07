// Dashboard Application State
let challanList = [];
let dieselList = [];
let mechanicList = [];
let driverList = [];
let vehicleList = [];
let driverProfileList = [];
let activeTab = 'challan';

// Token validation check on startup
const token = localStorage.getItem("authToken");
const user = JSON.parse(localStorage.getItem("authUser") || "null");

if (!token || !user) {
  // If not logged in, redirect back to login page
  localStorage.clear();
  window.location.href = "login.html";
}

// Shared delete helper with logging and toast
async function doDeleteApi(path, id) {
  console.debug('[DBG] doDeleteApi', path, id);
  showDebugToast(`Deleting ${id}...`);
  const res = await fetch(path, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* ignore */ }
  if (!res.ok) {
    const err = data && (data.error || data.message) ? (data.error || data.message) : `Delete failed (${res.status})`;
    throw new Error(err);
  }
  return data;
}

function showDebugToast(text) {
  try {
    let el = document.getElementById('debug-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'debug-toast';
      el.style.position = 'fixed';
      el.style.bottom = '16px';
      el.style.right = '16px';
      el.style.background = 'rgba(0,0,0,0.7)';
      el.style.color = 'white';
      el.style.padding = '8px 12px';
      el.style.borderRadius = '6px';
      el.style.zIndex = 99999;
      el.style.fontSize = '13px';
      document.body.appendChild(el);
    }
    el.innerText = text;
    el.style.opacity = '1';
    el.style.transition = 'opacity 400ms';
    setTimeout(() => {
      el.style.opacity = '0';
    }, 1200);
  } catch (e) {
    /* ignore */
  }
}

function initializeDashboard() {
  displayUserProfile();
  startLiveClock();
  initFormDate();
  
  // Load all module data
  loadChallanData();
  loadDieselData();
  loadMechanicData();
  loadDriverData();
  loadVehicleData();
  loadDriverProfileData();
  
  // Set current month/year defaults in report dropdowns
  const today = new Date();
  const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(today.getFullYear());
  
  const repMonth = document.getElementById("report-select-month");
  const repYear = document.getElementById("report-select-year");
  if (repMonth) repMonth.value = currentMonthStr;
  if (repYear) repYear.value = currentYearStr;

  // Set current month/year defaults for new modules
  const dieselRepMonth = document.getElementById("diesel-report-month");
  const dieselRepYear = document.getElementById("diesel-report-year");
  if (dieselRepMonth) dieselRepMonth.value = currentMonthStr;
  if (dieselRepYear) dieselRepYear.value = currentYearStr;

  const mechanicRepMonth = document.getElementById("mechanic-report-month");
  const mechanicRepYear = document.getElementById("mechanic-report-year");
  if (mechanicRepMonth) mechanicRepMonth.value = currentMonthStr;
  if (mechanicRepYear) mechanicRepYear.value = currentYearStr;

  const driverRepMonth = document.getElementById("driver-report-month");
  const driverRepYear = document.getElementById("driver-report-year");
  if (driverRepMonth) driverRepMonth.value = currentMonthStr;
  if (driverRepYear) driverRepYear.value = currentYearStr;

  const vehicleRepMonth = document.getElementById("vehicle-report-month");
  const vehicleRepYear = document.getElementById("vehicle-report-year");
  if (vehicleRepMonth) vehicleRepMonth.value = currentMonthStr;
  if (vehicleRepYear) vehicleRepYear.value = currentYearStr;

  // Init form date fields for all modules
  initNewFormDates();

  // Close sidebar on mobile when clicking outside
  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("dash-sidebar");
    const toggleBtn = document.getElementById("sidebar-toggle");
    if (sidebar && sidebar.classList.contains("active")) {
      if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
        sidebar.classList.remove("active");
      }
    }
  });

  // Delegated click handler for action buttons (edit/view/delete)
  document.body.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('button.btn-icon');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;

    console.debug('[DBG] action button clicked', { action, id });
    showDebugToast(`${action} → ${id}`);

    switch (action) {
      case 'edit-challan': return triggerEditChallan(id);
      case 'delete-challan': return triggerDeleteChallan(id);
      case 'view-challan': return triggerViewChallan(id);
      case 'edit-diesel': return triggerEditDiesel(id);
      case 'delete-diesel': return triggerDeleteDiesel(id);
      case 'edit-mechanic': return triggerEditMechanic(id);
      case 'delete-mechanic': return triggerDeleteMechanic(id);
      case 'edit-driver': return triggerEditDriver(id);
      case 'delete-driver': return triggerDeleteDriver(id);
      case 'edit-vehicle': return triggerEditVehicle(id);
      case 'delete-vehicle': return triggerDeleteVehicle(id);
      case 'edit-driver-profile': return triggerEditDriverProfile(id);
      case 'delete-driver-profile': return triggerDeleteDriverProfile(id);
      default: return;
    }
  });

  attachActionListeners();
  const observer = new MutationObserver((mutationsList) => {
    for (const m of mutationsList) {
      if (m.addedNodes && m.addedNodes.length) {
        attachActionListeners();
        break;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  try {
    const totalButtons = document.querySelectorAll('button.btn-icon').length;
    console.debug('[DBG] dashboard init - action buttons found:', totalButtons);
    showDebugToast(`Buttons: ${totalButtons}`);
  } catch (e) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}

// --- Profile & Header ---
function displayUserProfile() {
  const profileName = document.getElementById("user-full-name");
  const profileRole = document.getElementById("user-role-badge");
  
  if (profileName && profileRole && user) {
    profileName.innerText = user.fullName;
    profileRole.innerText = user.role;
  }
}

  // Attach direct click listeners to buttons to ensure handlers run
  function attachActionListeners() {
    try {
      const buttons = document.querySelectorAll('button.btn-icon');
      buttons.forEach(btn => {
        if (btn.dataset.listener === '1') return;
        btn.dataset.listener = '1';
        btn.addEventListener('click', (e) => {
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          if (!action || !id) return;
          console.debug('[DBG] direct action click', { action, id });
          showDebugToast(`${action} → ${id}`);
          switch (action) {
            case 'edit-challan': return triggerEditChallan(id);
            case 'delete-challan': return triggerDeleteChallan(id);
            case 'view-challan': return triggerViewChallan(id);
            case 'edit-diesel': return triggerEditDiesel(id);
            case 'delete-diesel': return triggerDeleteDiesel(id);
            case 'edit-mechanic': return triggerEditMechanic(id);
            case 'delete-mechanic': return triggerDeleteMechanic(id);
            case 'edit-driver': return triggerEditDriver(id);
            case 'delete-driver': return triggerDeleteDriver(id);
            case 'edit-vehicle': return triggerEditVehicle(id);
            case 'delete-vehicle': return triggerDeleteVehicle(id);
            case 'edit-driver-profile': return triggerEditDriverProfile(id);
            case 'delete-driver-profile': return triggerDeleteDriverProfile(id);
            default: return;
          }
        });
      });
    } catch (e) {
      /* ignore */
    }
  }

  // Observe DOM changes to bind listeners for dynamically rendered rows
  const observer = new MutationObserver((mutationsList) => {
    for (const m of mutationsList) {
      if (m.addedNodes && m.addedNodes.length) {
        attachActionListeners();
        break;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // initial bind
  attachActionListeners();

  // Debug: report number of action buttons found
  try {
    const totalButtons = document.querySelectorAll('button.btn-icon').length;
    console.debug('[DBG] dashboard init - action buttons found:', totalButtons);
    showDebugToast(`Buttons: ${totalButtons}`);
  } catch (e) {}


// Expose key trigger functions to window for inline onclick attributes
try {
  window.triggerDeleteChallan = triggerDeleteChallan;
  window.triggerEditChallan = triggerEditChallan;
  window.triggerViewChallan = triggerViewChallan;
  window.triggerDeleteDriver = triggerDeleteDriver;
  window.triggerEditDriver = triggerEditDriver;
  window.triggerDeleteVehicle = triggerDeleteVehicle;
  window.triggerEditVehicle = triggerEditVehicle;
  window.triggerDeleteDiesel = triggerDeleteDiesel;
  window.triggerEditDiesel = triggerEditDiesel;
  window.triggerDeleteMechanic = triggerDeleteMechanic;
  window.triggerEditMechanic = triggerEditMechanic;
  window.triggerDeleteDriverProfile = triggerDeleteDriverProfile;
  window.triggerEditDriverProfile = triggerEditDriverProfile;
  console.debug('[DBG] exported trigger functions to window');
} catch (e) {}
function startLiveClock() {
  const clockText = document.getElementById("clock-txt");
  if (!clockText) return;
  
  function updateTime() {
    const now = new Date();
    clockText.innerText = now.toLocaleTimeString();
  }
  
  updateTime();
  setInterval(updateTime, 1000);
}

// Set form date default to today
function initFormDate() {
  const dateInput = document.getElementById("form-challan-date");
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

// --- Sidebar Navigation ---
function switchDashTab(tabName) {
  activeTab = tabName;
  
  // Update sidebar links
  document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
  const activeMenu = document.getElementById(`menu-${tabName}`);
  if (activeMenu) activeMenu.classList.add("active");
  
  // Update workspace title
  const workspaceTitle = document.getElementById("workspace-title-display");
  if (workspaceTitle) {
    const titles = {
      'challan': 'Challan System',
      'driver': 'Logistics Drivers',
      'mechanic': 'Maintenance Workshop',
      'diesel': 'Fuel Accounts',
      'vehicle': 'Vehicle Profiles',
      'driver-profile': 'Driver Profiles'
    };
    workspaceTitle.innerText = titles[tabName] || 'Dashboard';
  }

  // Toggle visible pane
  document.querySelectorAll(".dash-tab-pane").forEach(pane => pane.classList.remove("active"));
  const activePane = document.getElementById(`pane-${tabName}`);
  if (activePane) activePane.classList.add("active");

  // Close sidebar on mobile after clicking
  const sidebar = document.getElementById("dash-sidebar");
  if (sidebar) sidebar.classList.remove("active");
}

function toggleSidebar() {
  const sidebar = document.getElementById("dash-sidebar");
  if (sidebar) sidebar.classList.toggle("active");
}

// --- Log Out ---
function handleLogout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// --- Form Calculations ---
function calculateFormTotals() {
  const bags = parseInt(document.getElementById("form-bags").value) || 0;
  const rate = 10;
  const totalAmount = bags * rate;

  document.getElementById("form-total-bags-display").innerText = bags.toLocaleString();
  document.getElementById("form-amount-display").innerText = `₹ ${totalAmount.toLocaleString('en-IN')}`;
}

// --- Challan API Operations (CRUD) ---

// Get all challans
async function loadChallanData() {
  const loader = document.getElementById("challan-table-loader");
  const emptyState = document.getElementById("challan-table-empty");
  const tableRows = document.getElementById("challan-table-rows");

  if (loader) loader.classList.remove("hidden");
  if (emptyState) emptyState.classList.add("hidden");
  if (tableRows) tableRows.innerHTML = '';

  try {
    const response = await fetch("/api/challans", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      throw new Error("Failed to load records from server.");
    }

    challanList = await response.json();
    
    // Sort challans by date descending
    challanList.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderChallanTable(challanList);
    calculateDashboardStats();
    populateMonthFilterOptions();

  } catch (err) {
    console.error("Error loading challans:", err);
    alert("Could not load challan logs. Server might be offline.");
  } finally {
    if (loader) loader.classList.add("hidden");
  }
}

// Render list of challans in table
function renderChallanTable(list) {
  const tableRows = document.getElementById("challan-table-rows");
  const emptyState = document.getElementById("challan-table-empty");
  
  if (!tableRows) return;
  tableRows.innerHTML = '';

  if (list.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  list.forEach(c => {
    const formattedDate = formatDate(c.date);
    const tr = document.createElement("tr");
    tr.id = `row-${c.id}`;
    tr.innerHTML = `
      <td class="font-bold text-white">${escapeHTML(c.challanNo)}</td>
      <td>${escapeHTML(c.dealerName)}</td>
      <td>${escapeHTML(c.vehicleNumber || '-')}</td>
      <td>${escapeHTML(c.driverName || '-')}</td>
      <td>${formattedDate}</td>
      <td class="text-right">${(c.bags || 0).toLocaleString()}</td>
      <td class="text-right">₹ ${c.ratePerBag}</td>
      <td class="text-right font-bold text-white">₹ ${c.calculatedAmount.toLocaleString('en-IN')}</td>
      <td class="text-center">
        <div class="actions-cell">
          <button class="btn-icon view-btn" data-action="view-challan" data-id="${c.id}" onclick="triggerViewChallan('${c.id}')" title="View Bill"><i class="fa-solid fa-eye"></i></button>
          <button class="btn-icon edit-btn" data-action="edit-challan" data-id="${c.id}" onclick="triggerEditChallan('${c.id}')" title="Edit Log"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-icon delete-btn" data-action="delete-challan" data-id="${c.id}" onclick="triggerDeleteChallan('${c.id}')" title="Delete Log"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableRows.appendChild(tr);
  });
}

// Calculate Dashboard stats cards for the current month
function calculateDashboardStats() {
  const totalChallansCard = document.getElementById("stat-total-challans");
  const totalBagsCard = document.getElementById("stat-total-bags");
  const totalAmountCard = document.getElementById("stat-total-amount");

  if (!totalChallansCard) return;

  // Total absolute counts
  totalChallansCard.innerText = challanList.length;

  // Tally for "This Month" dynamically
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const activeYearMonth = `${yyyy}-${mm}`; // e.g. "2026-06"

  let bagsSum = 0;
  let amountSum = 0;

  challanList.forEach(c => {
    if (c.month === activeYearMonth) {
      bagsSum += (c.bags || 0);
      amountSum += c.calculatedAmount || 0;
    }
  });

  totalBagsCard.innerText = bagsSum.toLocaleString();
  totalAmountCard.innerText = `₹ ${amountSum.toLocaleString('en-IN')}`;
}

// Populate search filter select dropdown dynamically
function populateMonthFilterOptions() {
  const filterSelect = document.getElementById("challan-month-filter");
  if (!filterSelect) return;

  // Clear except first option
  filterSelect.innerHTML = `<option value="all">All Months</option>`;

  // Collect distinct months
  const months = [...new Set(challanList.map(c => c.month))].sort().reverse();
  
  months.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.innerText = formatMonthDisplay(m);
    filterSelect.appendChild(option);
  });
}

// Client filter table search/dropdown trigger
function filterChallanTable() {
  const query = document.getElementById("challan-search").value.toLowerCase().trim();
  const monthFilter = document.getElementById("challan-month-filter").value;

  let filtered = challanList;

  if (monthFilter !== 'all') {
    filtered = filtered.filter(c => c.month === monthFilter);
  }

  if (query) {
    filtered = filtered.filter(c => 
      c.challanNo.toLowerCase().includes(query) || 
      c.dealerName.toLowerCase().includes(query)
    );
  }

  renderChallanTable(filtered);
}

// Reset data entry form
function resetChallanForm() {
  const form = document.getElementById("challan-entry-form");
  if (form) form.reset();
  
  document.getElementById("form-challan-id").value = "";
  document.getElementById("form-challan-vehicle").value = "";
  document.getElementById("form-challan-driver").value = "";
  document.getElementById("form-total-bags-display").innerText = "0";
  document.getElementById("form-amount-display").innerText = "₹ 0";
  document.getElementById("form-panel-title").innerHTML = `<i class="fa-solid fa-folder-plus"></i> Add New Challan Entry`;
  
  initFormDate();
}

// Add or Edit Submission Handler
async function handleChallanSubmit(event) {
  event.preventDefault();

  const challanId = document.getElementById("form-challan-id").value;
  const challanNo = document.getElementById("form-challan-no").value.trim();
  const dealerName = document.getElementById("form-dealer-name").value.trim();
  const vehicleNumber = document.getElementById("form-challan-vehicle").value.trim();
  const driverName = document.getElementById("form-challan-driver").value.trim();
  const date = document.getElementById("form-challan-date").value;
  const qrcodeText = document.getElementById("form-qrcode-input").value.trim();
  const rate = 10;
  const rice = parseInt(document.getElementById("form-rice-bags").value) || 0;
  const wheat = parseInt(document.getElementById("form-wheat-bags").value) || 0;

  const submitBtn = document.getElementById("btn-form-submit");
  const toast = document.getElementById("form-toast");

  if (toast) {
    toast.classList.add("hidden");
    toast.className = "form-feedback-toast";
  }

  // Visual button spinner
  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Entry...`;

  try {
    const isEdit = challanId !== "";
    const url = isEdit ? `/api/challans/${challanId}` : `/api/challans`;
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        challanNo, 
        dealerName, 
        date, 
        riceBags: rice, 
        wheatBags: wheat, 
        ratePerBag: rate,
        vehicleNumber,
        driverName,
        scannedData: qrcodeText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save challan log.");
    }

    showFormFeedback(isEdit ? "Record updated successfully!" : "Challan recorded successfully!", "success");
    
    // Clear and reload
    resetChallanForm();
    await loadChallanData();

  } catch (err) {
    showFormFeedback(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

function showFormFeedback(msg, type) {
  const toast = document.getElementById("form-toast");
  if (toast) {
    toast.innerText = msg;
    toast.classList.remove("hidden");
    toast.classList.add(type);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove(type);
    }, 3000);
  }
}

function launchQrScanner() {
  const qrInput = document.getElementById("form-qrcode-input");
  if (!qrInput) return;

  const qrModal = document.createElement("div");
  qrModal.className = "modal-overlay";
  qrModal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3><i class="fa-solid fa-qrcode"></i> Scan Challan QR</h3>
        <button class="modal-close" id="qr-modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <video id="qr-video" class="scanner-video" autoplay muted playsinline></video>
        <div class="scanner-actions">
          <button class="btn btn-secondary" id="qr-stop-btn"><i class="fa-solid fa-stop"></i> Stop Camera</button>
          <button class="btn btn-primary" id="qr-cancel-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>
        </div>
        <p class="scanner-help">Point your phone camera at the QR code. The scanned text will populate the challan details automatically.</p>
      </div>
    </div>
  `;

  document.body.appendChild(qrModal);
  document.body.classList.add("modal-open");

  const closeScanner = () => {
    stopVideoStream();
    document.body.removeChild(qrModal);
    document.body.classList.remove("modal-open");
  };

  qrModal.querySelector("#qr-modal-close").addEventListener("click", closeScanner);
  qrModal.querySelector("#qr-cancel-btn").addEventListener("click", closeScanner);
  qrModal.querySelector("#qr-stop-btn").addEventListener("click", closeScanner);

  const video = qrModal.querySelector("#qr-video");
  if (!video) return;

  let scanning = true;
  let streamRef = null;
  const canvasElement = document.createElement("canvas");
  const canvasContext = canvasElement.getContext("2d");

  async function startVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef = stream;
      video.srcObject = stream;
      video.play();
      requestAnimationFrame(scanFrame);
    } catch (err) {
      console.error("QR camera error:", err);
      alert("Unable to access the camera for QR scanning. Please allow camera access or paste QR data manually.");
      closeScanner();
    }
  }

  function stopVideoStream() {
    scanning = false;
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
      streamRef = null;
    }
  }

  function parseQrPayload(payload) {
    // Try JSON first, then URLSearchParams-style key=value pairs, then simple CSV
    try {
      return JSON.parse(payload);
    } catch (e) {}

    try {
      // If payload looks like a querystring or key=value pairs
      if (payload.includes('=') && (payload.includes('&') || payload.includes('%20') || payload.includes('+') )) {
        const cleaned = payload.trim();
        const params = new URLSearchParams(cleaned);
        const obj = {};
        for (const [k, v] of params.entries()) obj[k] = v;
        return Object.keys(obj).length ? obj : null;
      }
    } catch (e) {}

    try {
      // key:value pairs separated by commas
      if (payload.includes(':') && payload.includes(',')) {
        const parts = payload.split(',');
        const obj = {};
        parts.forEach(p => {
          const idx = p.indexOf(':');
          if (idx > 0) {
            const k = p.slice(0, idx).trim();
            const v = p.slice(idx + 1).trim();
            obj[k] = v;
          }
        });
        return Object.keys(obj).length ? obj : null;
      }
    } catch (e) {}

    return null;
  }

  function scanFrame() {
    if (!scanning || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (scanning) requestAnimationFrame(scanFrame);
      return;
    }

    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    canvasContext.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

    if (code && code.data) {
      const qrValue = code.data.trim();
      qrInput.value = qrValue;

      const parsed = parseQrPayload(qrValue);
      if (parsed) {
        if (parsed.challanNo) document.getElementById("form-challan-no").value = parsed.challanNo;
        if (parsed.dealerName) document.getElementById("form-dealer-name").value = parsed.dealerName;
        if (parsed.vehicleNumber) document.getElementById("form-challan-vehicle").value = parsed.vehicleNumber;
        if (parsed.driverName) document.getElementById("form-challan-driver").value = parsed.driverName;
        if (parsed.date) document.getElementById("form-challan-date").value = parsed.date;
        if (parsed.riceBags !== undefined) document.getElementById("form-rice-bags").value = parsed.riceBags;
        if (parsed.wheatBags !== undefined) document.getElementById("form-wheat-bags").value = parsed.wheatBags;
        calculateFormTotals();
      }

      closeScanner();
      return;
    }

    requestAnimationFrame(scanFrame);
  }

  startVideo();
}

// Trigger edit mode on form
function triggerEditChallan(id) {
  const challan = challanList.find(c => String(c.id) === String(id));
  if (!challan) return;

  // Fill out form inputs
  document.getElementById("form-challan-id").value = challan.id;
  document.getElementById("form-challan-no").value = challan.challanNo;
  document.getElementById("form-dealer-name").value = challan.dealerName;
  document.getElementById("form-challan-vehicle").value = challan.vehicleNumber || "";
  document.getElementById("form-challan-driver").value = challan.driverName || "";
  document.getElementById("form-qrcode-input").value = challan.scannedData || "";
  
  // Format Date to YYYY-MM-DD
  const dateObj = new Date(challan.date);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  document.getElementById("form-challan-date").value = `${yyyy}-${mm}-${dd}`;
  
  document.getElementById("form-rice-bags").value = challan.riceBags;
  document.getElementById("form-wheat-bags").value = challan.wheatBags;

  // Calculate numbers
  calculateFormTotals();

  // Set visual mode
  document.getElementById("form-panel-title").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Challan #${escapeHTML(challan.challanNo)}`;
  
  // Scroll form into view
  document.querySelector(".workspace-form-panel").scrollIntoView({ behavior: 'smooth' });
}

// Trigger Delete
async function triggerDeleteChallan(id) {
  const challan = challanList.find(c => String(c.id) === String(id));
  if (!challan) return;

  console.debug('[DBG] triggerDeleteChallan called', id, challan);
  const confirmDelete = confirm(`Are you sure you want to delete Challan Log #${challan.challanNo} for ${challan.dealerName}?`);
  if (!confirmDelete) return;

  try {
    const data = await doDeleteApi(`/api/challans/${id}`, id);
    alert(data.message || "Record deleted.");
    await loadChallanData();

  } catch (err) {
    alert(err.message);
  }
}

// --- Invoice Details Modal View ---
function triggerViewChallan(id) {
  const challan = challanList.find(c => String(c.id) === String(id));
  if (!challan) return;

  const modal = document.getElementById("challan-view-modal");
  const modalContent = document.getElementById("modal-slip-content");

  if (!modal || !modalContent) return;

  const cgst = Math.round(challan.calculatedAmount * 0.09);
  const sgst = Math.round(challan.calculatedAmount * 0.09);
  const grandTotal = challan.calculatedAmount + cgst + sgst;

  modalContent.innerHTML = `
    <div class="invoice-outer-card modal-invoice">
      <div class="invoice-header-box">
        <div class="invoice-logo">
          <i class="fa-solid fa-truck-fast"></i> CHOUDHARY LOGISTICS
        </div>
        <div class="invoice-meta">
          <div><strong>Challan No:</strong> <span>${escapeHTML(challan.challanNo)}</span></div>
          <div><strong>Date:</strong> <span>${formatDate(challan.date)}</span></div>
        </div>
      </div>
      
      <div class="invoice-party-row" style="margin-bottom: 20px;">
        <div class="party-box">
          <strong>Carrier Operator:</strong>
          <p>Choudhary Transport Pvt. Ltd.<br>VKI Area Main Road, Jaipur<br>billing@choudharytransport.com</p>
        </div>
        <div class="party-box">
          <strong>Dealer / consignee:</strong>
          <p><strong>${escapeHTML(challan.dealerName)}</strong><br>Status: Dispatched & Verified</p>
        </div>
      </div>

      <table class="invoice-table" style="margin-bottom: 20px;">
        <thead>
          <tr>
            const data = await doDeleteApi(`/api/driver-profiles/${id}`, id);
            alert(data.message || "Record deleted.");
            await loadDriverProfileData();
            <td class="text-right">${challan.wheatBags.toLocaleString()} Bags</td>
            <td class="text-right font-bold">${challan.totalBags.toLocaleString()} Bags</td>
            <td class="text-right">₹ ${challan.ratePerBag}</td>
            <td class="text-right font-bold">₹ ${challan.calculatedAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div class="invoice-total-summary" style="max-width: 250px;">
        <div class="total-row">
          <span>Freight Base:</span>
          <span>₹ ${challan.calculatedAmount.toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row">
          <span>CGST (9%):</span>
          <span>₹ ${cgst.toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row">
          <span>SGST (9%):</span>
          <span>₹ ${sgst.toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row final-total" style="font-size: 1.15rem; padding-top: 8px;">
          <span>Grand Total:</span>
          <span>₹ ${grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div class="invoice-footer" style="padding-top: 16px;">
        <p class="status-watermark" style="font-size: 1rem; padding: 4px 10px; margin-bottom: 12px;">LEDGER AUDITED</p>
        <p style="font-size: 0.75rem; margin-bottom: 0;">This is a computer generated ledger slip compiled on the Choudhary Transport Admin Portal.</p>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeChallanModal() {
  const modal = document.getElementById("challan-view-modal");
  if (modal) modal.classList.add("hidden");
}

function printChallanSlip() {
  window.print();
}

// --- Monthly Ledger Compilation & Reports ---
let currentReportList = [];

function generateMonthlyReport() {
  const filterMonth = document.getElementById("report-select-month").value;
  const filterYear = document.getElementById("report-select-year").value;
  const targetMonthYear = `${filterYear}-${filterMonth}`; // e.g. "2026-06"

  const reportContainer = document.getElementById("report-results-container");
  const reportEmpty = document.getElementById("report-empty-container");
  const reportRows = document.getElementById("report-table-rows");

  if (!reportContainer || !reportEmpty || !reportRows) return;

  // Filter local data
  currentReportList = challanList.filter(c => c.month === targetMonthYear);

  if (currentReportList.length === 0) {
    reportContainer.classList.add("hidden");
    reportEmpty.innerHTML = `<i class="fa-solid fa-folder-open"></i><p>No challans registered in ${formatMonthDisplay(targetMonthYear)}.</p>`;
    reportEmpty.classList.remove("hidden");
    return;
  }

  reportEmpty.classList.add("hidden");
  reportRows.innerHTML = '';

  let riceTotal = 0;
  let wheatTotal = 0;
  let bagsTotal = 0;
  let amountTotal = 0;

  // Populate report table
  currentReportList.forEach(c => {
    riceTotal += c.riceBags;
    wheatTotal += c.wheatBags;
    bagsTotal += c.totalBags;
    amountTotal += c.calculatedAmount;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-bold">${escapeHTML(c.challanNo)}</td>
      <td>${escapeHTML(c.dealerName)}</td>
      <td>${escapeHTML(c.vehicleNumber || '-')}</td>
      <td>${escapeHTML(c.driverName || '-')}</td>
      <td>${formatDate(c.date)}</td>
      <td class="text-right">${c.riceBags.toLocaleString()}</td>
      <td class="text-right">${c.wheatBags.toLocaleString()}</td>
      <td class="text-right font-bold">${c.totalBags.toLocaleString()}</td>
      <td class="text-right">₹ ${c.ratePerBag}</td>
      <td class="text-right font-bold">₹ ${c.calculatedAmount.toLocaleString('en-IN')}</td>
    `;
    reportRows.appendChild(tr);
  });

  // Update report summaries
  document.getElementById("rep-display-month").innerText = formatMonthDisplay(targetMonthYear);
  document.getElementById("rep-total-rice").innerText = riceTotal.toLocaleString();
  document.getElementById("rep-total-wheat").innerText = wheatTotal.toLocaleString();
  document.getElementById("rep-total-bags").innerText = bagsTotal.toLocaleString();
  document.getElementById("rep-total-amount").innerText = `₹ ${amountTotal.toLocaleString('en-IN')}`;

  reportContainer.classList.remove("hidden");
}

// Export Report output to CSV File
function exportReportToCSV() {
  if (currentReportList.length === 0) {
    alert("Please compile a monthly report first before exporting.");
    return;
  }

  const filterMonth = document.getElementById("report-select-month").value;
  const filterYear = document.getElementById("report-select-year").value;
  const filename = `Challan_Report_${filterYear}_${filterMonth}.csv`;

  // Define headers
  const headers = ["Challan Number", "Dealer Name", "Vehicle Number", "Driver Name", "Date", "Rice Bags", "Wheat Bags", "Total Bags", "Rate Per Bag", "Amount (INR)"];
  
  // Map rows
  const csvRows = [headers.join(",")];
  
  let riceSum = 0;
  let wheatSum = 0;
  let bagsSum = 0;
  let amountSum = 0;

  currentReportList.forEach(c => {
    riceSum += c.riceBags;
    wheatSum += c.wheatBags;
    bagsSum += c.totalBags;
    amountSum += c.calculatedAmount;

    const row = [
      `"${c.challanNo.replace(/"/g, '""')}"`,
      `"${c.dealerName.replace(/"/g, '""')}"`,
      `"${(c.vehicleNumber || '').replace(/"/g, '""')}"`,
      `"${(c.driverName || '').replace(/"/g, '""')}"`,
      c.date,
      c.riceBags,
      c.wheatBags,
      c.totalBags,
      c.ratePerBag,
      c.calculatedAmount
    ];
    csvRows.push(row.join(","));
  });

  // Append grand totals row at the bottom
  csvRows.push("");
  csvRows.push(`"GRAND TOTALS",,"","","",${riceSum},${wheatSum},${bagsSum},,${amountSum}`);

  // Create downloadable file link
  const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// --- Utility Formatter Functions ---

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
}

function formatMonthDisplay(yearMonth) {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Initializing other dates ---
function initNewFormDates() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const formattedToday = `${yyyy}-${mm}-${dd}`;

  const dslDate = document.getElementById("form-diesel-date");
  if (dslDate) dslDate.value = formattedToday;

  const mecDate = document.getElementById("form-mechanic-date");
  if (mecDate) mecDate.value = formattedToday;

  const drvDate = document.getElementById("form-driver-date");
  if (drvDate) drvDate.value = formattedToday;

  const dpJoin = document.getElementById("form-dp-joining-date");
  if (dpJoin) dpJoin.value = formattedToday;
}

// ==========================================
// ============= DIESEL MODULE ==============
// ==========================================

function calculateDieselFormTotals() {
  const qty = parseFloat(document.getElementById("form-diesel-quantity").value) || 0;
  const rate = parseFloat(document.getElementById("form-diesel-rate").value) || 0;
  const amount = qty * rate;
  document.getElementById("form-diesel-amount-display").innerText = `₹ ${amount.toLocaleString('en-IN')}`;
}

async function loadDieselData() {
  const loader = document.getElementById("diesel-table-loader");
  const emptyState = document.getElementById("diesel-table-empty");
  const tableRows = document.getElementById("diesel-table-rows");

  if (loader) loader.classList.remove("hidden");
  if (emptyState) emptyState.classList.add("hidden");
  if (tableRows) tableRows.innerHTML = '';

  try {
    const response = await fetch("/api/diesel", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      throw new Error("Failed to load records from server.");
    }

    dieselList = await response.json();
    dieselList.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderDieselTable(dieselList);
    calculateDieselStats();
    populateDieselMonthFilter();

  } catch (err) {
    console.error("Error loading diesel:", err);
    alert("Could not load diesel logs.");
  } finally {
    if (loader) loader.classList.add("hidden");
  }
}

function renderDieselTable(list) {
  const tableRows = document.getElementById("diesel-table-rows");
  const emptyState = document.getElementById("diesel-table-empty");
  
  if (!tableRows) return;
  tableRows.innerHTML = '';

  if (list.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  list.forEach(d => {
    const formattedDate = formatDate(d.date);
    const tr = document.createElement("tr");
    tr.id = `dsl-row-${d.id}`;
    tr.innerHTML = `
      <td class="font-bold text-white">${escapeHTML(d.driverName)}</td>
      <td>${escapeHTML(d.vehicleNumber)}</td>
      <td class="text-right">${d.quantity.toLocaleString()} L</td>
      <td class="text-right">₹ ${d.rate.toLocaleString()}</td>
      <td class="text-right font-bold text-white">₹ ${d.amount.toLocaleString('en-IN')}</td>
      <td>${formattedDate}</td>
      <td>${escapeHTML(d.givenBy)}</td>
      <td>${escapeHTML(d.remarks || '-')}</td>
      <td class="text-center">
        <div class="actions-cell">
          <button class="btn-icon edit-btn" data-action="edit-diesel" data-id="${d.id}" onclick="triggerEditDiesel('${d.id}')" title="Edit Log"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-icon delete-btn" data-action="delete-diesel" data-id="${d.id}" onclick="triggerDeleteDiesel('${d.id}')" title="Delete Log"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableRows.appendChild(tr);
  });
}

function calculateDieselStats() {
  const litersCard = document.getElementById("stat-diesel-liters-this-month");
  const costCard = document.getElementById("stat-diesel-cost-this-month");

  if (!litersCard || !costCard) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const activeYearMonth = `${yyyy}-${mm}`;

  let litersSum = 0;
  let costSum = 0;

  dieselList.forEach(d => {
    if (d.month === activeYearMonth) {
      litersSum += d.quantity;
      costSum += d.amount;
    }
  });

  litersCard.innerText = `${litersSum.toLocaleString()} L`;
  costCard.innerText = `₹ ${costSum.toLocaleString('en-IN')}`;
}

function populateDieselMonthFilter() {
  const filterSelect = document.getElementById("diesel-month-filter");
  if (!filterSelect) return;

  filterSelect.innerHTML = `<option value="all">All Months</option>`;
  const months = [...new Set(dieselList.map(d => d.month))].sort().reverse();
  
  months.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.innerText = formatMonthDisplay(m);
    filterSelect.appendChild(option);
  });
}

function filterDieselTable() {
  const query = document.getElementById("diesel-search").value.toLowerCase().trim();
  const monthFilter = document.getElementById("diesel-month-filter").value;

  let filtered = dieselList;

  if (monthFilter !== 'all') {
    filtered = filtered.filter(d => d.month === monthFilter);
  }

  if (query) {
    filtered = filtered.filter(d => 
      d.driverName.toLowerCase().includes(query) || 
      d.vehicleNumber.toLowerCase().includes(query)
    );
  }

  renderDieselTable(filtered);
}

function resetDieselForm() {
  const form = document.getElementById("diesel-entry-form");
  if (form) form.reset();
  
  document.getElementById("form-diesel-id").value = "";
  document.getElementById("form-diesel-amount-display").innerText = "₹ 0";
  document.getElementById("diesel-form-panel-title").innerHTML = `<i class="fa-solid fa-gas-pump"></i> Add Diesel Log`;
  
  initNewFormDates();
}

async function handleDieselSubmit(event) {
  event.preventDefault();

  const entryId = document.getElementById("form-diesel-id").value;
  const driverName = document.getElementById("form-diesel-driver").value.trim();
  const vehicleNumber = document.getElementById("form-diesel-vehicle").value.trim();
  const quantity = parseFloat(document.getElementById("form-diesel-quantity").value) || 0;
  const rate = parseFloat(document.getElementById("form-diesel-rate").value) || 0;
  const date = document.getElementById("form-diesel-date").value;
  const givenBy = document.getElementById("form-diesel-givenby").value.trim();
  const remarks = document.getElementById("form-diesel-remarks").value.trim();

  const submitBtn = document.getElementById("btn-diesel-form-submit");
  const toast = document.getElementById("diesel-form-toast");

  if (toast) {
    toast.classList.add("hidden");
    toast.className = "form-feedback-toast";
  }

  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Entry...`;

  try {
    const isEdit = entryId !== "";
    const url = isEdit ? `/api/diesel/${entryId}` : `/api/diesel`;
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ driverName, vehicleNumber, quantity, rate, date, givenBy, remarks })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save diesel log.");
    }

    showDieselFormFeedback(isEdit ? "Record updated successfully!" : "Diesel log recorded successfully!", "success");
    resetDieselForm();
    await loadDieselData();

  } catch (err) {
    showDieselFormFeedback(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

function showDieselFormFeedback(msg, type) {
  const toast = document.getElementById("diesel-form-toast");
  if (toast) {
    toast.innerText = msg;
    toast.classList.remove("hidden");
    toast.classList.add(type);
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove(type);
    }, 3000);
  }
}

function triggerEditDiesel(id) {
  const entry = dieselList.find(d => String(d.id) === String(id));
  if (!entry) return;

  document.getElementById("form-diesel-id").value = entry.id;
  document.getElementById("form-diesel-driver").value = entry.driverName;
  document.getElementById("form-diesel-vehicle").value = entry.vehicleNumber;
  document.getElementById("form-diesel-quantity").value = entry.quantity;
  document.getElementById("form-diesel-rate").value = entry.rate;
  
  const dateObj = new Date(entry.date);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  document.getElementById("form-diesel-date").value = `${yyyy}-${mm}-${dd}`;
  
  document.getElementById("form-diesel-givenby").value = entry.givenBy;
  document.getElementById("form-diesel-remarks").value = entry.remarks || '';

  calculateDieselFormTotals();

  document.getElementById("diesel-form-panel-title").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Diesel Log`;
  document.querySelector("#pane-diesel .workspace-form-panel").scrollIntoView({ behavior: 'smooth' });
}

async function triggerDeleteDiesel(id) {
  const entry = dieselList.find(d => String(d.id) === String(id));
  if (!entry) return;

  const confirmDelete = confirm(`Are you sure you want to delete Diesel Log for ${entry.driverName} on ${entry.date}?`);
  if (!confirmDelete) return;

  try {
    const data = await doDeleteApi(`/api/diesel/${id}`, id);
    alert(data.message || "Record deleted.");
    await loadDieselData();

  } catch (err) {
    alert(err.message);
  }
}

let compiledDieselReport = [];

function generateDieselMonthlyReport() {
  const filterMonth = document.getElementById("diesel-report-month").value;
  const filterYear = document.getElementById("diesel-report-year").value;
  const targetMonthYear = `${filterYear}-${filterMonth}`;

  const reportContainer = document.getElementById("diesel-report-results-container");
  const reportEmpty = document.getElementById("diesel-report-empty-container");
  const reportRows = document.getElementById("diesel-report-table-rows");

  if (!reportContainer || !reportEmpty || !reportRows) return;

  const filtered = dieselList.filter(d => d.month === targetMonthYear);

  if (filtered.length === 0) {
    reportContainer.classList.add("hidden");
    reportEmpty.innerHTML = `<i class="fa-solid fa-folder-open"></i><p>No diesel entries registered in ${formatMonthDisplay(targetMonthYear)}.</p>`;
    reportEmpty.classList.remove("hidden");
    return;
  }

  reportEmpty.classList.add("hidden");
  reportRows.innerHTML = '';

  // Group by Driver Name
  const driverAggregation = {};
  filtered.forEach(d => {
    if (!driverAggregation[d.driverName]) {
      driverAggregation[d.driverName] = {
        driverName: d.driverName,
        totalLiters: 0,
        totalAmount: 0
      };
    }
    driverAggregation[d.driverName].totalLiters += d.quantity;
    driverAggregation[d.driverName].totalAmount += d.amount;
  });

  compiledDieselReport = Object.values(driverAggregation);

  let grandLiters = 0;
  let grandAmount = 0;

  compiledDieselReport.forEach(row => {
    grandLiters += row.totalLiters;
    grandAmount += row.totalAmount;
    const avgRate = row.totalLiters > 0 ? (row.totalAmount / row.totalLiters) : 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-bold">${escapeHTML(row.driverName)}</td>
      <td class="text-right">${row.totalLiters.toLocaleString()} L</td>
      <td class="text-right">₹ ${avgRate.toFixed(2)}</td>
      <td class="text-right font-bold text-white">₹ ${row.totalAmount.toLocaleString('en-IN')}</td>
    `;
    reportRows.appendChild(tr);
  });

  document.getElementById("diesel-rep-display-month").innerText = formatMonthDisplay(targetMonthYear);
  document.getElementById("diesel-rep-total-liters").innerText = `${grandLiters.toLocaleString()} L`;
  document.getElementById("diesel-rep-total-amount").innerText = `₹ ${grandAmount.toLocaleString('en-IN')}`;

  reportContainer.classList.remove("hidden");
}

function exportDieselReportToCSV() {
  if (compiledDieselReport.length === 0) {
    alert("Please compile a report first.");
    return;
  }

  const filterMonth = document.getElementById("diesel-report-month").value;
  const filterYear = document.getElementById("diesel-report-year").value || "2026";
  const filename = `Diesel_Report_${filterYear}_${filterMonth}.csv`;

  const headers = ["Driver Name", "Total Liters Filled", "Average Rate Per Liter", "Total Amount (INR)"];
  const csvRows = [headers.join(",")];

  let sumLiters = 0;
  let sumAmount = 0;

  compiledDieselReport.forEach(c => {
    sumLiters += c.totalLiters;
    sumAmount += c.totalAmount;
    const avgRate = c.totalLiters > 0 ? (c.totalAmount / c.totalLiters) : 0;

    const row = [
      `"${c.driverName.replace(/"/g, '""')}"`,
      c.totalLiters,
      avgRate.toFixed(2),
      c.totalAmount
    ];
    csvRows.push(row.join(","));
  });

  csvRows.push("");
  csvRows.push(`"GRAND TOTALS",${sumLiters},,${sumAmount}`);

  const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ==========================================
// ============ MECHANIC MODULE =============
// ==========================================

async function loadMechanicData() {
  const loader = document.getElementById("mechanic-table-loader");
  const emptyState = document.getElementById("mechanic-table-empty");
  const tableRows = document.getElementById("mechanic-table-rows");

  if (loader) loader.classList.remove("hidden");
  if (emptyState) emptyState.classList.add("hidden");
  if (tableRows) tableRows.innerHTML = '';

  try {
    const response = await fetch("/api/mechanic", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      throw new Error("Failed to load records.");
    }

    mechanicList = await response.json();
    mechanicList.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderMechanicTable(mechanicList);
    calculateMechanicStats();
    populateMechanicMonthFilter();

  } catch (err) {
    console.error("Error loading mechanic logs:", err);
    alert("Could not load mechanic records.");
  } finally {
    if (loader) loader.classList.add("hidden");
  }
}

function renderMechanicTable(list) {
  const tableRows = document.getElementById("mechanic-table-rows");
  const emptyState = document.getElementById("mechanic-table-empty");
  
  if (!tableRows) return;
  tableRows.innerHTML = '';

  if (list.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  list.forEach(m => {
    const formattedDate = formatDate(m.date);
    const tr = document.createElement("tr");
    tr.id = `mec-row-${m.id}`;
    tr.innerHTML = `
      <td class="font-bold text-white">${escapeHTML(m.mechanicName)}</td>
      <td>${escapeHTML(m.vehicleNumber)}</td>
      <td>${escapeHTML(m.workDescription)}</td>
      <td>${escapeHTML(m.partsUsed || '-')}</td>
      <td class="text-right font-bold text-white">₹ ${m.amountPaid.toLocaleString('en-IN')}</td>
      <td>${formattedDate}</td>
      <td>${escapeHTML(m.paidBy)}</td>
      <td>${escapeHTML(m.remarks || '-')}</td>
      <td class="text-center">
        <div class="actions-cell">
          <button class="btn-icon edit-btn" data-action="edit-mechanic" data-id="${m.id}" onclick="triggerEditMechanic('${m.id}')" title="Edit Log"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-icon delete-btn" data-action="delete-mechanic" data-id="${m.id}" onclick="triggerDeleteMechanic('${m.id}')" title="Delete Log"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableRows.appendChild(tr);
  });
}

function calculateMechanicStats() {
  const countCard = document.getElementById("stat-mechanic-invoices-count");
  const costCard = document.getElementById("stat-mechanic-cost-this-month");

  if (!countCard || !costCard) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const activeYearMonth = `${yyyy}-${mm}`;

  let expenseSum = 0;
  let serviceCount = 0;

  mechanicList.forEach(m => {
    if (m.month === activeYearMonth) {
      expenseSum += m.amountPaid;
      serviceCount++;
    }
  });

  countCard.innerText = serviceCount.toString();
  costCard.innerText = `₹ ${expenseSum.toLocaleString('en-IN')}`;
}

function populateMechanicMonthFilter() {
  const filterSelect = document.getElementById("mechanic-month-filter");
  if (!filterSelect) return;

  filterSelect.innerHTML = `<option value="all">All Months</option>`;
  const months = [...new Set(mechanicList.map(m => m.month))].sort().reverse();
  
  months.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.innerText = formatMonthDisplay(m);
    filterSelect.appendChild(option);
  });
}

function filterMechanicTable() {
  const query = document.getElementById("mechanic-search").value.toLowerCase().trim();
  const monthFilter = document.getElementById("mechanic-month-filter").value;

  let filtered = mechanicList;

  if (monthFilter !== 'all') {
    filtered = filtered.filter(m => m.month === monthFilter);
  }

  if (query) {
    filtered = filtered.filter(m => 
      m.mechanicName.toLowerCase().includes(query) || 
      m.vehicleNumber.toLowerCase().includes(query) ||
      m.workDescription.toLowerCase().includes(query)
    );
  }

  renderMechanicTable(filtered);
}

function resetMechanicForm() {
  const form = document.getElementById("mechanic-entry-form");
  if (form) form.reset();
  
  document.getElementById("form-mechanic-id").value = "";
  document.getElementById("mechanic-form-panel-title").innerHTML = `<i class="fa-solid fa-screwdriver-wrench"></i> Add Workshop Record`;
  
  initNewFormDates();
}

async function handleMechanicSubmit(event) {
  event.preventDefault();

  const expenseId = document.getElementById("form-mechanic-id").value;
  const mechanicName = document.getElementById("form-mechanic-name").value.trim();
  const vehicleNumber = document.getElementById("form-mechanic-vehicle").value.trim();
  const amountPaid = parseFloat(document.getElementById("form-mechanic-amount").value) || 0;
  const date = document.getElementById("form-mechanic-date").value;
  const paidBy = document.getElementById("form-mechanic-paidby").value.trim();
  const workDescription = document.getElementById("form-mechanic-work").value.trim();
  const partsUsed = document.getElementById("form-mechanic-parts").value.trim();
  const remarks = document.getElementById("form-mechanic-remarks").value.trim();

  const submitBtn = document.getElementById("btn-mechanic-form-submit");
  const toast = document.getElementById("mechanic-form-toast");

  if (toast) {
    toast.classList.add("hidden");
    toast.className = "form-feedback-toast";
  }

  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Entry...`;

  try {
    const isEdit = expenseId !== "";
    const url = isEdit ? `/api/mechanic/${expenseId}` : `/api/mechanic`;
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save mechanic expense.");
    }

    showMechanicFormFeedback(isEdit ? "Record updated successfully!" : "Expense recorded successfully!", "success");
    resetMechanicForm();
    await loadMechanicData();

  } catch (err) {
    showMechanicFormFeedback(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

function showMechanicFormFeedback(msg, type) {
  const toast = document.getElementById("mechanic-form-toast");
  if (toast) {
    toast.innerText = msg;
    toast.classList.remove("hidden");
    toast.classList.add(type);
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove(type);
    }, 3000);
  }
}

function triggerEditMechanic(id) {
  const m = mechanicList.find(x => String(x.id) === String(id));
  if (!m) return;

  document.getElementById("form-mechanic-id").value = m.id;
  document.getElementById("form-mechanic-name").value = m.mechanicName;
  document.getElementById("form-mechanic-vehicle").value = m.vehicleNumber;
  document.getElementById("form-mechanic-amount").value = m.amountPaid;
  
  const dateObj = new Date(m.date);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  document.getElementById("form-mechanic-date").value = `${yyyy}-${mm}-${dd}`;
  
  document.getElementById("form-mechanic-paidby").value = m.paidBy;
  document.getElementById("form-mechanic-work").value = m.workDescription;
  document.getElementById("form-mechanic-parts").value = m.partsUsed || '';
  document.getElementById("form-mechanic-remarks").value = m.remarks || '';

  document.getElementById("mechanic-form-panel-title").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Workshop Record`;
  document.querySelector("#pane-mechanic .workspace-form-panel").scrollIntoView({ behavior: 'smooth' });
}

async function triggerDeleteMechanic(id) {
  const m = mechanicList.find(x => String(x.id) === String(id));
  if (!m) return;

  const confirmDelete = confirm(`Are you sure you want to delete Mechanic Expense for ${m.mechanicName}?`);
  if (!confirmDelete) return;

  try {
    const data = await doDeleteApi(`/api/mechanic/${id}`, id);
    alert(data.message || "Record deleted.");
    await loadMechanicData();

  } catch (err) {
    alert(err.message);
  }
}

let compiledMechanicReport = [];

function generateMechanicMonthlyReport() {
  const filterMonth = document.getElementById("mechanic-report-month").value;
  const filterYear = document.getElementById("mechanic-report-year").value;
  const targetMonthYear = `${filterYear}-${filterMonth}`;

  const reportContainer = document.getElementById("mechanic-report-results-container");
  const reportEmpty = document.getElementById("mechanic-report-empty-container");
  const reportRows = document.getElementById("mechanic-report-table-rows");

  if (!reportContainer || !reportEmpty || !reportRows) return;

  compiledMechanicReport = mechanicList.filter(m => m.month === targetMonthYear);

  if (compiledMechanicReport.length === 0) {
    reportContainer.classList.add("hidden");
    reportEmpty.innerHTML = `<i class="fa-solid fa-folder-open"></i><p>No mechanic invoices in ${formatMonthDisplay(targetMonthYear)}.</p>`;
    reportEmpty.classList.remove("hidden");
    return;
  }

  reportEmpty.classList.add("hidden");
  reportRows.innerHTML = '';

  let grandTotal = 0;

  compiledMechanicReport.forEach(m => {
    grandTotal += m.amountPaid;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-bold">${escapeHTML(m.mechanicName)}</td>
      <td>${escapeHTML(m.vehicleNumber)}</td>
      <td>${escapeHTML(m.workDescription)}</td>
      <td>${escapeHTML(m.partsUsed || '-')}</td>
      <td class="text-right font-bold text-white">₹ ${m.amountPaid.toLocaleString('en-IN')}</td>
      <td>${formatDate(m.date)}</td>
      <td>${escapeHTML(m.paidBy)}</td>
    `;
    reportRows.appendChild(tr);
  });

  document.getElementById("mechanic-rep-display-month").innerText = formatMonthDisplay(targetMonthYear);
  document.getElementById("mechanic-rep-total-amount").innerText = `₹ ${grandTotal.toLocaleString('en-IN')}`;
  document.getElementById("mechanic-rep-total-tasks").innerText = compiledMechanicReport.length.toString();

  reportContainer.classList.remove("hidden");
}

function exportMechanicReportToCSV() {
  if (compiledMechanicReport.length === 0) {
    alert("Please compile a report first.");
    return;
  }

  const filterMonth = document.getElementById("mechanic-report-month").value;
  const filterYear = document.getElementById("mechanic-report-year").value;
  const filename = `Mechanic_Report_${filterYear}_${filterMonth}.csv`;

  const headers = ["Mechanic Name", "Vehicle Number", "Work Description", "Parts Used", "Amount Paid", "Date", "Paid By"];
  const csvRows = [headers.join(",")];

  let sum = 0;

  compiledMechanicReport.forEach(m => {
    sum += m.amountPaid;
    const row = [
      `"${m.mechanicName.replace(/"/g, '""')}"`,
      `"${m.vehicleNumber.replace(/"/g, '""')}"`,
      `"${m.workDescription.replace(/"/g, '""')}"`,
      `"${(m.partsUsed || '').replace(/"/g, '""')}"`,
      m.amountPaid,
      m.date,
      `"${m.paidBy.replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(","));
  });

  csvRows.push("");
  csvRows.push(`"GRAND TOTAL",,,,${sum}`);

  const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// ==========================================
// ============= DRIVER MODULE =============
// ==========================================

async function loadDriverData() {
  const loader = document.getElementById("driver-table-loader");
  const emptyState = document.getElementById("driver-table-empty");
  const tableRows = document.getElementById("driver-table-rows");

  if (loader) loader.classList.remove("hidden");
  if (emptyState) emptyState.classList.add("hidden");
  if (tableRows) tableRows.innerHTML = '';

  try {
    const response = await fetch("/api/driver", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      throw new Error("Failed to load records.");
    }

    driverList = await response.json();
    driverList.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    renderDriverTable(driverList);
    calculateDriverStats();
    populateDriverMonthFilter();

  } catch (err) {
    console.error("Error loading driver logs:", err);
    alert("Could not load driver records.");
  } finally {
    if (loader) loader.classList.add("hidden");
  }
}

function renderDriverTable(list) {
  const tableRows = document.getElementById("driver-table-rows");
  const emptyState = document.getElementById("driver-table-empty");
  
  if (!tableRows) return;
  tableRows.innerHTML = '';

  if (list.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  list.forEach(d => {
    const formattedDate = formatDate(d.paymentDate);
    const tr = document.createElement("tr");
    tr.id = `drv-row-${d.id}`;
    tr.innerHTML = `
      <td class="font-bold text-white">${escapeHTML(d.driverName)}</td>
      <td>${escapeHTML(d.mobileNumber)}</td>
      <td>${escapeHTML(d.vehicleNumber)}</td>
      <td class="text-right font-bold text-white">₹ ${d.amountGiven.toLocaleString('en-IN')}</td>
      <td>${formattedDate}</td>
      <td><span class="badge-status online">${escapeHTML(d.paymentType)}</span></td>
      <td>${escapeHTML(d.remarks || '-')}</td>
      <td class="text-center">
        <div class="actions-cell">
          <button class="btn-icon edit-btn" data-action="edit-driver" data-id="${d.id}" onclick="triggerEditDriver('${d.id}')" title="Edit Log"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-icon delete-btn" data-action="delete-driver" data-id="${d.id}" onclick="triggerDeleteDriver('${d.id}')" title="Delete Log"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableRows.appendChild(tr);
  });
}

function calculateDriverStats() {
  const countCard = document.getElementById("stat-driver-payments-count");
  const costCard = document.getElementById("stat-driver-advances-this-month");

  if (!countCard || !costCard) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const activeYearMonth = `${yyyy}-${mm}`;

  let advanceSum = 0;
  let count = 0;

  driverList.forEach(d => {
    if (d.month === activeYearMonth) {
      advanceSum += d.amountGiven;
      count++;
    }
  });

  countCard.innerText = count.toString();
  costCard.innerText = `₹ ${advanceSum.toLocaleString('en-IN')}`;
}

function populateDriverMonthFilter() {
  const filterSelect = document.getElementById("driver-month-filter");
  if (!filterSelect) return;

  filterSelect.innerHTML = `<option value="all">All Months</option>`;
  const months = [...new Set(driverList.map(d => d.month))].sort().reverse();
  
  months.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.innerText = formatMonthDisplay(m);
    filterSelect.appendChild(option);
  });
}

function filterDriverTable() {
  const query = document.getElementById("driver-search").value.toLowerCase().trim();
  const monthFilter = document.getElementById("driver-month-filter").value;

  let filtered = driverList;

  if (monthFilter !== 'all') {
    filtered = filtered.filter(d => d.month === monthFilter);
  }

  if (query) {
    filtered = filtered.filter(d => 
      d.driverName.toLowerCase().includes(query) || 
      d.vehicleNumber.toLowerCase().includes(query)
    );
  }

  renderDriverTable(filtered);
}

function resetDriverForm() {
  const form = document.getElementById("driver-entry-form");
  if (form) form.reset();
  
  document.getElementById("form-driver-id").value = "";
  document.getElementById("driver-form-panel-title").innerHTML = `<i class="fa-solid fa-user-plus"></i> Add Driver Advance`;
  
  initNewFormDates();
}

async function handleDriverSubmit(event) {
  event.preventDefault();

  const recordId = document.getElementById("form-driver-id").value;
  const driverName = document.getElementById("form-driver-name").value.trim();
  const mobileNumber = document.getElementById("form-driver-mobile").value.trim();
  const vehicleNumber = document.getElementById("form-driver-vehicle").value.trim();
  const amountGiven = parseFloat(document.getElementById("form-driver-amount").value) || 0;
  const paymentDate = document.getElementById("form-driver-date").value;
  const paymentType = document.getElementById("form-driver-type").value;
  const remarks = document.getElementById("form-driver-remarks").value.trim();

  const submitBtn = document.getElementById("btn-driver-form-submit");
  const toast = document.getElementById("driver-form-toast");

  if (toast) {
    toast.classList.add("hidden");
    toast.className = "form-feedback-toast";
  }

  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Entry...`;

  try {
    const isEdit = recordId !== "";
    const url = isEdit ? `/api/driver/${recordId}` : `/api/driver`;
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save driver payment.");
    }

    showDriverFormFeedback(isEdit ? "Record updated successfully!" : "Driver payment recorded successfully!", "success");
    resetDriverForm();
    await loadDriverData();

  } catch (err) {
    showDriverFormFeedback(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

function showDriverFormFeedback(msg, type) {
  const toast = document.getElementById("driver-form-toast");
  if (toast) {
    toast.innerText = msg;
    toast.classList.remove("hidden");
    toast.classList.add(type);
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove(type);
    }, 3000);
  }
}

function triggerEditDriver(id) {
  const d = driverList.find(x => String(x.id) === String(id));
  console.debug('[DBG] triggerEditDriver called', id, d);
  if (!d) return;

  document.getElementById("form-driver-id").value = d.id;
  document.getElementById("form-driver-name").value = d.driverName;
  document.getElementById("form-driver-mobile").value = d.mobileNumber;
  document.getElementById("form-driver-vehicle").value = d.vehicleNumber;
  document.getElementById("form-driver-amount").value = d.amountGiven;
  
  const dateObj = new Date(d.paymentDate);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  document.getElementById("form-driver-date").value = `${yyyy}-${mm}-${dd}`;
  
  document.getElementById("form-driver-type").value = d.paymentType;
  document.getElementById("form-driver-remarks").value = d.remarks || '';

  document.getElementById("driver-form-panel-title").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Driver Advance`;
  document.querySelector("#pane-driver .workspace-form-panel").scrollIntoView({ behavior: 'smooth' });
}

async function triggerDeleteDriver(id) {
  const d = driverList.find(x => String(x.id) === String(id));
  console.debug('[DBG] triggerDeleteDriver called', id, d);
  if (!d) return;

  const confirmDelete = confirm(`Are you sure you want to delete Driver Record for ${d.driverName}?`);
  if (!confirmDelete) return;

  try {
    const data = await doDeleteApi(`/api/driver/${id}`, id);
    alert(data.message || "Record deleted.");
    await loadDriverData();

  } catch (err) {
    alert(err.message);
  }
}

let compiledDriverReport = [];

function generateDriverMonthlyReport() {
  const filterMonth = document.getElementById("driver-report-month").value;
  const filterYear = document.getElementById("driver-report-year").value;
  const targetMonthYear = `${filterYear}-${filterMonth}`;

  const reportContainer = document.getElementById("driver-report-results-container");
  const reportEmpty = document.getElementById("driver-report-empty-container");
  const reportRows = document.getElementById("driver-report-table-rows");

  if (!reportContainer || !reportEmpty || !reportRows) return;

  const filtered = driverList.filter(d => d.month === targetMonthYear);

  if (filtered.length === 0) {
    reportContainer.classList.add("hidden");
    reportEmpty.innerHTML = `<i class="fa-solid fa-folder-open"></i><p>No driver advances registered in ${formatMonthDisplay(targetMonthYear)}.</p>`;
    reportEmpty.classList.remove("hidden");
    return;
  }

  reportEmpty.classList.add("hidden");
  reportRows.innerHTML = '';

  // Group by Driver Name
  const driverAggregation = {};
  filtered.forEach(d => {
    if (!driverAggregation[d.driverName]) {
      driverAggregation[d.driverName] = {
        driverName: d.driverName,
        mobileNumber: d.mobileNumber,
        vehicleNumber: d.vehicleNumber,
        totalAmount: 0,
        count: 0
      };
    }
    driverAggregation[d.driverName].totalAmount += d.amountGiven;
    driverAggregation[d.driverName].count++;
  });

  compiledDriverReport = Object.values(driverAggregation);

  let grandTotal = 0;

  compiledDriverReport.forEach(row => {
    grandTotal += row.totalAmount;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-bold">${escapeHTML(row.driverName)}</td>
      <td>${escapeHTML(row.mobileNumber)}</td>
      <td>${escapeHTML(row.vehicleNumber)}</td>
      <td class="text-right font-bold text-white">₹ ${row.totalAmount.toLocaleString('en-IN')}</td>
      <td class="text-right">${row.count}</td>
    `;
    reportRows.appendChild(tr);
  });

  document.getElementById("driver-rep-display-month").innerText = formatMonthDisplay(targetMonthYear);
  document.getElementById("driver-rep-total-amount").innerText = `₹ ${grandTotal.toLocaleString('en-IN')}`;
  document.getElementById("driver-rep-unique-drivers").innerText = compiledDriverReport.length.toString();

  reportContainer.classList.remove("hidden");
}

function exportDriverReportToCSV() {
  if (compiledDriverReport.length === 0) {
    alert("Please compile a report first.");
    return;
  }

  const filterMonth = document.getElementById("driver-report-month").value;
  const filterYear = document.getElementById("driver-report-year").value;
  const filename = `Driver_Report_${filterYear}_${filterMonth}.csv`;

  const headers = ["Driver Name", "Mobile Number", "Vehicle Number", "Total Advance Given (INR)", "Transaction Count"];
  const csvRows = [headers.join(",")];

  let sum = 0;

  compiledDriverReport.forEach(d => {
    sum += d.totalAmount;
    const row = [
      `"${d.driverName.replace(/"/g, '""')}"`,
      `"${d.mobileNumber.replace(/"/g, '""')}"`,
      `"${d.vehicleNumber.replace(/"/g, '""')}"`,
      d.totalAmount,
      d.count
    ];
    csvRows.push(row.join(","));
  });

  csvRows.push("");
  csvRows.push(`"GRAND TOTAL",,,${sum}`);

  const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// ============ VEHICLE PROFILE =============
// ==========================================

async function loadVehicleData() {
  const loader = document.getElementById("vehicle-table-loader");
  const emptyState = document.getElementById("vehicle-table-empty");
  const tableRows = document.getElementById("vehicle-table-rows");

  if (loader) loader.classList.remove("hidden");
  if (emptyState) emptyState.classList.add("hidden");
  if (tableRows) tableRows.innerHTML = '';

  try {
    const response = await fetch("/api/vehicles", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      throw new Error("Failed to load vehicle profiles.");
    }

    vehicleList = await response.json();
    vehicleList.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));

    renderVehicleTable(vehicleList);
    calculateVehicleStats();

  } catch (err) {
    console.error("Error loading vehicles:", err);
    alert("Could not load vehicles.");
  } finally {
    if (loader) loader.classList.add("hidden");
  }
}

function renderVehicleTable(list) {
  const tableRows = document.getElementById("vehicle-table-rows");
  const emptyState = document.getElementById("vehicle-table-empty");

  if (!tableRows) return;
  tableRows.innerHTML = '';

  if (list.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  list.forEach(v => {
    // Check document status
    const taxStatus = checkExpiryStatus(v.roadTaxExpiry);
    const insStatus = checkExpiryStatus(v.insuranceExpiry);
    const pucStatus = checkExpiryStatus(v.pucExpiry);
    const fitStatus = checkExpiryStatus(v.fitnessExpiry);
    const perStatus = checkExpiryStatus(v.permitExpiry);

    const tr = document.createElement("tr");
    tr.id = `veh-row-${v.id}`;
    
    // RC Doc button
    let rcBtn = '-';
    if (v.rcDocument) {
      rcBtn = `<button class="btn btn-secondary btn-xs" onclick="triggerViewDoc('${v.rcDocument.replace(/'/g, "\\'")}', 'RC - ${escapeHTML(v.vehicleNumber)}')"><i class="fa-solid fa-file-image"></i> View</button>`;
    }

    tr.innerHTML = `
      <td class="font-bold text-white">${escapeHTML(v.vehicleNumber)}</td>
      <td>${escapeHTML(v.vehicleType)}</td>
      <td>${escapeHTML(v.ownerName)}</td>
      <td><span class="badge-expiry ${taxStatus.class}">${taxStatus.label}</span><br><small>${v.roadTaxExpiry}</small></td>
      <td><span class="badge-expiry ${insStatus.class}">${insStatus.label}</span><br><small>${v.insuranceExpiry}</small></td>
      <td><span class="badge-expiry ${pucStatus.class}">${pucStatus.label}</span><br><small>${v.pucExpiry}</small></td>
      <td><span class="badge-expiry ${fitStatus.class}">${fitStatus.label}</span><br><small>${v.fitnessExpiry}</small></td>
      <td><span class="badge-expiry ${perStatus.class}">${perStatus.label}</span><br><small>${v.permitExpiry}</small></td>
      <td>${rcBtn}</td>
      <td class="text-center">
        <div class="actions-cell">
          <button class="btn-icon edit-btn" data-action="edit-vehicle" data-id="${v.id}" onclick="triggerEditVehicle('${v.id}')" title="Edit Vehicle"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-icon delete-btn" data-action="delete-vehicle" data-id="${v.id}" onclick="triggerDeleteVehicle('${v.id}')" title="Delete Vehicle"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableRows.appendChild(tr);
  });
}

function calculateVehicleStats() {
  const totalVehiclesCard = document.getElementById("stat-vehicle-total");
  const expiringAlertsCard = document.getElementById("stat-vehicle-expiring");

  if (!totalVehiclesCard || !expiringAlertsCard) return;

  totalVehiclesCard.innerText = vehicleList.length;

  let expiringCount = 0;
  vehicleList.forEach(v => {
    const dates = [v.roadTaxExpiry, v.insuranceExpiry, v.pucExpiry, v.fitnessExpiry, v.permitExpiry];
    let isAlert = false;
    dates.forEach(d => {
      const status = checkExpiryStatus(d);
      if (status.class === 'expired' || status.class === 'expiring') {
        isAlert = true;
      }
    });
    if (isAlert) expiringCount++;
  });

  expiringAlertsCard.innerText = expiringCount.toString();
}

function filterVehicleTable() {
  const query = document.getElementById("vehicle-search").value.toLowerCase().trim();
  const filterType = document.getElementById("vehicle-expiry-filter").value;

  let filtered = vehicleList;

  if (filterType === 'expiring_soon') {
    filtered = filtered.filter(v => {
      const dates = [v.roadTaxExpiry, v.insuranceExpiry, v.pucExpiry, v.fitnessExpiry, v.permitExpiry];
      let isAlert = false;
      dates.forEach(d => {
        const status = checkExpiryStatus(d);
        if (status.class === 'expired' || status.class === 'expiring') {
          isAlert = true;
        }
      });
      return isAlert;
    });
  }

  if (query) {
    filtered = filtered.filter(v => 
      v.vehicleNumber.toLowerCase().includes(query) || 
      v.ownerName.toLowerCase().includes(query) || 
      v.vehicleType.toLowerCase().includes(query)
    );
  }

  renderVehicleTable(filtered);
}

function resetVehicleForm() {
  const form = document.getElementById("vehicle-entry-form");
  if (form) form.reset();

  document.getElementById("form-vehicle-id").value = "";
  document.getElementById("form-vehicle-rc-data").value = "";
  document.getElementById("rc-preview-container").classList.add("hidden");
  document.getElementById("vehicle-form-panel-title").innerHTML = `<i class="fa-solid fa-truck-ramp-box"></i> Add Vehicle Profile`;
}

async function handleVehicleSubmit(event) {
  event.preventDefault();

  const vehicleId = document.getElementById("form-vehicle-id").value;
  const vehicleNumber = document.getElementById("form-vehicle-number").value.toUpperCase().trim();
  const vehicleType = document.getElementById("form-vehicle-type").value.trim();
  const ownerName = document.getElementById("form-vehicle-owner").value.trim();
  const roadTaxExpiry = document.getElementById("form-vehicle-tax-expiry").value;
  const insuranceExpiry = document.getElementById("form-vehicle-insurance-expiry").value;
  const pucExpiry = document.getElementById("form-vehicle-puc-expiry").value;
  const fitnessExpiry = document.getElementById("form-vehicle-fitness-expiry").value;
  const permitExpiry = document.getElementById("form-vehicle-permit-expiry").value;
  const remarks = document.getElementById("form-vehicle-remarks").value.trim();
  const rcDocument = document.getElementById("form-vehicle-rc-data").value;

  const submitBtn = document.getElementById("btn-vehicle-form-submit");
  const toast = document.getElementById("vehicle-form-toast");

  if (toast) {
    toast.classList.add("hidden");
    toast.className = "form-feedback-toast";
  }

  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...`;

  try {
    const isEdit = vehicleId !== "";
    const url = isEdit ? `/api/vehicles/${vehicleId}` : `/api/vehicles`;
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        vehicleNumber,
        vehicleType,
        ownerName,
        roadTaxExpiry,
        insuranceExpiry,
        pucExpiry,
        fitnessExpiry,
        permitExpiry,
        remarks,
        rcDocument
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save vehicle profile.");
    }

    showVehicleFormFeedback(isEdit ? "Vehicle updated successfully!" : "Vehicle registered successfully!", "success");
    resetVehicleForm();
    await loadVehicleData();

  } catch (err) {
    showVehicleFormFeedback(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

function showVehicleFormFeedback(msg, type) {
  const toast = document.getElementById("vehicle-form-toast");
  if (toast) {
    toast.innerText = msg;
    toast.classList.remove("hidden");
    toast.classList.add(type);
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove(type);
    }, 3000);
  }
}

function triggerEditVehicle(id) {
  const v = vehicleList.find(x => String(x.id) === String(id));
  console.debug('[DBG] triggerEditVehicle called', id, v);
  if (!v) return;

  document.getElementById("form-vehicle-id").value = v.id;
  document.getElementById("form-vehicle-number").value = v.vehicleNumber;
  document.getElementById("form-vehicle-type").value = v.vehicleType;
  document.getElementById("form-vehicle-owner").value = v.ownerName;
  document.getElementById("form-vehicle-tax-expiry").value = v.roadTaxExpiry;
  document.getElementById("form-vehicle-insurance-expiry").value = v.insuranceExpiry;
  document.getElementById("form-vehicle-puc-expiry").value = v.pucExpiry;
  document.getElementById("form-vehicle-fitness-expiry").value = v.fitnessExpiry;
  document.getElementById("form-vehicle-permit-expiry").value = v.permitExpiry;
  document.getElementById("form-vehicle-remarks").value = v.remarks || "";
  
  if (v.rcDocument) {
    document.getElementById("form-vehicle-rc-data").value = v.rcDocument;
    document.getElementById("rc-preview-img").src = v.rcDocument;
    document.getElementById("rc-preview-name").innerText = "rc_document.png";
    document.getElementById("rc-preview-container").classList.remove("hidden");
  } else {
    document.getElementById("form-vehicle-rc-data").value = "";
    document.getElementById("rc-preview-container").classList.add("hidden");
  }

  document.getElementById("vehicle-form-panel-title").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Fleet Vehicle`;
  document.querySelector("#pane-vehicle .workspace-form-panel").scrollIntoView({ behavior: 'smooth' });
}

async function triggerDeleteVehicle(id) {
  const v = vehicleList.find(x => String(x.id) === String(id));
  console.debug('[DBG] triggerDeleteVehicle called', id, v);
  if (!v) return;

  const confirmDelete = confirm(`Are you sure you want to delete Vehicle Profile for ${v.vehicleNumber}?`);
  if (!confirmDelete) return;

  try {
    const data = await doDeleteApi(`/api/vehicles/${id}`, id);
    alert(data.message || "Record deleted.");
    await loadVehicleData();

  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// ============ DRIVER PROFILE =============
// ==========================================

async function loadDriverProfileData() {
  const loader = document.getElementById("driver-profile-table-loader");
  const emptyState = document.getElementById("driver-profile-table-empty");
  const tableRows = document.getElementById("driver-profile-table-rows");

  if (loader) loader.classList.remove("hidden");
  if (emptyState) emptyState.classList.add("hidden");
  if (tableRows) tableRows.innerHTML = '';

  try {
    const response = await fetch("/api/driver-profiles", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      throw new Error("Failed to load driver profiles.");
    }

    driverProfileList = await response.json();
    driverProfileList.sort((a, b) => a.driverName.localeCompare(b.driverName));

    renderDriverProfileTable(driverProfileList);
    calculateDriverProfileStats();
    populateDriverAuditDropdown();

  } catch (err) {
    console.error("Error loading driver profiles:", err);
    alert("Could not load driver profiles.");
  } finally {
    if (loader) loader.classList.add("hidden");
  }
}

function renderDriverProfileTable(list) {
  const tableRows = document.getElementById("driver-profile-table-rows");
  const emptyState = document.getElementById("driver-profile-table-empty");

  if (!tableRows) return;
  tableRows.innerHTML = '';

  if (list.length === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  list.forEach(dp => {
    const tr = document.createElement("tr");
    tr.id = `dp-row-${dp.id}`;

    // Profile Photo thumbnail
    let photoHtml = `<div class="avatar avatar-sm"><i class="fa-solid fa-user"></i></div>`;
    if (dp.driverPhoto) {
      photoHtml = `<img src="${dp.driverPhoto}" class="preview-thumbnail" style="width: 32px; height: 32px; border-radius: 50%; cursor: pointer;" onclick="triggerViewDoc('${dp.driverPhoto.replace(/'/g, "\\'")}', '${escapeHTML(dp.driverName)} Photo')">`;
    }

    // Docs buttons
    let aadhaarBtn = '-';
    if (dp.aadhaarPhoto) {
      aadhaarBtn = `<button class="btn btn-secondary btn-xs" onclick="triggerViewDoc('${dp.aadhaarPhoto.replace(/'/g, "\\'")}', 'Aadhaar - ${escapeHTML(dp.driverName)}')"><i class="fa-solid fa-id-card"></i> Aadhaar</button>`;
    }
    
    let licBtn = '-';
    if (dp.licensePhoto) {
      licBtn = `<button class="btn btn-secondary btn-xs" onclick="triggerViewDoc('${dp.licensePhoto.replace(/'/g, "\\'")}', 'DL - ${escapeHTML(dp.driverName)}')"><i class="fa-solid fa-address-card"></i> Licence</button>`;
    }

    tr.innerHTML = `
      <td>${photoHtml}</td>
      <td class="font-bold text-white">${escapeHTML(dp.driverName)}</td>
      <td>${escapeHTML(dp.mobileNumber)}</td>
      <td>${escapeHTML(dp.assignedVehicleNumber || 'Not Assigned')}</td>
      <td>${escapeHTML(dp.licenseNumber)}</td>
      <td>${formatDate(dp.joiningDate)}</td>
      <td>
        <div style="display: flex; gap: 8px;">
          ${aadhaarBtn !== '-' ? aadhaarBtn : ''}
          ${licBtn !== '-' ? licBtn : ''}
          ${aadhaarBtn === '-' && licBtn === '-' ? '<small class="text-muted">No Documents</small>' : ''}
        </div>
      </td>
      <td class="text-center">
        <div class="actions-cell">
          <button class="btn-icon edit-btn" data-action="edit-driver-profile" data-id="${dp.id}" onclick="triggerEditDriverProfile('${dp.id}')" title="Edit Profile"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-icon delete-btn" data-action="delete-driver-profile" data-id="${dp.id}" onclick="triggerDeleteDriverProfile('${dp.id}')" title="Delete Profile"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tableRows.appendChild(tr);
  });
}

function calculateDriverProfileStats() {
  const totalDpCard = document.getElementById("stat-dp-total");
  const assignedDpCard = document.getElementById("stat-dp-assigned");

  if (!totalDpCard || !assignedDpCard) return;

  totalDpCard.innerText = driverProfileList.length;

  let assignedCount = 0;
  driverProfileList.forEach(dp => {
    if (dp.assignedVehicleNumber && dp.assignedVehicleNumber !== 'NONE' && dp.assignedVehicleNumber !== 'NOT ASSIGNED' && dp.assignedVehicleNumber !== 'Not Assigned') {
      assignedCount++;
    }
  });

  assignedDpCard.innerText = assignedCount.toString();
}

function populateDriverAuditDropdown() {
  const auditSelect = document.getElementById("audit-select-driver");
  if (!auditSelect) return;

  auditSelect.innerHTML = `<option value="">-- Select Driver --</option>`;
  driverProfileList.forEach(dp => {
    const opt = document.createElement("option");
    opt.value = dp.driverName;
    opt.innerText = `${dp.driverName} (${dp.assignedVehicleNumber || 'No Truck'})`;
    auditSelect.appendChild(opt);
  });
}

function filterDriverProfileTable() {
  const query = document.getElementById("driver-profile-search").value.toLowerCase().trim();

  let filtered = driverProfileList;

  if (query) {
    filtered = filtered.filter(dp => 
      dp.driverName.toLowerCase().includes(query) || 
      dp.mobileNumber.toLowerCase().includes(query) || 
      dp.licenseNumber.toLowerCase().includes(query) || 
      (dp.assignedVehicleNumber || '').toLowerCase().includes(query)
    );
  }

  renderDriverProfileTable(filtered);
}

function resetDriverProfileForm() {
  const form = document.getElementById("driver-profile-entry-form");
  if (form) form.reset();

  document.getElementById("form-dp-id").value = "";
  document.getElementById("form-dp-photo-data").value = "";
  document.getElementById("form-dp-aadhaar-data").value = "";
  document.getElementById("form-dp-license-data").value = "";

  document.getElementById("dp_photo-preview-container").classList.add("hidden");
  document.getElementById("aadhaar-preview-container").classList.add("hidden");
  document.getElementById("license-preview-container").classList.add("hidden");

  document.getElementById("driver-profile-form-panel-title").innerHTML = `<i class="fa-solid fa-user-plus"></i> Add Driver Profile`;
  
  initNewFormDates();
}

async function handleDriverProfileSubmit(event) {
  event.preventDefault();

  const dpId = document.getElementById("form-dp-id").value;
  const driverName = document.getElementById("form-dp-name").value.trim();
  const mobileNumber = document.getElementById("form-dp-mobile").value.trim();
  const assignedVehicleNumber = document.getElementById("form-dp-assigned-vehicle").value.toUpperCase().trim();
  const address = document.getElementById("form-dp-address").value.trim();
  const aadhaarNumber = document.getElementById("form-dp-aadhaar-num").value.trim();
  const licenseNumber = document.getElementById("form-dp-license-num").value.trim();
  const joiningDate = document.getElementById("form-dp-joining-date").value;
  const remarks = document.getElementById("form-dp-remarks").value.trim();

  const driverPhoto = document.getElementById("form-dp-photo-data").value;
  const aadhaarPhoto = document.getElementById("form-dp-aadhaar-data").value;
  const licensePhoto = document.getElementById("form-dp-license-data").value;

  const submitBtn = document.getElementById("btn-driver-profile-form-submit");
  const toast = document.getElementById("driver-profile-form-toast");

  if (toast) {
    toast.classList.add("hidden");
    toast.className = "form-feedback-toast";
  }

  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Profile...`;

  try {
    const isEdit = dpId !== "";
    const url = isEdit ? `/api/driver-profiles/${dpId}` : `/api/driver-profiles`;
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        driverName,
        mobileNumber,
        address,
        aadhaarNumber,
        aadhaarPhoto,
        licenseNumber,
        licensePhoto,
        driverPhoto,
        assignedVehicleNumber,
        joiningDate,
        remarks
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save driver profile.");
    }

    showDriverProfileFormFeedback(isEdit ? "Profile updated successfully!" : "Profile registered successfully!", "success");
    resetDriverProfileForm();
    await loadDriverProfileData();

  } catch (err) {
    showDriverProfileFormFeedback(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

function showDriverProfileFormFeedback(msg, type) {
  const toast = document.getElementById("driver-profile-form-toast");
  if (toast) {
    toast.innerText = msg;
    toast.classList.remove("hidden");
    toast.classList.add(type);
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove(type);
    }, 3000);
  }
}

function triggerEditDriverProfile(id) {
  const dp = driverProfileList.find(x => String(x.id) === String(id));
  if (!dp) return;

  document.getElementById("form-dp-id").value = dp.id;
  document.getElementById("form-dp-name").value = dp.driverName;
  document.getElementById("form-dp-mobile").value = dp.mobileNumber;
  document.getElementById("form-dp-assigned-vehicle").value = dp.assignedVehicleNumber || "";
  document.getElementById("form-dp-address").value = dp.address;
  document.getElementById("form-dp-aadhaar-num").value = dp.aadhaarNumber;
  document.getElementById("form-dp-license-num").value = dp.licenseNumber;
  document.getElementById("form-dp-joining-date").value = dp.joiningDate;
  document.getElementById("form-dp-remarks").value = dp.remarks || "";

  // Previews
  if (dp.driverPhoto) {
    document.getElementById("form-dp-photo-data").value = dp.driverPhoto;
    document.getElementById("dp_photo-preview-img").src = dp.driverPhoto;
    document.getElementById("dp_photo-preview-name").innerText = "photo.jpg";
    document.getElementById("dp_photo-preview-container").classList.remove("hidden");
  } else {
    document.getElementById("form-dp-photo-data").value = "";
    document.getElementById("dp_photo-preview-container").classList.add("hidden");
  }

  if (dp.aadhaarPhoto) {
    document.getElementById("form-dp-aadhaar-data").value = dp.aadhaarPhoto;
    document.getElementById("aadhaar-preview-img").src = dp.aadhaarPhoto;
    document.getElementById("aadhaar-preview-name").innerText = "aadhaar.jpg";
    document.getElementById("aadhaar-preview-container").classList.remove("hidden");
  } else {
    document.getElementById("form-dp-aadhaar-data").value = "";
    document.getElementById("aadhaar-preview-container").classList.add("hidden");
  }

  if (dp.licensePhoto) {
    document.getElementById("form-dp-license-data").value = dp.licensePhoto;
    document.getElementById("license-preview-img").src = dp.licensePhoto;
    document.getElementById("license-preview-name").innerText = "license.jpg";
    document.getElementById("license-preview-container").classList.remove("hidden");
  } else {
    document.getElementById("form-dp-license-data").value = "";
    document.getElementById("license-preview-container").classList.add("hidden");
  }

  document.getElementById("driver-profile-form-panel-title").innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Driver Profile`;
  document.querySelector("#pane-driver-profile .workspace-form-panel").scrollIntoView({ behavior: 'smooth' });
}

async function triggerDeleteDriverProfile(id) {
  const dp = driverProfileList.find(x => String(x.id) === String(id));
  if (!dp) return;

  const confirmDelete = confirm(`Are you sure you want to delete Driver Profile for ${dp.driverName}?`);
  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/driver-profiles/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete driver profile.");
    }

    alert(data.message || "Profile deleted.");
    await loadDriverProfileData();

  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// ========== FILE UPLOAD HANDLERS ==========
// ==========================================

function handleFileSelected(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Data = e.target.result;
    
    let dataFieldId = "";
    if (type === 'rc') dataFieldId = "form-vehicle-rc-data";
    else if (type === 'dp_photo') dataFieldId = "form-dp-photo-data";
    else if (type === 'aadhaar') dataFieldId = "form-dp-aadhaar-data";
    else if (type === 'license') dataFieldId = "form-dp-license-data";
    
    const hiddenInput = document.getElementById(dataFieldId);
    if (hiddenInput) hiddenInput.value = base64Data;
    
    const previewContainer = document.getElementById(`${type}-preview-container`);
    const previewImg = document.getElementById(`${type}-preview-img`);
    const previewName = document.getElementById(`${type}-preview-name`);
    
    if (previewContainer && previewImg && previewName) {
      previewImg.src = base64Data;
      previewName.innerText = file.name;
      previewContainer.classList.remove("hidden");
    }
  };
  reader.readAsDataURL(file);
}

function removeUploadedFile(type) {
  let dataFieldId = "";
  let uploadFieldId = "";
  if (type === 'rc') {
    dataFieldId = "form-vehicle-rc-data";
    uploadFieldId = "form-vehicle-rc-upload";
  } else if (type === 'dp_photo') {
    dataFieldId = "form-dp-photo-data";
    uploadFieldId = "form-dp-photo-upload";
  } else if (type === 'aadhaar') {
    dataFieldId = "form-dp-aadhaar-data";
    uploadFieldId = "form-dp-aadhaar-upload";
  } else if (type === 'license') {
    dataFieldId = "form-dp-license-data";
    uploadFieldId = "form-dp-license-upload";
  }

  const hiddenInput = document.getElementById(dataFieldId);
  if (hiddenInput) hiddenInput.value = "";
  
  const fileInput = document.getElementById(uploadFieldId);
  if (fileInput) fileInput.value = "";
  
  const previewContainer = document.getElementById(`${type}-preview-container`);
  if (previewContainer) previewContainer.classList.add("hidden");
}

// ==========================================
// ======== DOCUMENT PREVIEW MODAL ==========
// ==========================================

function triggerViewDoc(base64Data, docTitle) {
  const modal = document.getElementById("doc-preview-modal");
  const modalTitle = document.getElementById("doc-modal-title");
  const modalImg = document.getElementById("doc-modal-img");
  const modalEmpty = document.getElementById("doc-modal-empty");

  if (!modal || !modalTitle || !modalImg || !modalEmpty) return;

  modalTitle.innerHTML = `<i class="fa-solid fa-file-image"></i> ${escapeHTML(docTitle)}`;
  
  if (base64Data) {
    modalImg.src = base64Data;
    modalImg.classList.remove("hidden");
    modalEmpty.classList.add("hidden");
  } else {
    modalImg.src = "";
    modalImg.classList.add("hidden");
    modalEmpty.classList.remove("hidden");
  }

  modal.classList.remove("hidden");
}

function closeDocPreviewModal() {
  const modal = document.getElementById("doc-preview-modal");
  if (modal) modal.classList.add("hidden");
}

// ==========================================
// ======= VEHICLE-WISE REPORT COMPILER ======
// ==========================================

let compiledVehicleConsolidatedReport = [];

function generateVehicleConsolidatedReport() {
  const filterMonth = document.getElementById("vehicle-report-month").value;
  const filterYear = document.getElementById("vehicle-report-year").value;
  const targetMonthYear = `${filterYear}-${filterMonth}`;

  const reportContainer = document.getElementById("vehicle-report-results-container");
  const reportEmpty = document.getElementById("vehicle-report-empty-container");
  const reportRows = document.getElementById("vehicle-report-table-rows");

  if (!reportContainer || !reportEmpty || !reportRows) return;

  // Filter logs for selected month
  const mChallans = challanList.filter(c => c.month === targetMonthYear);
  const mDiesel = dieselList.filter(d => d.month === targetMonthYear);
  const mMechanic = mechanicList.filter(m => m.month === targetMonthYear);

  if (mChallans.length === 0 && mDiesel.length === 0 && mMechanic.length === 0) {
    reportContainer.classList.add("hidden");
    reportEmpty.innerHTML = `<i class="fa-solid fa-folder-open"></i><p>No transactions registered for any vehicle in ${formatMonthDisplay(targetMonthYear)}.</p>`;
    reportEmpty.classList.remove("hidden");
    return;
  }

  reportEmpty.classList.add("hidden");
  reportRows.innerHTML = '';

  // Get list of all distinct vehicle numbers from registry + logs
  const vehiclesMap = {};
  
  // Populate from registry
  vehicleList.forEach(v => {
    vehiclesMap[v.vehicleNumber] = {
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
      dieselQty: 0,
      dieselCost: 0,
      mechanicCost: 0,
      challanBags: 0,
      challanAmount: 0
    };
  });

  // Populate any additional vehicle numbers that appear in logs
  const allLogsVehicles = new Set([
    ...mChallans.map(c => c.vehicleNumber),
    ...mDiesel.map(d => d.vehicleNumber),
    ...mMechanic.map(m => m.vehicleNumber)
  ]);

  allLogsVehicles.forEach(vehNum => {
    if (vehNum && vehNum !== '-' && !vehiclesMap[vehNum]) {
      vehiclesMap[vehNum] = {
        vehicleNumber: vehNum,
        vehicleType: 'External Fleet / Unregistered',
        dieselQty: 0,
        dieselCost: 0,
        mechanicCost: 0,
        challanBags: 0,
        challanAmount: 0
      };
    }
  });

  // Aggregate diesel logs
  mDiesel.forEach(d => {
    if (d.vehicleNumber && vehiclesMap[d.vehicleNumber]) {
      vehiclesMap[d.vehicleNumber].dieselQty += d.quantity;
      vehiclesMap[d.vehicleNumber].dieselCost += d.amount;
    }
  });

  // Aggregate mechanic expenses
  mMechanic.forEach(m => {
    if (m.vehicleNumber && vehiclesMap[m.vehicleNumber]) {
      vehiclesMap[m.vehicleNumber].mechanicCost += m.amountPaid;
    }
  });

  // Aggregate challans
  mChallans.forEach(c => {
    if (c.vehicleNumber && vehiclesMap[c.vehicleNumber]) {
      vehiclesMap[c.vehicleNumber].challanBags += c.totalBags;
      vehiclesMap[c.vehicleNumber].challanAmount += c.calculatedAmount;
    }
  });

  // Convert to array and filter out rows with 0 activity
  compiledVehicleConsolidatedReport = Object.values(vehiclesMap).filter(row => {
    return row.dieselQty > 0 || row.mechanicCost > 0 || row.challanBags > 0;
  });

  if (compiledVehicleConsolidatedReport.length === 0) {
    reportContainer.classList.add("hidden");
    reportEmpty.innerHTML = `<i class="fa-solid fa-folder-open"></i><p>No activity recorded in ${formatMonthDisplay(targetMonthYear)}.</p>`;
    reportEmpty.classList.remove("hidden");
    return;
  }

  // Grand totals
  let grandDieselQty = 0;
  let grandDieselCost = 0;
  let grandMechanic = 0;
  let grandChallanBags = 0;
  let grandChallanAmt = 0;

  compiledVehicleConsolidatedReport.forEach(row => {
    grandDieselQty += row.dieselQty;
    grandDieselCost += row.dieselCost;
    grandMechanic += row.mechanicCost;
    grandChallanBags += row.challanBags;
    grandChallanAmt += row.challanAmount;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-bold text-white">${escapeHTML(row.vehicleNumber)}</td>
      <td>${escapeHTML(row.vehicleType)}</td>
      <td class="text-right">${row.dieselQty.toLocaleString()} L</td>
      <td class="text-right">₹ ${row.dieselCost.toLocaleString('en-IN')}</td>
      <td class="text-right">₹ ${row.mechanicCost.toLocaleString('en-IN')}</td>
      <td class="text-right font-bold">${row.challanBags.toLocaleString()}</td>
      <td class="text-right font-bold text-white">₹ ${row.challanAmount.toLocaleString('en-IN')}</td>
    `;
    reportRows.appendChild(tr);
  });

  document.getElementById("vehicle-rep-display-month").innerText = formatMonthDisplay(targetMonthYear);
  document.getElementById("vehicle-rep-total-diesel").innerText = `${grandDieselQty.toLocaleString()} L`;
  document.getElementById("vehicle-rep-total-diesel-cost").innerText = `₹ ${grandDieselCost.toLocaleString('en-IN')}`;
  document.getElementById("vehicle-rep-total-mechanic").innerText = `₹ ${grandMechanic.toLocaleString('en-IN')}`;
  document.getElementById("vehicle-rep-total-challans").innerText = `₹ ${grandChallanAmt.toLocaleString('en-IN')}`;

  reportContainer.classList.remove("hidden");
}

function exportVehicleReportToCSV() {
  if (compiledVehicleConsolidatedReport.length === 0) {
    alert("Please compile consolidated report first.");
    return;
  }

  const filterMonth = document.getElementById("vehicle-report-month").value;
  const filterYear = document.getElementById("vehicle-report-year").value;
  const filename = `Vehicle_Consolidated_Report_${filterYear}_${filterMonth}.csv`;

  const headers = ["Vehicle Number", "Vehicle Type", "Total Diesel Qty (L)", "Total Diesel Cost (INR)", "Total Mechanic Cost (INR)", "Total Challan Bags", "Challan Amount (INR)"];
  const csvRows = [headers.join(",")];

  let sumDieselQty = 0;
  let sumDieselCost = 0;
  let sumMechanic = 0;
  let sumBags = 0;
  let sumAmt = 0;

  compiledVehicleConsolidatedReport.forEach(c => {
    sumDieselQty += c.dieselQty;
    sumDieselCost += c.dieselCost;
    sumMechanic += c.mechanicCost;
    sumBags += c.challanBags;
    sumAmt += c.challanAmount;

    const row = [
      `"${c.vehicleNumber.replace(/"/g, '""')}"`,
      `"${c.vehicleType.replace(/"/g, '""')}"`,
      c.dieselQty,
      c.dieselCost,
      c.mechanicCost,
      c.challanBags,
      c.challanAmount
    ];
    csvRows.push(row.join(","));
  });

  csvRows.push("");
  csvRows.push(`"GRAND TOTALS",,${sumDieselQty},${sumDieselCost},${sumMechanic},${sumBags},${sumAmt}`);

  const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// ========= DRIVER HISTORY AUDIT ===========
// ==========================================

let activeAuditTab = 'challans';

function switchAuditSubtab(subtabName) {
  activeAuditTab = subtabName;
  
  // Set tab buttons active
  document.querySelectorAll(".audit-subtab-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`audit-subtab-${subtabName}`);
  if (activeBtn) activeBtn.classList.add("active");

  // Show panel
  document.querySelectorAll(".audit-tab-content").forEach(pane => pane.classList.remove("active"));
  const activePane = document.getElementById(`audit-subpane-${subtabName}`);
  if (activePane) activePane.classList.add("active");
}

function retrieveDriverAuditLedger() {
  const driverName = document.getElementById("audit-select-driver").value;
  const resultsContainer = document.getElementById("audit-results-container");
  const emptyContainer = document.getElementById("audit-report-empty-container");

  const challansTable = document.getElementById("audit-challans-table-rows");
  const dieselTable = document.getElementById("audit-diesel-table-rows");
  const paymentsTable = document.getElementById("audit-payments-table-rows");

  if (!resultsContainer || !emptyContainer || !challansTable || !dieselTable || !paymentsTable) return;

  if (!driverName) {
    resultsContainer.classList.add("hidden");
    emptyContainer.innerHTML = `<i class="fa-solid fa-user-clock"></i><p>Select a driver profile above and click "Retrieve Audit History" to compile logs.</p>`;
    emptyContainer.classList.remove("hidden");
    return;
  }

  // Filter logs where driver name matches
  const targetDriverNameLower = driverName.toLowerCase();

  const driverChallans = challanList.filter(c => (c.driverName || '').toLowerCase() === targetDriverNameLower);
  const driverDiesel = dieselList.filter(d => (d.driverName || '').toLowerCase() === targetDriverNameLower);
  const driverPayments = driverList.filter(p => (p.driverName || '').toLowerCase() === targetDriverNameLower);

  if (driverChallans.length === 0 && driverDiesel.length === 0 && driverPayments.length === 0) {
    resultsContainer.classList.add("hidden");
    emptyContainer.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><p>No ledger activity logs found in system databases for "${escapeHTML(driverName)}".</p>`;
    emptyContainer.classList.remove("hidden");
    return;
  }

  emptyContainer.classList.add("hidden");

  // Render Challans
  challansTable.innerHTML = '';
  if (driverChallans.length === 0) {
    challansTable.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No consignment records driven by this operator.</td></tr>`;
  } else {
    driverChallans.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-white">${escapeHTML(c.challanNo)}</td>
        <td>${escapeHTML(c.dealerName)}</td>
        <td>${escapeHTML(c.vehicleNumber || '-')}</td>
        <td>${formatDate(c.date)}</td>
        <td class="text-right">${c.riceBags.toLocaleString()}</td>
        <td class="text-right">${c.wheatBags.toLocaleString()}</td>
        <td class="text-right font-bold">${c.totalBags.toLocaleString()}</td>
        <td class="text-right font-bold text-white">₹ ${c.calculatedAmount.toLocaleString('en-IN')}</td>
      `;
      challansTable.appendChild(tr);
    });
  }

  // Render Diesel
  dieselTable.innerHTML = '';
  if (driverDiesel.length === 0) {
    dieselTable.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No fuel tracker entries logged for this operator.</td></tr>`;
  } else {
    driverDiesel.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(d.vehicleNumber)}</td>
        <td class="text-right">${d.quantity.toLocaleString()} L</td>
        <td class="text-right">₹ ${d.rate.toLocaleString()}</td>
        <td class="text-right font-bold text-white">₹ ${d.amount.toLocaleString('en-IN')}</td>
        <td>${formatDate(d.date)}</td>
        <td>${escapeHTML(d.givenBy)}</td>
        <td>${escapeHTML(d.remarks || '-')}</td>
      `;
      dieselTable.appendChild(tr);
    });
  }

  // Render Payments
  paymentsTable.innerHTML = '';
  if (driverPayments.length === 0) {
    paymentsTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No advance cash or ledger payouts recorded.</td></tr>`;
  } else {
    driverPayments.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(p.vehicleNumber)}</td>
        <td class="text-right font-bold text-white">₹ ${p.amountGiven.toLocaleString('en-IN')}</td>
        <td>${formatDate(p.paymentDate)}</td>
        <td><span class="badge-status online">${escapeHTML(p.paymentType)}</span></td>
        <td>${escapeHTML(p.remarks || '-')}</td>
      `;
      paymentsTable.appendChild(tr);
    });
  }

  resultsContainer.classList.remove("hidden");
  switchAuditSubtab('challans');
}

