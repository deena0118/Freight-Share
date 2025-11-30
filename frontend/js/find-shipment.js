document.addEventListener("DOMContentLoaded", function () {
  const originInput = document.getElementById("filterOrigin");
  const destinationInput = document.getElementById("filterDestination");
  const typeSelect = document.getElementById("filterType");
  const sortSelect = document.getElementById("sortSelect");
  const applyFiltersBtn = document.getElementById("applyFilters");
  const resultsGrid = document.getElementById("fsResultsGrid");
  const resultsCount = document.getElementById("resultsCount");

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
  const modalFixedBlock = document.getElementById("fsModalFixedBlock");
  const modalBidBlock = document.getElementById("fsModalBidBlock");
  const partialToggle = document.getElementById("fsPartialToggle");
  const partialBox = document.getElementById("fsPartialBox");
  const partialPercentInput = document.getElementById("fsPartialPercent");
  const partialError = document.getElementById("fsPartialError");
  const bidAmountInput = document.getElementById("fsModalBidAmount");
  const bidPartialToggle = document.getElementById("fsBidPartialToggle");
  const bidPartialBox = document.getElementById("fsBidPartialBox");
  const bidPartialPercentInput = document.getElementById("fsBidPartialPercent");
  const bidPartialError = document.getElementById("fsBidPartialError");

  const bidTotalsBlock = document.getElementById("fsBidTotals");
  const bidTotalPriceEl = document.getElementById("fsBidTotalPrice");
  const bidSellerRevenueEl = document.getElementById("fsBidSellerRevenue");
  const bidServiceFeeEl = document.getElementById("fsBidServiceFee");

  // Booking
  const bookBtn =
    document.getElementById("fsModalBookBtn") ||
    document.getElementById("bookBtn") ||
    document.querySelector("[data-fs-book]");

  let activeSpace = null; // the Space row currently open in the modal

  let baseFixedTotal = null;
  function renderBidTotals(total) {
    if (!bidTotalsBlock) return;

    const safeTotal = Number(total);

    if (total == null || isNaN(safeTotal)) {
      bidTotalsBlock.style.display = "none";
      if (bidTotalPriceEl) bidTotalPriceEl.textContent = "—";
      if (bidSellerRevenueEl) bidSellerRevenueEl.textContent = "—";
      if (bidServiceFeeEl) bidServiceFeeEl.textContent = "—";
      return;
    }

    bidTotalsBlock.style.display = "block";
    if (bidTotalPriceEl)
      bidTotalPriceEl.textContent = `$${safeTotal.toFixed(2)}`;
    if (bidSellerRevenueEl)
      bidSellerRevenueEl.textContent = `$${(safeTotal * 0.95).toFixed(2)}`;
    if (bidServiceFeeEl)
      bidServiceFeeEl.textContent = `$${(safeTotal * 0.05).toFixed(2)}`;
  }

  function recomputeBidTotals() {
    if (!bidAmountInput) return;

    const rawBid = bidAmountInput.value.trim();
    const bidValue = Number(rawBid);

    // Wait until user enters a valid bid
    if (!rawBid || isNaN(bidValue) || bidValue <= 0) {
      if (bidPartialError) bidPartialError.style.display = "none";
      renderBidTotals(null);
      return;
    }

    // If partial box is closed -> full bid totals
    if (!bidPartialBox || bidPartialBox.style.display === "none") {
      if (bidPartialError) bidPartialError.style.display = "none";
      renderBidTotals(bidValue);
      return;
    }

    const rawPct = (
      bidPartialPercentInput ? bidPartialPercentInput.value : ""
    ).trim();

    // If % empty -> full bid totals
    if (!rawPct) {
      if (bidPartialError) bidPartialError.style.display = "none";
      renderBidTotals(bidValue);
      return;
    }

    const pct = Number(rawPct);

    if (isNaN(pct) || pct < 1 || pct > 99) {
      if (bidPartialError) bidPartialError.style.display = "block";
      renderBidTotals(bidValue); // fallback to full bid
      return;
    }

    if (bidPartialError) bidPartialError.style.display = "none";
    renderBidTotals(bidValue * (pct / 100));
  }

  let allSpaces = [];

  async function loadSpaces() {
    try {
      const res = await fetch("/shipments");
      if (!res.ok) throw new Error("Failed to load shipments");

      const data = await res.json();
      allSpaces = data.spaces || [];

      applyFilters();
    } catch (err) {
      console.error(err);
      resultsGrid.innerHTML =
        '<p class="fs-empty-state">Could not load shipments. Please try again.</p>';
      resultsCount.textContent = "0 shipments";
    }
  }

  function applyFilters() {
    let filtered = [...allSpaces];

    const origin = originInput.value.trim().toLowerCase();
    const destination = destinationInput.value.trim().toLowerCase();
    const type = typeSelect.value;

    if (origin) {
      filtered = filtered.filter((item) => {
        const v = (item.Origin || item.Origion || "").toLowerCase();
        return v.includes(origin);
      });
    }

    if (destination) {
      filtered = filtered.filter((item) => {
        const v = (item.Destination || "").toLowerCase();
        return v.includes(destination);
      });
    }

    if (type !== "all") {
      filtered = filtered.filter((item) => {
        const v = (item.Type || "").toLowerCase();
        return v === type.toLowerCase();
      });
    }

    const sort = sortSelect.value;
    if (sort === "priceLow" || sort === "priceHigh") {
      filtered.sort((a, b) => {
        const pa = getNumericPrice(a);
        const pb = getNumericPrice(b);
        if (isNaN(pa) || isNaN(pb)) return 0;
        return sort === "priceLow" ? pa - pb : pb - pa;
      });
    } else if (sort === "date") {
      filtered.sort((a, b) => {
        const da = new Date(a.DepDate || 0).getTime();
        const db = new Date(b.DepDate || 0).getTime();
        return da - db;
      });
    }

    renderCards(filtered);
  }

  function getNumericPrice(item) {
    if ((item.PriceType || "").toLowerCase() !== "fixed") return NaN;
    const n = Number(item.Price);
    return isNaN(n) ? NaN : n;
  }

  function renderCards(list) {
    resultsGrid.innerHTML = "";

    if (!list || list.length === 0) {
      resultsGrid.innerHTML =
        '<p class="fs-empty-state">No shipments match your filters.</p>';
      resultsCount.textContent = "0 shipments";
      return;
    }

    list.forEach((space) => {
      resultsGrid.appendChild(buildCard(space));
    });

    resultsCount.textContent =
      list.length === 1 ? "1 shipment found" : `${list.length} shipments found`;
  }

  function buildCard(space) {
    const rawType = (space.Type || "truck").toString();
    const typeLower = rawType.toLowerCase();

    let typeClass = "fs-badge--type-truck";
    if (typeLower === "ship") typeClass = "fs-badge--type-ship";
    else if (typeLower === "plane" || typeLower === "air")
      typeClass = "fs-badge--type-plane";

    const origin = space.Origin || space.Origion || "";
    const destination = space.Destination || "";
    const depDate = space.DepDate || "";

    const emptySpaceW = space.EmptySpaceW;
    const unitW = space.UnitW || "";
    const emptySpaceA = space.EmptySpaceA;
    const unitA = space.UnitA || "";

    const hasSpace = (!!emptySpaceW && !!unitW) || (!!emptySpaceA && !!unitA);

    const availableText = hasSpace
      ? `Available Space: ${emptySpaceW || ""} ${unitW}, ${
          emptySpaceA || ""
        } ${unitA}`
      : "Available Space";

    const priceType = (space.PriceType || "").toLowerCase();
    const priceValue = space.Price;

    let priceHtml;
    if (priceType === "fixed") {
      priceHtml = `<span class="fs-card-price">$${escapeHtml(
        priceValue
      )}</span>`;
    } else if (priceType === "bids") {
      priceHtml = `<span class="fs-card-price fs-card-price--bid">Bid</span>`;
    } else {
      priceHtml = `<span class="fs-card-price fs-card-price--na">N/A</span>`;
    }

    const companyName = space.CompName || "Swift Logistics";

    const card = document.createElement("article");
    card.className = "fs-result-card";

    card.innerHTML = `
      <div class="fs-card-top">
        <div class="fs-card-badges">
          <span class="fs-badge ${typeClass}">${escapeHtml(rawType)}</span>
          <span class="fs-badge fs-badge--available">Available</span>
        </div>
        ${priceHtml}
      </div>

      <div class="fs-card-route">
        <div class="fs-card-route-icon">
          <img src="assets/icons/location.svg" class="fs-card-icon" alt="" />
        </div>
        <div class="fs-card-route-text">
          <div class="fs-card-city ">
            ${escapeHtml(origin)}
          </div>
          <div class="fs-card-city fs-card-route-text">
            <span>→ ${escapeHtml(destination)}</span>
          </div>
        </div>
      </div>

      <div class="fs-card-meta">
        <div class="fs-card-meta-row">
          <img src="assets/icons/box.svg" class="fs-card-icon" alt="" />
          <span>${escapeHtml(availableText)}</span>
        </div>
        <div class="fs-card-meta-row" style="margin-top:3%;">
          <img src="assets/icons/calendar.svg" class="fs-card-icon" alt="" />
          <span>${escapeHtml(depDate)}</span>
        </div>
      </div>

      <div class="fs-card-footer">
        <span class="fs-card-company">${escapeHtml(companyName)}</span>
        <span class="fs-card-rating">
          <span class="fs-card-star">★</span>
          4.8
        </span>
      </div>
    `;

    // open details modal on click
    card.addEventListener("click", function () {
      openDetailsModal(space);
    });

    return card;
  }

  function openDetailsModal(space) {
    if (!modal) return;
    activeSpace = space;

    const rawType = (space.Type || "truck").toString();
    const origin = space.Origin || space.Origion || "";
    const destination = space.Destination || "";
    const depDate = space.DepDate || "";

    const emptySpaceW = space.EmptySpaceW;
    const unitW = space.UnitW || "";
    const emptySpaceA = space.EmptySpaceA;
    const unitA = space.UnitA || "";

    const hasSpace = (!!emptySpaceW && !!unitW) || (!!emptySpaceA && !!unitA);

    const availableText = hasSpace
      ? `${emptySpaceW || ""} ${unitW}, ${emptySpaceA || ""} ${unitA}`.trim()
      : "—";

    const priceType = (space.PriceType || "").toLowerCase();
    const priceValue = space.Price;
    let priceDisplay = "—";

    const isBid = priceType === "bids" || priceType === "bid";

    if (modalFixedBlock)
      modalFixedBlock.style.display = isBid ? "none" : "block";
    if (modalBidBlock) modalBidBlock.style.display = isBid ? "block" : "none";

    // Reset partial UI every time modal opens
    baseFixedTotal = null;
    if (partialBox) partialBox.style.display = "none";
    if (partialError) partialError.style.display = "none";
    if (partialPercentInput) partialPercentInput.value = "";

    function renderFixedTotals(total) {
      const safeTotal = isNaN(total) ? null : total;

      if (safeTotal == null) {
        priceDisplay = "—";
        if (modalSellerRevenue) modalSellerRevenue.textContent = "—";
        if (modalServiceFee) modalServiceFee.textContent = "—";
        return;
      }

      priceDisplay = `$${safeTotal.toFixed(2)}`;

      const sellerRevenue = safeTotal * 0.95;
      const serviceFee = safeTotal * 0.05;

      if (modalSellerRevenue)
        modalSellerRevenue.textContent = `$${sellerRevenue.toFixed(2)}`;
      if (modalServiceFee)
        modalServiceFee.textContent = `$${serviceFee.toFixed(2)}`;
    }

    if (isBid) {
      // Reset bid UI every time modal opens (so totals wait for user input)
      if (bidAmountInput) bidAmountInput.value = "";
      if (bidPartialBox) bidPartialBox.style.display = "none";
      if (bidPartialPercentInput) bidPartialPercentInput.value = "";
      if (bidPartialError) bidPartialError.style.display = "none";
      renderBidTotals(null);
      if (partialToggle) partialToggle.style.display = "none";

      if (modalSellerRevenue) modalSellerRevenue.textContent = "—";
      if (modalServiceFee) modalServiceFee.textContent = "—";
    } else {
      if (partialToggle) partialToggle.style.display = "inline-block";

      const total = Number(priceValue);
      baseFixedTotal = !isNaN(total) ? total : null;

      renderFixedTotals(baseFixedTotal);

      // Wire partial events once (but operates safely even if called multiple times)
      if (partialToggle && !partialToggle.__wired) {
        partialToggle.__wired = true;

        partialToggle.addEventListener("click", function () {
          if (!partialBox) return;
          const isOpen = partialBox.style.display !== "none";
          partialBox.style.display = isOpen ? "none" : "block";

          if (partialError) partialError.style.display = "none";
          if (partialPercentInput) partialPercentInput.value = "";
          renderFixedTotals(baseFixedTotal);
          if (modalTotalPrice) modalTotalPrice.textContent = priceDisplay;
        });
      }

      if (partialPercentInput && !partialPercentInput.__wired) {
        partialPercentInput.__wired = true;

        partialPercentInput.addEventListener("input", function () {
          if (partialError) partialError.style.display = "none";

          if (baseFixedTotal == null) {
            renderFixedTotals(null);
            if (modalTotalPrice) modalTotalPrice.textContent = priceDisplay;
            return;
          }

          const pct = Number(partialPercentInput.value);

          // Allow empty without error (just show base totals)
          if (partialPercentInput.value.trim() === "") {
            renderFixedTotals(baseFixedTotal);
            if (modalTotalPrice) modalTotalPrice.textContent = priceDisplay;
            return;
          }

          if (isNaN(pct) || pct < 1 || pct > 99) {
            if (partialError) partialError.style.display = "block";
            renderFixedTotals(baseFixedTotal);
            if (modalTotalPrice) modalTotalPrice.textContent = priceDisplay;
            return;
          }

          const partialTotal = baseFixedTotal * (pct / 100);
          renderFixedTotals(partialTotal);
          if (modalTotalPrice) modalTotalPrice.textContent = priceDisplay;
        });
      }
    }

    const companyName = space.CompName || "Swift Logistics";
    const cargoText = space.Restriction || "All containerized goods";

    modalTypeChip.className = "fs-badge";

    const typeLower = rawType.toLowerCase();
    if (typeLower === "truck")
      modalTypeChip.classList.add("fs-badge--type-truck");
    else if (typeLower === "ship")
      modalTypeChip.classList.add("fs-badge--type-ship");
    else if (typeLower === "plane" || typeLower === "air")
      modalTypeChip.classList.add("fs-badge--type-plane");

    modalTypeChip.textContent = rawType;
    if (modalOrigin) modalOrigin.textContent = origin || "—";
    if (modalDestination) modalDestination.textContent = destination || "—";
    if (modalAvailableSpace) modalAvailableSpace.textContent = availableText;
    if (modalDepartureDate) modalDepartureDate.textContent = depDate || "—";
    if (modalCargo) modalCargo.textContent = cargoText;
    if (modalCompanyName) modalCompanyName.textContent = companyName;
    const companyDesc = space.CompDesc || "—";
    if (modalCompanyDesc) modalCompanyDesc.textContent = companyDesc;
    if (modalTotalPrice) modalTotalPrice.textContent = priceDisplay;
    if (modalStatusBadge) modalStatusBadge.textContent = "Available Now";

    modal.classList.remove("fs-modal--hidden");
  }

  function closeModal() {
    if (modal) modal.classList.add("fs-modal--hidden");
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (modal) {
    // close when clicking backdrop
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });
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

  applyFiltersBtn.addEventListener("click", applyFilters);
  sortSelect.addEventListener("change", applyFilters);

  originInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") applyFilters();
  });
  destinationInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") applyFilters();
  });

  if (bidPartialToggle && !bidPartialToggle.__wired) {
    bidPartialToggle.__wired = true;
    bidPartialToggle.addEventListener("click", function () {
      if (!bidPartialBox) return;
      const isOpen = bidPartialBox.style.display !== "none";
      bidPartialBox.style.display = isOpen ? "none" : "block";

      if (!isOpen) {
        // opened: clear percent + error
        if (bidPartialPercentInput) bidPartialPercentInput.value = "";
        if (bidPartialError) bidPartialError.style.display = "none";
        recomputeBidTotals();
      }
    });
  }

  if (bidAmountInput && !bidAmountInput.__wired) {
    bidAmountInput.__wired = true;
    bidAmountInput.addEventListener("input", recomputeBidTotals);
  }

  if (bidPartialPercentInput && !bidPartialPercentInput.__wired) {
    bidPartialPercentInput.__wired = true;
    bidPartialPercentInput.addEventListener("input", recomputeBidTotals);
  }

  function getCurrentUserId() {
    // You already store user in localStorage in other pages; reuse that pattern.
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    try {
      const u = JSON.parse(raw);
      return u.ID || u.Id || u.id || null;
    } catch (e) {
      return null;
    }
  }

  function makeId() {
    const now = Date.now().toString();
    return "B" + now.slice(-9);
  }

  function num2(val) {
    const n = Number(val);
    if (isNaN(n)) return null;
    return Number(n.toFixed(2));
  }

  async function createBooking(payload) {
    const res = await fetch("/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Booking failed");
    }
    return data;
  }

  function computeFixedBooking(space) {
    const base = num2(space.Price);
    if (base == null || base <= 0)
      return { ok: false, error: "Invalid fixed price." };

    let partial = "N";
    let partialAmt = "0";
    let finalTotal = base;

    const isPartialOpen = partialBox && partialBox.style.display !== "none";
    const rawPct = (
      partialPercentInput ? partialPercentInput.value : ""
    ).trim();

    // Only treat as partial if box is open AND there is a value (per your requirement)
    if (isPartialOpen && rawPct) {
      const pct = Number(rawPct);
      if (isNaN(pct) || pct < 1 || pct > 99) {
        if (partialError) partialError.style.display = "block";
        return { ok: false, error: "Partial % must be between 1 and 99." };
      }
      if (partialError) partialError.style.display = "none";

      partial = "Y";
      partialAmt = rawPct;
      finalTotal = num2(base * (pct / 100));
      if (finalTotal == null) finalTotal = base;
    } else {
      if (partialError) partialError.style.display = "none";
    }

    return {
      ok: true,
      SpacePrice: String(finalTotal),
      BidPrice: "0",
      Partial: partial,
      PartialAmt: partialAmt,
    };
  }

  function computeBidBooking() {
    const rawBid = (bidAmountInput ? bidAmountInput.value : "").trim();
    const bidValue = num2(rawBid);

    // Must specify a bid price
    if (!rawBid || bidValue == null || bidValue <= 0) {
      return {
        ok: false,
        error: "Please enter a valid bid amount before booking.",
      };
    }

    let partial = "N";
    let partialAmt = "0";
    let finalTotal = bidValue;

    const isPartialOpen =
      bidPartialBox && bidPartialBox.style.display !== "none";
    const rawPct = (
      bidPartialPercentInput ? bidPartialPercentInput.value : ""
    ).trim();

    // Only treat as partial if box is open AND there is a value
    if (isPartialOpen && rawPct) {
      const pct = Number(rawPct);
      if (isNaN(pct) || pct < 1 || pct > 99) {
        if (bidPartialError) bidPartialError.style.display = "block";
        return { ok: false, error: "Partial % must be between 1 and 99." };
      }
      if (bidPartialError) bidPartialError.style.display = "none";

      partial = "Y";
      partialAmt = rawPct;
      finalTotal = num2(bidValue * (pct / 100));
      if (finalTotal == null) finalTotal = bidValue;
    } else {
      if (bidPartialError) bidPartialError.style.display = "none";
    }

    return {
      ok: true,
      SpacePrice: "0",
      BidPrice: String(finalTotal),
      Partial: partial,
      PartialAmt: partialAmt,
    };
  }

  if (bookBtn && !bookBtn.__wired) {
    bookBtn.__wired = true;

    bookBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (!activeSpace) {
        alert("No shipment selected.");
        return;
      }

      const userId = getCurrentUserId();
      if (!userId) {
        alert("You must be logged in to book.");
        return;
      }

      const refId =
        activeSpace.RefID ||
        activeSpace.RefId ||
        activeSpace.refId ||
        activeSpace.refID;

      if (!refId) {
        alert("This shipment is missing RefID.");
        return;
      }

      const priceType = String(activeSpace.PriceType || "").toLowerCase();
      const isBid = priceType === "bids" || priceType === "bid";

      const pricing = isBid
        ? computeBidBooking()
        : computeFixedBooking(activeSpace);
      if (!pricing.ok) {
        alert(pricing.error || "Invalid booking details.");
        if (isBid && bidAmountInput) bidAmountInput.focus();
        return;
      }

      const confirmed = window.confirm("Confirm Booking");
      if (!confirmed) return;

      const payload = {
        BookID: makeId(),
        RefID: String(refId),
        ID: String(userId),
        Status: "Pending",
        SpacePrice: pricing.SpacePrice,
        BidPrice: pricing.BidPrice,
        Partial: pricing.Partial,
        PartialAmt: pricing.PartialAmt,
        CreatedAt: new Date().toISOString(),
      };

      try {
        await createBooking(payload);
        alert("Booking saved.");
        closeModal();
      } catch (err) {
        alert(err.message || "Booking failed.");
      }
    });
  }

  loadSpaces();
});
