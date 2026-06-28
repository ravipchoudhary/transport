// Global Shared Logistics Data Matrix (in Kilometers)
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
  initActiveNavHighlight();
  initHeaderScroll();
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

// Active navigation highlight based on current path
function initActiveNavHighlight() {
  const navLinks = document.querySelectorAll(".nav-link");
  const currentPath = window.location.pathname;

  navLinks.forEach(link => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    
    // Normalize path matches
    if (href === currentPath || 
        (currentPath === '/' && href === '/') || 
        (currentPath === '/index.html' && href === '/') ||
        (href === '/' && currentPath === '')) {
      link.classList.add("active");
    } else if (href !== '/' && (currentPath.includes(href) || currentPath.endsWith(href))) {
      link.classList.add("active");
    }
  });
}

// Header shrink on scroll
function initHeaderScroll() {
  const header = document.getElementById("site-header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.classList.add("header-scrolled");
      } else {
        header.classList.remove("header-scrolled");
      }
    });
  }
}
