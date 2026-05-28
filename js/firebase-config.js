// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// REMPLAZA ESTO con los datos de la consola de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCaPXZQVvB69E1YlqP6P1PgjJ-1ZpeHrDg",
  authDomain: "sistema-certificados-academia.firebaseapp.com",
  projectId: "sistema-certificados-academia",
  storageBucket: "sistema-certificados-academia.firebasestorage.app",
  messagingSenderId: "66642064317",
  appId: "1:66642064317:web:0fb7de229fafbf1e1418d4"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); // Listo, sin Storage.  