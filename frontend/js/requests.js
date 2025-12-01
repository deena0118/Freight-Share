document.addEventListener("DOMContentLoaded", function () {
  const grid =
    document.getElementById("fsBookingsGrid") ||
    document.querySelector(".fs-card-grid--bookings");

  const modal = document.getElementById("fsShipmentModal");
  const modalClose = document.getElementById("fsModalClose");

  const modalTypeChip = document.getElementById("fsModalTypeChip");
  const modalOrigin = document.getElementById("fsModalOrigin");
  const modalDestination = document.getElementById("fsModalDestination");
  const modalAvailableSpace = document.getElementById("fsModalAvailableSpace");
  const modalDepartureDate = document.getElementById("fsModalDepartureDate");
  const modalCargo = document.getElementById("fsModalCargo");
  const modalCompanyName = document.getElementById("fsModalCompanyName");
  const modalCompanyDesc = document.getElementById("fsModalCompanyDesc");
  const modalTotalPrice = document.getElementById("fsModalTotalPrice");
  const modalStatusBadge = document.getElementById("fsModalStatusBadge");
  const modalSellerRevenue = document.getElementById("fsModalSellerRevenue");
  const modalServiceFee = document.getElementById("fsModalServiceFee");

  const modalActionsWrap = document.getElementById("fsModalActions");
  const approveBtn = document.getElementById("fsModalApproveBtn");
  const rejectBtn = document.getElementById("fsModalRejectBtn");

  const modalFixedBlock = document.getElementById("fsModalFixedBlock");
  const modalBidBlock = document.getElementById("fsModalBidBlock");
  const partialToggle = document.getElementById("fsPartialToggle");
  const partialBox = document.getElementById("fsPartialBox");
const reqTotalEl = document.getElementById("fsReqTotal");

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

  const currentUserId = String((currentUser && (currentUser.id || currentUser.ID)) || "").trim();
  const currentUserCompID = String((currentUser && (currentUser.companyId || currentUser.CompID || currentUser.compId)) || "").trim();

  if (!currentUserId || !currentUserCompID) {
    grid.innerHTML = '<p class="fs-empty-state">Authentication error: Missing user/company.</p>';
    return;
  }

  let currentUserType = String((currentUser && (currentUser.type || currentUser.Type)) || "").trim();
  let allBookings = [];
  let activeBooking = null;

  bindModalBaseEvents();
  bindActionButtons();

  (async function init() {
    await hydrateUserType();
    await loadRequests();
  })();

  async function hydrateUserType() {
    if (currentUserType) return;
    try {
      const res = await fetch(`/users/${encodeURIComponent(currentUserId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const t = data && data.user && data.user.Type;
      if (t) currentUserType = String(t).trim();
    } catch (e) {}
  }

  function isAdminOrSub() {
    const t = String(currentUserType || "").toLowerCase().trim();
    return t === "admin" || t === "subadmin";
  }

 async function loadRequests() {
  try {
    const url = `/booking-requests?compId=${encodeURIComponent(currentUserCompID)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load requests");

    const data = await res.json();

    // Update Total Requests = Space(Pending Admin Approval) + Booking(Pending Admin Approval)
    const total =
      data && data.counts && typeof data.counts.totalRequests === "number"
        ? data.counts.totalRequests
        : 0;

    if (reqTotalEl) reqTotalEl.textContent = String(total);

    allBookings = (data && data.bookings) || [];
    renderBookings(allBookings);
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="fs-empty-state">Could not load requests. Please try again.</p>';
    if (reqTotalEl) reqTotalEl.textContent = "0";
  }
}


  function renderBookings(list) {
    grid.innerHTML = "";
    if (!list || list.length === 0) {
      grid.innerHTML = '<p class="fs-empty-state">No requests found.</p>';
      return;
    }
    list.forEach((b) => grid.appendChild(buildBookingCard(b)));
  }

  function buildBookingCard(b) {
    const rawType = String(b.Type || "truck");
    const typeLower = rawType.toLowerCase();

    let typeClass = "fs-badge--type-truck";
    if (typeLower === "ship") typeClass = "fs-badge--type-ship";
    else if (typeLower === "plane" || typeLower === "air") typeClass = "fs-badge--type-plane";

    const statusText = String(b.Status || "Pending Admin Approval").trim();
    const statusLower = statusText.toLowerCase().trim();

    let statusClass = "fs-badge--status-generic";
    if (statusLower === "pending admin approval") statusClass = "fs-badge--status-approval";
    else if (statusLower === "pending") statusClass = "fs-badge--status-pending";
    else if (statusLower === "rejected") statusClass = "fs-badge--status-rejected";
    else if (statusLower === "confirmed") statusClass = "fs-badge--status-confirmed";
    else if (statusLower === "completed") statusClass = "fs-badge--status-completed";
    else if (statusLower === "canceled" || statusLower === "cancelled") statusClass = "fs-badge--status-cancelled";

    const origin = b.Origin || "";
    const destination = b.Destination || "";

    const wLine = formatSpaceLine(b.EmptySpaceW, b.UnitW);
    const aLine = formatSpaceLine(b.EmptySpaceA, b.UnitA);

    const deptDate = b.DepDate || "";

    const price = pickPrice(b.SpacePrice, b.BidPrice);
    const priceText = price ? `$${price}` : "—";

    const bookId = b.BookID || "—";
    const compName = b.CompName || "—";

    const card = document.createElement("article");
    card.className = "fs-result-card fs-booking-card";

    card.innerHTML = `
      <div class="fs-booking-top">
        <div class="fs-card-badges">
          <span class="fs-badge ${typeClass}">${escapeHtml(rawType)}</span>
          <span class="fs-badge fs-badge--booking-status ${statusClass}">${escapeHtml(statusText)}</span>
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
          <div class="fs-booking-meta-label"><span>Price</span></div>
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

    card.addEventListener("click", function () {
      openBookingModal(b);
    });

    const btn = card.querySelector(".fs-booking-view-btn");
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openBookingModal(b);
      });
    }

    return card;
  }

  function openBookingModal(b) {
    if (!modal) return;
    activeBooking = b;

    const rawType = String(b.Type || "truck");
    const origin = b.Origin || "";
    const destination = b.Destination || "";

    const wLine = formatSpaceLine(b.EmptySpaceW, b.UnitW);
    const aLine = formatSpaceLine(b.EmptySpaceA, b.UnitA);
    const availableText = `${wLine}, ${aLine}`.replace(/^—,\s*—$/, "—");

    if (modalOrigin) modalOrigin.textContent = origin || "—";
    if (modalDestination) modalDestination.textContent = destination || "—";
    if (modalAvailableSpace) modalAvailableSpace.textContent = availableText;
    if (modalDepartureDate) modalDepartureDate.textContent = b.DepDate || "—";
    if (modalCargo) modalCargo.textContent = b.Restriction || "—";

    if (modalTypeChip) {
      modalTypeChip.className = "fs-badge";
      const tl = rawType.toLowerCase();
      if (tl === "truck") modalTypeChip.classList.add("fs-badge--type-truck");
      else if (tl === "ship") modalTypeChip.classList.add("fs-badge--type-ship");
      else if (tl === "plane" || tl === "air") modalTypeChip.classList.add("fs-badge--type-plane");
      modalTypeChip.textContent = rawType;
    }

    const priceStr = pickPrice(b.SpacePrice, b.BidPrice);
    const total = Number(priceStr);

    if (!priceStr || isNaN(total) || total <= 0) {
      if (modalTotalPrice) modalTotalPrice.textContent = "—";
      if (modalSellerRevenue) modalSellerRevenue.textContent = "—";
      if (modalServiceFee) modalServiceFee.textContent = "—";
    } else {
      if (modalTotalPrice) modalTotalPrice.textContent = `$${total.toFixed(2)}`;
      if (modalSellerRevenue) modalSellerRevenue.textContent = `$${(total * 0.95).toFixed(2)}`;
      if (modalServiceFee) modalServiceFee.textContent = `$${(total * 0.05).toFixed(2)}`;
    }

    if (modalStatusBadge) modalStatusBadge.textContent = String(b.Status || "—");

    const buyerCompId = String(b.BuyerCompID || "");
    const isBuyer = buyerCompId && buyerCompId === currentUserCompID;

    const companyName = isBuyer ? (b.SpaceCompName || b.CompName || "—") : (b.BuyerCompName || "—");
    const companyDesc = isBuyer ? (b.SpaceCompDesc || "—") : (b.BuyerCompDesc || "—");

    if (modalCompanyName) modalCompanyName.textContent = companyName;
    if (modalCompanyDesc) modalCompanyDesc.textContent = companyDesc;

    if (modalBidBlock) modalBidBlock.style.display = "none";
    if (modalFixedBlock) modalFixedBlock.style.display = "block";
    if (partialToggle) partialToggle.style.display = "none";
    if (partialBox) partialBox.style.display = "none";

    updateModalButtonsVisibility(b);

    modal.classList.remove("fs-modal--hidden");
  }

  function hideAllModalButtons() {
    if (modalActionsWrap) modalActionsWrap.style.display = "none";
    if (approveBtn) approveBtn.style.display = "none";
    if (rejectBtn) rejectBtn.style.display = "none";
  }

  function updateModalButtonsVisibility(b) {
    hideAllModalButtons();

    const statusLower = String(b.Status || "").toLowerCase().trim();
    if (statusLower !== "pending admin approval") return;

    if (!isAdminOrSub()) return;

    const spaceCompId = String(b.SpaceCompID || b.CompID || "");
    if (spaceCompId !== currentUserCompID) return;

    if (modalActionsWrap) modalActionsWrap.style.display = "flex";
    if (approveBtn) approveBtn.style.display = "inline-flex";
    if (rejectBtn) rejectBtn.style.display = "inline-flex";
  }

  function bindActionButtons() {
    if (approveBtn) {
      approveBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!activeBooking) return;
        const id = String(activeBooking.BookID || "");
        const ok = window.confirm(`Are you sure you want to approve Booking ID: ${id}`);
        if (!ok) return;
        await setRequestStatus(id, "Pending");
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!activeBooking) return;
        const id = String(activeBooking.BookID || "");
        const ok = window.confirm(`Are you sure you want to reject Booking ID: ${id}`);
        if (!ok) return;
        await setRequestStatus(id, "Rejected");
      });
    }
  }

  async function setRequestStatus(bookId, status) {
    try {
      const res = await fetch(`/booking-requests/${encodeURIComponent(bookId)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status,
          actorUserId: currentUserId,
          actorCompId: currentUserCompID
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data && data.error) || "Failed to update request.");
        return;
      }

      const keepId = bookId;
      await loadRequests();

      const updated = (allBookings || []).find((x) => String(x.BookID || "") === String(keepId));
      if (updated) openBookingModal(updated);
      else {
        if (modal) modal.classList.add("fs-modal--hidden");
        activeBooking = null;
        hideAllModalButtons();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update request.");
    }
  }

  function bindModalBaseEvents() {
    function closeModal() {
      if (modal) modal.classList.add("fs-modal--hidden");
      activeBooking = null;
      hideAllModalButtons();
    }

    if (modalClose) modalClose.addEventListener("click", closeModal);

    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }
  }

  function pickPrice(spacePrice, bidPrice) {
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
      if (!isNaN(num) && num <= 0) return "";
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
