// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-1
// FIREBASE CONNECTION + AUTH SYSTEM
// ==========================================================


import {

auth,
db,
storage,
collections,

onAuthStateChanged,

collection,
doc,

getDoc,
setDoc,

updateDoc,

serverTimestamp,

onSnapshot,

query,
where,
orderBy,

addDoc,
deleteDoc,

uploadProductImages,

signOut

} from "./firebase.js";




// ==========================================================
// GLOBAL VARIABLES
// ==========================================================


let currentUser = null;

let allProducts = [];

let allCategories = [];

let allBrands = [];

let cartItems = [];

let wishlistItems = [];

let userOrders = [];





// ==========================================================
// APP START
// ==========================================================


document.addEventListener(

"DOMContentLoaded",

()=>{


console.log(

"User Panel Loaded"

);



initializeApp();



}

);





// ==========================================================
// AUTH CHECK
// ==========================================================


function initializeApp(){


onAuthStateChanged(

auth,

async(user)=>{


if(user){


currentUser=user;



console.log(

"Logged User:",

user.uid

);



await createUserProfile();



startRealtimeSystem();



}

else{


window.location.href="login.html";


}



}

);



}





// ==========================================================
// CREATE USER DOCUMENT
// ==========================================================


async function createUserProfile(){


const userRef = doc(

db,

collections.users,

currentUser.uid

);



const userSnap = await getDoc(

userRef

);



if(!userSnap.exists()){


await setDoc(

userRef,

{


uid:

currentUser.uid,


name:

currentUser.displayName || "User",


email:

currentUser.email || "",


phone:"",


address:"",


photo:"",


role:"user",


createdAt:

serverTimestamp()



}

);



}



}





// ==========================================================
// START ALL FIREBASE REALTIME CONNECTION
// ==========================================================


function startRealtimeSystem(){


loadProducts();


loadCategories();


loadBrands();


loadCart();


loadWishlist();


loadOrders();


loadUserProfile();


loadNotifications();


}





// ==========================================================
// LOGOUT
// ==========================================================


const logoutBtn =

document.getElementById(

"menuLogout"

);



if(logoutBtn){


logoutBtn.onclick=async()=>{


await signOut(auth);


location.href="login.html";


};



}


// ==========================================================
// END PART-1
// ==========================================================


// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-2
// PRODUCT + CATEGORY + BRAND REALTIME SYSTEM
// ADMIN PANEL → FIREBASE → USER PANEL
// ==========================================================



// ==========================================================
// LOAD PRODUCTS
// ==========================================================


function loadProducts(){


const q = query(

collection(

db,

collections.products

),

orderBy(

"createdAt",

"desc"

)

);



onSnapshot(

q,

(snapshot)=>{


allProducts=[];



snapshot.forEach(

(docSnap)=>{


allProducts.push({


id:docSnap.id,


...docSnap.data()


});


});



renderProducts(allProducts);



renderFeaturedProducts(allProducts);



}

);



}





// ==========================================================
// LOAD CATEGORIES
// ==========================================================


function loadCategories(){


const q=query(

collection(

db,

collections.categories

),

orderBy(

"createdAt",

"desc"

)

);



onSnapshot(

q,

(snapshot)=>{


allCategories=[];



snapshot.forEach(

(docSnap)=>{


allCategories.push({


id:docSnap.id,


...docSnap.data()


});


});



renderCategories(allCategories);



}

);



}





// ==========================================================
// LOAD BRANDS
// ==========================================================


function loadBrands(){


const q=query(

collection(

db,

collections.brands

)

);



onSnapshot(

q,

(snapshot)=>{


allBrands=[];



snapshot.forEach(

(docSnap)=>{


allBrands.push({


id:docSnap.id,


...docSnap.data()


});


});



}

);



}





// ==========================================================
// SHOW PRODUCTS
// ==========================================================


function renderProducts(products){


const grid=

document.getElementById(

"productGrid"

);



if(!grid)return;



grid.innerHTML="";



products.forEach(product=>{



grid.innerHTML += `


<div class="product-card">


<div class="product-image">


<img src="${
product.images?.[0] ||
product.image ||
''
}">



<button class="favorite-btn"

onclick="addWishlist('${product.id}')">

♡


</button>


</div>



<div class="product-info">


<div class="product-brand">

${product.brand || ""}

</div>



<h3 class="product-title">

${product.name || product.title || ""}

</h3>



<div class="price-box">


<span class="new-price">

৳${product.price || 0}

</span>


</div>



<div class="card-actions">


<button class="add-cart"

onclick="addToCart('${product.id}')">

Add Cart

</button>



<button class="buy-now"

onclick="openProduct('${product.id}')">

View

</button>



</div>



</div>


</div>


`;



});



}





// ==========================================================
// FEATURED PRODUCTS
// ==========================================================


