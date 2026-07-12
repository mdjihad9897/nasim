import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
getAuth,
GoogleAuthProvider,
FacebookAuthProvider,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
sendPasswordResetEmail,
signOut,
updateProfile,
updateEmail,
updatePassword,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
getFirestore,
collection,
doc,
setDoc,
addDoc,
updateDoc,
deleteDoc,
getDoc,
getDocs,
query,
where,
orderBy,
limit,
startAfter,
serverTimestamp,
onSnapshot,
writeBatch,
runTransaction,
increment
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
getStorage,
ref,
uploadBytes,
uploadBytesResumable,
getDownloadURL,
deleteObject
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig={

apiKey:"",
authDomain:"",
projectId:"",
storageBucket:"",
messagingSenderId:"",
appId:""

};

const app=initializeApp(firebaseConfig);

const auth=getAuth(app);

const db=getFirestore(app);

const storage=getStorage(app);

const googleProvider=new GoogleAuthProvider();

const facebookProvider=new FacebookAuthProvider();

googleProvider.setCustomParameters({

prompt:"select_account"

});

facebookProvider.setCustomParameters({

display:"popup"

});

export{

app,
auth,
db,
storage,

googleProvider,
facebookProvider,

createUserWithEmailAndPassword,
signInWithEmailAndPassword,
sendPasswordResetEmail,
signOut,
updateProfile,
updateEmail,
updatePassword,
onAuthStateChanged,

collection,
doc,
setDoc,
addDoc,
updateDoc,
deleteDoc,
getDoc,
getDocs,
query,
where,
orderBy,
limit,
startAfter,
serverTimestamp,
onSnapshot,
writeBatch,
runTransaction,
increment,

ref,
uploadBytes,
uploadBytesResumable,
getDownloadURL,
deleteObject

};

export const collections={

users:"users",

products:"products",

categories:"categories",

orders:"orders",

wishlist:"wishlist",

cart:"cart",

reviews:"reviews",

notifications:"notifications",

coupons:"coupons",

banners:"banners",

settings:"settings",

chats:"chats",

messages:"messages"

};

export async function createUserDocument(user,data={}){

await setDoc(

doc(db,collections.users,user.uid),

{

uid:user.uid,

name:data.name||user.displayName||"",

phone:data.phone||"",

email:user.email||"",

photo:data.photo||user.photoURL||"",

division:data.division||"",

district:data.district||"",

upazila:data.upazila||"",

area:data.area||"",

address:data.address||"",

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

},

{

merge:true

}

);

}

export async function currentUserDocument(uid){

return await getDoc(

doc(db,collections.users,uid)

);

}


export async function updateUserDocument(uid,data){

await updateDoc(

doc(db,collections.users,uid),

{

...data,

updatedAt:serverTimestamp()

}

);

}

export async function uploadProfileImage(uid,file){

const storageReference=ref(

storage,

`users/${uid}/profile/${Date.now()}_${file.name}`

);

await uploadBytes(storageReference,file);

return await getDownloadURL(storageReference);

}

export async function loadBanners(callback){

const q=query(

collection(db,collections.banners),

orderBy("priority","asc")

);

return onSnapshot(q,snapshot=>{

const banners=[];

snapshot.forEach(item=>{

banners.push({

id:item.id,

...item.data()

});

});

callback(banners);

});

}

export async function loadCategories(callback){

const q=query(

collection(db,collections.categories),

orderBy("name")

);

return onSnapshot(q,snapshot=>{

const categories=[];

snapshot.forEach(item=>{

categories.push({

id:item.id,

...item.data()

});

});

callback(categories);

});

}

export async function loadProducts(callback){

const q=query(

collection(db,collections.products),

where("status","==","active"),

orderBy("createdAt","desc")

);

return onSnapshot(q,snapshot=>{

const products=[];

snapshot.forEach(item=>{

products.push({

id:item.id,

...item.data()

});

});

callback(products);

});

}

export async function loadSingleProduct(id){

return await getDoc(

doc(db,collections.products,id)

);

}

export async function saveWishlist(uid,productId){

await setDoc(

doc(db,collections.wishlist,`${uid}_${productId}`),

{

uid,

productId,

createdAt:serverTimestamp()

}

);

}

export async function removeWishlist(uid,productId){

await deleteDoc(

doc(db,collections.wishlist,`${uid}_${productId}`)

);

}

export async function watchWishlist(uid,callback){

const q=query(

collection(db,collections.wishlist),

where("uid","==",uid)

);

return onSnapshot(q,snapshot=>{

const items=[];

snapshot.forEach(docItem=>{

items.push({

id:docItem.id,

...docItem.data()

});

});

callback(items);

});

}

export async function addCartItem(uid,productId,quantity){

const reference=doc(

db,

collections.cart,

`${uid}_${productId}`

);

const snapshot=await getDoc(reference);

if(snapshot.exists()){

await updateDoc(reference,{

quantity:increment(quantity),

updatedAt:serverTimestamp()

});

}else{

await setDoc(reference,{

uid,

productId,

quantity,

createdAt:serverTimestamp(),

updatedAt:serverTimestamp()

});

}

}

export async function updateCartQuantity(uid,productId,quantity){

await updateDoc(

doc(db,collections.cart,`${uid}_${productId}`),

{

quantity,

updatedAt:serverTimestamp()

}

);

}

