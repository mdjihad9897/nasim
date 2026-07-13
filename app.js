import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc
} from "./firebase.js";

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

applyCoupon

}from"./firebase.js";

const $=selector=>document.querySelector(selector);

const $$=selector=>document.querySelectorAll(selector);

const state={

user:null,

profile:null,

products:[],

categories:[],

banners:[],

wishlist:[],

cart:[],

orders:[],

notifications:[],

selectedProduct:null,

chatId:null,

discount:0,

deliveryCharge:80,

currentBanner:0

};

const heroWrapper=$("#heroWrapper");
const heroPagination=$("#heroPagination");
const categoryGrid=$("#categoryGrid");
const productGrid=$("#productGrid");
const featuredProducts=$("#featuredProducts");

const wishlistList=$("#wishlistList");
const cartItems=$("#cartItems");
const orderHistory=$("#orderHistoryList");

const toastContainer=$("#toastContainer");

const searchInput=$("#searchInput");

const categoryFilter=$("#categoryFilter");
const brandFilter=$("#brandFilter");
const priceFilter=$("#priceFilter");
const ratingFilter=$("#ratingFilter");
const stockFilter=$("#stockFilter");
const sortFilter=$("#sortFilter");

const notificationCount=$("#notificationCount");

const subtotalPrice=$("#subtotalPrice");
const deliveryCharge=$("#deliveryCharge");
const discountAmount=$("#discountAmount");
const grandTotal=$("#grandTotal");

const drawer=$("#drawer");
const drawerOverlay=$("#drawerOverlay");

const productModal=$("#productModal");

const cartDrawer=$("#cartDrawer");

const chatPanel=$("#chatPanel");

const checkoutModal=$("#checkoutModal");

const orderSuccessModal=$("#orderSuccessModal");

const productSkeleton=$("#productSkeleton");

const emptyState=$("#emptyState");

const dialog=$("#alertDialog");

const productCount=$("#productCount");

const formatter=new Intl.NumberFormat(

"en-BD"

);

const currency=value=>`৳${formatter.format(value)}`;

function showToast(message,type="success"){

const toast=document.createElement("div");

toast.className=`toast ${type}`;

toast.textContent=message;

toastContainer.appendChild(toast);

setTimeout(()=>{

toast.remove();

},3500);

}

function showDialog(title,message,callback){

$("#dialogTitle").textContent=title;

$("#dialogMessage").textContent=message;

dialog.classList.remove("hidden");

$("#dialogConfirm").onclick=()=>{

dialog.classList.add("hidden");

callback?.();

};

$("#dialogCancel").onclick=()=>{

dialog.classList.add("hidden");

};

}

function openModal(modal){

modal.classList.add("active");

}

function closeModal(modal){

modal.classList.remove("active");

}

function formatDate(timestamp){

if(!timestamp) return "";

const date=timestamp.toDate();

return date.toLocaleDateString(

"en-BD",

{

day:"2-digit",

month:"short",

year:"numeric"

}

);

}


function renderHeroSlider(){

heroWrapper.innerHTML="";

heroPagination.innerHTML="";

state.banners.forEach((banner,index)=>{

const slide=document.createElement("div");

slide.className="hero-slide";

slide.innerHTML=`

<img
loading="lazy"
src="${banner.image}"
alt="${banner.title}">

<div class="hero-content">

<h2>${banner.title}</h2>

<p>${banner.subtitle}</p>

<button
data-link="${banner.link}">
Shop Now
</button>

</div>

`;

heroWrapper.appendChild(slide);

const dot=document.createElement("span");

if(index===0){

dot.classList.add("active");

}

heroPagination.appendChild(dot);

});

}

function startHeroSlider(){

setInterval(()=>{

if(state.banners.length===0){

return;

}

state.currentBanner++;

if(state.currentBanner>=state.banners.length){

state.currentBanner=0;

}

heroWrapper.style.transform=

`translateX(-${state.currentBanner*100}%)`;

[...heroPagination.children].forEach((dot,index)=>{

dot.classList.toggle(

"active",

index===state.currentBanner

);

});

},5000);

}

