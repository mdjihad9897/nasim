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
  serverTimestamp,
  signOut
} from "./firebase.js";

const $ = selector => document.querySelector(selector);

const state = {
  products: [],
  categories: [],
  orders: [],
  customers: [],
  banners: [],
  coupons: [],
  chats: []
};

function currency(value) {
  return new Intl.NumberFormat("en-BD").format(value || 0);
}

function toast(message) {
  const container = $("#toastContainer");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-bounce";
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
  onSnapshot(query(collection(db, collections.products), orderBy("createdAt", "desc")), snapshot => {
    state.products = [];
    snapshot.forEach(item => state.products.push({ id: item.id, ...item.data() }));
    renderProducts();
    dashboardSummary();
  });
}

function watchCategories() {
  onSnapshot(query(collection(db, collections.categories), orderBy("name")), snapshot => {
    state.categories = [];
    snapshot.forEach(item => state.categories.push({ id: item.id, ...item.data() }));
    renderCategories();
    dashboardSummary();
  });
}

function watchOrders() {
  onSnapshot(query(collection(db, collections.orders), orderBy("createdAt", "desc")), snapshot => {
    state.orders = [];
    snapshot.forEach(item => state.orders.push({ id: item.id, ...item.data() }));
    renderOrders();
    dashboardSummary();
  });
}

function watchUsers() {
  onSnapshot(query(collection(db, collections.users), orderBy("createdAt", "desc")), snapshot => {
    state.customers = [];
    snapshot.forEach(item => state.customers.push({ id: item.id, ...item.data() }));
    renderCustomers();
    dashboardSummary();
  });
}

function watchCoupons() {
  onSnapshot(query(collection(db, collections.coupons), orderBy("createdAt", "desc")), snapshot => {
    state.coupons = [];
    snapshot.forEach(item => state.coupons.push({ id: item.id, ...item.data() }));
    renderCoupons();
  });
}

function watchBanners() {
  onSnapshot(query(collection(db, collections.banners), orderBy("priority")), snapshot => {
    state.banners = [];
    snapshot.forEach(item => state.banners.push({ id: item.id, ...item.data() }));
    renderBanners();
  });
}

function watchChats() {
  onSnapshot(query(collection(db, collections.chats), orderBy("updatedAt", "desc")), snapshot => {
    state.chats = [];
    snapshot.forEach(item => state.chats.push({ id: item.id, ...item.data() }));
    renderChats();
  });
}

