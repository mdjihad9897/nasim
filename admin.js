import{

auth,
db,
storage,

collections,

onAuthStateChanged,

collection,
doc,
addDoc,
setDoc,
updateDoc,
deleteDoc,
getDoc,
getDocs,
query,
orderBy,
where,
onSnapshot,
serverTimestamp,

uploadProductImages,
uploadCategoryImage,
uploadBannerImage

}from"./firebase.js";

const $=selector=>document.querySelector(selector);

const $$=selector=>document.querySelectorAll(selector);

const state={

products:[],

categories:[],

orders:[],

customers:[],

banners:[],

coupons:[],

notifications:[],

chats:[]

};

function currency(value){

return new Intl.NumberFormat(

"en-BD"

).format(value);

}

function toast(message){

const container=document.querySelector("#toastContainer");

if(!container)return;

const div=document.createElement("div");

div.className="toast success";

div.textContent=message;

container.appendChild(div);

setTimeout(()=>{

div.remove();

},3000);

}

function loadDashboard(){

watchProducts();

watchCategories();

watchOrders();

watchUsers();

watchCoupons();

watchBanners();

watchChats();

}

function watchProducts(){

onSnapshot(

query(

collection(

db,

collections.products

),

orderBy(

"createdAt",

"desc"

)

),

snapshot=>{

state.products=[];

snapshot.forEach(item=>{

state.products.push({

id:item.id,

...item.data()

});

});

renderProducts();

dashboardSummary();

}

);

}

function watchCategories(){

onSnapshot(

query(

collection(

db,

collections.categories

),

orderBy(

"name"

)

),

snapshot=>{

state.categories=[];

snapshot.forEach(item=>{

state.categories.push({

id:item.id,

...item.data()

});

});

renderCategories();

dashboardSummary();

}

);

}

function watchOrders(){

onSnapshot(

query(

collection(

db,

collections.orders

),

orderBy(

"createdAt",

"desc"

)

),

snapshot=>{

state.orders=[];

snapshot.forEach(item=>{

state.orders.push({

id:item.id,

...item.data()

});

});

renderOrders();

dashboardSummary();

}

);

}


function watchUsers(){

onSnapshot(

query(

collection(
db,
collections.users
),

orderBy(
"createdAt",
"desc"
)

),

snapshot=>{

state.customers=[];

snapshot.forEach(item=>{

state.customers.push({

id:item.id,

...item.data()

});

});

renderCustomers();

dashboardSummary();

}

);

}

function watchCoupons(){

onSnapshot(

query(

collection(
db,
collections.coupons
),

orderBy(
"createdAt",
"desc"
)

),

snapshot=>{

state.coupons=[];

snapshot.forEach(item=>{

state.coupons.push({

id:item.id,

...item.data()

});

});

renderCoupons();

}

);

}

function watchBanners(){

onSnapshot(

query(

collection(
db,
collections.banners
),

orderBy(
"priority"
)

),

snapshot=>{

state.banners=[];

snapshot.forEach(item=>{

state.banners.push({

id:item.id,

...item.data()

});

});

renderBanners();

}

);

}

function watchChats(){

onSnapshot(

query(

collection(
db,
collections.chats
),

orderBy(
"updatedAt",
"desc"
)

),

snapshot=>{

state.chats=[];

snapshot.forEach(item=>{

state.chats.push({

id:item.id,

...item.data()

});

});

renderChats();

}

);

}

function dashboardSummary(){

const revenue=

state.orders.reduce(

(sum,item)=>

sum+(item.total||0),

0

);

$("#totalRevenue").textContent=

currency(revenue);

$("#totalOrders").textContent=

state.orders.length;

$("#totalProducts").textContent=

state.products.length;

$("#totalCustomers").textContent=

state.customers.length;

$("#lowStock").textContent=

state.products.filter(

item=>item.stock<=5&&item.stock>0

).length;

$("#outOfStock").textContent=

state.products.filter(

item=>item.stock<=0

).length;

}

function renderProducts(){

const table=$("#productTable");

if(!table)return;

table.innerHTML="";

state.products.forEach(product=>{

table.innerHTML+=`

<tr>

<td>

<img
src="${product.images[0]}"
width="55">

</td>

<td>

${product.name}

</td>

<td>

${product.brand}

</td>

<td>

${product.stock}

</td>

<td>

৳${currency(product.salePrice)}

</td>

<td>

<button
onclick="editProduct('${product.id}')">

Edit

</button>

<button
onclick="deleteProduct('${product.id}')">

Delete

</button>

</td>

</tr>

`;

});

}


