// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1IcTG7cskVhx_-M5ATY6G2dcaIkpBAtA",
  authDomain: "certusimages.firebaseapp.com",
  projectId: "certusimages",
  storageBucket: "certusimages.appspot.com",
  messagingSenderId: "954928629563",
  appId: "1:954928629563:web:3ac73da09c7f9970f7191e",
  measurementId: "G-SML9W6B8FW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on client side
let analytics: Analytics | undefined;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

const storage = getStorage(app);

export { app, analytics, storage };