function dashboardSummary() {
  const revenue = state.orders.reduce((sum, item) => sum + (item.total || 0), 0);
  if ($("#totalRevenue")) $("#totalRevenue").textContent = `৳${currency(revenue)}`;
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
    const img = (product.images && product.images[0]) ? product.images[0] : "https://via.placeholder.com/50";
    table.innerHTML += `
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-4"><img src="${img}" class="w-12 h-12 object-cover rounded-lg border"></td>
        <td class="p-4 font-medium text-slate-800">${product.name || ""}</td>
        <td class="p-4">${product.brand || ""}</td>
        <td class="p-4 font-bold ${product.stock > 0 ? "text-emerald-600" : "text-rose-600"}">${product.stock || 0}</td>
        <td class="p-4">৳${currency(product.salePrice || product.price)}</td>
        <td class="p-4 space-x-2">
          <button onclick="editProduct('${product.id}')" class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 font-medium">Edit</button>
          <button onclick="deleteProduct('${product.id}')" class="bg-rose-50 text-rose-600 px-3 py-1 rounded hover:bg-rose-100 font-medium">Delete</button>
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
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-4"><img src="${category.image || "https://via.placeholder.com/40"}" class="w-10 h-10 object-cover rounded-md"></td>
        <td class="p-4 font-medium">${category.name || ""}</td>
        <td class="p-4">${category.subCategoryCount || 0}</td>
        <td class="p-4 space-x-2">
          <button onclick="editCategory('${category.id}')" class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100">Edit</button>
          <button onclick="deleteCategory('${category.id}')" class="bg-rose-50 text-rose-600 px-3 py-1 rounded hover:bg-rose-100">Delete</button>
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
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-4 font-bold text-indigo-600">${order.orderNumber || ""}</td>
        <td class="p-4">${order.customerName || ""}</td>
        <td class="p-4">${order.paymentMethod || ""}</td>
        <td class="p-4">${order.paymentStatus || "Pending"}</td>
        <td class="p-4">${order.deliveryStatus || "Pending"}</td>
        <td class="p-4"><span class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">${order.status || "Pending"}</span></td>
        <td class="p-4 font-bold">৳${currency(order.total)}</td>
        <td class="p-4"><button onclick="viewOrder('${order.id}')" class="bg-slate-800 text-white px-3 py-1 rounded hover:bg-slate-900">View</button></td>
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
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-4"><img src="${user.photo || "https://via.placeholder.com/40"}" class="w-10 h-10 rounded-full object-cover"></td>
        <td class="p-4 font-medium">${user.name || "N/A"}</td>
        <td class="p-4">${user.phone || "N/A"}</td>
        <td class="p-4">${user.email || "N/A"}</td>
        <td class="p-4"><button onclick="viewCustomer('${user.id}')" class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100">Details</button></td>
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
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-4 font-bold text-indigo-600">${coupon.code || ""}</td>
        <td class="p-4">৳${coupon.amount || 0}</td>
        <td class="p-4">${coupon.expiryDate || ""}</td>
        <td class="p-4 space-x-2">
          <button onclick="editCoupon('${coupon.id}')" class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100">Edit</button>
          <button onclick="deleteCoupon('${coupon.id}')" class="bg-rose-50 text-rose-600 px-3 py-1 rounded hover:bg-rose-100">Delete</button>
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
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-4"><img src="${banner.image || "https://via.placeholder.com/80x40"}" class="w-20 h-10 object-cover rounded"></td>
        <td class="p-4 font-medium">${banner.title || ""}</td>
        <td class="p-4">${banner.priority || 0}</td>
        <td class="p-4 space-x-2">
          <button onclick="editBanner('${banner.id}')" class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100">Edit</button>
          <button onclick="deleteBanner('${banner.id}')" class="bg-rose-50 text-rose-600 px-3 py-1 rounded hover:bg-rose-100">Delete</button>
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
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-4">${chat.uid || ""}</td>
        <td class="p-4">${chat.lastMessage || ""}</td>
        <td class="p-4"><span class="px-2 py-1 rounded text-xs font-bold ${chat.online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">${chat.online ? "Online" : "Offline"}</span></td>
        <td class="p-4 text-xs text-slate-500">${chat.typing ? "Typing..." : "Idle"}</td>
        <td class="p-4"><button onclick="openChat('${chat.id}')" class="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Open</button></td>
      </tr>
    `;
  });
}

