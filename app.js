document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS DEL DOM
    ===================================================== */
    const body = document.body;
    const btnTheme = document.getElementById("btnTheme");
    const btnHamburger = document.getElementById("btnHamburger");
    const tablaBody = document.querySelector("#tablaAnimes tbody");
    const searchInput = document.getElementById("searchInput");
    const btnAgregar = document.getElementById("btnAgregar");
    const btnCompartir = document.getElementById("btnCompartir");
    
    const btnExportarJSON = document.getElementById("btnExportarJSON");
    const inputJSON = document.getElementById("inputJSON");
    const btnExportarCSV = document.getElementById("btnExportarCSV");
    const inputCSV = document.getElementById("inputCSV");
    
    const btnEliminarDuplicados = document.getElementById("btnEliminarDuplicados");
    const btnReset = document.getElementById("btnReset");
    const modal = document.getElementById("modal");
    const cerrarModalBtn = document.getElementById("cerrarModal");
    const form = document.getElementById("formAnime");
    
    const nombreInput = document.getElementById("nombre");
    const estadoInput = document.getElementById("estado");
    const calificacionInput = document.getElementById("calificacion");
    const notasInput = document.getElementById("notas");
    
    const filtrosEstado = document.querySelectorAll("#filtroEstado button");
    const filtrosCalificacion = document.querySelectorAll("#filtroCalificacion button");
    const toast = document.getElementById("toast");
    const rightPanelWrapper = document.getElementById("rightPanelWrapper");
    const orientationBlock = document.getElementById("orientationBlock");

    /* =====================================================
       VARIABLES DE ESTADO Y PARÁMETROS URL
    ===================================================== */
    let editId = null;
    let filtroEstado = "todos";
    let filtroCalificacion = "todos";
    let textoBusqueda = "";

    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    const modoLectura = urlParams.get('view') === 'readonly';
    let animesCompartidos = [];

    if (dataParam) {
        try {
            const decoded = decodeURIComponent(escape(atob(dataParam)));
            animesCompartidos = JSON.parse(decoded);
            if (modoLectura) {
                body.classList.add("readonly-mode");
                setTimeout(() => mostrarToast("📖 Viendo lista compartida"), 1000);
            }
        } catch (e) {
            mostrarToast("❌ Error al cargar datos compartidos");
        }
    }

    /* =====================================================
       GESTIÓN DE STORAGE
    ===================================================== */
    const obtenerAnimes = () => {
        if (dataParam && animesCompartidos.length > 0) return animesCompartidos;
        return JSON.parse(localStorage.getItem("animes")) || [];
    };

    const guardarAnimes = data => {
        if (modoLectura) return; 
        localStorage.setItem("animes", JSON.stringify(data));
    };

    const generarID = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

    /* =====================================================
       UTILIDADES
    ===================================================== */
    const mostrarToast = mensaje => {
        toast.textContent = mensaje;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    };

    const cerrarModalFn = () => {
        modal.classList.add("hidden");
        form.reset();
        editId = null;
    };

    /* =====================================================
       JSON Y COMPARTIR
    ===================================================== */
    btnExportarJSON.onclick = () => {
        const animes = obtenerAnimes();
        if (!animes.length) return mostrarToast("⚠️ No hay datos");
        const blob = new Blob([JSON.stringify(animes, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `backup_animes.json`;
        link.click();
    };

    inputJSON.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const importados = JSON.parse(evt.target.result);
                if (Array.isArray(importados) && confirm(`¿Importar ${importados.length} registros?`)) {
                    guardarAnimes(importados);
                    renderTabla();
                    mostrarToast("✅ JSON importado");
                }
            } catch (err) { mostrarToast("❌ Error en el archivo JSON"); }
        };
        reader.readAsText(file);
    });

    btnCompartir.onclick = () => {
        const animes = obtenerAnimes();
        if (!animes.length) return mostrarToast("⚠️ Nada que compartir");
        const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(animes))));
        const url = `${window.location.origin}${window.location.pathname}?data=${base64}&view=readonly`;
        navigator.clipboard.writeText(url).then(() => mostrarToast("✅ Enlace de lectura copiado"));
    };

    /* =====================================================
       CSV (COMPATIBILIDAD EXCEL)
    ===================================================== */
    btnExportarCSV.onclick = () => {
        const animes = obtenerAnimes();
        let csv = "ANIME,ESTADO,NOTAS,CALIFICACION\n";
        animes.forEach(a => {
            const cal = a.calificacion === 0 ? "Pendiente" : "⭐".repeat(a.calificacion);
            csv += `"${a.nombre}","${a.estado}","${a.notas || ""}","${cal}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "lista_animes.csv";
        link.click();
    };

    /* =====================================================
       RENDERIZADO DE TABLA (CORREGIDO PARA ESTRELLAS)
    ===================================================== */
    const renderTabla = () => {
        tablaBody.innerHTML = "";
        let animes = obtenerAnimes();

        if (textoBusqueda) animes = animes.filter(a => a.nombre.toLowerCase().includes(textoBusqueda));
        if (filtroEstado !== "todos") animes = animes.filter(a => a.estado === filtroEstado);
        if (filtroCalificacion !== "todos") animes = animes.filter(a => Number(a.calificacion) === Number(filtroCalificacion));

        animes.forEach(anime => {
            const tr = document.createElement("tr");
            
            // Lógica corregida para mostrar estrellas
            const numEstrellas = parseInt(anime.calificacion) || 0;
            const estrellasHtml = numEstrellas > 0 ? "⭐".repeat(numEstrellas) : "Pendiente";

            const btnAcciones = modoLectura ? "" : `
                <button class="btn-edit" data-id="${anime.id}">✏️</button>
                <button class="btn-delete" data-id="${anime.id}">❌</button>
            `;

            tr.innerHTML = `
                <td><span class="titulo-anime copiar" data-texto="${anime.nombre}">${anime.nombre}</span></td>
                <td><span class="estado-${anime.estado.toLowerCase()}">${anime.estado}</span></td>
                <td>${estrellasHtml}</td>
                <td>${anime.notas || ""}</td>
                <td>${btnAcciones}</td>
            `;
            tablaBody.appendChild(tr);
        });
    };

    /* =====================================================
       CRUD
    ==================================================== */
    form.onsubmit = e => {
        e.preventDefault();
        let animes = obtenerAnimes();
        const data = {
            id: editId || generarID(),
            nombre: nombreInput.value.trim(),
            estado: estadoInput.value,
            notas: notasInput.value.trim(),
            calificacion: parseInt(calificacionInput.value) || 0 // Asegura que sea número
        };

        if (editId) {
            const idx = animes.findIndex(a => a.id === editId);
            animes[idx] = data;
        } else {
            animes.unshift(data);
        }

        guardarAnimes(animes);
        renderTabla();
        cerrarModalFn();
        mostrarToast("✅ Guardado");
    };

    tablaBody.onclick = e => {
        if (modoLectura) return;
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains("btn-delete")) {
            if (confirm("¿Eliminar?")) {
                guardarAnimes(obtenerAnimes().filter(a => a.id !== id));
                renderTabla();
            }
        }

        if (e.target.classList.contains("btn-edit")) {
            const a = obtenerAnimes().find(x => x.id === id);
            editId = id;
            nombreInput.value = a.nombre;
            estadoInput.value = a.estado;
            calificacionInput.value = a.calificacion;
            notasInput.value = a.notas;
            modal.classList.remove("hidden");
            document.getElementById("modalTitle").textContent = "Editar Anime";
        }
    };

    /* =====================================================
       INTERFAZ Y TEMA
    ===================================================== */
    searchInput.oninput = e => { textoBusqueda = e.target.value.toLowerCase(); renderTabla(); };

    filtrosEstado.forEach(btn => btn.onclick = () => {
        filtrosEstado.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filtroEstado = btn.dataset.estado;
        renderTabla();
    });

    filtrosCalificacion.forEach(btn => btn.onclick = () => {
        filtrosCalificacion.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filtroCalificacion = btn.dataset.calificacion;
        renderTabla();
    });

    btnReset.onclick = () => {
        if (confirm("¿Borrar todo?")) { localStorage.removeItem("animes"); renderTabla(); }
    };

    btnAgregar.onclick = () => { modal.classList.remove("hidden"); };
    cerrarModalBtn.onclick = cerrarModalFn;

    const aplicarTema = theme => {
        body.className = theme;
        if (modoLectura) body.classList.add("readonly-mode");
        btnTheme.textContent = theme === "dark" ? "🌙" : "☀️";
        localStorage.setItem("theme", theme);
    };

    btnTheme.onclick = () => aplicarTema(body.classList.contains("dark") ? "light" : "dark");
    aplicarTema(localStorage.getItem("theme") || "dark");

    btnHamburger.onclick = () => rightPanelWrapper.classList.toggle("show");
    
    renderTabla();
});