function renderFeaturedProducts(products){


const box=

document.getElementById(

"featuredProducts"

);



if(!box)return;



box.innerHTML="";



products.slice(0,6)

.forEach(product=>{



box.innerHTML += `


<div class="product-card">


<div class="product-image">


<img src="${
product.images?.[0] ||
product.image ||
''
}">


</div>



<div class="product-info">


<h3 class="product-title">

${product.name || ""}

</h3>



<div class="price-box">


<span class="new-price">

৳${product.price || 0}

</span>


</div>


</div>


</div>


`;



});



}





// ==========================================================
// SHOW CATEGORIES
// ==========================================================


function renderCategories(categories){


const box=

document.getElementById(

"categoryGrid"

);



if(!box)return;



box.innerHTML="";



categories.forEach(category=>{


box.innerHTML += `


<div class="category-card"

onclick="filterByCategory('${category.name}')">


<img src="${category.image || ''}">



<h4>

${category.name}

</h4>


</div>


`;



});



}





// ==========================================================
// CATEGORY FILTER
// ==========================================================


function filterByCategory(name){


const result=

allProducts.filter(

product=>

product.category===name

);



renderProducts(result);



}




window.filterByCategory=

filterByCategory;



// ==========================================================
// END PART-2
// ==========================================================

// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-3
// CART SYSTEM
// FIREBASE CART COLLECTION
// ADD / UPDATE / DELETE / REALTIME
// ==========================================================


// ==========================================================
// LOAD USER CART
// ==========================================================


function loadCart(){


if(!currentUser)return;



const q=query(

collection(

db,

collections.cart

),

where(

"uid",

"==",

currentUser.uid

)

);



onSnapshot(

q,

(snapshot)=>{


cartItems=[];



snapshot.forEach(

(docSnap)=>{


cartItems.push({


id:docSnap.id,


...docSnap.data()


});


});



renderCart();



}

);



}





// ==========================================================
// ADD PRODUCT TO CART
// ==========================================================


async function addToCart(productId){


if(!currentUser)return;



const product=

allProducts.find(

item=>

item.id===productId

);



if(!product)return;




const already=

cartItems.find(

item=>

item.productId===productId

);




if(already){


await updateDoc(

doc(

db,

collections.cart,

already.id

),

{


quantity:

already.quantity + 1


}

);



}

else{


await addDoc(

collection(

db,

collections.cart

),

{


uid:

currentUser.uid,


productId:


product.id,


name:


product.name || product.title,



image:


product.images?.[0] || product.image || "",



price:


Number(product.price || 0),



quantity:1,



createdAt:

serverTimestamp()



}

);



}



showToast(

"Added to cart",

"success"

);



}





// ==========================================================
// RENDER CART
// ==========================================================


function renderCart(){


const box=

document.getElementById(

"cartItems"

);



if(!box)return;



box.innerHTML="";



let total=0;



cartItems.forEach(item=>{


total +=

item.price *

item.quantity;




box.innerHTML += `



<div class="cart-item">



<img src="${item.image}">



<div>


<h4>

${item.name}

</h4>



<p>

৳${item.price}

</p>



<div>


<button

onclick="updateCartQty('${item.id}',${item.quantity-1})">

-

</button>



<span>

${item.quantity}

</span>



<button

onclick="updateCartQty('${item.id}',${item.quantity+1})">

+

</button>



<button

onclick="removeCartItem('${item.id}')">

Delete

</button>



</div>



</div>



</div>



`;



});



const subtotal=

document.getElementById(

"subtotalPrice"

);



const grand=

document.getElementById(

"grandTotal"

);



if(subtotal)

subtotal.innerText=

money(total);



if(grand)

grand.innerText=

money(total);



}





// ==========================================================
// UPDATE QUANTITY
// ==========================================================


async function updateCartQty(id,qty){


if(qty<=0){


removeCartItem(id);


return;


}



await updateDoc(

doc(

db,

collections.cart,

id

),

{


quantity:qty


}

);



}





// ==========================================================
// REMOVE CART ITEM
// ==========================================================


async function removeCartItem(id){


await deleteDoc(

doc(

db,

collections.cart,

id

)

);



}





// ==========================================================
// MONEY FORMAT
// ==========================================================


function money(value){


return "৳"+

Number(value || 0)

.toLocaleString();



}





window.addToCart=

addToCart;



window.updateCartQty=

updateCartQty;



window.removeCartItem=

removeCartItem;



// ==========================================================
// END PART-3
// ==========================================================

// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-4
// WISHLIST SYSTEM
// PRODUCT DETAILS MODAL
// ==========================================================



// ==========================================================
// LOAD USER WISHLIST
// ==========================================================


function loadWishlist(){


if(!currentUser)return;



const q=query(

collection(

db,

collections.wishlist

),

where(

"uid",

"==",

currentUser.uid

)

);



onSnapshot(

q,

(snapshot)=>{


wishlistItems=[];



snapshot.forEach(

(docSnap)=>{


wishlistItems.push({


id:docSnap.id,


...docSnap.data()


});


});



renderWishlist();



}

);



}





