/* ==========================================================
   app.js
   PART-1
   IMPORTS + GLOBAL STATE + DOM + INITIALIZATION
   ========================================================== */

import {
  auth,
  db,
  collections,

  onAuthStateChanged,
  signOut,

  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,

  uploadProductImages,

  loadProducts,
  loadCategories,
  loadBanners,
  watchWishlist,
  watchCart,
  watchOrders,
  watchNotifications,
  watchChatMessages,

  createOrder,
  applyCoupon

} from "./firebase.js";

/* ==========================================================
   APPLICATION STATE
   ========================================================== */

const state = {

    user:null,

    profile:{},

    banners:[],

    categories:[],

    products:[],

    featuredProducts:[],

    wishlist:[],

    cart:[],

    orders:[],

    notifications:[],

    messages:[],

    currentProduct:null,

    currentImage:0,

    quantity:1,

    coupon:null,

    discount:0,

    subtotal:0,

    delivery:0,

    total:0,

    search:"",

    filterCategory:"",

    filterBrand:"",

    filterPrice:"",

    filterRating:"",

    filterStock:"",

    sort:"newest"

};

/* ==========================================================
   DOM
   ========================================================== */

const $ = id => document.getElementById(id);

/* ---------- Header ---------- */

const mobileMenuBtn=$("mobileMenuBtn");
const drawer=$("drawer");
const drawerOverlay=$("drawerOverlay");
const drawerClose=$("drawerClose");

const notificationBtn=$("notificationBtn");
const notificationCount=$("notificationCount");

/* ---------- Hero ---------- */

const heroWrapper=$("heroWrapper");
const heroPagination=$("heroPagination");

/* ---------- Category ---------- */

const categoryGrid=$("categoryGrid");

/* ---------- Product ---------- */

const featuredProducts=$("featuredProducts");
const productGrid=$("productGrid");
const productCount=$("productCount");
const productSkeleton=$("productSkeleton");
const emptyState=$("emptyState");

/* ---------- Search ---------- */

const searchInput=$("searchInput");

const categoryFilter=$("categoryFilter");
const brandFilter=$("brandFilter");
const priceFilter=$("priceFilter");
const ratingFilter=$("ratingFilter");
const stockFilter=$("stockFilter");
const sortFilter=$("sortFilter");

/* ---------- Product Modal ---------- */

const productModal=$("productModal");

const productMainImage=$("productMainImage");
const productThumbnails=$("productThumbnails");

const productBadge=$("productBadge");
const productTitle=$("productTitle");

const productStars=$("productStars");
const productReviewCount=$("productReviewCount");

const productDiscountPrice=$("productDiscountPrice");
const productOriginalPrice=$("productOriginalPrice");

const productBrand=$("productBrand");
const productSKU=$("productSKU");
const productStock=$("productStock");

const productDescription=$("productDescription");
const productSpecifications=$("productSpecifications");

const productQty=$("productQty");

const qtyMinus=$("qtyMinus");
const qtyPlus=$("qtyPlus");

const wishlistButton=$("wishlistButton");
const addCartButton=$("addCartButton");

const closeProductModal=$("closeProductModal");

/* ---------- Cart ---------- */

const cartDrawer=$("cartDrawer");
const cartItems=$("cartItems");

const subtotalPrice=$("subtotalPrice");
const deliveryCharge=$("deliveryCharge");
const discountAmount=$("discountAmount");
const grandTotal=$("grandTotal");

const couponCode=$("couponCode");
const applyCouponButton=$("applyCoupon");

const checkoutButton=$("checkoutButton");

const closeCart=$("closeCart");

/* ---------- Checkout ---------- */

const checkoutModal=$("checkoutModal");

const checkoutForm=$("checkoutForm");

const placeOrderButton=$("placeOrderButton");

const closeCheckout=$("closeCheckout");

/* ---------- Success ---------- */

const orderSuccessModal=$("orderSuccessModal");

const generatedOrderNumber=$("generatedOrderNumber");

const continueShopping=$("continueShopping");

/* ---------- Chat ---------- */

const chatPanel=$("chatPanel");

const chatMessages=$("chatMessages");

const chatInput=$("chatInput");

const sendMessageButton=$("sendMessageButton");

const chatImage=$("chatImage");

const typingIndicator=$("typingIndicator");

const closeChatPanel=$("closeChatPanel");

/* ---------- Profile ---------- */

const profilePage=$("profilePage");

const profileImage=$("profileImage");

const profileName=$("profileName");

const profilePhone=$("profilePhone");

const editName=$("editName");

const editPhone=$("editPhone");

const editAddress=$("editAddress");

const profileUpload=$("profileUpload");

const saveProfileButton=$("saveProfileButton");

const orderHistoryList=$("orderHistoryList");

const wishlistList=$("wishlistList");

/* ---------- Drawer ---------- */

const drawerProfileImage=$("drawerProfileImage");

const drawerUserName=$("drawerUserName");

const drawerUserPhone=$("drawerUserPhone");

/* ---------- Toast ---------- */

const toastContainer=$("toastContainer");

/* ---------- Bottom Navigation ---------- */

const navItems=document.querySelectorAll(".nav-item");

/* ==========================================================
   START APPLICATION
   ========================================================== */

window.addEventListener("DOMContentLoaded",()=>{

    initializeApplication();

});

/* ==========================================================
   ROOT INITIALIZER
   ========================================================== */

async function initializeApplication(){

    setupEvents();

    setupAuthentication();

}


/* ==========================================================
   PART-2
   AUTHENTICATION + USER PROFILE + REALTIME LISTENERS
   ========================================================== */

