document.addEventListener("DOMContentLoaded", () => {

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
    const cerrarModal = document.getElementById("cerrarModal");
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
    const obtenerAnimes = () =>
        JSON.parse(localStorage.getItem("animes")) || [];

    const guardarAnimes = data =>
        localStorage.setItem("animes", JSON.stringify(data));

    const generarID = () =>
        Date.now().toString(36) + Math.random().toString(36).slice(2);

    /* =====================================================
       TOAST
    ===================================================== */
    function mostrarToast(mensaje) {
        toast.textContent = mensaje;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }

    /* =====================================================
       CSV PARSER
    ===================================================== */
    function parseCSVLine(line) {
        const result = [];
        let current = "";
        let inQuotes = false;

        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === "," && !inQuotes) {
                result.push(current);
                current = "";
            } else current += char;
        }

        result.push(current);
        return result.map(v => v.trim().replace(/^"|"$/g, ""));
    }

    /* =====================================================
       MODAL
    ===================================================== */
    modal.classList.add("hidden");

    btnAgregar.onclick = () => {
        modal.classList.remove("hidden");
        document.getElementById("modalTitle").textContent = "Nuevo Anime";
        form.reset();
        editId = null;
        cerrarPanel();
    };

    cerrarModal.onclick = cerrarModalFn;

    function cerrarModalFn() {
        modal.classList.add("hidden");
        form.reset();
        editId = null;
    }

    /* =====================================================
       RENDER TABLA
    ===================================================== */
    function renderTabla() {
        tablaBody.innerHTML = "";

        let animes = obtenerAnimes();

        if (textoBusqueda) {
            animes = animes.filter(a =>
                a.nombre.toLowerCase().includes(textoBusqueda)
            );
        }

        if (filtroEstado !== "todos") {
            animes = animes.filter(a => a.estado === filtroEstado);
        }

        if (filtroCalificacion !== "todos") {
            animes = animes.filter(
                a => a.calificacion === Number(filtroCalificacion)
            );
        }

        animes.forEach(anime => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <span class="titulo-anime copiar"
                        title="${anime.nombre}"
                        data-texto="${anime.nombre}">
                        ${anime.nombre}
                    </span>
                </td>
                <td class="estado-${anime.estado.toLowerCase()}">
                    ${anime.estado}
                </td>
                <td>
                    ${anime.calificacion === 0
                        ? "Pendiente"
                        : "⭐".repeat(anime.calificacion)}
                </td>
                <td>${anime.notas || ""}</td>
                <td>
                    <button class="btn-edit" data-id="${anime.id}">✏️</button>
                    <button class="btn-delete" data-id="${anime.id}">❌</button>
                </td>
            `;
            tablaBody.appendChild(tr);
        });
    }

    /* =====================================================
       COPIAR NOMBRE
    ===================================================== */
    tablaBody.addEventListener("dblclick", e => {
        if (!e.target.classList.contains("copiar")) return;
        navigator.clipboard.writeText(e.target.dataset.texto);
        mostrarToast("📋 Nombre copiado");
    });

    let pressTimer;
    tablaBody.addEventListener("touchstart", e => {
        if (!e.target.classList.contains("copiar")) return;
        pressTimer = setTimeout(() => {
            navigator.clipboard.writeText(e.target.dataset.texto);
            mostrarToast("📋 Nombre copiado");
        }, 600);
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
       FILTROS (🔧 ARREGLADOS)
    ===================================================== */
    filtrosEstado.forEach(btn => {
        btn.addEventListener("click", () => {
            filtrosEstado.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtroEstado = btn.dataset.estado;
            renderTabla();
        });
    });

    filtrosCalificacion.forEach(btn => {
        btn.addEventListener("click", () => {
            filtrosCalificacion.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtroCalificacion = btn.dataset.calificacion;
            renderTabla();
        });
    });

    /* =====================================================
       EXPORTAR / IMPORTAR / RESET / DUPLICADOS
    ===================================================== */
    btnExportar.onclick = () => {
        const animes = obtenerAnimes();
        if (!animes.length) {
            mostrarToast("⚠️ No hay datos");
            return;
        }

        let csv = "Anime,Estado,Notas,Calificacion\n";
        animes.forEach(a => {
            csv += `"${a.nombre}","${a.estado}","${a.notas || ""}",${a.calificacion}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "animes.csv";
        link.click();

        mostrarToast("📤 CSV exportado");
    };

    btnEliminarDuplicados.onclick = () => {
        const animes = obtenerAnimes();
        const map = new Map();

        animes.forEach(a => {
            const key = a.nombre.toLowerCase().trim();
            if (!map.has(key)) map.set(key, a);
        });

        guardarAnimes([...map.values()]);
        renderTabla();
        mostrarToast("🧹 Duplicados limpiados");
    };

    btnReset.onclick = () => {
        if (!confirm("¿Eliminar todos los registros?")) return;
        localStorage.removeItem("animes");
        renderTabla();
        mostrarToast("🗑️ Datos eliminados");
    };

    /* =====================================================
       TEMA DARK / LIGHT (✔ TABLA CORREGIDA)
    ===================================================== */
    function aplicarTema(theme) {
        body.classList.remove("dark", "light");
        body.classList.add(theme);
        btnTheme.textContent = theme === "dark" ? "🌙" : "☀️";
        localStorage.setItem("theme", theme);
        renderTabla(); // 🔧 fuerza repintado de tabla
    }

    btnTheme.onclick = () => {
        const actual = body.classList.contains("dark") ? "dark" : "light";
        aplicarTema(actual === "dark" ? "light" : "dark");
    };

    aplicarTema(localStorage.getItem("theme") || "dark");

    /* =====================================================
       PANEL DERECHO + ESC
    ===================================================== */
    function cerrarPanel() {
        rightPanelWrapper.classList.remove("show");
    }

    btnHamburger.onclick = e => {
        e.stopPropagation();
        rightPanelWrapper.classList.toggle("show");
    };

    document.addEventListener("click", e => {
        if (
            rightPanelWrapper.classList.contains("show") &&
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
    function checkOrientation() {
        if (window.innerWidth <= 900 && window.innerHeight > window.innerWidth) {
            orientationBlock.style.display = "flex";
        } else {
            orientationBlock.style.display = "none";
        }
    }

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    /* =====================================================
       INIT
    ===================================================== */
    checkOrientation();
    renderTabla();

});
