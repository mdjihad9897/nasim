import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  loadBanners,
  loadCategories,
  loadProducts,
  watchWishlist,
  saveWishlist,
  removeWishlist,
  watchCart,
  addCartItem,
  updateCartQuantity,
  removeCartItem,
  watchOrders,
  watchNotifications,
  createOrder,
  createChat,
  watchMessages,
  sendChatMessage,
  updateTyping,
  markMessagesRead,
  currentUserDocument,
  updateUserDocument,
  uploadProfileImage,
  pushNotification,
  uploadChatImage,
  applyCoupon,
  signOut
} from "./firebase.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const state = {
  user: null,
  profile: null,
  products: [],
  categories: [],
  banners: [],
  wishlist: [],
  cart: [],
  orders: [],
  notifications: [],
  selectedProduct: null,
  chatId: null,
  discount: 0,
  deliveryCharge: 80,
  currentBanner: 0
};

const heroWrapper = $("#heroWrapper");
const heroPagination = $("#heroPagination");
const categoryGrid = $("#categoryGrid");
const productGrid = $("#productGrid");
const featuredProducts = $("#featuredProducts");

const wishlistList = $("#wishlistList");
const cartItems = $("#cartItems");
const orderHistory = $("#orderHistoryList");
const toastContainer = $("#toastContainer");
const searchInput = $("#searchInput");

const categoryFilter = $("#categoryFilter");
const brandFilter = $("#brandFilter");
const priceFilter = $("#priceFilter");
const ratingFilter = $("#ratingFilter");
const stockFilter = $("#stockFilter");
const sortFilter = $("#sortFilter");

const notificationCount = $("#notificationCount");
const subtotalPrice = $("#subtotalPrice");
const deliveryCharge = $("#deliveryCharge");
const discountAmount = $("#discountAmount");
const grandTotal = $("#grandTotal");

const drawer = $("#drawer");
const drawerOverlay = $("#drawerOverlay");
const productModal = $("#productModal");
const cartDrawer = $("#cartDrawer");
const chatPanel = $("#chatPanel");
const checkoutModal = $("#checkoutModal");
const orderSuccessModal = $("#orderSuccessModal");
const productSkeleton = $("#productSkeleton");
const emptyState = $("#emptyState");
const dialog = $("#alertDialog");
const productCount = $("#productCount");

const formatter = new Intl.NumberFormat("en-BD");
const currency = value => `৳${formatter.format(value)}`;

function showToast(message, type = "success") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function showDialog(title, message, callback) {
  if (!$("#dialogTitle")) return;
  $("#dialogTitle").textContent = title;
  $("#dialogMessage").textContent = message;
  if (dialog) dialog.classList.remove("hidden");

  if ($("#dialogConfirm")) {
    $("#dialogConfirm").onclick = () => {
      if (dialog) dialog.classList.add("hidden");
      callback?.();
    };
  }
  if ($("#dialogCancel")) {
    $("#dialogCancel").onclick = () => {
      if (dialog) dialog.classList.add("hidden");
    };
  }
}

function openModal(modal) { if (modal) modal.classList.add("active"); }
function closeModal(modal) { if (modal) modal.classList.remove("active"); }

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  return date.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
}

function renderHeroSlider() {
  if (!heroWrapper || !heroPagination) return;
  heroWrapper.innerHTML = "";
  heroPagination.innerHTML = "";

  state.banners.forEach((banner, index) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide";
    slide.innerHTML = `
      <img loading="lazy" src="${banner.image}" alt="${banner.title}">
      <div class="hero-content">
        <h2>${banner.title}</h2>
        <p>${banner.subtitle}</p>
        <button data-link="${banner.link}">Shop Now</button>
      </div>
    `;
    heroWrapper.appendChild(slide);

    const dot = document.createElement("span");
    if (index === 0) dot.classList.add("active");
    heroPagination.appendChild(dot);
  });
}

