// API Base URL (Will adapt depending on if it's Docker or Local)
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5001/api' 
  : '/api'; 

// State variables
let cart = JSON.parse(localStorage.getItem('quickbite_cart')) || {}; 

function saveCart() {
  localStorage.setItem('quickbite_cart', JSON.stringify(cart));
}

function getUser() {
  const user = localStorage.getItem('quickbite_user');
  return user ? JSON.parse(user) : null;
}

function checkAuth() {
  const user = getUser();
  const authLinks = document.getElementById('authLinks');
  
  const landingScreen = document.getElementById('landingScreen');
  const mainAppScreen = document.getElementById('mainAppScreen');

  if (user) {
    if (landingScreen) landingScreen.style.display = 'none';
    if (mainAppScreen) mainAppScreen.style.display = 'block';
    
    // Dynamically update the Hero Title
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) {
      const location = user.location || 'Nagpur';
      heroTitle.textContent = `Discover the best food & drinks in ${location}`;
    }

    if (authLinks) {
      authLinks.innerHTML = `
        <li class="nav-item">
          <span class="nav-link">Hi, ${user.username}</span>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="orders.html">My Orders</a>
        </li>
        <li class="nav-item">
          <button class="nav-link btn btn-link p-0 position-relative me-3" data-bs-toggle="modal" data-bs-target="#aiAssistantModal">
            🤖 AI Assistant
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link btn btn-link p-0 position-relative me-3" data-bs-toggle="modal" data-bs-target="#cartModal">
            🛒 Cart 
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cartCountBadge" style="display: none;">
              0
            </span>
          </button>
        </li>
        <li class="nav-item">
          <button class="btn btn-outline-danger ms-2 btn-sm mt-1" onclick="logout()">Logout</button>
        </li>
      `;
    }
  } else {
    // If not logged in and on index.html:
    if (landingScreen && mainAppScreen) {
      landingScreen.style.display = 'flex';
      mainAppScreen.style.display = 'none';
    }

    if (authLinks) {
      authLinks.innerHTML = `
        <li class="nav-item">
          <button class="nav-link btn btn-link p-0 position-relative me-3" data-bs-toggle="modal" data-bs-target="#cartModal">
            🛒 Cart 
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cartCountBadge" style="display: none;">
              0
            </span>
          </button>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="index.html">Login</a>
        </li>
      `;
    }
  }
}

function logout() {
  localStorage.removeItem('quickbite_user');
  localStorage.removeItem('quickbite_cart'); // Clear cart on logout
  window.location.href = 'index.html';
}

const assistantMenu = [
  { name: 'Classic Cheese Pizza', price: 350, type: 'veg', tags: ['pizza', 'cheese', 'fast food', 'family'] },
  { name: 'Spicy Zinger Burger', price: 150, type: 'non-veg', tags: ['burger', 'fast food', 'spicy'] },
  { name: 'Hyderabadi Chicken Biryani', price: 250, type: 'non-veg', tags: ['biryani', 'rice', 'spicy', 'family'] },
  { name: 'Butter Chicken', price: 300, type: 'non-veg', tags: ['curry', 'north indian', 'rich'] },
  { name: 'Tandoori Roti & Paneer', price: 200, type: 'veg', tags: ['paneer', 'roti', 'north indian', 'healthy'] },
  { name: 'Dal Makhani', price: 180, type: 'veg', tags: ['dal', 'north indian', 'comfort'] },
  { name: 'Chole Bhature', price: 120, type: 'veg', tags: ['north indian', 'street food', 'snack'] },
  { name: 'Paneer Tikka', price: 220, type: 'veg', tags: ['paneer', 'starter', 'grilled'] },
  { name: 'Masala Dosa', price: 100, type: 'veg', tags: ['south indian', 'light', 'breakfast'] },
  { name: 'Veg Hakka Noodles', price: 140, type: 'veg', tags: ['chinese', 'noodles', 'quick'] },
  { name: 'Gobi Manchurian', price: 160, type: 'veg', tags: ['chinese', 'starter', 'spicy'] },
  { name: 'Spring Rolls', price: 110, type: 'veg', tags: ['chinese', 'starter', 'snack'] },
  { name: 'Chocolate Lava Cake', price: 120, type: 'veg', tags: ['dessert', 'sweet', 'cake'] },
  { name: 'Gulab Jamun', price: 60, type: 'veg', tags: ['sweet', 'dessert', 'snack'] },
  { name: 'Rasmalai', price: 80, type: 'veg', tags: ['sweet', 'dessert', 'milk'] }
];

