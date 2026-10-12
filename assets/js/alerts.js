const siteAlerts = [
  {
    title: "Applications Open",
    message: "Applications are open for \nAccountants and Advertisers",
    copyLink: "https://forms.gle/pDzFazoo2Xqp1jNM8",
    linkText: "Click here to apply"
  },
  {
  title: "DoCL: Gun Store",
  message: "Time remaining:",
  countdown: "2026-09-22T23:59:00"
  },
  {
  title: "DoCL: Nightclub",
  message: "Time remaining:",
  countdown: "2026-10-08T23:59:00"
  },
];

function loadAlerts() {
  const alertList = document.getElementById("alertList");
  const alertBadge = document.getElementById("alertBadge");

  if (!alertList) return;

  alertList.innerHTML = "";

  siteAlerts.forEach(function(alert) {

    const item = document.createElement("div");
    item.className = "alert-message";


    // Alert title
    const title = document.createElement("strong");
    title.textContent = alert.title;

    item.appendChild(title);


    // Alert message
    if (alert.message) {
      const message = document.createElement("p");
      message.textContent = alert.message;

      item.appendChild(message);
    }


    // Countdown
    if (alert.countdown) {

      const countdown = document.createElement("div");

      countdown.className = "alert-countdown";
      countdown.setAttribute("data-target", alert.countdown);

      countdown.innerHTML = `
        <span class="countdown-days">00d</span>
        <span class="countdown-hours">00h</span>
        <span class="countdown-minutes">00m</span>
        <span class="countdown-seconds">00s</span>
      `;

      item.appendChild(countdown);
    }


    // Copy link button
    if (alert.copyLink) {

      const button = document.createElement("button");

      button.type = "button";
      button.className = "alert-link";
      button.textContent = alert.linkText || "Copy Link";

      button.addEventListener("click", function() {
        copyNumber(alert.copyLink);
      });

      item.appendChild(button);
    }


    alertList.appendChild(item);
  });


  // Badge
  if (alertBadge) {

    if (siteAlerts.length > 0) {

      alertBadge.textContent = siteAlerts.length;
      alertBadge.style.display = "flex";

    } else {

      alertBadge.style.display = "none";
    }
  }
}



function updateAlertCountdowns() {

  const countdowns =
    document.querySelectorAll(".alert-countdown");


  countdowns.forEach(function(countdown) {

    const targetString =
      countdown.getAttribute("data-target");

    const target =
      new Date(targetString).getTime();

    const now =
      new Date().getTime();

    const distance =
      target - now;


    // Invalid date
    if (isNaN(target)) {

      countdown.innerHTML =
        "<span>Invalid countdown date</span>";

      return;
    }


    function updateAlertBadge() {

      const alertBadge = document.getElementById("alertBadge");

      if (!alertBadge) return;

      const visibleAlerts =
        document.querySelectorAll(".alert-message").length;

      if (visibleAlerts > 0) {

        alertBadge.textContent = visibleAlerts;
        alertBadge.style.display = "flex";

      } else {

        alertBadge.style.display = "none";

      }
    }
    
    // Countdown finished
    if (distance <= 0) {

      const alertMessage = countdown.closest(".alert-message");

      if (alertMessage) {
        alertMessage.remove();
      }

      updateAlertBadge();

      return;
    }


    const days = Math.floor(
      distance / (1000 * 60 * 60 * 24)
    );


    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) /
      (1000 * 60 * 60)
    );


    const minutes = Math.floor(
      (distance % (1000 * 60 * 60)) /
      (1000 * 60)
    );


    const seconds = Math.floor(
      (distance % (1000 * 60)) /
      1000
    );


    const daysElement =
      countdown.querySelector(".countdown-days");

    const hoursElement =
      countdown.querySelector(".countdown-hours");

    const minutesElement =
      countdown.querySelector(".countdown-minutes");

    const secondsElement =
      countdown.querySelector(".countdown-seconds");


    if (daysElement) {
      daysElement.textContent = days + "d";
    }

    if (hoursElement) {
      hoursElement.textContent =
        String(hours).padStart(2, "0") + "h";
    }

    if (minutesElement) {
      minutesElement.textContent =
        String(minutes).padStart(2, "0") + "m";
    }

    if (secondsElement) {
      secondsElement.textContent =
        String(seconds).padStart(2, "0") + "s";
    }

  });

}



document.addEventListener(
  "DOMContentLoaded",
  function() {

    loadAlerts();

    updateAlertCountdowns();

    setInterval(
      updateAlertCountdowns,
      1000
    );

  }
);