function startHeroSlider() {
  setInterval(() => {
    if (state.banners.length === 0 || !heroWrapper) return;
    state.currentBanner++;
    if (state.currentBanner >= state.banners.length) state.currentBanner = 0;
    heroWrapper.style.transform = `translateX(-${state.currentBanner * 100}%)`;
    if (heroPagination) {
      [...heroPagination.children].forEach((dot, index) => {
        dot.classList.toggle("active", index === state.currentBanner);
      });
    }
  }, 5000);
}

function renderCategories() {
  if (!categoryGrid || !categoryFilter) return;
  categoryGrid.innerHTML = "";
  categoryFilter.innerHTML = `<option value="">Category</option>`;

  state.categories.forEach(category => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.innerHTML = `
      <img loading="lazy" src="${category.image}" alt="${category.name}">
      <h4>${category.name}</h4>
    `;
    card.onclick = () => {
      categoryFilter.value = category.id;
      filterProducts();
    };
    categoryGrid.appendChild(card);
    categoryFilter.innerHTML += `<option value="${category.id}">${category.name}</option>`;
  });
}

function productCard(product) {
  return `
    <div class="product-card fade-in">
      <div class="product-image">
        <img loading="lazy" src="${product.images[0]}" alt="${product.name}">
        <div class="discount-badge">${product.discount}%</div>
        <button class="favorite-btn" onclick="toggleWishlist('${product.id}')">
          <svg viewBox="0 0 24 24"><path d="M12 21L4 14A5 5 0 0112 5A5 5 0 0120 14Z"/></svg>
        </button>
      </div>
      <div class="product-info">
        <p class="product-brand">${product.brand}</p>
        <h3 class="product-title">${product.name}</h3>
        <div class="price-box">
          <span class="new-price">${currency(product.salePrice)}</span>
          <span class="old-price">${currency(product.price)}</span>
        </div>
        <div class="rating-box">
          <svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-6 5 2 8-6-4-6 4 2-8-6-5h7z"/></svg>
          <span>${product.rating}</span>
        </div>
        <div class="card-actions">
          <button class="buy-now" onclick="viewProduct('${product.id}')">Details</button>
          <button class="add-cart" onclick="quickAddCart('${product.id}')">Add</button>
        </div>
      </div>
    </div>
  `;
}

function renderProducts(list = state.products) {
  if (productSkeleton) productSkeleton.classList.add("hidden");
  if (!productGrid || !featuredProducts) return;

  productGrid.innerHTML = "";
  featuredProducts.innerHTML = "";
  if (productCount) productCount.textContent = `${list.length} Products`;

  if (!list.length) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }
  if (emptyState) emptyState.classList.add("hidden");

  list.forEach((product, index) => {
    productGrid.insertAdjacentHTML("beforeend", productCard(product));
    if (index < 8) {
      featuredProducts.insertAdjacentHTML("beforeend", productCard(product));
    }
  });
}

function filterProducts() {
  let products = [...state.products];
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  if (keyword) {
    products = products.filter(p => p.name.toLowerCase().includes(keyword) || p.brand.toLowerCase().includes(keyword));
  }
  if (categoryFilter && categoryFilter.value) {
    products = products.filter(p => p.categoryId === categoryFilter.value);
  }
  if (brandFilter && brandFilter.value) {
    products = products.filter(p => p.brand === brandFilter.value);
  }
  if (stockFilter) {
    if (stockFilter.value === "available") products = products.filter(p => p.stock > 0);
    if (stockFilter.value === "unavailable") products = products.filter(p => p.stock === 0);
  }
  if (priceFilter && priceFilter.value) {
    const price = priceFilter.value;
    if (price === "1") products = products.filter(p => p.salePrice <= 500);
    if (price === "2") products = products.filter(p => p.salePrice > 500 && p.salePrice <= 2000);
    if (price === "3") products = products.filter(p => p.salePrice > 2000);
  }
  if (ratingFilter && ratingFilter.value) {
    products = products.filter(p => Number(p.rating) >= Number(ratingFilter.value));
  }
  if (sortFilter) {
    switch (sortFilter.value) {
      case "lowPrice": products.sort((a, b) => a.salePrice - b.salePrice); break;
      case "highPrice": products.sort((a, b) => b.salePrice - a.salePrice); break;
      case "topRated": products.sort((a, b) => b.rating - a.rating); break;
      case "popular": products.sort((a, b) => b.views - a.views); break;
      case "bestSelling": products.sort((a, b) => b.sales - a.sales); break;
      default:
        if (products.length && products[0].createdAt) {
          products.sort((a, b) => (b.createdAt.seconds || 0) - (a.createdAt.seconds || 0));
        }
    }
  }

  renderProducts(products);
}

