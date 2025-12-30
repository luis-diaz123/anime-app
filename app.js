document.addEventListener("DOMContentLoaded", () => {

    /* ======================
       ELEMENTOS
    ====================== */
    const btnTheme = document.getElementById("btnTheme");
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

    const btnHamburger = document.getElementById("btnHamburger");
    const rightPanelWrapper = document.getElementById("rightPanelWrapper");

    /* ======================
       VARIABLES
    ====================== */
    let editId = null;
    let filtroEstado = "todos";
    let filtroCalificacion = "todos";
    let textoBusqueda = "";

    /* ======================
       STORAGE
    ====================== */
    const obtenerAnimes = () => JSON.parse(localStorage.getItem("animes")) || [];
    const guardarAnimes = data => localStorage.setItem("animes", JSON.stringify(data));
    const generarID = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

    /* ======================
       TOAST
    ====================== */
    function mostrarToast(mensaje, tipo = "success") {
        toast.textContent = mensaje;
        toast.className = `toast show ${tipo}`;
        setTimeout(() => toast.classList.remove("show"), 3000);
    }

    /* ======================
       PARSER CSV
    ====================== */
    function parseCSVLine(line) {
        const result = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === "," && !inQuotes) {
                result.push(current);
                current = "";
            } else current += char;
        }

        result.push(current);
        return result.map(v => v.trim().replace(/^"|"$/g, ""));
    }

    /* ======================
       MODAL
    ====================== */
    modal.classList.add("hidden"); // aseguramos que esté oculto al cargar

    btnAgregar.onclick = () => {
        modal.classList.remove("hidden");
        document.getElementById("modalTitle").textContent = "Nuevo Anime";
        form.reset();
        editId = null;

        if (rightPanelWrapper) rightPanelWrapper.classList.remove("show");
    };

    cerrarModal.onclick = () => {
        modal.classList.add("hidden");
        form.reset();
        editId = null;
    };

    /* ======================
       RENDER TABLA
    ====================== */
    function renderTabla() {
        tablaBody.innerHTML = "";
        let animes = obtenerAnimes();

        if (textoBusqueda) {
            animes = animes.filter(a => a.nombre.toLowerCase().includes(textoBusqueda));
        }

        if (filtroEstado !== "todos") {
            animes = animes.filter(a => a.estado === filtroEstado);
        }

        if (filtroCalificacion !== "todos") {
            animes = animes.filter(a => a.calificacion === Number(filtroCalificacion));
        }

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
        });
    }

    /* ======================
       COPIAR NOMBRE DEL ANIME
    ====================== */
    // PC
    tablaBody.addEventListener("dblclick", e => {
        const el = e.target;
        if (!el.classList.contains("copiar")) return;
        navigator.clipboard.writeText(el.dataset.texto);
        mostrarToast("📋 Nombre copiado");
    });

    // Móvil (press and hold)
    let pressTimer;
    tablaBody.addEventListener("touchstart", e => {
        if (e.target.classList.contains("copiar")) {
            pressTimer = setTimeout(() => {
                navigator.clipboard.writeText(e.target.dataset.texto);
                mostrarToast("📋 Nombre copiado");
            }, 600);
        }
    });
    tablaBody.addEventListener("touchend", () => clearTimeout(pressTimer));

    /* ======================
       BUSCADOR
    ====================== */
    searchInput.addEventListener("input", e => {
        textoBusqueda = e.target.value.toLowerCase();
        renderTabla();
    });

    /* ======================
       GUARDAR / EDITAR
    ====================== */
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
        cerrarModal.onclick();
    });

    /* ======================
       EDITAR / ELIMINAR
    ====================== */
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

            if (rightPanelWrapper) rightPanelWrapper.classList.remove("show"); // cerrar panel en móvil
        }
    };

    /* ======================
       FILTROS
    ====================== */
    filtrosEstado.forEach(btn =>
        btn.onclick = () => {
            filtrosEstado.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtroEstado = btn.dataset.estado;
            renderTabla();
        }
    );

    filtrosCalificacion.forEach(btn =>
        btn.onclick = () => {
            filtrosCalificacion.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtroCalificacion = btn.dataset.calificacion;
            renderTabla();
        }
    );

    /* ======================
       IMPORTAR CSV
    ====================== */
    inputCSV.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = ev => {
            const lines = ev.target.result.split(/\r?\n/);
            const actuales = obtenerAnimes();
            let importados = 0;
            lines.shift(); // eliminar encabezado

            lines.forEach(line => {
                if (!line.trim()) return;
                const cols = parseCSVLine(line);
                if (cols.length < 4) return;

                actuales.unshift({
                    id: generarID(),
                    nombre: cols[0],
                    estado: cols[1] || "No",
                    notas: cols[2] || "",
                    calificacion: Number(cols[3]) || 0
                });
                importados++;
            });

            guardarAnimes(actuales);
            renderTabla();
            mostrarToast(`📥 ${importados} registro(s) importados`);
        };
        reader.readAsText(file);
        e.target.value = "";
    });

    /* ======================
       EXPORTAR CSV
    ====================== */
    btnExportar.onclick = () => {
        const animes = obtenerAnimes();
        if (animes.length === 0) {
            mostrarToast("⚠️ No hay datos para exportar", "warning");
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

        mostrarToast(`📤 ${animes.length} registro(s) exportados`);
    };

    /* ======================
       ELIMINAR DUPLICADOS
    ====================== */
    btnEliminarDuplicados.onclick = () => {
        const animes = obtenerAnimes();
        if (animes.length === 0) {
            mostrarToast("⚠️ No hay datos para limpiar", "warning");
            return;
        }
        if (!confirm("¿Eliminar duplicados?")) return;

        const map = new Map();
        animes.forEach(a => {
            const key = a.nombre.toLowerCase().trim();
            if (!map.has(key)) map.set(key, a);
        });

        const eliminados = animes.length - map.size;
        guardarAnimes([...map.values()]);
        renderTabla();
        mostrarToast(
            eliminados > 0
                ? `🧹 ${eliminados} duplicado(s) eliminados`
                : "✔️ No se encontraron duplicados",
            eliminados > 0 ? "success" : "warning"
        );
    };

    /* ======================
       RESET
    ====================== */
    btnReset.onclick = () => {
        const animes = obtenerAnimes();
        if (animes.length === 0) {
            mostrarToast("⚠️ No hay registros para borrar", "warning");
            return;
        }
        if (!confirm(`¿Eliminar ${animes.length} registro(s)?`)) return;

        localStorage.removeItem("animes");
        renderTabla();
        mostrarToast(`🗑️ ${animes.length} registro(s) eliminados`);
    };

    /* ======================
       TEMA
    ====================== */
    function aplicarTema(theme) {
        document.body.classList.remove("dark", "light");
        document.body.classList.add(theme);
        btnTheme.textContent = theme === "dark" ? "🌙" : "☀️";
        localStorage.setItem("theme", theme);
    }

    btnTheme.onclick = () => {
        const actual = document.body.classList.contains("dark") ? "dark" : "light";
        aplicarTema(actual === "dark" ? "light" : "dark");
    };

    aplicarTema(localStorage.getItem("theme") || "dark");
    renderTabla();

    /* ======================
       BOTÓN HAMBURGUESA (MOVILES)
    ====================== */
    if (btnHamburger && rightPanelWrapper) {
        btnHamburger.addEventListener("click", () => {
            rightPanelWrapper.classList.toggle("show");
        });
    }

});