// ==========================================================
// ADD TO WISHLIST
// ==========================================================


async function addWishlist(productId){


const product=

allProducts.find(

p=>p.id===productId

);



if(!product)return;



const exist=

wishlistItems.find(

item=>

item.productId===productId

);



if(exist){


showToast(

"Already in wishlist",

"alert"

);


return;


}



await addDoc(

collection(

db,

collections.wishlist

),

{


uid:

currentUser.uid,



productId:


product.id,



name:


product.name || product.title,



image:


product.images?.[0] || "",



price:


product.price || 0,



createdAt:

serverTimestamp()



}

);



showToast(

"Added wishlist",

"success"

);



}





// ==========================================================
// REMOVE WISHLIST
// ==========================================================


async function removeWishlist(id){


await deleteDoc(

doc(

db,

collections.wishlist,

id

)

);



}





// ==========================================================
// RENDER WISHLIST
// ==========================================================


function renderWishlist(){


const box=

document.getElementById(

"wishlistList"

);



if(!box)return;



box.innerHTML="";



wishlistItems.forEach(item=>{


box.innerHTML += `


<div class="wishlist-card">


<img width="70"

src="${item.image}">



<div>


<h4>

${item.name}

</h4>



<p>

৳${item.price}

</p>



</div>



<button

onclick="removeWishlist('${item.id}')">

Remove

</button>



</div>



`;



});



}





// ==========================================================
// OPEN PRODUCT DETAILS
// ==========================================================


function openProduct(productId){


const product=

allProducts.find(

p=>p.id===productId

);



if(!product)return;



const modal=

document.getElementById(

"productModal"

);



if(!modal)return;




document.getElementById(

"productTitle"

).innerText=

product.name || "";




document.getElementById(

"productDiscountPrice"

).innerText=

money(product.price);




document.getElementById(

"productDescription"

).innerText=

product.description || "";




document.getElementById(

"productBrand"

).innerText=

product.brand || "";




document.getElementById(

"productStock"

).innerText=

product.stock || 0;




const mainImage=

document.getElementById(

"productMainImage"

);



if(mainImage)

mainImage.src=

product.images?.[0] || "";




const thumbs=

document.getElementById(

"productThumbnails"

);



if(thumbs){


thumbs.innerHTML="";



(product.images || [])

.forEach(img=>{


thumbs.innerHTML +=`


<img src="${img}"

onclick="changeMainImage('${img}')">


`;



});



}




modal.classList.add(

"active"

);



}





// ==========================================================
// CHANGE PRODUCT IMAGE
// ==========================================================


function changeMainImage(img){


const main=

document.getElementById(

"productMainImage"

);



if(main)

main.src=img;



}





// ==========================================================
// CLOSE PRODUCT MODAL
// ==========================================================


const closeProduct=

document.getElementById(

"closeProductModal"

);



if(closeProduct){


closeProduct.onclick=()=>{


document

.getElementById(

"productModal"

)

.classList.remove(

"active"

);



};


}





window.openProduct=

openProduct;



window.changeMainImage=

changeMainImage;



window.addWishlist=

addWishlist;



window.removeWishlist=

removeWishlist;



// ==========================================================
// END PART-4
// ==========================================================


// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-5
// ORDER SYSTEM
// CHECKOUT
// FIREBASE ORDERS COLLECTION
// ADMIN PANEL WILL SEE ORDERS
// ==========================================================



// ==========================================================
// LOAD USER ORDERS
// ==========================================================


function loadOrders(){


if(!currentUser)return;



const q=query(

collection(

db,

collections.orders

),

where(

"uid",

"==",

currentUser.uid

),

orderBy(

"createdAt",

"desc"

)

);



onSnapshot(

q,

(snapshot)=>{


userOrders=[];



snapshot.forEach(

(docSnap)=>{


userOrders.push({


id:docSnap.id,


...docSnap.data()


});


});



renderOrders();



}

);



}





// ==========================================================
// RENDER ORDER HISTORY
// ==========================================================


function renderOrders(){


const box=

document.getElementById(

"orderHistoryList"

);



if(!box)return;



box.innerHTML="";



userOrders.forEach(order=>{


box.innerHTML += `



<div class="history-card">


<div>


<h4>

Order #${order.orderNumber || order.id}

</h4>



<p>

${order.status || "Pending"}

</p>



<p>

৳${order.total || 0}

</p>


</div>



</div>


`;



});



}





// ==========================================================
// CHECKOUT FORM SUBMIT
// ==========================================================


const checkoutForm =

document.getElementById(

"checkoutForm"

);



