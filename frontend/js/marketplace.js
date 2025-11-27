document.addEventListener("DOMContentLoaded", function () {

  // ----------------- AUTH / PROFILE -----------------
  let raw = localStorage.getItem("user");
  if (!raw) {
    window.location.href = "index.html";
    return;
  }

  let user;
  try {
    user = JSON.parse(raw);
  } catch (e) {
    console.error("Could not parse stored user", e);
    localStorage.removeItem("user");
    window.location.href = "index.html";
    return;
  }

  window.fsCurrentUser = user;

  const profileContainer = document.querySelector(".fs-profile");
  const iconButton = profileContainer
    ? profileContainer.querySelector(".fs-profile-icon")
    : null;
  const nameEl = document.getElementById("fsProfileName");
  const companyEl = document.getElementById("fsProfileCompany");
  const logoutBtn = document.getElementById("fsProfileLogout");

  const userName =
    user.Name || user.name || user.Email || user.email || "User";
  const companyName =
    user.CompanyName ||
    user.companyName ||
    user.CompName ||
    user.compName ||
    "—";
  const userId = user.ID || user.Id || user.id || "";

  if (iconButton) {
    const initial = userName.trim().charAt(0).toUpperCase() || "U";
    iconButton.textContent = initial;
    iconButton.dataset.userId = userId;
  }

  if (nameEl) nameEl.textContent = userName;
  if (companyEl) companyEl.textContent = companyName;

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }

  // ----------------- LIVE FEED -----------------

  const FEED_SELECTOR = ".fs-feed-list";

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function mapTypeToIcon(typeRaw) {
    const t = (typeRaw || "").toLowerCase();

    if (t === "truck") {
      return { icon: "assets/icons/truck.svg", label: "Truck" };
    }
    if (t === "ship") {
      return { icon: "assets/icons/ship.svg", label: "Ship" };
    }
    if (t === "air" || t === "plane") {
      return { icon: "assets/icons/plane.svg", label: "Plane" };
    }

    return { icon: "assets/icons/box.svg", label: typeRaw || "Listing" };
  }

  function formatPrice(space) {
    if (space.Price != null && space.Price !== "") {
      return "$" + space.Price;
    }
    if ((space.PriceType || "").toLowerCase() === "bids") {
      return "Request bids";
    }
    return "—";
  }

  function formatWeight(space) {
    const val = space.EmptySpaceW;
    const unit = space.UnitW || space.Unit; // fallback if you ever use Unit
    if (val == null || val === "" || !unit) {
      return "—";
    }
    return String(val) + " " + String(unit);
  }

  function sortByLatestDateTime(spaces) {
    return spaces.slice().sort(function (a, b) {
      const aKey = (a.DepDate || "") + " " + (a.DepTime || "");
      const bKey = (b.DepDate || "") + " " + (b.DepTime || "");
      // latest first
      return bKey.localeCompare(aKey);
    });
  }

  function renderFeed(spaces) {
    const list = document.querySelector(FEED_SELECTOR);
    if (!list) return;

    list.innerHTML = "";

    if (!spaces || spaces.length === 0) {
      const empty = document.createElement("div");
      empty.className = "fs-feed-empty";
      empty.textContent = "No live listings yet.";
      list.appendChild(empty);
      return;
    }

    spaces.forEach(function (space) {
      const origin = escapeHtml(space.Origin || "—");
      const destination = escapeHtml(space.Destination || "—");
      const date = escapeHtml(space.DepDate || "—");
      const priceText = escapeHtml(formatPrice(space));
      const weightText = escapeHtml(formatWeight(space));

      const badge = mapTypeToIcon(space.Type);

      const item = document.createElement("div");
      item.className = "fs-feed-item";

      item.innerHTML =
        '<div class="fs-feed-item-header">' +
        '  <div class="fs-feed-type">' +
        '    <img src="' + badge.icon + '" class="fs-feed-type-icon" />' +
        '    <span>' + badge.label + '</span>' +
        '  </div>' +
        '  <span class="fs-feed-price">' + priceText + '</span>' +
        '</div>' +
        '<div class="fs-feed-body">' +
        '  <div class="fs-feed-location">' +
        '    <img src="assets/icons/location.svg" class="fs-feed-loc-icon" />' +
        '    <div>' +
        '      <div>' + origin + '</div>' +
        '      <div class="fs-feed-arrow">↓</div>' +
        '      <div>' + destination + '</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="fs-feed-meta">' +
        '    <span>' + weightText + '</span>' +
        '    <span>' + date + '</span>' +
        '  </div>' +
        '</div>';

      list.appendChild(item);
    });
  }

  async function loadLiveFeed() {
    const list = document.querySelector(FEED_SELECTOR);
    if (!list) return;

    list.innerHTML = '<div class="fs-feed-loading">Loading…</div>';

    try {
      const res = await fetch("/shipments");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load live feed.");
      }

      let spaces = Array.isArray(data.spaces) ? data.spaces : [];
const listingsEl = document.getElementById("fsStatListingsCount");
if (listingsEl) {
  listingsEl.textContent = String(spaces.length);
}

      spaces = sortByLatestDateTime(spaces).slice(0, 4);

      renderFeed(spaces);
    } catch (err) {
      console.error("Error loading live feed:", err);
      list.innerHTML =
        '<div class="fs-feed-error">Could not load live feed.</div>';
    }
  }

  loadLiveFeed();
});
