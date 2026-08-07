// MÓDULO DEL PERSONALIZADOR E INTERFAZ DE SIMULACIÓN PLATO
document.addEventListener('DOMContentLoaded', () => {

    // 1. EFECTO 3D DE ROTACIÓN INTERACTIVA EN EL PLATO
    const preview3d = document.getElementById('preview3d');
    const plate = document.getElementById('plate');

    if (preview3d && plate) {
        const rotate = (clientX, clientY) => {
            const rect = preview3d.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width - 0.5;
            const y = (clientY - rect.top) / rect.height - 0.5;
            plate.style.transform = `rotateY(${x * 40}deg) rotateX(${10 - y * 35}deg)`;
        };

        preview3d.addEventListener('mousemove', (e) => rotate(e.clientX, e.clientY));
        preview3d.addEventListener('mouseleave', () => {
            plate.style.transform = 'rotateX(10deg) rotateY(0deg)';
        });
        preview3d.addEventListener('touchmove', (e) => {
            if (e.touches[0]) rotate(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        preview3d.addEventListener('touchend', () => {
            plate.style.transform = 'rotateX(10deg) rotateY(0deg)';
        });
    }

    // 2. MAPA DE EMOJIS Y SALSAS
    const EMOJIS_MAP = {
        fresa: '🍓',
        almendra: '🌰',
        chispitas: '✨',
        oreo: '🍪'
    };

    const COLORES_SALSAS = {
        dulce: 'rgba(198, 125, 52, 0.45)',  // Dulce de Leche
        choco: 'rgba(61, 30, 17, 0.65)',    // Chocolate Hershey's
        leche: 'rgba(243, 229, 171, 0.65)'  // Leche Condensada
    };

    const emojiSlots = [
        document.getElementById('emojiPosTL'),
        document.getElementById('emojiPosBR'),
        document.getElementById('emojiPosTR'),
        document.getElementById('emojiPosBL')
    ];

    const baseButtons = document.querySelectorAll('.base-btn');

    const bases = {
        waffle: { label: 'Waffle', img: '../img/waflesnew.webp', price: 70 },
        crepa: { label: 'Crepa', img: '../img/crepasnew.webp', price: 65 },
        minidona: {
            label: 'Minidonas', img: '../img/minidonas.webp',
            variants: [
                { label: 'Bandeja de 6', price: 35 },
                { label: 'Bandeja de 12', price: 60 },
                { label: 'Bandeja de 16', price: 70 },
                { label: 'Bandeja de 24', price: 95 }
            ]
        },
        pandepan: {
            label: 'Pan de Pan', img: '../img/pandepan.webp',
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
    const salsaOverlay = document.getElementById('salsaOverlay');

    const toppingInputs = document.querySelectorAll('.toppings-selector input');
    const salsaInputs = document.querySelectorAll('.salsa-selector input');

    const btnAgregarCarrito = document.getElementById('btnAgregarCarrito');

    let currentBaseKey = 'waffle';
    let currentVariantLabel = '';
    let currentVariantPrice = bases.waffle.price;

    function buildVariantSelector(baseKey) {
        if (!variantBox) return;
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

        if (previewImg) {
            previewImg.style.opacity = 0;
            setTimeout(() => {
                previewImg.src = base.img;
                previewImg.style.opacity = 1;
            }, 120);
        }

        baseButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.base === baseKey);
        });

        buildVariantSelector(baseKey);
        updateSummary();
    }

    function updateSummary() {
        let toppingsTotal = 0;
        const toppingsLabels = [];
        const selectedEmojis = [];

        // 1. RECOLECTAR TOPPINGS
        toppingInputs.forEach((input) => {
            if (input.checked) {
                toppingsTotal += Number(input.dataset.price || 0);
                const labelText = input.nextElementSibling ? input.nextElementSibling.childNodes[0].textContent.trim() : '';
                toppingsLabels.push(labelText);

                const key = input.dataset.sticker;
                if (EMOJIS_MAP[key]) {
                    selectedEmojis.push(EMOJIS_MAP[key]);
                }
            }
        });

        // ASIGNAR EMOJIS A LAS 4 POSICIONES DEL PLATO
        emojiSlots.forEach((slot, index) => {
            if (slot) {
                if (selectedEmojis[index]) {
                    slot.textContent = selectedEmojis[index];
                    slot.classList.add('active');
                } else {
                    slot.classList.remove('active');
                }
            }
        });

        // 2. RECOLECTAR SALSAS Y MOSTRAR COLOR EN EL PLATO
        const salsaLabels = [];
        let colorSalsaFinal = '';

        salsaInputs.forEach((input) => {
            if (input.checked) {
                const labelText = input.nextElementSibling ? input.nextElementSibling.textContent.trim() : '';
                salsaLabels.push(labelText);
                const visualKey = input.dataset.visual || input.value;
                if (COLORES_SALSAS[visualKey]) {
                    colorSalsaFinal = COLORES_SALSAS[visualKey];
                }
            }
        });

        if (salsaOverlay) {
            if (colorSalsaFinal) {
                salsaOverlay.style.backgroundColor = colorSalsaFinal;
                salsaOverlay.classList.add('active');
            } else {
                salsaOverlay.classList.remove('active');
            }
        }

        // 3. ACTUALIZAR RESUMEN DE TEXTO
        const baseLabel = (currentVariantLabel && bases[currentBaseKey].variants)
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

        if (summaryText) summaryText.textContent = summary;
        if (totalPriceEl) totalPriceEl.textContent = `L${subtotalUnitario}`;
    }

    if (btnAgregarCarrito) {
        btnAgregarCarrito.addEventListener('click', () => {
            let toppingsLabels = [];
            let toppingsTotal = 0;
            toppingInputs.forEach(input => {
                if (input.checked) {
                    const labelText = input.nextElementSibling ? input.nextElementSibling.childNodes[0].textContent.trim() : '';
                    toppingsLabels.push(labelText);
                    toppingsTotal += Number(input.dataset.price || 0);
                }
            });

            let salsaLabels = [];
            salsaInputs.forEach(input => {
                if (input.checked) {
                    const labelText = input.nextElementSibling ? input.nextElementSibling.textContent.trim() : '';
                    salsaLabels.push(labelText);
                }
            });

            const baseLabel = (currentVariantLabel && bases[currentBaseKey].variants)
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

            if (!window.carritoDeCompras) window.carritoDeCompras = [];
            window.carritoDeCompras.push({ descripcion: desc, precio: unitPrice });

            if (typeof window.actualizarVistaCarrito === 'function') {
                window.actualizarVistaCarrito();
            }

            const toast = document.getElementById('toastNotificacion');
            if (toast) {
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 2000);
            }

            toppingInputs.forEach(input => input.checked = false);
            salsaInputs.forEach(input => input.checked = false);
            updateSummary();
        });
    }

    baseButtons.forEach((btn) => btn.addEventListener('click', () => selectBase(btn.dataset.base)));
    toppingInputs.forEach((input) => input.addEventListener('change', updateSummary));
    salsaInputs.forEach((input) => input.addEventListener('change', updateSummary));

    if (baseButtons.length > 0) selectBase('waffle');
});
