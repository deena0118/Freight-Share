document.addEventListener("DOMContentLoaded", function () {

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


});