if (searchInput) searchInput.oninput = filterProducts;
if (categoryFilter) categoryFilter.onchange = filterProducts;
if (brandFilter) brandFilter.onchange = filterProducts;
if (priceFilter) priceFilter.onchange = filterProducts;
if (ratingFilter) ratingFilter.onchange = filterProducts;
if (stockFilter) stockFilter.onchange = filterProducts;
if (sortFilter) sortFilter.onchange = filterProducts;
window.viewProduct = id => {
  const product = state.products.find(item => item.id === id);
  if (!product) return;

  state.selectedProduct = product;
  if ($("#productMainImage")) $("#productMainImage").src = product.images[0];
  if ($("#productTitle")) $("#productTitle").textContent = product.name;
  if ($("#productBadge")) $("#productBadge").textContent = product.badge;
  if ($("#productBrand")) $("#productBrand").textContent = product.brand;
  if ($("#productSKU")) $("#productSKU").textContent = product.sku;
  if ($("#productStock")) $("#productStock").textContent = product.stock > 0 ? "In Stock" : "Out Of Stock";
  if ($("#productDiscountPrice")) $("#productDiscountPrice").textContent = currency(product.salePrice);
  if ($("#productOriginalPrice")) $("#productOriginalPrice").textContent = currency(product.price);
  if ($("#productDescription")) $("#productDescription").textContent = product.description;
  if ($("#productQty")) $("#productQty").value = 1;

  const starContainer = $("#productStars");
  if (starContainer) {
    starContainer.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      starContainer.innerHTML += `
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="${i <= Math.round(product.rating) ? "#fbbf24" : "#d1d5db"}" d="M12 2l3 7h7l-6 5 2 8-6-4-6 4 2-8-6-5h7z"/>
        </svg>
      `;
    }
  }

  if ($("#productReviewCount")) $("#productReviewCount").textContent = `${product.reviewCount} Reviews`;
  const specs = $("#productSpecifications");
  if (specs) {
    specs.innerHTML = "";
    if (product.specifications) {
      Object.entries(product.specifications).forEach(([key, value]) => {
        specs.innerHTML += `<div class="spec-row"><strong>${key}</strong><span>${value}</span></div>`;
      });
    }
  }

  const thumbs = $("#productThumbnails");
  if (thumbs) {
    thumbs.innerHTML = "";
    product.images.forEach((image, index) => {
      const img = document.createElement("img");
      img.src = image;
      if (index === 0) img.classList.add("active");
      img.onclick = () => {
        $("#productMainImage").src = image;
        thumbs.querySelectorAll("img").forEach(item => item.classList.remove("active"));
        img.classList.add("active");
      };
      thumbs.appendChild(img);
    });
  }

  openModal(productModal);
};

if ($("#closeProductModal")) $("#closeProductModal").onclick = () => closeModal(productModal);
if ($("#qtyPlus")) $("#qtyPlus").onclick = () => { const input = $("#productQty"); if (input) input.value = Number(input.value) + 1; };
if ($("#qtyMinus")) $("#qtyMinus").onclick = () => { const input = $("#productQty"); if (input && Number(input.value) > 1) input.value = Number(input.value) - 1; };

window.toggleWishlist = async productId => {
  if (!state.user) { location.href = "login.html"; return; }
  const exists = state.wishlist.find(item => item.productId === productId);
  if (exists) {
    await removeWishlist(state.user.uid, productId);
    showToast("Removed from wishlist", "alert");
  } else {
    await saveWishlist(state.user.uid, productId);
    showToast("Added to wishlist");
  }
};