function setupAuthentication(){

    onAuthStateChanged(auth,async(user)=>{

        if(!user){

            location.href="login.html";
            return;

        }

        state.user=user;

        await loadUserProfile();

        startRealtimeListeners();

    });

}

/* ==========================================================
   USER PROFILE
   ========================================================== */

async function loadUserProfile(){

    try{

        const ref=doc(db,collections.users,state.user.uid);

        const snap=await getDoc(ref);

        if(snap.exists()){

            state.profile=snap.data();

        }else{

            state.profile={

                uid:state.user.uid,

                name:state.user.displayName || "Customer",

                email:state.user.email,

                phone:"",

                address:"",

                photo:state.user.photoURL || "",

                createdAt:serverTimestamp()

            };

            await updateDoc(ref,state.profile);

        }

        renderUserProfile();

    }

    catch(error){

        console.error(error);

        showToast("Failed to load profile","error");

    }

}

/* ==========================================================
   PROFILE UI
   ========================================================== */

function renderUserProfile(){

    profileName.textContent=

        state.profile.name || "Customer";

    profilePhone.textContent=

        state.profile.phone || "";

    drawerUserName.textContent=

        state.profile.name || "Customer";

    drawerUserPhone.textContent=

        state.profile.phone || "";

    editName.value=

        state.profile.name || "";

    editPhone.value=

        state.profile.phone || "";

    editAddress.value=

        state.profile.address || "";

    const photo=

        state.profile.photo ||

        "https://ui-avatars.com/api/?name="+
        encodeURIComponent(state.profile.name);

    profileImage.src=photo;

    drawerProfileImage.src=photo;

}

/* ==========================================================
   SAVE PROFILE
   ========================================================== */

saveProfileButton?.addEventListener("click",saveProfile);

async function saveProfile(){

    try{

        const data={

            name:editName.value.trim(),

            phone:editPhone.value.trim(),

            address:editAddress.value.trim()

        };

        await updateDoc(

            doc(db,collections.users,state.user.uid),

            data

        );

        Object.assign(state.profile,data);

        renderUserProfile();

        showToast("Profile Updated","success");

    }

    catch(error){

        console.error(error);

        showToast("Update Failed","error");

    }

}

/* ==========================================================
   REALTIME LISTENERS
   ========================================================== */

function startRealtimeListeners(){

    loadBanners(data=>{

        state.banners=data;

        renderHeroSlider();

    });

    loadCategories(data=>{

        state.categories=data;

        renderCategories();

    });

    loadProducts(data=>{

        state.products=data;

        state.featuredProducts=

            data.filter(x=>x.featured);

        renderFeaturedProducts();

        renderProducts();

    });

    watchWishlist(

        state.user.uid,

        data=>{

            state.wishlist=data;

            renderWishlist();

        }

    );

    watchCart(

        state.user.uid,

        data=>{

            state.cart=data;

            calculateCart();

            renderCart();

        }

    );

    watchOrders(

        state.user.uid,

        data=>{

            state.orders=data;

            renderOrders();

        }

    );

    watchNotifications(

        state.user.uid,

        data=>{

            state.notifications=data;

            notificationCount.textContent=data.length;

        }

    );

    watchChatMessages(

        state.user.uid,

        data=>{

            state.messages=data;

            renderMessages();

        }

    );

}

/* ==========================================================
   LOGOUT
   ========================================================== */

$("menuLogout").addEventListener("click",async()=>{

    await signOut(auth);

    location.href="login.html";

});


/* ==========================================================
   PART-3
   BANNER SYSTEM + CATEGORY SYSTEM
   ========================================================== */

/* ==========================================================
   HERO SLIDER
   ========================================================== */

let heroIndex=0;
let heroTimer=null;

function renderHeroSlider(){

    heroWrapper.innerHTML="";
    heroPagination.innerHTML="";

    if(state.banners.length===0){

        heroWrapper.innerHTML=`
        <div class="hero-slide">
            <img src="https://placehold.co/1400x600?text=No+Banner">
        </div>`;

        return;

    }

    state.banners.forEach((banner,index)=>{

        heroWrapper.insertAdjacentHTML("beforeend",`

        <div class="hero-slide">

            <img
            src="${banner.image}"
            alt="${banner.title}"
            loading="lazy">

            <div class="hero-content">

                <h2>${banner.title||""}</h2>

                <p>${banner.subtitle||""}</p>

                ${
                banner.buttonText ?

                `<button
                onclick="window.location='${banner.link||"#"}'">

                ${banner.buttonText}

                </button>`

                :

                ""

                }

            </div>

        </div>

        `);

        heroPagination.insertAdjacentHTML(

            "beforeend",

            `<span class="${index===0?"active":""}"></span>`

        );

    });

    heroIndex=0;

    updateHeroSlider();

    clearInterval(heroTimer);

    heroTimer=setInterval(nextHeroSlide,5000);

}

/* ==========================================================
   NEXT HERO
   ========================================================== */

function nextHeroSlide(){

    if(state.banners.length===0) return;

    heroIndex++;

    if(heroIndex>=state.banners.length){

        heroIndex=0;

    }

    updateHeroSlider();

}

/* ==========================================================
   UPDATE HERO
   ========================================================== */

function updateHeroSlider(){

    heroWrapper.style.transform=

        `translateX(-${heroIndex*100}%)`;

    heroPagination

    .querySelectorAll("span")

    .forEach((dot,index)=>{

        dot.classList.toggle(

            "active",

            index===heroIndex

        );

    });

}

/* ==========================================================
   CATEGORY
   ========================================================== */