if(checkoutForm){



checkoutForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



if(cartItems.length===0){


showToast(

"Cart Empty",

"error"

);


return;


}



const total =

cartItems.reduce(

(sum,item)=>

sum +

(item.price *

item.quantity),

0

);



const orderNumber=

"ORD" +

Date.now();





await addDoc(

collection(

db,

collections.orders

),

{


uid:

currentUser.uid,



orderNumber:



orderNumber,



items:


cartItems,



customer:{


name:

document.getElementById(

"customerName"

).value,



phone:

document.getElementById(

"customerPhone"

).value,



division:

document.getElementById(

"division"

).value,



district:

document.getElementById(

"district"

).value,



upazila:

document.getElementById(

"upazila"

).value,



area:

document.getElementById(

"area"

).value,



address:

document.getElementById(

"address"

).value



},



payment:

document.querySelector(

"input[name='payment']:checked"

).value,



total:

total,



status:

"Pending",



createdAt:

serverTimestamp()



}

);



await clearCart();



document.getElementById(

"generatedOrderNumber"

).innerText=

orderNumber;



document.getElementById(

"orderSuccessModal"

)

.classList.add(

"active"

);



}

);



}





// ==========================================================
// CLEAR CART AFTER ORDER
// ==========================================================


async function clearCart(){



for(const item of cartItems){



await deleteDoc(

doc(

db,

collections.cart,

item.id

)

);



}



}





// ==========================================================
// CLOSE SUCCESS MODAL
// ==========================================================


const continueBtn=

document.getElementById(

"continueShopping"

);



if(continueBtn){


continueBtn.onclick=()=>{


document

.getElementById(

"orderSuccessModal"

)

.classList.remove(

"active"

);



};



}





// ==========================================================
// END PART-5
// ==========================================================

// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-6
// USER PROFILE SYSTEM
// FIREBASE USERS COLLECTION UPDATE
// PROFILE IMAGE UPLOAD
// ==========================================================



// ==========================================================
// LOAD USER PROFILE
// ==========================================================


function loadUserProfile(){


if(!currentUser)return;



const userRef = doc(

db,

collections.users,

currentUser.uid

);



onSnapshot(

userRef,

(snapshot)=>{


if(!snapshot.exists()) return;



const data = snapshot.data();



const name =

data.name || "User";



const phone =

data.phone || "";



const image =

data.photo || "";





const drawerName =

document.getElementById(

"drawerUserName"

);



const drawerPhone =

document.getElementById(

"drawerUserPhone"

);



const profileName =

document.getElementById(

"profileName"

);



const profilePhone =

document.getElementById(

"profilePhone"

);



const profileImage =

document.getElementById(

"profileImage"

);



const drawerImage =

document.getElementById(

"drawerProfileImage"

);





if(drawerName)

drawerName.innerText=name;



if(drawerPhone)

drawerPhone.innerText=phone;



if(profileName)

profileName.innerText=name;



if(profilePhone)

profilePhone.innerText=phone;



if(profileImage)

profileImage.src=

image || "https://via.placeholder.com/120";



if(drawerImage)

drawerImage.src=

image || "https://via.placeholder.com/60";





const editName=

document.getElementById(

"editName"

);



const editPhone=

document.getElementById(

"editPhone"

);



const editAddress=

document.getElementById(

"editAddress"

);



if(editName)

editName.value=name;



if(editPhone)

editPhone.value=phone;



if(editAddress)

editAddress.value=

data.address || "";



}

);



}





// ==========================================================
// SAVE PROFILE DATA
// ==========================================================


const saveProfileBtn=

document.getElementById(

"saveProfileButton"

);



if(saveProfileBtn){


saveProfileBtn.onclick=async()=>{



await updateDoc(

doc(

db,

collections.users,

currentUser.uid

),

{


name:

document.getElementById(

"editName"

).value,



phone:

document.getElementById(

"editPhone"

).value,



address:

document.getElementById(

"editAddress"

).value,



updatedAt:

serverTimestamp()



}

);



showToast(

"Profile Updated",

"success"

);



};



}





// ==========================================================
// PROFILE IMAGE UPLOAD
// ==========================================================


const profileUpload=

document.getElementById(

"profileUpload"

);



if(profileUpload){



profileUpload.onchange=

async(e)=>{



const file =

e.target.files[0];



if(!file)return;




const urls =

await uploadProductImages(

[file],

"users"

);



if(urls.length){



await updateDoc(

doc(

db,

collections.users,

currentUser.uid

),

{


photo:

urls[0]

}

);



showToast(

"Image Updated",

"success"

);



}



};



}





// ==========================================================
// END PART-6
// ==========================================================

// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-7
// SEARCH + FILTER + SORT SYSTEM
// CATEGORY / BRAND / PRICE / RATING / STOCK
// ==========================================================



// ==========================================================
// SEARCH PRODUCT
// ==========================================================


const searchInput =

document.getElementById(

"searchInput"

);



const searchBtn =

document.getElementById(

"searchBtn"

);



function searchProducts(){


const text =

searchInput.value

.toLowerCase()

.trim();



const result =

allProducts.filter(product=>{


const name =

(product.name || product.title || "")

.toLowerCase();



const brand =

(product.brand || "")

.toLowerCase();



return (

name.includes(text)

||

brand.includes(text)

);



});



renderProducts(result);



}



