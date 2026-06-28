// --- Booking Page Scripts ---

document.addEventListener("DOMContentLoaded", () => {
  setDefaultBookingDate();
  checkSessionEstimates();
});

// Set requested date to tomorrow by default
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

// Auto-fill form if client sent estimate details from tools page
function checkSessionEstimates() {
  const storedEstimate = sessionStorage.getItem("pendingBookingEstimate");
  if (storedEstimate) {
    try {
      const data = JSON.parse(storedEstimate);
      const bookOrigin = document.getElementById("book-origin");
      const bookDestination = document.getElementById("book-destination");
      const bookWeight = document.getElementById("book-weight");

      if (bookOrigin && data.origin) bookOrigin.value = data.origin;
      if (bookDestination && data.destination) bookDestination.value = data.destination;
      if (bookWeight && data.weight) bookWeight.value = data.weight;

      // Clean up session storage after read
      sessionStorage.removeItem("pendingBookingEstimate");
    } catch (e) {
      console.error("Error restoring session booking data: ", e);
    }
  }
}

// Handle Form submit and generate simulated invoice details
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

    // Calculate simulated price using globally shared data
    let origCode = 'del', destCode = 'bom';
    for (const [code, name] of Object.entries(cityNames)) {
      if (name.toLowerCase() === origin.toLowerCase()) origCode = code;
      if (name.toLowerCase() === destination.toLowerCase()) destCode = code;
    }

    const dist = distanceMatrix[origCode][destCode] || 800;
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