function buildAiRecommendations(input) {
  const text = input.toLowerCase();
  const budgetMatch = text.match(/under\s*₹?\s*(\d+)/) || text.match(/budget\s*₹?\s*(\d+)/) || text.match(/\b(\d+)\s*(?:rs|rupees|₹)\b/);
  const peopleMatch = text.match(/(\d+)\s*(?:people|person|persons|guests|friends)/);
  const isVeg = /vegetarian|veg|veggie/i.test(text);
  const isNonVeg = /non-veg|nonveg|chicken|mutton|fish|egg|meat/i.test(text);
  const isSpicy = /spicy|hot|masala/i.test(text);
  const isSnack = /snack|starter|light|quick|tiffin/i.test(text);
  const isDessert = /sweet|dessert|cake|gulab|rasmalai/i.test(text);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  const people = peopleMatch ? Number(peopleMatch[1]) : 1;

  let filtered = assistantMenu.filter(item => {
    if (budget) {
      const perPersonBudget = Math.max(50, Math.floor(budget / Math.max(people, 1)));
      if (item.price > perPersonBudget * 1.5) return false;
    }

    if (isVeg && item.type !== 'veg') return false;
    if (isNonVeg && item.type !== 'non-veg') return false;
    if (isSpicy && !item.tags.some(tag => ['spicy', 'masala', 'hot'].includes(tag))) return false;
    if (isSnack && !item.tags.some(tag => ['snack', 'starter', 'light', 'quick', 'breakfast'].includes(tag))) return false;
    if (isDessert && !item.tags.some(tag => ['sweet', 'dessert', 'cake'].includes(tag))) return false;

    if (text.includes('pizza') && !item.tags.includes('pizza')) return false;
    if (text.includes('burger') && !item.tags.includes('burger')) return false;
    if (text.includes('biryani') && !item.tags.includes('biryani')) return false;
    if (text.includes('noodles') && !item.tags.includes('noodles')) return false;
    if (text.includes('paneer') && !item.tags.includes('paneer')) return false;

    return true;
  });

  if (filtered.length === 0) {
    filtered = assistantMenu.slice().sort((a, b) => a.price - b.price).slice(0, 4);
  }

  filtered = filtered.slice().sort((a, b) => Math.abs(a.price - (budget || a.price)) - Math.abs(b.price - (budget || b.price))).slice(0, 4);

  const estimatedTotal = filtered.reduce((sum, item) => sum + item.price, 0);

  return `
    <div>
      <strong>Recommended picks:</strong>
      <ul class="ai-reco-list">
        ${filtered.map(item => `
          <li>
            <span class="ai-reco-name">${item.name}</span>
            <span class="ai-reco-price">₹${item.price}</span>
          </li>
        `).join('')}
      </ul>
      <div class="ai-reco-summary">
        <strong>Estimated total:</strong> ₹${estimatedTotal} for ${people} ${people > 1 ? 'people' : 'person'}
        ${budget ? `<br><strong>Budget check:</strong> ${estimatedTotal <= budget ? 'within your budget.' : 'slightly above your budget.'}` : ''}
      </div>
    </div>
  `;
}

function addAssistantMessage(message, sender = 'bot') {
  const chatWindow = document.getElementById('aiAssistantChatWindow');
  if (!chatWindow) return;

  const messageEl = document.createElement('div');
  messageEl.className = `ai-message ${sender === 'user' ? 'ai-message-user' : 'ai-message-bot'}`;

  if (sender === 'bot') {
    messageEl.innerHTML = `
      <div class="ai-avatar">🤖</div>
      <div class="ai-bubble">${message}</div>
    `;
  } else {
    messageEl.innerHTML = `
      <div class="ai-bubble ai-bubble-user">${message}</div>
    `;
  }

  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function handleAssistantSubmit(event) {
  event.preventDefault();

  const input = document.getElementById('aiAssistantInput');
  if (!input) return;

  const value = input.value.trim();
  if (!value) return;

  addAssistantMessage(value, 'user');
  input.value = '';

  setTimeout(() => {
    addAssistantMessage(buildAiRecommendations(value), 'bot');
  }, 400);
}

// ------------------------------------------------------------------
// AUTHENTICATION (login.html)
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Login Submision
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;
      const errorDiv = document.getElementById('loginError');

      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('quickbite_user', JSON.stringify({ username: data.username, location: data.location }));
          window.location.href = 'index.html';
        } else {
          errorDiv.textContent = data.error || 'Login failed';
          errorDiv.classList.remove('d-none');
        }
      } catch (err) {
        errorDiv.textContent = 'Server connection error';
        errorDiv.classList.remove('d-none');
      }
    });
  }

  // Registration Submission
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value;
      const password = document.getElementById('regPassword').value;
      const location = document.getElementById('regLocation').value;
      const msgDiv = document.getElementById('registerMsg');

      try {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, location })
        });
        const data = await res.json();
        
        if (res.ok) {
          msgDiv.className = 'alert alert-success text-center';
          msgDiv.textContent = 'Account created successfully! You can now login.';
          registerForm.reset();
        } else {
          msgDiv.className = 'alert alert-danger text-center';
          msgDiv.textContent = data.error || 'Registration failed';
        }
      } catch (err) {
        msgDiv.className = 'alert alert-danger text-center';
        msgDiv.textContent = 'Server connection error';
      }
    });
  }
});

