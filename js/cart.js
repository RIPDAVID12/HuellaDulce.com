// MÓDULO DE CARRITO, PERSISTENCIA EN LOCALSTORAGE Y COMUNICACIÓN
window.carritoDeCompras = window.carritoDeCompras || [];
window.WEBHOOK_URL = "https://hook.eu1.make.com/9jdsvkq580xfwq89j4e1iqsku3e2c8x1";

const STORAGE_KEY_CART = 'huellaDulce_carrito';
const STORAGE_KEY_CLIENT = 'huellaDulce_cliente';

function guardarEstadoCarrito() {
    try {
        localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(window.carritoDeCompras));
        const clienteNombre = document.getElementById('clienteNombre')?.value || "";
        const clienteTelefono = document.getElementById('clienteTelefono')?.value || "";
        localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify({ nombre: clienteNombre, telefono: clienteTelefono }));
    } catch (err) {
        console.warn("No se pudo guardar en localStorage:", err);
    }
}

function cargarEstadoCarrito() {
    try {
        const savedCart = localStorage.getItem(STORAGE_KEY_CART);
        if (savedCart) {
            window.carritoDeCompras = JSON.parse(savedCart) || [];
        }
        const savedClient = localStorage.getItem(STORAGE_KEY_CLIENT);
        if (savedClient) {
            const clientObj = JSON.parse(savedClient);
            const inputNombre = document.getElementById('clienteNombre');
            const inputTel = document.getElementById('clienteTelefono');
            if (inputNombre && clientObj.nombre) inputNombre.value = clientObj.nombre;
            if (inputTel && clientObj.telefono) inputTel.value = clientObj.telefono;
        }
    } catch (err) {
        console.warn("Error al cargar carrito desde localStorage:", err);
    }
}

function actualizarVistaCarrito() {
    const carritoItemsList = document.getElementById('carritoItemsList');
    const carritoContainer = document.getElementById('carritoContainer');
    const carritoGranTotal = document.getElementById('carritoGranTotal');
    const whatsappOrderBtn = document.getElementById('whatsappOrderBtn');

    if (!carritoItemsList) return;
    carritoItemsList.innerHTML = '';
    let granTotal = 0;

    if (window.carritoDeCompras.length === 0) {
        if (carritoContainer) carritoContainer.style.display = 'none';
        if (whatsappOrderBtn) whatsappOrderBtn.style.display = 'none';
    } else {
        if (carritoContainer) carritoContainer.style.display = 'block';
        if (whatsappOrderBtn) whatsappOrderBtn.style.display = 'flex';

        window.carritoDeCompras.forEach((item, index) => {
            granTotal += item.precio;
            let li = document.createElement('li');
            li.style.margin = '6px 0';
            li.innerHTML = `${item.descripcion} - <strong>L${item.precio}</strong> <button type="button" class="btn-eliminar-item" data-index="${index}" style="background:#e74c3c; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:11px; cursor:pointer; margin-left:8px;">✕</button>`;
            carritoItemsList.appendChild(li);
        });

        carritoItemsList.querySelectorAll('.btn-eliminar-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.target.dataset.index);
                window.carritoDeCompras.splice(idx, 1);
                actualizarVistaCarrito();
            });
        });
    }

    if (carritoGranTotal) carritoGranTotal.textContent = `L${granTotal}`;

    const clienteNombre = document.getElementById('clienteNombre')?.value.trim() || "";
    const clienteTelefono = document.getElementById('clienteTelefono')?.value.trim() || "";

    let mensajeWhatsApp = "Hola Huella Dulce, quiero hacer el siguiente pedido:\n\n";
    if (clienteNombre) mensajeWhatsApp += ` *Cliente:* ${clienteNombre}\n`;
    if (clienteTelefono) mensajeWhatsApp += ` *Teléfono:* ${clienteTelefono}\n\n`;

    window.carritoDeCompras.forEach((p, i) => {
        mensajeWhatsApp += `${i + 1}. ${p.descripcion} (L${p.precio})\n`;
    });
    mensajeWhatsApp += `\n*Gran Total: L${granTotal}*`;

    if (whatsappOrderBtn) {
        whatsappOrderBtn.href = `https://wa.me/50492222639?text=${encodeURIComponent(mensajeWhatsApp)}`;
    }

    guardarEstadoCarrito();
}

window.actualizarVistaCarrito = actualizarVistaCarrito;
window.guardarEstadoCarrito = guardarEstadoCarrito;

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadoCarrito();
    actualizarVistaCarrito();

    document.getElementById('clienteNombre')?.addEventListener('input', actualizarVistaCarrito);
    document.getElementById('clienteTelefono')?.addEventListener('input', actualizarVistaCarrito);

    const whatsappOrderBtn = document.getElementById('whatsappOrderBtn');
    if (whatsappOrderBtn) {
        whatsappOrderBtn.addEventListener('click', async () => {
            if (window.carritoDeCompras.length > 0) {
                const nombreIngresado = document.getElementById('clienteNombre')?.value.trim() || "Cliente Web";
                const telefonoIngresado = document.getElementById('clienteTelefono')?.value.trim() || "No especificado";
                let granTotal = window.carritoDeCompras.reduce((acc, curr) => acc + curr.precio, 0);
                const resumenPedido = window.carritoDeCompras.map((item, i) => `${i + 1}. ${item.descripcion} (L${item.precio})`).join('\n');

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 4000);

                    await fetch(window.WEBHOOK_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            fecha: new Date().toLocaleString("es-HN"),
                            cliente: nombreIngresado,
                            telefono: telefonoIngresado,
                            pedido: resumenPedido,
                            total: granTotal,
                            notas: "Pedido Web"
                        }),
                        signal: controller.signal,
                        keepalive: true
                    });
                    clearTimeout(timeoutId);
                } catch (err) {
                    console.warn("Notificación de Webhook CRM omitida o fallida silenciosamente:", err);
                }
            }
        });
    }
});