function renderCategories(){

const table=$("#categoryTable");

if(!table)return;

table.innerHTML="";

state.categories.forEach(category=>{

table.innerHTML+=`

<tr>

<td>

<img
src="${category.image}"
width="45">

</td>

<td>

${category.name}

</td>

<td>

${category.subCategoryCount||0}

</td>

<td>

<button
onclick="editCategory('${category.id}')">

Edit

</button>

<button
onclick="deleteCategory('${category.id}')">

Delete

</button>

</td>

</tr>

`;

});

}

function renderOrders(){

const table=$("#orderTable");

if(!table)return;

table.innerHTML="";

state.orders.forEach(order=>{

table.innerHTML+=`

<tr>

<td>

${order.orderNumber}

</td>

<td>

${order.customerName}

</td>

<td>

${order.paymentMethod}

</td>

<td>

${order.paymentStatus}

</td>

<td>

${order.deliveryStatus}

</td>

<td>

${order.status}

</td>

<td>

৳${currency(order.total)}

</td>

<td>

<button
onclick="viewOrder('${order.id}')">

View

</button>

</td>

</tr>

`;

});

}

function renderCustomers(){

const table=$("#customerTable");

if(!table)return;

table.innerHTML="";

state.customers.forEach(user=>{

table.innerHTML+=`

<tr>

<td>

<img
src="${user.photo}"
width="45">

</td>

<td>

${user.name}

</td>

<td>

${user.phone}

</td>

<td>

${user.email}

</td>

<td>

<button
onclick="viewCustomer('${user.id}')">

Details

</button>

</td>

</tr>

`;

});

}

function renderCoupons(){

const table=$("#couponTable");

if(!table)return;

table.innerHTML="";

state.coupons.forEach(coupon=>{

table.innerHTML+=`

<tr>

<td>

${coupon.code}

</td>

<td>

${coupon.amount}

</td>

<td>

${coupon.expiryDate}

</td>

<td>

<button
onclick="editCoupon('${coupon.id}')">

Edit

</button>

<button
onclick="deleteCoupon('${coupon.id}')">

Delete

</button>

</td>

</tr>

`;

});

}

function renderBanners(){

const table=$("#bannerTable");

if(!table)return;

table.innerHTML="";

state.banners.forEach(banner=>{

table.innerHTML+=`

<tr>

<td>

<img
src="${banner.image}"
width="90">

</td>

<td>

${banner.title}

</td>

<td>

${banner.priority}

</td>

<td>

<button
onclick="editBanner('${banner.id}')">

Edit

</button>

<button
onclick="deleteBanner('${banner.id}')">

Delete

</button>

</td>

</tr>

`;

});

}


function renderChats(){

const table=$("#chatTable");

if(!table)return;

table.innerHTML="";

state.chats.forEach(chat=>{

table.innerHTML+=`

<tr>

<td>

${chat.uid}

</td>

<td>

${chat.lastMessage||""}

</td>

<td>

${chat.online?"Online":"Offline"}

</td>

<td>

${chat.typing?"Typing":"Idle"}

</td>

<td>

<button
onclick="openChat('${chat.id}')">

Open

</button>

</td>

</tr>

`;

});

}

window.addProduct=async()=>{

const files=[

...$("#productImages").files

];

const images=

await uploadProductImages(files);

await addDoc(

collection(

db,

collections.products

),

{

name:$("#productName").value.trim(),

description:$("#productDescription").value.trim(),

brand:$("#productBrand").value.trim(),

categoryId:$("#productCategory").value,

sku:$("#productSku").value.trim(),

price:Number($("#productPrice").value),

salePrice:Number($("#productSalePrice").value),

stock:Number($("#productStock").value),

rating:0,

reviewCount:0,

sales:0,

views:0,

status:"active",

badge:$("#productBadge").value.trim(),

specifications:{},

images,

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

}

);

toast("Product Added");

};

window.editProduct=async id=>{

const snapshot=

await getDoc(

doc(

db,

collections.products,

id

)

);

if(!snapshot.exists())return;

const data=snapshot.data();

$("#productId").value=id;

$("#productName").value=data.name;

$("#productDescription").value=data.description;

$("#productBrand").value=data.brand;

$("#productCategory").value=data.categoryId;

$("#productSku").value=data.sku;

$("#productPrice").value=data.price;

$("#productSalePrice").value=data.salePrice;

$("#productStock").value=data.stock;

$("#productBadge").value=data.badge;

};

window.updateProduct=async()=>{

await updateDoc(

doc(

db,

collections.products,

$("#productId").value

),

{

name:$("#productName").value,

description:$("#productDescription").value,

brand:$("#productBrand").value,

categoryId:$("#productCategory").value,

sku:$("#productSku").value,

price:Number($("#productPrice").value),

salePrice:Number($("#productSalePrice").value),

stock:Number($("#productStock").value),

badge:$("#productBadge").value,

updatedAt:serverTimestamp()

}

);

toast("Product Updated");

};