export async function removeCartItem(uid,productId){

await deleteDoc(

doc(db,collections.cart,`${uid}_${productId}`)

);

}


export async function watchCart(uid,callback){

const q=query(
collection(db,collections.cart),
where("uid","==",uid)
);

return onSnapshot(q,snapshot=>{

const cart=[];

snapshot.forEach(item=>{

cart.push({
id:item.id,
...item.data()
});

});

callback(cart);

});

}

export async function createOrder(order){

const reference=await addDoc(

collection(db,collections.orders),

{

...order,

status:"Pending",

paymentStatus:"Pending",

deliveryStatus:"Pending",

createdAt:serverTimestamp(),
updatedAt:serverTimestamp()

}

);

await updateDoc(reference,{

orderNumber:`ORD-${Date.now()}-${reference.id.substring(0,6).toUpperCase()}`

});

return reference.id;

}

export async function watchOrders(uid,callback){

const q=query(

collection(db,collections.orders),

where("uid","==",uid),

orderBy("createdAt","desc")

);

return onSnapshot(q,snapshot=>{

const orders=[];

snapshot.forEach(item=>{

orders.push({

id:item.id,
...item.data()

});

});

callback(orders);

});

}

export async function submitReview(review){

await addDoc(

collection(db,collections.reviews),

{

...review,

createdAt:serverTimestamp()

}

);

}

export async function watchReviews(productId,callback){

const q=query(

collection(db,collections.reviews),

where("productId","==",productId),

orderBy("createdAt","desc")

);

return onSnapshot(q,snapshot=>{

const reviews=[];

snapshot.forEach(item=>{

reviews.push({

id:item.id,
...item.data()

});

});

callback(reviews);

});

}

export async function applyCoupon(code){

const q=query(

collection(db,collections.coupons),

where("code","==",code),

limit(1)

);

const snapshot=await getDocs(q);

if(snapshot.empty){

return null;

}

return snapshot.docs[0];

}

export async function pushNotification(data){

await addDoc(

collection(db,collections.notifications),

{

...data,

createdAt:serverTimestamp(),
read:false

}

);

}

export async function watchNotifications(uid,callback){

const q=query(

collection(db,collections.notifications),

where("uid","==",uid),

orderBy("createdAt","desc")

);

return onSnapshot(q,snapshot=>{

const notifications=[];

snapshot.forEach(item=>{

notifications.push({

id:item.id,
...item.data()

});

});

callback(notifications);

});

}

export async function createChat(uid){

const reference=doc(db,collections.chats,uid);

await setDoc(reference,{

uid,

online:true,
typing:false,
lastMessage:"",
lastMessageTime:serverTimestamp(),
updatedAt:serverTimestamp()

},{

merge:true

});

return reference;

}


export async function sendChatMessage(chatId,message){

await addDoc(

collection(
db,
collections.chats,
chatId,
collections.messages
),

{

...message,

read:false,

createdAt:serverTimestamp()

}

);

await updateDoc(

doc(db,collections.chats,chatId),

{

lastMessage:message.text||"Image",

lastMessageTime:serverTimestamp(),

updatedAt:serverTimestamp()

}

);

}

export async function watchMessages(chatId,callback){

const q=query(

collection(
db,
collections.chats,
chatId,
collections.messages
),

orderBy("createdAt","asc")

);

return onSnapshot(q,snapshot=>{

const messages=[];

snapshot.forEach(item=>{

messages.push({

id:item.id,

...item.data()

});

});

callback(messages);

});

}

export async function updateTyping(chatId,status){

await updateDoc(

doc(db,collections.chats,chatId),

{

typing:status,

updatedAt:serverTimestamp()

}

);

}

export async function updateOnline(chatId,status){

await updateDoc(

doc(db,collections.chats,chatId),

{

online:status,

updatedAt:serverTimestamp()

}

);

}

export async function markMessagesRead(chatId){

const snapshot=await getDocs(

collection(
db,
collections.chats,
chatId,
collections.messages
)

);

const batch=writeBatch(db);

snapshot.forEach(message=>{

if(!message.data().read){

batch.update(message.ref,{

read:true

});

}

});

await batch.commit();

}

export async function uploadChatImage(chatId,file){

const imageReference=ref(

storage,

`chats/${chatId}/${Date.now()}_${file.name}`

);

await uploadBytes(imageReference,file);

return await getDownloadURL(imageReference);

}

export async function uploadProductImages(files=[]){

const urls=[];

for(const file of files){

const imageReference=ref(

storage,

`products/${Date.now()}_${file.name}`

);

await uploadBytes(imageReference,file);

urls.push(

await getDownloadURL(imageReference)

);

}

return urls;

}

export async function uploadCategoryImage(file){

const imageReference=ref(

storage,

`categories/${Date.now()}_${file.name}`

);

await uploadBytes(imageReference,file);

return await getDownloadURL(imageReference);

}

export async function uploadBannerImage(file){

const imageReference=ref(

storage,

`banners/${Date.now()}_${file.name}`

);

await uploadBytes(imageReference,file);

return await getDownloadURL(imageReference);

}

export async function deleteStorageFile(path){

await deleteObject(

ref(storage,path)

);

}

