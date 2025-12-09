let pedidosGlobal = [];
let pedidoSeleccionado = null;
let recetaEditando = null;

let ingredientesGlobal = [];
let ingredienteEditando = null;
let chartTopProductos = null;
let chartInventario = null;
let usuariosGlobal = [];
let usuarioEditando = null;


document.addEventListener("DOMContentLoaded", () => {
    const userRol = document.getElementById("userRol").value;


    // Hacer que el contenedor de tabs sea deslizable en móvil
    const tabContainer = document.querySelector(".tabs-container");
    tabContainer.style.overflowX = "auto";
    tabContainer.style.whiteSpace = "nowrap";



    
    // Elementos DOM pedidos
    const listaPedidos = document.getElementById("listaPedidos");
    const detallePedido = document.getElementById("detallePedido");
    const tagPedidoSeleccionado = document.getElementById("tagPedidoSeleccionado");
    const btnLogout = document.getElementById("btnLogout");
    

    // Tabs
    const tabButtons = document.querySelectorAll(".tab-btn");
    const vistaPedidos = document.getElementById("vistaPedidos");
    const vistaDetalle = document.getElementById("vistaDetalle");
    const vistaInventario = document.getElementById("vistaInventario");
    const vistaDashboard = document.getElementById("vistaDashboard");
    const vistaReportes = document.getElementById("vistaReportes");
    const vistaRecetario = document.getElementById("vistaRecetario");
    const vistaPagos = document.getElementById("vistaPagos");
    const vistaUsuarios = document.getElementById("vistaUsuarios");

    // Inventario DOM
    const btnNuevoIngrediente = document.getElementById("btnNuevoIngrediente");
    const formIngrediente = document.getElementById("formIngrediente");
    const formIngredienteTitulo = document.getElementById("formIngredienteTitulo");
    const ingNombre = document.getElementById("ingNombre");
    const ingUnidad = document.getElementById("ingUnidad");
    const ingStockActual = document.getElementById("ingStockActual");
    const ingStockMinimo = document.getElementById("ingStockMinimo");
    const btnGuardarIngrediente = document.getElementById("btnGuardarIngrediente");
    const btnCancelarIngrediente = document.getElementById("btnCancelarIngrediente");
    const tablaIngredientes = document.getElementById("tablaIngredientes");
    const btnNuevaReceta = document.getElementById("btnNuevaReceta");
    const listaRecetas = document.getElementById("listaRecetas");
    const formReceta = document.getElementById("formReceta");
    const tituloFormReceta = document.getElementById("tituloFormReceta");
    const recetaProductoNombre = document.getElementById("recetaProductoNombre");
    const recetaDescripcion = document.getElementById("recetaDescripcion");
    const recetaIngredientesDiv = document.getElementById("recetaIngredientes");
    const btnAgregarIngrediente = document.getElementById("btnAgregarIngrediente");
    const btnGuardarReceta = document.getElementById("btnGuardarReceta");
    const btnCancelarReceta = document.getElementById("btnCancelarReceta");

   
    // Ocultar tabs según rol
    function aplicarRoles() {

    // Todos los tabs
    const tabDashboard = document.querySelector('[data-tab="dashboard"]');
    const tabPedidos = document.querySelector('[data-tab="pedidos"]');
    const tabPagos = document.querySelector('[data-tab="pagos"]');
    const tabReportes = document.querySelector('[data-tab="reportes"]');
    const tabInventario = document.querySelector('[data-tab="inventario"]');
    const tabUsuarios = document.querySelector('[data-tab="usuarios"]');
    const tabRecetario = document.querySelector('[data-tab="recetario"]');

    if (userRol === "mesero") {
        tabDashboard.style.display = "none";
        tabPagos.style.display = "none";
        tabReportes.style.display = "none";
        tabInventario.style.display = "none";
        tabUsuarios.style.display = "none";
        // Solo queda: pedidos, recetario
    }

    if (userRol === "caja") {
        tabDashboard.style.display = "none";
        tabInventario.style.display = "none";
        tabUsuarios.style.display = "none";
        tabRecetario.style.display = "none";
        // queda pedidos, pagos, reportes
    }

    if (userRol === "admin") {
        // Todo visible — no tocamos nada
    }
}

aplicarRoles();

    function aplicarVistas() {
    if (userRol === "mesero") {
        vistaDashboard.classList.add("hidden");
        vistaPagos.classList.add("hidden");
        vistaReportes.classList.add("hidden");
        vistaInventario.classList.add("hidden");
        vistaUsuarios.classList.add("hidden");
    }

    if (userRol === "caja") {
        vistaDashboard.classList.add("hidden");
        vistaInventario.classList.add("hidden");
        vistaUsuarios.classList.add("hidden");
        vistaRecetario.classList.add("hidden");
    }
}

aplicarVistas();

// Abrir vista inicial según rol
if (userRol === "mesero") {
    document.querySelector('[data-tab="pedidos"]').click();
}
else if (userRol === "caja") {
    document.querySelector('[data-tab="pagos"]').click();
}
else {
    document.querySelector('[data-tab="dashboard"]').click();
}


 // --- Inicialización ---
    cargarPedidos();
    // Auto refresco pedidos cada 5 segundos
    setInterval(cargarPedidos, 5000);

    // Tabs
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-tab");
            tabButtons.forEach(b => b.classList.remove("tab-active"));
            btn.classList.add("tab-active");

            vistaDashboard.classList.add("hidden");
            vistaPedidos.classList.add("hidden");
            vistaDetalle.classList.add("hidden");
            vistaInventario.classList.add("hidden");
            vistaPagos.classList.add("hidden");
            vistaReportes.classList.add("hidden");
            vistaUsuarios.classList.add("hidden");
            vistaRecetario.classList.add("hidden");


            if (tab === "dashboard") {
                vistaDashboard.classList.remove("hidden");
                cargarDashboard();

            }else if (tab === "usuarios") {
                vistaDashboard.classList.add("hidden");
                vistaPedidos.classList.add("hidden");
                vistaDetalle.classList.add("hidden");
                vistaInventario.classList.add("hidden");
                vistaPagos.classList.add("hidden");
                vistaReportes.classList.add("hidden");
                vistaUsuarios.classList.remove("hidden");
                cargarUsuarios();           

            }else if (tab === "recetario") {
                vistaDashboard.classList.add("hidden");
                vistaPedidos.classList.add("hidden");
                vistaDetalle.classList.add("hidden");
                vistaInventario.classList.add("hidden");
                vistaPagos.classList.add("hidden");
                vistaReportes.classList.add("hidden");
                vistaUsuarios.classList.add("hidden");
                vistaRecetario.classList.remove("hidden");
                cargarRecetario();

            } else if (tab === "pedidos") {
                vistaPedidos.classList.remove("hidden");
                vistaDetalle.classList.remove("hidden");
                vistaInventario.classList.add("hidden");

            } else if (tab === "inventario") {
                vistaPedidos.classList.add("hidden");
                vistaDetalle.classList.add("hidden");
                vistaInventario.classList.remove("hidden");
                cargarIngredientes();
            }
            else if(tab === "pagos"){
                vistaPedidos.classList.add("hidden");
                vistaDetalle.classList.add("hidden");
                vistaInventario.classList.add("hidden");
                vistaPagos.classList.remove("hidden");
                cargarPagos();
            }
            else if (tab === "reportes") {

                setTimeout(() => {
                    cargarReportes();
                }, 200); // pequeño delay para asegurar que los pagos cargaron
                
                vistaReportes.classList.remove("hidden");
            }

        
        });
    });

    // Logout
    btnLogout.addEventListener("click", async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
        } catch (e) {
            console.error(e);
        }
        window.location.href = "/";
    });

    // --- Eventos Inventario ---

    btnNuevoIngrediente.addEventListener("click", () => {
        mostrarFormIngrediente(true);
    });

    btnCancelarIngrediente.addEventListener("click", () => {
        mostrarFormIngrediente(false);
    });

    btnGuardarIngrediente.addEventListener("click", async () => {
    const nombre = ingNombre.value.trim();
    const unidad = ingUnidad.value;
    const stockActual = parseFloat(ingStockActual.value || "0");
    const stockMinimo = parseFloat(ingStockMinimo.value || "0");

    if (!nombre) {
        alert("Ingresa un nombre para el ingrediente");
        return;
    }

    // Si estamos editando y cambia el stock mínimo, preguntar
    if (ingredienteEditando && stockMinimo !== Number(ingredienteEditando.stock_minimo)) {
        const seguro = confirm("⚠ ¿Seguro que quieres modificar el stock mínimo de este ingrediente?");
        if (!seguro) {
            return; // cancela la operación
        }
    }

    const body = {
        nombre: nombre,
        unidad: unidad,
        stock_actual: stockActual,   // en edición, se suma; en nuevo, es stock inicial
        stock_minimo: stockMinimo
    };

    try {
        let url = "/api/admin/ingredientes/add";

        if (ingredienteEditando) {
            url = `/api/admin/ingredientes/update/${ingredienteEditando.id}`;
        }

        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await resp.json();
        if (!resp.ok || !data.ok) {
            alert(data.msg || "No se pudo guardar el ingrediente");
            return;
        }

        mostrarFormIngrediente(false);
        await cargarIngredientes();
    } catch (e) {
        console.error(e);
        alert("Error de conexión al guardar ingrediente");
    }
});


    // --- Funciones Pedidos ---

    async function cargarPedidos() {
        try {
            const resp = await fetch("/api/admin/pedidos");
            if (!resp.ok) {
                listaPedidos.innerHTML = "<p>No autorizado o error en el servidor.</p>";
                return;
            }

            const data = await resp.json();
            if (!data.ok) {
                listaPedidos.innerHTML = `<p>Error: ${data.msg || "No se pudo obtener pedidos"}</p>`;
                return;
            }

            pedidosGlobal = data.pedidos || [];
            renderListaPedidos();

            if (pedidoSeleccionado) {
                const actualizado = pedidosGlobal.find(p => p.id === pedidoSeleccionado.id);
                if (actualizado) {
                    mostrarDetalle(actualizado);
                } else {
                    pedidoSeleccionado = null;
                    tagPedidoSeleccionado.textContent = "Sin selección";
                    detallePedido.innerHTML = "<p>El pedido seleccionado ya no está en curso.</p>";
                }
            }
        } catch (e) {
            console.error(e);
            listaPedidos.innerHTML = "<p>Error al cargar pedidos.</p>";
        }
    }

    function renderListaPedidos() {
        if (!pedidosGlobal.length) {
            listaPedidos.innerHTML = "<p>No hay pedidos en curso.</p>";
            return;
        }

        listaPedidos.innerHTML = "";
        pedidosGlobal.forEach(ped => {
            const card = document.createElement("div");
            card.className = "pedido-card";

            const estadoClass = "estado-" + ped.estado;

            const fecha = new Date(ped.fecha_hora);
            const hora = fecha.toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit"
            });

            card.innerHTML = `
                <div class="pedido-main">
                    <div class="pedido-title">#${ped.id} – Mesa ${ped.mesa}</div>
                    <div class="pedido-meta">
                        Cliente: <strong>${ped.cliente_nombre}</strong><br>
                        Total: S/ ${Number(ped.total).toFixed(2)} · Hora: ${hora}
                    </div>
                    <div class="pedido-meta">
                        <span class="pedido-estado ${estadoClass}">
                            ${formatearEstado(ped.estado)}
                        </span>
                    </div>
                </div>
                <div class="pedido-actions">
                    <button class="btn-outline btnVerDetalle">Detalle pedido</button>
                    <button class="btn-primary btnCulminar">Marcar culminado</button>
                </div>
            `;

            const btnVerDetalle = card.querySelector(".btnVerDetalle");
            const btnCulminar = card.querySelector(".btnCulminar");

            btnVerDetalle.addEventListener("click", () => {
                mostrarDetalle(ped);
            });

            btnCulminar.addEventListener("click", () => {
                if (!confirm(`¿Marcar el pedido #${ped.id} como culminado?`)) return;
                culminarPedido(ped.id);
            });

            listaPedidos.appendChild(card);
        });
    }

    function mostrarDetalle(pedido) {
        pedidoSeleccionado = pedido;
        tagPedidoSeleccionado.textContent = `Pedido #${pedido.id} · Mesa ${pedido.mesa}`;

        if (!pedido.items || !pedido.items.length) {
            detallePedido.innerHTML = "<p>Este pedido no tiene productos registrados.</p>";
            return;
        }

        const htmlItems = pedido.items.map(item => {
            const badgeClass = "item-" + item.estado_item;
            return `
                <tr>
                    <td>${item.nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>S/ ${Number(item.subtotal).toFixed(2)}</td>
                    <td>
                        <span class="badge-item ${badgeClass}">
                            ${formatearEstado(item.estado_item)}
                        </span>
                    </td>
                    <td>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;">
                            <button class="btn-mini" data-id="${item.id}" data-estado="pendiente">Pendiente</button>
                            <button class="btn-mini" data-id="${item.id}" data-estado="en_preparacion">En prep.</button>
                            <button class="btn-mini" data-id="${item.id}" data-estado="listo">Listo</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        detallePedido.innerHTML = `
            <div class="detalle-header">
                <strong>Cliente:</strong> ${pedido.cliente_nombre}
                <small>Estado general: ${formatearEstado(pedido.estado)} · Total: S/ ${Number(pedido.total).toFixed(2)}</small>
            </div>
            <table class="tabla-items">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Subtotal</th>
                        <th>Estado ítem</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${htmlItems}
                </tbody>
            </table>
            <div class="detalle-footer">
                <button id="btnCulminarDesdeDetalle" class="btn-primary">
                    Marcar pedido #${pedido.id} como culminado
                </button>
            </div>
        `;

        // Eventos de cambio de estado
        detallePedido.querySelectorAll(".btn-mini").forEach(btn => {
            btn.addEventListener("click", () => {
                const itemId = parseInt(btn.getAttribute("data-id"), 10);
                const nuevoEstado = btn.getAttribute("data-estado");
                actualizarEstadoItem(itemId, nuevoEstado);
            });
        });

        const btnCulminarDesdeDetalle = document.getElementById("btnCulminarDesdeDetalle");
        btnCulminarDesdeDetalle.addEventListener("click", () => {
            if (!confirm(`¿Marcar el pedido #${pedido.id} como culminado?`)) return;
            culminarPedido(pedido.id);
        });
    }

    async function actualizarEstadoItem(itemId, nuevoEstado) {
        try {
            const resp = await fetch(`/api/admin/pedido-item/${itemId}/estado`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({estado_item: nuevoEstado})
            });

            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                alert(data.msg || "No se pudo actualizar el estado del ítem");
                return;
            }

            await cargarPedidos();
        } catch (e) {
            console.error(e);
            alert("Error de conexión al actualizar ítem");
        }
    }

    async function culminarPedido(pedidoId) {
        try {
            const resp = await fetch(`/api/admin/pedido/${pedidoId}/culminar`, {
                method: "POST"
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                alert(data.msg || "No se pudo culminar el pedido");
                return;
            }

            await cargarPedidos();
            alert(`Pedido #${pedidoId} marcado como culminado.`);
        } catch (e) {
            console.error(e);
            alert("Error de conexión al culminar pedido");
        }
    }

    function formatearEstado(estado) {
        switch (estado) {
            case "pendiente": return "Pendiente";
            case "en_proceso": return "En proceso";
            case "en_preparacion": return "En preparación";
            case "listo": return "Listo";
            case "culminado": return "Culminado";
            default: return estado;
        }
    }

    // --- Funciones Inventario ---

    async function cargarIngredientes() {
        try {
            const resp = await fetch("/api/admin/ingredientes");
            if (!resp.ok) {
                tablaIngredientes.innerHTML = "<tr><td colspan='6'>Error o no autorizado.</td></tr>";
                return;
            }

            const data = await resp.json();
            if (!data.ok) {
                tablaIngredientes.innerHTML = `<tr><td colspan='6'>${data.msg || "No se pudieron obtener ingredientes"}</td></tr>`;
                return;
            }

            ingredientesGlobal = data.ingredientes || [];
            renderIngredientes();
        } catch (e) {
            console.error(e);
            tablaIngredientes.innerHTML = "<tr><td colspan='6'>Error al cargar ingredientes.</td></tr>";
        }
    }

    function renderIngredientes() {
        if (!ingredientesGlobal.length) {
            tablaIngredientes.innerHTML = "<tr><td colspan='6'>No hay ingredientes registrados.</td></tr>";
            return;
        }

        tablaIngredientes.innerHTML = "";

        ingredientesGlobal.forEach(ing => {
            const tr = document.createElement("tr");

            const estadoInfo = calcularEstadoStock(ing.stock_actual, ing.stock_minimo);

            tr.innerHTML = `
                <td>${ing.nombre}</td>
                <td>${ing.unidad}</td>
                <td>${Number(ing.stock_actual).toFixed(3)}</td>
                <td>${Number(ing.stock_minimo).toFixed(3)}</td>
                <td>
                    <span class="badge-stock ${estadoInfo.clase}">
                        ${estadoInfo.texto}
                    </span>
                </td>
                <td>
                    <button class="btn-mini btnEdit" data-id="${ing.id}">Editar</button>
                    <button class="btn-mini btnDel" data-id="${ing.id}">Eliminar</button>
                </td>
            `;

            const btnEdit = tr.querySelector(".btnEdit");
            const btnDel = tr.querySelector(".btnDel");

            btnEdit.addEventListener("click", () => {
                editarIngrediente(ing);
            });

            btnDel.addEventListener("click", () => {
                if (!confirm(`¿Eliminar el ingrediente "${ing.nombre}"?`)) return;
                eliminarIngrediente(ing.id);
            });

            tablaIngredientes.appendChild(tr);
        });
    }

    function calcularEstadoStock(stockActual, stockMinimo) {
        const sa = parseFloat(stockActual);
        const sm = parseFloat(stockMinimo);

        if (sa <= sm) {
            return {
                clase: "stock-low",
                texto: "Bajo"
            };
        } else if (sa <= sm * 2) {
            return {
                clase: "stock-medium",
                texto: "Medio"
            };
        } else {
            return {
                clase: "stock-ok",
                texto: "Óptimo"
            };
        }
    }

    function mostrarFormIngrediente(mostrar) {
    if (mostrar) {
        formIngrediente.classList.remove("hidden");
        ingredienteEditando = null;
        formIngredienteTitulo.textContent = "Nuevo ingrediente";
        ingNombre.value = "";
        ingUnidad.value = "g";
        ingStockActual.value = "";
        ingStockActual.placeholder = "Stock inicial (ej: 50.0)";
        ingStockMinimo.value = "";
    } else {
        formIngrediente.classList.add("hidden");
        ingredienteEditando = null;
    }
}

function editarIngrediente(ing) {
    ingredienteEditando = ing;
    formIngredienteTitulo.textContent = `Editar ingrediente #${ing.id}`;

    ingNombre.value = ing.nombre;
    ingUnidad.value = ing.unidad;

    // Aquí ya NO mostramos el stock actual en el input,
    // sino que lo usamos como "cantidad a agregar"
    ingStockActual.value = "";
    ingStockActual.placeholder = `Cantidad a agregar (stock actual: ${Number(ing.stock_actual).toFixed(3)})`;

    ingStockMinimo.value = ing.stock_minimo;
    formIngrediente.classList.remove("hidden");
}


    async function eliminarIngrediente(id) {
        try {
            const resp = await fetch(`/api/admin/ingredientes/delete/${id}`, {
                method: "DELETE"
            });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                alert(data.msg || "No se pudo eliminar ingrediente");
                return;
            }
            await cargarIngredientes();
        } catch (e) {
            console.error(e);
            alert("Error de conexión al eliminar ingrediente");
        }
    }

    // PAGOS