function renderCategories(){

categoryGrid.innerHTML="";

categoryFilter.innerHTML=

`<option value="">Category</option>`;

state.categories.forEach(category=>{

const card=document.createElement("div");

card.className="category-card";

card.innerHTML=`

<img
loading="lazy"
src="${category.image}"
alt="${category.name}">

<h4>${category.name}</h4>

`;

card.onclick=()=>{

categoryFilter.value=category.id;

filterProducts();

};

categoryGrid.appendChild(card);

categoryFilter.innerHTML+=`

<option value="${category.id}">

${category.name}

</option>

`;

});

}

function productCard(product){

return `

<div
class="product-card fade-in">

<div
class="product-image">

<img
loading="lazy"
src="${product.images[0]}"
alt="${product.name}">

<div
class="discount-badge">

${product.discount}%

</div>

<button
class="favorite-btn"
onclick="toggleWishlist('${product.id}')">

<svg
viewBox="0 0 24 24">

<path
d="M12 21L4 14A5 5 0 0112 5A5 5 0 0120 14Z"/>

</svg>

</button>

</div>

<div
class="product-info">

<p
class="product-brand">

${product.brand}

</p>

<h3
class="product-title">

${product.name}

</h3>

<div
class="price-box">

<span
class="new-price">

${currency(product.salePrice)}

</span>

<span
class="old-price">

${currency(product.price)}

</span>

</div>

<div
class="rating-box">

<svg
viewBox="0 0 24 24">

<path
d="M12 2l3 7h7l-6 5 2 8-6-4-6 4 2-8-6-5h7z"/>

</svg>

<span>

${product.rating}

</span>

</div>

<div
class="card-actions">

<button
class="buy-now"
onclick="viewProduct('${product.id}')">

Details

</button>

<button
class="add-cart"
onclick="quickAddCart('${product.id}')">

Add

</button>

</div>

</div>

</div>

`;

}


function renderProducts(list=state.products){

productSkeleton.classList.add("hidden");

productGrid.innerHTML="";

featuredProducts.innerHTML="";

productCount.textContent=

`${list.length} Products`;

if(!list.length){

emptyState.classList.remove("hidden");

return;

}

emptyState.classList.add("hidden");

list.forEach((product,index)=>{

productGrid.insertAdjacentHTML(

"beforeend",

productCard(product)

);

if(index<8){

featuredProducts.insertAdjacentHTML(

"beforeend",

productCard(product)

);

}

});

}

function filterProducts(){

let products=[...state.products];

const keyword=searchInput.value

.trim()

.toLowerCase();

if(keyword){

products=products.filter(product=>

product.name

.toLowerCase()

.includes(keyword)

||

product.brand

.toLowerCase()

.includes(keyword)

);

}

if(categoryFilter.value){

products=products.filter(product=>

product.categoryId===categoryFilter.value

);

}

if(brandFilter.value){

products=products.filter(product=>

product.brand===brandFilter.value

);

}

if(stockFilter.value==="available"){

products=products.filter(product=>

product.stock>0

);

}

if(stockFilter.value==="unavailable"){

products=products.filter(product=>

product.stock===0

);

}

if(priceFilter.value){

const price=priceFilter.value;

if(price==="1"){

products=products.filter(p=>p.salePrice<=500);

}

if(price==="2"){

products=products.filter(p=>

p.salePrice>500&&p.salePrice<=2000

);

}

if(price==="3"){

products=products.filter(p=>

p.salePrice>2000

);

}

}

if(ratingFilter.value){

products=products.filter(product=>

Number(product.rating)>=Number(ratingFilter.value)

);

}

switch(sortFilter.value){

case"lowPrice":

products.sort((a,b)=>

a.salePrice-b.salePrice

);

break;

case"highPrice":

products.sort((a,b)=>

b.salePrice-a.salePrice

);

break;

case"topRated":

products.sort((a,b)=>

b.rating-a.rating

);

break;

case"popular":

products.sort((a,b)=>

b.views-a.views

);

break;

case"bestSelling":

products.sort((a,b)=>

b.sales-a.sales

);

break;

default:

products.sort((a,b)=>

b.createdAt.seconds-a.createdAt.seconds

);

}

renderProducts(products);

}

