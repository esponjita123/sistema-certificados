// js/admin.js
import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { verificarSesionActiva } from './auth.service.js';

verificarSesionActiva();

const formCarga = document.getElementById('formCarga');
const statusAdmin = document.getElementById('statusAdmin');
const filePdfInput = document.getElementById('filePdf');

const tablaCuerpo = document.getElementById('tablaCuerpo');
const tablaBuscador = document.getElementById('tablaBuscador');
const editIdInput = document.getElementById('editId');
const formTitulo = document.getElementById('formTitulo');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
const contenedorInputFile = document.getElementById('contenedorInputFile');

let listaCertificadosMemoria = []; 

if (filePdfInput) {
    filePdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const pTexto = filePdfInput.parentElement.querySelector('p.text-sm');
        if (file && pTexto) {
            pTexto.innerText = `📄 Listo: ${file.name}`;
            pTexto.className = "text-sm font-semibold text-emerald-400 mt-2";
        }
    });
}

// FUNCIÓN PARA VOLVER A RENDERIZAR EL PDF NATIVO DESDE LA TABLA
const abrirPdfBase64 = (base64String) => {
    try {
        const partes = base64String.split(',');
        const tipoContenido = partes[0].split(':')[1].split(';')[0];
        const bytesBase64 = atob(partes[1]);
        const longitud = bytesBase64.length;
        const arregloBytes = new Uint8Array(longitud);

        for (let i = 0; i < longitud; i++) {
            arregloBytes[i] = bytesBase64.charCodeAt(i);
        }

        const blob = new Blob([arregloBytes], { type: tipoContenido });
        const urlBlob = URL.createObjectURL(blob);
        window.open(urlBlob, '_blank');
    } catch (error) {
        console.error("Error al abrir PDF:", error);
        alert("No se pudo abrir el archivo PDF. Puede que el registro sea antiguo o esté corrupto.");
    }
};

const convertirPdfABase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

