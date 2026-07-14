import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
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
  limit,
  onSnapshot, 
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase Configuration
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

// Initialize Firebase Core Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Database Collection Identifiers
const collections = {
  products: "products",
  categories: "categories",
  subcategories: "subcategories",
  brands: "brands",
  orders: "orders",
  users: "users",
  banners: "banners",
  coupons: "coupons",
  notifications: "notifications",
  chats: "chats",
  messages: "messages",
  reviews: "reviews",
  settings: "settings"
};

// ==========================================
// 1. IMAGE UPLOAD & STORAGE MANAGEMENT
// ==========================================

/**
 * Multiple or Single Image Upload Handler to Firebase Storage
 * @param {FileList|Array} files - File objects from input element
 * @param {string} path - Storage folder destination (e.g. 'products', 'categories')
 * @returns {Promise<Array<string>>} List of uploaded Image Download URLs
 */
export async function uploadProductImages(files, path = "products") {
  if (!files || files.length === 0) return [];
  const fileArray = Array.from(files);
  const uploadPromises = fileArray.map(file => {
    return new Promise((resolve, reject) => {
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name}`;
      const storageRef = ref(storage, `${path}/${uniqueFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress.toFixed(1)}% done for ${file.name}`);
        },
        error => {
          console.error("Image upload failed:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  });

  return await Promise.all(uploadPromises);
}

/**
 * Delete Image from Firebase Storage via Full URL
 * @param {string} fileUrl - Download URL of the image
 */
export async function deleteStorageFile(fileUrl) {
  if (!fileUrl || !fileUrl.includes("firebasestorage.googleapis.com")) return;
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    console.log("File successfully deleted from storage");
  } catch (error) {
    console.error("Failed to delete file from storage:", error);
  }
}

// Export All Native Firebase SDK Functions & Core App References
export {
  app,
  auth,
  db,
  storage,
  collections,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
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
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
};