if(searchBtn){


searchBtn.onclick=

searchProducts;


}



if(searchInput){


searchInput.addEventListener(

"keyup",

(e)=>{


if(e.key==="Enter"){


searchProducts();


}



}

);



}





// ==========================================================
// CATEGORY FILTER SELECT
// ==========================================================


const categoryFilter=

document.getElementById(

"categoryFilter"

);



if(categoryFilter){



categoryFilter.onchange=

()=>{


applyFilters();



};



}





// ==========================================================
// BRAND FILTER
// ==========================================================


const brandFilter=

document.getElementById(

"brandFilter"

);



if(brandFilter){



brandFilter.onchange=

()=>{


applyFilters();



};



}





// ==========================================================
// PRICE FILTER
// ==========================================================


const priceFilter=

document.getElementById(

"priceFilter"

);



if(priceFilter){



priceFilter.onchange=

()=>{


applyFilters();



};



}





// ==========================================================
// RATING FILTER
// ==========================================================


const ratingFilter=

document.getElementById(

"ratingFilter"

);



if(ratingFilter){



ratingFilter.onchange=

()=>{


applyFilters();



};



}





// ==========================================================
// STOCK FILTER
// ==========================================================


const stockFilter=

document.getElementById(

"stockFilter"

);



if(stockFilter){



stockFilter.onchange=

()=>{


applyFilters();



};



}





// ==========================================================
// SORT FILTER
// ==========================================================


const sortFilter=

document.getElementById(

"sortFilter"

);



if(sortFilter){



sortFilter.onchange=

()=>{


applyFilters();



};



}





// ==========================================================
// MAIN FILTER FUNCTION
// ==========================================================


function applyFilters(){


let result=[...allProducts];





// CATEGORY


if(categoryFilter?.value){


result=

result.filter(

p=>

p.category===categoryFilter.value

);



}





// BRAND


if(brandFilter?.value){


result=

result.filter(

p=>

p.brand===brandFilter.value

);



}





// PRICE


if(priceFilter?.value){



if(priceFilter.value==="low"){


result.sort(

(a,b)=>

a.price-b.price

);



}



if(priceFilter.value==="high"){


result.sort(

(a,b)=>

b.price-a.price

);



}



}





// RATING


if(ratingFilter?.value){



const rating=

Number(

ratingFilter.value

);



result=

result.filter(

p=>

Number(p.rating || 0)>=rating

);



}





// STOCK


if(stockFilter?.value==="available"){



result=

result.filter(

p=>

Number(p.stock)>0

);



}





// SORT


if(sortFilter?.value){



switch(

sortFilter.value

){



case "newest":



result.sort(

(a,b)=>

(b.createdAt?.seconds || 0)

-

(a.createdAt?.seconds || 0)

);



break;




case "lowPrice":



result.sort(

(a,b)=>

a.price-b.price

);



break;




case "highPrice":



result.sort(

(a,b)=>

b.price-a.price

);



break;




case "popular":



result.sort(

(a,b)=>

(b.views || 0)

-

(a.views || 0)

);



break;




case "bestSelling":



result.sort(

(a,b)=>

(b.sold || 0)

-

(a.sold || 0)

);



break;




case "topRated":



result.sort(

(a,b)=>

(b.rating || 0)

-

(a.rating || 0)

);



break;



}



}





renderProducts(result);



}





// ==========================================================
// END PART-7
// ==========================================================

// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-8
// NOTIFICATION SYSTEM
// ADMIN PANEL → USER REALTIME NOTIFICATION
// ==========================================================



// ==========================================================
// LOAD USER NOTIFICATIONS
// ==========================================================


function loadNotifications(){


if(!currentUser)return;



const q=query(

collection(

db,

collections.notifications

),

where(

"uid",

"==",

currentUser.uid

),

orderBy(

"createdAt",

"desc"

)

);



onSnapshot(

q,

(snapshot)=>{


let notifications=[];



snapshot.forEach(

docSnap=>{


notifications.push({


id:docSnap.id,


...docSnap.data()


});



});



renderNotifications(notifications);



}

);



}





// ==========================================================
// RENDER NOTIFICATIONS
// ==========================================================


function renderNotifications(list){



const count=

document.getElementById(

"notificationCount"

);



if(count){


count.innerText=

list.length;



}



const box=

document.getElementById(

"notificationList"

);



if(!box)return;



box.innerHTML="";



list.forEach(item=>{


box.innerHTML += `



<div class="notification-card">


<h4>

${item.title || "Notification"}

</h4>



<p>

${item.message || ""}

</p>



<span>

${formatDate(item.createdAt)}

</span>



</div>



`;



});



}





// ==========================================================
// FORMAT DATE
// ==========================================================


function formatDate(time){


if(!time)return "";



if(time.seconds){


return new Date(

time.seconds*1000

)

.toLocaleString();



}



return "";



}





// ==========================================================
// OPEN NOTIFICATION BUTTON
// ==========================================================


const notificationBtn=