function renderCategories(){

    categoryGrid.innerHTML="";

    categoryFilter.innerHTML=

    `<option value="">Category</option>`;

    state.categories.forEach(category=>{

        categoryGrid.insertAdjacentHTML(

        "beforeend",

        `

        <div

        class="category-card"

        data-id="${category.id}">

            <img

            src="${category.image}"

            loading="lazy"

            class="lazy"

            alt="${category.name}">

            <h4>

            ${category.name}

            </h4>

        </div>

        `);

        categoryFilter.insertAdjacentHTML(

        "beforeend",

        `

        <option value="${category.id}">

        ${category.name}

        </option>

        `);

    });

    document

    .querySelectorAll(".category-card")

    .forEach(card=>{

        card.onclick=()=>{

            state.filterCategory=

            card.dataset.id;

            categoryFilter.value=

            card.dataset.id;

            renderProducts();

            window.scrollTo({

                top:550,

                behavior:"smooth"

            });

        };

    });

}

/* ==========================================================
   CATEGORY FILTER
   ========================================================== */

categoryFilter.addEventListener(

"change",

()=>{

state.filterCategory=

categoryFilter.value;

renderProducts();

}

);

/* ==========================================================
   HERO TOUCH SUPPORT
   ========================================================== */

let touchStartX=0;

let touchEndX=0;

heroWrapper.addEventListener(

"touchstart",

e=>{

touchStartX=e.changedTouches[0].clientX;

}

);

heroWrapper.addEventListener(

"touchend",

e=>{

touchEndX=e.changedTouches[0].clientX;

if(touchStartX-touchEndX>50){

nextHeroSlide();

}

if(touchEndX-touchStartX>50){

heroIndex--;

if(heroIndex<0){

heroIndex=state.banners.length-1;

}

updateHeroSlider();

}

}

);


/* ==========================================================
   PART-4
   PRODUCT SYSTEM
   PRODUCT RENDER + FEATURED + SEARCH BASE
   ========================================================== */

function renderFeaturedProducts(){

    featuredProducts.innerHTML="";

    if(state.featuredProducts.length===0){

        featuredProducts.innerHTML=`
        <h3>No Featured Product</h3>
        `;

        return;

    }

    state.featuredProducts.forEach(product=>{

        featuredProducts.insertAdjacentHTML(

        "beforeend",

        createProductCard(product)

        );

    });

    bindProductEvents();

}

/* ==========================================================
   ALL PRODUCTS
   ========================================================== */

function renderProducts(){

    productSkeleton.classList.add("hidden");

    let products=[...state.products];

    /* Search */

    if(state.search){

        products=products.filter(item=>

            item.name?.toLowerCase().includes(

                state.search.toLowerCase()

            ) ||

            item.brand?.toLowerCase().includes(

                state.search.toLowerCase()

            )

        );

    }

    /* Category */

    if(state.filterCategory){

        products=products.filter(

            item=>item.categoryId===state.filterCategory

        );

    }

    /* Brand */

    if(state.filterBrand){

        products=products.filter(

            item=>item.brand===state.filterBrand

        );

    }

    /* Stock */

    if(state.filterStock==="instock"){

        products=products.filter(

            item=>item.stock>0

        );

    }

    if(state.filterStock==="outstock"){

        products=products.filter(

            item=>item.stock<=0

        );

    }

    /* Rating */

    if(state.filterRating){

        products=products.filter(

            item=>

            Number(item.rating)>=

            Number(state.filterRating)

        );

    }

    /* Price */

    if(state.filterPrice){

        const range=state.filterPrice.split("-");

        const min=Number(range[0]);

        const max=Number(range[1]);

        products=products.filter(item=>{

            const price=

            Number(item.discountPrice||item.price);

            return price>=min && price<=max;

        });

    }

    /* Sort */

    switch(state.sort){

        case "lowPrice":

            products.sort((a,b)=>

                Number(a.discountPrice||a.price)-

                Number(b.discountPrice||b.price)

            );

        break;

        case "highPrice":

            products.sort((a,b)=>

                Number(b.discountPrice||b.price)-

                Number(a.discountPrice||a.price)

            );

        break;

        case "popular":

            products.sort((a,b)=>

                (b.views||0)-(a.views||0)

            );

        break;

        case "bestSelling":

            products.sort((a,b)=>

                (b.sales||0)-(a.sales||0)

            );

        break;

        case "topRated":

            products.sort((a,b)=>

                (b.rating||0)-(a.rating||0)

            );

        break;

        default:

            products.sort((a,b)=>

                (b.createdAt?.seconds||0)-

                (a.createdAt?.seconds||0)

            );

    }

    productGrid.innerHTML="";

    productCount.textContent=

    `${products.length} Products`;

    if(products.length===0){

        emptyState.classList.remove("hidden");

        return;

    }

    emptyState.classList.add("hidden");

    products.forEach(product=>{

        productGrid.insertAdjacentHTML(

        "beforeend",

        createProductCard(product)

        );

    });

    bindProductEvents();

}

/* ==========================================================
   PRODUCT CARD
   ========================================================== */

function createProductCard(product){

    return `

    <div class="product-card">

        <div class="product-image">

            <img
            src="${product.images?.[0]||''}"
            loading="lazy"
            class="lazy">

            ${
                product.discount

                ?

                `<span class="discount-badge">

                -${product.discount}%

                </span>`

                :

                ""

            }

            <button

            class="favorite-btn"

            data-wishlist="${product.id}">

            ❤

            </button>

        </div>

        <div class="product-info">

            <p class="product-brand">

            ${product.brand||""}

            </p>

            <h3 class="product-title">

            ${product.name}

            </h3>

            <div class="price-box">

                <span class="new-price">

                ৳${product.discountPrice||product.price}

                </span>

                <span class="old-price">

                ৳${product.price}

                </span>

            </div>

            <div class="rating-box">

                ⭐

                <span>

                ${product.rating||0}

                </span>

            </div>

            <div class="card-actions">

                <button

                class="add-cart"

                data-cart="${product.id}">

                Add Cart

                </button>

                <button

                class="buy-now"

                data-product="${product.id}">

                View

                </button>

            </div>

        </div>

    </div>

    `;

}

