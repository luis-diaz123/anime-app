document.addEventListener("DOMContentLoaded", () => {

    /* ===========================
       ELEMENTOS
    ============================ */
    const body = document.body;

    const tablaBody = document.querySelector("#tablaAnimes tbody");
    const searchInput = document.getElementById("searchInput");

    const btnTheme = document.getElementById("btnTheme");
    const btnHamburger = document.getElementById("btnHamburger");
    const btnAgregar = document.getElementById("btnAgregar");
    const btnExportar = document.getElementById("btnExportarCSV");
    const btnEliminarDuplicados = document.getElementById("btnEliminarDuplicados");
    const btnReset = document.getElementById("btnReset");
    const btnShare = document.getElementById("btnShare");

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

    /* ===========================
       VARIABLES
    ============================ */
    let editId = null;
    let filtroEstado = "todos";
    let filtroCalificacion = "todos";
    let textoBusqueda = "";

    /* ===========================
       STORAGE
    ============================ */
    const obtenerAnimes = () =>
        JSON.parse(localStorage.getItem("animes")) || [];

    const guardarAnimes = data =>
        localStorage.setItem("animes", JSON.stringify(data));

    const generarID = () =>
        Date.now().toString(36) + Math.random().toString(36).slice(2);

    /* ===========================
       TOAST
    ============================ */
    function mostrarToast(msg) {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }

    /* ===========================
       MODAL
    ============================ */
    function cerrarModalFn() {
        modal.classList.add("hidden");
        form.reset();
        editId = null;
    }

    btnAgregar.onclick = () => {
        modal.classList.remove("hidden");
        form.reset();
        editId = null;
        cerrarPanel();
    };

    cerrarModal.onclick = cerrarModalFn;

    /* ===========================
       RENDER TABLA
    ============================ */
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
                    <span class="copiar" title="Doble click para copiar">
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

    /* ===========================
       COPIAR NOMBRE
    ============================ */
    tablaBody.addEventListener("dblclick", e => {
        if (!e.target.classList.contains("copiar")) return;
        navigator.clipboard.writeText(e.target.textContent);
        mostrarToast("📋 Nombre copiado");
    });

    /* ===========================
       BUSCADOR
    ============================ */
    searchInput.addEventListener("input", e => {
        textoBusqueda = e.target.value.toLowerCase();
        renderTabla();
    });

    /* ===========================
       GUARDAR / EDITAR
    ============================ */
    form.addEventListener("submit", e => {
        e.preventDefault();

        const animes = obtenerAnimes();
        const data = {
            id: editId || generarID(),
            nombre: nombreInput.value.trim(),
            estado: estadoInput.value,
            calificacion: Number(calificacionInput.value),
            notas: notasInput.value.trim()
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

    /* ===========================
       EDITAR / ELIMINAR
    ============================ */
    tablaBody.onclick = e => {
        const id = e.target.dataset.id;
        if (!id) return;

        const animes = obtenerAnimes();
        const anime = animes.find(a => a.id === id);

        if (e.target.classList.contains("btn-delete")) {
            if (!confirm("¿Eliminar este anime?")) return;
            guardarAnimes(animes.filter(a => a.id !== id));
            renderTabla();
            mostrarToast("🗑️ Registro eliminado");
        }

        if (e.target.classList.contains("btn-edit")) {
            nombreInput.value = anime.nombre;
            estadoInput.value = anime.estado;
            calificacionInput.value = anime.calificacion;
            notasInput.value = anime.notas;
            editId = id;
            modal.classList.remove("hidden");
            cerrarPanel();
        }
    };

    /* ===========================
       FILTROS
    ============================ */
    filtrosEstado.forEach(btn => {
        btn.onclick = () => {
            filtrosEstado.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtroEstado = btn.dataset.estado;
            renderTabla();
        };
    });

    filtrosCalificacion.forEach(btn => {
        btn.onclick = () => {
            filtrosCalificacion.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filtroCalificacion = btn.dataset.calificacion;
            renderTabla();
        };
    });

    /* ===========================
       EXPORTAR / DUPLICADOS / RESET
    ============================ */
    btnExportar.onclick = () => {
        const animes = obtenerAnimes();
        if (!animes.length) return mostrarToast("⚠️ No hay datos");

        let csv = "Anime,Estado,Notas,Calificacion\n";
        animes.forEach(a => {
            csv += `"${a.nombre}","${a.estado}","${a.notas}",${a.calificacion}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "animes.csv";
        link.click();

        mostrarToast("📤 CSV exportado");
    };

    btnEliminarDuplicados.onclick = () => {
        const map = new Map();
        obtenerAnimes().forEach(a => {
            const key = a.nombre.toLowerCase().trim();
            if (!map.has(key)) map.set(key, a);
        });
        guardarAnimes([...map.values()]);
        renderTabla();
        mostrarToast("🧹 Duplicados eliminados");
    };

    btnReset.onclick = () => {
        if (!confirm("¿Borrar todos los datos?")) return;
        localStorage.removeItem("animes");
        renderTabla();
        mostrarToast("🗑️ Datos borrados");
    };

    /* ===========================
       COMPARTIR LISTA
    ============================ */
    btnShare.onclick = async () => {
        const data = btoa(
            encodeURIComponent(JSON.stringify(obtenerAnimes()))
        );

        const url = `${location.origin}${location.pathname}?shared=1&data=${data}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Mi lista de animes",
                    text: "Te comparto mi lista de animes",
                    url
                });
            } catch {}
        } else {
            await navigator.clipboard.writeText(url);
            mostrarToast("🔗 Link copiado al portapapeles");
        }
    };

    /* ===========================
       IMPORTAR DESDE LINK
    ============================ */
    const params = new URLSearchParams(location.search);
    if (params.get("shared") === "1" && params.get("data")) {
        try {
            const data = JSON.parse(
                decodeURIComponent(atob(params.get("data")))
            );
            guardarAnimes(data);
            body.classList.add("shared");
            mostrarToast("👁️ Vista compartida");
            history.replaceState({}, "", location.pathname);
        } catch {
            mostrarToast("⚠️ Link inválido");
        }
    }

    /* ===========================
       PANEL / TEMA
    ============================ */
    function cerrarPanel() {
        rightPanelWrapper.classList.remove("show");
    }

    btnHamburger.onclick = e => {
        e.stopPropagation();
        rightPanelWrapper.classList.toggle("show");
    };

    btnTheme.onclick = () => {
        body.classList.toggle("light");
        body.classList.toggle("dark");
    };

    /* ===========================
       ORIENTACIÓN
    ============================ */
    function checkOrientation() {
        if (window.innerWidth <= 900 && window.innerHeight > window.innerWidth) {
            orientationBlock.style.display = "flex";
        } else {
            orientationBlock.style.display = "none";
        }
    }

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    /* ===========================
       INIT
    ============================ */
    checkOrientation();
    renderTabla();
});
