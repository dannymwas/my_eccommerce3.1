document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      // 🔹 Send login request to backend
      const response = await fetch("http://localhost:3000/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",   // ✅ VERY IMPORTANT: allow cookies to be stored
  body: JSON.stringify({ email, password }),
});


      const data = await response.json();

      if (response.ok) {
        // ✅ Save full user data (id, email, etc.)
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ Redirect to homepage
        alert(data.message || "Login successful!");
        window.location.href = "/home";
      } else {
        alert(data.error || "Invalid email or password!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Try again later.");
    }

    form.reset();
  });
});