const listaPorCobrar = document.getElementById("listaPorCobrar");
const listaPagados = document.getElementById("listaPagados");
const detallePago = document.getElementById("detallePago");

let pedidoParaPagar = null;

// Cargar pagos al cambiar de tab
async function cargarPagos(){
    await cargarPendientesPago();
    await cargarPagados();
}

async function cargarPendientesPago(){
    const resp = await fetch("/api/admin/pagos/pendientes");
    const data = await resp.json();

    listaPorCobrar.innerHTML = "";

    data.pendientes.forEach(p => {
        const card = document.createElement("div");
        card.className = "pago-card";
        card.innerHTML = `
            <strong>Pedido #${p.pedido_id}</strong><br>
            Cliente: ${p.cliente_nombre}<br>
            Mesa: ${p.mesa}<br>
            Total: S/ ${Number(p.total).toFixed(2)}

        `;

        card.addEventListener("click", () => {
            mostrarDetallePago(p);
        });

        listaPorCobrar.appendChild(card);
    });
}

async function cargarPagados(){
    const resp = await fetch("/api/admin/pagos/pagados");
    const data = await resp.json();

    listaPagados.innerHTML = "";

    data.pagados.forEach(p => {
        const card = document.createElement("div");
        card.className = "pago-card";
        card.innerHTML = `
            <strong>Pedido #${p.pedido_id}</strong><br>
            Cliente: ${p.cliente_nombre}<br>
            Mesa: ${p.mesa}<br>
            Total: S/ ${Number(p.total).toFixed(2)}

        `;
        listaPagados.appendChild(card);
    });
}