searchInput.oninput=filterProducts;

categoryFilter.onchange=filterProducts;

brandFilter.onchange=filterProducts;

priceFilter.onchange=filterProducts;

ratingFilter.onchange=filterProducts;

stockFilter.onchange=filterProducts;

sortFilter.onchange=filterProducts;


window.viewProduct=id=>{

const product=state.products.find(

item=>item.id===id

);

if(!product){

return;

}

state.selectedProduct=product;

$("#productMainImage").src=

product.images[0];

$("#productTitle").textContent=

product.name;

$("#productBadge").textContent=

product.badge;

$("#productBrand").textContent=

product.brand;

$("#productSKU").textContent=

product.sku;

$("#productStock").textContent=

product.stock>0?

"In Stock":"Out Of Stock";

$("#productDiscountPrice").textContent=

currency(product.salePrice);

$("#productOriginalPrice").textContent=

currency(product.price);

$("#productDescription").textContent=

product.description;

$("#productQty").value=1;

const starContainer=$("#productStars");

starContainer.innerHTML="";

for(let i=1;i<=5;i++){

starContainer.innerHTML+=`

<svg width="18" height="18" viewBox="0 0 24 24">

<path fill="${
i<=Math.round(product.rating)
?"#fbbf24":"#d1d5db"
}"

d="M12 2l3 7h7l-6 5 2 8-6-4-6 4 2-8-6-5h7z"/>

</svg>

`;

}

$("#productReviewCount").textContent=

`${product.reviewCount} Reviews`;

const specs=$("#productSpecifications");

specs.innerHTML="";

Object.entries(product.specifications)

.forEach(([key,value])=>{

specs.innerHTML+=`

<div class="spec-row">

<strong>${key}</strong>

<span>${value}</span>

</div>

`;

});

const thumbs=$("#productThumbnails");

thumbs.innerHTML="";

product.images.forEach((image,index)=>{

const img=document.createElement("img");

img.src=image;

if(index===0){

img.classList.add("active");

}

img.onclick=()=>{

$("#productMainImage").src=image;

thumbs.querySelectorAll("img")

.forEach(item=>

item.classList.remove("active")

);

img.classList.add("active");

};

thumbs.appendChild(img);

});

openModal(productModal);

};

$("#closeProductModal").onclick=()=>

closeModal(productModal);

$("#qtyPlus").onclick=()=>{

const input=$("#productQty");

input.value=Number(input.value)+1;

};

$("#qtyMinus").onclick=()=>{

const input=$("#productQty");

if(Number(input.value)>1){

input.value=Number(input.value)-1;

}

};

$("#wishlistButton").onclick=()=>{

if(!state.selectedProduct)return;

toggleWishlist(state.selectedProduct.id);

};

$("#addCartButton").onclick=()=>{

if(!state.selectedProduct)return;

quickAddCart(state.selectedProduct.id);

closeModal(productModal);

};


window.toggleWishlist=async productId=>{

if(!state.user){

location.href="login.html";

return;

}

const exists=state.wishlist.find(

item=>item.productId===productId

);

if(exists){

await removeWishlist(

state.user.uid,

productId

);

showToast(

"Removed from wishlist",

"alert"

);

}else{

await saveWishlist(

state.user.uid,

productId

);

showToast(

"Added to wishlist"

);

}

};

window.quickAddCart=async productId=>{

if(!state.user){

location.href="login.html";

return;

}

await addCartItem(

state.user.uid,

productId,

1

);

showToast(

"Product added to cart"

);

};