// ------------------------------------------------------------------
// FOODS & CART (index.html)
// ------------------------------------------------------------------
let currentCategory = 'All';

async function loadFoods() {
  const foodContainer = document.getElementById('foodContainer');
  if (!foodContainer) return;

  try {
    const res = await fetch(`${API_URL}/foods`);
    window.foodList = await res.json(); 

    renderFoodCards();
  } catch (err) {
    foodContainer.innerHTML = '<p class="text-danger text-center w-100">Failed to load foods.</p>';
  }
}

function filterFoods(category) {
  currentCategory = category;
  
  // Update Tab active state
  const tabs = document.querySelectorAll('#cuisineTabs .nav-link');
  tabs.forEach(tab => {
    if (tab.textContent.trim() === category) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  renderFoodCards();
}

function renderFoodCards() {
  const foodContainer = document.getElementById('foodContainer');
  if (!foodContainer || !window.foodList) return;

  const filteredFoods = currentCategory === 'All' 
    ? window.foodList 
    : window.foodList.filter(f => f.category === currentCategory);

  if (filteredFoods.length === 0) {
    foodContainer.innerHTML = '<p class="text-muted text-center w-100 my-5">No items found in this category.</p>';
    return;
  }

  foodContainer.innerHTML = filteredFoods.map(food => {
    
    // Check if food is in cart already
    const cartItem = cart[food.name];
    const quantity = cartItem ? cartItem.quantity : 0;

    let buttonRow = '';
    if (quantity === 0) {
      buttonRow = `
        <button class="btn btn-outline-danger w-100 fw-bold" onclick="addToCart('${food.name}', ${food.price})">
          ADD
        </button>
      `;
    } else {
      buttonRow = `
        <div class="d-flex justify-content-between align-items-center w-100 btn-group" role="group">
          <button class="btn btn-danger text-white fw-bold" onclick="removeFromCart('${food.name}')">-</button>
          <button class="btn btn-light border fw-bold w-100" disabled>${quantity}</button>
          <button class="btn btn-danger text-white fw-bold" onclick="addToCart('${food.name}', ${food.price})">+</button>
        </div>
      `;
    }

    return `
      <div class="col-md-4 col-sm-6 mb-4">
        <div class="food-card">
          <div class="food-img-container">
            <img src="${food.image}" alt="${food.name}" class="food-img">
          </div>
          <div class="food-body text-center">
            <h3 class="food-title">${food.name}</h3>
            <div class="food-price mb-3">₹${food.price}</div>
            <div id="btn-container-${food.name.replace(/\\s+/g, '')}">
               ${buttonRow}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(foodName, price) {
  if (!cart[foodName]) cart[foodName] = { quantity: 0, price: price };
  cart[foodName].quantity += 1;
  saveCart();
  updateCartUI();
}

function removeFromCart(foodName) {
  if (!cart[foodName]) return;
  cart[foodName].quantity -= 1;
  if (cart[foodName].quantity <= 0) {
    delete cart[foodName];
  }
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  
  // Update Navbar Badge
  const badge = document.getElementById('cartCountBadge');
  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }

  // Update Food Cards +/- displays
  if (document.getElementById('foodContainer')) {
    renderFoodCards(); 
  }

  // Update Modal Logic
  renderCartModal();
}

function renderCartModal() {
  const modalBody = document.getElementById('cartItemsList');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
  if (!modalBody) return;

  const cartKeys = Object.keys(cart);
  if (cartKeys.length === 0) {
    modalBody.innerHTML = '<p class="text-center text-muted my-4">Your cart is empty.</p>';
    cartCheckoutBtn.disabled = true;
    cartCheckoutBtn.textContent = 'Checkout (₹0)';
    return;
  }

  let totalAmount = 0;
  modalBody.innerHTML = cartKeys.map(foodName => {
    const item = cart[foodName];
    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;

    return `
      <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <div>
          <h6 class="mb-1">${foodName}</h6>
          <small class="text-muted">₹${item.price} x ${item.quantity}</small>
        </div>
        <div class="d-flex align-items-center">
          <button class="btn btn-sm btn-outline-danger px-2 py-0 me-2" onclick="removeFromCart('${foodName}')">-</button>
          <span class="fw-bold me-2">${item.quantity}</span>
          <button class="btn btn-sm btn-outline-danger px-2 py-0 me-3" onclick="addToCart('${foodName}', ${item.price})">+</button>
          <span class="fw-bold">₹${itemTotal}</span>
        </div>
      </div>
    `;
  }).join('');

  cartCheckoutBtn.disabled = false;
  cartCheckoutBtn.textContent = `Checkout (₹${totalAmount})`;
}

async function placeOrder() {
  const user = getUser();
  if (!user) {
    alert('Please log in first to place an order.');
    var myModalEl = document.getElementById('cartModal');
    var modal = bootstrap.Modal.getInstance(myModalEl);
    if(modal) modal.hide();
    window.location.href = 'index.html';
    return;
  }

  const itemsPayload = Object.keys(cart).map(foodName => ({
    food: foodName,
    quantity: cart[foodName].quantity,
    price: cart[foodName].price
  }));

  const totalAmount = itemsPayload.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if(itemsPayload.length === 0) return;

  try {
    document.getElementById('cartCheckoutBtn').disabled = true;
    document.getElementById('cartCheckoutBtn').textContent = 'Processing...';

    const res = await fetch(`${API_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        items: itemsPayload,
        totalAmount: totalAmount,
        location: user.location || 'Nagpur'
      })
    });

    if (res.ok) {
      alert('🎉 Order placed successfully!');
      cart = {}; // clear cart
      localStorage.removeItem('quickbite_cart');
      updateCartUI();
      // Hide Modal
      var myModalEl = document.getElementById('cartModal');
      var modal = bootstrap.Modal.getInstance(myModalEl);
      if(modal) modal.hide();
      
      // Go to orders
      window.location.href = 'orders.html';
    } else {
      const resp = await res.json();
      alert(resp.error || 'Failed to place order.');
      document.getElementById('cartCheckoutBtn').disabled = false;
      document.getElementById('cartCheckoutBtn').textContent = `Checkout (₹${totalAmount})`;
    }
  } catch (err) {
    alert('Server Error. Please try again later.');
    document.getElementById('cartCheckoutBtn').disabled = false;
    document.getElementById('cartCheckoutBtn').textContent = `Checkout (₹${totalAmount})`;
  }
}