window.deleteProduct=async id=>{

if(!confirm("Delete Product?"))return;

await deleteDoc(

doc(

db,

collections.products,

id

)

);

toast("Product Deleted");

};


window.addCategory=async()=>{

const file=$("#categoryImage").files[0];

const image=

await uploadCategoryImage(file);

await addDoc(

collection(
db,
collections.categories
),

{

name:$("#categoryName").value.trim(),

image,

subCategoryCount:0,

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

}

);

toast("Category Added");

};

window.editCategory=async id=>{

const snapshot=

await getDoc(

doc(
db,
collections.categories,
id
)

);

if(!snapshot.exists())return;

const data=snapshot.data();

$("#categoryId").value=id;

$("#categoryName").value=data.name;

};

window.updateCategory=async()=>{

await updateDoc(

doc(
db,
collections.categories,
$("#categoryId").value
),

{

name:$("#categoryName").value,

updatedAt:serverTimestamp()

}

);

toast("Category Updated");

};

window.deleteCategory=async id=>{

if(!confirm("Delete Category?"))return;

await deleteDoc(

doc(
db,
collections.categories,
id
)

);

toast("Category Deleted");

};

window.addBanner=async()=>{

const file=$("#bannerImage").files[0];

const image=

await uploadBannerImage(file);

await addDoc(

collection(
db,
collections.banners
),

{

title:$("#bannerTitle").value,

subtitle:$("#bannerSubtitle").value,

link:$("#bannerLink").value,

priority:Number($("#bannerPriority").value),

image,

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

}

);

toast("Banner Added");

};

window.editBanner=async id=>{

const snapshot=

await getDoc(

doc(
db,
collections.banners,
id
)

);

if(!snapshot.exists())return;

const data=snapshot.data();

$("#bannerId").value=id;

$("#bannerTitle").value=data.title;

$("#bannerSubtitle").value=data.subtitle;

$("#bannerLink").value=data.link;

$("#bannerPriority").value=data.priority;

};

window.updateBanner=async()=>{

await updateDoc(

doc(
db,
collections.banners,
$("#bannerId").value
),

{

title:$("#bannerTitle").value,

subtitle:$("#bannerSubtitle").value,

link:$("#bannerLink").value,

priority:Number($("#bannerPriority").value),

updatedAt:serverTimestamp()

}

);

toast("Banner Updated");

};

window.deleteBanner=async id=>{

if(!confirm("Delete Banner?"))return;

await deleteDoc(

doc(
db,
collections.banners,
id
)

);

toast("Banner Deleted");

};


window.addCoupon=async()=>{

await addDoc(

collection(
db,
collections.coupons
),

{

code:$("#couponCode").value
.trim()
.toUpperCase(),

amount:Number(
$("#couponAmount").value
),

expiryDate:$("#couponExpiry").value,

active:true,

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

}

);

toast("Coupon Added");

};

window.editCoupon=async id=>{

const snapshot=

await getDoc(

doc(
db,
collections.coupons,
id
)

);

if(!snapshot.exists())return;

const data=snapshot.data();

$("#couponId").value=id;

$("#couponCode").value=data.code;

$("#couponAmount").value=data.amount;

$("#couponExpiry").value=data.expiryDate;

};

window.updateCoupon=async()=>{

await updateDoc(

doc(
db,
collections.coupons,
$("#couponId").value
),

{

code:$("#couponCode").value
.toUpperCase(),

amount:Number(
$("#couponAmount").value
),

expiryDate:$("#couponExpiry").value,

updatedAt:serverTimestamp()

}

);

toast("Coupon Updated");

};

window.deleteCoupon=async id=>{

if(!confirm("Delete Coupon?"))return;

await deleteDoc(

doc(
db,
collections.coupons,
id
)

);

toast("Coupon Deleted");

};

window.viewOrder=async id=> { $("#viewerNumber").dataset.id = id;

const snapshot=

await getDoc(

doc(
db,
collections.orders,
id
)

);

if(!snapshot.exists())return;

const order=snapshot.data();

$("#orderViewer").classList.add("active");

$("#viewerNumber").textContent=

order.orderNumber;

$("#viewerCustomer").textContent=

order.customerName;

$("#viewerPhone").textContent=

order.phone;

$("#viewerAddress").textContent=

`${order.area},
${order.upazila},
${order.district},
${order.division}`;

$("#viewerPayment").textContent=

order.paymentMethod;

$("#viewerStatus").value=

order.status;

$("#viewerDelivery").value=

order.deliveryStatus;

$("#viewerPaymentStatus").value=

order.paymentStatus;

const items=$("#viewerItems");

items.innerHTML="";

order.items.forEach(item=>{

items.innerHTML+=`

<div class="viewer-item">

<img
src="${item.image}"
width="60">

<div>

<strong>

${item.name}

</strong>

<p>

${item.quantity} × ৳${currency(item.price)}

</p>

</div>

</div>

`;

});

};

