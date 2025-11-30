document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorBox = document.getElementById("loginError");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (errorBox) errorBox.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (errorBox) errorBox.textContent = data.error || "Login failed";
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "marketplace.html";
    } catch (err) {
      console.error(err);
      if (errorBox) errorBox.textContent = "Network error. Please try again.";
    }
  });
});