function renderCart(){

cartItems.innerHTML="";

let subtotal=0;

state.cart.forEach(item=>{

const product=state.products.find(

p=>p.id===item.productId

);

if(!product)return;

subtotal+=

product.salePrice*item.quantity;

cartItems.innerHTML+=`

<div class="cart-item">

<img
src="${product.images[0]}">

<div>

<h4>

${product.name}

</h4>

<p>

${currency(product.salePrice)}

</p>

<div
class="quantity-box">

<button
onclick="changeQty('${product.id}',${item.quantity-1})">

-

</button>

<input
value="${item.quantity}"
readonly>

<button
onclick="changeQty('${product.id}',${item.quantity+1})">

+

</button>

</div>

<button
onclick="deleteCart('${product.id}')">

Remove

</button>

</div>

</div>

`;

});

const total=

subtotal+

state.deliveryCharge-

state.discount;

subtotalPrice.textContent=

currency(subtotal);

deliveryCharge.textContent=

currency(state.deliveryCharge);

discountAmount.textContent=

currency(state.discount);

grandTotal.textContent=

currency(total);

}

window.changeQty=async(id,qty)=>{

if(qty<=0){

deleteCart(id);

return;

}

await updateCartQuantity(

state.user.uid,

id,

qty

);

};

window.deleteCart=async(id)=>{

await removeCartItem(

state.user.uid,

id

);

showToast(

"Cart updated"

);

};

$("#applyCoupon").onclick=async()=>{

const code=$("#couponCode")

.value

.trim()

.toUpperCase();

if(!code)return;

const coupon=

await applyCoupon(code);

if(!coupon){

showToast(

"Invalid coupon",

"error"

);

return;

}

const data=coupon.data();

state.discount=data.amount;

renderCart();

showToast(

"Coupon applied"

);

};

$("#checkoutButton").onclick=()=>{

openModal(checkoutModal);

};

$("#closeCheckout").onclick=()=>{

closeModal(checkoutModal);

};


$("#checkoutForm").onsubmit=async event=>{

event.preventDefault();

if(!state.user)return;

const payment=document.querySelector(

'input[name="payment"]:checked'

).value;

const orderItems=[];

let total=0;

state.cart.forEach(item=>{

const product=state.products.find(

p=>p.id===item.productId

);

if(!product)return;

orderItems.push({

productId:product.id,

name:product.name,

image:product.images[0],

price:product.salePrice,

quantity:item.quantity

});

total+=product.salePrice*item.quantity;

});

const order = {
  uid: state.user.uid,
  customerName: $("#customerName").value.trim(),
  phone: $("#customerPhone").value.trim(),
  division: $("#division").value.trim(), // ইউজার যা লিখবে তা-ই সেভ হবে
  district: $("#district").value.trim(),
  upazila: $("#upazila").value.trim(),
  area: $("#area").value.trim(),
  address: $("#address").value.trim(),
  deliveryNote: $("#deliveryNote").value.trim(),
  paymentMethod: payment,
  deliveryCharge: state.deliveryCharge,
  discount: state.discount,
  total: total + state.deliveryCharge - state.discount,
  items: orderItems
};

const orderId=

await createOrder(order);

$("#generatedOrderNumber").textContent=

orderId;

closeModal(checkoutModal);

openModal(orderSuccessModal);

await pushNotification({

uid:state.user.uid,

title:"Order Confirmed",

message:"Your order has been placed successfully."

});

};

$("#continueShopping").onclick=()=>{

closeModal(orderSuccessModal);

cartDrawer.classList.remove("active");

};

$("#closeCart").onclick=()=>{

cartDrawer.classList.remove("active");

};

document

.querySelector('[data-page="cart"]')

.onclick=()=>{

cartDrawer.classList.add("active");

};

document

.querySelector('[data-page="chat"]')

.onclick=()=>{

chatPanel.classList.add("active");

};

$("#closeChatPanel").onclick=()=>{

chatPanel.classList.remove("active");

};

$("#chatInput").addEventListener(

"input",

()=>{

if(state.chatId){

updateTyping(

state.chatId,

true

);

clearTimeout(window.typingTimer);

window.typingTimer=setTimeout(()=>{

updateTyping(

state.chatId,

false

);

},1200);

}

}

);