window.quickAddCart = async productId => {
  if (!state.user) { location.href = "login.html"; return; }
  await addCartItem(state.user.uid, productId, 1);
  showToast("Product added to cart");
};

function renderCart() {
  if (!cartItems) return;
  cartItems.innerHTML = "";
  let subtotal = 0;

  state.cart.forEach(item => {
    const product = state.products.find(p => p.id === item.productId);
    if (!product) return;
    subtotal += product.salePrice * item.quantity;
    cartItems.innerHTML += `
      <div class="cart-item">
        <img src="${product.images[0]}">
        <div>
          <h4>${product.name}</h4>
          <p>${currency(product.salePrice)}</p>
          <div class="quantity-box">
            <button onclick="changeQty('${product.id}',${item.quantity - 1})">-</button>
            <input value="${item.quantity}" readonly>
            <button onclick="changeQty('${product.id}',${item.quantity + 1})">+</button>
          </div>
          <button onclick="deleteCart('${product.id}')">Remove</button>
        </div>
      </div>
    `;
  });

  const total = subtotal + state.deliveryCharge - state.discount;
  if (subtotalPrice) subtotalPrice.textContent = currency(subtotal);
  if (deliveryCharge) deliveryCharge.textContent = currency(state.deliveryCharge);
  if (discountAmount) discountAmount.textContent = currency(state.discount);
  if (grandTotal) grandTotal.textContent = currency(total);
}

window.changeQty = async (id, qty) => {
  if (!state.user) return;
  if (qty <= 0) { deleteCart(id); return; }
  await updateCartQuantity(state.user.uid, id, qty);
};

window.deleteCart = async (id) => {
  if (!state.user) return;
  await removeCartItem(state.user.uid, id);
  showToast("Cart updated");
};

// Auth State & UI Updates
onAuthStateChanged(auth, async (user) => {
  state.user = user;

  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        state.profile = userSnap.data();
        updateProfileUI(user, state.profile);
      } else {
        updateProfileUI(user, null);
      }
    } catch (e) {
      console.error("User profile load error:", e);
    }

    state.chatId = user.uid;
    createChat(user.uid);
    watchMessages(user.uid, renderMessages);
    watchWishlist(user.uid, items => { state.wishlist = items; renderWishlist(); });
    watchCart(user.uid, items => { state.cart = items; renderCart(); });
    watchOrders(user.uid, orders => { state.orders = orders; renderOrders(); });
    watchNotifications(user.uid, notifications => { state.notifications = notifications; renderNotifications(notifications); });
  } else {
    resetProfileUI();
  }
});

function updateProfileUI(user, profile) {
  const name = (profile && profile.name) || user.displayName || "User";
  const phone = (profile && profile.phone) || "";
  const address = (profile && profile.address) || "";
  const photo = (profile && profile.photo) || user.photoURL || "";

  if ($("#profileName")) $("#profileName").textContent = name;
  if ($("#profilePhone")) $("#profilePhone").textContent = phone;
  if ($("#drawerUserName")) $("#drawerUserName").textContent = name;
  if ($("#drawerUserPhone")) $("#drawerUserPhone").textContent = phone;
  if ($("#editName")) $("#editName").value = name;
  if ($("#editPhone")) $("#editPhone").value = phone;
  if ($("#editAddress")) $("#editAddress").value = address;
  if ($("#profileImage")) $("#profileImage").src = photo;
  if ($("#drawerProfileImage")) $("#drawerProfileImage").src = photo;
}

function resetProfileUI() {
  state.profile = null;
  if ($("#profileName")) $("#profileName").textContent = "Guest User";
  if ($("#profilePhone")) $("#profilePhone").textContent = "";
  if ($("#drawerUserName")) $("#drawerUserName").textContent = "Guest User";
  if ($("#drawerUserPhone")) $("#drawerUserPhone").textContent = "";
  if ($("#editName")) $("#editName").value = "";
  if ($("#editPhone")) $("#editPhone").value = "";
  if ($("#editAddress")) $("#editAddress").value = "";
}

