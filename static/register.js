// register.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register");

  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // Stop the form from submitting immediately

    // Get form field values
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    // Validation checks
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    // Simple email validation
    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,}$/;
    if (!email.match(emailPattern)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Password length validation
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    // C
try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      // Read backend response text
      const message = await response.text();

      if (response.ok) {
        alert(message); // e.g. "Registered successfully"
        register.reset(); // clear form after success
      } else {
        alert(message); // e.g. "Email already exists"
        register.reset();
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Something went wrong. Try again later.');
    }
  });
});