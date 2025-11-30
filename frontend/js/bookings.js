document.addEventListener("DOMContentLoaded", function () {
  const grid =
    document.getElementById("fsBookingsGrid") ||
    document.querySelector(".fs-card-grid--bookings");

  if (!grid) return;

  let raw = localStorage.getItem("user");
  if (!raw) {
    window.location.href = "index.html";
    return;
  }

  let currentUser;
  try {
    currentUser = JSON.parse(raw);
  } catch (e) {
    localStorage.removeItem("user");
    window.location.href = "index.html";
    return;
  }

   const currentUserId =
    (currentUser && currentUser.id) || currentUser.ID || "";

const currentUserCompID = (currentUser && currentUser.companyId) || "";

loadBookings(currentUserId, currentUserCompID, "all"); 
wireTabs(currentUserId, currentUserCompID);         

async function loadBookings(userId, compId, scope) {   
  try {
    let url;

    if (!compId || (!userId && scope !== "all")) {
        console.error(`Missing User/Company ID for scope: ${scope}`);
        grid.innerHTML = '<p class="fs-empty-state">Authentication error: Missing required Company/User ID.</p>';
        return; 
    }

    if (scope === "all") {
        url = `/bookings?scope=all&compId=${encodeURIComponent(compId)}`;
    } else {
        url = `/bookings?userId=${encodeURIComponent(userId)}&scope=${encodeURIComponent(scope)}&compId=${encodeURIComponent(compId)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load bookings");

    const data = await res.json();
    const list = data.bookings || [];
    renderBookings(list);
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="fs-empty-state">Could not load bookings. Please try again.</p>';
  }
  }

 // frontend/js/bookings.js (~ Line 56)

// New signature
function wireTabs(userId, compId) {
  const tabs = Array.from(document.querySelectorAll(".fs-toggle-tab"));
  if (tabs.length < 3) return;

  const scopes = ["all", "buyer", "seller"];

  tabs.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("fs-toggle-tab--active"));
      btn.classList.add("fs-toggle-tab--active");
      
      // Pass the compId
      loadBookings(userId, compId, scopes[idx] || "all"); 
    });
  });
}

  function renderBookings(list) {
    if (list && list.length) {
      list.forEach((b) => {
        grid.appendChild(buildBookingCard(b));
      });
    } else {
    }

    const stats = calculateBookingStats(list);
    updateStatsDisplay(stats);
  }

  function calculateBookingStats(bookings) {
    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      buyer: 0,
      seller: 0,
    };

    if (!bookings || bookings.length === 0) {
      return stats;
    }

    stats.total = bookings.length;

    bookings.forEach((b) => {
      const status = (b.Status || "").toLowerCase().trim();

      if (status === "pending" || status === "pending admin approval") {
        stats.pending++;
      } else if (status === "confirmed") {
        stats.confirmed++;
      } else if (status === "completed") {
        stats.completed++;
      }
    });

    return stats;
  }

  function updateStatsDisplay(stats) {
    const totalEl =
      document.querySelector(".fs-stat-card .fs-stat-value") ||
      document.querySelector(".fs-stat-card:nth-child(1) .fs-stat-value");
    const pendingEl = document.querySelector(
      ".fs-stat-card:nth-child(2) .fs-stat-value"
    );
    const confirmedEl = document.querySelector(
      ".fs-stat-card:nth-child(3) .fs-stat-value"
    );
    const completedEl = document.querySelector(
      ".fs-stat-card:nth-child(4) .fs-stat-value"
    );

    if (totalEl) totalEl.textContent = stats.total;
    if (pendingEl) pendingEl.textContent = stats.pending;
    if (confirmedEl) confirmedEl.textContent = stats.confirmed;
    if (completedEl) completedEl.textContent = stats.completed;

    const allTab = document.querySelector(".fs-toggle-tab:first-child");
    if (allTab) {
      allTab.textContent = `All Bookings (${stats.total})`;
    }
  }

  function buildBookingCard(b) {
    const rawType = (b.Type || "truck").toString();
    const typeLower = rawType.toLowerCase();

    let typeClass = "fs-badge--type-truck";
    if (typeLower === "ship") typeClass = "fs-badge--type-ship";
    else if (typeLower === "plane" || typeLower === "air")
      typeClass = "fs-badge--type-plane";

    const statusText = (b.Status || "Pending").toString().trim();
    const statusLower = statusText.toLowerCase();

    let statusClass = "fs-badge--status-generic";

    if (statusLower === "confirmed") statusClass = "fs-badge--status-confirmed";
    else if (statusLower === "completed")
      statusClass = "fs-badge--status-completed";
    else if (statusLower === "rejected")
      statusClass = "fs-badge--status-rejected";
    else if (statusLower === "canceled" || statusLower === "cancelled")
      statusClass = "fs-badge--status-cancelled";
    else if (statusLower === "pending admin approval")
      statusClass = "fs-badge--status-approval";
    else if (statusLower === "pending")
      statusClass = "fs-badge--status-pending";

    const origin = b.Origin || "";
    const destination = b.Destination || "";

    const wLine = formatSpaceLine(b.EmptySpaceW, b.UnitW);
    const aLine = formatSpaceLine(b.EmptySpaceA, b.UnitA);

    // Assuming DepDate comes from the Space table, which is joined in the backend.
    const deptDate = b.DepDate || "";

    const price = pickPrice(b.SpacePrice, b.BidPrice);
    const priceText = price ? `$${price}` : "—";

    const bookId = b.BookID || "—";
    // This will now use the CompName alias from the backend query
    const compName = b.CompName || "—";

    const card = document.createElement("article");
    card.className = "fs-result-card fs-booking-card";

    card.innerHTML = `
      <div class="fs-booking-top">
        <div class="fs-card-badges">
          <span class="fs-badge ${typeClass}">${escapeHtml(rawType)}</span>
          <span class="fs-badge fs-badge--booking-status ${statusClass}">${escapeHtml(
      statusText
    )}</span>
        </div>

        <div class="fs-booking-id">
          <div class="fs-booking-id-label">Booking ID</div>
          <div class="fs-booking-id-value">${escapeHtml(bookId)}</div>
        </div>
      </div>

      <div class="fs-card-route">
        <div class="fs-card-route-icon">
          <img src="assets/icons/location.svg" class="fs-card-icon" alt="" />
        </div>
        <div class="fs-card-route-text">
          <div class="fs-card-city">${escapeHtml(origin)}</div>
          <div class="fs-card-city fs-card-route-text">
            <span>→ ${escapeHtml(destination)}</span>
          </div>
        </div>
      </div>

      <div class="fs-booking-meta">
        <div class="fs-booking-meta-item">
          <div class="fs-booking-meta-label">
            <img src="assets/icons/box.svg" class="fs-card-icon" alt="" />
            <span>Space</span>
          </div>
          <div class="fs-booking-meta-value">
            <div class="fs-booking-space-lines">
              <div>${escapeHtml(wLine)}</div>
              <div>${escapeHtml(aLine)}</div>
            </div>
          </div>
        </div>

        <div class="fs-booking-meta-item">
          <div class="fs-booking-meta-label">
            <img src="assets/icons/calendar.svg" class="fs-card-icon" alt="" />
            <span>Date</span>
          </div>
          <div class="fs-booking-meta-value">${escapeHtml(deptDate)}</div>
        </div>

        <div class="fs-booking-meta-item">
          <div class="fs-booking-meta-label">
            <span>Price</span>
          </div>
          <div class="fs-booking-meta-value">
            <span class="fs-card-price">${escapeHtml(priceText)}</span>
          </div>
        </div>
      </div>

      <div class="fs-booking-footer">
        <span class="fs-card-company">${escapeHtml(compName)}</span>
        <button type="button" class="fs-booking-view-btn">View Details</button>
      </div>
    `;

    // For now: button does nothing (as requested)
    const btn = card.querySelector(".fs-booking-view-btn");
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
    }

    return card;
  }

  function pickPrice(spacePrice, bidPrice) {
    // Treat 0 / 0.00 / "0" as empty, so we can fall back to BidPrice
    const s = normalizeNullable(spacePrice, true);
    if (s !== "") return s;

    const b = normalizeNullable(bidPrice, true);
    return b !== "" ? b : "";
  }

  function normalizeNullable(v, treatZeroAsEmpty) {
    treatZeroAsEmpty = !!treatZeroAsEmpty;

    if (v == null) return "";
    const t = String(v).trim();
    if (!t) return "";
    if (t.toLowerCase() === "null") return "";

    if (treatZeroAsEmpty) {
      const num = Number(t);
      if (!isNaN(num) && num <= 0) {
        // Consider 0, 0.0, 0.00, -1, etc. as "empty" for price logic
        return "";
      }
    }

    return t;
  }

  function formatSpaceLine(val, unit) {
    const v = normalizeNullable(val);
    const u = normalizeNullable(unit);
    if (!v && !u) return "—";
    return `${v} ${u}`.trim();
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
