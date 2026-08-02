// =========================================================
// Huella Dulce - Arma tu Antojo
// Efecto 3D mejorado + calculadora de precio en vivo
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // ---------- MENÚ HAMBURGUESA MÓVIL (CORREGIDO) ----------
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita conflictos con otros clics
            navMenu.classList.toggle('active');
            
            // Cambia el icono entre ☰ y ✕
            if (navMenu.classList.contains('active')) {
                menuToggle.textContent = '✕';
            } else {
                menuToggle.textContent = '☰';
            }
        });

        // Ocultar el menú automáticamente al hacer clic en cualquier enlace de la lista
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });

        // Ocultar el menú si hacen clic fuera de él en la pantalla
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
            }
        });
    }
   

    // ---------- EFECTO 3D DEL PLATO (Más pronunciado) ----------
    const preview3d = document.getElementById('preview3d');
    const plate = document.getElementById('plate');

    if (preview3d && plate) {
        const rotate = (clientX, clientY) => {
            const rect = preview3d.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width - 0.5;
            const y = (clientY - rect.top) / rect.height - 0.5;
            // Se aumentó la intensidad de los grados para que se vea mucho más 3D
            plate.style.transform = `rotateY(${x * 50}deg) rotateX(${15 - y * 45}deg)`;
        };

        preview3d.addEventListener('mousemove', (e) => rotate(e.clientX, e.clientY));
        preview3d.addEventListener('mouseleave', () => {
            plate.style.transform = 'rotateX(15deg) rotateY(0deg)';
        });
        preview3d.addEventListener('touchmove', (e) => {
            if (e.touches[0]) {
                rotate(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        preview3d.addEventListener('touchend', () => {
            plate.style.transform = 'rotateX(15deg) rotateY(0deg)';
        });
    }

    // ---------- ARMADOR / CALCULADORA ----------
    const baseButtons = document.querySelectorAll('.base-btn');
    if (baseButtons.length === 0) return;

    const bases = {
        waffle: {
            label: 'Waffle', img: 'img/waflesnew.jpeg', price: 70
        },
        crepa: {
            label: 'Crepa', img: 'img/crepasnew.jpeg', price: 65
        },
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
    const whatsappBtn = document.getElementById('whatsappOrderBtn');
    const toppingInputs = document.querySelectorAll('.toppings-selector input');
    const salsaInputs = document.querySelectorAll('.salsa-selector input');
    const salsaVisuals = document.querySelectorAll('.salsa-drip');

    let currentBaseKey = 'waffle';
    let currentVariantLabel = '';
    let currentVariantPrice = bases.waffle.price;

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

        let salsaLabel = '';
        salsaInputs.forEach((input) => {
            const isVisualNeeded = input.dataset.visual;
            salsaVisuals.forEach((visual) => {
                if (isVisualNeeded && visual.classList.contains(`salsa-${isVisualNeeded}-visual`)) {
                    visual.classList.toggle('show', input.checked);
                }
            });
            if (input.checked) {
                salsaLabel = input.nextElementSibling.textContent.trim();
            }
        });

        const baseLabel = currentVariantLabel && bases[currentBaseKey].variants
            ? `${bases[currentBaseKey].label} (${currentVariantLabel})`
            : bases[currentBaseKey].label;

        const total = currentVariantPrice + toppingsTotal;

        let summary = baseLabel;
        if (toppingsLabels.length) summary += ` + ${toppingsLabels.join(', ')}`;
        if (salsaLabel && salsaLabel.toLowerCase() !== 'sin salsa') {
            summary += ` + ${salsaLabel}`;
        } else {
            summary += ` (Sin salsa)`;
        }

        summaryText.textContent = summary;
        totalPriceEl.textContent = `L${total}`;

        if (whatsappBtn) {
            const message = `Hola, quiero pedir: ${summary}. Total aproximado: L${total}`;
            whatsappBtn.href = `https://wa.me/50492222639?text=${encodeURIComponent(message)}`;
        }
    }

    baseButtons.forEach((btn) => {
        btn.addEventListener('click', () => selectBase(btn.dataset.base));
    });

    toppingInputs.forEach((input) => input.addEventListener('change', updateSummary));
    salsaInputs.forEach((input) => input.addEventListener('change', updateSummary));

    // Estado inicial
    selectBase('waffle');
});