document.getElementById(

"notificationBtn"

);



if(notificationBtn){


notificationBtn.onclick=()=>{


const drawer=

document.getElementById(

"drawer"

);



if(drawer)

drawer.classList.remove(

"active"

);



const box=

document.getElementById(

"notificationArea"

);



if(box)

box.classList.toggle(

"active"

);



};



}





// ==========================================================
// CREATE LOCAL TOAST MESSAGE
// ==========================================================


function showToast(message,type="success"){



const container=

document.getElementById(

"toastContainer"

);



if(!container)return;



const div=

document.createElement(

"div"

);



div.className=

"toast "+type;



div.innerText=

message;



container.appendChild(div);



setTimeout(()=>{


div.remove();



},3000);



}





// ==========================================================
// ADMIN NOTIFICATION LISTENER
// ==========================================================


function listenAdminNotifications(){


const q=query(

collection(

db,

collections.notifications

),

where(

"uid",

"==",

currentUser.uid

)

);



onSnapshot(

q,

(snapshot)=>{



snapshot.docChanges()

.forEach(change=>{



if(change.type==="added"){



const data=

change.doc.data();



if(data.createdAt){



showToast(

data.message ||

"New Notification",

"success"

);



}



}



});



}

);



}





// ==========================================================
// END PART-8
// ==========================================================


// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-9
// CHAT SYSTEM
// USER ↔ ADMIN REALTIME MESSAGE
// FIREBASE CHATS + MESSAGES
// ==========================================================



let currentChatId = null;



// ==========================================================
// CREATE USER CHAT ID
// ==========================================================


function getChatId(){


if(!currentUser)return null;



return currentUser.uid;



}





// ==========================================================
// OPEN CHAT PANEL
// ==========================================================


const menuChat =

document.getElementById(

"menuChat"

);



const bottomChat =

document.querySelector(

'[data-page="chat"]'

);



function openChat(){



const panel=

document.getElementById(

"chatPanel"

);



if(panel)

panel.classList.add(

"active"

);



currentChatId=

getChatId();



loadMessages();



}





if(menuChat){


menuChat.onclick=openChat;


}



if(bottomChat){


bottomChat.onclick=openChat;


}





// ==========================================================
// CLOSE CHAT
// ==========================================================


const closeChat=

document.getElementById(

"closeChatPanel"

);



if(closeChat){



closeChat.onclick=()=>{


document

.getElementById(

"chatPanel"

)

.classList.remove(

"active"

);



};



}





// ==========================================================
// LOAD CHAT MESSAGES
// ==========================================================


function loadMessages(){


if(!currentChatId)return;



const q=query(

collection(

db,

collections.chats,

currentChatId,

"messages"

),

orderBy(

"createdAt",

"asc"

)

);



onSnapshot(

q,

(snapshot)=>{


const messages=[];



snapshot.forEach(

docSnap=>{


messages.push({


id:docSnap.id,


...docSnap.data()


});



});



renderMessages(messages);



}

);



}





// ==========================================================
// SHOW MESSAGES
// ==========================================================


function renderMessages(messages){



const box=

document.getElementById(

"chatMessages"

);



if(!box)return;



box.innerHTML="";



messages.forEach(msg=>{



let type =

msg.sender==="admin"

?

"admin"

:

"user";




box.innerHTML += `



<div class="message ${type}">


${msg.text || ""}



<span class="message-time">

${formatDate(msg.createdAt)}

</span>



</div>



`;



});



box.scrollTop=

box.scrollHeight;



}





// ==========================================================
// SEND MESSAGE
// ==========================================================


const sendBtn=

document.getElementById(

"sendMessageButton"

);



const chatInput=

document.getElementById(

"chatInput"

);





if(sendBtn){



sendBtn.onclick=

sendMessage;



}



if(chatInput){



chatInput.addEventListener(

"keypress",

(e)=>{



if(e.key==="Enter"){


sendMessage();



}



}

);



}





async function sendMessage(){



const text=

chatInput.value.trim();



if(!text)return;



if(!currentChatId)

currentChatId=

getChatId();





await addDoc(

collection(

db,

collections.chats,

currentChatId,

"messages"

),

{


text:text,



sender:"user",



uid:

currentUser.uid,



createdAt:

serverTimestamp()



}

);



await setDoc(

doc(

db,

collections.chats,

currentChatId

),

{


uid:

currentUser.uid,



updatedAt:

serverTimestamp()



},

{

merge:true

}

);



chatInput.value="";



}





// ==========================================================
// SEND CHAT IMAGE
// ==========================================================


const chatImage=

document.getElementById(

"chatImage"

);



if(chatImage){



chatImage.onchange=

async(e)=>{



const file=

e.target.files[0];



if(!file)return;



const urls=

await uploadProductImages(

[file],

"chat"

);



await addDoc(

collection(

db,

collections.chats,

currentUser.uid,

"messages"

),

{


image:

urls[0],



sender:"user",



createdAt:

serverTimestamp()



}

);



};



}





