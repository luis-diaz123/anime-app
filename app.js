document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
const modoLectura = urlParams.get('view') === 'readonly';

// Si es modo lectura, ocultamos los botones de edición mediante CSS
if (modoLectura) {
    body.classList.add("readonly-mode");
    mostrarToast("📖 Modo lectura activado");
}
document.getElementById("btnCompartir").onclick = () => {
    const url = window.location.origin + window.location.pathname + "?view=readonly";
    navigator.clipboard.writeText(url);
    mostrarToast("✅ Enlace de lectura copiado al portapapeles");
};


    /* =====================================================
       ELEMENTOS
    ===================================================== */
    const body = document.body;
    const btnTheme = document.getElementById("btnTheme");
    const btnHamburger = document.getElementById("btnHamburger");
    const tablaBody = document.querySelector("#tablaAnimes tbody");
    const searchInput = document.getElementById("searchInput");
    const btnAgregar = document.getElementById("btnAgregar");
    const btnExportar = document.getElementById("btnExportarCSV");
    const btnEliminarDuplicados = document.getElementById("btnEliminarDuplicados");
    const btnReset = document.getElementById("btnReset");
    const inputCSV = document.getElementById("inputCSV");
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
       VARIABLES
    ===================================================== */
    let editId = null;
    let filtroEstado = "todos";
    let filtroCalificacion = "todos";
    let textoBusqueda = "";

    /* =====================================================
       STORAGE
    ===================================================== */
    const obtenerAnimes = () => JSON.parse(localStorage.getItem("animes")) || [];
    const guardarAnimes = data => localStorage.setItem("animes", JSON.stringify(data));
    const generarID = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

    /* =====================================================
       TOAST
    ===================================================== */
    const mostrarToast = mensaje => {
        toast.textContent = mensaje;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    };

    /* =====================================================
       UTILIDAD PARA ACCIONES SOBRE ANIMES
    ===================================================== */
    const withAnimes = (callback, mensajeVacio) => {
        const animes = obtenerAnimes();
        if (!animes.length) {
            mostrarToast(mensajeVacio || "⚠️ No hay datos");
            return;
        }
        callback(animes);
    };

    /* =====================================================
       CSV PARSER
    ===================================================== */
    const parseCSVLine = line =>
        line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map(v => v.replace(/^"|"$/g, '').trim());

    const normalizarCalificacion = valor => {
        if (!valor) return 0;
        valor = valor.toString().trim();
        if (valor.toLowerCase() === "pendiente") return 0;
        if (valor.includes("⭐")) return valor.length;
        const num = Number(valor);
        return isNaN(num) ? 0 : num;
    };

    inputCSV.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();

        reader.onload = evt => {
            const lines = evt.target.result.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            if (!lines.length) {
                mostrarToast("⚠️ Archivo vacío");
                return;
            }

            withAnimes(animes => {}, ""); // solo para inicializar si es necesario
            let animes = obtenerAnimes();

            lines.forEach((line, index) => {
                const cols = parseCSVLine(line);
                if (index === 0 && cols[0].toLowerCase().includes("anime")) return;
                const nombre = cols[0]?.trim();
                if (!nombre) return;
                animes.push({
                    id: generarID(),
                    nombre,
                    estado: cols[1]?.trim() || "No",
                    notas: cols[2]?.trim() || "",
                    calificacion: normalizarCalificacion(cols[3])
                });
            });

            guardarAnimes(animes);
            renderTabla();
            mostrarToast("📥 CSV importado correctamente");
            inputCSV.value = "";
        };

        reader.readAsText(file, "utf-8");
    });

    /* =====================================================
       MODAL
    ===================================================== */
    const cerrarModalFn = () => {
        modal.classList.add("hidden");
        form.reset();
        editId = null;
    };

    btnAgregar.onclick = () => {
        modal.classList.remove("hidden");
        document.getElementById("modalTitle").textContent = "Nuevo Anime";
        form.reset();
        editId = null;
        cerrarPanel();
    };
    cerrarModalBtn.onclick = cerrarModalFn;

    /* =====================================================
       RENDER TABLA
    ===================================================== */
    const renderTabla = () => {
        tablaBody.innerHTML = "";
        let animes = obtenerAnimes();

        if (textoBusqueda) {
            animes = animes.filter(a => a.nombre.toLowerCase().includes(textoBusqueda));
        }
        if (filtroEstado !== "todos") animes = animes.filter(a => a.estado === filtroEstado);
        if (filtroCalificacion !== "todos") animes = animes.filter(a => a.calificacion === Number(filtroCalificacion));

        animes.forEach(anime => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <span class="titulo-anime copiar" title="${anime.nombre}" data-texto="${anime.nombre}">
                        ${anime.nombre}
                    </span>
                </td>
                <td class="estado-${anime.estado.toLowerCase()}">${anime.estado}</td>
                <td>${anime.calificacion === 0 ? "Pendiente" : "⭐".repeat(anime.calificacion)}</td>
                <td>${anime.notas || ""}</td>
                <td>
                    <button class="btn-edit" data-id="${anime.id}">✏️</button>
                    <button class="btn-delete" data-id="${anime.id}">❌</button>
                </td>
            `;
            tablaBody.appendChild(tr);
            // Dentro del animes.forEach de renderTabla:
const accionesHtml = modoLectura ? "" : `
    <button class="btn-edit" data-id="${anime.id}">✏️</button>
    <button class="btn-delete" data-id="${anime.id}">❌</button>
`;

tr.innerHTML = `
    <td>
        <span class="titulo-anime copiar" title="${anime.nombre}" data-texto="${anime.nombre}">
            ${anime.nombre}
        </span>
    </td>
    <td class="estado-${anime.estado.toLowerCase()}">${anime.estado}</td>
    <td>${anime.calificacion === 0 ? "Pendiente" : "⭐".repeat(anime.calificacion)}</td>
    <td>${anime.notas || ""}</td>
    <td>${accionesHtml}</td>
`;
        });
    };

    /* =====================================================
       COPIAR NOMBRE
    ===================================================== */
    const copiarTexto = texto => {
        navigator.clipboard.writeText(texto);
        mostrarToast("📋 Nombre copiado");
    };

    tablaBody.addEventListener("dblclick", e => {
        if (!e.target.classList.contains("copiar")) return;
        copiarTexto(e.target.dataset.texto);
    });

    let pressTimer;
    tablaBody.addEventListener("touchstart", e => {
        if (!e.target.classList.contains("copiar")) return;
        pressTimer = setTimeout(() => copiarTexto(e.target.dataset.texto), 600);
    });
    tablaBody.addEventListener("touchend", () => clearTimeout(pressTimer));

    /* =====================================================
       BUSCADOR
    ===================================================== */
    searchInput.addEventListener("input", e => {
        textoBusqueda = e.target.value.toLowerCase();
        renderTabla();
    });

    /* =====================================================
       GUARDAR / EDITAR
    ===================================================== */
    form.addEventListener("submit", e => {
        e.preventDefault();
        const animes = obtenerAnimes();
        const data = {
            id: editId || generarID(),
            nombre: nombreInput.value.trim(),
            estado: estadoInput.value,
            notas: notasInput.value.trim(),
            calificacion: Number(calificacionInput.value)
        };

        if (editId) {
            const i = animes.findIndex(a => a.id === editId);
            animes[i] = data;
        } else {
            animes.unshift(data);
        }

        guardarAnimes(animes);
        renderTabla();
        cerrarModalFn();
    });

    /* =====================================================
       EDITAR / ELIMINAR
    ===================================================== */
    tablaBody.onclick = e => {
        const id = e.target.dataset.id;
        if (!id) return;

        const animes = obtenerAnimes();

        if (e.target.classList.contains("btn-delete")) {
            if (!confirm("¿Eliminar este registro?")) return;
            guardarAnimes(animes.filter(a => a.id !== id));
            renderTabla();
            mostrarToast("🗑️ Registro eliminado");
        }

        if (e.target.classList.contains("btn-edit")) {
            const a = animes.find(x => x.id === id);
            nombreInput.value = a.nombre;
            estadoInput.value = a.estado;
            calificacionInput.value = a.calificacion;
            notasInput.value = a.notas;
            editId = id;
            modal.classList.remove("hidden");
            document.getElementById("modalTitle").textContent = "Editar Anime";
            cerrarPanel();
        }
    };

    /* =====================================================
       FILTROS
    ===================================================== */
    filtrosEstado.forEach(btn => btn.addEventListener("click", () => {
        filtrosEstado.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filtroEstado = btn.dataset.estado;
        renderTabla();
    }));

    filtrosCalificacion.forEach(btn => btn.addEventListener("click", () => {
        filtrosCalificacion.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filtroCalificacion = btn.dataset.calificacion;
        renderTabla();
    }));

    /* =====================================================
       EXPORTAR / IMPORTAR / RESET / DUPLICADOS
    ===================================================== */
    btnExportar.onclick = () => withAnimes(animes => {
        let csv = "ANIME,ESTADO,NOTAS,CALIFICACION\n";
        animes.forEach(a => {
            const cal = a.calificacion === 0 ? "Pendiente" : "⭐".repeat(a.calificacion);
            csv += `"${a.nombre}","${a.estado}","${a.notas || ""}","${cal}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "animes.csv";
        link.click();
        mostrarToast("📤 CSV exportado");
    }, "⚠️ No hay datos");

    btnEliminarDuplicados.onclick = () => withAnimes(animes => {
        if (!confirm("¿Eliminar los duplicados?")) return;
        const map = new Map();
        animes.forEach(a => map.set(a.nombre.toLowerCase().trim(), a));
        guardarAnimes([...map.values()]);
        renderTabla();
        mostrarToast("🧹 Duplicados limpiados");
    }, "⚠️ No hay datos para limpiar");

    btnReset.onclick = () => withAnimes(animes => {
        if (!confirm("¿Eliminar todos los registros?")) return;
        localStorage.removeItem("animes");
        renderTabla();
        mostrarToast("🗑️ Datos eliminados");
    }, "⚠️ No hay datos para borrar");

    /* =====================================================
       TEMA DARK / LIGHT
    ===================================================== */
    const aplicarTema = theme => {
        body.classList.remove("dark", "light");
        body.classList.add(theme);
        btnTheme.textContent = theme === "dark" ? "🌙" : "☀️";
        localStorage.setItem("theme", theme);
        renderTabla();
    };

    btnTheme.onclick = () => aplicarTema(body.classList.contains("dark") ? "light" : "dark");
    aplicarTema(localStorage.getItem("theme") || "dark");

    /* =====================================================
       PANEL DERECHO + ESC
    ===================================================== */
    const cerrarPanel = () => rightPanelWrapper.classList.remove("show");

    btnHamburger.onclick = e => {
        e.stopPropagation();
        rightPanelWrapper.classList.toggle("show");
    };

    document.addEventListener("click", e => {
        if (rightPanelWrapper.classList.contains("show") &&
            !rightPanelWrapper.contains(e.target) &&
            !btnHamburger.contains(e.target)
        ) cerrarPanel();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            cerrarModalFn();
            cerrarPanel();
        }
    });

    /* =====================================================
       ORIENTACIÓN
    ===================================================== */
    const checkOrientation = () => {
        orientationBlock.style.display = (window.innerWidth <= 900 && window.innerHeight > window.innerWidth) ? "flex" : "none";
    };

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    /* =====================================================
       INIT
    ===================================================== */
    checkOrientation();
    renderTabla();
});