$("#sendMessageButton").onclick=async()=>{

const input=$("#chatInput");

const text=input.value.trim();

if(!text||!state.chatId)return;

await sendChatMessage(

state.chatId,

{

sender:state.user.uid,

type:"text",

text

}

);

input.value="";

};

$("#chatImage").onchange=async event=>{

const file=event.target.files[0];

if(!file||!state.chatId)return;

const image=

await uploadChatImage(

state.chatId,

file

);

await sendChatMessage(

state.chatId,

{

sender:state.user.uid,

type:"image",

image

}

);

};



function renderMessages(messages){

const container=$("#chatMessages");

container.innerHTML="";

messages.forEach(message=>{

const mine=

message.sender===state.user.uid;

const item=document.createElement("div");

item.className=

`message ${mine?"user":"admin"}`;

if(message.type==="image"){

item.innerHTML=`

<img
src="${message.image}"
style="width:220px;border-radius:12px;display:block;">

<span class="message-time">

${formatDate(message.createdAt)}

</span>

`;

}else{

item.innerHTML=`

<div>

${message.text}

</div>

<span class="message-time">

${formatDate(message.createdAt)}

</span>

`;

}

container.appendChild(item);

});

container.scrollTop=

container.scrollHeight;

markMessagesRead(state.chatId);

}

function renderOrders(){

orderHistory.innerHTML="";

state.orders.forEach(order=>{

orderHistory.innerHTML+=`

<div class="history-card">

<div>

<h4>

${order.orderNumber}

</h4>

<p>

${currency(order.total)}

</p>

</div>

<div>

${order.status}

</div>

</div>

`;

});

}

function renderWishlist(){

wishlistList.innerHTML="";

state.wishlist.forEach(item=>{

const product=

state.products.find(

p=>p.id===item.productId

);

if(!product)return;

wishlistList.innerHTML+=`

<div class="wishlist-card">

<div>

<strong>

${product.name}

</strong>

<p>

${currency(product.salePrice)}

</p>

</div>

<button
onclick="toggleWishlist('${product.id}')">

Remove

</button>

</div>

`;

});

}

function renderNotifications(list){

notificationCount.textContent=

list.length;

}

$("#mobileMenuBtn").onclick=()=>{

drawer.classList.add("active");

drawerOverlay.classList.add("active");

};

$("#moreMenuBtn").onclick=()=>{

drawer.classList.add("active");

drawerOverlay.classList.add("active");

};

$("#drawerClose").onclick=()=>{

drawer.classList.remove("active");

drawerOverlay.classList.remove("active");

};

drawerOverlay.onclick=()=>{

drawer.classList.remove("active");

drawerOverlay.classList.remove("active");

};

$("#themeToggle").onchange=e=>{

document.documentElement

.classList.toggle(

"dark",

e.target.checked

);

};

$("#profileUpload").onchange=async e=>{

const file=e.target.files[0];

if(!file||!state.user)return;

const url=

await uploadProfileImage(

state.user.uid,

file

);

await updateUserDocument(

state.user.uid,

{

photo:url

}

);

$("#profileImage").src=url;

$("#drawerProfileImage").src=url;

showToast(

"Profile updated"

);

};



$("#profileName").textContent=

state.profile.name;

$("#profilePhone").textContent=

state.profile.phone;

$("#drawerUserName").textContent=

state.profile.name;

$("#drawerUserPhone").textContent=

state.profile.phone;

$("#editName").value=

state.profile.name;

$("#editPhone").value=

state.profile.phone;

$("#editAddress").value=

state.profile.address;

$("#profileImage").src=

state.profile.photo;

$("#drawerProfileImage").src=

state.profile.photo;

}

state.chatId=user.uid;

await createChat(user.uid);

watchMessages(

user.uid,

renderMessages

);

watchWishlist(

user.uid,

items=>{

state.wishlist=items;

renderWishlist();

}

);

watchCart(

user.uid,

items=>{

state.cart=items;

renderCart();

}

);

watchOrders(

user.uid,

orders=>{

state.orders=orders;

renderOrders();

}

);