// ------------------------------------------------------------------
// ORDERS (orders.html)
// ------------------------------------------------------------------
async function loadOrders() {
  const ordersContainer = document.getElementById('ordersContainer');
  if (!ordersContainer) return;

  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders?username=${user.username}`);
    const orders = await res.json();

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="text-center py-5">
          <h4 class="text-muted">You haven't ordered anything yet.</h4>
          <a href="index.html" class="btn btn-primary-custom mt-3">Explore Food</a>
        </div>
      `;
      return;
    }

    ordersContainer.innerHTML = orders.map(order => {
      const date = new Date(order.orderDate).toLocaleString();
      
      // Fallback for older data that doesn't use the arrays schema
      const itemsList = order.items && order.items.length > 0
        ? order.items.map(item => `<li>${item.quantity}x ${item.food}</li>`).join('')
        : `<li>1x ${order.food} (Legacy)</li>`;

      const totalValue = order.totalAmount ? order.totalAmount : order.price;

      return `
        <div class="order-card p-3 mb-4 shadow-sm" style="border-radius: 12px;">
          <div class="d-flex justify-content-between border-bottom pb-2 mb-2">
            <div>
              <span class="badge bg-danger mb-1">Delivered</span>
              <p class="mb-0 text-muted"><small>${date}</small></p>
            </div>
            <div class="text-end">
              <h5 class="text-danger fw-bold mb-0">₹${totalValue}</h5>
              <small class="text-muted">${order.location}</small>
            </div>
          </div>
          <div>
            <span class="text-dark fw-bold mb-1 d-block">Items Ordered:</span>
            <ul class="text-muted mb-0" style="padding-left: 20px;">
              ${itemsList}
            </ul>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    ordersContainer.innerHTML = '<p class="text-danger">Failed to load orders.</p>';
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  updateCartUI(); // initial cart state refresh
  if (document.getElementById('foodContainer')) loadFoods();
  if (document.getElementById('ordersContainer')) loadOrders();

  const aiForm = document.getElementById('aiAssistantForm');
  if (aiForm) {
    aiForm.addEventListener('submit', handleAssistantSubmit);
  }

  document.querySelectorAll('[data-ai-prompt]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById('aiAssistantInput');
      if (!input) return;
      input.value = button.dataset.aiPrompt;
      const form = document.getElementById('aiAssistantForm');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  });
});
