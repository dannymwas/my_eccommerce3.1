document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        // ✅ Clear session and local storage
        localStorage.removeItem("user");

        // ✅ Notify server (optional)
        await fetch("/logout", { method: "POST" });

        // ✅ Redirect to homepage
        window.location.href = "/";
      } catch (error) {
        console.error("Logout error:", error);
        alert("Something went wrong during logout.");
      }
    });
  }
});