function mostrarDetallePago(pedido){
    pedidoParaPagar = pedido;

    detallePago.innerHTML = `
        <h4>Pedido #${pedido.id}</h4>
        <p><strong>Total:</strong> S/ ${Number(pedido.total).toFixed(2)}</p>

        <label>Método de pago</label>
        <select id="pagoMetodo">
            <option value="efectivo">Efectivo</option>
            <option value="yape">Yape</option>
            <option value="tarjeta">Tarjeta (+3%)</option>
        </select>

        <label>Monto recibido</label>
        <input type="number" id="pagoMonto" placeholder="Ej: 50.00">

        <label>Comprobante (opcional)</label>
        <input type="text" id="pagoComprobante" placeholder="URL imagen (para yape)">

        <button class="btn-primary" id="btnConfirmarPago">Confirmar pago</button>
    `;

    // Solo este botón existe ahora
    document.getElementById("btnConfirmarPago").addEventListener("click", procesarPago);
}


async function procesarPago() {
    const metodo = document.getElementById("pagoMetodo").value;
    let montoRecibido = parseFloat(document.getElementById("pagoMonto").value || 0);
    const comprobante = document.getElementById("pagoComprobante").value || null;

    const total = Number(pedidoParaPagar.total);
    let recargo = 0;
    let vuelto = 0;

    // --- EFECTIVO ---
    if (metodo === "efectivo") {
        if (montoRecibido < total) {
            return alert("El monto recibido es menor al total a pagar.");
        }
        vuelto = montoRecibido - total;
    }

    // --- TARJETA ---
    if (metodo === "tarjeta") {
        recargo = total * 0.03;
        montoRecibido = total + recargo;
    }

    // --- YAPE ---
    if (metodo === "yape" && !comprobante) {
        return alert("Debe ingresar el comprobante (URL de Yape).");
    }

    const body = {
        pedido_id: pedidoParaPagar.pedido_id || pedidoParaPagar.id,
        metodo,
        monto: montoRecibido,
        vuelto,
        recargo,
        comprobante_url: comprobante
    };

    const resp = await fetch("/api/admin/pagos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await resp.json();

    if (data.ok) {
        alert("Pago registrado correctamente.");

        detallePago.innerHTML = `
            <h4>Pago completado</h4>
            <p><strong>Método:</strong> ${metodo}</p>
            <p><strong>Total:</strong> S/ ${total.toFixed(2)}</p>
            ${metodo === "efectivo" ? `<p><strong>Entregado:</strong> S/ ${montoRecibido.toFixed(2)}</p>
            <p><strong>Vuelto:</strong> S/ ${vuelto.toFixed(2)}</p>` : ""}
            ${metodo === "tarjeta" ? `<p><strong>Incluye recargo 3%:</strong> S/ ${recargo.toFixed(2)}</p>` : ""}
            <button class="btn-outline" onclick="window.open('/api/admin/boleta/${pedidoParaPagar.pedido_id}', '_blank')">
                Descargar Boleta
            </button>
            <button class="btn-outline" onclick="generarFactura(${pedidoParaPagar.pedido_id})">
                Generar Factura
            </button>
        `;

        cargarPagos();

    } else {
        alert(data.msg);
    }
}



function generarFactura(id) {
    const razon = prompt("Razón social:");
    const ruc = prompt("RUC:");
    const direccion = prompt("Dirección:");

    if (!razon || !ruc) {
        alert("Debe ingresar razón social y RUC.");
        return;
    }

    fetch(`/api/admin/factura/${id}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ razon_social: razon, ruc: ruc, direccion: direccion })
    })
    .then(res => res.blob())
    .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    });
}


async function cargarReportes() {
    await cargarReporteDiario();
    await cargarReporteSemanal();
}
// Devuelve fecha local en formato YYYY-MM-DD
function formatFechaLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

async function cargarReporteDiario() {
    const hoy = formatFechaLocal(new Date());   // fecha local

    const resp = await fetch("/api/admin/pagos/pagados");
    const data = await resp.json();

    const cont = document.getElementById("reporteDiario");

    let totalEfec = 0, totalYape = 0, totalTarj = 0;

    (data.pagados || []).forEach(p => {
        // Convertimos la fecha del pago a local y la formateamos
        const fechaPago = formatFechaLocal(new Date(p.fecha_hora));

        if (fechaPago === hoy) {
            const monto = Number(p.monto);
            if (p.metodo === "efectivo") totalEfec += monto;
            if (p.metodo === "yape")     totalYape += monto;
            if (p.metodo === "tarjeta")  totalTarj += monto;
        }
    });

    const totalGeneral = totalEfec + totalYape + totalTarj;

    cont.innerHTML = `
        <h4>Reporte del día (${hoy})</h4>
        <p>Efectivo: S/ ${totalEfec.toFixed(2)}</p>
        <p>Yape: S/ ${totalYape.toFixed(2)}</p>
        <p>Tarjeta: S/ ${totalTarj.toFixed(2)}</p>
        <p><strong>Total:</strong> S/ ${totalGeneral.toFixed(2)}</p>
    `;
}



async function cargarReporteSemanal() {
    const hoy = new Date();

    // Calcular lunes de la semana actual en hora local
    const diaSemana = hoy.getDay(); // 0=domingo,1=lunes,...
    const offset = (diaSemana === 0) ? -6 : (1 - diaSemana); // mover hasta lunes
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() + offset);

    const resp = await fetch("/api/admin/pagos/pagados");
    const data = await resp.json();

    const cont = document.getElementById("reporteSemanal");
    const dias = {};

    // Inicializar los 7 días de la semana (local)
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(inicio);
        fecha.setDate(inicio.getDate() + i);
        const f = formatFechaLocal(fecha);
        dias[f] = { efectivo: 0, yape: 0, tarjeta: 0, total: 0 };
    }

    (data.pagados || []).forEach(p => {
        const fecha = formatFechaLocal(new Date(p.fecha_hora));

        if (dias[fecha]) {
            const monto = Number(p.monto);
            if (p.metodo === "efectivo") dias[fecha].efectivo += monto;
            if (p.metodo === "yape")     dias[fecha].yape     += monto;
            if (p.metodo === "tarjeta")  dias[fecha].tarjeta  += monto;
            dias[fecha].total += monto;
        }
    });

    let html = "<h4>Reporte semanal</h4>";

    Object.keys(dias).forEach(d => {
        html += `
            <p><strong>${d}</strong><br>
            Efectivo: S/ ${dias[d].efectivo.toFixed(2)} |
            Yape: S/ ${dias[d].yape.toFixed(2)} |
            Tarjeta: S/ ${dias[d].tarjeta.toFixed(2)} |
            <strong>Total: S/ ${dias[d].total.toFixed(2)}</strong>
            </p>
            <hr>
        `;
    });

    cont.innerHTML = html;
}




// Cierre diario
document.getElementById("btnCierreDiario").addEventListener("click", async () => {

    const resp = await fetch("/api/admin/reportes/cierre", {
        method: "POST"
    });

    // Como ahora devuelve PDF, no es JSON
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);

    // Abrir el PDF en nueva pestaña (voucher)
    window.open(url, "_blank");

    alert("Cierre realizado e impreso.");
    cargarReportes();
});


async function cargarDashboard() {
    try {
        // 1. Resumen
        const respRes = await fetch("/api/admin/dashboard/resumen");
        const dataRes = await respRes.json();
        if (dataRes.ok) {
            const r = dataRes.resumen;
            document.getElementById("metVentasHoy").textContent = "S/ " + r.ventas_hoy.toFixed(2);
            document.getElementById("metVentasSemana").textContent = "S/ " + r.ventas_semana.toFixed(2);
            document.getElementById("metVentasMes").textContent = "S/ " + r.ventas_mes.toFixed(2);
            document.getElementById("metPedidosActivos").textContent = r.pedidos_activos;
            document.getElementById("metPagosPendientes").textContent = r.pagos_pendientes;
        }

        // 2. Top productos
        const respTop = await fetch("/api/admin/dashboard/top-productos");
        const dataTop = await respTop.json();
        if (dataTop.ok) {
            renderChartTopProductos(dataTop.top || []);
        }

        // 3. Inventario (reutilizamos /api/admin/ingredientes)
        const respInv = await fetch("/api/admin/ingredientes");
        const dataInv = await respInv.json();
        if (dataInv.ok) {
            renderChartInventario(dataInv.ingredientes || []);
        }

    } catch (e) {
        console.error("Error cargando dashboard:", e);
    }
}

function renderChartTopProductos(top) {
    const ctx = document.getElementById("chartTopProductos").getContext("2d");

    if (chartTopProductos) {
        chartTopProductos.destroy();
    }

    const labels = top.map(t => t.nombre);
    const cantidades = top.map(t => t.total_cantidad);

    chartTopProductos = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Cantidad vendida",
                data: cantidades
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: "#e5e7eb" } },
                y: { ticks: { color: "#e5e7eb" } }
            }
        }
    });
}

function renderChartInventario(ingredientes) {
    const ctx = document.getElementById("chartInventario").getContext("2d");

    if (chartInventario) {
        chartInventario.destroy();
    }

    // Tomamos los 5 ingredientes con menor stock relativo (stock_actual / stock_minimo)
    const filtrados = ingredientes
        .filter(i => i.stock_minimo > 0)
        .map(i => ({
            nombre: i.nombre,
            ratio: i.stock_actual / i.stock_minimo
        }))
        .sort((a, b) => a.ratio - b.ratio)
        .slice(0, 5);

    const labels = filtrados.map(f => f.nombre);
    const valores = filtrados.map(f => f.ratio);

    chartInventario = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Stock actual / mínimo (x)",
                data: valores
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: "#e5e7eb" } },
                y: { 
                    ticks: { color: "#e5e7eb" },
                    beginAtZero: true
                }
            }
        }
    });
}
// ================================
//       RECETARIO (ADMIN)
// ================================

btnNuevaReceta.addEventListener("click", () => {
    recetaEditando = null;
    tituloFormReceta.textContent = "Nueva receta";
    recetaProductoNombre.value = "";
    recetaDescripcion.value = "";
    recetaIngredientesDiv.innerHTML = "";
    agregarFilaIngrediente();
    formReceta.classList.remove("hidden");
});

btnCancelarReceta.addEventListener("click", () => {
    formReceta.classList.add("hidden");
    recetaEditando = null;
});

btnAgregarIngrediente.addEventListener("click", () => {
    agregarFilaIngrediente();
});

btnGuardarReceta.addEventListener("click", guardarReceta);

async function cargarRecetario() {
    try {
        const resp = await fetch("/api/admin/recetario");
        const data = await resp.json();
        if (!data.ok) {
            listaRecetas.innerHTML = `<p>${data.msg || "No se pudieron cargar las recetas"}</p>`;
            return;
        }

        renderListaRecetas(data.recetas || []);
    } catch (e) {
        console.error(e);
        listaRecetas.innerHTML = "<p>Error al cargar recetario.</p>";
    }
}

function renderListaRecetas(recetas) {
    listaRecetas.innerHTML = "";

    if (!recetas.length) {
        listaRecetas.innerHTML = "<p>No hay recetas registradas.</p>";
        return;
    }

    recetas.forEach(r => {
        const card = document.createElement("div");
        card.className = "pago-card"; // reutilizo estilo
        card.innerHTML = `
            <strong>${r.producto_nombre}</strong><br>
            <small>${r.descripcion || ""}</small><br>
            Ingredientes: ${r.total_ingredientes}
            <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
                <button class="btn-mini btnVerReceta" data-id="${r.id}">Ver / Editar</button>
                <button class="btn-mini btnDelReceta" data-id="${r.id}">Eliminar</button>
            </div>
        `;

        const btnVer = card.querySelector(".btnVerReceta");
        const btnDel = card.querySelector(".btnDelReceta");

        btnVer.addEventListener("click", () => {
            editarReceta(r.id);
        });

        btnDel.addEventListener("click", () => {
            if (!confirm(`¿Eliminar la receta "${r.producto_nombre}"?`)) return;
            eliminarReceta(r.id);
        });

        listaRecetas.appendChild(card);
    });
}

function agregarFilaIngrediente(ing = null) {
    const row = document.createElement("div");
    row.className = "receta-row";
    row.style.display = "flex";
    row.style.gap = "6px";
    row.style.flexWrap = "wrap";
    row.style.marginBottom = "6px";

    row.innerHTML = `
        <input type="text" class="rec-ing-nombre" placeholder="Ingrediente" style="flex:2; min-width:120px;"
               value="${ing ? ing.ingrediente_nombre : ""}">
        <input type="number" class="rec-ing-cant" placeholder="Cant." step="0.001" style="flex:1; min-width:80px;"
               value="${ing ? ing.cantidad : ""}">
        <select class="rec-ing-unidad" style="flex:1; min-width:80px;">
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="u">u</option>
        </select>
        <button type="button" class="btn-mini rec-ing-del">-</button>
    `;

    const selUnidad = row.querySelector(".rec-ing-unidad");
    if (ing && ing.unidad) {
        selUnidad.value = ing.unidad;
    }

    row.querySelector(".rec-ing-del").addEventListener("click", () => {
        row.remove();
    });

    recetaIngredientesDiv.appendChild(row);
}

async function editarReceta(id) {
    try {
        const resp = await fetch(`/api/admin/recetario/${id}`);
        const data = await resp.json();
        if (!data.ok) {
            alert(data.msg || "No se pudo cargar la receta");
            return;
        }

        recetaEditando = data.receta.id;
        tituloFormReceta.textContent = `Editar receta: ${data.receta.producto_nombre}`;
        recetaProductoNombre.value = data.receta.producto_nombre;
        recetaDescripcion.value = data.receta.descripcion || "";

        recetaIngredientesDiv.innerHTML = "";
        (data.ingredientes || []).forEach(ing => agregarFilaIngrediente(ing));

        if (!data.ingredientes || !data.ingredientes.length) {
            agregarFilaIngrediente();
        }

        formReceta.classList.remove("hidden");
    } catch (e) {
        console.error(e);
        alert("Error al cargar receta");
    }
}

async function eliminarReceta(id) {
    try {
        const resp = await fetch(`/api/admin/recetario/delete/${id}`, {
            method: "DELETE"
        });
        const data = await resp.json();
        if (!data.ok) {
            alert(data.msg || "No se pudo eliminar la receta");
            return;
        }
        cargarRecetario();
    } catch (e) {
        console.error(e);
        alert("Error al eliminar receta");
    }
}

async function guardarReceta() {
    const producto_nombre = recetaProductoNombre.value.trim();
    const descripcion = recetaDescripcion.value.trim();

    if (!producto_nombre) {
        alert("Ingresa el nombre del producto / receta");
        return;
    }

    // recopilar ingredientes
    const filas = recetaIngredientesDiv.querySelectorAll(".receta-row");
    const ingredientes = [];
    filas.forEach(row => {
        const nombre = row.querySelector(".rec-ing-nombre").value.trim();
        const cant = parseFloat(row.querySelector(".rec-ing-cant").value || "0");
        const unidad = row.querySelector(".rec-ing-unidad").value;

        if (nombre && cant > 0) {
            ingredientes.push({
                ingrediente_nombre: nombre,
                cantidad: cant,
                unidad: unidad
            });
        }
    });

    if (!ingredientes.length) {
        alert("Agrega al menos un ingrediente con cantidad válida.");
        return;
    }

    const body = {
        id: recetaEditando,
        producto_nombre,
        descripcion,
        ingredientes
    };

    try {
        const resp = await fetch("/api/admin/recetario/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await resp.json();
        if (!data.ok) {
            alert(data.msg || "No se pudo guardar la receta");
            return;
        }

        formReceta.classList.add("hidden");
        recetaEditando = null;
        cargarRecetario();
    } catch (e) {
        console.error(e);
        alert("Error al guardar receta");
    }
}


// ==============================
//      USUARIOS (ADMIN)
// ==============================

// DOM
const tablaUsuarios = document.getElementById("tablaUsuarios");
const btnNuevoUsuario = document.getElementById("btnNuevoUsuario");
const formUsuario = document.getElementById("formUsuario");
const usuNombre = document.getElementById("usuNombre");
const usuClave = document.getElementById("usuClave");
const usuRol = document.getElementById("usuRol");
const formUsuarioTitulo = document.getElementById("formUsuarioTitulo");
const btnGuardarUsuario = document.getElementById("btnGuardarUsuario");
const btnCancelarUsuario = document.getElementById("btnCancelarUsuario");

btnNuevoUsuario.addEventListener("click", () => {
    usuarioEditando = null;
    formUsuarioTitulo.textContent = "Nuevo Usuario";
    usuNombre.value = "";
    usuClave.value = "";
    usuRol.value = "mesero";
    formUsuario.classList.remove("hidden");
});

btnCancelarUsuario.addEventListener("click", () => {
    formUsuario.classList.add("hidden");
});

// Cargar lista
async function cargarUsuarios() {
    const resp = await fetch("/api/admin/usuarios");
    const data = await resp.json();

    usuariosGlobal = data.usuarios || [];

    renderUsuarios();
}

function renderUsuarios() {
    tablaUsuarios.innerHTML = "";

    usuariosGlobal.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.usuario}</td>
            <td>${u.rol}</td>
            <td>${u.activo ? "Activo" : "Desactivado"}</td>
            <td>
                <button class="btn-mini btnEditUsu" data-id="${u.id}">Editar</button>
                <button class="btn-mini btnToggleUsu" data-id="${u.id}">
                    ${u.activo ? "Desactivar" : "Activar"}
                </button>
            </td>
        `;

        const btnEdit = tr.querySelector(".btnEditUsu");
        const btnToggle = tr.querySelector(".btnToggleUsu");

        btnEdit.addEventListener("click", () => {
            usuarioEditando = u;
            formUsuarioTitulo.textContent = "Editar Usuario";
            usuNombre.value = u.usuario;
            usuClave.value = "";
            usuRol.value = u.rol;
            formUsuario.classList.remove("hidden");
        });

        btnToggle.addEventListener("click", async () => {
            const nuevoEstado = u.activo ? 0 : 1;

            await fetch(`/api/admin/usuarios/update/${u.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rol: u.rol, activo: nuevoEstado })
            });

            cargarUsuarios();
        });

        tablaUsuarios.appendChild(tr);
    });
}

// Guardar usuario
btnGuardarUsuario.addEventListener("click", async () => {
    const usuario = usuNombre.value.trim();
    const clave = usuClave.value.trim();
    const rol = usuRol.value;

    if (!usuario || (!usuarioEditando && !clave)) {
        alert("Usuario y clave requeridos");
        return;
    }

    // Nuevo usuario
    if (!usuarioEditando) {
        const resp = await fetch("/api/admin/usuarios/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, clave, rol })
        });

        const data = await resp.json();
        if (!data.ok) return alert(data.msg);
    } else {
        // Modificar usuario
        const resp = await fetch(`/api/admin/usuarios/update/${usuarioEditando.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rol: rol,
                activo: usuarioEditando.activo
            })
        });

        const data = await resp.json();
        if (!data.ok) return alert(data.msg);
    }

    formUsuario.classList.add("hidden");
    cargarUsuarios();
});


});
