// js/login.js
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const formLogin = document.getElementById('formLogin');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const mensajeLogin = document.getElementById('mensajeLogin');

// --- LÓGICA INTERACTIVA DEL OJITO ---
const btnTogglePassword = document.getElementById('btnTogglePassword');
const iconoOjo = document.getElementById('iconoOjo');

if (btnTogglePassword && loginPassword && iconoOjo) {
    btnTogglePassword.addEventListener('click', () => {
        if (loginPassword.type === 'password') {
            loginPassword.type = 'text';
            iconoOjo.className = 'fa-solid fa-eye-slash'; // Cambia el icono a ojo tachado
        } else {
            loginPassword.type = 'password';
            iconoOjo.className = 'fa-solid fa-eye'; // Regresa al icono de ojo normal
        }
    });
}

// --- PROCESO DE LOGUEO OFICIAL ---
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        // Inicializar mensaje de carga
        mensajeLogin.className = "text-xs font-bold p-3 rounded-xl border text-center bg-blue-50 text-blue-600 border-blue-100 block";
        mensajeLogin.innerText = "⏳ Verificando credenciales en el servidor...";

        try {
            // Intentar inicio de sesión con Firebase Auth
            await signInWithEmailAndPassword(auth, email, password);
            
            mensajeLogin.className = "text-xs font-bold p-3 rounded-xl border text-center bg-emerald-50 text-emerald-600 border-emerald-100 block";
            mensajeLogin.innerText = "✅ Autenticación exitosa. Redirigiendo...";
            
            // Redirección inmediata al Panel de Administración
            window.location.href = "admin.html";

        } catch (error) {
            console.error("Error en login:", error);
            // Mostrar error amigable en diseño Continental
            mensajeLogin.className = "text-xs font-bold p-3 rounded-xl border text-center bg-red-50 text-red-600 border-red-100 block";
            mensajeLogin.innerText = "❌ Credenciales incorrectas o usuario no autorizado.";
        }
    });
}