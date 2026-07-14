import {
  auth,
  db,
  collections,
  onAuthStateChanged,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp
} from "./firebase.js";

// Helper Functions
const $ = selector => document.querySelector(selector);

function currency(value) {
  return new Intl.NumberFormat("en-BD").format(value || 0);
}

function toast(message) {
  const container = document.querySelector("#toastContainer");
  if (!container) {
    alert(message);
    return;
  }
  const div = document.createElement("div");
  div.className = "toast";
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// Global State
const state = {
  products: [],
  categories: [],
  orders: [],
  customers: [],
  banners: [],
  coupons: [],
  notifications: [],
  chats: []
};

// Main Dashboard Load Function
function loadDashboard() {
  watchProducts();
  watchCategories();
  watchOrders();
  watchUsers();
  watchCoupons();
  watchBanners();
  watchChats();
}

// ---------------- Realtime Watchers ----------------

function watchProducts() {
  onSnapshot(
    query(collection(db, collections.products), orderBy("createdAt", "desc")),
    snapshot => {
      state.products = [];
      snapshot.forEach(item => {
        state.products.push({ id: item.id, ...item.data() });
      });
      renderProducts();
      dashboardSummary();
    },
    error => console.error("Error watching products:", error)
  );
}

function watchCategories() {
  onSnapshot(
    query(collection(db, collections.categories), orderBy("name")),
    snapshot => {
      state.categories = [];
      snapshot.forEach(item => {
        state.categories.push({ id: item.id, ...item.data() });
      });
      renderCategories();
      populateCategoryDropdown();
      dashboardSummary();
    },
    error => console.error("Error watching categories:", error)
  );
}

function populateCategoryDropdown() {
  const select = $("#productCategory");
  if (!select) return;
  
  select.innerHTML = '<option value="">ক্যাটাগরি বেছে নিন</option>';
  state.categories.forEach(category => {
    select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
  });
}

function watchOrders() {
  onSnapshot(
    query(collection(db, collections.orders), orderBy("createdAt", "desc")),
    snapshot => {
      state.orders = [];
      snapshot.forEach(item => {
        state.orders.push({ id: item.id, ...item.data() });
      });
      renderOrders();
      dashboardSummary();
    },
    error => console.error("Error watching orders:", error)
  );
}

function watchUsers() {
  onSnapshot(
    query(collection(db, collections.users), orderBy("createdAt", "desc")),
    snapshot => {
      state.customers = [];
      snapshot.forEach(item => {
        state.customers.push({ id: item.id, ...item.data() });
      });
      renderCustomers();
      dashboardSummary();
    },
    error => console.error("Error watching users:", error)
  );
}

function watchCoupons() {
  onSnapshot(
    query(collection(db, collections.coupons), orderBy("createdAt", "desc")),
    snapshot => {
      state.coupons = [];
      snapshot.forEach(item => {
        state.coupons.push({ id: item.id, ...item.data() });
      });
      renderCoupons();
    },
    error => console.error("Error watching coupons:", error)
  );
}

function watchBanners() {
  onSnapshot(
    query(collection(db, collections.banners), orderBy("priority")),
    snapshot => {
      state.banners = [];
      snapshot.forEach(item => {
        state.banners.push({ id: item.id, ...item.data() });
      });
      renderBanners();
    },
    error => console.error("Error watching banners:", error)
  );
}

function watchChats() {
  onSnapshot(
    query(collection(db, collections.chats), orderBy("updatedAt", "desc")),
    snapshot => {
      state.chats = [];
      snapshot.forEach(item => {
        state.chats.push({ id: item.id, ...item.data() });
      });
      renderChats();
    },
    error => console.error("Error watching chats:", error)
  );
}

// ---------------- Dashboard Summary ----------------

function dashboardSummary() {
  const revenue = state.orders.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  if ($("#totalRevenue")) $("#totalRevenue").textContent = "৳" + currency(revenue);
  if ($("#totalOrders")) $("#totalOrders").textContent = state.orders.length;
  if ($("#totalProducts")) $("#totalProducts").textContent = state.products.length;
  if ($("#totalCustomers")) $("#totalCustomers").textContent = state.customers.length;
  if ($("#lowStock")) $("#lowStock").textContent = state.products.filter(item => item.stock <= 5 && item.stock > 0).length;
  if ($("#outOfStock")) $("#outOfStock").textContent = state.products.filter(item => item.stock <= 0).length;
}

// ---------------- Render Functions ----------------

function renderProducts() {
  const table = $("#productTable");
  if (!table) return;
  table.innerHTML = "";
  state.products.forEach(product => {
    const img = (product.images && product.images.length > 0) ? product.images[0] : '';
    table.innerHTML += `
      <tr>
        <td><img src="${img}" width="50" height="50"></td>
        <td>${product.name || ''}</td>
        <td>${product.brand || ''}</td>
        <td>${product.stock || 0}</td>
        <td>৳${currency(product.salePrice || product.price || 0)}</td>
        <td>
          <button class="btn" onclick="editProduct('${product.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

function renderCategories() {
  const table = $("#categoryTable");
  if (!table) return;
  table.innerHTML = "";
  state.categories.forEach(category => {
    table.innerHTML += `
      <tr>
        <td><img src="${category.image || ''}" width="45" height="45"></td>
        <td>${category.name || ''}</td>
        <td>${category.subCategoryCount || 0}</td>
        <td>
          <button class="btn" onclick="editCategory('${category.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteCategory('${category.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

function renderOrders() {
  const table = $("#orderTable");
  if (!table) return;
  table.innerHTML = "";
  state.orders.forEach(order => {
    table.innerHTML += `
      <tr>
        <td>${order.orderNumber || ''}</td>
        <td>${order.customerName || ''}</td>
        <td>${order.paymentMethod || ''}</td>
        <td>${order.paymentStatus || ''}</td>
        <td>${order.deliveryStatus || ''}</td>
        <td>${order.status || ''}</td>
        <td>৳${currency(order.total)}</td>
        <td><button class="btn" onclick="viewOrder('${order.id}')">View</button></td>
      </tr>
    `;
  });
}

function renderCustomers() {
  const table = $("#customerTable");
  if (!table) return;
  table.innerHTML = "";
  state.customers.forEach(user => {
    table.innerHTML += `
      <tr>
        <td><img src="${user.photo || ''}" width="40" height="40" style="border-radius:50%"></td>
        <td>${user.name || ''}</td>
        <td>${user.phone || ''}</td>
        <td>${user.email || ''}</td>
        <td><button class="btn" onclick="viewCustomer('${user.id}')">Details</button></td>
      </tr>
    `;
  });
}

function renderCoupons() {
  const table = $("#couponTable");
  if (!table) return;
  table.innerHTML = "";
  state.coupons.forEach(coupon => {
    table.innerHTML += `
      <tr>
        <td>${coupon.code || ''}</td>
        <td>৳${coupon.amount || 0}</td>
        <td>${coupon.expiryDate || ''}</td>
        <td>
          <button class="btn" onclick="editCoupon('${coupon.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteCoupon('${coupon.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

function renderBanners() {
  const table = $("#bannerTable");
  if (!table) return;
  table.innerHTML = "";
  state.banners.forEach(banner => {
    table.innerHTML += `
      <tr>
        <td><img src="${banner.image || ''}" width="90" height="45"></td>
        <td>${banner.title || ''}</td>
        <td>${banner.priority || 0}</td>
        <td>
          <button class="btn" onclick="editBanner('${banner.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteBanner('${banner.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

function renderChats() {
  const table = $("#chatTable");
  if (!table) return;
  table.innerHTML = "";
  state.chats.forEach(chat => {
    table.innerHTML += `
      <tr>
        <td>${chat.uid || ''}</td>
        <td>${chat.lastMessage || ""}</td>
        <td>${chat.online ? "Online" : "Offline"}</td>
        <td>${chat.typing ? "Typing" : "Idle"}</td>
        <td><button class="btn" onclick="openChat('${chat.id}')">Open</button></td>
      </tr>
    `;
  });
}

// ---------------- Action Functions (Exposed to Window) ----------------

// 1. PRODUCTS
window.addProduct = async function() {
  const name = $("#productName")?.value.trim();
  const price = Number($("#productPrice")?.value || 0);
  const categoryId = $("#productCategory")?.value;
  const imageUrl = $("#productImages")?.value.trim();

  if (!name || !price || !categoryId) {
    alert("অনুগ্রহ করে নাম, মূল্য এবং ক্যাটাগরি পূরণ করুন!");
    return;
  }

  try {
    await addDoc(collection(db, collections.products), {
      name,
      description: $("#productDescription") ? $("#productDescription").value.trim() : "",
      brand: $("#productBrand") ? $("#productBrand").value.trim() : "",
      categoryId,
      sku: $("#productSku") ? $("#productSku").value.trim() : "",
      price,
      salePrice: Number($("#productSalePrice")?.value || price),
      stock: Number($("#productStock")?.value || 0),
      rating: 0,
      reviewCount: 0,
      sales: 0,
      views: 0,
      status: "active",
      badge: $("#productBadge") ? $("#productBadge").value.trim() : "",
      images: imageUrl ? [imageUrl] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("প্রোডাক্ট যোগ করা হয়েছে!");
    if($("#productForm")) $("#productForm").reset();
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.editProduct = async function(id) {
  const snapshot = await getDoc(doc(db, collections.products, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if ($("#productId")) $("#productId").value = id;
  if ($("#productName")) $("#productName").value = data.name || "";
  if ($("#productDescription")) $("#productDescription").value = data.description || "";
  if ($("#productBrand")) $("#productBrand").value = data.brand || "";
  if ($("#productCategory")) $("#productCategory").value = data.categoryId || "";
  if ($("#productSku")) $("#productSku").value = data.sku || "";
  if ($("#productPrice")) $("#productPrice").value = data.price || 0;
  if ($("#productSalePrice")) $("#productSalePrice").value = data.salePrice || 0;
  if ($("#productStock")) $("#productStock").value = data.stock || 0;
  if ($("#productBadge")) $("#productBadge").value = data.badge || "";
  if ($("#productImages")) $("#productImages").value = (data.images && data.images.length > 0) ? data.images[0] : "";
};

window.updateProduct = async function() {
  const id = $("#productId")?.value;
  if (!id) {
    alert("এডিট করার জন্য কোনো প্রোডাক্ট নির্বাচন করা হয়নি!");
    return;
  }
  const imageUrl = $("#productImages")?.value.trim();

  try {
    await updateDoc(doc(db, collections.products, id), {
      name: $("#productName").value,
      description: $("#productDescription") ? $("#productDescription").value : "",
      brand: $("#productBrand") ? $("#productBrand").value : "",
      categoryId: $("#productCategory").value,
      sku: $("#productSku") ? $("#productSku").value : "",
      price: Number($("#productPrice").value),
      salePrice: Number($("#productSalePrice")?.value || $("#productPrice").value),
      stock: Number($("#productStock")?.value || 0),
      badge: $("#productBadge") ? $("#productBadge").value : "",
      images: imageUrl ? [imageUrl] : [],
      updatedAt: serverTimestamp()
    });
    toast("প্রোডাক্ট আপডেট করা হয়েছে!");
    if($("#productForm")) $("#productForm").reset();
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.deleteProduct = async function(id) {
  if (!confirm("আপনি কি নিশ্চিত যে প্রোডাক্টটি মুছে ফেলতে চান?")) return;
  try {
    await deleteDoc(doc(db, collections.products, id));
    toast("প্রোডাক্ট মুছে ফেলা হয়েছে!");
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

// 2. CATEGORIES
window.addCategory = async function() {
  const name = $("#categoryName")?.value.trim();
  const image = $("#categoryImage")?.value.trim();

  if (!name) {
    alert("ক্যাটাগরির নাম দেওয়া বাধ্যতামূলক!");
    return;
  }

  try {
    await addDoc(collection(db, collections.categories), {
      name,
      image: image || "",
      subCategoryCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("ক্যাটাগরি যোগ করা হয়েছে!");
    if($("#categoryForm")) $("#categoryForm").reset();
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.editCategory = async function(id) {
  const snapshot = await getDoc(doc(db, collections.categories, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if ($("#categoryId")) $("#categoryId").value = id;
  if ($("#categoryName")) $("#categoryName").value = data.name || "";
  if ($("#categoryImage")) $("#categoryImage").value = data.image || "";
};

window.updateCategory = async function() {
  const id = $("#categoryId")?.value;
  if (!id) {
    alert("এডিট করার জন্য কোনো ক্যাটাগরি নির্বাচন করা হয়নি!");
    return;
  }

  try {
    await updateDoc(doc(db, collections.categories, id), {
      name: $("#categoryName").value,
      image: $("#categoryImage") ? $("#categoryImage").value.trim() : "",
      updatedAt: serverTimestamp()
    });
    toast("ক্যাটাগরি আপডেট হয়েছে!");
    if($("#categoryForm")) $("#categoryForm").reset();
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.deleteCategory = async function(id) {
  if (!confirm("আপনি কি ক্যাটাগরি মুছে ফেলতে চান?")) return;
  try {
    await deleteDoc(doc(db, collections.categories, id));
    toast("ক্যাটাগরি মুছে ফেলা হয়েছে!");
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

// 3. BANNERS
window.addBanner = async function() {
  const image = $("#bannerImage")?.value.trim();
  if (!image) {
    alert("ব্যানারের ইমেজ লিংক অবশ্যই দিন!");
    return;
  }

  try {
    await addDoc(collection(db, collections.banners), {
      title: $("#bannerTitle") ? $("#bannerTitle").value : "",
      subtitle: $("#bannerSubtitle") ? $("#bannerSubtitle").value : "",
      link: $("#bannerLink") ? $("#bannerLink").value : "",
      priority: Number($("#bannerPriority")?.value || 1),
      image,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("ব্যানার যোগ হয়েছে!");
    if($("#bannerForm")) $("#bannerForm").reset();
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.editBanner = async function(id) {
  const snapshot = await getDoc(doc(db, collections.banners, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if ($("#bannerId")) $("#bannerId").value = id;
  if ($("#bannerTitle")) $("#bannerTitle").value = data.title || "";
  if ($("#bannerSubtitle")) $("#bannerSubtitle").value = data.subtitle || "";
  if ($("#bannerLink")) $("#bannerLink").value = data.link || "";
  if ($("#bannerPriority")) $("#bannerPriority").value = data.priority || 1;
  if ($("#bannerImage")) $("#bannerImage").value = data.image || "";
};

window.updateBanner = async function() {
  const id = $("#bannerId")?.value;
  if (!id) return;

  try {
    await updateDoc(doc(db, collections.banners, id), {
      title: $("#bannerTitle") ? $("#bannerTitle").value : "",
      subtitle: $("#bannerSubtitle") ? $("#bannerSubtitle").value : "",
      link: $("#bannerLink") ? $("#bannerLink").value : "",
      priority: Number($("#bannerPriority")?.value || 1),
      image: $("#bannerImage") ? $("#bannerImage").value.trim() : "",
      updatedAt: serverTimestamp()
    });
    toast("ব্যানার আপডেট হয়েছে!");
    if($("#bannerForm")) $("#bannerForm").reset();
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.deleteBanner = async function(id) {
  if (!confirm("ব্যানার মুছে ফেলতে চান?")) return;
  try {
    await deleteDoc(doc(db, collections.banners, id));
    toast("ব্যানার মুছে ফেলা হয়েছে!");
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

// 4. COUPONS
window.addCoupon = async function() {
  const code = $("#couponCode")?.value.trim().toUpperCase();
  const amount = Number($("#couponAmount")?.value || 0);

  if (!code || !amount) {
    alert("কুপন কোড এবং ডিসকাউন্ট পরিমাণ লিখুন!");
    return;
  }

  try {
    await addDoc(collection(db, collections.coupons), {
      code,
      amount,
      expiryDate: $("#couponExpiry")?.value || "",
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    toast("কুপন যোগ হয়েছে!");
    if($("#couponForm")) $("#couponForm").reset();
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.editCoupon = async function(id) {
  const snapshot = await getDoc(doc(db, collections.coupons, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if ($("#couponId")) $("#couponId").value = id;
  if ($("#couponCode")) $("#couponCode").value = data.code || "";
  if ($("#couponAmount")) $("#couponAmount").value = data.amount || 0;
  if ($("#couponExpiry")) $("#couponExpiry").value = data.expiryDate || "";
};

window.updateCoupon = async function() {
  const id = $("#couponId")?.value;
  if (!id) return;

  try {
    await updateDoc(doc(db, collections.coupons, id), {
      code: $("#couponCode").value.toUpperCase(),
      amount: Number($("#couponAmount").value),
      expiryDate: $("#couponExpiry").value,
      updatedAt: serverTimestamp()
    });
    toast("কুপন আপডেট হয়েছে!");
    if($("#couponForm")) $("#couponForm").reset();
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.deleteCoupon = async function(id) {
  if (!confirm("কুপন টি মুছে ফেলবেন?")) return;
  try {
    await deleteDoc(doc(db, collections.coupons, id));
    toast("কুপন মুছে ফেলা হয়েছে!");
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

// 5. ORDERS & CUSTOMERS VIEW
window.viewOrder = async function(id) {
  if ($("#viewerNumber")) $("#viewerNumber").dataset.id = id;
  const snapshot = await getDoc(doc(db, collections.orders, id));
  if (!snapshot.exists()) return;
  const order = snapshot.data();
  if ($("#orderViewer")) $("#orderViewer").classList.add("active");
  if ($("#viewerNumber")) $("#viewerNumber").textContent = order.orderNumber || "";
  if ($("#viewerCustomer")) $("#viewerCustomer").textContent = order.customerName || "";
  if ($("#viewerPhone")) $("#viewerPhone").textContent = order.phone || "";
  if ($("#viewerAddress")) $("#viewerAddress").textContent = `${order.area || ''}, ${order.upazila || ''}, ${order.district || ''}, ${order.division || ''}`;
  if ($("#viewerPayment")) $("#viewerPayment").textContent = order.paymentMethod || "";
  if ($("#viewerStatus")) $("#viewerStatus").value = order.status || "pending";
  if ($("#viewerDelivery")) $("#viewerDelivery").value = order.deliveryStatus || "pending";
  if ($("#viewerPaymentStatus")) $("#viewerPaymentStatus").value = order.paymentStatus || "unpaid";

  const items = $("#viewerItems");
  if (items) {
    items.innerHTML = "";
    (order.items || []).forEach(item => {
      items.innerHTML += `
        <div style="display:flex; gap:10px; margin-bottom:10px; align-items:center;">
          <img src="${item.image}" width="50" height="50">
          <div>
            <strong>${item.name}</strong>
            <p>${item.quantity} × ৳${currency(item.price)}</p>
          </div>
        </div>
      `;
    });
  }
};

window.saveOrderStatus = async function() {
  const id = $("#viewerNumber")?.dataset.id;
  if (!id) return;
  try {
    await updateDoc(doc(db, collections.orders, id), {
      status: $("#viewerStatus").value,
      deliveryStatus: $("#viewerDelivery").value,
      paymentStatus: $("#viewerPaymentStatus").value,
      updatedAt: serverTimestamp()
    });
    toast("অর্ডার স্ট্যাটাস সংরক্ষিত হয়েছে!");
    if ($("#orderViewer")) $("#orderViewer").classList.remove("active");
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

window.viewCustomer = async function(id) {
  const snapshot = await getDoc(doc(db, collections.users, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if ($("#customerModal")) $("#customerModal").classList.add("active");
  if ($("#customerImage")) $("#customerImage").src = data.photo || "";
  if ($("#customerName")) $("#customerName").textContent = data.name || "";
  if ($("#customerEmail")) $("#customerEmail").textContent = data.email || "";
  if ($("#customerPhone")) $("#customerPhone").textContent = data.phone || "";
  if ($("#customerAddress")) $("#customerAddress").textContent = `${data.area || ''}, ${data.upazila || ''}, ${data.district || ''}, ${data.division || ''}`;

  const ordersQuery = query(collection(db, collections.orders), where("uid", "==", id));
  const orderSnapshot = await getDocs(ordersQuery);
  const history = $("#customerOrders");
  if (history) {
    history.innerHTML = "";
    orderSnapshot.forEach(order => {
      const item = order.data();
      history.innerHTML += `
        <div style="border-bottom:1px solid #ddd; padding:5px 0;">
          <strong>অর্ডার নং: ${item.orderNumber}</strong> | 
          <span>৳${currency(item.total)}</span> | 
          <small>${item.status}</small>
        </div>
      `;
    });
  }
};

// 6. CHAT & NOTIFICATIONS
window.openChat = async function(chatId) {
  if ($("#chatModal")) $("#chatModal").classList.add("active");
  if ($("#adminChatUser")) $("#adminChatUser").textContent = chatId;
  const container = $("#adminChatMessages");

  onSnapshot(
    query(collection(db, collections.chats, chatId, collections.messages), orderBy("createdAt", "asc")),
    snapshot => {
      if (!container) return;
      container.innerHTML = "";
      snapshot.forEach(message => {
        const data = message.data();
        container.innerHTML += `
          <div style="margin-bottom:8px; text-align: ${data.sender === chatId ? "left" : "right"}">
            <span style="background:${data.sender === chatId ? "#e2e8f0" : "#0284c7"}; color:${data.sender === chatId ? "#000" : "#fff"}; padding:6px 12px; border-radius:12px; display:inline-block;">
              ${data.type === "image" ? `<img src="${data.image}" width="150">` : data.text}
            </span>
          </div>
        `;
      });
      container.scrollTop = container.scrollHeight;
    }
  );

  if ($("#adminSend")) {
    $("#adminSend").onclick = async () => {
      const text = $("#adminMessage")?.value.trim();
      if (!text) return;

      await addDoc(collection(db, collections.chats, chatId, collections.messages), {
        sender: "admin",
        type: "text",
        text,
        read: true,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, collections.chats, chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });

      if ($("#adminMessage")) $("#adminMessage").value = "";
    };
  }
};

window.sendPromotionNotification = async function() {
  const title = $("#notificationTitle")?.value.trim();
  const message = $("#notificationMessage")?.value.trim();

  if (!title || !message) {
    alert("নোটিফিকেশন টাইটেল এবং মেসেজ লিখুন!");
    return;
  }

  try {
    const users = await getDocs(collection(db, collections.users));
    const tasks = [];

    users.forEach(user => {
      tasks.push(
        addDoc(collection(db, collections.notifications), {
          uid: user.id,
          title,
          message,
          read: false,
          type: "promotion",
          createdAt: serverTimestamp()
        })
      );
    });

    await Promise.all(tasks);
    toast("নোটিফিকেশন সবার কাছে পাঠানো হয়েছে!");
    if ($("#notificationTitle")) $("#notificationTitle").value = "";
    if ($("#notificationMessage")) $("#notificationMessage").value = "";
  } catch (err) {
    alert("ত্রুটি: " + err.message);
  }
};

// ---------------- Initialize Authentication ----------------

onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  loadDashboard();
});

console.log("%cAdmin JS Fully Loaded & Active", "color: #10b981; font-weight: bold; font-size: 14px;");
