document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS (Añadido btnCompartir)
    ===================================================== */
    const body = document.body;
    const btnTheme = document.getElementById("btnTheme");
    const btnHamburger = document.getElementById("btnHamburger");
    const tablaBody = document.querySelector("#tablaAnimes tbody");
    const searchInput = document.getElementById("searchInput");
    const btnAgregar = document.getElementById("btnAgregar");
    const btnExportar = document.getElementById("btnExportarCSV");
    const btnCompartir = document.getElementById("btnCompartir"); // Nuevo
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
       VARIABLES DE ESTADO Y PARÁMETROS URL
    ===================================================== */
    let editId = null;
    let filtroEstado = "todos";
    let filtroCalificacion = "todos";
    let textoBusqueda = "";

    // Lógica de detección de Modo Lectura y Datos Externos
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    const modoLectura = urlParams.get('view') === 'readonly';
    let animesCompartidos = [];

    if (dataParam) {
        try {
            // Decodificamos de Base64 -> String -> JSON
            const decoded = decodeURIComponent(escape(atob(dataParam)));
            animesCompartidos = JSON.parse(decoded);
            if (modoLectura) {
                body.classList.add("readonly-mode");
                setTimeout(() => mostrarToast("📖 Viendo lista compartida (Solo lectura)"), 500);
            }
        } catch (e) {
            console.error("Error decodificando datos:", e);
            mostrarToast("❌ Error al cargar datos compartidos");
        }
    }

    /* =====================================================
       STORAGE
    ===================================================== */
    const obtenerAnimes = () => {
        // Si hay datos en la URL, priorizamos esos sobre el LocalStorage
        if (dataParam && animesCompartidos.length > 0) return animesCompartidos;
        return JSON.parse(localStorage.getItem("animes")) || [];
    };

    const guardarAnimes = data => {
        if (modoLectura) return; // Protegemos el guardado en modo lectura
        localStorage.setItem("animes", JSON.stringify(data));
    };

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
        if (modoLectura) return;
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();

        reader.onload = evt => {
            const lines = evt.target.result.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            if (!lines.length) {
                mostrarToast("⚠️ Archivo vacío");
                return;
            }

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
        if (modoLectura) return;
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
            
            // Ocultar botones de acción en modo lectura
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
            tablaBody.appendChild(tr);
        });
    };

    /* =====================================================
       COPIAR NOMBRE Y COMPARTIR URL
    ===================================================== */
    const copiarTexto = texto => {
        navigator.clipboard.writeText(texto);
        mostrarToast("📋 Nombre copiado");
    };

    // Lógica del botón compartir (NUEVO)
    btnCompartir.onclick = () => {
        const animes = obtenerAnimes();
        if (!animes.length) {
            mostrarToast("⚠️ No hay datos para compartir");
            return;
        }
        // Codificación: JSON -> String -> Base64
        const datosBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(animes))));
        const urlFinal = `${window.location.origin}${window.location.pathname}?data=${datosBase64}&view=readonly`;
        
        navigator.clipboard.writeText(urlFinal).then(() => {
            mostrarToast("✅ Enlace con TUS DATOS copiado");
        });
    };

    tablaBody.addEventListener("dblclick", e => {
        if (!e.target.classList.contains("copiar")) return;
        copiarTexto(e.target.dataset.texto);
    });

    /* =====================================================
       CRUD Y EVENTOS
    ===================================================== */
    searchInput.addEventListener("input", e => {
        textoBusqueda = e.target.value.toLowerCase();
        renderTabla();
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        if (modoLectura) return;
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

    tablaBody.onclick = e => {
        if (modoLectura) return;
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
       FILTROS Y UTILIDADES
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

    btnExportar.onclick = () => {
        const animes = obtenerAnimes();
        if (!animes.length) return mostrarToast("⚠️ No hay datos");
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
    };

    btnEliminarDuplicados.onclick = () => {
        if (modoLectura) return;
        const animes = obtenerAnimes();
        if (!confirm("¿Eliminar duplicados?")) return;
        const map = new Map();
        animes.forEach(a => map.set(a.nombre.toLowerCase().trim(), a));
        guardarAnimes([...map.values()]);
        renderTabla();
        mostrarToast("🧹 Duplicados limpiados");
    };

    btnReset.onclick = () => {
        if (modoLectura) return;
        if (!confirm("¿Borrar TODO?")) return;
        localStorage.removeItem("animes");
        renderTabla();
        mostrarToast("🗑️ Datos eliminados");
    };

    /* =====================================================
       TEMA Y UI
    ===================================================== */
    const aplicarTema = theme => {
        body.classList.remove("dark", "light");
        body.classList.add(theme);
        btnTheme.textContent = theme === "dark" ? "🌙" : "☀️";
        localStorage.setItem("theme", theme);
    };

    btnTheme.onclick = () => aplicarTema(body.classList.contains("dark") ? "light" : "dark");
    aplicarTema(localStorage.getItem("theme") || "dark");

    const cerrarPanel = () => rightPanelWrapper.classList.remove("show");
    btnHamburger.onclick = e => {
        e.stopPropagation();
        rightPanelWrapper.classList.toggle("show");
    };

    const checkOrientation = () => {
        orientationBlock.style.display = (window.innerWidth <= 900 && window.innerHeight > window.innerWidth) ? "flex" : "none";
    };

    window.addEventListener("resize", checkOrientation);
    checkOrientation();
    renderTabla();
});