// প্রোডাক্ট এড করার ফাংশন
async function handleAddProduct() {
  try {
    const name = $("#productName")?.value.trim();
    const rawImages = $("#productImages")?.value.trim();
    const price = Number($("#productPrice")?.value) || 0;
    const stock = Number($("#productStock")?.value) || 0;

    // ভ্যালিডেশন চেক
    if (!name) {
      toast("⚠️ প্রোডাক্টের নাম দিন!");
      return;
    }
    if (!rawImages) {
      toast("⚠️ অন্তত একটি ছবির URL লিংক দিন!");
      return;
    }

    // ইমেজ লিংকগুলোকে আলাদা করা
    const images = rawImages.split(",").map(url => url.trim()).filter(url => url !== "");

    // ফায়ারবেসে ডাটা পাঠানো
    await addDoc(collection(db, collections.products), {
      name: name,
      description: $("#productDescription")?.value.trim() || "",
      brand: $("#productBrand")?.value.trim() || "",
      categoryId: $("#productCategory")?.value.trim() || "",
      sku: $("#productSku")?.value.trim() || "",
      price: price,
      salePrice: Number($("#productSalePrice")?.value) || price,
      stock: stock,
      badge: $("#productBadge")?.value.trim() || "",
      rating: 0,
      reviewCount: 0,
      sales: 0,
      views: 0,
      status: "active",
      images: images,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    toast("✅ প্রোডাক্ট সফলভাবে যোগ হয়েছে!");
    
    // ইনপুট ফিল্ড খালি করা
    $("#productName").value = "";
    $("#productDescription").value = "";
    $("#productBrand").value = "";
    $("#productCategory").value = "";
    $("#productSku").value = "";
    $("#productPrice").value = "";
    $("#productSalePrice").value = "";
    $("#productStock").value = "";
    $("#productBadge").value = "";
    $("#productImages").value = "";

  } catch (error) {
    console.error("Product Add Error: ", error);
    toast("❌ ভুল হয়েছে: " + error.message);
  }
}

// বোতামে ইভেন্ট লিসেনার যুক্ত করা (পৃষ্ঠা লোড হওয়ার পর)
document.addEventListener("DOMContentLoaded", () => {
  const btnAdd = document.getElementById("btnAddProduct");
  if (btnAdd) {
    btnAdd.addEventListener("click", handleAddProduct);
  }
});

window.updateProduct = async () => {
  try {
    const id = $("#productId").value;
    if (!id) {
      toast("Select a product first!");
      return;
    }
    const rawImages = $("#productImages").value.trim();
    const images = rawImages ? rawImages.split(",").map(url => url.trim()) : [];

    await updateDoc(doc(db, collections.products, id), {
      name: $("#productName").value,
      description: $("#productDescription").value,
      brand: $("#productBrand").value,
      categoryId: $("#productCategory").value,
      sku: $("#productSku").value,
      price: Number($("#productPrice").value),
      salePrice: Number($("#productSalePrice").value),
      stock: Number($("#productStock").value),
      badge: $("#productBadge").value,
      images,
      updatedAt: serverTimestamp()
    });

    toast("Product Updated!");
  } catch (err) {
    console.error(err);
    toast("Update failed!");
  }
};

window.deleteProduct = async id => {
  if (confirm("Delete Product?")) {
    await deleteDoc(doc(db, collections.products, id));
    toast("Product Deleted");
  }
};

// Category Image Links
window.addCategory = async () => {
  const imageUrl = $("#categoryImage").value.trim();
  if (!imageUrl) { toast("Provide image URL!"); return; }
  await addDoc(collection(db, collections.categories), {
    name: $("#categoryName").value.trim(),
    image: imageUrl,
    subCategoryCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  toast("Category Added!");
  $("#categoryName").value = "";
  $("#categoryImage").value = "";
};

window.editCategory = async id => {
  const snapshot = await getDoc(doc(db, collections.categories, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  $("#categoryId").value = id;
  $("#categoryName").value = data.name;
  $("#categoryImage").value = data.image || "";
};

window.updateCategory = async () => {
  await updateDoc(doc(db, collections.categories, $("#categoryId").value), {
    name: $("#categoryName").value,
    image: $("#categoryImage").value,
    updatedAt: serverTimestamp()
  });
  toast("Category Updated");
};

window.deleteCategory = async id => {
  if (confirm("Delete Category?")) {
    await deleteDoc(doc(db, collections.categories, id));
    toast("Category Deleted");
  }
};

// Banner Image Links
window.addBanner = async () => {
  const imageUrl = $("#bannerImage").value.trim();
  if (!imageUrl) { toast("Provide Banner Image URL!"); return; }
  await addDoc(collection(db, collections.banners), {
    title: $("#bannerTitle").value,
    subtitle: $("#bannerSubtitle").value,
    link: $("#bannerLink").value,
    priority: Number($("#bannerPriority").value) || 1,
    image: imageUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  toast("Banner Added!");
};

window.editBanner = async id => {
  const snapshot = await getDoc(doc(db, collections.banners, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  $("#bannerId").value = id;
  $("#bannerTitle").value = data.title;
  $("#bannerSubtitle").value = data.subtitle;
  $("#bannerLink").value = data.link;
  $("#bannerPriority").value = data.priority;
  $("#bannerImage").value = data.image || "";
};

window.updateBanner = async () => {
  await updateDoc(doc(db, collections.banners, $("#bannerId").value), {
    title: $("#bannerTitle").value,
    subtitle: $("#bannerSubtitle").value,
    link: $("#bannerLink").value,
    priority: Number($("#bannerPriority").value),
    image: $("#bannerImage").value,
    updatedAt: serverTimestamp()
  });
  toast("Banner Updated");
};

window.deleteBanner = async id => {
  if (confirm("Delete Banner?")) {
    await deleteDoc(doc(db, collections.banners, id));
    toast("Banner Deleted");
  }
};

// Coupons
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
  $("#couponId").value = id;
  $("#couponCode").value = data.code;
  $("#couponAmount").value = data.amount;
  $("#couponExpiry").value = data.expiryDate;
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
  if (confirm("Delete Coupon?")) {
    await deleteDoc(doc(db, collections.coupons, id));
    toast("Coupon Deleted");
  }
};

// Order Details
window.viewOrder = async id => {
  const snapshot = await getDoc(doc(db, collections.orders, id));
  if (!snapshot.exists()) return;
  const order = snapshot.data();
  
  const modal = $("#orderViewer");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const viewerNum = $("#viewerNumber");
  viewerNum.textContent = order.orderNumber || "";
  viewerNum.dataset.id = id;

  $("#viewerCustomer").textContent = order.customerName || "";
  $("#viewerPhone").textContent = order.phone || "";
  $("#viewerAddress").textContent = `${order.area || ""}, ${order.upazila || ""}, ${order.district || ""}`;
  $("#viewerPayment").textContent = order.paymentMethod || "";
  $("#viewerStatus").value = order.status || "Pending";
  $("#viewerDelivery").value = order.deliveryStatus || "Pending";
  $("#viewerPaymentStatus").value = order.paymentStatus || "Pending";

  const items = $("#viewerItems");
  items.innerHTML = "";
  if (order.items) {
    order.items.forEach(item => {
      items.innerHTML += `
        <div class="flex items-center gap-3 bg-slate-50 p-2 rounded border">
          <img src="${item.image}" class="w-12 h-12 object-cover rounded">
          <div>
            <strong class="text-sm block">${item.name}</strong>
            <p class="text-xs text-slate-500">${item.quantity} × ৳${currency(item.price)}</p>
          </div>
        </div>
      `;
    });
  }
};

window.saveOrderStatus = async () => {
  try {
    const id = $("#viewerNumber").dataset.id;
    if (!id) return;
    await updateDoc(doc(db, collections.orders, id), {
      status: $("#viewerStatus").value,
      deliveryStatus: $("#viewerDelivery").value,
      paymentStatus: $("#viewerPaymentStatus").value,
      updatedAt: serverTimestamp()
    });
    toast("Order Status Saved");
    $("#orderViewer").classList.add("hidden");
  } catch (err) {
    toast("Failed to save order status!");
  }
};

window.viewCustomer = async id => {
  const snapshot = await getDoc(doc(db, collections.users, id));
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  const modal = $("#customerModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  $("#customerImage").src = data.photo || "https://via.placeholder.com/80";
  $("#customerName").textContent = data.name || "N/A";
  $("#customerEmail").textContent = data.email || "";
  $("#customerPhone").textContent = data.phone || "";
  $("#customerAddress").textContent = `${data.area || ""}, ${data.upazila || ""}, ${data.district || ""}`;

  const ordersQuery = query(collection(db, collections.orders), where("uid", "==", id));
  const orderSnapshot = await getDocs(ordersQuery);
  const history = $("#customerOrders");
  history.innerHTML = "";
  orderSnapshot.forEach(order => {
    const item = order.data();
    history.innerHTML += `
      <div class="bg-slate-50 p-2 rounded border text-xs flex justify-between">
        <strong>${item.orderNumber || ""}</strong>
        <span>৳${currency(item.total)}</span>
        <span class="text-indigo-600">${item.status}</span>
      </div>
    `;
  });
};

window.openChat = async chatId => {
  const modal = $("#chatModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  $("#adminChatUser").textContent = chatId;
  const container = $("#adminChatMessages");

  onSnapshot(
    query(collection(db, collections.chats, chatId, collections.messages), orderBy("createdAt", "asc")),
    snapshot => {
      container.innerHTML = "";
      snapshot.forEach(message => {
        const data = message.data();
        container.innerHTML += `
          <div class="p-2 rounded text-xs max-w-[80%] ${data.sender === chatId ? "bg-white border self-start" : "bg-indigo-600 text-white self-end ml-auto"}">
            ${data.text}
          </div>
        `;
      });
      container.scrollTop = container.scrollHeight;
    }
  );

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
};

window.sendPromotionNotification = async () => {
  const title = $("#notificationTitle").value.trim();
  const message = $("#notificationMessage").value.trim();
  if (!title || !message) { toast("Enter notification details!"); return; }
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
  toast("Notification Sent to all users!");
  $("#notificationTitle").value = "";
  $("#notificationMessage").value = "";
};

window.exportProducts = () => {
  const rows = [["Name", "Brand", "Price", "Sale Price", "Stock"]];
  state.products.forEach(item => {
    rows.push([item.name, item.brand, item.price, item.salePrice, item.stock]);
  });
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "products.csv";
  link.click();
};

// Auth Guard & Logout
onAuthStateChanged(auth, user => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  loadDashboard();
});

window.addEventListener("load", () => {
  $("#adminLogout")?.addEventListener("click", async () => {
    if (confirm("Logout from admin?")) {
      await signOut(auth);
      location.href = "login.html";
    }
  });
});
