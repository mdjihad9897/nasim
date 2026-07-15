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

// ==========================
// Helper Functions
// ==========================

const $ = (selector) => document.querySelector(selector);

function currency(value) {
  return new Intl.NumberFormat("en-BD").format(Number(value) || 0);
}

function toast(message) {
  const container = $("#toastContainer");

  if (!container) {
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==========================
// Global State
// ==========================

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

// ==========================
// Dashboard Loader
// ==========================

function loadDashboard() {

  watchProducts();

  watchCategories();

  watchOrders();

  watchUsers();

  watchCoupons();

  watchBanners();

  watchChats();

}

// ==========================
// Dashboard Summary
// ==========================

function dashboardSummary() {

  const revenue = state.orders.reduce((sum, order) => {
    return sum + (Number(order.total) || 0);
  }, 0);

  if ($("#totalRevenue")) {
    $("#totalRevenue").textContent = "৳" + currency(revenue);
  }

  if ($("#totalOrders")) {
    $("#totalOrders").textContent = state.orders.length;
  }

  if ($("#totalProducts")) {
    $("#totalProducts").textContent = state.products.length;
  }

  if ($("#totalCustomers")) {
    $("#totalCustomers").textContent = state.customers.length;
  }

  if ($("#lowStock")) {
    $("#lowStock").textContent = state.products.filter(product =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= 5
    ).length;
  }

  if ($("#outOfStock")) {
    $("#outOfStock").textContent = state.products.filter(product =>
      Number(product.stock) <= 0
    ).length;
  }

}

// ==========================
// Realtime Watchers
// ==========================

function watchProducts() {

  const q = query(
    collection(db, collections.products),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    q,
    snapshot => {

      state.products = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));

      renderProducts();
      dashboardSummary();

    },
    error => console.error("Products:", error)
  );

}

function watchCategories() {

  const q = query(
    collection(db, collections.categories),
    orderBy("name")
  );

  onSnapshot(
    q,
    snapshot => {

      state.categories = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));

      populateCategoryDropdown();
      renderCategories();
      dashboardSummary();

    },
    error => console.error("Categories:", error)
  );

}

function watchOrders() {

  const q = query(
    collection(db, collections.orders),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    q,
    snapshot => {

      state.orders = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));

      renderOrders();
      dashboardSummary();

    },
    error => console.error("Orders:", error)
  );

}

function watchUsers() {

  const q = query(
    collection(db, collections.users),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    q,
    snapshot => {

      state.customers = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));

      renderCustomers();
      dashboardSummary();

    },
    error => console.error("Users:", error)
  );

}

function watchCoupons() {

  const q = query(
    collection(db, collections.coupons),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    q,
    snapshot => {

      state.coupons = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));

      renderCoupons();

    },
    error => console.error("Coupons:", error)
  );

}

function watchBanners() {

  const q = query(
    collection(db, collections.banners),
    orderBy("priority")
  );

  onSnapshot(
    q,
    snapshot => {

      state.banners = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));

      renderBanners();

    },
    error => console.error("Banners:", error)
  );

}

function watchChats() {

  const q = query(
    collection(db, collections.chats),
    orderBy("updatedAt", "desc")
  );

  onSnapshot(
    q,
    snapshot => {

      state.chats = snapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));

      renderChats();

    },
    error => console.error("Chats:", error)
  );

}

function populateCategoryDropdown() {

  const select = $("#productCategory");

  if (!select) return;

  select.innerHTML = `<option value="">ক্যাটাগরি নির্বাচন করুন</option>`;

  state.categories.forEach(category => {

    const option = document.createElement("option");

    option.value = category.id;
    option.textContent = category.name;

    select.appendChild(option);

  });

}

// ==========================
// Render Functions
// ==========================