/* ==========================================================
   PRODUCT EVENTS
   ========================================================== */

function bindProductEvents(){

    document

    .querySelectorAll("[data-product]")

    .forEach(button=>{

        button.onclick=()=>{

            openProduct(

                button.dataset.product

            );

        };

    });

    document

    .querySelectorAll("[data-cart]")

    .forEach(button=>{

        button.onclick=()=>{

            addToCart(

                button.dataset.cart,

                1

            );

        };

    });

    document

    .querySelectorAll("[data-wishlist]")

    .forEach(button=>{

        button.onclick=()=>{

            toggleWishlist(

                button.dataset.wishlist

            );

        };

    });

}

/* ==========================================================
   SEARCH
   ========================================================== */

searchInput.addEventListener(

"input",

()=>{

state.search=

searchInput.value.trim();

renderProducts();

}

);

sortFilter.addEventListener(

"change",

()=>{

state.sort=

sortFilter.value;

renderProducts();

}

);


/* ==========================================================
   PART-5
   PRODUCT DETAILS MODAL
   ========================================================== */

function openProduct(productId){

    const product=state.products.find(

        item=>item.id===productId

    );

    if(!product) return;

    state.currentProduct=product;

    state.quantity=1;

    productQty.value=1;

    productModal.classList.add("active");

    renderProductModal();

}

function renderProductModal(){

    const p=state.currentProduct;

    if(!p) return;

    productBadge.textContent=p.badge||"";

    productTitle.textContent=p.name;

    productDiscountPrice.textContent=
    `৳${p.discountPrice||p.price}`;

    productOriginalPrice.textContent=
    `৳${p.price}`;

    productBrand.textContent=
    p.brand||"-";

    productSKU.textContent=
    p.sku||"-";

    productStock.textContent=
    p.stock||0;

    productDescription.textContent=
    p.description||"";

    productReviewCount.textContent=
    `${p.reviewCount||0} Reviews`;

    renderStars(p.rating||0);

    renderImages(p.images||[]);

    renderSpecifications(
        p.specifications||{}
    );

}

/* ==========================================================
   IMAGES
   ========================================================== */

function renderImages(images){

    productThumbnails.innerHTML="";

    if(images.length===0){

        productMainImage.src="";

        return;

    }

    productMainImage.src=images[0];

    images.forEach((image,index)=>{

        productThumbnails.insertAdjacentHTML(

        "beforeend",

        `

        <img

        src="${image}"

        data-image="${index}"

        class="${
        index===0?"active":""
        }">

        `);

    });

    document

    .querySelectorAll("#productThumbnails img")

    .forEach(img=>{

        img.onclick=()=>{

            productMainImage.src=img.src;

            document

            .querySelectorAll(

            "#productThumbnails img"

            )

            .forEach(x=>x.classList.remove("active"));

            img.classList.add("active");

        };

    });

}

/* ==========================================================
   SPECIFICATIONS
   ========================================================== */

function renderSpecifications(specs){

    productSpecifications.innerHTML="";

    Object.entries(specs).forEach(

    ([key,value])=>{

        productSpecifications.insertAdjacentHTML(

        "beforeend",

        `

        <div class="spec-row">

            <strong>${key}</strong>

            <span>${value}</span>

        </div>

        `);

    });

}

/* ==========================================================
   STAR RATING
   ========================================================== */

function renderStars(rating){

    productStars.innerHTML="";

    for(let i=1;i<=5;i++){

        productStars.insertAdjacentHTML(

        "beforeend",

        i<=Math.round(rating)

        ?

        "⭐"

        :

        "☆"

        );

    }

}

/* ==========================================================
   QUANTITY
   ========================================================== */

qtyPlus.onclick=()=>{

    state.quantity++;

    productQty.value=state.quantity;

};

qtyMinus.onclick=()=>{

    if(state.quantity<=1) return;

    state.quantity--;

    productQty.value=state.quantity;

};

productQty.oninput=()=>{

    state.quantity=

    Math.max(

        1,

        Number(productQty.value)||1

    );

};

/* ==========================================================
   PRODUCT ACTIONS
   ========================================================== */

addCartButton.onclick=()=>{

    if(!state.currentProduct) return;

    addToCart(

        state.currentProduct.id,

        state.quantity

    );

};

wishlistButton.onclick=()=>{

    if(!state.currentProduct) return;

    toggleWishlist(

        state.currentProduct.id

    );

};

/* ==========================================================
   CLOSE MODAL
   ========================================================== */

closeProductModal.onclick=()=>{

    productModal.classList.remove("active");

};

productModal.onclick=e=>{

    if(e.target===productModal){

        productModal.classList.remove("active");

    }

};


/* ==========================================================
   PART-6
   WISHLIST SYSTEM
   ========================================================== */

async function toggleWishlist(productId){

    if(!state.user) return;

    const item=state.products.find(
        p=>p.id===productId
    );

    if(!item) return;

    const exist=state.wishlist.find(
        x=>x.productId===productId
    );

    try{

        if(exist){

            await deleteDoc(

                doc(
                    db,
                    "wishlist",
                    exist.id
                )

            );

            showToast(
                "Removed From Wishlist",
                "success"
            );

        }else{

            await addDoc(

                collection(
                    db,
                    "wishlist"
                ),

                {

                    uid:state.user.uid,

                    productId:item.id,

                    name:item.name,

                    brand:item.brand,

                    image:item.images?.[0]||"",

                    price:item.discountPrice||item.price,

                    createdAt:serverTimestamp()

                }

            );

            showToast(
                "Added To Wishlist",
                "success"
            );

        }

    }catch(error){

        console.error(error);

        showToast(
            "Wishlist Error",
            "error"
        );

    }

}