const obtenerFechaHoraExacta = () => {
    const ahora = new Date();
    return ahora.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

// --- ESCUCHAR FIRESTORE EN TIEMPO REAL ---
onSnapshot(collection(db, "certificados"), (snapshot) => {
    listaCertificadosMemoria = [];
    snapshot.forEach((docSnap) => {
        listaCertificadosMemoria.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderizarTabla(listaCertificadosMemoria);
});

function renderizarTabla(lista) {
    tablaCuerpo.innerHTML = "";
    if (lista.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">No hay registros que coincidan.</td></tr>`;
        return;
    }

    lista.forEach((cert) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/30 transition-colors border-b border-slate-800/40 text-slate-300 text-xs md:text-sm";
        tr.innerHTML = `
            <td class="p-4 font-medium text-white">${cert.dni_alumno}</td>
            <td class="p-4">${cert.nombre_alumno}</td>
            <td class="p-4 max-w-xs truncate" title="${cert.nombre_curso}">${cert.nombre_curso}</td>
            <td class="p-4 font-mono text-purple-400">${cert.codigo_unico}</td>
            <td class="p-4 text-slate-400 font-medium">${cert.fecha_subida || 'Sin registro'}</td>
            <td class="p-4 flex justify-center items-center gap-2">
                <button class="btn-ver bg-slate-700/50 border border-slate-600/40 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg font-medium transition" data-id="${cert.id}">👁️ Ver</button>
                <button class="btn-editar bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1.5 rounded-lg font-medium transition" data-id="${cert.id}">✏️ Editar</button>
                <button class="btn-eliminar bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs px-2.5 py-1.5 rounded-lg font-medium transition" data-id="${cert.id}">🗑️ Borrar</button>
            </td>
        `;

        // Asignación de funciones a los tres botones
        tr.querySelector('.btn-ver').addEventListener('click', () => abrirPdfBase64(cert.url_pdf));
        tr.querySelector('.btn-eliminar').addEventListener('click', () => eliminarRegistro(cert.id));
        tr.querySelector('.btn-editar').addEventListener('click', () => cargarFormularioParaEditar(cert));

        tablaCuerpo.appendChild(tr);
    });
}

tablaBuscador.addEventListener('input', (e) => {
    const texto = e.target.value.trim().toLowerCase();
    const filtrados = listaCertificadosMemoria.filter(c => c.dni_alumno.toLowerCase().includes(texto));
    renderizarTabla(filtrados);
});

async function eliminarRegistro(id) {
    if (confirm("🚨 ¿Estás seguro de eliminar este certificado permanentemente?")) {
        try {
            await deleteDoc(doc(db, "certificados", id));
            mostrarMensaje("🗑️ Certificado eliminado con éxito.", "text-emerald-400", "border-emerald-500/20", "bg-emerald-500/10");
        } catch (error) {
            console.error(error);
        }
    }
}

function cargarFormularioParaEditar(cert) {
    editIdInput.value = cert.id;
    document.getElementById('adminDni').value = cert.dni_alumno;
    document.getElementById('adminNombre').value = cert.nombre_alumno;
    
    const select = document.getElementById('selectCurso');
    for (let option of select.options) {
        if (option.getAttribute('data-curso') === cert.nombre_curso) {
            select.value = option.value;
            break;
        }
    }

    formTitulo.innerText = "✏️ Modificar Registro";
    btnGuardar.innerText = "Guardar Cambios Actualizados ✔️";
    btnGuardar.className = "flex-grow bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition";
    btnCancelarEdicion.classList.remove('hidden');
    
    contenedorInputFile.querySelector('p.text-sm').innerText = "Opcional: Selecciona un nuevo PDF solo si deseas reemplazar el actual";
    filePdfInput.required = false;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

btnCancelarEdicion.addEventListener('click', resetearFormularioModoRegistro);

function resetearFormularioModoRegistro() {
    formCarga.reset();
    editIdInput.value = "";
    formTitulo.innerText = "Registrar Nuevo Certificado";
    btnGuardar.innerText = "Subir y Registrar Credencial 🚀";
    btnGuardar.className = "flex-grow bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-xl transition";
    btnCancelarEdicion.classList.add('hidden');
    filePdfInput.required = true;
    contenedorInputFile.querySelector('p.text-sm').innerText = "Haz clic aquí para seleccionar el archivo PDF";
    contenedorInputFile.querySelector('p.text-sm').className = "text-sm font-medium text-slate-300 mt-2";
}

formCarga.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idEdicion = editIdInput.value;
    const select = document.getElementById('selectCurso');
    const optionSelected = select.options[select.selectedIndex];
    
    const dni = document.getElementById('adminDni').value.trim();
    const nombre = document.getElementById('adminNombre').value.trim();
    const pdfFile = filePdfInput.files[0];

    const nombreCurso = optionSelected.getAttribute('data-curso');
    const microCredencial = optionSelected.getAttribute('data-micro');
    const organizacion = optionSelected.getAttribute('data-org');

    mostrarMensaje("🔄 Guardando en la base de datos segura...", "text-blue-400", "border-blue-500/20", "bg-blue-500/10");

    try {
        let datosAEnviar = {
            dni_alumno: dni,
            nombre_alumno: nombre,
            nombre_curso: nombreCurso,
            micro_credencial: microCredencial,
            organizacion: organizacion
        };

        if (pdfFile) {
            const pdfBase64 = await convertirPdfABase64(pdfFile);
            datosAEnviar.url_pdf = pdfBase64;
        }

        if (idEdicion) {
            datosAEnviar.fecha_subida = obtenerFechaHoraExacta();
            await updateDoc(doc(db, "certificados", idEdicion), datosAEnviar);
            mostrarMensaje("✅ Registro modificado y actualizado.", "text-emerald-400", "border-emerald-500/20", "bg-emerald-500/10");
        } else {
            datosAEnviar.codigo_unico = "CERT-" + Math.random().toString(36).substring(2, 7).toUpperCase();
            datosAEnviar.fecha_subida = obtenerFechaHoraExacta();

            await addDoc(collection(db, "certificados"), datosAEnviar);
            mostrarMensaje("✅ Nuevo certificado registrado con éxito.", "text-emerald-400", "border-emerald-500/20", "bg-emerald-500/10");
        }

        resetearFormularioModoRegistro();

    } catch (error) {
        console.error(error);
        mostrarMensaje("❌ Error crítico al guardar los datos.", "text-rose-400", "border-rose-500/20", "bg-rose-500/10");
    }
});

function mostrarMensaje(texto, colorClase, bordeClase, fondoClase) {
    statusAdmin.className = `mt-4 text-sm text-center font-medium p-3 rounded-xl border ${colorClase} ${bordeClase} ${fondoClase} block`;
    statusAdmin.innerText = texto;
}