window.saveOrderStatus=async()=>{

const id=$("#viewerNumber").dataset.id;

await updateDoc(

doc(
db,
collections.orders,
id
),

{

status:$("#viewerStatus").value,

deliveryStatus:$("#viewerDelivery").value,

paymentStatus:$("#viewerPaymentStatus").value,

updatedAt:serverTimestamp()

}

);

toast("Order Updated");

};


window.viewCustomer=async id=>{

const snapshot=

await getDoc(

doc(
db,
collections.users,
id
)

);

if(!snapshot.exists())return;

const data=snapshot.data();

$("#customerModal")

.classList.add("active");

$("#customerImage").src=

data.photo;

$("#customerName").textContent=

data.name;

$("#customerEmail").textContent=

data.email;

$("#customerPhone").textContent=

data.phone;

$("#customerAddress").textContent=

`${data.area},
${data.upazila},
${data.district},
${data.division}`;

const ordersQuery=query(

collection(
db,
collections.orders
),

where(
"uid",
"==",
id
)

);

const orderSnapshot=

await getDocs(ordersQuery);

const history=$("#customerOrders");

history.innerHTML="";

orderSnapshot.forEach(order=>{

const item=order.data();

history.innerHTML+=`

<div class="history-card">

<strong>

${item.orderNumber}

</strong>

<span>

৳${currency(item.total)}

</span>

<small>

${item.status}

</small>

</div>

`;

});

};

window.openChat=async chatId=>{

$("#chatModal")

.classList.add("active");

$("#adminChatUser").textContent=

chatId;

const container=

$("#adminChatMessages");

onSnapshot(

query(

collection(
db,
collections.chats,
chatId,
collections.messages
),

orderBy(
"createdAt",
"asc"
)

),

snapshot=>{

container.innerHTML="";

snapshot.forEach(message=>{

const data=message.data();

container.innerHTML+=`

<div class="${
data.sender===chatId
?"user-message"
:"admin-message"
}">

${
data.type==="image"

?`<img
src="${data.image}"
width="220">`

:data.text

}

</div>

`;

});

container.scrollTop=

container.scrollHeight;

}

);

$("#adminSend").onclick=

async()=>{

const text=

$("#adminMessage")

.value.trim();

if(!text)return;

await addDoc(

collection(
db,
collections.chats,
chatId,
collections.messages
),

{

sender:"admin",

type:"text",

text,

read:true,

createdAt:serverTimestamp()

}

);

await updateDoc(

doc(
db,
collections.chats,
chatId
),

{

lastMessage:text,

updatedAt:serverTimestamp()

}

);

$("#adminMessage").value="";

};

};


window.sendPromotionNotification=async()=>{

const title=$("#notificationTitle").value.trim();

const message=$("#notificationMessage").value.trim();

if(!title||!message){

toast("Enter notification");

return;

}

const users=await getDocs(

collection(
db,
collections.users
)

);

const tasks=[];

users.forEach(user=>{

tasks.push(

addDoc(

collection(
db,
collections.notifications
),

{

uid:user.id,

title,

message,

read:false,

type:"promotion",

createdAt:serverTimestamp()

}

)

);

});

await Promise.all(tasks);

toast("Notification Sent");

};

window.exportProducts=()=>{

const rows=[

["Name","Brand","Price","Sale Price","Stock"]

];

state.products.forEach(item=>{

rows.push([

item.name,

item.brand,

item.price,

item.salePrice,

item.stock

]);

});

const csv=rows

.map(r=>r.join(","))

.join("\n");

const blob=new Blob(

[csv],

{

type:"text/csv"

}

);

const url=

URL.createObjectURL(blob);

const link=

document.createElement("a");

link.href=url;

link.download="products.csv";

link.click();

URL.revokeObjectURL(url);

};

window.importProducts=file=>{

const reader=new FileReader();

reader.onload=e=>{

console.log(

e.target.result

);

toast(

"CSV Loaded"

);

};

reader.readAsText(file);

};

onAuthStateChanged(

auth,

user=>{

if(!user){

location.href="login.html";

return;

}

loadDashboard();

}

);

window.addEventListener(

"load",

()=>{

$("#productImport")

?.addEventListener(

"change",

e=>{

if(e.target.files.length){

importProducts(

e.target.files[0]

);

}

}

);

}

);

console.log(

"%cAdmin Dashboard Ready",

"font-size:16px;color:#2563eb;font-weight:bold"

);
