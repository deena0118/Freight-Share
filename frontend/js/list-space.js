document.addEventListener("DOMContentLoaded", function () {
    var totalSteps = 3;
    var currentStep = 1;

    var form = document.getElementById("fs-listing-form");
    if (!form) return;

    var backBtn = document.getElementById("fs-back");
    var nextBtn = document.getElementById("fs-next");

    var stepContents = document.querySelectorAll(".fs-step-content");
    var stepperSteps = document.querySelectorAll(".fs-stepper-step");

    var inputsStep1 = [
        document.getElementById("origin"),
        document.getElementById("destination"),
        document.getElementById("departDate"),
        document.getElementById("departTime")
    ];

    var inputsStep2 = [
        document.getElementById("availableSpaceW"),
        document.getElementById("spaceUnitW"),
        document.getElementById("availableSpaceA"),
        document.getElementById("spaceUnitA"),
        document.getElementById("goodsAllowed")
    ];

    var priceInput = document.getElementById("price");

   var hiddenFreight = document.getElementById("freightType");
var freightCards = document.querySelectorAll(".fs-freight-card");
var freightChosenByUser = false;

var pricingOptions = document.querySelectorAll('.fs-pricing-option');
var infoBanner = document.getElementById("infoBanner");
var priceInputContainer = document.getElementById("priceInputContainer");

var originInput = document.getElementById("origin");
var destinationInput = document.getElementById("destination");
var originDropdown = document.getElementById("originDropdown");
var destinationDropdown = document.getElementById("destinationDropdown");
var allLocations = [];

freightCards.forEach(function (card) {
    card.classList.remove("fs-freight-card--active");
});
if (hiddenFreight) {
    hiddenFreight.value = "";
}




    function isFilled(el) {
        if (!el) return true;
        if (el.tagName === "SELECT") {
            return el.value !== "";
        }
        return el.value.trim() !== "";
    }

    function validateStep(step) {
       if (step === 1) {
    var hasFreight = freightChosenByUser;
    return hasFreight && inputsStep1.every(isFilled);
}

        if (step === 2) {
            return inputsStep2.every(isFilled);
        }
        if (step === 3) {
            var pricingType = document.querySelector('input[name="pricingType"]:checked');
            if (!pricingType) return false;
            if (pricingType.value === "bids") {
                return true;
            }
            return isFilled(priceInput);
        }
        return true;
    }

    function updateStepper() {
        stepperSteps.forEach(function (stepEl) {
            var stepNumber = parseInt(stepEl.getAttribute("data-step-index"), 10);
            var circle = stepEl.querySelector(".fs-stepper-circle");
            if (!circle || isNaN(stepNumber)) return;

            stepEl.classList.remove("fs-stepper-step--active", "fs-stepper-step--done");

            if (stepNumber < currentStep) {
                stepEl.classList.add("fs-stepper-step--done");
                circle.textContent = "✓";
            } else if (stepNumber === currentStep) {
                stepEl.classList.add("fs-stepper-step--active");
                circle.textContent = String(stepNumber);
            } else {
                circle.textContent = String(stepNumber);
            }
        });
    }

    function updateStepVisibility() {
        stepContents.forEach(function (content) {
            var stepNumber = parseInt(content.getAttribute("data-step"), 10);
            if (stepNumber === currentStep) {
                content.classList.remove("fs-step-content--hidden");
            } else {
                content.classList.add("fs-step-content--hidden");
            }
        });
    }

    function updateButtons() {
        backBtn.style.visibility = currentStep === 1 ? "hidden" : "visible";
        nextBtn.textContent = currentStep === totalSteps ? "Create Listing" : "Next →";
        nextBtn.disabled = !validateStep(currentStep);
    }

    function updateSummary() {
        var origin = document.getElementById("origin");
        var destination = document.getElementById("destination");
        var departDate = document.getElementById("departDate");
        var departTime = document.getElementById("departTime");
        var availableSpaceW = document.getElementById("availableSpaceW");
        var spaceUnitW = document.getElementById("spaceUnitW");
        var availableSpaceA = document.getElementById("availableSpaceA");
        var spaceUnitA = document.getElementById("spaceUnitA");
var sSellerRev = document.getElementById("summarySellerRevenue");
var sServiceFee = document.getElementById("summaryServiceFee");

        var freightLabel = "—";
        if (hiddenFreight && hiddenFreight.value) {
            if (hiddenFreight.value === "Truck") freightLabel = "Truck";
            else if (hiddenFreight.value === "Ship") freightLabel = "Ship";
            else if (hiddenFreight.value === "Plane") freightLabel = "Plane";
        }

        var route = "—";
        if (isFilled(origin) || isFilled(destination)) {
            route =
                (origin ? origin.value : "") +
                " → " +
                (destination ? destination.value : "");
        }

        var dateText = "—";
        if (isFilled(departDate) || isFilled(departTime)) {
            dateText =
                (departDate ? departDate.value : "") +
                " at " +
                (departTime ? departTime.value : "");
        }

        var spaceTextW = "—";
        if (isFilled(availableSpaceW) && isFilled(spaceUnitW)) {
            var unitLabelW = spaceUnitW.options[spaceUnitW.selectedIndex].text;
            spaceTextW = availableSpaceW.value + " " + unitLabelW.toLowerCase();
        }

        var spaceTextA= "—";

if (isFilled(availableSpaceA) && isFilled(spaceUnitA)) {
            var unitLabelA = spaceUnitA.options[spaceUnitA.selectedIndex].text;
            spaceTextA = availableSpaceA.value + " " + unitLabelA.toLowerCase();
        }

       var priceText = "—";
var pricingType = document.querySelector('input[name="pricingType"]:checked');
var isBids = pricingType && pricingType.value === "bids";
var sPrice = document.getElementById("summaryPrice");

if (isBids) {
    // Bid mode
    priceText = "Bid";
    if (sPrice) {
        sPrice.style.color = "var(--fs-green)";
        sPrice.style.fontWeight = "800";
    }
    if (sSellerRev) sSellerRev.textContent = "—";
    if (sServiceFee) sServiceFee.textContent = "—";
} else {
    // Fixed price mode
    if (isFilled(priceInput)) {
        var total = Number(priceInput.value);
        if (!isNaN(total)) {
            priceText = "$" + total.toFixed(2);

            var sellerRevenue = total * 0.95;
            var serviceFee = total * 0.05;

            if (sSellerRev) sSellerRev.textContent = "$" + sellerRevenue.toFixed(2);
            if (sServiceFee) sServiceFee.textContent = "$" + serviceFee.toFixed(2);
        } else {
            priceText = "$";
            if (sSellerRev) sSellerRev.textContent = "—";
            if (sServiceFee) sServiceFee.textContent = "—";
        }

        if (sPrice) {
            sPrice.style.color = "var(--fs-green)";
            sPrice.style.fontWeight = "800";
        }
    } else {
        priceText = "$";
        if (sPrice) {
            sPrice.style.color = "var(--fs-green)";
            sPrice.style.fontWeight = "800";
        }
        if (sSellerRev) sSellerRev.textContent = "—";
        if (sServiceFee) sServiceFee.textContent = "—";
    }
}

var sFreight = document.getElementById("summaryFreight");
var sRoute = document.getElementById("summaryRoute");
var sDate = document.getElementById("summaryDate");
var sSpaceW = document.getElementById("summarySpaceW");
var sSpaceA = document.getElementById("summarySpaceA");

if (sFreight) sFreight.textContent = freightLabel;
if (sRoute) sRoute.textContent = route;
if (sDate) sDate.textContent = dateText;
if (sSpaceW) sSpaceW.textContent = spaceTextW;
if (sSpaceA) sSpaceA.textContent = spaceTextA;

if (sPrice) sPrice.textContent = priceText;

    }

    function updatePricingVisuals(selectedOption) {
        pricingOptions.forEach(option => {
            option.classList.remove('fs-pricing-option--active');
        });
        const activeOption = document.querySelector(`.fs-pricing-option[data-price-option="${selectedOption}"]`);
        if (activeOption) {
            activeOption.classList.add('fs-pricing-option--active');
        }

        if (selectedOption === 'fixed') {
            if (priceInputContainer) priceInputContainer.style.display = 'block';
            if (infoBanner) infoBanner.classList.add('fs-info-banner--hidden');
        } else if (selectedOption === 'bids') {
            if (priceInputContainer) priceInputContainer.style.display = 'none';
            if (infoBanner) infoBanner.classList.remove('fs-info-banner--hidden');
        }
    }

  function setupSearchableDropdown(inputEl, dropdownEl) {
    if (!inputEl || !dropdownEl) return;

    function renderOptions(filterText) {
        dropdownEl.innerHTML = "";
        var text = (filterText || "").toLowerCase();

        var matches = allLocations.filter(function (loc) {
            return !text || loc.toLowerCase().indexOf(text) !== -1;
        });

        matches.slice(0, 50).forEach(function (loc) {
            var opt = document.createElement("div");
            opt.className = "fs-select-option";
            opt.textContent = loc;
            opt.addEventListener("mousedown", function (e) {
                e.preventDefault();
                inputEl.value = loc;
                dropdownEl.classList.remove("fs-open");
                updateSummary();
                updateButtons();
            });
            dropdownEl.appendChild(opt);
        });

        if (matches.length > 0) {
            dropdownEl.classList.add("fs-open");
        } else {
            dropdownEl.classList.remove("fs-open");
        }
    }

    inputEl.addEventListener("focus", function () {
        renderOptions(inputEl.value);
    });

    inputEl.addEventListener("input", function () {
        renderOptions(inputEl.value);
    });

    inputEl.addEventListener("click", function () {
        renderOptions(inputEl.value);
    });

    document.addEventListener("click", function (e) {
        if (!dropdownEl.contains(e.target) && e.target !== inputEl) {
            dropdownEl.classList.remove("fs-open");
        }
    });
}

async function loadPorts() {
    try {
        const res = await fetch("/ports");
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to load ports");
        }

        var ports = data.ports || [];
        var seen = {};

        allLocations = ports
            .map(function (p) { return p.Location; })
            .filter(function (loc) {
                if (!loc) return false;
                if (seen[loc]) return false;
                seen[loc] = true;
                return true;
            });

        setupSearchableDropdown(originInput, originDropdown);
        setupSearchableDropdown(destinationInput, destinationDropdown);
    } catch (err) {
        console.error("Error loading ports:", err);
    }
}




    async function createListing() {
    const userDataString = localStorage.getItem('user');
    let userData;
    try {
        userData = JSON.parse(userDataString);
    } catch (e) {
        userData = null;
    }

    if (!userData || !userData.id || !userData.companyId) {
        alert("Authentication error: Please log in again.");
        window.location.href = 'index.html'; 
        return;
    }

    const priceType = document.querySelector('input[name="pricingType"]:checked').value;

    const listingData = {
        CompID: userData.companyId,
        UserID: userData.id,
        Type: hiddenFreight.value,
        Origin: document.getElementById("origin").value.trim(),
        Destination: document.getElementById("destination").value.trim(),
        DepDate: document.getElementById("departDate").value,
        DepTime: document.getElementById("departTime").value,
        EmptySpaceW: document.getElementById("availableSpaceW").value,
        UnitW: document.getElementById("spaceUnitW").value,
        EmptySpaceA: document.getElementById("availableSpaceA").value,
        UnitA: document.getElementById("spaceUnitA").value,
        Restriction: document.getElementById("goodsAllowed").value.trim(),
        PriceType: priceType,
        Price: priceType === 'fixed' ? document.getElementById("price").value : null
    };

        try {
            nextBtn.disabled = true; 
            nextBtn.textContent = 'Saving...';

            const res = await fetch("/space/list", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(listingData)
            });


            const data = await res.json();
            
            if (res.ok) {
                alert(`Success! Listing created with RefID: ${data.refId}`);
                window.location.href = "marketplace.html"; 
            } else {
                alert(`Error creating listing: ${data.error || 'Server validation failed.'}`);
                nextBtn.disabled = false;
                nextBtn.textContent = 'Create Listing';
            }
        } catch (err) {
            console.error("Fetch error:", err);
            alert("A network error occurred. Could not connect to the server."); 
            nextBtn.disabled = false;
            nextBtn.textContent = 'Create Listing';
        }
    }

    function initializeProfileCard() {
        const profileUserNameEl = document.getElementById('profileUserName');
        const profileUserEmailEl = document.getElementById('profileUserEmail');
        const profileContainerEl = document.getElementById('profileContainer');
        const profileIconEl = document.querySelector('.fs-profile-icon');
        
        const userDataString = localStorage.getItem('user'); 
        let userData;

        if (userDataString) {
            try {
                userData = JSON.parse(userDataString);
            } catch (e) {
                console.error("Error parsing user data from localStorage.");
                userData = null;
            }
        }
        
        if (!userData || !userData.email) {
            if (profileContainerEl) {
                profileContainerEl.style.display = 'none'; 
            }
            return; 
        }

        if (profileUserNameEl && profileUserEmailEl) {
            profileUserNameEl.textContent = userData.name || "User Account";
            profileUserEmailEl.textContent = userData.email;
            
            if (profileIconEl && !document.querySelector('.fs-user-icon') && userData.name) {
                profileIconEl.textContent = userData.name.charAt(0).toUpperCase();
            }

            const signOutBtn = document.querySelector('.fs-btn--sign-out');
            if (signOutBtn) {
                 signOutBtn.addEventListener('click', () => {
                     localStorage.removeItem('user'); 
                     window.location.reload(); 
                 });
            }
        }
    }

    function setFreight(type, markChosen) {
    var normalized = type ? type.toLowerCase() : "";
    freightCards.forEach(function (card) {
        var cardType = (card.getAttribute("data-freight") || "").toLowerCase();
        card.classList.toggle("fs-freight-card--active", cardType === normalized);
    });
if (hiddenFreight) hiddenFreight.value = type; // saves Truck/Ship/Plane
    if (markChosen) {
        freightChosenByUser = true;
    }
    updateSummary();
    updateButtons();
}

