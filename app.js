document.addEventListener("DOMContentLoaded", () => {
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

    let editId = null;
    let filtroEstado = "todos";
    let filtroCalificacion = "todos";
    let textoBusqueda = "";

    // Detección de Parámetros URL
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    const modoLectura = urlParams.get('view') === 'readonly';
    let animesCompartidos = [];

    if (dataParam) {
        try {
            const decoded = decodeURIComponent(escape(atob(dataParam)));
            animesCompartidos = JSON.parse(decoded);
            if (modoLectura) body.classList.add("readonly-mode");
        } catch (e) {
            console.error("Error decodificando URL", e);
        }
    }

    /* --- GESTIÓN DE DATOS --- */
    const obtenerAnimes = () => {
        if (dataParam && animesCompartidos.length > 0) return animesCompartidos;
        let locales = JSON.parse(localStorage.getItem("animes")) || [];
        // Normalizamos los datos para asegurar que la calificación sea número
        return locales.map(a => ({...a, calificacion: parseInt(a.calificacion) || 0}));
    };

    const guardarAnimes = data => {
        if (modoLectura) return;
        localStorage.setItem("animes", JSON.stringify(data));
    };

    const mostrarToast = msg => {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    };

    /* --- FUNCIONES DE IMPORTACIÓN / EXPORTACIÓN --- */
    btnExportarJSON.onclick = () => {
        const data = obtenerAnimes();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mis_animes.json";
        a.click();
    };

    inputJSON.onchange = e => {
        const reader = new FileReader();
        reader.onload = f => {
            const data = JSON.parse(f.target.result);
            guardarAnimes(data);
            renderTabla();
            mostrarToast("✅ JSON Importado");
        };
        reader.readAsText(e.target.files[0]);
    };

    btnCompartir.onclick = () => {
        const data = btoa(unescape(encodeURIComponent(JSON.stringify(obtenerAnimes()))));
        const url = `${window.location.origin}${window.location.pathname}?data=${data}&view=readonly`;
        navigator.clipboard.writeText(url);
        mostrarToast("🔗 Enlace de lectura copiado");
    };

    /* --- RENDERIZADO (CORRECCIÓN DE ESTRELLAS) --- */
    const renderTabla = () => {
        tablaBody.innerHTML = "";
        let animes = obtenerAnimes();

        if (textoBusqueda) animes = animes.filter(a => a.nombre.toLowerCase().includes(textoBusqueda));
        if (filtroEstado !== "todos") animes = animes.filter(a => a.estado === filtroEstado);
        if (filtroCalificacion !== "todos") animes = animes.filter(a => Number(a.calificacion) === Number(filtroCalificacion));

        animes.forEach(anime => {
            const tr = document.createElement("tr");
            
            // Forzar calificación a número para repetir estrellas
            const num = parseInt(anime.calificacion) || 0;
            const estrellas = num > 0 ? "⭐".repeat(num) : "Pendiente";

            const acciones = modoLectura ? "" : `
                <button class="btn-edit" data-id="${anime.id}">✏️</button>
                <button class="btn-delete" data-id="${anime.id}">❌</button>
            `;

            tr.innerHTML = `
                <td><span class="titulo-anime copiar" data-texto="${anime.nombre}">${anime.nombre}</span></td>
                <td><span class="estado-${anime.estado.toLowerCase()}">${anime.estado}</span></td>
                <td style="color: #ffca28; font-weight: bold;">${estrellas}</td>
                <td>${anime.notas || ""}</td>
                <td>${acciones}</td>
            `;
            tablaBody.appendChild(tr);
        });
    };

    /* --- CRUD --- */
    form.onsubmit = e => {
        e.preventDefault();
        let list = obtenerAnimes();
        const nuevo = {
            id: editId || Date.now().toString(),
            nombre: nombreInput.value.trim(),
            estado: estadoInput.value,
            notas: notasInput.value.trim(),
            calificacion: parseInt(calificacionInput.value) || 0
        };

        if (editId) {
            const i = list.findIndex(a => a.id === editId);
            list[i] = nuevo;
        } else {
            list.unshift(nuevo);
        }

        guardarAnimes(list);
        renderTabla();
        modal.classList.add("hidden");
        form.reset();
        editId = null;
    };

    tablaBody.onclick = e => {
        const id = e.target.dataset.id;
        if (!id) return;
        if (e.target.classList.contains("btn-delete")) {
            guardarAnimes(obtenerAnimes().filter(a => a.id !== id));
            renderTabla();
        }
        if (e.target.classList.contains("btn-edit")) {
            const a = obtenerAnimes().find(x => x.id === id);
            editId = id;
            nombreInput.value = a.nombre;
            estadoInput.value = a.estado;
            calificacionInput.value = a.calificacion;
            notasInput.value = a.notas;
            modal.classList.remove("hidden");
        }
    };

    /* --- UI Y TEMA --- */
    btnTheme.onclick = () => {
        const nuevoTema = body.classList.contains("dark") ? "light" : "dark";
        body.className = nuevoTema;
        if (modoLectura) body.classList.add("readonly-mode");
        localStorage.setItem("theme", nuevoTema);
    };

    btnHamburger.onclick = () => rightPanelWrapper.classList.toggle("show");
    btnAgregar.onclick = () => modal.classList.remove("hidden");
    cerrarModalBtn.onclick = () => modal.classList.add("hidden");

    // Filtros
    filtrosEstado.forEach(b => b.onclick = () => {
        filtrosEstado.forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        filtroEstado = b.dataset.estado;
        renderTabla();
    });

    filtrosCalificacion.forEach(b => b.onclick = () => {
        filtrosCalificacion.forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        filtroCalificacion = b.dataset.calificacion;
        renderTabla();
    });

    searchInput.oninput = e => { textoBusqueda = e.target.value.toLowerCase(); renderTabla(); };

    // Iniciar
    body.classList.add(localStorage.getItem("theme") || "dark");
    renderTabla();
});
