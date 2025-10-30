document.addEventListener("DOMContentLoaded", () => {
  const confirmBtn = document.getElementById("confirmPaymentBtn");
  const phoneInput = document.getElementById("phoneNumber");
  const amountInput = document.getElementById("amount");
  const messageBox = document.getElementById("message");

  confirmBtn.addEventListener("click", async () => {
    const phone = phoneInput.value.trim();
    const amount = amountInput.value.trim();

    if (!phone || !amount) {
      messageBox.innerText = "⚠️ Please enter your phone number and amount.";
      messageBox.style.color = "red";
      return;
    }

    try {
      messageBox.innerText = "⏳ Processing payment... Please wait.";
      messageBox.style.color = "blue";

      const response = await fetch("/stkpush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, amount }),
      });

      const data = await response.json();

      if (response.ok) {
        messageBox.innerText =
          "✅ Payment initiated! Check your phone to enter your M-Pesa PIN.";
        messageBox.style.color = "green";
        console.log("M-Pesa response:", data);
      } else {
        messageBox.innerText = `❌ Payment failed: ${data.error || "Unknown error"}`;
        messageBox.style.color = "red";
        console.error("Payment error:", data);
      }
    } catch (error) {
      messageBox.innerText = "❌ Error connecting to the server.";
      messageBox.style.color = "red";
      console.error("Network error:", error);
    }
  });
});
