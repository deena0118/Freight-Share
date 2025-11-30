function loadComponent(targetId, filePath, callback) {
  var container = document.getElementById(targetId);
  if (!container) return;

  fetch(filePath)
    .then(function (res) {
      return res.text();
    })
    .then(function (html) {
      container.innerHTML = html;
      if (typeof callback === "function") callback();
    })
    .catch(function (err) {
      console.error("Failed to load component:", filePath, err);
    });
}

function setActiveNav(pageKey) {
  var nav = document.querySelector(".fs-main-nav");
  if (!nav) return;

  var links = nav.querySelectorAll("a[data-page]");
  links.forEach(function (link) {
    if (link.getAttribute("data-page") === pageKey) {
      link.classList.add("fs-nav-item--active");
    } else {
      link.classList.remove("fs-nav-item--active");
    }
  });
}