/* ==========================================================
   RENDER WISHLIST
   ========================================================== */

function renderWishlist(){

    wishlistList.innerHTML="";

    if(state.wishlist.length===0){

        wishlistList.innerHTML=`

        <div class="empty-state">

            <h3>

            Wishlist Empty

            </h3>

        </div>

        `;

        return;

    }

    state.wishlist.forEach(item=>{

        wishlistList.insertAdjacentHTML(

        "beforeend",

        `

        <div class="wishlist-card">

            <img

            src="${item.image}"

            style="
            width:70px;
            height:70px;
            object-fit:cover;
            border-radius:12px;
            ">

            <div
            style="flex:1;padding-left:15px;">

                <h4>

                ${item.name}

                </h4>

                <p>

                ৳${item.price}

                </p>

            </div>

            <button

            class="move-cart"

            data-movecart="${item.productId}">

            Cart

            </button>

            <button

            class="remove-wishlist"

            data-removewish="${item.id}">

            ✕

            </button>

        </div>

        `);

    });

    bindWishlistEvents();

}

/* ==========================================================
   EVENTS
   ========================================================== */

function bindWishlistEvents(){

    document

    .querySelectorAll("[data-removewish]")

    .forEach(btn=>{

        btn.onclick=async()=>{

            await deleteDoc(

                doc(

                    db,

                    "wishlist",

                    btn.dataset.removewish

                )

            );

        };

    });

    document

    .querySelectorAll("[data-movecart]")

    .forEach(btn=>{

        btn.onclick=()=>{

            addToCart(

                btn.dataset.movecart,

                1

            );

        };

    });

}

/* ==========================================================
   WISHLIST COUNTER
   ========================================================== */

function wishlistCount(){

    return state.wishlist.length;

}


/* ==========================================================
   PART-7
   COMPLETE CART SYSTEM
   ========================================================== */

async function addToCart(productId, qty = 1){

    if(!state.user) return;

    const product = state.products.find(
        p => p.id === productId
    );

    if(!product) return;

    const exist = state.cart.find(
        c => c.productId === productId
    );

    try{

        if(exist){

            await updateDoc(

                doc(db,"cart",exist.id),

                {

                    quantity:
                    increment(qty),

                    updatedAt:
                    serverTimestamp()

                }

            );

        }else{

            await addDoc(

                collection(db,"cart"),

                {

                    uid:state.user.uid,

                    productId:product.id,

                    name:product.name,

                    image:product.images?.[0] || "",

                    brand:product.brand || "",

                    price:Number(
                        product.discountPrice ||
                        product.price
                    ),

                    quantity:qty,

                    stock:product.stock || 0,

                    createdAt:
                    serverTimestamp()

                }

            );

        }

        showToast(
            "Added To Cart",
            "success"
        );

    }catch(error){

        console.error(error);

        showToast(
            "Cart Error",
            "error"
        );

    }

}

/* ==========================================================
   CART UI
   ========================================================== */

function renderCart(){

    cartItems.innerHTML="";

    if(state.cart.length===0){

        cartItems.innerHTML=`

        <div class="empty-state">

            <h3>

            Cart Empty

            </h3>

        </div>

        `;

        calculateCart();

        return;

    }

    state.cart.forEach(item=>{

        cartItems.insertAdjacentHTML(

        "beforeend",

        `

        <div class="cart-item">

            <img
            src="${item.image}">

            <div>

                <h4>

                ${item.name}

                </h4>

                <p>

                ৳${item.price}

                </p>

                <div
                style="
                display:flex;
                gap:8px;
                margin-top:10px;
                ">

                    <button
                    data-minus="${item.id}">

                    -

                    </button>

                    <strong>

                    ${item.quantity}

                    </strong>

                    <button
                    data-plus="${item.id}">

                    +

                    </button>

                    <button
                    data-remove="${item.id}"
                    style="
                    margin-left:auto;
                    color:red;
                    ">

                    Remove

                    </button>

                </div>

            </div>

        </div>

        `);

    });

    bindCartEvents();

    calculateCart();

}

/* ==========================================================
   CART EVENTS
   ========================================================== */

function bindCartEvents(){

    document

    .querySelectorAll("[data-plus]")

    .forEach(btn=>{

        btn.onclick=()=>{

            updateCartQuantity(

                btn.dataset.plus,

                1

            );

        };

    });

    document

    .querySelectorAll("[data-minus]")

    .forEach(btn=>{

        btn.onclick=()=>{

            updateCartQuantity(

                btn.dataset.minus,

                -1

            );

        };

    });

    document

    .querySelectorAll("[data-remove]")

    .forEach(btn=>{

        btn.onclick=()=>{

            removeCartItem(

                btn.dataset.remove

            );

        };

    });

}

/* ==========================================================
   UPDATE QUANTITY
   ========================================================== */

async function updateCartQuantity(

    cartId,

    change

){

    const item = state.cart.find(
        c=>c.id===cartId
    );

    if(!item) return;

    const qty=item.quantity+change;

    if(qty<=0){

        await removeCartItem(cartId);

        return;

    }

    await updateDoc(

        doc(db,"cart",cartId),

        {

            quantity:qty,

            updatedAt:
            serverTimestamp()

        }

    );

}

/* ==========================================================
   REMOVE CART ITEM
   ========================================================== */

