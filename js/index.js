// js/index.js
import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const formBusqueda = document.getElementById('formBusqueda');
const inputDni = document.getElementById('inputDni');
const mensajeEstado = document.getElementById('mensajeEstado');
const resultadoBusqueda = document.getElementById('resultadoBusqueda');

// Mostrar alertas integradas dentro de la interfaz sin usar alerts nativos
const mostrarAlerta = (msg, tipo) => {
    mensajeEstado.innerText = msg;
    mensajeEstado.className = `text-sm font-bold p-3 rounded-xl border text-center block ${
        tipo === 'red' 
        ? 'bg-red-50 text-red-600 border-red-100' 
        : 'bg-amber-50 text-amber-600 border-amber-100'
    }`;
    mensajeEstado.classList.remove('hidden');
};

formBusqueda.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dni = inputDni.value.trim();
    
    // Limpieza de estados previos
    mensajeEstado.classList.add('hidden');
    resultadoBusqueda.innerHTML = "";
    resultadoBusqueda.classList.add('hidden');

    if (!dni) {
        mostrarAlerta("⚠️ Por favor, ingresa un número de DNI válido.", "amber");
        return;
    }

    try {
        mostrarAlerta("⏳ Buscando en los servidores de la universidad...", "amber");

        // Consulta exacta a Firestore filtrando por la clave 'dni_alumno'
        const certificadosRef = collection(db, "certificados");
        const q = query(certificadosRef, where("dni_alumno", "==", dni));
        const snapshot = await getDocs(q);

        // Ocultar el mensaje de carga preliminar
        mensajeEstado.classList.add('hidden');

        if (snapshot.empty) {
            mostrarAlerta("❌ No se encontraron certificados registrados para el DNI: " + dni, "red");
            return;
        }

        // Activamos el contenedor de resultados con una cuadrícula limpia
        resultadoBusqueda.classList.remove('hidden');
        resultadoBusqueda.className = "grid gap-4 pt-2 w-full text-left";
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = "bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between gap-4 transition hover:shadow-md";
            
            // Renderizado seguro de la tarjeta del alumno
            card.innerHTML = `
                <div class="absolute top-0 left-0 w-1.5 h-full bg-ucMorado"></div>
                <div class="flex justify-between items-start gap-4">
                    <div class="space-y-1">
                        <h4 class="text-sm font-black text-slate-900 leading-tight">${data.nombre_curso || 'Curso Universitario'}</h4>
                        <p class="text-[10px] text-ucMorado font-bold uppercase tracking-tight">${data.carrera_alumno || 'Ingeniería de Sistemas e Informática'}</p>
                    </div>
                    <span class="bg-purple-50 text-ucMorado text-[10px] font-mono font-bold px-2 py-1 rounded border border-purple-100 whitespace-nowrap shrink-0">${data.codigo_unico || 'UC-000000'}</span>
                </div>
                <div class="border-t border-slate-200/60 pt-3 flex justify-between items-center text-xs gap-2">
                    <div class="truncate">
                        <span class="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Estudiante</span>
                        <span class="font-bold text-slate-700 truncate block max-w-[220px]">${data.nombre_alumno || 'Alumno Regular'}</span>
                    </div>
                    <button class="btn-visualizar-pdf bg-ucMorado hover:bg-purple-900 text-white font-bold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1 shadow-sm shrink-0 active:scale-95">
                        <i class="fa-solid fa-file-pdf"></i> Ver PDF
                    </button>
                </div>
            `;

            // Lógica de desencriptación y apertura segura del PDF en Base64
            const btnPdf = card.querySelector('.btn-visualizar-pdf');
            if (data.url_pdf) {
                btnPdf.addEventListener('click', () => {
                    try {
                        const partes = data.url_pdf.split(',');
                        if (partes.length < 2) throw new Error("Formato Base64 inválido");
                        
                        const tipoMime = partes[0].split(':')[1].split(';')[0];
                        const binario = atob(partes[1]);
                        const matriz = new Uint8Array(binario.length);
                        
                        for (let i = 0; i < binario.length; i++) {
                            matriz[i] = binario.charCodeAt(i);
                        }
                        
                        const blob = new Blob([matriz], { type: tipoMime });
                        const urlBlob = URL.createObjectURL(blob);
                        window.open(urlBlob, '_blank');
                    } catch (pdfError) {
                        console.error("Error al procesar el PDF:", pdfError);
                        alert("No se pudo abrir el archivo PDF debido a un fallo en el origen de los datos.");
                    }
                });
            } else {
                // Si por alguna razón el registro no cuenta con PDF adjunto
                btnPdf.classList.replace('bg-ucMorado', 'bg-slate-300');
                btnPdf.disabled = true;
                btnPdf.innerHTML = `<i class="fa-solid fa-ban"></i> Sin PDF`;
            }

            resultadoBusqueda.appendChild(card);
        });

    } catch (err) {
        console.error("Error crítico en la consulta general:", err);
        mostrarAlerta("🚨 Ocurrió un error al conectar con el servidor de la universidad. Revisa tu consola.", "red");
    }
});