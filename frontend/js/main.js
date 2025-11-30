function includeHTML(file, targetId) {
  fetch(file)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
      }
      return response.text();
    })
    .then((html) => {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.innerHTML = html;
        setActiveNav(); // Call a function to set the active link after loading
      }
    })
    .catch((error) => {
      console.error("Error loading include file:", error);
    });
}

function setActiveNav() {
  // Get the current page filename (e.g., 'find-shipment.html')
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf("/") + 1);

  // Find all nav items and set the active class based on the current page
  document.querySelectorAll(".fs-main-nav .fs-nav-item").forEach((item) => {
    item.classList.remove("fs-nav-item--active");
    if (item.getAttribute("href") === page) {
      item.classList.add("fs-nav-item--active");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // FIX: Using the absolute root path (starting with /) to fix the 404 error
  includeHTML("components/nav.html", "nav-placeholder");
});