freightCards.forEach(function (card) {
    card.addEventListener("click", function () {
        var type = card.getAttribute("data-freight");
        if (!type) return;
        setFreight(type, true);
    });
});


    freightCards.forEach(function (card) {
        card.addEventListener("click", function () {
            var type = card.getAttribute("data-freight");
            if (!type) return;
            setFreight(type);
        });
    });

    document.querySelectorAll(".fs-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            var textarea = document.getElementById("goodsAllowed");
            if (!textarea) return;
            var value = chip.textContent.trim();
            if (textarea.value.indexOf(value) === -1) {
                if (textarea.value.trim().length > 0 && !textarea.value.trim().endsWith(",")) {
                    textarea.value += ", ";
                }
                textarea.value += value;
            }
            updateSummary();
            updateButtons();
        });
    });

    document.querySelectorAll('input[name="pricingType"]').forEach(function (radio) {
        radio.addEventListener("change", function () {
            var selectedValue = this.value;
            
            updatePricingVisuals(selectedValue);
            
            if (selectedValue === "bids") {
                priceInput.disabled = true;
            } else {
                priceInput.disabled = false;
            }

            updateSummary();
            updateButtons();
        });
    });

    []
        .concat(inputsStep1)
        .concat(inputsStep2)
        .concat([priceInput])
        .forEach(function (el) {
            if (!el) return;
            el.addEventListener("input", function () {
                updateSummary();
                updateButtons();
            });
            if (el.tagName === "SELECT") {
                el.addEventListener("change", function () {
                    updateSummary();
                    updateButtons();
                });
            }
        });

    backBtn.addEventListener("click", function () {
        if (currentStep === 1) return;
        currentStep -= 1;
        updateStepVisibility();
        updateStepper();
        updateButtons();
    });

 nextBtn.addEventListener("click", function () {
    if (currentStep === 1) {
        if (!freightChosenByUser) {
            alert("Please select a freight type.");
            return;
        }

        var originVal = originInput ? originInput.value.trim() : "";
        var destVal = destinationInput ? destinationInput.value.trim() : "";

        if (!originVal || !destVal) {
            if (!validateStep(currentStep)) return;
        }

        if (allLocations && allLocations.length > 0) {
            var hasOrigin = allLocations.indexOf(originVal) !== -1;
            var hasDest = allLocations.indexOf(destVal) !== -1;

            if (!hasOrigin || !hasDest) {
                alert("Please select a valid origin/destination");
                return;
            }
        }
    }

    if (!validateStep(currentStep)) return;

    if (currentStep < totalSteps) {
        currentStep += 1;
        updateStepVisibility();
        updateStepper();
        updateButtons();
    } else {
        createListing();
    }
});



    
    var initialPricingType = document.querySelector('input[name="pricingType"]:checked');
    if (initialPricingType) {
        updatePricingVisuals(initialPricingType.value);
    }
    
    initializeProfileCard();
loadPorts();

    updateSummary();
    updateStepVisibility();
    updateStepper();
    updateButtons();

});