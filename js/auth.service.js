/* js/auth.service.js */
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/**
 * Función para iniciar sesión como administrador
 * @param {string} email 
 * @param {string} password 
 */
export async function loginAdmin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Error en autenticación:", error.code);
        throw error;
    }
}

/**
 * Función para cerrar sesión
 */
export async function logoutAdmin() {
    try {
        await signOut(auth);
        window.location.href = "login.html"; // Redirigir al buscador público
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

/**
 * Guardián de seguridad: Si no está logueado, lo expulsa al index.
 */
export function verificarSesionActiva() {
    // ... tu lógica que detecta si no hay usuario de Firebase ...
    if (!usuario) {
        alert("Acceso denegado. Por favor inicia sesión.");
        window.location.href = "login.html"; // <-- Asegúrate de que diga login.html
    }

    };
