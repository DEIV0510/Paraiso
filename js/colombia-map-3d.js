/* =====================================================================
   PARAISOS — colombia-map-3d.js

   Mapa 3D de Colombia con los 33 departamentos (GeoJSON local; si la red
   falla, un contorno embebido).

   - Océano, cielo en degradado, arcos entre destinos y barco: todo quieto
     (sin olas, giro solo ni luces que corren). Solo se dibuja cuando algo
     cambia: arrastre, zoom, vuelo a un destino o cambio de tamaño.
   - Pines con etiqueta HTML. Las etiquetas que se pisan o se salen del lienzo
     se ocultan por prioridad: primero la elegida y las que tienen tarifa.
   - Escritorio: arrastrar gira; Ctrl/Cmd + rueda acerca. La rueda sola sigue
     bajando la página (se muestra un aviso breve).
   - Táctil: un dedo en horizontal gira, en vertical baja la página; dos dedos
     acercan.
   - Los chips, la lista de tarifas y el panel viven en main.js
     (PARAISOS_MAP) y funcionan sin este archivo. Aquí se engancha el 3D:
     al elegir un destino el mapa vuela al pin y, en escritorio, abre una
     ficha corta sobre él.
   - El bucle de render se detiene fuera de pantalla y con la pestaña oculta.
   ===================================================================== */
