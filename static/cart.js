const user = JSON.parse(localStorage.getItem("user"));

// Product data (hardcoded for now)
const products = [
  { id: 1, name: "Bluetooth Speaker", price: 1500 },
  { id: 2, name: "Smart Phone", price: 11999 },
  { id: 3, name: "Smart Watch", price: 1500 },
  { id: 4, name: "Wireless Headphones", price: 1000 },
  { id: 5, name: "Computer CPU", price: 9500 },
  { id: 6, name: "Cooker", price: 3500 },
  { id: 7, name: "Electric Cooker", price: 5000 },
  { id: 8, name: "Curved Monitor", price: 30000 },
  { id: 9, name: "Ear Buds", price: 700 },
  { id: 10, name: "Electric Extension", price: 650 },
  { id: 11, name: "Fridge", price: 30000 },
  { id: 12, name: "Gaming CPU", price: 20000 },
  { id: 13, name: "Gaming Pads", price: 3500 },
  { id: 14, name: "Home Theatre", price: 22500 },
  { id: 15, name: "Laptop Bag", price: 1000 },
  { id: 16, name: "Laptop", price: 36500 },
  { id: 17, name: "Oven", price: 5000 },
  { id: 18, name: "Play Station", price: 85000 },
  { id: 19, name: "Router", price: 1700 },
  { id: 20, name: "Smart TV", price: 12999 }
];

async function loadCart() {
  let cartItems = [];
  let total = 0;

  if (user) {
    // Logged in: fetch from server
    try {
      const BASE_URL = window.location.origin;
      const response = await fetch(`${BASE_URL}/api/cart`, { credentials: 'include' });
      if (response.ok) {
        cartItems = await response.json();
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  } else {
    // Guest: load from localStorage
    cartItems = JSON.parse(localStorage.getItem("guest_cart")) || [];
  }

  const cartContainer = document.getElementById('cart-items');
  cartContainer.innerHTML = '';

  if (cartItems.length === 0) {
    cartContainer.innerHTML = '<p>Your cart is empty.</p>';
    document.getElementById('total-price').textContent = '0';
    return;
  }

  cartItems.forEach(item => {
    const product = products.find(p => p.id === item.product_id);
    if (product) {
      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      itemDiv.innerHTML = `
        <h4>${product.name}</h4>
        <p>Price: KES ${product.price}</p>
        <p>Quantity: ${item.quantity}</p>
        <p>Total: KES ${itemTotal}</p>
        <button onclick="removeFromCart(${item.product_id})">Remove</button>
      `;
      cartContainer.appendChild(itemDiv);
    }
  });

  document.getElementById('total-price').textContent = total;
}

async function removeFromCart(productId) {
  if (user) {
    // Logged in: remove from server
    try {
      const BASE_URL = window.location.origin;
      const response = await fetch(`${BASE_URL}/cart/remove`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      });
      if (response.ok) {
        loadCart(); // Reload cart
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  } else {
    // Guest: remove from localStorage
    let cart = JSON.parse(localStorage.getItem("guest_cart")) || [];
    cart = cart.filter(item => item.product_id !== productId);
    localStorage.setItem("guest_cart", JSON.stringify(cart));
    loadCart(); // Reload cart
  }
}

document.getElementById('checkout-btn').addEventListener('click', () => {
  if (!user) {
    alert("Please login to checkout.");
    window.location.href = "login.html";
    return;
  }
  window.location.href = "checkout.html";
});

// Load cart on page load
loadCart();
