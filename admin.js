// Firebase Modules Import (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// আপনার কনফিগারেশন
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ... এরপর আগের Part 3-এর বাকি সব JavaScript কোড বসবে ...
// ----------------------------------------------------
// 2. DASHBOARD OVERVIEW (রিয়েলটাইম তথ্য আপডেট)
// ----------------------------------------------------
onSnapshot(collection(db, "orders"), (snapshot) => {
  let totalSales = 0;
  let orderCount = snapshot.size;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.totalAmount) totalSales += Number(data.totalAmount);
  });

  document.getElementById("dashSales").innerText = totalSales;
  document.getElementById("dashOrders").innerText = orderCount;
  document.getElementById("orderCount").innerText = orderCount;
});

onSnapshot(collection(db, "products"), (snapshot) => {
  document.getElementById("dashProducts").innerText = snapshot.size;
});

onSnapshot(collection(db, "users"), (snapshot) => {
  document.getElementById("dashCustomers").innerText = snapshot.size;
});

// ----------------------------------------------------
// 3. PRODUCTS MANAGEMENT (পণ্য যোগ ও প্রদর্শন)
// ----------------------------------------------------
const productForm = document.getElementById("productForm");
const adminProductTable = document.getElementById("adminProductTable");

if (productForm) {
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("pTitle").value;
    const price = document.getElementById("pPrice").value;
    const category = document.getElementById("pCategory").value;
    const imageUrl = document.getElementById("pImg").value;
    const description = document.getElementById("pDesc").value;

    try {
      await addDoc(collection(db, "products"), {
        title,
        price: Number(price),
        category,
        imageUrl,
        description,
        createdAt: serverTimestamp()
      });
      alert("পণ্য সফলভাবে আপলোড হয়েছে!");
      productForm.reset();
    } catch (err) {
      alert("ত্রুটি: " + err.message);
    }
  });
}

onSnapshot(collection(db, "products"), (snapshot) => {
  adminProductTable.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
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
});

// ----------------------------------------------------
// 4. CATEGORIES MANAGEMENT (ক্যাটাগরি যোগ ও প্রদর্শন)
// ----------------------------------------------------
const categoryForm = document.getElementById("categoryForm");
const adminCategoryTable = document.getElementById("adminCategoryTable");

if (categoryForm) {
  categoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("cName").value;
    const imageUrl = document.getElementById("cImg").value;

    try {
      await addDoc(collection(db, "categories"), { name, imageUrl });
      alert("ক্যাটাগরি সেভ হয়েছে!");
      categoryForm.reset();
    } catch (err) {
      alert("ত্রুটি: " + err.message);
    }
  });
}

onSnapshot(collection(db, "categories"), (snapshot) => {
  adminCategoryTable.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    adminCategoryTable.innerHTML += `
      <tr>
        <td><img src="${data.imageUrl}" alt="category"></td>
        <td><strong>${data.name}</strong></td>
        <td><button class="btn-del" onclick="deleteItem('categories', '${id}')">Delete</button></td>
      </tr>
    `;
  });
});

// ----------------------------------------------------
// 5. ORDERS MANAGEMENT (অর্ডার স্ট্যাটাস আপডেট)
// ----------------------------------------------------
const adminOrderTable = document.getElementById("adminOrderTable");

onSnapshot(collection(db, "orders"), (snapshot) => {
  adminOrderTable.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    adminOrderTable.innerHTML += `
      <tr>
        <td>#${id.substring(0, 6)}</td>
        <td>${data.userName || 'Guest'}</td>
        <td>${data.userPhone || 'N/A'}</td>
        <td>৳${data.totalAmount}</td>
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
});

window.updateOrderStatus = async (id, status) => {
  await updateDoc(doc(db, "orders", id), { status });
  alert("অর্ডার স্ট্যাটাস আপডেট করা হয়েছে!");
};

// ----------------------------------------------------
// 6. CUSTOMERS LIST (গ্রাহক তালিকা)
// ----------------------------------------------------
const adminCustomerTable = document.getElementById("adminCustomerTable");

onSnapshot(collection(db, "users"), (snapshot) => {
  adminCustomerTable.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
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
});

// ----------------------------------------------------
// 7. BANNERS MANAGEMENT (ব্যানার সেভ ও ভিউ)
// ----------------------------------------------------
const bannerForm = document.getElementById("bannerForm");
const adminBannerTable = document.getElementById("adminBannerTable");

if (bannerForm) {
  bannerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("bTitle").value;
    const imageUrl = document.getElementById("bImg").value;
    const link = document.getElementById("bLink").value;

    try {
      await addDoc(collection(db, "banners"), { title, imageUrl, link });
      alert("ব্যানার যুক্ত হয়েছে!");
      bannerForm.reset();
    } catch (err) {
      alert("ত্রুটি: " + err.message);
    }
  });
}

onSnapshot(collection(db, "banners"), (snapshot) => {
  adminBannerTable.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    adminBannerTable.innerHTML += `
      <tr>
        <td><img src="${data.imageUrl}" style="width: 80px; height: 40px; border-radius: 4px;" alt="banner"></td>
        <td>${data.title}</td>
        <td><button class="btn-del" onclick="deleteItem('banners', '${id}')">Delete</button></td>
      </tr>
    `;
  });
});

// ----------------------------------------------------
// 8. COUPONS MANAGEMENT (কুপন ব্যবস্থাপনা)
// ----------------------------------------------------
const couponForm = document.getElementById("couponForm");
const adminCouponTable = document.getElementById("adminCouponTable");

if (couponForm) {
  couponForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("cpCode").value.toUpperCase();
    const amount = document.getElementById("cpAmount").value;
    const type = document.getElementById("cpType").value;

    try {
      await addDoc(collection(db, "coupons"), { code, amount: Number(amount), type });
      alert("কুপন সেভ হয়েছে!");
      couponForm.reset();
    } catch (err) {
      alert("ত্রুটি: " + err.message);
    }
  });
}

onSnapshot(collection(db, "coupons"), (snapshot) => {
  adminCouponTable.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    adminCouponTable.innerHTML += `
      <tr>
        <td><strong>${data.code}</strong></td>
        <td>${data.amount}${data.type === 'percentage' ? '%' : '৳'}</td>
        <td>${data.type}</td>
        <td><button class="btn-del" onclick="deleteItem('coupons', '${id}')">Delete</button></td>
      </tr>
    `;
  });
});

// ----------------------------------------------------
// 9. LIVE CHAT & NOTIFICATIONS
// ----------------------------------------------------
const notificationForm = document.getElementById("notificationForm");
if (notificationForm) {
  notificationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("notifTitle").value;
    const body = document.getElementById("notifBody").value;

    try {
      await addDoc(collection(db, "notifications"), { title, body, createdAt: serverTimestamp() });
      alert("সব গ্রাহকের উদ্দেশ্যে নোটিফিকেশন পাঠানো হয়েছে!");
      notificationForm.reset();
    } catch (err) {
      alert("ত্রুটি: " + err.message);
    }
  });
}

// Global Delete Function (যে কোনো কালেকশন থেকে ডাটা রিমুভ)
window.deleteItem = async (collectionName, id) => {
  if (confirm("আপনি কি নিশ্চিত এটি মুছে ফেলতে চান?")) {
    try {
      await deleteDoc(doc(db, collectionName, id));
      alert("সফলভাবে মুছে ফেলা হয়েছে!");
    } catch (err) {
      alert("ত্রুটি: " + err.message);
    }
  }
};