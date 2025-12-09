let carrito = [];

document.addEventListener("DOMContentLoaded", () => {
    const btnVerCarta = document.getElementById("btnVerCarta");
    const modalCarta = document.getElementById("modalCarta");
    const btnCerrarCarta = document.getElementById("btnCerrarCarta");
    const listaProductos = document.getElementById("listaProductos");
    const totalPedidoSpan = document.getElementById("totalPedido");
    const btnEnviarPedido = document.getElementById("btnEnviarPedido");
    const clienteNombreInput = document.getElementById("clienteNombre");
    const clienteMesaInput = document.getElementById("clienteMesa");

    const btnAdminLogin = document.getElementById("btnAdminLogin");
    const modalAdmin = document.getElementById("modalAdmin");
    const btnCerrarAdminModal = document.getElementById("btnCerrarAdminModal");
    const btnIrLogin = document.getElementById("btnIrLogin");

    const btnLogin = document.getElementById("btnLogin");
    const loginUsuario = document.getElementById("loginUsuario");
    const loginClave = document.getElementById("loginClave");

    // ------ Carta / menú ------ //

    btnVerCarta.addEventListener("click", async () => {
        modalCarta.classList.remove("hidden");
        carrito = [];
        actualizarTotal();
        await cargarMenu(listaProductos);
    });

    btnCerrarCarta.addEventListener("click", () => {
        modalCarta.classList.add("hidden");
    });

    // ------ Admin modal ------ //

    btnAdminLogin.addEventListener("click", () => {
        modalAdmin.classList.remove("hidden");
    });

    btnCerrarAdminModal.addEventListener("click", () => {
        modalAdmin.classList.add("hidden");
    });

    btnIrLogin.addEventListener("click", () => {
        modalAdmin.classList.add("hidden");
        loginUsuario.focus();
    });

    // ------ Login ------ //

    btnLogin.addEventListener("click", async () => {
        const usuario = loginUsuario.value.trim();
        const clave = loginClave.value.trim();

        if (!usuario || !clave) {
            alert("Completa usuario y contraseña");
            return;
        }

        try {
            const resp = await fetch("/api/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({usuario, clave})
            });

            if (!resp.ok) {
                const err = await resp.json();
                alert(err.msg || "Error de login");
                return;
            }

            const data = await resp.json();

            if (data.ok) {
                // Todos los roles ingresan al panel, el panel decide qué pueden ver
                window.location.href = "/admin";
            } else {
                alert(data.msg || "Error de login");
            }

        } catch (e) {
            console.error(e);
            alert("Error al conectar con el servidor");
        }
    });

    // ------ Enviar pedido cliente ------ //

    btnEnviarPedido.addEventListener("click", async () => {
        const nombre = clienteNombreInput.value.trim();
        const mesa = clienteMesaInput.value.trim();

        if (!nombre || !mesa) {
            alert("Por favor, coloca tu nombre y número de mesa.");
            return;
        }

        if (carrito.length === 0) {
            alert("No has seleccionado ningún producto.");
            return;
        }

        const items = carrito.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad,
            precio: item.precio
        }));

        try {
            const resp = await fetch("/api/pedidos", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    cliente_nombre: nombre,
                    mesa: mesa,
                    items: items
                })
            });

            const data = await resp.json();
            if (data.ok) {
                alert(`Pedido enviado. N° de pedido: ${data.pedido_id}`);
                carrito = [];
                actualizarTotal();
                clienteNombreInput.value = "";
                clienteMesaInput.value = "";
                modalCarta.classList.add("hidden");
            } else {
                alert(data.msg || "Error al enviar pedido");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al enviar el pedido");
        }
    });

    // ------ Funciones auxiliares ------ //

    function actualizarTotal() {
        const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
        totalPedidoSpan.textContent = total.toFixed(2);
    }

    async function cargarMenu(contenedor) {
        contenedor.innerHTML = "<p>Cargando carta...</p>";
        try {
            const resp = await fetch("/api/menu");
            const productos = await resp.json();
            if (!Array.isArray(productos) || productos.length === 0) {
                contenedor.innerHTML = "<p>No hay productos disponibles.</p>";
                return;
            }

            contenedor.innerHTML = "";
            productos.forEach(prod => {
                const card = document.createElement("div");
                card.className = "menu-item";

                card.innerHTML = `
                    <h3>${prod.nombre}</h3>
                    <span>${prod.categoria}</span>
                    <div class="precio">S/ ${Number(prod.precio).toFixed(2)}</div>
                    <div class="acciones">
                        <input type="number" min="1" value="1">
                        <button class="btn-outline btnAdd">Añadir</button>
                    </div>
                `;

                const inputCantidad = card.querySelector("input[type='number']");
                const btnAdd = card.querySelector(".btnAdd");

                btnAdd.addEventListener("click", () => {
                    const cant = parseInt(inputCantidad.value) || 1;
                    if (cant <= 0) return;

                    const existente = carrito.find(i => i.id === prod.id);
                    if (existente) {
                        existente.cantidad += cant;
                    } else {
                        carrito.push({
                            id: prod.id,
                            nombre: prod.nombre,
                            precio: Number(prod.precio),
                            cantidad: cant
                        });
                    }
                    actualizarTotal();
                });

                contenedor.appendChild(card);
            });

        } catch (e) {
            console.error(e);
            contenedor.innerHTML = "<p>Error al cargar carta.</p>";
        }
    }
});