function initColombiaMap() {
  'use strict';
  const ui = window.PARAISOS_MAP;
  if (!window.THREE || !window.PARAISOS_DATA || !ui) {
    console.warn('[mapa] Three.js o los datos no cargaron');
    if (ui) ui.fallback();
    return;
  }

  const host = document.getElementById('canvas3d');
  const overlay = document.getElementById('mapLabels');
  const popup = document.getElementById('mapPopup');
  if (!host || !overlay) return;
  const hintEl = host.querySelector('.map-3d__hint');
  const compassNeedle = host.querySelector('.map-3d__compass-needle');

  const D = window.PARAISOS_DATA;
  const destinos = Array.isArray(D.destinos) ? D.destinos : [];

  /* ---------------------------------------------------------------------
     CONTEXTO: dispositivo, movimiento reducido, textos
     --------------------------------------------------------------------- */
  const mq = (q) => (window.matchMedia ? window.matchMedia(q).matches : false);
  const lowPower = mq('(pointer: coarse)') || mq('(max-width: 768px)');
  // Táctil o pantalla estrecha: sin ficha sobre el mapa, solo el panel.
  const isTouchUI = () => mq('(hover: none)') || mq('(pointer: coarse)') || mq('(max-width: 768px)');
  const reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduced = !!(reduceMQ && reduceMQ.matches);
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
  const zoomKey = isMac ? 'Cmd' : 'Ctrl';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const shortName = (d) => String(d.nombre || '').split(' · ')[0];
  const WA_ICON = '<svg width="18" height="18" aria-hidden="true" focusable="false"><use href="#ico-whatsapp"/></svg>';

  // Un dedo en vertical = scroll de la página; en horizontal lo maneja el mapa.
  host.style.touchAction = 'pan-y';

  /* ---------------------------------------------------------------------
     AVISO DE CARGA mientras se arma el país (está en el HTML desde el
     principio; si no estuviera, se crea)
     --------------------------------------------------------------------- */
  let loadingEl = host.querySelector('.map-3d__loading');
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.className = 'map-3d__loading';
    loadingEl.setAttribute('aria-hidden', 'true');
    loadingEl.textContent = 'Cargando el mapa…';
    host.appendChild(loadingEl);
  }

  /* ---------------------------------------------------------------------
     ESCENA / CÁMARA / RENDERER
     Tamaño del lienzo en caché: se actualiza solo al cambiar de tamaño, así
     el bucle no lee el layout en cada cuadro.
     --------------------------------------------------------------------- */
  let cw = host.clientWidth || 1;
  let ch = host.clientHeight || 1;

  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0xBBDEFB, 24, 75);

  const camera = new THREE.PerspectiveCamera(36, cw / ch, 0.1, 200);
  camera.position.set(0, 14, 18);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: lowPower ? 'low-power' : 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.setSize(cw, ch);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.insertBefore(renderer.domElement, host.firstChild);

  /* ---------------------------------------------------------------------
     ILUMINACIÓN 3 PUNTOS
     --------------------------------------------------------------------- */
  scene.add(new THREE.AmbientLight(0xE3F2FD, 0.55));
  const key = new THREE.DirectionalLight(0xfff5e1, 1.35);
  key.position.set(9, 16, 7);
  key.castShadow = true;
  const shadowSize = lowPower ? 1024 : 2048;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  key.shadow.camera.left = -16; key.shadow.camera.right = 16;
  key.shadow.camera.top = 16;   key.shadow.camera.bottom = -16;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xFFCC88, 0.45);
  fill.position.set(-6, 6, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x66BBFF, 0.55);
  rim.position.set(0, 4, -10);
  scene.add(rim);

  /* ---------------------------------------------------------------------
     PROYECCIÓN lat/lng → mundo (plano XZ), centrada en Colombia
     --------------------------------------------------------------------- */
  const CENTER_LAT = 4.5, CENTER_LNG = -73.5;
  const SCALE = 1.05;
  function project(lat, lng) {
    return { x: (lng - CENTER_LNG) * SCALE, z: -(lat - CENTER_LAT) * SCALE };
  }

  /* ---------------------------------------------------------------------
     CIELO (esfera invertida con degradado)
     --------------------------------------------------------------------- */
  (function skybox() {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0,    '#E3F2FD');
    g.addColorStop(0.5,  '#BBDEFB');
    g.addColorStop(0.85, '#FFE3B8');
    g.addColorStop(1,    '#FFFFFF');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(50, 32, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })
    ));
  })();

  /* ---------------------------------------------------------------------
     OCÉANO con olas (menos vértices en celular)
     --------------------------------------------------------------------- */
  const oceanSeg = lowPower ? 32 : 56;
  const oceanGeo = new THREE.PlaneGeometry(80, 80, oceanSeg, oceanSeg);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x1565C0,
    metalness: 0.3, roughness: 0.55,
    transparent: true, opacity: 0.82
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.3;
  ocean.receiveShadow = true;
  scene.add(ocean);
  const oPos = oceanGeo.attributes.position;
  const oArr = oPos.array;
  const oCount = oPos.count;

  const grid = new THREE.GridHelper(80, 80, 0x4A90D9, 0x4A90D9);
  grid.material.transparent = true;
  grid.material.opacity = 0.08;
  grid.position.y = -0.28;
  scene.add(grid);

  /* ---------------------------------------------------------------------
     ESPUMA SOBRE EL OCÉANO
     --------------------------------------------------------------------- */
  const foamCount = lowPower ? 160 : 300;
  const foamGeo = new THREE.BufferGeometry();
  const foamPos = new Float32Array(foamCount * 3);
  const foamPhase = new Float32Array(foamCount);
  for (let i = 0; i < foamCount; i++) {
    foamPos[i * 3]     = (Math.random() - 0.5) * 40;
    foamPos[i * 3 + 1] = -0.15 + Math.random() * 0.1;
    foamPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    foamPhase[i]       = Math.random() * Math.PI * 2;
  }
  foamGeo.setAttribute('position', new THREE.BufferAttribute(foamPos, 3));
  scene.add(new THREE.Points(foamGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.12, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending
  })));

  /* ---------------------------------------------------------------------
     PAÍS (compartido entre GeoJSON real y contorno embebido)
     --------------------------------------------------------------------- */
  const COUNTRY_DEPTH = 1.0;
  const COUNTRY_TOP_Y = COUNTRY_DEPTH + 0.18;   // por encima del bisel
  const countryGroup = new THREE.Group();
  scene.add(countryGroup);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xEDEDED, roughness: 0.85, metalness: 0.04,
    emissive: 0x1a1a1a, emissiveIntensity: 0.06
  });
  const borderMat = new THREE.LineBasicMaterial({ color: 0x7B8794, transparent: true, opacity: 0.85 });
  const outlineMat = new THREE.LineBasicMaterial({ color: 0x4A5568, transparent: true, opacity: 0.95 });

  const extrudeSettings = {
    depth: COUNTRY_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.12,
    bevelSegments: lowPower ? 2 : 3,
    curveSegments: 10,
    steps: 1
  };
  // Islas (San Andrés, Providencia, Gorgona…): con la altura del continente
  // y el bisel de 0,12 se veían como torres. Van bajas y casi sin bisel.
  const ISLAND_MAX_DEG = 0.3;          // lado mayor del polígono, en grados (Quindío mide 0,57)
  const ISLAND_DEPTH = 0.32;
  const ISLAND_TOP_Y = ISLAND_DEPTH + 0.03;
  const islandSettings = {
    depth: ISLAND_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 1,
    curveSegments: 6,
    steps: 1
  };
  const islands = [];                  // cajas lng/lat de las islas, para bajar sus pines
  // Alto de la superficie en un punto (para pines y arcos)
  const surfaceY = (lat, lng) => (islands.some(b =>
    lng >= b.w - 0.15 && lng <= b.e + 0.15 && lat >= b.s - 0.15 && lat <= b.n + 0.15) ? ISLAND_TOP_Y : COUNTRY_TOP_Y);

  // Quita vértices más cercanos que `tol` grados (≈1 px en pantalla): el
  // GeoJSON trae ~24.000 puntos y extruirlos todos bloquea el celular.
  const SIMPLIFY_TOL = 0.012;
  function simplifyRing(ring) {
    if (ring.length < 8) return ring;
    const out = [ring[0]];
    for (let i = 1; i < ring.length - 1; i++) {
      const a = out[out.length - 1], b = ring[i];
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) > SIMPLIFY_TOL) out.push(b);
    }
    out.push(ring[ring.length - 1]);
    return out.length >= 4 ? out : ring;
  }

  // Extruye un polígono (departamento) y deja su geometría y sus bordes en
  // `acc`; al final todo se une en una sola malla y una sola línea (dos
  // llamadas de dibujo en vez de ~70 por cuadro).
  function addPolygon(rings, acc) {
    const raw = rings[0] || [];
    if (raw.length < 4) return false;
    let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
    raw.forEach(([lng, lat]) => { w = Math.min(w, lng); e = Math.max(e, lng); s = Math.min(s, lat); n = Math.max(n, lat); });
    const isIsland = Math.max(e - w, n - s) < ISLAND_MAX_DEG;
    // Las islas conservan sus vértices (son pocos y simplificarlas las deforma)
    const outer = isIsland ? raw : simplifyRing(raw);
    if (outer.length < 4) return false;
    if (isIsland) islands.push({ w, e, s, n });
    const topY = isIsland ? ISLAND_TOP_Y : COUNTRY_TOP_Y;

    const shape = new THREE.Shape();
    outer.forEach(([lng, lat], i) => {
      const { x, z } = project(lat, lng);
      if (i === 0) shape.moveTo(x, -z); else shape.lineTo(x, -z);
    });
    const holes = [];
    for (let i = 1; i < rings.length; i++) {
      const ring = simplifyRing(rings[i]);
      if (ring.length < 4) continue;
      const hole = new THREE.Path();
      ring.forEach(([lng, lat], j) => {
        const { x, z } = project(lat, lng);
        if (j === 0) hole.moveTo(x, -z); else hole.lineTo(x, -z);
      });
      shape.holes.push(hole);
      holes.push(ring);
    }

    let geo = new THREE.ExtrudeGeometry(shape, isIsland ? islandSettings : extrudeSettings);
    if (geo.index) { const flat = geo.toNonIndexed(); geo.dispose(); geo = flat; }
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    acc.geos.push(geo);

    // Límite departamental sobre la cara superior (pares de puntos por tramo)
    [outer, ...holes].forEach(ring => {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = project(ring[i][1], ring[i][0]);
        const b = project(ring[i + 1][1], ring[i + 1][0]);
        acc.lines.push(a.x, topY, a.z, b.x, topY, b.z);
      }
    });
    return true;
  }

  function mergeCountry(acc) {
    let n = 0;
    acc.geos.forEach(g => { n += g.attributes.position.count; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    let o = 0;
    acc.geos.forEach(g => {
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      o += g.attributes.position.count;
      g.dispose();
    });
    const body = new THREE.BufferGeometry();
    body.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    body.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    body.computeBoundingSphere();
    const mesh = new THREE.Mesh(body, bodyMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    countryGroup.add(mesh);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(acc.lines, 3));
    countryGroup.add(new THREE.LineSegments(lineGeo, borderMat));
  }

  // Construye por tandas para no bloquear el hilo principal en un solo bloque.
  async function buildCountryFromGeoJSON(geojson) {
    if (!geojson || !Array.isArray(geojson.features)) return false;
    const polys = [];
    geojson.features.forEach(f => {
      const g = f.geometry;
      if (!g) return;
      if (g.type === 'Polygon') polys.push(g.coordinates);
      else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => polys.push(p));
    });
    const acc = { geos: [], lines: [] };
    let valid = 0, budgetStart = performance.now();
    for (const rings of polys) {
      try { if (addPolygon(rings, acc)) valid++; } catch (e) { /* polígono inválido: se omite */ }
      if (performance.now() - budgetStart > 30) {
        await new Promise(r => setTimeout(r, 0));
        budgetStart = performance.now();
      }
    }
    if (!valid) return false;
    mergeCountry(acc);
    return true;
  }

  /* ---------------------------------------------------------------------
     CONTORNO EMBEBIDO si falla la red
     --------------------------------------------------------------------- */
  const FALLBACK_OUTLINE = [
    [12.46,-71.66],[12.38,-71.50],[12.20,-71.30],[11.95,-71.30],
    [11.70,-71.95],[11.50,-72.30],[11.30,-72.65],[11.10,-72.90],
    [10.95,-73.10],[10.85,-72.90],[10.95,-72.45],[10.70,-72.20],
    [10.20,-72.05],[9.85,-72.85],[9.10,-72.55],[8.65,-72.45],
    [7.95,-72.40],[7.40,-72.40],[7.00,-72.20],[6.80,-72.10],
    [6.30,-70.95],[6.20,-70.10],[6.10,-69.40],[6.20,-68.20],
    [6.10,-67.80],[5.20,-67.85],[4.10,-67.95],[3.10,-67.55],
    [2.20,-67.80],[1.30,-69.40],[0.70,-70.40],[-0.20,-69.55],
    [-1.20,-69.75],[-2.00,-70.05],[-3.30,-70.15],[-4.20,-69.95],
    [-4.30,-70.30],[-4.20,-70.80],[-3.50,-71.20],[-2.80,-71.60],
    [-2.00,-71.80],[-1.20,-72.20],[-0.50,-72.30],[0.40,-73.00],
    [0.05,-73.50],[-0.20,-74.30],[-0.40,-75.30],[-0.50,-76.40],
    [0.10,-76.80],[0.55,-77.55],[1.20,-78.50],[1.50,-78.95],
    [2.30,-78.75],[3.00,-77.80],[3.70,-77.40],[4.20,-77.30],
    [4.80,-77.30],[5.50,-77.30],[6.00,-77.40],[6.80,-77.55],
    [7.30,-77.90],[7.80,-77.40],[8.20,-77.30],[8.55,-76.80],
    [8.80,-76.55],[8.65,-76.20],[8.85,-75.80],[9.10,-75.80],
    [9.40,-75.55],[9.30,-75.10],[9.60,-74.80],[10.20,-74.40],
    [10.50,-73.80],[10.80,-73.50],[11.10,-73.30],[11.30,-73.10],
    [11.50,-72.60],[11.85,-72.20],[12.20,-71.90],[12.40,-71.75]
  ];
  function buildCountryFallback() {
    const shape = new THREE.Shape();
    FALLBACK_OUTLINE.forEach(([lat, lng], i) => {
      const { x, z } = project(lat, lng);
      if (i === 0) shape.moveTo(x, -z); else shape.lineTo(x, -z);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, bodyMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    countryGroup.add(mesh);

    const pts = FALLBACK_OUTLINE.map(([lat, lng]) => {
      const { x, z } = project(lat, lng);
      return new THREE.Vector3(x, COUNTRY_TOP_Y, z);
    });
    countryGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), outlineMat));

    // San Andrés como disco bajo aparte (con el GeoJSON real ya viene incluido)
    const sa = project(12.58, -81.71);
    const island = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, ISLAND_TOP_Y, 18), bodyMat);
    island.position.set(sa.x, ISLAND_TOP_Y / 2, sa.z);
    island.castShadow = true;
    countryGroup.add(island);
    islands.push({ w: -81.75, e: -81.67, s: 12.5, n: 12.6 });
    countryGroup.visible = true;
  }

  // Sombra plana bajo el país
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.22 }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.28;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  /* ---------------------------------------------------------------------
     PINES DE DESTINOS (quietos: sin flotar ni latir)
     --------------------------------------------------------------------- */
  const pinGroup = new THREE.Group();
  scene.add(pinGroup);

  function makeHaloTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    g.addColorStop(0,   'rgba(255,255,255,0.95)');
    g.addColorStop(0.4, 'rgba(243,154,31,0.6)');
    g.addColorStop(1,   'rgba(243,154,31,0.0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  const haloTex = makeHaloTexture();
  const postGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.8, 12);
  const postMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
  const headGeo = new THREE.SphereGeometry(0.18, 24, 24);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xF39A1F, emissive: 0xE67E22,
    emissiveIntensity: 0.55, roughness: 0.22, metalness: 0.35
  });
  const halo1Mat = new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0.6, depthWrite: false });
  const halo2Mat = new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0.25, depthWrite: false });
  const ringGeo = new THREE.RingGeometry(0.2, 0.32, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xF39A1F, transparent: true, opacity: 0.55, side: THREE.DoubleSide });

  const useTranslate = !!(window.CSS && CSS.supports && CSS.supports('translate', '1px 1px'));
  function place(el, x, y) {
    if (useTranslate) el.style.translate = `${x}px ${y}px`;
    else { el.style.left = x + 'px'; el.style.top = y + 'px'; }
  }

  const pins = [];
  const pinById = {};
  destinos.forEach((d, index) => {
    if (typeof d.lat !== 'number' || typeof d.lng !== 'number') return;
    const { x, z } = project(d.lat, d.lng);
    const baseY = COUNTRY_TOP_Y + 0.05;
    const pin = new THREE.Group();
    pin.position.set(x, 0, z);

    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = baseY;
    post.castShadow = true;
    pin.add(post);

    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = baseY + 0.5;
    head.castShadow = true;
    pin.add(head);

    const halo1 = new THREE.Sprite(halo1Mat);
    halo1.scale.setScalar(0.9);
    halo1.position.y = baseY + 0.5;
    pin.add(halo1);

    const halo2 = new THREE.Sprite(halo2Mat);
    halo2.scale.setScalar(1.5);
    halo2.position.y = baseY + 0.5;
    pin.add(halo2);

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = COUNTRY_TOP_Y + 0.02;
    pin.add(ring);

    pinGroup.add(pin);

    const label = document.createElement('div');
    label.className = 'map-3d__label';
    label.textContent = shortName(d);
    label.dataset.id = d.id;
    if (useTranslate) { label.style.left = '0px'; label.style.top = '0px'; }
    label.addEventListener('click', () => {
      if (dragMoved) return;
      ui.select(d.id, 'map');
    });
    overlay.appendChild(label);

    pin.userData = {
      id: d.id, destino: d, index, head, label,
      // posición en pantalla del último cuadro (px dentro del lienzo)
      sx: 0, sy: 0, bx: 0, by: 0, onScreen: false,
      lw: 0, lh: 0, shown: true, lx: NaN, ly: NaN
    };
    pins.push(pin);
    pinById[d.id] = pin;
  });

  // Tamaños de etiquetas y zonas ocupadas (brújula, leyenda): se miden solo
  // al iniciar, al cambiar de tamaño y al elegir destino, nunca por cuadro.
  let obstacles = [];
  function measureLabels() {
    pins.forEach(p => {
      const u = p.userData;
      u.lw = u.label.offsetWidth;
      u.lh = u.label.offsetHeight;
    });
    obstacles = Array.from(host.querySelectorAll('.map-3d__compass, .map-3d__legend'))
      .filter(el => el.offsetWidth && el.offsetParent === host)
      .map(el => ({ l: el.offsetLeft, t: el.offsetTop, r: el.offsetLeft + el.offsetWidth, b: el.offsetTop + el.offsetHeight }));
  }

  // Asienta cada pin sobre su superficie (las islas son más bajas)
  function seatPins() {
    pins.forEach(p => {
      const d = p.userData.destino;
      p.position.y = surfaceY(d.lat, d.lng) - COUNTRY_TOP_Y;
    });
  }

  /* ---------------------------------------------------------------------
     ARCOS entre destinos (líneas quietas). Se rehacen cuando el país está
     construido, para que los de San Andrés arranquen sobre la isla.
     --------------------------------------------------------------------- */
  const arcGroup = new THREE.Group();
  scene.add(arcGroup);
  const arcOrder = ['cartagena', 'san-andres', 'santa-marta', 'eje-cafetero', 'huila', 'tumaco', 'putumayo'];
  const arcLineMat = new THREE.LineBasicMaterial({ color: 0x42A5F5, transparent: true, opacity: 0.4 });
  function buildArcs() {
    arcGroup.children.slice().forEach(c => { arcGroup.remove(c); if (c.geometry) c.geometry.dispose(); });
    for (let i = 0; i < arcOrder.length - 1; i++) {
      const a = destinos.find(x => x.id === arcOrder[i]);
      const b = destinos.find(x => x.id === arcOrder[i + 1]);
      if (!a || !b) continue;
      const pa = project(a.lat, a.lng);
      const pb = project(b.lat, b.lng);
      const dist = Math.hypot(pa.x - pb.x, pa.z - pb.z);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(pa.x, surfaceY(a.lat, a.lng) + 0.3, pa.z),
        new THREE.Vector3((pa.x + pb.x) / 2, dist * 0.45 + 1.8, (pa.z + pb.z) / 2),
        new THREE.Vector3(pb.x, surfaceY(b.lat, b.lng) + 0.3, pb.z)
      );
      arcGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), arcLineMat));
    }
  }
  buildArcs();

  /* ---------------------------------------------------------------------
     BARCO quieto en el Caribe (gira junto con el mapa)
     --------------------------------------------------------------------- */
  const boatPivot = new THREE.Group();
  scene.add(boatPivot);
  const boat = new THREE.Group();
  boat.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.18, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 })
  ));
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.32), new THREE.MeshStandardMaterial({ color: 0x1976D2 }));
  band.position.y = -0.05; boat.add(band);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0xF39A1F }));
  stack.position.set(0.08, 0.18, 0); boat.add(stack);
  boat.position.y = -0.1; boat.scale.setScalar(0.85);
  boatPivot.add(boat);
  const boatPath = [
    project(11.5, -73.5), project(12, -75), project(11.5, -76.5),
    project(11, -77), project(10, -76.5)
  ];

  /* ---------------------------------------------------------------------
     ESTADO DE LA CÁMARA
     La cámara orbita alrededor de `focus`. Al elegir un destino el mapa
     vuelve a quedar con el norte arriba y `focus` sigue al pin elegido: al
     arrastrar, el mapa gira alrededor de ese destino.
     --------------------------------------------------------------------- */
  const DEFAULT_ZOOM = 18, SELECT_ZOOM = 14;
  const minZoom = 10, maxZoom = 28;
  let rotY = 0, rotX = 0.5, velY = 0, velX = 0;
  // En lienzos angostos (celular) la cámara arranca más lejos para que quepa
  // el país: 18 con un lienzo 1,45:1, ~22 con uno casi cuadrado.
  let zoom = clamp(DEFAULT_ZOOM * Math.pow(Math.max(1, 1.45 / (cw / ch)), 0.7), minZoom, 23);
  const focus = new THREE.Vector3();
  const focusGoal = new THREE.Vector3();
  const focusOffset = new THREE.Vector3();   // resto de un vuelo interrumpido; se desvanece
  let focusPin = null;
  // Posición en el mundo de un pin con el mapa girado `rot` radianes.
  function pinWorld(pin, rot, out) {
    const p = pin.position, c = Math.cos(rot), s = Math.sin(rot);
    return out.set(p.x * c + p.z * s, COUNTRY_TOP_Y, -p.x * s + p.z * c);
  }
  let flyTo = null;
  let selectedId = null;
  let userMoved = false;            // el usuario ya giró, acercó o eligió algo

  function setZoom(z) { zoom = clamp(z, minZoom, maxZoom); }

  // Lienzo angosto (celular): el encuadre se ajusta a los 8 pines con un
  // margen de ~10 % (San Andrés y Atacames quedaban fuera o en el borde).
  function fitPins() {
    if (cw >= 560 || !pins.length) return;
    let w = Infinity, e = -Infinity, n = Infinity, s = -Infinity;
    pins.forEach(p => { w = Math.min(w, p.position.x); e = Math.max(e, p.position.x); n = Math.min(n, p.position.z); s = Math.max(s, p.position.z); });
    focus.set((w + e) / 2, 0, (n + s) / 2 + 0.6);
    const v = new THREE.Vector3();
    const fits = (z) => {
      camera.position.set(focus.x, focus.y + z * Math.sin(rotX), focus.z + z * Math.cos(rotX));
      camera.lookAt(focus);
      camera.updateMatrixWorld();
      return pins.every(p => {
        v.set(p.position.x, COUNTRY_TOP_Y + 0.6, p.position.z).project(camera);
        const x = (v.x * 0.5 + 0.5) * cw, y = (-v.y * 0.5 + 0.5) * ch;
        return x > cw * 0.1 && x < cw * 0.9 && y > ch * 0.14 && y < ch * 0.94;
      });
    };
    let z = 12;
    while (z < maxZoom && !fits(z)) z += 0.5;
    zoom = z;
  }

  /* ---------------------------------------------------------------------
     INTERACCIÓN: puntero (ratón, dedo, lápiz) y rueda
     --------------------------------------------------------------------- */
  const pointers = new Map();
  let gesture = null;          // 'rotate' | 'pinch' | 'scroll' | 'done' | null
  let isDragging = false, dragMoved = false;
  let startX = 0, startY = 0, lastX = 0, lastY = 0, lastMoveAt = 0, pinchDist = 0;
  let lastPointerType = 'mouse';

  function interacted() {
    userMoved = true;
    if (flyTo && focusPin) focusOffset.subVectors(focus, pinWorld(focusPin, rotY, focusGoal));
    flyTo = null;              // el usuario manda: se cancela el vuelo en curso
    wake();
  }

  host.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('#mapPopup')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    lastPointerType = e.pointerType || 'mouse';
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      startX = lastX = e.clientX; startY = lastY = e.clientY;
      dragMoved = false; velX = velY = 0;
      gesture = lastPointerType === 'mouse' ? 'rotate' : null;   // en táctil se decide al moverse
      if (gesture === 'rotate') { isDragging = true; host.style.cursor = 'grabbing'; }
    } else if (pointers.size === 2) {
      gesture = 'pinch'; isDragging = false; dragMoved = true;
      const [a, b] = Array.from(pointers.values());
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    interacted();
  });

  window.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) { hover(e); return; }
    p.x = e.clientX; p.y = e.clientY;

    if (gesture === 'pinch') {
      if (pointers.size < 2) return;
      const [a, b] = Array.from(pointers.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom(zoom + (pinchDist - d) * 0.04);
      pinchDist = d;
      interacted();
      return;
    }

    const tx = e.clientX - startX, ty = e.clientY - startY;
    if (!gesture) {
      if (Math.hypot(tx, ty) < 8) return;
      // Táctil: horizontal gira el mapa, vertical deja bajar la página.
      gesture = Math.abs(tx) > Math.abs(ty) ? 'rotate' : 'scroll';
      if (gesture === 'rotate') isDragging = true;
    }
    if (gesture !== 'rotate') return;
    if (!dragMoved && Math.hypot(tx, ty) > 4) dragMoved = true;
    const dx = (e.clientX - lastX) / cw;
    const dy = (e.clientY - lastY) / ch;
    rotY += dx * 2.4; velY = dx * 2.4;
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      rotX = clamp(rotX + dy * 1.4, 0.15, 1.2); velX = dy * 1.4;
    }
    lastX = e.clientX; lastY = e.clientY;
    lastMoveAt = performance.now();
    interacted();
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      // Soltar después de quedarse quieto no lanza el mapa.
      if (performance.now() - lastMoveAt > 90) { velX = 0; velY = 0; }
      isDragging = false; gesture = null;
      host.style.cursor = '';
      wake();
    } else if (gesture === 'pinch') {
      gesture = 'done';        // queda un dedo: no girar hasta soltar todo
    }
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);

  // Pin más cercano a un punto de pantalla (distancia al poste del pin).
  function pinAt(clientX, clientY, tol) {
    const r = host.getBoundingClientRect();
    const x = clientX - r.left, y = clientY - r.top;
    let best = null, bestD = tol;
    pins.forEach(p => {
      const u = p.userData;
      if (!u.onScreen) return;
      const vx = u.bx - u.sx, vy = u.by - u.sy;
      const len2 = vx * vx + vy * vy || 1;
      const k = clamp(((x - u.sx) * vx + (y - u.sy) * vy) / len2, 0, 1);
      const d = Math.hypot(x - (u.sx + vx * k), y - (u.sy + vy * k));
      if (d < bestD) { bestD = d; best = p; }
    });
    return best;
  }

  let hoverCursor = '';
  function hover(e) {
    if (e.pointerType !== 'mouse' || isDragging || !host.contains(e.target)) return;
    const c = pinAt(e.clientX, e.clientY, 16) ? 'pointer' : '';
    if (c !== hoverCursor) { hoverCursor = c; host.style.cursor = c; }
  }

  host.addEventListener('click', (e) => {
    if (dragMoved) { dragMoved = false; return; }
    if (e.target.closest && (e.target.closest('#mapPopup') || e.target.closest('.map-3d__label'))) return;
    const pin = pinAt(e.clientX, e.clientY, lastPointerType === 'mouse' ? 18 : 28);
    if (pin) ui.select(pin.userData.id, 'map');
    else closePopup();
  });

  // Rueda: sin Ctrl/Cmd la página baja como siempre; con Ctrl/Cmd acerca.
  let noticeEl = null, noticeTimer = 0;
  function showZoomNotice() {
    if (!noticeEl) {
      noticeEl = document.createElement('div');
      noticeEl.className = 'map-3d__notice';
      noticeEl.setAttribute('aria-hidden', 'true');
      noticeEl.textContent = `Usa ${zoomKey} + rueda para acercar`;
      host.appendChild(noticeEl);
    }
    noticeEl.classList.add('is-shown');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { noticeEl.classList.remove('is-shown'); }, 1500);
  }
  host.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) { showZoomNotice(); return; }
    e.preventDefault();
    const k = e.deltaMode === 1 ? 0.6 : e.deltaMode === 2 ? 10 : 0.018;
    setZoom(zoom + e.deltaY * k);
    interacted();
  }, { passive: false });

  /* ---------------------------------------------------------------------
     ELEGIR DESTINO (parte 3D): pin marcado, vuelo y ficha. Los chips, la
     lista, el panel y la región viva los maneja PARAISOS_MAP (main.js).
     --------------------------------------------------------------------- */
  let labelOrder = pins.slice();
  function sortLabels() {
    // Prioridad: elegida, luego las que tienen tarifa, en el orden de los datos.
    labelOrder = pins.slice().sort((a, b) => {
      const A = a.userData, B = b.userData;
      if (A.id === selectedId) return -1;
      if (B.id === selectedId) return 1;
      const pa = A.destino.precio ? 0 : 1, pb = B.destino.precio ? 0 : 1;
      return pa - pb || A.index - B.index;
    });
  }
  sortLabels();

  function startFlyTo(pin) {
    rotY = Math.atan2(Math.sin(rotY), Math.cos(rotY));     // sin vueltas acumuladas
    const toRot = 0;                                       // norte arriba, por el camino corto
    focusPin = pin;
    focusOffset.set(0, 0, 0);
    velX = velY = 0;
    if (reduced) {
      rotY = toRot; zoom = SELECT_ZOOM; flyTo = null;
      focus.copy(pinWorld(pin, rotY, focusGoal));
      return;
    }
    flyTo = { t: 0, fromRot: rotY, toRot, fromZoom: zoom, toZoom: SELECT_ZOOM, fromFocus: focus.clone() };
  }

  function select3D(id, how) {
    const pin = pinById[id];
    if (!pin) return;
    selectedId = id;
    userMoved = true;
    pins.forEach(p => {
      const sel = p.userData.id === id;
      p.userData.head.scale.setScalar(sel ? 1.6 : 1);
      p.userData.label.classList.toggle('is-active', sel);
    });
    sortLabels();
    measureLabels();
    startFlyTo(pin);
    // Ficha sobre el pin solo en escritorio y con ratón (en táctil manda el panel)
    if (!isTouchUI() && how !== 'keyboard' && how !== 'restore') openPopup(pin.userData.destino); else closePopup();
    requestRender();
  }

  let popupW = 0, popupH = 0;
  function openPopup(d) {
    if (!popup) return;
    const name = shortName(d);
    popup.innerHTML = `
      <h4>${name}</h4>
      <p>${ui.priceLine(d)}</p>
      <a class="btn btn--whatsapp btn--sm" target="_blank" rel="noopener" href="${ui.waHref(d)}" aria-label="Cotizar ${name} por WhatsApp">${WA_ICON}<span>Cotizar</span></a>`;
    popup.dataset.id = d.id;
    if (useTranslate) { popup.style.left = '0px'; popup.style.top = '0px'; }
    popup.hidden = false;
    popupW = popup.offsetWidth;
    popupH = popup.offsetHeight;
  }
  function closePopup() {
    if (popup && !popup.hidden) { popup.hidden = true; popup.dataset.id = ''; requestRender(); }
  }


  if (hintEl) {
    hintEl.textContent = isTouchUI()
      ? 'Desliza de lado para girar · Toca un destino'
      : `Arrastra para girar · ${zoomKey} + rueda para acercar`;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
  });
  document.addEventListener('click', (e) => {
    if (!popup || popup.hidden || !e.target.closest) return;
    if (e.target.closest('#canvas3d') || e.target.closest('.map-3d__chip') || e.target.closest('.map-3d__fare')) return;
    closePopup();
  });

  /* ---------------------------------------------------------------------
     BUCLE DE RENDER
     Solo dibuja cuando algo cambia (arrastre, zoom, vuelo, inercia, cambio
     de tamaño) y con el mapa en pantalla y la pestaña visible. Quieto, el
     hilo principal queda libre.
     --------------------------------------------------------------------- */
  const tmpV = new THREE.Vector3();
  const clock = new THREE.Clock();
  let ambientPlaced = false;
  let rafId = 0, running = false, needsRender = true;
  let inView = false, pageVisible = !document.hidden;
  let compassDeg = NaN;

  function frame() {
    rafId = 0;
    if (!inView || !pageVisible) { running = false; return; }
    if (tick()) rafId = requestAnimationFrame(frame);
    else running = false;
  }
  function wake() {
    if (running || !inView || !pageVisible) return;
    running = true;
    clock.getDelta();        // descarta el tiempo que estuvo en pausa
    rafId = requestAnimationFrame(frame);
  }
  function requestRender() { needsRender = true; wake(); }

  // Agua, espuma y barco se ubican una sola vez (sin olas ni recorrido)
  function updateAmbient(dt) {
    const t = 0;
    // Océano
    for (let i = 0; i < oCount; i++) {
      const x = oArr[i * 3], y = oArr[i * 3 + 1];
      oArr[i * 3 + 2] = Math.sin(x * 0.4 + t * 1.2) * 0.07 + Math.cos(y * 0.3 + t * 0.9) * 0.06;
    }
    oPos.needsUpdate = true;
    // Espuma
    const f = dt * 60;
    for (let i = 0; i < foamCount; i++) {
      const idx = i * 3;
      foamPos[idx + 1] = -0.1 + Math.sin(t * 1.5 + foamPhase[i]) * 0.08;
      foamPos[idx]     += Math.sin(t * 0.3 + foamPhase[i]) * 0.002 * f;
      foamPos[idx + 2] += Math.cos(t * 0.4 + foamPhase[i]) * 0.002 * f;
      if (foamPos[idx] > 20) foamPos[idx] = -20; else if (foamPos[idx] < -20) foamPos[idx] = 20;
      if (foamPos[idx + 2] > 20) foamPos[idx + 2] = -20; else if (foamPos[idx + 2] < -20) foamPos[idx + 2] = 20;
    }
    foamGeo.attributes.position.needsUpdate = true;
    // Barco
    const boatU = (t * 0.06) % 1;
    const idx = Math.floor(boatU * boatPath.length);
    const next = (idx + 1) % boatPath.length;
    const local = (boatU * boatPath.length) % 1;
    boat.position.x = boatPath[idx].x + (boatPath[next].x - boatPath[idx].x) * local;
    boat.position.z = boatPath[idx].z + (boatPath[next].z - boatPath[idx].z) * local;
    boat.position.y = -0.05 + Math.sin(t * 3) * 0.03;
    boat.rotation.y = Math.atan2(boatPath[next].x - boatPath[idx].x, boatPath[next].z - boatPath[idx].z) + Math.PI;
  }

  // Proyecta pines a pantalla, ubica etiquetas (sin pisarse) y la ficha.
  function updateScreen() {
    pins.forEach(p => {
      const u = p.userData;
      tmpV.setFromMatrixPosition(u.head.matrixWorld).project(camera);
      u.onScreen = tmpV.z > -1 && tmpV.z < 1;
      u.sx = (tmpV.x * 0.5 + 0.5) * cw;
      u.sy = (-tmpV.y * 0.5 + 0.5) * ch;
      tmpV.set(0, COUNTRY_TOP_Y, 0).applyMatrix4(p.matrixWorld).project(camera);
      u.bx = (tmpV.x * 0.5 + 0.5) * cw;
      u.by = (-tmpV.y * 0.5 + 0.5) * ch;
    });

    const placed = obstacles.slice();
    // La etiqueta del pin con la ficha abierta se oculta: la ficha ya lo nombra
    const popId = popup && !popup.hidden ? popup.dataset.id : '';
    labelOrder.forEach(p => {
      const u = p.userData;
      const active = u.id === selectedId;
      let show = u.onScreen && u.id !== popId;
      let x = u.sx;
      const y = u.sy;
      if (show) {
        const lh = u.lh || 26, s = active ? 1.1 : 1;
        const w = (u.lw || 90) * s, h = lh * s;
        const cy = y - (active ? 0.85 : 0.7) * lh;
        const r = { l: x - w / 2, r: x + w / 2, t: cy - h / 2, b: cy + h / 2 + 6 };
        const inside = r.l >= 2 && r.r <= cw - 2 && r.t >= 2 && r.b <= ch - 2;
        if (active) {
          // La elegida siempre se ve: si se sale por un lado, se corre adentro.
          const shift = Math.max(0, 2 - r.l) - Math.max(0, r.r - (cw - 2));
          x += shift; r.l += shift; r.r += shift;
        } else if (!inside || placed.some(o => r.l < o.r + 4 && r.r > o.l - 4 && r.t < o.b + 2 && r.b > o.t - 2)) {
          show = false;
        }
        if (show) placed.push(r);
      }
      if (show !== u.shown) { u.label.style.visibility = show ? '' : 'hidden'; u.shown = show; }
      if (show) {
        const rx = Math.round(x * 2) / 2, ry = Math.round(y * 2) / 2;
        if (rx !== u.lx || ry !== u.ly) { place(u.label, rx, ry); u.lx = rx; u.ly = ry; }
      }
    });

    if (popup && !popup.hidden && popup.dataset.id && pinById[popup.dataset.id]) {
      const u = pinById[popup.dataset.id].userData;
      const pw = popupW || 280, ph = popupH || 150;
      const ax = cw < pw + 16 ? cw / 2 : clamp(u.sx, pw / 2 + 8, cw - pw / 2 - 8);
      const ay = ch < ph + 30 ? ch - 8 : clamp(u.sy, ph + 22, ch - 8);
      place(popup, Math.round(ax), Math.round(ay));
    }

    if (compassNeedle) {
      const deg = Math.round(((-rotY * 180 / Math.PI) % 360) * 2) / 2;
      if (deg !== compassDeg) { compassNeedle.style.transform = `rotate(${deg}deg)`; compassDeg = deg; }
    }
  }

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.1);   // getDelta primero: también avanza elapsedTime
    const f = dt * 60;
    let moving = false;

    if (flyTo) {
      flyTo.t = Math.min(1, flyTo.t + dt / 1.1);
      const k = flyTo.t < 0.5 ? 2 * flyTo.t * flyTo.t : 1 - Math.pow(-2 * flyTo.t + 2, 2) / 2;
      rotY = lerp(flyTo.fromRot, flyTo.toRot, k);
      zoom = lerp(flyTo.fromZoom, flyTo.toZoom, k);
      if (focusPin) pinWorld(focusPin, rotY, focusGoal); else focusGoal.set(0, 0, 0);
      focus.lerpVectors(flyTo.fromFocus, focusGoal, k);
      if (flyTo.t >= 1) flyTo = null;
      moving = true;
    } else {
      if (!isDragging) {
        if (Math.abs(velY) > 1e-5 || Math.abs(velX) > 1e-5) {
          rotY += velY * f; rotX += velX * f;
          const damp = Math.pow(0.93, f);
          velY *= damp; velX *= damp;
          moving = true;
        } else { velY = 0; velX = 0; }
      } else {
        moving = true;
      }
      // Con un destino elegido la cámara lo sigue (el mapa gira a su alrededor).
      if (focusPin) {
        focus.copy(pinWorld(focusPin, rotY, focusGoal)).add(focusOffset);
        if (focusOffset.lengthSq() > 1e-6) { focusOffset.multiplyScalar(Math.exp(-dt * 4)); moving = true; }
        else focusOffset.set(0, 0, 0);
      }
    }
    rotX = clamp(rotX, 0.15, 1.2);

    countryGroup.rotation.y = rotY;
    pinGroup.rotation.y = rotY;
    arcGroup.rotation.y = rotY;
    boatPivot.rotation.y = rotY;
    grid.rotation.y = rotY;

    camera.position.set(focus.x, focus.y + zoom * Math.sin(rotX), focus.z + zoom * Math.cos(rotX));
    camera.lookAt(focus);

    if (!ambientPlaced) { updateAmbient(0); ambientPlaced = true; }

    renderer.render(scene, camera);   // actualiza las matrices que usa updateScreen
    updateScreen();
    needsRender = false;

    return moving || needsRender;
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    if (w !== cw || h !== ch) {
      cw = w; ch = h;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
      if (!userMoved) fitPins();
    }
    measureLabels();
    requestRender();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      if (inView) wake();
    }, { rootMargin: '100px 0px' }).observe(host);
  } else {
    inView = true;
  }
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) wake();
  });
  if (reduceMQ) {
    const onReduce = (e) => { reduced = e.matches; requestRender(); };
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onReduce);
    else if (reduceMQ.addListener) reduceMQ.addListener(onReduce);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureLabels(); requestRender(); });

  // Primer cuadro ya mismo (compila los shaders antes de que el mapa entre
  // en pantalla). El país aparece cuando termina de construirse.
  fitPins();
  measureLabels();
  tick();
  ui.attach({ select: select3D });

  /* ---------------------------------------------------------------------
     CARGA DEL PAÍS: archivo local y, si falla, el Gist público
     --------------------------------------------------------------------- */
  const GEO_URLS = [
    'assets/data/colombia.geo.json',
    'https://gist.githubusercontent.com/john-guerra/43c7656821069d00dcbc/raw/3aadedf47badbdac823b00dbe259f6bc6d9e1899/colombia.geo.json'
  ];
  const FETCH_TIMEOUT_MS = 8000;

  function fetchWithTimeout(url, ms) {
    return Promise.race([
      fetch(url, { mode: 'cors' }).then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout ' + ms + 'ms')), ms))
    ]);
  }
  async function fetchGeo() {
    for (const url of GEO_URLS) {
      try {
        const data = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
        if (data && data.features) return data;
      } catch (e) {
        console.warn('[mapa] falló', url, '·', e.message);
      }
    }
    return null;
  }

  // Con file:// el navegador bloquea el fetch: se usa el contorno embebido.
  const isFileProtocol = location.protocol === 'file:';

  (async () => {
    let ok = false;
    if (!isFileProtocol) {
      try {
        const geo = await fetchGeo();
        if (geo) ok = await buildCountryFromGeoJSON(geo);
      } catch (e) {
        console.warn('[mapa] error al construir el GeoJSON', e);
      }
    }
    if (!ok) {
      countryGroup.clear ? countryGroup.clear() : countryGroup.children.slice().forEach(c => countryGroup.remove(c));
      buildCountryFallback();
    }
    seatPins();
    buildArcs();
    loadingEl.classList.add('is-done');
    setTimeout(() => loadingEl.remove(), 450);
    if (running) needsRender = true;
    else tick();             // dibuja el país aunque el mapa aún no esté en pantalla
  })();
}

/* Carga diferida: Three.js y el GeoJSON se piden solo cuando el mapa está
   por entrar en pantalla, no al abrir la página. */
(function lazyMap() {
  const host = document.getElementById('canvas3d');
  if (!host) return;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    if (window.THREE) return initColombiaMap();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    // Integridad (SRI): si el CDN sirviera otro archivo, no se ejecuta
    s.integrity = 'sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu';
    s.crossOrigin = 'anonymous';
    s.referrerPolicy = 'no-referrer';
    s.onload = initColombiaMap;
    // Sin 3D (CDN bloqueado, sin red o archivo distinto): queda la lista a lo ancho
    s.onerror = () => {
      console.warn('[mapa] Three.js no cargó');
      if (window.PARAISOS_MAP) window.PARAISOS_MAP.fallback();
    };
    document.head.appendChild(s);
  };
  if (!('IntersectionObserver' in window)) return start();
  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); }
  }, { rootMargin: '800px 0px' });
  io.observe(host);
})();
