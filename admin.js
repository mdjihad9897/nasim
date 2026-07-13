import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getDatabase, ref, push, set, onValue, remove, update 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ১. আপনার ফায়ারবেজ কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyDPT3fRRT8m_zHlpEfo3wuuWe2NRsHHUqs",
  authDomain: "jihad-4b833.firebaseapp.com",
  databaseURL: "https://jihad-4b833-default-rtdb.firebaseio.com",
  projectId: "jihad-4b833",
  storageBucket: "jihad-4b833.firebasestorage.app",
  messagingSenderId: "668587419972",
  appId: "1:668587419972:web:7ec0a9c5ff31929ff7cf11",
  measurementId: "G-YGZBR5S47K"
};

// Initialize Realtime Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ----------------------------------------------------
// ১. DASHBOARD OVERVIEW (ড্যাশবোর্ড কাউন্টার)
// ----------------------------------------------------
onValue(ref(db, "orders"), (snapshot) => {
  let totalSales = 0;
  let orderCount = 0;
  if (snapshot.exists()) {
    orderCount = snapshot.size;
    snapshot.forEach(child => {
      const data = child.val();
      if (data.totalAmount) totalSales += Number(data.totalAmount);
    });
  }
  if(document.getElementById("dashSales")) document.getElementById("dashSales").innerText = totalSales;
  if(document.getElementById("dashOrders")) document.getElementById("dashOrders").innerText = orderCount;
  if(document.getElementById("orderCount")) document.getElementById("orderCount").innerText = orderCount;
});

onValue(ref(db, "products"), (snapshot) => {
  if(document.getElementById("dashProducts")) document.getElementById("dashProducts").innerText = snapshot.exists() ? snapshot.size : 0;
});

onValue(ref(db, "users"), (snapshot) => {
  if(document.getElementById("dashCustomers")) document.getElementById("dashCustomers").innerText = snapshot.exists() ? snapshot.size : 0;
});

// ----------------------------------------------------
// ২. PRODUCTS MANAGEMENT (পণ্য আপলোড ও তালিকা)
// ----------------------------------------------------
const productForm = document.getElementById("productForm");
const adminProductTable = document.getElementById("adminProductTable");

if (productForm) {
  productForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("pTitle").value;
    const price = document.getElementById("pPrice").value;
    const category = document.getElementById("pCategory").value;
    const imageUrl = document.getElementById("pImg").value;
    const description = document.getElementById("pDesc").value;

    const newRef = push(ref(db, "products"));
    set(newRef, {
      title,
      price: Number(price),
      category,
      imageUrl,
      description,
      createdAt: Date.now()
    }).then(() => {
      alert("পণ্য সফলভাবে আপলোড হয়েছে!");
      productForm.reset();
    }).catch(err => alert("ত্রুটি: " + err.message));
  });
}

onValue(ref(db, "products"), (snapshot) => {
  if (adminProductTable) {
    adminProductTable.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        const id = childSnap.key;
        adminProductTable.innerHTML += `
          <tr>
            <td><img src="${data.imageUrl}" alt="product"></td>
            <td><strong>${data.title}</strong></td>
            <td>৳${data.price}</td>
            <td>${data.category}</td>
            <td><button class="btn-del" onclick="deleteItem('products', '${id}')">Delete</button></td>
          </tr>
        `;
      });
    }
  }
});

// ----------------------------------------------------
// ৩. CATEGORIES MANAGEMENT (ক্যাটাগরি)
// ----------------------------------------------------
const categoryForm = document.getElementById("categoryForm");
const adminCategoryTable = document.getElementById("adminCategoryTable");

if (categoryForm) {
  categoryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("cName").value;
    const imageUrl = document.getElementById("cImg").value;

    const newRef = push(ref(db, "categories"));
    set(newRef, { name, imageUrl }).then(() => {
      alert("ক্যাটাগরি সেভ হয়েছে!");
      categoryForm.reset();
    }).catch(err => alert("ত্রুটি: " + err.message));
  });
}

onValue(ref(db, "categories"), (snapshot) => {
  if (adminCategoryTable) {
    adminCategoryTable.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        const id = childSnap.key;
        adminCategoryTable.innerHTML += `
          <tr>
            <td><img src="${data.imageUrl}" alt="category"></td>
            <td><strong>${data.name}</strong></td>
            <td><button class="btn-del" onclick="deleteItem('categories', '${id}')">Delete</button></td>
          </tr>
        `;
      });
    }
  }
});

// ----------------------------------------------------
// ৪. ORDERS MANAGEMENT (অর্ডার স্ট্যাটাস)
// ----------------------------------------------------
const adminOrderTable = document.getElementById("adminOrderTable");

onValue(ref(db, "orders"), (snapshot) => {
  if (adminOrderTable) {
    adminOrderTable.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        const id = childSnap.key;
        adminOrderTable.innerHTML += `
          <tr>
            <td>#${id.substring(0, 6)}</td>
            <td>${data.userName || 'Guest'}</td>
            <td>${data.userPhone || 'N/A'}</td>
            <td>৳${data.totalAmount || 0}</td>
            <td>${data.paymentMethod || 'COD'}</td>
            <td>
              <select class="order-status-select" onchange="updateOrderStatus('${id}', this.value)">
                <option value="Pending" ${data.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Processing" ${data.status === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Delivered" ${data.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${data.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td><button class="btn-del" onclick="deleteItem('orders', '${id}')">Delete</button></td>
          </tr>
        `;
      });
    }
  }
});