function renderProducts() {

  const table = $("#productTable");

  if (!table) return;

  table.innerHTML = "";

  state.products.forEach(product => {

    const image =
      product.images && product.images.length
        ? product.images[0]
        : "";

    table.innerHTML += `
      <tr>

        <td>
          <img
            src="${image}"
            width="55"
            height="55"
            style="object-fit:cover;border-radius:6px;"
          >
        </td>

        <td>${product.name || ""}</td>

        <td>${product.brand || ""}</td>

        <td>${product.stock || 0}</td>

        <td>৳${currency(product.salePrice || product.price)}</td>

        <td>

          <button
            class="btn"
            onclick="editProduct('${product.id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-danger"
            onclick="deleteProduct('${product.id}')"
          >
            Delete
          </button>

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

        <td>

          <img
            src="${category.image || ""}"
            width="45"
            height="45"
            style="object-fit:cover;border-radius:6px;"
          >

        </td>

        <td>${category.name || ""}</td>

        <td>${category.subCategoryCount || 0}</td>

        <td>

          <button
            class="btn"
            onclick="editCategory('${category.id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-danger"
            onclick="deleteCategory('${category.id}')"
          >
            Delete
          </button>

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

        <td>${order.orderNumber || ""}</td>

        <td>${order.customerName || ""}</td>

        <td>${order.paymentMethod || ""}</td>

        <td>${order.paymentStatus || ""}</td>

        <td>${order.deliveryStatus || ""}</td>

        <td>${order.status || ""}</td>

        <td>৳${currency(order.total)}</td>

        <td>

          <button
            class="btn"
            onclick="viewOrder('${order.id}')"
          >
            View
          </button>

        </td>

      </tr>
    `;

  });

}

function renderCustomers() {

  const table = $("#customerTable");

  if (!table) return;

  table.innerHTML = "";

  state.customers.forEach(customer => {

    table.innerHTML += `
      <tr>

        <td>

          <img
            src="${customer.photo || ""}"
            width="40"
            height="40"
            style="border-radius:50%;object-fit:cover;"
          >

        </td>

        <td>${customer.name || ""}</td>

        <td>${customer.phone || ""}</td>

        <td>${customer.email || ""}</td>

        <td>

          <button
            class="btn"
            onclick="viewCustomer('${customer.id}')"
          >
            Details
          </button>

        </td>

      </tr>
    `;

  });

}

// =========================
// ORDERS
// =========================

window.viewOrder = async function (id) {
  try {
    const snap = await getDoc(doc(db, collections.orders, id));

    if (!snap.exists()) return;

    const order = snap.data();

    $("#viewerNumber").dataset.id = id;
    $("#viewerNumber").textContent = order.orderNumber || "";
    $("#viewerCustomer").textContent = order.customerName || "";
    $("#viewerPhone").textContent = order.phone || "";
    $("#viewerPayment").textContent = order.paymentMethod || "";

    $("#viewerAddress").textContent =
      `${order.area || ""}, ${order.upazila || ""}, ${order.district || ""}, ${order.division || ""}`;

    $("#viewerStatus").value = order.status || "pending";
    $("#viewerDelivery").value = order.deliveryStatus || "pending";
    $("#viewerPaymentStatus").value = order.paymentStatus || "unpaid";

    const items = $("#viewerItems");

    items.innerHTML = "";

    (order.items || []).forEach(item => {

      items.innerHTML += `
      <div class="viewer-item">

          <img src="${item.image || ""}" width="55">

          <div>

              <strong>${item.name}</strong>

              <div>${item.quantity} × ৳${currency(item.price)}</div>

          </div>

      </div>
      `;

    });

    $("#orderViewer").classList.add("active");

  } catch (e) {

    console.error(e);

    toast("Order Load Failed");

  }
};

window.saveOrderStatus = async function () {

  const id = $("#viewerNumber").dataset.id;

  if (!id) return;

  try {

    await updateDoc(doc(db, collections.orders, id), {

      status: $("#viewerStatus").value,

      deliveryStatus: $("#viewerDelivery").value,

      paymentStatus: $("#viewerPaymentStatus").value,

      updatedAt: serverTimestamp()

    });

    toast("Order Updated");

    $("#orderViewer").classList.remove("active");

  } catch (e) {

    console.error(e);

    toast("Update Failed");

  }

};

// =========================
// CUSTOMERS
// =========================

window.viewCustomer = async function (uid) {

  try {

    const snap = await getDoc(doc(db, collections.users, uid));

    if (!snap.exists()) return;

    const user = snap.data();

    $("#customerImage").src = user.photo || "";

    $("#customerName").textContent = user.name || "";

    $("#customerEmail").textContent = user.email || "";

    $("#customerPhone").textContent = user.phone || "";

    $("#customerAddress").textContent =
      `${user.area || ""}, ${user.upazila || ""}, ${user.district || ""}, ${user.division || ""}`;

    const q = query(
      collection(db, collections.orders),
      where("uid", "==", uid)
    );

    const orders = await getDocs(q);

    $("#customerOrders").innerHTML = "";

    orders.forEach(docSnap => {

      const order = docSnap.data();

      $("#customerOrders").innerHTML += `
      <div class="customer-order">

          <strong>${order.orderNumber}</strong>

          <span>৳${currency(order.total)}</span>

          <small>${order.status}</small>

      </div>
      `;

    });

    $("#customerModal").classList.add("active");

  } catch (e) {

    console.error(e);

    toast("Customer Load Failed");

  }

};