async function removeCartItem(cartId){

    try{

        await deleteDoc(

            doc(db,"cart",cartId)

        );

        showToast(

            "Removed",

            "success"

        );

    }catch(error){

        console.error(error);

    }

}

/* ==========================================================
   CALCULATE TOTAL
   ========================================================== */

function calculateCart(){

    let subtotal=0;

    state.cart.forEach(item=>{

        subtotal+=

        Number(item.price) *

        Number(item.quantity);

    });

    state.subtotal=subtotal;

    state.delivery=

    subtotal===0

    ?0

    :

    subtotal>=1000

    ?0

    :80;

    const discount=

    Number(state.discount||0);

    state.total=

    subtotal+

    state.delivery-

    discount;

    subtotalPrice.textContent=

    "৳"+subtotal;

    deliveryCharge.textContent=

    "৳"+state.delivery;

    discountAmount.textContent=

    "-৳"+discount;

    grandTotal.textContent=

    "৳"+state.total;

}

/* ==========================================================
   OPEN / CLOSE CART
   ========================================================== */

document

.querySelector(

'[data-page="cart"]'

)

.onclick=()=>{

cartDrawer.classList.add(

"active"

);

};

closeCart.onclick=()=>{

cartDrawer.classList.remove(

"active"

);

};


/* ==========================================================
   PART-8
   COUPON SYSTEM + CHECKOUT + ORDER SAVE
   ========================================================== */

/* ==========================
   APPLY COUPON
========================== */

applyCoupon.onclick = async () => {

    const code = couponCode.value.trim().toUpperCase();

    if (!code) {
        showToast("Enter Coupon Code", "alert");
        return;
    }

    try {

        const q = query(
            collection(db, "coupons"),
            where("code", "==", code),
            limit(1)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
            showToast("Invalid Coupon", "error");
            return;
        }

        const coupon = snap.docs[0].data();

        if (!coupon.active) {
            showToast("Coupon Disabled", "error");
            return;
        }

        if (coupon.type === "percent") {

            state.discount = Math.round(
                state.subtotal * coupon.value / 100
            );

        } else {

            state.discount = Number(coupon.value);

        }

        calculateCart();

        showToast(
            "Coupon Applied",
            "success"
        );

    } catch (e) {

        console.error(e);

        showToast(
            "Coupon Error",
            "error"
        );

    }

};


/* ==========================
   OPEN CHECKOUT
========================== */

checkoutButton.onclick = () => {

    if (state.cart.length === 0) {

        showToast(
            "Cart Empty",
            "alert"
        );

        return;

    }

    checkoutModal.classList.add(
        "active"
    );

};


/* ==========================
   CLOSE CHECKOUT
========================== */

closeCheckout.onclick = () => {

    checkoutModal.classList.remove(
        "active"
    );

};


/* ==========================
   PLACE ORDER
========================== */

checkoutForm.onsubmit = async (e) => {

    e.preventDefault();

    if (!state.user) return;

    try {

        placeOrderButton.disabled = true;

        const payment =

        document.querySelector(
            'input[name="payment"]:checked'
        ).value;

        const orderNumber =

        "SP-" +

        Date.now();

        await addDoc(

            collection(
                db,
                "orders"
            ),

            {

                orderNumber,

                uid: state.user.uid,

                customerName:
                customerName.value,

                customerPhone:
                customerPhone.value,

                division:
                division.value,

                district:
                district.value,

                upazila:
                upazila.value,

                area:
                area.value,

                address:
                address.value,

                note:
                deliveryNote.value,

                payment,

                items:
                state.cart,

                subtotal:
                state.subtotal,

                delivery:
                state.delivery,

                discount:
                state.discount,

                total:
                state.total,

                status:
                "Pending",

                createdAt:
                serverTimestamp()

            }

        );

        /* ===================
           CLEAR CART
        =================== */

        for (const item of state.cart) {

            await deleteDoc(

                doc(
                    db,
                    "cart",
                    item.id
                )

            );

        }

        generatedOrderNumber.textContent =
            orderNumber;

        checkoutModal.classList.remove(
            "active"
        );

        orderSuccessModal.classList.add(
            "active"
        );

        checkoutForm.reset();

        state.discount = 0;

        calculateCart();

        showToast(
            "Order Successful",
            "success"
        );

    }

    catch (err) {

        console.error(err);

        showToast(
            "Order Failed",
            "error"
        );

    }

    finally {

        placeOrderButton.disabled = false;

    }

};


/* ==========================
   CONTINUE SHOPPING
========================== */

continueShopping.onclick = () => {

    orderSuccessModal.classList.remove(
        "active"
    );

    cartDrawer.classList.remove(
        "active"
    );

};


/* ==========================
   ESC KEY CLOSE
========================== */

window.addEventListener(

    "keydown",

    e => {

        if (e.key !== "Escape") return;

        checkoutModal.classList.remove(
            "active"
        );

        orderSuccessModal.classList.remove(
            "active"
        );

        cartDrawer.classList.remove(
            "active"
        );

    }

);


/* ==========================================================
   PART-9
   REALTIME CHAT SYSTEM (USER ↔ ADMIN)
   ========================================================== */

/* ==========================
   OPEN CHAT
========================== */

document
.querySelector('[data-page="chat"]')
.onclick = () => {

    if (!state.user) return;

    chatPanel.classList.add("active");

    loadChat();

};

/* Drawer Menu */

menuChat.onclick = () => {

    if (!state.user) return;

    chatPanel.classList.add("active");

    loadChat();

};

closeChatPanel.onclick = () => {

    chatPanel.classList.remove("active");

};


/* ==========================
   LOAD CHAT
========================== */

let unsubscribeChat = null;

