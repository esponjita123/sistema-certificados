// js/buscador.js
import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const btnBuscar = document.getElementById('btnBuscar');
const inputDni = document.getElementById('inputDni');
const resultadosContenedor = document.getElementById('resultadosContenedor');
const listaCertificados = document.getElementById('listaCertificados');
const errorMsg = document.getElementById('errorMsg');

// 1. FUNCIÓN ORIGINAL: ABRE EL FORMATO PDF NATIVO DEL NAVEGADOR
window.abrirPdfBase64 = (base64String) => {
    try {
        // Separar el encabezado de datos e identificar el tipo de archivo (PDF)
        const partes = base64String.split(',');
        const tipoContenido = partes[0].split(':')[1].split(';')[0];
        const bytesBase64 = atob(partes[1]);
        const longitud = bytesBase64.length;
        const arregloBytes = new Uint8Array(longitud);

        for (let i = 0; i < longitud; i++) {
            arregloBytes[i] = bytesBase64.charCodeAt(i);
        }

        // Crear el archivo virtual (Blob) de tipo PDF
        const blob = new Blob([arregloBytes], { type: tipoContenido });
        const urlBlob = URL.createObjectURL(blob);

        // Abrir directamente en una nueva pestaña (Activará el lector nativo de PDF)
        window.open(urlBlob, '_blank');
    } catch (error) {
        console.error("Error al renderizar el PDF nativo:", error);
        alert("No se pudo abrir el archivo PDF nativo. Asegúrate de que el documento no esté corrupto.");
    }
};

// 2. LÓGICA DE BÚSQUEDA POR DNI CON DISEÑO PREMIUM EN TARJETAS
btnBuscar.addEventListener('click', async () => {
    const dni = inputDni.value.trim();
    
    if (!dni) {
        errorMsg.classList.remove('hidden');
        return;
    }
    errorMsg.classList.add('hidden');
    listaCertificados.innerHTML = '<p class="text-purple-400 font-medium">Buscando en la base de datos oficial...</p>';
    resultadosContenedor.classList.remove('hidden');

    try {
        const q = query(collection(db, "certificados"), where("dni_alumno", "==", dni));
        const querySnapshot = await getDocs(q);

        listaCertificados.innerHTML = '';

        if (querySnapshot.empty) {
            listaCertificados.innerHTML = '<p class="text-amber-400 col-span-2 text-center bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl font-medium">No se encontraron certificados registrados para el documento ingresado.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const cert = doc.data();
            
            const card = document.createElement('div');
            card.className = "bg-slate-800/40 border border-slate-700/60 rounded-2xl shadow-xl p-6 flex flex-col justify-between hover:border-purple-500/40 transition-all duration-300 group backdrop-blur-sm";
            
            // Guardamos el texto plano del PDF en la tarjeta
            card.dataset.pdf = cert.url_pdf;

            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">${cert.organizacion || 'Academia'}</span>
                        <span class="text-xs text-slate-500 font-medium">🗓️ ${cert.fecha_subida || '2026'}</span>
                    </div>
                    <h4 class="font-bold text-lg text-white mt-3 group-hover:text-purple-300 transition-colors">${cert.nombre_curso}</h4>
                    <div class="mt-2 space-y-1 text-sm">
                        <p class="text-slate-400"><b class="text-slate-300 font-medium">Credencial:</b> ${cert.micro_credencial}</p>
                        <p class="text-slate-400"><b class="text-slate-300 font-medium">Estudiante:</b> ${cert.nombre_alumno}</p>
                    </div>
                </div>
                <div class="mt-5 pt-4 border-t border-slate-800/80 flex justify-between items-center gap-4">
                    <span class="text-xs font-mono text-slate-500 tracking-wider">ID: ${cert.codigo_unico}</span>
                    <button class="btn-ver-pdf text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 focus:outline-none">
                        Ver Certificado 👁️
                    </button>
                </div>
            `;

            // Ejecutar la función original que abre el visor nativo de PDF
            card.querySelector('.btn-ver-pdf').addEventListener('click', () => {
                window.abrirPdfBase64(card.dataset.pdf);
            });

            listaCertificados.appendChild(card);
        });

    } catch (error) {
        console.error("Error al buscar certificados:", error);
        listaCertificados.innerHTML = '<p class="text-rose-400 col-span-2 text-center bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">Ocurrió un error al procesar la consulta en la red.</p>';
    }
});