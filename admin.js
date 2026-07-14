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

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

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

function currency(value) {
  return new Intl.NumberFormat("en-BD").format(value || 0);
}

function toast(message) {
  const container = document.querySelector("#toastContainer");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "toast success";
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function loadDashboard() {
  watchProducts();
  watchCategories();
  watchOrders();
  watchUsers();
  watchCoupons();
  watchBanners();
  watchChats();
}

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
    }
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
      populateCategoryDropdown(); // 👈 অটোমেটিক ড্রপডাউন লোড
      dashboardSummary();
    }
  );
}

// প্রোডাক্ট ফর্মের ড্রপডাউনে ক্যাটাগরি অপশন যোগ করা
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
    }
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
    }
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
    }
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
    }
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
    }
  );
}

function dashboardSummary() {
  const revenue = state.orders.reduce((sum, item) => sum + (item.total || 0), 0);
  if ($("#totalRevenue")) $("#totalRevenue").textContent = currency(revenue);
  if ($("#totalOrders")) $("#totalOrders").textContent = state.orders.length;
  if ($("#totalProducts")) $("#totalProducts").textContent = state.products.length;
  if ($("#totalCustomers")) $("#totalCustomers").textContent = state.customers.length;
  if ($("#lowStock")) $("#lowStock").textContent = state.products.filter(item => item.stock <= 5 && item.stock > 0).length;
  if ($("#outOfStock")) $("#outOfStock").textContent = state.products.filter(item => item.stock <= 0).length;
}

function renderProducts() {
  const table = $("#productTable");
  if (!table) return;
  table.innerHTML = "";
  state.products.forEach(product => {
    const img = (product.images && product.images.length > 0) ? product.images[0] : '';
    table.innerHTML += `
      <tr>
        <td><img src="${img}" width="55"></td>
        <td>${product.name || ''}</td>
        <td>${product.brand || ''}</td>
        <td>${product.stock || 0}</td>
        <td>৳${currency(product.salePrice || product.price || 0)}</td>
        <td>
          <button onclick="editProduct('${product.id}')">Edit</button>
          <button onclick="deleteProduct('${product.id}')">Delete</button>
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
        <td><img src="${category.image || ''}" width="45"></td>
        <td>${category.name || ''}</td>
        <td>${category.subCategoryCount || 0}</td>
        <td>
          <button onclick="editCategory('${category.id}')">Edit</button>
          <button onclick="deleteCategory('${category.id}')">Delete</button>
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
        <td><button onclick="viewOrder('${order.id}')">View</button></td>
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
        <td><img src="${user.photo || ''}" width="45"></td>
        <td>${user.name || ''}</td>
        <td>${user.phone || ''}</td>
        <td>${user.email || ''}</td>
        <td><button onclick="viewCustomer('${user.id}')">Details</button></td>
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
        <td>${coupon.amount || 0}</td>
        <td>${coupon.expiryDate || ''}</td>
        <td>
          <button onclick="editCoupon('${coupon.id}')">Edit</button>
          <button onclick="deleteCoupon('${coupon.id}')">Delete</button>
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
        <td><img src="${banner.image || ''}" width="90"></td>
        <td>${banner.title || ''}</td>
        <td>${banner.priority || 0}</td>
        <td>
          <button onclick="editBanner('${banner.id}')">Edit</button>
          <button onclick="deleteBanner('${banner.id}')">Delete</button>
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
        <td><button onclick="openChat('${chat.id}')">Open</button></td>
      </tr>
    `;
  });
}

