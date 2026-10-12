'use strict';



/**
 * navbar toggle
 */

const navOpenBtn = document.querySelector("[data-nav-open-btn]");
const navbar = document.querySelector("[data-navbar]");
const navCloseBtn = document.querySelector("[data-nav-close-btn]");
const overlay = document.querySelector("[data-overlay]");

const elemArr = [navCloseBtn, overlay, navOpenBtn];

for (let i = 0; i < elemArr.length; i++) {
  elemArr[i].addEventListener("click", function () {
    navbar.classList.toggle("active");
    overlay.classList.toggle("active");
  });
}

/**
 * toggle navbar & overlay when click any navbar-link
 */

const navbarLinks = document.querySelectorAll("[data-navbar-link]");

for (let i = 0; i < navbarLinks.length; i++) {
  navbarLinks[i].addEventListener("click", function () {
    navbar.classList.toggle("active");
    overlay.classList.toggle("active");
  });
}

function copyNumber(number) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(number)
      .then(() => showToast("Copied: " + number))
      .catch(() => fallbackCopy(number));
  } else {
    fallbackCopy(number);
  }
}

function fallbackCopy(number) {
  const textarea = document.createElement("textarea");
  textarea.value = number;
  textarea.style.position = "fixed"; // prevent scrolling
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
    showToast("Copied: " + number);
  } catch {
    showToast("Copy failed");
  }

  document.body.removeChild(textarea);
}

function toggleDuties(dutiesId, button) {
  const duties = document.getElementById(dutiesId);

  if (!duties) {
    console.error("Services section not found:", dutiesId);
    return;
  }

  if (duties.hidden) {
    duties.hidden = false;
    button.textContent = "Hide Services";
  } else {
    duties.hidden = true;
    button.textContent = "Services";
  }
}

function openMap() {
  const mapOverlay = document.getElementById("mapOverlay");

  if (!mapOverlay) return;

  mapOverlay.classList.add("active");

  document.body.style.overflow = "hidden";
}


function closeMap() {
  const mapOverlay = document.getElementById("mapOverlay");

  if (!mapOverlay) return;

  mapOverlay.classList.remove("active");

  document.body.style.overflow = "";
}

const mapOverlay = document.getElementById("mapOverlay");

if (mapOverlay) {
  mapOverlay.addEventListener("click", function(event) {

    if (event.target === mapOverlay) {
      closeMap();
    }

  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000); // disappears after 2 seconds
}

const alertBtn = document.getElementById("alertBtn");
const alertPopup = document.getElementById("alertPopup");
const alertClose = document.getElementById("alertClose");

if (alertBtn && alertPopup) {

  // Open / close when clicking the bell
  alertBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    alertPopup.classList.toggle("active");
  });

  // Prevent clicks inside the popup from closing it
  alertPopup.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  // Close when clicking anywhere outside
  document.addEventListener("click", () => {
    alertPopup.classList.remove("active");
  });

}

function forceReload() {
  const url = new URL(window.location.href);

  // Add a unique timestamp to bypass page cache
  url.searchParams.set("_refresh", Date.now());

  window.location.href = url.toString();
}

/**
 * header & go-top-btn active
 * when window scroll down to 400px
 */

const header = document.querySelector("[data-header]");
const goTopBtn = document.querySelector("[data-go-top]");

window.addEventListener("scroll", function () {
  if (window.scrollY >= 400) {
    header.classList.add("active");
    goTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    goTopBtn.classList.remove("active");
  }
});