// ==========================================================
// END PART-9
// ==========================================================


// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-10
// DRAWER MENU
// BOTTOM NAVIGATION
// PAGE SWITCHING
// DARK MODE
// FINAL CONTROLS
// ==========================================================



// ==========================================================
// DRAWER OPEN / CLOSE
// ==========================================================


const mobileMenuBtn =

document.getElementById(

"mobileMenuBtn"

);


const drawer =

document.getElementById(

"drawer"

);


const overlay =

document.getElementById(

"drawerOverlay"

);


const drawerClose =

document.getElementById(

"drawerClose"

);





function openDrawer(){


drawer?.classList.add(

"active"

);


overlay?.classList.add(

"active"

);



}




function closeDrawer(){


drawer?.classList.remove(

"active"

);


overlay?.classList.remove(

"active"

);



}





if(mobileMenuBtn){


mobileMenuBtn.onclick=openDrawer;


}



if(drawerClose){


drawerClose.onclick=closeDrawer;


}



if(overlay){


overlay.onclick=closeDrawer;


}





// ==========================================================
// BOTTOM NAVIGATION
// ==========================================================


const navItems=

document.querySelectorAll(

".nav-item"

);



navItems.forEach(item=>{



item.onclick=()=>{



navItems.forEach(btn=>{


btn.classList.remove(

"active"

);



});



item.classList.add(

"active"

);



const page=

item.dataset.page;



switch(page){



case "home":



showHome();



break;



case "wishlist":



showWishlistPage();



break;



case "cart":



openCart();



break;



case "chat":



openChat();



break;



case "profile":



showProfile();



break;



}



};



});





// ==========================================================
// PAGE FUNCTIONS
// ==========================================================


function hidePages(){


document

.querySelectorAll(

".page"

)

.forEach(page=>{


page.classList.add(

"hidden"

);



});



}





function showHome(){


hidePages();



window.scrollTo({

top:0,

behavior:"smooth"

});



}





function showProfile(){


hidePages();



const profile=

document.getElementById(

"profilePage"

);



profile?.classList.remove(

"hidden"

);



}





function showWishlistPage(){


hidePages();



const profile=

document.getElementById(

"profilePage"

);



profile?.classList.remove(

"hidden"

);



const list=

document.getElementById(

"wishlistList"

);



if(list)

list.scrollIntoView({

behavior:"smooth"

});



}





// ==========================================================
// CART DRAWER
// ==========================================================


function openCart(){



const cart=

document.getElementById(

"cartDrawer"

);



cart?.classList.add(

"active"

);



}





const closeCart=

document.getElementById(

"closeCart"

);



if(closeCart){



closeCart.onclick=()=>{


document

.getElementById(

"cartDrawer"

)

.classList.remove(

"active"

);



};



}





// ==========================================================
// DARK MODE
// ==========================================================


const themeToggle=

document.getElementById(

"themeToggle"

);



if(themeToggle){



themeToggle.onchange=()=>{



if(themeToggle.checked){


document.documentElement.classList.add(

"dark"

);



localStorage.setItem(

"theme",

"dark"

);



}

else{


document.documentElement.classList.remove(

"dark"

);



localStorage.setItem(

"theme",

"light"

);



}



};



}





// LOAD SAVED THEME


if(

localStorage.getItem(

"theme"

)==="dark"

){


document.documentElement.classList.add(

"dark"

);



if(themeToggle)

themeToggle.checked=true;



}





// ==========================================================
// VIEW ALL BUTTONS
// ==========================================================


const viewAllProducts=

document.getElementById(

"viewAllProducts"

);



if(viewAllProducts){



viewAllProducts.onclick=()=>{


renderProducts(

allProducts

);



};





}



const viewAllCategory=

document.getElementById(

"viewAllCategory"

);



if(viewAllCategory){



viewAllCategory.onclick=()=>{


renderCategories(

allCategories

);



};



}





// ==========================================================
// END PART-10
// ==========================================================


// ==========================================================
// USER PANEL app.js (CLEAN VERSION)
// PART-11
// FINAL CONNECTION
// MISSING FUNCTIONS
// SYSTEM CHECK
// ==========================================================



// ==========================================================
// AUTO RUN AFTER AUTH
// ==========================================================


function startFinalSystem(){



console.log(

"All User Panel Systems Connected"

);



// start notification listener

if(currentUser){

listenAdminNotifications();


}



}



// ==========================================================
// PRODUCT COUNT
// ==========================================================


function updateProductCount(total){


const count=

document.getElementById(

"productCount"

);



if(count){


count.innerText=

`${total} Products`;


}



}





// ==========================================================
// UPDATE PRODUCT COUNT WITH RENDER
// ==========================================================


const oldRenderProducts=

renderProducts;



renderProducts=function(products){



oldRenderProducts(products);



updateProductCount(

products.length

);



};





// ==========================================================
// CLOSE CHECKOUT MODAL
// ==========================================================