watchNotifications(

user.uid,

notifications=>{

state.notifications=

notifications;

renderNotifications(

notifications

);

}

);

}

);

loadBanners(list=>{

state.banners=list;

renderHeroSlider();

startHeroSlider();

});

loadCategories(list=>{

state.categories=list;

renderCategories();

});

loadProducts(products=>{

state.products=products;

productSkeleton.classList.add(

"hidden"

);

renderProducts();

const brands=[

...new Set(

products.map(

item=>item.brand

)

)

];

brandFilter.innerHTML=

'<option value="">Brand</option>';

brands.forEach(brand=>{

brandFilter.innerHTML+=`

<option value="${brand}">

${brand}

</option>

`;

});

});

}

$("#saveProfileButton").onclick=

async()=>{

await updateUserDocument(

state.user.uid,

{

name:$("#editName").value,

phone:$("#editPhone").value,

address:$("#editAddress").value

}

);

showToast(

"Profile saved"

);

};

window.addEventListener(

"load",

initialize

);

window.onclick=e=>{

if(e.target===productModal)

closeModal(productModal);

if(e.target===checkoutModal)

closeModal(checkoutModal);

if(e.target===orderSuccessModal)

closeModal(orderSuccessModal);

};

window.addEventListener(

"online",

()=>showToast(

"Internet Connected"

)

);

window.addEventListener(

"offline",

()=>showToast(

"Internet Disconnected",

"error"

)

);


// --- Navigation Tab Switcher Fix ---
document.querySelectorAll(".nav-item").forEach(button => {
  button.onclick = (e) => {
    // 1. Remove active class from all buttons
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });
    button.classList.add("active");

    const page = button.dataset.page;

    // 2. Hide all main views/pages
    document.querySelector("main").classList.add("hidden");
    $("#profilePage").classList.add("hidden");
    cartDrawer.classList.remove("active");
    chatPanel.classList.remove("active");

    // 3. Show targeted view
    if (page === "home") {
      document.querySelector("main").classList.remove("hidden");
    } 
    else if (page === "profile") {
      $("#profilePage").classList.remove("hidden");
    } 
    else if (page === "wishlist") {
      $("#profilePage").classList.remove("hidden");
      setTimeout(() => {
        wishlistList.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } 
    else if (page === "cart") {
      document.querySelector("main").classList.remove("hidden");
      cartDrawer.classList.add("active");
    } 
    else if (page === "chat") {
      document.querySelector("main").classList.remove("hidden");
      chatPanel.classList.add("active");
    }
  };
});

$("#menuProfile").onclick=(e)=>{
e.preventDefault();
drawer.classList.remove("active");
drawerOverlay.classList.remove("active");
document.querySelector('[data-page="profile"]').click();
};

$("#menuWishlist").onclick=(e)=>{
e.preventDefault();
drawer.classList.remove("active");
drawerOverlay.classList.remove("active");
document.querySelector('[data-page="wishlist"]').click();
};

$("#menuChat").onclick=(e)=>{
e.preventDefault();
drawer.classList.remove("active");
drawerOverlay.classList.remove("active");
document.querySelector('[data-page="chat"]').click();
};

$("#menuOrders").onclick=(e)=>{
e.preventDefault();
drawer.classList.remove("active");
drawerOverlay.classList.remove("active");
document.querySelector('[data-page="profile"]').click();
setTimeout(()=>{
orderHistory.scrollIntoView({ behavior:"smooth" });
}, 100);
};

$("#menuNotifications").onclick=(e)=>{
e.preventDefault();
showToast(`${state.notifications.length} Notifications`);
};

$("#menuSettings").onclick=(e)=>{
e.preventDefault();
drawer.classList.remove("active");
drawerOverlay.classList.remove("active");
document.querySelector('[data-page="profile"]').click();
};

$("#menuHelp").onclick=(e)=>{
e.preventDefault();
showDialog("Help Center", "Please contact support through live chat.");
};

$("#menuContact").onclick=(e)=>{
e.preventDefault();
showDialog("Contact", "Customer Care: +880XXXXXXXXXX");
};

