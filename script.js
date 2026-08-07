document.addEventListener('DOMContentLoaded', () => {

    // 1. MENÚ HAMBURGUESA
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

    // 2. MOTOR VISTA PREVIA 3D REAL CON THREE.JS
    const container3d = document.getElementById('canvas3dContainer');

    let scene3d, camera3d, renderer3d, controls3d;
    let plateMesh, baseMeshGroup, sauceMesh, toppingsMeshGroup;
    let textureLoader = (typeof THREE !== 'undefined') ? new THREE.TextureLoader() : null;
    const loadedTextures = {};

    function initThreePreview() {
        if (!container3d || typeof THREE === 'undefined') return;

        const width = container3d.clientWidth || 380;
        const height = container3d.clientHeight || 380;

        // Escena
        scene3d = new THREE.Scene();

        // Cámara
        camera3d = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        camera3d.position.set(0, 3.2, 4.2);

        // Renderer
        renderer3d = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer3d.setSize(width, height);
        renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer3d.shadowMap.enabled = true;
        renderer3d.shadowMap.type = THREE.PCFSoftShadowMap;
        if (THREE.ACESFilmicToneMapping) {
            renderer3d.toneMapping = THREE.ACESFilmicToneMapping;
            renderer3d.toneMappingExposure = 1.1;
        }

        container3d.innerHTML = '';
        container3d.appendChild(renderer3d.domElement);

        // OrbitControls
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls3d = new THREE.OrbitControls(camera3d, renderer3d.domElement);
            controls3d.enableDamping = true;
            controls3d.dampingFactor = 0.06;
            controls3d.maxPolarAngle = Math.PI / 2 - 0.05;
            controls3d.minPolarAngle = Math.PI / 6;
            controls3d.minDistance = 2.8;
            controls3d.maxDistance = 6.0;
            controls3d.enablePan = false;
            controls3d.target.set(0, 0.3, 0);
            controls3d.update();
        }

        // Iluminación
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene3d.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xfff8f0, 1.2);
        mainLight.position.set(3, 7, 4);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.bias = -0.001;
        scene3d.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xe6f7fa, 0.5);
        fillLight.position.set(-4, 4, -3);
        scene3d.add(fillLight);

        // Plato Cerámico 3D
        createPlate3D();

        // Grupos de Mallas
        baseMeshGroup = new THREE.Group();
        scene3d.add(baseMeshGroup);

        toppingsMeshGroup = new THREE.Group();
        scene3d.add(toppingsMeshGroup);

        // Pre-cargar texturas
        if (textureLoader) {
            ['waffle', 'crepa', 'minidona', 'pandepan'].forEach(key => {
                if (bases[key] && bases[key].img) {
                    loadedTextures[key] = textureLoader.load(bases[key].img, () => {
                        if (currentBaseKey === key) update3DProduct(key);
                    });
                }
            });
        }

        // Loop de Renderizado
        function animate() {
            requestAnimationFrame(animate);
            if (controls3d) controls3d.update();
            renderer3d.render(scene3d, camera3d);
        }
        animate();

        // Manejo Responsivo
        window.addEventListener('resize', () => {
            if (!container3d || !camera3d || !renderer3d) return;
            const w = container3d.clientWidth;
            const h = container3d.clientHeight;
            camera3d.aspect = w / h;
            camera3d.updateProjectionMatrix();
            renderer3d.setSize(w, h);
        });

        // Vista Inicial
        update3DProduct(currentBaseKey || 'waffle');
    }

    function createPlate3D() {
        const points = [];
        points.push(new THREE.Vector2(0, 0));
        points.push(new THREE.Vector2(1.2, 0.02));
        points.push(new THREE.Vector2(1.8, 0.15));
        points.push(new THREE.Vector2(2.1, 0.35));
        points.push(new THREE.Vector2(2.05, 0.38));
        points.push(new THREE.Vector2(1.75, 0.18));
        points.push(new THREE.Vector2(1.15, 0.05));
        points.push(new THREE.Vector2(0, 0.05));

        const plateGeo = new THREE.LatheGeometry(points, 48);
        const plateMat = new THREE.MeshPhysicalMaterial({
            color: 0xfdfdfd,
            roughness: 0.15,
            metalness: 0.05,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1
        });

        plateMesh = new THREE.Mesh(plateGeo, plateMat);
        plateMesh.receiveShadow = true;
        scene3d.add(plateMesh);
    }

    function update3DProduct(baseKey) {
        if (!baseMeshGroup) return;

        while (baseMeshGroup.children.length > 0) {
            const obj = baseMeshGroup.children[0];
            if (obj.geometry) obj.geometry.dispose();
            baseMeshGroup.remove(obj);
        }

        const tex = loadedTextures[baseKey];

        if (baseKey === 'waffle') {
            const waffleGeo = new THREE.CylinderGeometry(1.35, 1.35, 0.22, 36);
            const topMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
            const sideMat = new THREE.MeshStandardMaterial({ color: 0xdca868, roughness: 0.6 });
            const mats = [sideMat, topMat, sideMat];
            const waffleMesh = new THREE.Mesh(waffleGeo, mats);
            waffleMesh.position.y = 0.16;
            waffleMesh.castShadow = true;
            waffleMesh.receiveShadow = true;
            baseMeshGroup.add(waffleMesh);

        } else if (baseKey === 'crepa') {
            const crepaGeo = new THREE.CylinderGeometry(1.45, 1.45, 0.1, 36);
            const topMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
            const sideMat = new THREE.MeshStandardMaterial({ color: 0xe8c388, roughness: 0.6 });
            const mats = [sideMat, topMat, sideMat];
            const crepaMesh = new THREE.Mesh(crepaGeo, mats);
            crepaMesh.position.y = 0.1;
            crepaMesh.castShadow = true;
            crepaMesh.receiveShadow = true;
            baseMeshGroup.add(crepaMesh);

        } else if (baseKey === 'minidona') {
            const donutGeo = new THREE.TorusGeometry(0.35, 0.16, 16, 32);
            const donutMat = new THREE.MeshStandardMaterial({ color: 0xe5a363, roughness: 0.5 });
            const glazeMat = new THREE.MeshPhysicalMaterial({ color: 0x5c3a21, roughness: 0.2, clearcoat: 0.6 });

            const positions = [
                [-0.55, 0.15, -0.55],
                [0.55, 0.15, -0.55],
                [-0.55, 0.15, 0.55],
                [0.55, 0.15, 0.55]
            ];

            positions.forEach((pos) => {
                const donutGroup = new THREE.Group();
                const dMesh = new THREE.Mesh(donutGeo, donutMat);
                dMesh.rotation.x = Math.PI / 2;
                dMesh.castShadow = true;
                donutGroup.add(dMesh);

                const glazeGeo = new THREE.TorusGeometry(0.36, 0.09, 12, 32);
                const gMesh = new THREE.Mesh(glazeGeo, glazeMat);
                gMesh.rotation.x = Math.PI / 2;
                gMesh.position.z = 0.06;
                donutGroup.add(gMesh);

                donutGroup.position.set(pos[0], pos[1], pos[2]);
                baseMeshGroup.add(donutGroup);
            });

        } else if (baseKey === 'pandepan') {
            const panGeo = new THREE.BoxGeometry(2.1, 0.35, 1.5);
            const topMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
            const sideMat = new THREE.MeshStandardMaterial({ color: 0xc89658, roughness: 0.6 });
            const mats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
            const panMesh = new THREE.Mesh(panGeo, mats);
            panMesh.position.y = 0.2;
            panMesh.castShadow = true;
            panMesh.receiveShadow = true;
            baseMeshGroup.add(panMesh);
        }

        createSauce3D();
        updateToppings3D();
    }

    function createSauce3D() {
        if (!scene3d) return;

        if (sauceMesh) {
            scene3d.remove(sauceMesh);
            if (sauceMesh.geometry) sauceMesh.geometry.dispose();
            sauceMesh = null;
        }

        const selectedSalsas = [];
        salsaInputs.forEach(input => {
            if (input.checked) {
                selectedSalsas.push(input.dataset.visual || input.value);
            }
        });

        if (selectedSalsas.length === 0) return;

        const colorMap = {
            dulce: 0xc67d34,
            choco: 0x2b1408,
            leche: 0xf3e5ab
        };

        const mainColor = colorMap[selectedSalsas[0]] || 0xc67d34;

        const sauceGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.03, 32);
        const sauceMat = new THREE.MeshPhysicalMaterial({
            color: mainColor,
            roughness: 0.1,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            transparent: true,
            opacity: 0.88
        });

        sauceMesh = new THREE.Mesh(sauceGeo, sauceMat);
        sauceMesh.position.y = (currentBaseKey === 'minidona') ? 0.32 : (currentBaseKey === 'pandepan' ? 0.38 : 0.27);
        scene3d.add(sauceMesh);
    }

    function updateToppings3D() {
        if (!toppingsMeshGroup) return;

        while (toppingsMeshGroup.children.length > 0) {
            const child = toppingsMeshGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            toppingsMeshGroup.remove(child);
        }

        const activeToppings = [];
        toppingInputs.forEach(input => {
            if (input.checked) activeToppings.push(input.dataset.sticker);
        });

        const baseY = (currentBaseKey === 'minidona') ? 0.35 : (currentBaseKey === 'pandepan' ? 0.40 : 0.30);

        activeToppings.forEach(sticker => {
            if (sticker === 'fresa') {
                const fresaMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.3 });
                const pos = [[-0.6, baseY + 0.1, -0.4], [0.6, baseY + 0.1, 0.4], [0, baseY + 0.12, 0]];
                pos.forEach(p => {
                    const fresaGeo = new THREE.ConeGeometry(0.18, 0.3, 12);
                    const mesh = new THREE.Mesh(fresaGeo, fresaMat);
                    mesh.position.set(p[0], p[1], p[2]);
                    mesh.rotation.z = 0.4;
                    mesh.castShadow = true;
                    toppingsMeshGroup.add(mesh);
                });
            } else if (sticker === 'almendra') {
                const almendraMat = new THREE.MeshStandardMaterial({ color: 0xd4ac0d, roughness: 0.5 });
                const pos = [[-0.4, baseY + 0.05, 0.5], [0.5, baseY + 0.05, -0.3], [-0.2, baseY + 0.05, -0.6]];
                pos.forEach(p => {
                    const almGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12);
                    const mesh = new THREE.Mesh(almGeo, almendraMat);
                    mesh.scale.set(1.5, 1, 0.7);
                    mesh.position.set(p[0], p[1], p[2]);
                    mesh.rotation.y = Math.random() * Math.PI;
                    mesh.castShadow = true;
                    toppingsMeshGroup.add(mesh);
                });
            } else if (sticker === 'chispitas') {
                const colors = [0xff5733, 0x33ff57, 0x3357ff, 0xf39c12, 0x9b59b6];
                for (let i = 0; i < 20; i++) {
                    const color = colors[i % colors.length];
                    const sprinkleMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3 });
                    const sprinkleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
                    const mesh = new THREE.Mesh(sprinkleGeo, sprinkleMat);
                    const rx = (Math.random() - 0.5) * 1.8;
                    const rz = (Math.random() - 0.5) * 1.8;
                    mesh.position.set(rx, baseY + 0.04, rz);
                    mesh.rotation.set(Math.PI / 2, Math.random() * Math.PI, Math.random() * Math.PI);
                    mesh.castShadow = true;
                    toppingsMeshGroup.add(mesh);
                }
            } else if (sticker === 'oreo') {
                const oreoMat = new THREE.MeshStandardMaterial({ color: 0x1c1b1a, roughness: 0.6 });
                const pos = [[-0.8, baseY + 0.1, 0.2], [0.7, baseY + 0.1, -0.5]];
                pos.forEach(p => {
                    const oreoGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 24);
                    const mesh = new THREE.Mesh(oreoGeo, oreoMat);
                    mesh.position.set(p[0], p[1], p[2]);
                    mesh.rotation.z = 0.2;
                    mesh.castShadow = true;
                    toppingsMeshGroup.add(mesh);
                });
            }
        });
    }

    // 3. MAPA DE EMOJIS Y SALSAS
    const EMOJIS_MAP = {
        fresa: '🍓',
        almendra: '🌰',
        chispitas: '✨',
        oreo: '🍪'
    };

    const COLORES_SALSAS = {
        dulce: 'rgba(198, 125, 52, 0.45)',
        choco: 'rgba(61, 30, 17, 0.65)',
        leche: 'rgba(243, 229, 171, 0.65)'
    };

    const emojiSlots = [
        document.getElementById('emojiPosTL'),
        document.getElementById('emojiPosBR'),
        document.getElementById('emojiPosTR'),
        document.getElementById('emojiPosBL')
    ];

    // 4. DATOS DE PRODUCTOS
    const baseButtons = document.querySelectorAll('.base-btn');

    const bases = {
        waffle: { label: 'Waffle', img: 'img/waflesnew.webp', price: 70 },
        crepa: { label: 'Crepa', img: 'img/crepasnew.webp', price: 65 },
        minidona: {
            label: 'Minidonas', img: 'img/minidonas.webp',
            variants: [
                { label: 'Bandeja de 6', price: 35 },
                { label: 'Bandeja de 12', price: 60 },
                { label: 'Bandeja de 16', price: 70 },
                { label: 'Bandeja de 24', price: 95 }
            ]
        },
        pandepan: {
            label: 'Pan de Pan', img: 'img/pandepan.webp',
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
    const carritoContainer = document.getElementById('carritoContainer');
    const carritoItemsList = document.getElementById('carritoItemsList');
    const carritoGranTotal = document.getElementById('carritoGranTotal');
    const whatsappOrderBtn = document.getElementById('whatsappOrderBtn');

    let currentBaseKey = 'waffle';
    let currentVariantLabel = '';
    let currentVariantPrice = bases.waffle.price;
    let carritoDeCompras = [];

    const WEBHOOK_URL = "https://hook.eu1.make.com/9jdsvkq580xfwq89j4e1iqsku3e2c8x1";

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
        update3DProduct(baseKey);
        updateSummary();
    }

    function updateSummary() {
        let toppingsTotal = 0;
        const toppingsLabels = [];
        const selectedEmojis = [];

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

        // Actualizar mallas 3D de salsas y toppings
        createSauce3D();
        updateToppings3D();

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

    // 5. CARRITO Y WHATSAPP
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

            carritoDeCompras.push({ descripcion: desc, precio: unitPrice });

            actualizarVistaCarrito();
            
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

    const STORAGE_KEY_CART = 'huellaDulce_carrito';
    const STORAGE_KEY_CLIENT = 'huellaDulce_cliente';

    function guardarEstadoCarrito() {
        try {
            localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(carritoDeCompras));
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
                carritoDeCompras = JSON.parse(savedCart) || [];
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
        if (!carritoItemsList) return;
        carritoItemsList.innerHTML = '';
        let granTotal = 0;

        if (carritoDeCompras.length === 0) {
            if (carritoContainer) carritoContainer.style.display = 'none';
            if (whatsappOrderBtn) whatsappOrderBtn.style.display = 'none';
        } else {
            if (carritoContainer) carritoContainer.style.display = 'block';
            if (whatsappOrderBtn) whatsappOrderBtn.style.display = 'flex';

            carritoDeCompras.forEach((item, index) => {
                granTotal += item.precio;
                let li = document.createElement('li');
                li.style.margin = '6px 0';
                li.innerHTML = `${item.descripcion} - <strong>L${item.precio}</strong> <button type="button" class="btn-eliminar-item" data-index="${index}" style="background:#e74c3c; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:11px; cursor:pointer; margin-left:8px;">✕</button>`;
                carritoItemsList.appendChild(li);
            });

            carritoItemsList.querySelectorAll('.btn-eliminar-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = Number(e.target.dataset.index);
                    carritoDeCompras.splice(idx, 1);
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

        carritoDeCompras.forEach((p, i) => {
            mensajeWhatsApp += `${i + 1}. ${p.descripcion} (L${p.precio})\n`;
        });
        mensajeWhatsApp += `\n*Gran Total: L${granTotal}*`;
        
        if (whatsappOrderBtn) {
            whatsappOrderBtn.href = `https://wa.me/50492222639?text=${encodeURIComponent(mensajeWhatsApp)}`;
        }

        guardarEstadoCarrito();
    }

    document.getElementById('clienteNombre')?.addEventListener('input', actualizarVistaCarrito);
    document.getElementById('clienteTelefono')?.addEventListener('input', actualizarVistaCarrito);

    if (whatsappOrderBtn) {
        whatsappOrderBtn.addEventListener('click', () => {
            if (carritoDeCompras.length > 0) {
                const nombreIngresado = document.getElementById('clienteNombre')?.value.trim() || "Cliente Web";
                const telefonoIngresado = document.getElementById('clienteTelefono')?.value.trim() || "No especificado";
                let granTotal = carritoDeCompras.reduce((acc, curr) => acc + curr.precio, 0);

                const resumenPedido = carritoDeCompras.map((item, i) => `${i + 1}. ${item.descripcion} (L${item.precio})`).join('\n');
                
                fetch(WEBHOOK_URL, {
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
                    keepalive: true
                }).catch(err => console.error("Error CRM:", err));
            }
        });
    }

    baseButtons.forEach((btn) => btn.addEventListener('click', () => selectBase(btn.dataset.base)));
    toppingInputs.forEach((input) => input.addEventListener('change', updateSummary));
    salsaInputs.forEach((input) => input.addEventListener('change', updateSummary));

    // Cargar estado inicial del carrito
    cargarEstadoCarrito();
    if (carritoItemsList) actualizarVistaCarrito();

    if (container3d) initThreePreview();
    if (baseButtons.length > 0) selectBase('waffle');
});