// js/admin.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Referencias del DOM
const formCarga = document.getElementById('formCarga');
const selectCurso = document.getElementById('selectCurso');
const selectCarrera = document.getElementById('selectCarrera');
const adminDni = document.getElementById('adminDni');
const adminNombre = document.getElementById('adminNombre');
const filePdf = document.getElementById('filePdf');
const zonaArrastre = document.getElementById('zonaArrastre');
const contenidoZona = document.getElementById('contenidoZona');
const btnGuardar = document.getElementById('btnGuardar');
const editId = document.getElementById('editId');
const statusAdmin = document.getElementById('statusAdmin');
const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
const tablaCuerpo = document.getElementById('tablaCuerpo');
const tablaBuscador = document.getElementById('tablaBuscador');

let base64PdfGlobal = "";
let todosLosCertificados = [];

// 1. Guardián de Autenticación
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        obtenerCertificados();
    }
});

// Cerrar Sesión
btnCerrarSesion.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "login.html");
});

// Convertir PDF a Base64 y refrescar visualmente el cuadro de subida
filePdf.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        restablecerCuadroPdf();
        return;
    }
    
    if (file.type !== "application/pdf") {
        mostrarStatus("❌ Solo se admiten archivos en formato PDF.", "red");
        restablecerCuadroPdf();
        return;
    }

    const reader = new FileReader();
    reader.onload = () => { 
        base64PdfGlobal = reader.result; 
        
        // Transformar visualmente la caja de carga a estado exitoso
        zonaArrastre.className = "border-2 border-solid border-emerald-400 bg-emerald-50 rounded-xl p-6 transition relative flex flex-col items-center justify-center text-center cursor-pointer";
        contenidoZona.innerHTML = `
            <span class="text-3xl text-emerald-600 animate-bounce">
                <i class="fa-solid fa-file-circle-check"></i>
            </span>
            <p class="text-sm font-bold text-emerald-800 mt-2">¡PDF Cargado Exitosamente!</p>
            <p class="text-xs text-emerald-600 font-mono mt-1 bg-white px-3 py-1 rounded-md border border-emerald-200 max-w-xs truncate">${file.name}</p>
        `;
        statusAdmin.classList.add('hidden'); // Ocultar mensaje repetitivo de abajo
    };
    reader.onerror = () => {
        console.error("Error al leer el archivo");
        mostrarStatus("❌ Error al leer el archivo PDF seleccionado.", "red");
        restablecerCuadroPdf();
    };
    reader.readAsDataURL(file);
});

// Devolver la caja de subida a su diseño original
function restablecerCuadroPdf() {
    base64PdfGlobal = "";
    filePdf.value = "";
    zonaArrastre.className = "border-2 border-dashed border-slate-300 hover:border-ucMorado bg-slate-50 rounded-xl p-6 transition relative flex flex-col items-center justify-center text-center cursor-pointer group";
    contenidoZona.innerHTML = `
        <span class="text-3xl text-slate-400 group-hover:scale-110 group-hover:text-ucMorado transition duration-200">
            <i class="fa-solid fa-cloud-arrow-up"></i>
        </span>
        <p class="text-sm font-bold text-slate-700 mt-2">Haz clic aquí para cargar el documento PDF</p>
        <p class="text-xs text-slate-400 mt-1">El archivo se convertirá localmente de forma segura.</p>
    `;
}

// Mostrar Estado Inferior (Para alertas o errores globales)
const mostrarStatus = (msg, tipo) => {
    statusAdmin.innerText = msg;
    statusAdmin.className = `mt-4 text-sm text-center font-bold p-3 rounded-xl border block bg-${tipo === 'red' ? 'red' : 'emerald'}-50 text-${tipo === 'red' ? 'red' : 'emerald'}-600 border-${tipo === 'red' ? 'red' : 'emerald'}-100`;
    statusAdmin.classList.remove('hidden');
};