function renderMessages(messages) {
  const container = $("#chatMessages");
  if (!container) return;
  container.innerHTML = "";
  messages.forEach(message => {
    const mine = message.sender === state.user?.uid;
    const item = document.createElement("div");
    item.className = `message ${mine ? "user" : "admin"}`;
    if (message.type === "image") {
      item.innerHTML = `<img src="${message.image}" style="width:220px;border-radius:12px;display:block;"><span class="message-time">${formatDate(message.createdAt)}</span>`;
    } else {
      item.innerHTML = `<div>${message.text}</div><span class="message-time">${formatDate(message.createdAt)}</span>`;
    }
    container.appendChild(item);
  });
  container.scrollTop = container.scrollHeight;
  if (state.chatId) markMessagesRead(state.chatId);
}

function renderOrders() {
  if (!orderHistory) return;
  orderHistory.innerHTML = "";
  state.orders.forEach(order => {
    orderHistory.innerHTML += `<div class="history-card"><div><h4>${order.orderNumber}</h4><p>${currency(order.total)}</p></div><div>${order.status}</div></div>`;
  });
}

function renderWishlist() {
  if (!wishlistList) return;
  wishlistList.innerHTML = "";
  state.wishlist.forEach(item => {
    const product = state.products.find(p => p.id === item.productId);
    if (!product) return;
    wishlistList.innerHTML += `<div class="wishlist-card"><div><strong>${product.name}</strong><p>${currency(product.salePrice)}</p></div><button onclick="toggleWishlist('${product.id}')">Remove</button></div>`;
  });
}

function renderNotifications(list) {
  if (notificationCount) notificationCount.textContent = list.length;
}

function initializeApp() {
  loadBanners(list => {
    state.banners = list;
    renderHeroSlider();
    startHeroSlider();
  });

  loadCategories(list => {
    state.categories = list;
    renderCategories();
  });

  loadProducts(products => {
    state.products = products;
    if (productSkeleton) productSkeleton.classList.add("hidden");
    renderProducts();

    if (brandFilter) {
      const brands = [...new Set(products.map(item => item.brand))];
      brandFilter.innerHTML = '<option value="">Brand</option>';
      brands.forEach(brand => {
        brandFilter.innerHTML += `<option value="${brand}">${brand}</option>`;
      });
    }
  });
}

window.addEventListener("load", initializeApp);

// Navigation Logic
document.querySelectorAll(".nav-item").forEach(button => {
  button.onclick = (e) => {
    const page = button.dataset.page;

    if (page === "profile" && !state.user) {
      e.preventDefault();
      location.href = "login.html";
      return;
    }

    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    if ($("main")) $("main").classList.add("hidden");
    if ($("#profilePage")) $("#profilePage").classList.add("hidden");
    if (cartDrawer) cartDrawer.classList.remove("active");
    if (chatPanel) chatPanel.classList.remove("active");

    if (page === "home") {
      if ($("main")) $("main").classList.remove("hidden");
    } else if (page === "profile") {
      if ($("#profilePage")) $("#profilePage").classList.remove("hidden");
    } else if (page === "wishlist") {
      if ($("#profilePage")) $("#profilePage").classList.remove("hidden");
      setTimeout(() => { if (wishlistList) wishlistList.scrollIntoView({ behavior: "smooth" }); }, 100);
    } else if (page === "cart") {
      if ($("main")) $("main").classList.remove("hidden");
      if (cartDrawer) cartDrawer.classList.add("active");
    } else if (page === "chat") {
      if ($("main")) $("main").classList.remove("hidden");
      if (chatPanel) chatPanel.classList.add("active");
    }
  };
});

// Sidebar & Settings Action Logic
function closeDrawer() {
  if (drawer) drawer.classList.remove("active");
  if (drawerOverlay) drawerOverlay.classList.remove("active");
}

