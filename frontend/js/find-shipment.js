document.addEventListener("DOMContentLoaded", function () {
    const originInput = document.getElementById("filterOrigin");
    const destinationInput = document.getElementById("filterDestination");
    const typeSelect = document.getElementById("filterType");
    const sortSelect = document.getElementById("sortSelect");
    const applyFiltersBtn = document.getElementById("applyFilters");
    const resultsGrid = document.getElementById("fsResultsGrid");
    const resultsCount = document.getElementById("resultsCount");

    // modal elements
    const modal = document.getElementById("fsShipmentModal");
    const modalClose = document.getElementById("fsModalClose");
    const modalTypeChip = document.getElementById("fsModalTypeChip");
    const modalOrigin = document.getElementById("fsModalOrigin");
    const modalDestination = document.getElementById("fsModalDestination");
    const modalAvailableSpace = document.getElementById("fsModalAvailableSpace");
    const modalDepartureDate = document.getElementById("fsModalDepartureDate");
    const modalCargo = document.getElementById("fsModalCargo");
    const modalCompanyName = document.getElementById("fsModalCompanyName");
    const modalTotalPrice = document.getElementById("fsModalTotalPrice");
    const modalStatusBadge = document.getElementById("fsModalStatusBadge");

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
        else if (typeLower === "plane" || typeLower === "air") typeClass = "fs-badge--type-plane";

        const origin = space.Origin || space.Origion || "";
        const destination = space.Destination || "";
        const depDate = space.DepDate || "";

        const emptySpaceW = space.EmptySpaceW;
        const unitW = space.UnitW || "";
        const emptySpaceA = space.EmptySpaceA;
        const unitA = space.UnitA || "";

        const hasSpace =
            (!!emptySpaceW && !!unitW) || (!!emptySpaceA && !!unitA);

        const availableText = hasSpace
            ? `Available Space: ${emptySpaceW || ""} ${unitW} ${emptySpaceA || ""} ${unitA}`
            : "Available Space";

        const priceType = (space.PriceType || "").toLowerCase();
        const priceValue = space.Price;

        let priceHtml;
        if (priceType === "fixed") {
            priceHtml = `<span class="fs-card-price">$${escapeHtml(priceValue)}</span>`;
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

        const rawType = (space.Type || "truck").toString();
        const origin = space.Origin || space.Origion || "";
        const destination = space.Destination || "";
        const depDate = space.DepDate || "";

        const emptySpaceW = space.EmptySpaceW;
        const unitW = space.UnitW || "";
        const emptySpaceA = space.EmptySpaceA;
        const unitA = space.UnitA || "";

        const hasSpace =
            (!!emptySpaceW && !!unitW) || (!!emptySpaceA && !!unitA);

        const availableText = hasSpace
            ? `${emptySpaceW || ""} ${unitW} ${emptySpaceA || ""} ${unitA}`.trim()
            : "—";

        const priceType = (space.PriceType || "").toLowerCase();
        const priceValue = space.Price;
        let priceDisplay = "N/A";

        if (priceType === "fixed" && priceValue != null) {
            priceDisplay = `$${priceValue}`;
        } else if (priceType === "bids") {
            priceDisplay = "Bid";
        }

        const companyName = space.CompName || "Swift Logistics";
        const cargoText = space.Restriction || "All containerized goods";

// Reset old classes
modalTypeChip.className = "fs-badge";

// Add correct color badge
const typeLower = rawType.toLowerCase();
if (typeLower === "truck") modalTypeChip.classList.add("fs-badge--type-truck");
else if (typeLower === "ship") modalTypeChip.classList.add("fs-badge--type-ship");
else if (typeLower === "plane" || typeLower === "air") modalTypeChip.classList.add("fs-badge--type-plane");

// Set badge text
modalTypeChip.textContent = rawType;
        if (modalOrigin) modalOrigin.textContent = origin || "—";
        if (modalDestination) modalDestination.textContent = destination || "—";
        if (modalAvailableSpace) modalAvailableSpace.textContent = availableText;
        if (modalDepartureDate) modalDepartureDate.textContent = depDate || "—";
        if (modalCargo) modalCargo.textContent = cargoText;
        if (modalCompanyName) modalCompanyName.textContent = companyName;
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

    loadSpaces();
});