// 🟢 প্রোডাক্ট যোগ (ইমেজ লিংক দিয়ে)
window.addProduct = async () => {
  const imageUrlInput = $("#productImages") ? $("#productImages").value.trim() : "";
  const images = imageUrlInput ? [imageUrlInput] : [];

  await addDoc(collection(db, collections.products), {
    name: $("#productName").value.trim(),
    description: $("#productDescription") ? $("#productDescription").value.trim() : "",
    brand: $("#productBrand") ? $("#productBrand").value.trim() : "",
    categoryId: $("#productCategory").value,
    sku: $("#productSku") ? $("#productSku").value.trim() : "",
    price: Number($("#productPrice").value || 0),
    salePrice: Number($("#productSalePrice") ? $("#productSalePrice").value : $("#productPrice").value),
    stock: Number($("#productStock") ? $("#productStock").value : 0),
    rating: 0,
    reviewCount: 0,
    sales: 0,
    views: 0,
    status: "active",
    badge: $("#productBadge") ? $("#productBadge").value.trim() : "",
    images: images,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  toast("Product Added");
};

window.editProduct = async id => {
  const snapshot = await getDoc(doc(db, collections.products, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if ($("#productId")) $("#productId").value = id;
  $("#productName").value = data.name || "";
  if ($("#productDescription")) $("#productDescription").value = data.description || "";
  if ($("#productBrand")) $("#productBrand").value = data.brand || "";
  $("#productCategory").value = data.categoryId || "";
  if ($("#productSku")) $("#productSku").value = data.sku || "";
  $("#productPrice").value = data.price || 0;
  if ($("#productSalePrice")) $("#productSalePrice").value = data.salePrice || 0;
  if ($("#productStock")) $("#productStock").value = data.stock || 0;
  if ($("#productBadge")) $("#productBadge").value = data.badge || "";
  if ($("#productImages")) $("#productImages").value = (data.images && data.images.length > 0) ? data.images[0] : "";
};

window.updateProduct = async () => {
  const imageUrlInput = $("#productImages") ? $("#productImages").value.trim() : "";
  const images = imageUrlInput ? [imageUrlInput] : [];

  await updateDoc(doc(db, collections.products, $("#productId").value), {
    name: $("#productName").value,
    description: $("#productDescription") ? $("#productDescription").value : "",
    brand: $("#productBrand") ? $("#productBrand").value : "",
    categoryId: $("#productCategory").value,
    sku: $("#productSku") ? $("#productSku").value : "",
    price: Number($("#productPrice").value),
    salePrice: Number($("#productSalePrice") ? $("#productSalePrice").value : $("#productPrice").value),
    stock: Number($("#productStock") ? $("#productStock").value : 0),
    badge: $("#productBadge") ? $("#productBadge").value : "",
    images: images,
    updatedAt: serverTimestamp()
  });
  toast("Product Updated");
};

window.deleteProduct = async id => {
  if (!confirm("Delete Product?")) return;
  await deleteDoc(doc(db, collections.products, id));
  toast("Product Deleted");
};

// 🟢 ক্যাটাগরি যোগ (ইমেজ লিংক দিয়ে)
window.addCategory = async () => {
  const image = $("#categoryImage") ? $("#categoryImage").value.trim() : "";
  await addDoc(collection(db, collections.categories), {
    name: $("#categoryName").value.trim(),
    image: image,
    subCategoryCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  toast("Category Added");
};

window.editCategory = async id => {
  const snapshot = await getDoc(doc(db, collections.categories, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if ($("#categoryId")) $("#categoryId").value = id;
  $("#categoryName").value = data.name || "";
  if ($("#categoryImage")) $("#categoryImage").value = data.image || "";
};

window.updateCategory = async () => {
  await updateDoc(doc(db, collections.categories, $("#categoryId").value), {
    name: $("#categoryName").value,
    image: $("#categoryImage") ? $("#categoryImage").value.trim() : "",
    updatedAt: serverTimestamp()
  });
  toast("Category Updated");
};

window.deleteCategory = async id => {
  if (!confirm("Delete Category?")) return;
  await deleteDoc(doc(db, collections.categories, id));
  toast("Category Deleted");
};

// 🟢 ব্যানার যোগ (ইমেজ লিংক দিয়ে)
window.addBanner = async () => {
  const image = $("#bannerImage") ? $("#bannerImage").value.trim() : "";
  await addDoc(collection(db, collections.banners), {
    title: $("#bannerTitle") ? $("#bannerTitle").value : "",
    subtitle: $("#bannerSubtitle") ? $("#bannerSubtitle").value : "",
    link: $("#bannerLink") ? $("#bannerLink").value : "",
    priority: Number($("#bannerPriority") ? $("#bannerPriority").value : 1),
    image: image,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  toast("Banner Added");
};

window.editBanner = async id => {
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

window.updateBanner = async () => {
  await updateDoc(doc(db, collections.banners, $("#bannerId").value), {
    title: $("#bannerTitle") ? $("#bannerTitle").value : "",
    subtitle: $("#bannerSubtitle") ? $("#bannerSubtitle").value : "",
    link: $("#bannerLink") ? $("#bannerLink").value : "",
    priority: Number($("#bannerPriority") ? $("#bannerPriority").value : 1),
    image: $("#bannerImage") ? $("#bannerImage").value.trim() : "",
    updatedAt: serverTimestamp()
  });
  toast("Banner Updated");
};

window.deleteBanner = async id => {
  if (!confirm("Delete Banner?")) return;
  await deleteDoc(doc(db, collections.banners, id));
  toast("Banner Deleted");
};

window.addCoupon = async () => {
  await addDoc(collection(db, collections.coupons), {
    code: $("#couponCode").value.trim().toUpperCase(),
    amount: Number($("#couponAmount").value),
    expiryDate: $("#couponExpiry").value,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  toast("Coupon Added");
};

window.editCoupon = async id => {
  const snapshot = await getDoc(doc(db, collections.coupons, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  if ($("#couponId")) $("#couponId").value = id;
  $("#couponCode").value = data.code || "";
  $("#couponAmount").value = data.amount || 0;
  $("#couponExpiry").value = data.expiryDate || "";
};

window.updateCoupon = async () => {
  await updateDoc(doc(db, collections.coupons, $("#couponId").value), {
    code: $("#couponCode").value.toUpperCase(),
    amount: Number($("#couponAmount").value),
    expiryDate: $("#couponExpiry").value,
    updatedAt: serverTimestamp()
  });
  toast("Coupon Updated");
};

window.deleteCoupon = async id => {
  if (!confirm("Delete Coupon?")) return;
  await deleteDoc(doc(db, collections.coupons, id));
  toast("Coupon Deleted");
};

window.viewOrder = async id => {
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
  if ($("#viewerStatus")) $("#viewerStatus").value = order.status || "";
  if ($("#viewerDelivery")) $("#viewerDelivery").value = order.deliveryStatus || "";
  if ($("#viewerPaymentStatus")) $("#viewerPaymentStatus").value = order.paymentStatus || "";

  const items = $("#viewerItems");
  if (items) {
    items.innerHTML = "";
    (order.items || []).forEach(item => {
      items.innerHTML += `
        <div class="viewer-item">
          <img src="${item.image}" width="60">
          <div>
            <strong>${item.name}</strong>
            <p>${item.quantity} × ৳${currency(item.price)}</p>
          </div>
        </div>
      `;
    });
  }
};

window.saveOrderStatus = async () => {
  const id = $("#viewerNumber").dataset.id;
  await updateDoc(doc(db, collections.orders, id), {
    status: $("#viewerStatus").value,
    deliveryStatus: $("#viewerDelivery").value,
    paymentStatus: $("#viewerPaymentStatus").value,
    updatedAt: serverTimestamp()
  });
  toast("Order Updated");
};

window.viewCustomer = async id => {
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
        <div class="history-card">
          <strong>${item.orderNumber}</strong>
          <span>৳${currency(item.total)}</span>
          <small>${item.status}</small>
        </div>
      `;
    });
  }
};

window.openChat = async chatId => {
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
          <div class="${data.sender === chatId ? "user-message" : "admin-message"}">
            ${data.type === "image" ? `<img src="${data.image}" width="220">` : data.text}
          </div>
        `;
      });
      container.scrollTop = container.scrollHeight;
    }
  );

  if ($("#adminSend")) {
    $("#adminSend").onclick = async () => {
      const text = $("#adminMessage").value.trim();
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

      $("#adminMessage").value = "";
    };
  }
};

window.sendPromotionNotification = async () => {
  const title = $("#notificationTitle").value.trim();
  const message = $("#notificationMessage").value.trim();

  if (!title || !message) {
    toast("Enter notification");
    return;
  }

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
  toast("Notification Sent");
};

onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  loadDashboard();
});

console.log(
  "%cAdmin Dashboard Ready",
  "font-size:16px;color:#2563eb;font-weight:bold"
);