// =========================
// CHAT
// =========================

let unsubscribeChat = null;

window.openChat = function (chatId) {

  $("#chatModal").classList.add("active");
  $("#adminChatUser").textContent = chatId;

  const container = $("#adminChatMessages");

  if (unsubscribeChat) {
    unsubscribeChat();
  }

  unsubscribeChat = onSnapshot(
    query(
      collection(db, collections.chats, chatId, collections.messages),
      orderBy("createdAt", "asc")
    ),
    snapshot => {

      container.innerHTML = "";

      snapshot.forEach(docSnap => {

        const msg = docSnap.data();

        const mine = msg.sender === "admin";

        container.innerHTML += `
          <div style="margin:8px 0;text-align:${mine ? "right" : "left"}">

            <span
              style="
              display:inline-block;
              padding:8px 12px;
              border-radius:12px;
              background:${mine ? "#0284c7" : "#e5e7eb"};
              color:${mine ? "#fff" : "#111"};
              ">

              ${
                msg.type === "image"
                  ? `<img src="${msg.image}" width="150">`
                  : (msg.text || "")
              }

            </span>

          </div>
        `;

      });

      container.scrollTop = container.scrollHeight;

    }
  );

  $("#adminSend").onclick = async () => {

    const input = $("#adminMessage");

    const text = input.value.trim();

    if (!text) return;

    try {

      await addDoc(
        collection(db, collections.chats, chatId, collections.messages),
        {
          sender: "admin",
          type: "text",
          text,
          read: true,
          createdAt: serverTimestamp()
        }
      );

      await updateDoc(
        doc(db, collections.chats, chatId),
        {
          lastMessage: text,
          updatedAt: serverTimestamp()
        }
      );

      input.value = "";

    } catch (e) {

      console.error(e);

      toast("Message Send Failed");

    }

  };

};

// =========================
// PROMOTION NOTIFICATION
// =========================

window.sendPromotionNotification = async function () {

  const title = $("#notificationTitle").value.trim();

  const message = $("#notificationMessage").value.trim();

  if (!title || !message) {

    toast("Title & Message Required");

    return;

  }

  try {

    const users = await getDocs(
      collection(db, collections.users)
    );

    const jobs = [];

    users.forEach(user => {

      jobs.push(
        addDoc(
          collection(db, collections.notifications),
          {
            uid: user.id,
            title,
            message,
            type: "promotion",
            read: false,
            createdAt: serverTimestamp()
          }
        )
      );

    });

    await Promise.all(jobs);

    $("#notificationTitle").value = "";
    $("#notificationMessage").value = "";

    toast("Notification Sent");

  } catch (e) {

    console.error(e);

    toast("Notification Failed");

  }

};


// =========================
// AUTH
// =========================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    location.replace("login.html");

    return;

  }

  try {

    const snap = await getDoc(
      doc(db, collections.users, user.uid)
    );

    if (!snap.exists()) {

      alert("User profile not found.");

      await auth.signOut();

      return;

    }

    const data = snap.data();

    if (data.role !== "admin") {

      alert("Access Denied");

      await auth.signOut();

      return;

    }

    loadDashboard();

  } catch (e) {

    console.error(e);

    alert("Authentication Error");

  }

});

// =========================
// GLOBAL HELPERS
// =========================

window.closeModal = function (id) {

  const modal = document.getElementById(id);

  if (modal) {

    modal.classList.remove("active");

  }

};

window.logoutAdmin = async function () {

  try {

    await auth.signOut();

    location.replace("login.html");

  } catch (e) {

    console.error(e);

    toast("Logout Failed");

  }

};

// =========================
// GLOBAL ERROR HANDLER
// =========================

window.addEventListener("error", e => {

  console.error("JS Error:", e.error);

});

window.addEventListener("unhandledrejection", e => {

  console.error("Promise Error:", e.reason);

});

// =========================
// APP READY
// =========================

console.log(
  "%cAdmin Dashboard Loaded Successfully",
  "color:#10b981;font-size:15px;font-weight:bold;"
);
