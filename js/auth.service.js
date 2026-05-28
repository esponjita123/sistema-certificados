/* js/auth.service.js */
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/**
 * Función para iniciar sesión como administrador
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
        window.location.href = "login.html"; 
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

/**
 * Guardián de seguridad REAL de Firebase: 
 * Monitorea el estado de la sesión en tiempo real. Si no hay usuario, expulsa al login.html.
 */
export function verificarSesionActiva() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Si Firebase confirma que NO hay usuario activo, ejecutamos la expulsión inmediata
            alert("Acceso denegado. Por favor inicia sesión.");
            window.location.href = "login.html";
        }
    });
}
/* js/auth.service.js */
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/**
 * Función para iniciar sesión como administrador
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
        window.location.href = "login.html"; 
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

/**
 * Guardián de seguridad REAL de Firebase: 
 * Monitorea el estado de la sesión en tiempo real. Si no hay usuario, expulsa al login.html.
 */
export function verificarSesionActiva() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Si Firebase confirma que NO hay usuario activo, ejecutamos la expulsión inmediata
            alert("Acceso denegado. Por favor inicia sesión.");
            window.location.href = "login.html";
        }
    });
}