function bindMenuClick(selectors, handler) {
  selectors.forEach(sel => {
    const el = $(sel);
    if (el) {
      el.onclick = (e) => {
        e.preventDefault();
        closeDrawer();
        handler();
      };
    }
  });
}

// My Profile
bindMenuClick(["#menuProfile", "[data-action='profile']"], () => {
  if (!state.user) { location.href = "login.html"; return; }
  const btn = document.querySelector('[data-page="profile"]');
  if (btn) btn.click();
});

// My Orders
bindMenuClick(["#menuOrders", "[data-action='orders']"], () => {
  if (!state.user) { location.href = "login.html"; return; }
  const btn = document.querySelector('[data-page="profile"]');
  if (btn) btn.click();
  setTimeout(() => { if (orderHistory) orderHistory.scrollIntoView({ behavior: "smooth" }); }, 150);
});

// Wishlist
bindMenuClick(["#menuWishlist", "[data-action='wishlist']"], () => {
  if (!state.user) { location.href = "login.html"; return; }
  const btn = document.querySelector('[data-page="wishlist"]');
  if (btn) btn.click();
});

// Chat
bindMenuClick(["#menuChat", "[data-action='chat']"], () => {
  if (!state.user) { location.href = "login.html"; return; }
  const btn = document.querySelector('[data-page="chat"]');
  if (btn) btn.click();
});

// Notifications
bindMenuClick(["#menuNotifications", "#notificationBtn", "[data-action='notifications']"], () => {
  const count = state.notifications.length;
  showToast(count > 0 ? `You have ${count} new notifications` : "No new notifications");
});

// Settings
bindMenuClick(["#menuSettings", "#menuSetting", "[data-action='settings']"], () => {
  if (!state.user) { location.href = "login.html"; return; }
  const btn = document.querySelector('[data-page="profile"]');
  if (btn) btn.click();
  showToast("You can edit your profile & address here");
});

// Help Center
bindMenuClick(["#menuHelp", "[data-action='help']"], () => {
  showDialog("Help Center", "Need assistance? Click 'Chat' to speak with our support team instantly!");
});

// Contact Us
bindMenuClick(["#menuContact", "[data-action='contact']"], () => {
  showDialog("Contact Us", "Customer Care Hotline: +880 1700-000000\nEmail: support@store.com");
});

// About
bindMenuClick(["#menuAbout", "[data-action='about']"], () => {
  showDialog("About Us", "Welcome to our E-Commerce Store! We bring high-quality products directly to your doorstep with fast delivery.");
});

// Logout
bindMenuClick(["#menuLogout", "#logoutBtn", "[data-action='logout']"], () => {
  if (!state.user) {
    location.href = "login.html";
    return;
  }
  showDialog("Logout", "Are you sure you want to log out?", async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully");
      setTimeout(() => location.href = "login.html", 500);
    } catch (e) {
      console.error(e);
      showToast("Error logging out", "alert");
    }
  });
});

// Drawer Controls
if ($("#mobileMenuBtn")) $("#mobileMenuBtn").onclick = () => { drawer.classList.add("active"); drawerOverlay.classList.add("active"); };
if ($("#moreMenuBtn")) $("#moreMenuBtn").onclick = () => { drawer.classList.add("active"); drawerOverlay.classList.add("active"); };
if ($("#drawerClose")) $("#drawerClose").onclick = () => closeDrawer();
if (drawerOverlay) drawerOverlay.onclick = () => closeDrawer();
if ($("#closeCart")) $("#closeCart").onclick = () => cartDrawer.classList.remove("active");
if ($("#closeChatPanel")) $("#closeChatPanel").onclick = () => chatPanel.classList.remove("active");

if ($("#saveProfileButton")) {
  $("#saveProfileButton").onclick = async () => {
    if (!state.user) return;
    await updateUserDocument(state.user.uid, {
      name: $("#editName").value,
      phone: $("#editPhone").value,
      address: $("#editAddress").value
    });
    showToast("Profile saved successfully!");
  };
}