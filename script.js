document.addEventListener('DOMContentLoaded', () => {
    // MENÚ HAMBURGUESA
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            menuToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
            }
        });
    }

    // EFECTO 3D EN EL PLATO
    const preview3d = document.getElementById('preview3d');
    const plate = document.getElementById('plate');

    if (preview3d && plate) {
        const rotate = (clientX, clientY) => {
            const rect = preview3d.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width - 0.5;
            const y = (clientY - rect.top) / rect.height - 0.5;
            plate.style.transform = `rotateY(${x * 50}deg) rotateX(${15 - y * 45}deg)`;
        };

        preview3d.addEventListener('mousemove', (e) => rotate(e.clientX, e.clientY));
        preview3d.addEventListener('mouseleave', () => {
            plate.style.transform = 'rotateX(15deg) rotateY(0deg)';
        });
        preview3d.addEventListener('touchmove', (e) => {
            if (e.touches[0]) rotate(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        preview3d.addEventListener('touchend', () => {
            plate.style.transform = 'rotateX(15deg) rotateY(0deg)';
        });
    }

    // NOTIFICACIÓN TOAST
    const toast = document.getElementById('toastNotificacion');

    function mostrarNotificacion() {
        if (!toast) return;
        toast.classList.add('mostrar');
        setTimeout(() => toast.classList.remove('mostrar'), 2200);
    }

    // BASE DE DATOS DE PRODUCTOS Y OPCIONES
    const baseButtons = document.querySelectorAll('.base-btn');
    if (baseButtons.length === 0) return;

    const bases = {
        waffle: { label: 'Waffle', img: 'img/waflesnew.jpeg', price: 70 },
        crepa: { label: 'Crepa', img: 'img/crepasnew.jpeg', price: 65 },
        minidona: {
            label: 'Minidonas', img: 'img/minidonas.jpeg',
            variants: [
                { label: 'Bandeja de 6', price: 35 },
                { label: 'Bandeja de 12', price: 60 },
                { label: 'Bandeja de 16', price: 70 },
                { label: 'Bandeja de 24', price: 95 }
            ]
        },
        pandepan: {
            label: 'Pan de Pan', img: 'img/pandepan.jpeg',
            variants: [
                { label: 'Sencillo', price: 50 },
                { label: 'Premium (con almendra y salsa extra)', price: 60 }
            ]
        }
    };

    const previewImg = document.getElementById('previewImg');
    const variantBox = document.getElementById('variantBox');
    const summaryText = document.getElementById('summaryText');
    const totalPriceEl = document.getElementById('totalPrice');
    
    const toppingInputs = document.querySelectorAll('.toppings-selector input');
    const salsaInputs = document.querySelectorAll('.salsa-selector input');
    const salsaVisuals = document.querySelectorAll('.salsa-visual');

    const btnAgregarCarrito = document.getElementById('btnAgregarCarrito');
    const carritoContainer = document.getElementById('carritoContainer');
    const carritoItemsList = document.getElementById('carritoItemsList');
    const carritoGranTotal = document.getElementById('carritoGranTotal');
    const whatsappOrderBtn = document.getElementById('whatsappOrderBtn');

    let currentBaseKey = 'waffle';
    let currentVariantLabel = '';
    let currentVariantPrice = bases.waffle.price;
    let carritoDeCompras = [];

    function buildVariantSelector(baseKey) {
        variantBox.innerHTML = '';
        const base = bases[baseKey];

        if (base.variants) {
            variantBox.classList.remove('hidden');
            const select = document.createElement('select');
            select.id = 'variantSelect';

            base.variants.forEach((variant) => {
                const option = document.createElement('option');
                option.value = variant.price;
                option.dataset.label = variant.label;
                option.textContent = `${variant.label} - L${variant.price}`;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => {
                const selected = e.target.selectedOptions[0];
                currentVariantPrice = Number(selected.value);
                currentVariantLabel = selected.dataset.label;
                updateSummary();
            });

            variantBox.appendChild(select);
            currentVariantPrice = base.variants[0].price;
            currentVariantLabel = base.variants[0].label;
        } else {
            variantBox.classList.add('hidden');
            currentVariantPrice = base.price;
            currentVariantLabel = base.label;
        }
    }

    function selectBase(baseKey) {
        currentBaseKey = baseKey;
        const base = bases[baseKey];

        previewImg.style.opacity = 0;
        setTimeout(() => {
            previewImg.src = base.img;
            previewImg.style.opacity = 1;
        }, 120);

        baseButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.base === baseKey);
        });

        buildVariantSelector(baseKey);
        updateSummary();
    }

    function updateSummary() {
        let toppingsTotal = 0;
        const toppingsLabels = [];

        toppingInputs.forEach((input) => {
            const sticker = document.querySelector(`.sticker-${input.dataset.sticker}`);
            if (sticker) sticker.classList.toggle('show', input.checked);

            if (input.checked) {
                toppingsTotal += Number(input.dataset.price);
                toppingsLabels.push(input.nextElementSibling.textContent.trim());
            }
        });

        const salsaLabels = [];
        salsaInputs.forEach((input) => {
            const isVisualNeeded = input.dataset.visual;
            salsaVisuals.forEach((visual) => {
                if (isVisualNeeded && visual.classList.contains(`salsa-${isVisualNeeded}-visual`)) {
                    visual.classList.toggle('show', input.checked);
                }
            });
            if (input.checked) {
                salsaLabels.push(input.nextElementSibling.textContent.trim());
            }
        });

        const baseLabel = currentVariantLabel && bases[currentBaseKey].variants
            ? `${bases[currentBaseKey].label} (${currentVariantLabel})`
            : bases[currentBaseKey].label;

        const subtotalUnitario = currentVariantPrice + toppingsTotal;

        let summary = baseLabel;
        if (toppingsLabels.length) summary += ` + ${toppingsLabels.join(', ')}`;
        if (salsaLabels.length) {
            summary += ` + ${salsaLabels.join(' y ')}`;
        } else {
            summary += ` (Sin salsa)`;
        }

        summaryText.textContent = summary;
        totalPriceEl.textContent = `L${subtotalUnitario}`;
    }

    if (btnAgregarCarrito) {
        btnAgregarCarrito.addEventListener('click', () => {
            let toppingsLabels = [];
            let toppingsTotal = 0;
            toppingInputs.forEach(input => {
                if (input.checked) {
                    toppingsLabels.push(input.nextElementSibling.textContent.trim());
                    toppingsTotal += Number(input.dataset.price);
                }
            });

            let salsaLabels = [];
            salsaInputs.forEach(input => {
                if (input.checked) salsaLabels.push(input.nextElementSibling.textContent.trim());
            });

            const baseLabel = currentVariantLabel && bases[currentBaseKey].variants
                ? `${bases[currentBaseKey].label} (${currentVariantLabel})`
                : bases[currentBaseKey].label;

            let desc = baseLabel;
            if (toppingsLabels.length) desc += ` + ${toppingsLabels.join(', ')}`;
            if (salsaLabels.length) {
                desc += ` + ${salsaLabels.join(' y ')}`;
            } else {
                desc += ` (Sin salsa)`;
            }

            let unitPrice = currentVariantPrice + toppingsTotal;

            carritoDeCompras.push({
                descripcion: desc,
                precio: unitPrice
            });

            actualizarVistaCarrito();
            mostrarNotificacion();

            toppingInputs.forEach(input => input.checked = false);
            salsaInputs.forEach(input => input.checked = false);
            document.querySelectorAll('.sticker').forEach(s => s.classList.remove('show'));
            salsaVisuals.forEach(v => v.classList.remove('show'));
            updateSummary();
        });
    }

    function actualizarVistaCarrito() {
        carritoItemsList.innerHTML = '';
        let granTotal = 0;

        if (carritoDeCompras.length === 0) {
            carritoContainer.style.display = 'none';
            whatsappOrderBtn.style.display = 'none';
        } else {
            carritoContainer.style.display = 'block';
            whatsappOrderBtn.style.display = 'inline-flex';

            carritoDeCompras.forEach((item, index) => {
                granTotal += item.precio;
                let li = document.createElement('li');
                li.style.margin = '6px 0';
                li.innerHTML = `${item.descripcion} - <strong>L${item.precio}</strong> <button type="button" onclick="window.quitarDelCarrito(${index})" style="background:#e74c3c; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:11px; cursor:pointer; margin-left:8px;" title="Eliminar ítem">✕</button>`;
                carritoItemsList.appendChild(li);
            });
        }

        carritoGranTotal.textContent = `L${granTotal}`;

        let mensajeWhatsApp = "Hola Huella Dulce, quiero hacer el siguiente pedido:\n\n";
        carritoDeCompras.forEach((p, i) => {
            mensajeWhatsApp += `${i + 1}. ${p.descripcion} (L${p.precio})\n`;
        });
        mensajeWhatsApp += `\n*Gran Total: L${granTotal}*`;
        whatsappOrderBtn.href = `https://wa.me/50492222639?text=${encodeURIComponent(mensajeWhatsApp)}`;
    }

    window.quitarDelCarrito = function(index) {
        carritoDeCompras.splice(index, 1);
        actualizarVistaCarrito();
    };

    baseButtons.forEach((btn) => {
        btn.addEventListener('click', () => selectBase(btn.dataset.base));
    });

    toppingInputs.forEach((input) => input.addEventListener('change', updateSummary));
    salsaInputs.forEach((input) => input.addEventListener('change', updateSummary));

    selectBase('waffle');
});