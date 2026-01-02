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
    
    // JSON
    const btnExportarJSON = document.getElementById("btnExportarJSON");
    const inputJSON = document.getElementById("inputJSON");
    
    // CSV
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

    // Carga de datos externos si existen en la URL
    if (dataParam) {
        try {
            const decoded = decodeURIComponent(escape(atob(dataParam)));
            animesCompartidos = JSON.parse(decoded);
            if (modoLectura) {
                body.classList.add("readonly-mode");
                setTimeout(() => mostrarToast("📖 Modo Lectura: Datos externos"), 1000);
            }
        } catch (e) {
            console.error("Error en data URL:", e);
            mostrarToast("❌ Error al decodificar datos");
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
       UTILIDADES (TOAST Y MODAL)
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
       SISTEMA DE IMPORTACIÓN / EXPORTACIÓN JSON
    ===================================================== */
    btnExportarJSON.onclick = () => {
        const animes = obtenerAnimes();
        if (!animes.length) return mostrarToast("⚠️ No hay datos");
        
        const dataStr = JSON.stringify(animes, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `backup_animes_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
        mostrarToast("💾 Backup JSON descargado");
    };

    inputJSON.addEventListener("change", e => {
        if (modoLectura) return;
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const importados = JSON.parse(evt.target.result);
                if (Array.isArray(importados) && confirm(`¿Importar ${importados.length} registros?`)) {
                    guardarAnimes(importados);
                    renderTabla();
                    mostrarToast("✅ Datos JSON importados");
                }
            } catch (err) { mostrarToast("❌ JSON no válido"); }
            inputJSON.value = "";
        };
        reader.readAsText(file);
    });

    /* =====================================================
       COMPARTIR (LINK BASE64)
    ===================================================== */
    btnCompartir.onclick = () => {
        const animes = obtenerAnimes();
        if (!animes.length) return mostrarToast("⚠️ Nada que compartir");
        
        const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(animes))));
        const url = `${window.location.origin}${window.location.pathname}?data=${base64}&view=readonly`;
        
        navigator.clipboard.writeText(url).then(() => {
            mostrarToast("✅ Enlace copiado al portapapeles");
        });
    };

    /* =====================================================
       SISTEMA CSV (EXCEL)
    ===================================================== */
    const parseCSVLine = line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());

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

    inputCSV.addEventListener("change", e => {
        if (modoLectura) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = evt => {
            const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
            let animes = obtenerAnimes();
            lines.forEach((line, i) => {
                const cols = parseCSVLine(line);
                if (i === 0 && cols[0].toLowerCase().includes("anime")) return;
                if (cols[0]) {
                    animes.push({
                        id: generarID(),
                        nombre: cols[0],
                        estado: cols[1] || "No",
                        notas: cols[2] || "",
                        calificacion: cols[3]?.includes("⭐") ? cols[3].length : 0
                    });
                }
            });
            guardarAnimes(animes);
            renderTabla();
            mostrarToast("📄 CSV importado");
            inputCSV.value = "";
        };
        reader.readAsText(file);
    });

    /* =====================================================
       RENDERIZADO DE TABLA
    ===================================================== */
    const renderTabla = () => {
        tablaBody.innerHTML = "";
        let animes = obtenerAnimes();

        if (textoBusqueda) animes = animes.filter(a => a.nombre.toLowerCase().includes(textoBusqueda));
        if (filtroEstado !== "todos") animes = animes.filter(a => a.estado === filtroEstado);
        if (filtroCalificacion !== "todos") animes = animes.filter(a => a.calificacion === Number(filtroCalificacion));

        animes.forEach(anime => {
            const tr = document.createElement("tr");
            const btnAcciones = modoLectura ? "" : `
                <button class="btn-edit" data-id="${anime.id}">✏️</button>
                <button class="btn-delete" data-id="${anime.id}">❌</button>
            `;

            tr.innerHTML = `
                <td><span class="titulo-anime copiar" data-texto="${anime.nombre}">${anime.nombre}</span></td>
                <td class="estado-${anime.estado.toLowerCase()}">${anime.estado}</td>
                <td>${anime.calificacion === 0 ? "Pendiente" : "⭐".repeat(anime.calificacion)}</td>
                <td>${anime.notas || ""}</td>
                <td>${btnAcciones}</td>
            `;
            tablaBody.appendChild(tr);
        });
    };

    /* =====================================================
       CRUD Y EVENTOS
    ==================================================== */
    form.onsubmit = e => {
        e.preventDefault();
        let animes = obtenerAnimes();
        const data = {
            id: editId || generarID(),
            nombre: nombreInput.value.trim(),
            estado: estadoInput.value,
            notas: notasInput.value.trim(),
            calificacion: Number(calificacionInput.value)
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
        mostrarToast("✅ Guardado correctamente");
    };

    tablaBody.onclick = e => {
        if (modoLectura) return;
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains("btn-delete")) {
            if (confirm("¿Eliminar este anime?")) {
                guardarAnimes(obtenerAnimes().filter(a => a.id !== id));
                renderTabla();
                mostrarToast("🗑️ Eliminado");
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

    // Copiar al portapapeles (Doble clic o Click largo)
    tablaBody.addEventListener("dblclick", e => {
        if (e.target.classList.contains("copiar")) {
            navigator.clipboard.writeText(e.target.dataset.texto);
            mostrarToast("📋 Nombre copiado");
        }
    });

    /* =====================================================
       FILTROS, TEMA Y UI
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
        if (confirm("¿Borrar TODOS tus datos locales?")) {
            localStorage.removeItem("animes");
            renderTabla();
            mostrarToast("🗑️ Datos reseteados");
        }
    };

    btnEliminarDuplicados.onclick = () => {
        const animes = obtenerAnimes();
        const map = new Map();
        animes.forEach(a => map.set(a.nombre.toLowerCase().trim(), a));
        guardarAnimes([...map.values()]);
        renderTabla();
        mostrarToast("🧹 Duplicados eliminados");
    };

    btnAgregar.onclick = () => { modal.classList.remove("hidden"); document.getElementById("modalTitle").textContent = "Nuevo Anime"; };
    cerrarModalBtn.onclick = cerrarModalFn;

    const aplicarTema = theme => {
        body.className = theme;
        if (modoLectura) body.classList.add("readonly-mode"); // No perder modo lectura
        btnTheme.textContent = theme === "dark" ? "🌙" : "☀️";
        localStorage.setItem("theme", theme);
    };

    btnTheme.onclick = () => aplicarTema(body.classList.contains("dark") ? "light" : "dark");
    aplicarTema(localStorage.getItem("theme") || "dark");

    btnHamburger.onclick = () => rightPanelWrapper.classList.toggle("show");
    
    // Cerrar panel al hacer click fuera
    document.onclick = e => {
        if (!rightPanelWrapper.contains(e.target) && !btnHamburger.contains(e.target)) {
            rightPanelWrapper.classList.remove("show");
        }
    };

    /* =====================================================
       INICIALIZACIÓN
    ===================================================== */
    const checkOrientation = () => {
        orientationBlock.style.display = (window.innerWidth <= 900 && window.innerHeight > window.innerWidth) ? "flex" : "none";
    };
    window.onresize = checkOrientation;
    
    checkOrientation();
    renderTabla();
});