$("#menuAbout").onclick=(e)=>{
e.preventDefault();
showDialog("About", "Premium Firebase E-Commerce Platform");
};

$("#menuLogout").onclick=async(e)=>{
e.preventDefault();
showDialog("Logout", "Do you want to logout?", async()=>{
const {signOut}=await import("./firebase.js");
await signOut(auth);
location.href="login.html";
});
};



document.addEventListener("visibilitychange",()=>{

if(!state.chatId)return;

if(document.hidden){

import("./firebase.js").then(api=>{

api.updateOnline(state.chatId,false);

});

}else{

import("./firebase.js").then(api=>{

api.updateOnline(state.chatId,true);

});

}

});

window.addEventListener("beforeunload",()=>{

if(!state.chatId)return;

import("./firebase.js").then(api=>{

api.updateOnline(state.chatId,false);

});

});

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("loaded");

observer.unobserve(entry.target);

}

});

});

function observeLazyImages(){

document.querySelectorAll("img[loading='lazy']").forEach(img=>{

img.classList.add("lazy");

img.onload=()=>img.classList.add("loaded");

observer.observe(img);

});

}

const originalRenderProducts=renderProducts;

renderProducts=function(list=state.products){

originalRenderProducts(list);

observeLazyImages();

};

document.addEventListener("keydown",event=>{

if(event.key==="Escape"){

closeModal(productModal);

closeModal(checkoutModal);

closeModal(orderSuccessModal);

drawer.classList.remove("active");

drawerOverlay.classList.remove("active");

cartDrawer.classList.remove("active");

chatPanel.classList.remove("active");

}

});

setInterval(()=>{

if(state.user&&state.chatId){

import("./firebase.js").then(api=>{

api.updateOnline(state.chatId,true);

});

}

},30000);

console.log(

"%cPremium Firebase E-Commerce Loaded",

"color:#2563eb;font-size:16px;font-weight:bold;"

);

// Global User Logic
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    if (typeof state !== 'undefined') state.user = user;
    await loadUserProfileData(user);
  } else {
    if (typeof state !== 'undefined') {
      state.user = null;
      state.profile = null;
    }
    resetProfileUI();
  }
});

async function loadUserProfileData(user) {
  try {
    const profileName = document.getElementById("profileName");
    const editName = document.getElementById("editName");
    
    if (profileName) profileName.textContent = user.displayName || "User";
    if (editName) editName.value = user.displayName || "";

    if (typeof db !== 'undefined' && typeof doc !== 'undefined' && typeof getDoc !== 'undefined') {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (typeof state !== 'undefined') state.profile = userData;

        const profilePhone = document.getElementById("profilePhone");
        const editPhone = document.getElementById("editPhone");
        const editAddress = document.getElementById("editAddress");

        if (profilePhone) profilePhone.textContent = userData.phone || "";
        if (editPhone) editPhone.value = userData.phone || "";
        if (editAddress) editAddress.value = userData.address || "";
      }
    }
  } catch (error) {
    console.error("Profile load error:", error);
  }
}

function resetProfileUI() {
  const profileName = document.getElementById("profileName");
  const profilePhone = document.getElementById("profilePhone");
  const editName = document.getElementById("editName");
  const editPhone = document.getElementById("editPhone");
  const editAddress = document.getElementById("editAddress");

  if (profileName) profileName.textContent = "Guest User";
  if (profilePhone) profilePhone.textContent = "";
  if (editName) editName.value = "";
  if (editPhone) editPhone.value = "";
  if (editAddress) editAddress.value = "";
}

// Profile Click Only Navigation
document.addEventListener("DOMContentLoaded", () => {
  const profileNavBtn = document.querySelector('.nav-item[data-page="profile"]');
  const menuProfileBtn = document.getElementById("menuProfile");

  function handleProfileClick(event) {
    if (!currentUser) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = "login.html";
    }
  }

  if (profileNavBtn) profileNavBtn.addEventListener("click", handleProfileClick);
  if (menuProfileBtn) menuProfileBtn.addEventListener("click", handleProfileClick);
});
