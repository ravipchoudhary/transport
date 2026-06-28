// --- Fleet Showcase Slider Scripts ---

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

document.addEventListener("DOMContentLoaded", () => {
  updateFleetImage(); // Initialize slider on load
});

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
