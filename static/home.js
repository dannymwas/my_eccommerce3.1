// --- Helpers ---
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    return null;
  }
}

let user = getCurrentUser(); // global reference

// Local cart for guests
function getLocalCart() {
  return JSON.parse(localStorage.getItem("guest_cart")) || [];
}
function saveLocalCart(cart) {
  localStorage.setItem("guest_cart", JSON.stringify(cart));
}

// --- ADD TO CART (No login required) ---
async function addToCart(productId) {
  user = getCurrentUser();

  // If logged in → Save to server
  if (user && user.id) {
    try {
      const BASE_URL = window.location.origin;
      const response = await fetch(`${BASE_URL}/cart/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Item added to your cart!");
        updateCartCount();
      } else {
        alert(data.error || "Failed to update cart.");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Something went wrong.");
    }
  }

  // If NOT logged in → store to guest cart (localStorage)
  else {
    let cart = JSON.parse(localStorage.getItem("guest_cart")) || [];
    const item = cart.find(p => p.product_id === productId);

    if (item) item.quantity++;
    else cart.push({ product_id: productId, quantity: 1 });

    localStorage.setItem("guest_cart", JSON.stringify(cart));
    alert("Item added! (You're not logged in yet)");
    updateCartCount();
  }
}


// --- CART COUNT ---
async function updateCartCount() {
  user = getCurrentUser();

  // Logged in → Count from server
  if (user && user.id) {
    const BASE_URL = window.location.origin;
    const response = await fetch(`${BASE_URL}/cart`, { credentials: 'include' });
    const items = response.ok ? await response.json() : [];
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('cart-count').textContent = count;
  }

  // Guest → Count from localStorage
  else {
    const cart = getLocalCart();
    const count = cart.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('cart-count').textContent = count;
  }
}

// --- CHECKOUT (Login required) ---
async function checkout() {
  user = getCurrentUser();
  if (!user) {
    const goLogin = confirm("You must log in to checkout. Go to login page?");
    if (goLogin) window.location.href = "login.html";
    return;
  }

  window.location.href = "checkout.html";
}

// initial UI update
updateCartCount();