async function loadChat() {

    if (unsubscribeChat)
        unsubscribeChat();

    const q = query(

        collection(db, "messages"),

        where(
            "uid",
            "==",
            state.user.uid
        ),

        orderBy(
            "createdAt",
            "asc"
        )

    );

    unsubscribeChat = onSnapshot(

        q,

        snap => {

            state.messages = [];

            snap.forEach(docItem => {

                state.messages.push({

                    id: docItem.id,

                    ...docItem.data()

                });

            });

            renderMessages();

        }

    );

}


/* ==========================
   RENDER CHAT
========================== */

function renderMessages() {

    chatMessages.innerHTML = "";

    state.messages.forEach(msg => {

        const div = document.createElement("div");

        div.className =
            "message " +
            (msg.sender === "admin"
                ? "admin"
                : "user");

        let image = "";

        if (msg.image) {

            image = `

            <img
            src="${msg.image}"
            style="
            width:180px;
            border-radius:12px;
            margin-bottom:10px;
            ">

            `;

        }

        div.innerHTML = `

            ${image}

            <div>

                ${msg.text || ""}

            </div>

            <span class="message-time">

                ${formatTime(msg.createdAt)}

            </span>

        `;

        chatMessages.appendChild(div);

    });

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/* ==========================
   SEND TEXT MESSAGE
========================== */

sendMessageButton.onclick =
async () => {

    const text =
        chatInput.value.trim();

    if (!text) return;

    await sendChatMessage(
        text,
        ""
    );

};


/* ==========================
   ENTER SEND
========================== */

chatInput.onkeydown = e => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessageButton.click();

    }

};


/* ==========================
   SAVE MESSAGE
========================== */

async function sendChatMessage(

    text,

    image = ""

) {

    chatInput.value = "";

    try {

        await addDoc(

            collection(
                db,
                "messages"
            ),

            {

                uid:
                state.user.uid,

                sender:
                "user",

                text,

                image,

                read:false,

                createdAt:
                serverTimestamp()

            }

        );

    }

    catch (err) {

        console.error(err);

        showToast(
            "Message Failed",
            "error"
        );

    }

}


/* ==========================
   IMAGE MESSAGE
========================== */

chatImage.onchange =
async e => {

    const file =
        e.target.files[0];

    if (!file) return;

    showToast(
        "Uploading...",
        "alert"
    );

    try {

        const urls =
        await uploadProductImages(

            [file],

            "chat"

        );

        await sendChatMessage(
            "",
            urls[0]
        );

        showToast(
            "Image Sent",
            "success"
        );

    }

    catch (err) {

        console.error(err);

        showToast(
            "Upload Failed",
            "error"
        );

    }

};


/* ==========================
   TYPING INDICATOR
========================== */

let typingTimer;

chatInput.oninput = () => {

    clearTimeout(
        typingTimer
    );

    typingIndicator.classList.remove(
        "hidden"
    );

    typingTimer = setTimeout(() => {

        typingIndicator.classList.add(
            "hidden"
        );

    },1000);

};


/* ==========================
   FORMAT TIME
========================== */

function formatTime(time){

    if(!time) return "";

    const date =

    time.toDate
    ? time.toDate()
    : new Date();

    return date.toLocaleTimeString(

        [],

        {

            hour:"2-digit",

            minute:"2-digit"

        }

    );

}


/* ==========================================================
   PART-10
   PROFILE SYSTEM
   (LOAD PROFILE + UPDATE + PHOTO + ORDER HISTORY + WISHLIST)
   ========================================================== */

/* ==========================
   OPEN PROFILE
========================== */

document
.querySelector('[data-page="profile"]')
.onclick = () => {

    profilePage.classList.remove("hidden");

    loadProfile();

};

menuProfile.onclick = () => {

    profilePage.classList.remove("hidden");

    loadProfile();

};


/* ==========================
   LOAD PROFILE
========================== */

async function loadProfile(){

    if(!state.user) return;

    try{

        const snap = await getDoc(

            doc(
                db,
                "users",
                state.user.uid
            )

        );

        if(!snap.exists()) return;

        const data = snap.data();

        state.profile = data;

        profileName.textContent =
        data.name || "";

        profilePhone.textContent =
        data.phone || "";

        drawerUserName.textContent =
        data.name || "";

        drawerUserPhone.textContent =
        data.phone || "";

        profileImage.src =
        data.photo ||
        "https://ui-avatars.com/api/?name=User";

        drawerProfileImage.src =
        profileImage.src;

        editName.value =
        data.name || "";

        editPhone.value =
        data.phone || "";

        editAddress.value =
        data.address || "";

    }

    catch(err){

        console.error(err);

    }

}


/* ==========================
   SAVE PROFILE
========================== */

saveProfileButton.onclick =
async ()=>{

    try{

        await updateDoc(

            doc(
                db,
                "users",
                state.user.uid
            ),

            {

                name:
                editName.value,

                phone:
                editPhone.value,

                address:
                editAddress.value,

                updatedAt:
                serverTimestamp()

            }

        );

        showToast(

            "Profile Updated",

            "success"

        );

        loadProfile();

    }

    catch(err){

        console.error(err);

        showToast(

            "Update Failed",

            "error"

        );

    }

};


/* ==========================
   PROFILE PHOTO
========================== */

profileUpload.onchange =
async e=>{

    const file =
    e.target.files[0];

    if(!file) return;

    try{

        showToast(

            "Uploading...",

            "alert"

        );

        const urls =

        await uploadProductImages(

            [file],

            "profiles"

        );

        await updateDoc(

            doc(
                db,
                "users",
                state.user.uid
            ),

            {

                photo:
                urls[0]

            }

        );

        showToast(

            "Photo Updated",

            "success"

        );

        loadProfile();

    }

    catch(err){

        console.error(err);

    }

};