// Limpiar Formulario Completo
const limpiarFormulario = () => {
    formCarga.reset();
    editId.value = "";
    restablecerCuadroPdf();
    statusAdmin.classList.add('hidden');
    selectCarrera.value = "Ingeniería de Sistemas e Informática";
    document.getElementById('formTitulo').innerText = "Registrar Nuevo Certificado";
    btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar y Validar Credencial`;
    btnCancelarEdicion.classList.add('hidden');
};
btnCancelarEdicion.addEventListener('click', limpiarFormulario);

// 2. Guardar o Editar en Firestore
formCarga.addEventListener('submit', async (e) => {
    e.preventDefault();

    const option = selectCurso.options[selectCurso.selectedIndex];
    const dni = adminDni.value.trim();
    const nombre = adminNombre.value.trim();
    const carrera = selectCarrera.value;

    const cursoReal = option.getAttribute('data-curso');
    const microCredencial = option.getAttribute('data-micro');
    const organizacion = option.getAttribute('data-org');

    if (!editId.value && !base64PdfGlobal) {
        mostrarStatus("❌ Es obligatorio adjuntar un archivo PDF válido.", "red");
        return;
    }

    try {
        mostrarStatus("⏳ Sincronizando datos con el servidor...", "emerald");

        if (editId.value) {
            // EDITAR REGISTRO
            const docRef = doc(db, "certificados", editId.value);
            const actualizacion = {
                dni_alumno: dni,
                nombre_alumno: nombre,
                carrera_alumno: carrera,
                nombre_curso: cursoReal,
                micro_credencial: microCredencial,
                organizacion: organizacion,
                clave_curso: selectCurso.value
            };
            if (base64PdfGlobal) actualizacion.url_pdf = base64PdfGlobal;

            await updateDoc(docRef, actualizacion);
            mostrarStatus("✅ Credencial modificada exitosamente en Firestore.", "emerald");
        } else {
            // CREAR NUEVO REGISTRO
            const codigoUnico = "UC-" + Math.floor(100000 + Math.random() * 900000);
            await addDoc(collection(db, "certificados"), {
                dni_alumno: dni,
                nombre_alumno: nombre,
                carrera_alumno: carrera,
                nombre_curso: cursoReal,
                micro_credencial: microCredencial,
                organizacion: organizacion,
                clave_curso: selectCurso.value,
                codigo_unico: codigoUnico,
                url_pdf: base64PdfGlobal,
                fecha_creacion: serverTimestamp()
            });
            mostrarStatus("✅ Credencial oficial registrada con éxito.", "emerald");
        }
        limpiarFormulario();
        obtenerCertificados();
    } catch (err) {
        console.error(err);
        mostrarStatus("🚨 Error crítico al guardar los datos.", "red");
    }
});

// 3. Obtener Datos de Firestore
async function obtenerCertificados() {
    try {
        const snapshot = await getDocs(collection(db, "certificados"));
        todosLosCertificados = [];
        snapshot.forEach(doc => {
            todosLosCertificados.push({ id: doc.id, ...doc.data() });
        });
        renderizarTabla(todosLosCertificados);
    } catch (err) {
        console.error(err);
    }
}

// 4. Renderizar Tabla Dinámica
function renderizarTabla(arr) {
    tablaCuerpo.innerHTML = "";
    if (arr.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 font-medium">No hay registros cargados.</td></tr>`;
        return;
    }

    arr.forEach(data => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 border-b border-slate-100 transition text-xs";
        
        let fechaLegible = "Reciente";
        if (data.fecha_creacion?.toDate) {
            fechaLegible = data.fecha_creacion.toDate().toLocaleString();
        }

        tr.innerHTML = `
            <td class="p-4 font-mono font-bold text-slate-900">${data.dni_alumno}</td>
            <td class="p-4 font-bold">${data.nombre_alumno}</td>
            <td class="p-4">
                <div class="font-bold text-slate-800">${data.nombre_curso}</div>
                <div class="text-[10px] text-purple-600 font-semibold uppercase tracking-tight">${data.carrera_alumno || 'Ingeniería de Sistemas e Informática'}</div>
            </td>
            <td class="p-4 font-mono text-purple-800 font-bold bg-purple-50/50 rounded">${data.codigo_unico}</td>
            <td class="p-4 text-slate-400 font-medium">${fechaLegible}</td>
            <td class="p-4 flex justify-center items-center gap-2">
                <button class="btn-ver bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1"><i class="fa-solid fa-eye"></i> Ver</button>
                <button class="btn-editar bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
                <button class="btn-eliminar bg-red-50 text-ucRojo hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1"><i class="fa-solid fa-trash-can"></i> Borrar</button>
            </td>
        `;

        // Acción: Ver PDF
        tr.querySelector('.btn-ver').addEventListener('click', () => {
            const partes = data.url_pdf.split(',');
            const blob = new Blob([Uint8Array.from(atob(partes[1]), c => c.charCodeAt(0))], { type: partes[0].split(':')[1].split(';')[0] });
            window.open(URL.createObjectURL(blob), '_blank');
        });

        // Acción: Editar
        tr.querySelector('.btn-editar').addEventListener('click', () => {
            editId.value = data.id;
            adminDni.value = data.dni_alumno;
            adminNombre.value = data.nombre_alumno;
            selectCurso.value = data.clave_curso || "";
            if(data.carrera_alumno) selectCarrera.value = data.carrera_alumno;
            
            // Cuando editas, le avisamos visualmente que hay un archivo cargado previamente
            zonaArrastre.className = "border-2 border-solid border-purple-400 bg-purple-50 rounded-xl p-6 transition relative flex flex-col items-center justify-center text-center cursor-pointer";
            contenidoZona.innerHTML = `
                <span class="text-3xl text-ucMorado"><i class="fa-solid fa-file-pdf"></i></span>
                <p class="text-sm font-bold text-purple-900 mt-2">PDF Original Conservado</p>
                <p class="text-xs text-purple-600 mt-1">Opcional: Suelta un nuevo archivo si deseas reemplazarlo.</p>
            `;

            document.getElementById('formTitulo').innerText = "Modificar Certificado Existente";
            btnGuardar.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Actualizar Credencial`;
            btnCancelarEdicion.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Acción: Eliminar
        tr.querySelector('.btn-eliminar').addEventListener('click', async () => {
            if (confirm(`¿Estás seguro de eliminar el certificado de ${data.nombre_alumno}?`)) {
                await deleteDoc(doc(db, "certificados", data.id));
                obtenerCertificados();
            }
        });

        tablaCuerpo.appendChild(tr);
    });
}

// Filtrar tabla en tiempo real por DNI
tablaBuscador.addEventListener('input', (e) => {
    const texto = e.target.value.trim();
    const filtrados = todosLosCertificados.filter(c => c.dni_alumno.includes(texto));
    renderizarTabla(filtrados);
});