import {
  auth, db, collections, onAuthStateChanged, collection, doc, addDoc, 
  updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, where, 
  onSnapshot, serverTimestamp, signOut
} from "./firebase.js";

// Helper Functions
const $ = selector => document.querySelector(selector);

const state = {
  products: [],
  categories: [],
  orders: [],
  customers: [],
  banners: [],
  coupons: [],
  chats: [],
  notifications: []
};

function currency(val) { 
  return new Intl.NumberFormat("en-BD").format(val || 0); 
}

function toast(msg) {
  let container = $("#toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2";
    document.body.appendChild(container);
  }
  const div = document.createElement("div");
  div.className = "bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl text-sm font-medium border border-slate-700 animate-bounce";
  div.textContent = msg;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

// Realtime Data Syncing for All Sections
function initDataSync() {
  // 1. Products
  onSnapshot(query(collection(db, collections.products), orderBy("createdAt", "desc")), snap => {
    state.products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts();
    updateDashboard();
  }, err => console.error("Products Sync Error:", err));

  // 2. Categories
  onSnapshot(query(collection(db, collections.categories), orderBy("name")), snap => {
    state.categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCategories();
    populateCategoryDropdown();
  }, err => console.error("Categories Sync Error:", err));

  // 3. Orders
  onSnapshot(query(collection(db, collections.orders), orderBy("createdAt", "desc")), snap => {
    state.orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOrders();
    updateDashboard();
  }, err => console.error("Orders Sync Error:", err));

  // 4. Customers / Users
  onSnapshot(query(collection(db, collections.users), orderBy("createdAt", "desc")), snap => {
    state.customers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCustomers();
    updateDashboard();
  }, err => console.error("Customers Sync Error:", err));

  // 5. Banners
  onSnapshot(query(collection(db, collections.banners)), snap => {
    state.banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderBanners();
  }, err => console.error("Banners Sync Error:", err));

  // 6. Coupons
  onSnapshot(query(collection(db, collections.coupons), orderBy("createdAt", "desc")), snap => {
    state.coupons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCoupons();
  }, err => console.error("Coupons Sync Error:", err));

  // 7. Live Chat
  onSnapshot(query(collection(db, collections.chats), orderBy("lastUpdated", "desc")), snap => {
    state.chats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderChats();
  }, err => console.error("Chats Sync Error:", err));

  // 8. Notifications
  onSnapshot(query(collection(db, collections.notifications), orderBy("createdAt", "desc")), snap => {
    state.notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderNotifications();
  }, err => console.error("Notifications Sync Error:", err));
}

// Dashboard Calculations
function updateDashboard() {
  const totalRev = state.orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  if ($("#totalRevenue")) $("#totalRevenue").textContent = `৳${currency(totalRev)}`;
  if ($("#totalOrders")) $("#totalOrders").textContent = state.orders.length;
  if ($("#totalProducts")) $("#totalProducts").textContent = state.products.length;
  if ($("#totalCustomers")) $("#totalCustomers").textContent = state.customers.length;
}

function populateCategoryDropdown() {
  const select = $("#productCategory");
  if (!select) return;
  select.innerHTML = `<option value="">Select Category</option>` + 
    state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}
// Render Products
function renderProducts() {
  const tbody = $("#productTable");
  if (!tbody) return;
  tbody.innerHTML = state.products.map(p => `
    <tr class="border-b border-slate-700 hover:bg-slate-800/50">
      <td class="p-3"><img src="${p.images?.[0] || 'https://via.placeholder.com/40'}" class="w-10 h-10 object-cover rounded-lg"></td>
      <td class="p-3 font-medium text-white">${p.name || ''}</td>
      <td class="p-3">${p.brand || 'N/A'}</td>
      <td class="p-3">${p.stock || 0}</td>
      <td class="p-3 font-semibold text-emerald-400">৳${currency(p.price)}</td>
      <td class="p-3">
        <button onclick="editProduct('${p.id}')" class="text-indigo-400 hover:text-indigo-300 mr-3">Edit</button>
        <button onclick="deleteProduct('${p.id}')" class="text-rose-400 hover:text-rose-300">Delete</button>
      </td>
    </tr>
  `).join("");
}

// Render Categories
function renderCategories() {
  const tbody = $("#categoryTable");
  if (!tbody) return;
  tbody.innerHTML = state.categories.map(c => `
    <tr class="border-b border-slate-700 hover:bg-slate-800/50">
      <td class="p-3"><img src="${c.image || 'https://via.placeholder.com/40'}" class="w-10 h-10 object-cover rounded-lg"></td>
      <td class="p-3 font-medium text-white">${c.name || ''}</td>
      <td class="p-3">
        <button onclick="deleteCategory('${c.id}')" class="text-rose-400 hover:text-rose-300">Delete</button>
      </td>
    </tr>
  `).join("");
}

// Render Orders
function renderOrders() {
  const tbody = $("#orderTable");
  if (!tbody) return;
  tbody.innerHTML = state.orders.map(o => `
    <tr class="border-b border-slate-700 hover:bg-slate-800/50">
      <td class="p-3 font-mono text-xs text-indigo-300">#${o.id.substring(0,6)}</td>
      <td class="p-3">${o.customerName || 'Guest'}</td>
      <td class="p-3">
        <span class="px-2 py-1 rounded text-xs ${o.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">
          ${o.status || 'Pending'}
        </span>
      </td>
      <td class="p-3 font-bold">৳${currency(o.total)}</td>
      <td class="p-3">
        <button onclick="updateOrderStatus('${o.id}')" class="text-indigo-400 hover:underline">Change Status</button>
      </td>
    </tr>
  `).join("");
}

// Render Customers
function renderCustomers() {
  const tbody = $("#customerTable");
  if (!tbody) return;
  tbody.innerHTML = state.customers.map(c => `
    <tr class="border-b border-slate-700">
      <td class="p-3 text-white">${c.name || 'Anonymous'}</td>
      <td class="p-3">${c.email || 'N/A'}</td>
      <td class="p-3">${c.phone || 'N/A'}</td>
    </tr>
  `).join("");
}

// Render Banners
function renderBanners() {
  const tbody = $("#bannerTable");
  if (!tbody) return;
  tbody.innerHTML = state.banners.map(b => `
    <tr class="border-b border-slate-700">
      <td class="p-3"><img src="${b.imageUrl}" class="h-12 w-24 object-cover rounded"></td>
      <td class="p-3">${b.title || 'No Title'}</td>
      <td class="p-3"><button onclick="deleteBanner('${b.id}')" class="text-rose-400">Delete</button></td>
    </tr>
  `).join("");
}

// Render Coupons
function renderCoupons() {
  const tbody = $("#couponTable");
  if (!tbody) return;
  tbody.innerHTML = state.coupons.map(cp => `
    <tr class="border-b border-slate-700">
      <td class="p-3 font-mono text-emerald-400">${cp.code}</td>
      <td class="p-3">${cp.discount}%</td>
      <td class="p-3"><button onclick="deleteCoupon('${cp.id}')" class="text-rose-400">Delete</button></td>
    </tr>
  `).join("");
}

// Render Live Chats
function renderChats() {
  const list = $("#chatList");
  if (!list) return;
  list.innerHTML = state.chats.map(ch => `
    <div onclick="selectChat('${ch.id}')" class="p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 mb-2">
      <p class="font-bold text-sm text-white">${ch.userName || 'User'}</p>
      <p class="text-xs text-slate-400 truncate">${ch.lastMessage || ''}</p>
    </div>
  `).join("");
}

// Render Notifications
function renderNotifications() {
  const list = $("#notificationList");
  if (!list) return;
  list.innerHTML = state.notifications.map(n => `
    <div class="p-3 bg-slate-800/80 rounded-lg mb-2 text-sm text-slate-200">
      <p class="font-semibold text-white">${n.title || 'Alert'}</p>
      <p class="text-xs text-slate-400">${n.message || ''}</p>
    </div>
  `).join("");
}

// --- PRODUCT ACTIONS ---
window.addProduct = async () => {
  try {
    const name = $("#productName")?.value.trim();
    const rawImages = $("#productImages")?.value.trim();
    const price = $("#productPrice")?.value;
    const stock = $("#productStock")?.value;

    if (!name || !rawImages || !price) {
      toast("⚠️ নাম, ছবি ও মূল্য দেয়া বাধ্যতামূলক!");
      return;
    }

    const images = rawImages.split(",").map(url => url.trim()).filter(Boolean);

    await addDoc(collection(db, collections.products), {
      name,
      brand: $("#productBrand")?.value.trim() || "",
      categoryId: $("#productCategory")?.value || "",
      description: $("#productDescription")?.value.trim() || "",
      price: Number(price) || 0,
      salePrice: Number($("#productSalePrice")?.value) || Number(price),
      stock: Number(stock) || 0,
      images,
      createdAt: serverTimestamp()
    });

    toast("✅ প্রোডাক্ট যোগ সফল হয়েছে!");
    clearProductForm();
  } catch (err) {
    console.error(err);
    toast("❌ ভুল হয়েছে: " + err.message);
  }
};

window.editProduct = (id) => {
  const p = state.products.find(item => item.id === id);
  if (!p) return;
  $("#productId").value = p.id;
  $("#productName").value = p.name || "";
  $("#productBrand").value = p.brand || "";
  $("#productPrice").value = p.price || 0;
  $("#productStock").value = p.stock || 0;
  $("#productImages").value = p.images ? p.images.join(", ") : "";
  $("#productDescription").value = p.description || "";
};

window.updateProduct = async () => {
  const id = $("#productId")?.value;
  if (!id) return toast("⚠️ এডিটের জন্য কোনো প্রোডাক্ট সিলেক্ট করেননি!");

  try {
    await updateDoc(doc(db, collections.products, id), {
      name: $("#productName").value.trim(),
      brand: $("#productBrand").value.trim(),
      price: Number($("#productPrice").value) || 0,
      stock: Number($("#productStock").value) || 0,
      images: $("#productImages").value.split(",").map(s => s.trim()).filter(Boolean),
      description: $("#productDescription").value.trim(),
      updatedAt: serverTimestamp()
    });
    toast("✅ প্রোডাক্ট আপডেট সম্পন্ন হয়েছে!");
    clearProductForm();
  } catch (err) {
    toast("❌ আপডেট ব্যর্থ: " + err.message);
  }
};

window.deleteProduct = async (id) => {
  if (confirm("আপনি কি নিশ্চিত এই প্রোডাক্টটি ডিলেট করবেন?")) {
    await deleteDoc(doc(db, collections.products, id));
    toast("🗑️ প্রোডাক্ট মুছে ফেলা হয়েছে!");
  }
};

function clearProductForm() {
  if($("#productId")) $("#productId").value = "";
  if($("#productName")) $("#productName").value = "";
  if($("#productBrand")) $("#productBrand").value = "";
  if($("#productPrice")) $("#productPrice").value = "";
  if($("#productStock")) $("#productStock").value = "";
  if($("#productImages")) $("#productImages").value = "";
  if($("#productDescription")) $("#productDescription").value = "";
}

// --- CATEGORY ACTIONS ---
window.addCategory = async () => {
  const name = $("#categoryName")?.value.trim();
  const image = $("#categoryImage")?.value.trim();
  if (!name) return toast("⚠️ ক্যাটাগরির নাম দিন!");

  await addDoc(collection(db, collections.categories), { name, image: image || "" });
  toast("✅ ক্যাটাগরি সফলভাবে তৈরি হয়েছে!");
  $("#categoryName").value = "";
  if($("#categoryImage")) $("#categoryImage").value = "";
};

window.deleteCategory = async (id) => {
  if (confirm("ক্যাটাগরি মুছে ফেলতে চান?")) {
    await deleteDoc(doc(db, collections.categories, id));
    toast("🗑️ ক্যাটাগরি ডিলেট হয়েছে!");
  }
};

// --- BANNER ACTIONS ---
window.addBanner = async () => {
  const imageUrl = $("#bannerImage")?.value.trim();
  const title = $("#bannerTitle")?.value.trim();
  if (!imageUrl) return toast("⚠️ ব্যানারের ছবি লিঙক দিন!");

  await addDoc(collection(db, collections.banners), { imageUrl, title: title || "" });
  toast("✅ ব্যানার এড হয়েছে!");
  $("#bannerImage").value = "";
};

window.deleteBanner = async (id) => {
  await deleteDoc(doc(db, collections.banners, id));
  toast("🗑️ ব্যানার ডিলেট হয়েছে!");
};

// --- COUPON ACTIONS ---
window.addCoupon = async () => {
  const code = $("#couponCode")?.value.trim();
  const discount = $("#couponDiscount")?.value;
  if (!code || !discount) return toast("⚠️ কুপন কোড এবং ডিসকাউন্ট দিন!");

  await addDoc(collection(db, collections.coupons), {
    code: code.toUpperCase(),
    discount: Number(discount),
    createdAt: serverTimestamp()
  });
  toast("✅ কুপন যুক্ত করা হয়েছে!");
};

window.deleteCoupon = async (id) => {
  await deleteDoc(doc(db, collections.coupons, id));
  toast("🗑️ কুপন সরানো হয়েছে!");
};

// --- AUTHENTICATION & INITIALIZATION ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    initDataSync();
  } else {
    window.location.href = "login.html";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  $("#adminLogout")?.addEventListener("click", () => signOut(auth));
});