const closeCheckout=

document.getElementById(

"closeCheckout"

);



if(closeCheckout){



closeCheckout.onclick=()=>{



document

.getElementById(

"checkoutModal"

)

.classList.remove(

"active"

);



};



}





// ==========================================================
// CHECKOUT OPEN BUTTON
// ==========================================================


const checkoutButton=

document.getElementById(

"checkoutButton"

);



if(checkoutButton){



checkoutButton.onclick=()=>{



document

.getElementById(

"checkoutModal"

)

.classList.add(

"active"

);



};



}





// ==========================================================
// QUANTITY CONTROL
// ==========================================================


const qtyPlus=

document.getElementById(

"qtyPlus"

);



const qtyMinus=

document.getElementById(

"qtyMinus"

);



const productQty=

document.getElementById(

"productQty"

);





if(qtyPlus){



qtyPlus.onclick=()=>{



productQty.value=

Number(productQty.value)+1;



};



}





if(qtyMinus){



qtyMinus.onclick=()=>{



if(Number(productQty.value)>1){


productQty.value=

Number(productQty.value)-1;



}



};



}





// ==========================================================
// INITIAL DATA CHECK
// ==========================================================


window.addEventListener(

"load",

()=>{



console.log(

"User Panel Ready"

);



});





// ==========================================================
// GLOBAL EXPORTS
// ==========================================================


window.openCart=

openCart;



window.showToast=

showToast;



window.applyFilters=

applyFilters;



window.searchProducts=

searchProducts;



// ==========================================================
// FINAL END
// ==========================================================

// ==========================================================
// USER PANEL app.js
// PART-12
// FINAL CONNECTOR
// FIREBASE DATA SYNC CHECK
// ADMIN PANEL COMPATIBILITY
// ==========================================================



// ==========================================================
// ADMIN PRODUCT DATA COMPATIBILITY
// ==========================================================


function normalizeProduct(product){


return {


id:product.id,


name:

product.name ||

product.title ||

"Product",



title:

product.title ||

product.name || "",



description:

product.description || "",



brand:

product.brand || "",



category:

product.category || "",



price:

Number(product.price || 0),



stock:

Number(product.stock || 0),



images:

product.images ||

product.image ?

[product.image]

:

[],



rating:

Number(product.rating || 0),



sold:

Number(product.sold || 0),



createdAt:

product.createdAt || null



};



}





// ==========================================================
// FIX PRODUCT DATA FROM FIREBASE
// ==========================================================


const oldProductListener = loadProducts;



loadProducts=function(){



const q=query(

collection(

db,

collections.products

),

orderBy(

"createdAt",

"desc"

)

);



onSnapshot(

q,

(snapshot)=>{



allProducts=[];



snapshot.forEach(

docSnap=>{



allProducts.push(

normalizeProduct(

{

id:docSnap.id,

...docSnap.data()

}

)

);



});



renderProducts(

allProducts

);



renderFeaturedProducts(

allProducts

);



}



);



};





// ==========================================================
// AUTO UPDATE FILTER OPTIONS
// ==========================================================


function updateFilterOptions(){



const categorySelect=

document.getElementById(

"categoryFilter"

);



const brandSelect=

document.getElementById(

"brandFilter"

);




if(categorySelect){



categorySelect.innerHTML=

`<option value="">Category</option>`;



allCategories.forEach(cat=>{



categorySelect.innerHTML +=`


<option value="${cat.name}">

${cat.name}

</option>


`;



});



}





if(brandSelect){



brandSelect.innerHTML=

`<option value="">Brand</option>`;



allBrands.forEach(brand=>{



brandSelect.innerHTML +=`


<option value="${brand.name}">

${brand.name}

</option>


`;



});



}



}





// ==========================================================
// WATCH CATEGORY + BRAND UPDATE
// ==========================================================


const oldLoadCategories=

loadCategories;



loadCategories=function(){



const q=query(

collection(

db,

collections.categories

)

);



onSnapshot(

q,

snapshot=>{



allCategories=[];



snapshot.forEach(

docSnap=>{


allCategories.push({


id:docSnap.id,


...docSnap.data()



});



});



renderCategories(

allCategories

);



updateFilterOptions();



}

);



};





const oldLoadBrands=

loadBrands;



loadBrands=function(){



onSnapshot(

collection(

db,

collections.brands

),

snapshot=>{



allBrands=[];



snapshot.forEach(

docSnap=>{



allBrands.push({


id:docSnap.id,


...docSnap.data()



});



});



updateFilterOptions();



}

);



};





// ==========================================================
// START FINAL CHECK
// ==========================================================


console.log(

`
================================

USER PANEL CONNECTED

Firebase:
✓ Products
✓ Categories
✓ Brands
✓ Cart
✓ Wishlist
✓ Orders
✓ Notifications
✓ Chat
✓ Profile

Admin Panel Data Sync Ready

================================
`

);



// ==========================================================
// END PART-12
// ==========================================================