/* ==========================
   ORDER HISTORY
========================== */

function listenOrderHistory(){

    if(!state.user) return;

    const q=query(

        collection(db,"orders"),

        where(

            "uid",

            "==",

            state.user.uid

        ),

        orderBy(

            "createdAt",

            "desc"

        )

    );

    onSnapshot(

        q,

        snap=>{

            orderHistoryList.innerHTML="";

            snap.forEach(d=>{

                const order=d.data();

                orderHistoryList.insertAdjacentHTML(

                    "beforeend",

                    `

<div class="history-card">

<div>

<h4>

${order.orderNumber}

</h4>

<p>

${order.status}

</p>

</div>

<strong>

৳${order.total}

</strong>

</div>

`

                );

            });

        }

    );

}


/* ==========================
   WISHLIST
========================== */

function listenWishlist(){

    if(!state.user) return;

    const q=query(

        collection(db,"wishlist"),

        where(

            "uid",

            "==",

            state.user.uid

        )

    );

    onSnapshot(

        q,

        async snap=>{

            wishlistList.innerHTML="";

            snap.forEach(docItem=>{

                const item=docItem.data();

                wishlistList.insertAdjacentHTML(

                    "beforeend",

`

<div class="wishlist-card">

<div>

${item.name}

</div>

<button

onclick="removeWishlist('${docItem.id}')">

Remove

</button>

</div>

`

                );

            });

        }

    );

}


/* ==========================
   REMOVE WISHLIST
========================== */

window.removeWishlist =
async(id)=>{

    await deleteDoc(

        doc(

            db,

            "wishlist",

            id

        )

    );

};


/* ==========================
   LOAD AFTER LOGIN
========================== */

loadProfile();

listenOrderHistory();

listenWishlist();


/* ==========================================================
   PART-11
   NOTIFICATION + THEME + SETTINGS + LOGOUT + APP INIT
   ========================================================== */

/* ==========================
   REALTIME NOTIFICATIONS
========================== */

function listenNotifications(){

    if(!state.user) return;

    const q = query(

        collection(db,"notifications"),

        where("uid","==",state.user.uid),

        orderBy("createdAt","desc")

    );

    onSnapshot(q,(snap)=>{

        state.notifications=[];

        let unread=0;

        snap.forEach(docItem=>{

            const data={
                id:docItem.id,
                ...docItem.data()
            };

            state.notifications.push(data);

            if(!data.read) unread++;

        });

        notificationCount.textContent=unread;

    });

}

notificationBtn.onclick=()=>{

    if(state.notifications.length===0){

        showToast(
            "No Notification",
            "alert"
        );

        return;

    }

    let text="";

    state.notifications.forEach(item=>{

        text+=`${item.title}\n${item.message}\n\n`;

    });

    alert(text);

};


/* ==========================
   DARK MODE
========================== */

themeToggle.onchange=()=>{

    if(themeToggle.checked){

        document.documentElement
        .classList.add("dark");

        localStorage.setItem(
            "theme",
            "dark"
        );

    }else{

        document.documentElement
        .classList.remove("dark");

        localStorage.setItem(
            "theme",
            "light"
        );

    }

};

if(localStorage.getItem("theme")==="dark"){

    document.documentElement
    .classList.add("dark");

    themeToggle.checked=true;

}


/* ==========================
   NOTIFICATION TOGGLE
========================== */

notificationToggle.onchange=()=>{

    localStorage.setItem(

        "notification",

        notificationToggle.checked

    );

};

notificationToggle.checked=

localStorage.getItem("notification")!=="false";


/* ==========================
   LOGOUT
========================== */

menuLogout.onclick=async()=>{

    try{

        await signOut(auth);

        location.reload();

    }

    catch(error){

        console.error(error);

    }

};


/* ==========================
   PRODUCT SEARCH
========================== */

searchInput.oninput=()=>{

    renderProducts();

};

categoryFilter.onchange=renderProducts;
brandFilter.onchange=renderProducts;
priceFilter.onchange=renderProducts;
ratingFilter.onchange=renderProducts;
stockFilter.onchange=renderProducts;
sortFilter.onchange=renderProducts;


/* ==========================
   MOBILE DRAWER
========================== */

mobileMenuBtn.onclick=()=>{

    drawer.classList.add("active");

    drawerOverlay.classList.add("active");

};

drawerClose.onclick=closeDrawer;

drawerOverlay.onclick=closeDrawer;

function closeDrawer(){

    drawer.classList.remove("active");

    drawerOverlay.classList.remove("active");

}


/* ==========================
   MODAL CLOSE
========================== */

window.onclick=(e)=>{

    if(e.target===productModal)

        productModal.classList.remove("active");

    if(e.target===checkoutModal)

        checkoutModal.classList.remove("active");

    if(e.target===orderSuccessModal)

        orderSuccessModal.classList.remove("active");

};


/* ==========================
   AUTH STATE
========================== */

onAuthStateChanged(

    auth,

    async(user)=>{

        if(!user){

            console.log(
                "User Not Login"
            );
            return;
        }

        state.user=user;

        loadProfile();

        listenCart();

        listenWishlist();

        listenOrderHistory();

        listenNotifications();

        loadChat();

    }

);


/* ==========================
   INITIAL DATA LOAD
========================== */

async function initializeApp(){

    try{

        await Promise.all([

            loadProducts(),

            loadCategories(),

            loadBanners()

        ]);

        renderProducts();

        renderCategories();

        renderBanner();

    }

    catch(error){

        console.error(error);

    }

}

initializeApp();


/* ==========================
   GLOBAL
========================== */

window.state=state;

console.log(

"✔ Shop User Panel Loaded Successfully"

);