window.updateOrderStatus = (id, status) => {
  update(ref(db, `orders/${id}`), { status })
    .then(() => alert("অর্ডার স্ট্যাটাস আপডেট করা হয়েছে!"))
    .catch(err => alert("ত্রুটি: " + err.message));
};

// ----------------------------------------------------
// ৫. CUSTOMERS LIST (গ্রাহক তালিকা)
// ----------------------------------------------------
const adminCustomerTable = document.getElementById("adminCustomerTable");

onValue(ref(db, "users"), (snapshot) => {
  if (adminCustomerTable) {
    adminCustomerTable.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        const id = childSnap.key;
        adminCustomerTable.innerHTML += `
          <tr>
            <td><strong>${data.name || 'Anonymous'}</strong></td>
            <td>${data.email || data.phone || 'N/A'}</td>
            <td>${data.totalOrders || 0}</td>
            <td>${data.joinedDate || 'N/A'}</td>
            <td><button class="btn-del" onclick="deleteItem('users', '${id}')">Delete</button></td>
          </tr>
        `;
      });
    }
  }
});

// ----------------------------------------------------
// ৬. BANNERS MANAGEMENT (ব্যানার)
// ----------------------------------------------------
const bannerForm = document.getElementById("bannerForm");
const adminBannerTable = document.getElementById("adminBannerTable");

if (bannerForm) {
  bannerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("bTitle").value;
    const imageUrl = document.getElementById("bImg").value;
    const link = document.getElementById("bLink") ? document.getElementById("bLink").value : "";

    const newRef = push(ref(db, "banners"));
    set(newRef, { title, imageUrl, link }).then(() => {
      alert("ব্যানার যুক্ত হয়েছে!");
      bannerForm.reset();
    }).catch(err => alert("ত্রুটি: " + err.message));
  });
}

onValue(ref(db, "banners"), (snapshot) => {
  if (adminBannerTable) {
    adminBannerTable.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        const id = childSnap.key;
        adminBannerTable.innerHTML += `
          <tr>
            <td><img src="${data.imageUrl}" style="width: 80px; height: 40px; border-radius: 4px;" alt="banner"></td>
            <td>${data.title}</td>
            <td><button class="btn-del" onclick="deleteItem('banners', '${id}')">Delete</button></td>
          </tr>
        `;
      });
    }
  }
});

// ----------------------------------------------------
// ৭. COUPONS MANAGEMENT (কুপন)
// ----------------------------------------------------
const couponForm = document.getElementById("couponForm");
const adminCouponTable = document.getElementById("adminCouponTable");

if (couponForm) {
  couponForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("cpCode").value.toUpperCase();
    const amount = document.getElementById("cpAmount").value;
    const type = document.getElementById("cpType").value;

    const newRef = push(ref(db, "coupons"));
    set(newRef, { code, amount: Number(amount), type }).then(() => {
      alert("কুপন সেভ হয়েছে!");
      couponForm.reset();
    }).catch(err => alert("ত্রুটি: " + err.message));
  });
}

onValue(ref(db, "coupons"), (snapshot) => {
  if (adminCouponTable) {
    adminCouponTable.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const data = childSnap.val();
        const id = childSnap.key;
        adminCouponTable.innerHTML += `
          <tr>
            <td><strong>${data.code}</strong></td>
            <td>${data.amount}${data.type === 'percentage' ? '%' : '৳'}</td>
            <td>${data.type}</td>
            <td><button class="btn-del" onclick="deleteItem('coupons', '${id}')">Delete</button></td>
          </tr>
        `;
      });
    }
  }
});

// ----------------------------------------------------
// ৮. PUSH NOTIFICATIONS (নোটিফিকেশন)
// ----------------------------------------------------
const notificationForm = document.getElementById("notificationForm");

if (notificationForm) {
  notificationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("notifTitle").value;
    const body = document.getElementById("notifBody").value;

    const newRef = push(ref(db, "notifications"));
    set(newRef, { title, body, createdAt: Date.now() }).then(() => {
      alert("সব গ্রাহকের উদ্দেশ্যে নোটিফিকেশন পাঠানো হয়েছে!");
      notificationForm.reset();
    }).catch(err => alert("ত্রুটি: " + err.message));
  });
}

// ----------------------------------------------------
// ৯. GLOBAL DELETE FUNCTION (যে কোনো ডেটা মোছার জন্য)
// ----------------------------------------------------
window.deleteItem = (path, id) => {
  if (confirm("আপনি কি নিশ্চিত এটি মুছে ফেলতে চান?")) {
    remove(ref(db, `${path}/${id}`))
      .then(() => alert("সফলভাবে মুছে ফেলা হয়েছে!"))
      .catch(err => alert("ত্রুটি: " + err.message));
  }
};

