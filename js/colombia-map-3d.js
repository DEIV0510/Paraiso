/* =====================================================================
   PARAISOS — colombia-map-3d.js  (versión REAL GeoJSON)

   Mapa 3D cinematográfico de Colombia usando GeoJSON real con los 33
   departamentos. Si la red falla, cae a un outline embebido.

   Lo que mantiene esta versión:
   - Océano con vertex displacement (olas)
   - Partículas de espuma flotando
   - Skybox con gradiente cielo → horizonte
   - Nubes 3D (grupos de esferas) derivando
   - Arcos curvos Bezier conectando destinos con luz viajera
   - Barco navegando por el Caribe
   - Pins con halo doble + ring + bobbing
   - Compass que rota con la cámara
   - Labels HTML overlay proyectadas
   - Drag con damping, scroll/pinch zoom, click → fly-to + popup + panel
   - Auto-rotate con pausa 5s tras interacción

   Lo nuevo:
   - Cada departamento es un mesh extruido individual en gris claro.
   - Líneas finas sobre la superficie marcan los límites departamentales.
   - El contorno del país aparece naturalmente como la unión de los
     límites de los departamentos perimetrales.
   ===================================================================== */
(function () {
  'use strict';
  if (!window.THREE) { console.warn('Three.js no cargó'); return; }

  const host  = document.getElementById('canvas3d');
  const overlay = document.getElementById('mapLabels');
  const popup = document.getElementById('mapPopup');
  const panelEmpty = document.getElementById('panelEmpty');
  const panelContent = document.getElementById('panelContent');
  const chipsHost = document.getElementById('destChips');
  const compassNeedle = document.querySelector('.map-3d__compass-needle');
  if (!host) return;

  const D = window.PARAISOS_DATA;
  const destinos = D.destinos;

  /* ---------------------------------------------------------------------
     OVERLAY DE CARGA mientras se descarga el GeoJSON real
     --------------------------------------------------------------------- */
  const loadingEl = document.createElement('div');
  loadingEl.style.cssText = `
    position: absolute; inset: 0; z-index: 6;
    display: grid; place-items: center;
    background: rgba(221,235,248,.85);
    backdrop-filter: blur(4px);
    color: #0D47A1; font-family: Montserrat, sans-serif; font-weight: 700;
    font-size: .9rem; letter-spacing: .12em; text-transform: uppercase;
    transition: opacity .5s;
  `;
  loadingEl.innerHTML = `
    <div style="text-align:center">
      <div style="width:42px;height:42px;border:3px solid rgba(25,118,210,.25);border-top-color:#1976D2;border-radius:50%;margin:0 auto 1rem;animation:spin 1s linear infinite"></div>
      <span>Cargando mapa real de Colombia…</span>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
  host.appendChild(loadingEl);

  /* ---------------------------------------------------------------------
     ESCENA / CÁMARA / RENDERER
     --------------------------------------------------------------------- */
  const W = () => host.clientWidth;
  const H = () => host.clientHeight;

  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0xBBDEFB, 24, 75);

  const camera = new THREE.PerspectiveCamera(36, W() / H(), 0.1, 200);
  camera.position.set(0, 14, 18);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.insertBefore(renderer.domElement, host.firstChild);

  /* ---------------------------------------------------------------------
     ILUMINACIÓN 3 PUNTOS
     Strong key (luz dura cálida), fill warm, rim cool.
     --------------------------------------------------------------------- */
  scene.add(new THREE.AmbientLight(0xE3F2FD, 0.55));
  const key = new THREE.DirectionalLight(0xfff5e1, 1.35);
  key.position.set(9, 16, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -16; key.shadow.camera.right = 16;
  key.shadow.camera.top = 16;   key.shadow.camera.bottom = -16;
  key.shadow.bias = -0.0005;
  scene.add(key);
  scene.add(Object.assign(new THREE.DirectionalLight(0xFFCC88, 0.45), { position: new THREE.Vector3(-6, 6, 4) }));
  scene.add(Object.assign(new THREE.DirectionalLight(0x66BBFF, 0.55), { position: new THREE.Vector3(0, 4, -10) }));

  /* ---------------------------------------------------------------------
     PROYECCIÓN lat/lng → mundo (XZ plano)
     Centrada en el centroide aproximado de Colombia.
     --------------------------------------------------------------------- */
  const CENTER_LAT = 4.5, CENTER_LNG = -73.5;
  const SCALE = 1.05;
  function project(lat, lng) {
    return { x: (lng - CENTER_LNG) * SCALE, z: -(lat - CENTER_LAT) * SCALE };
  }

  /* ---------------------------------------------------------------------
     SKYBOX (esfera invertida con gradiente)
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
     OCÉANO con vertex displacement
     --------------------------------------------------------------------- */
  const oceanGeo = new THREE.PlaneGeometry(80, 80, 100, 100);
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
  const oInit = new Float32Array(oPos.count);
  for (let i = 0; i < oPos.count; i++) oInit[i] = oPos.getZ(i);

  const grid = new THREE.GridHelper(80, 80, 0x4A90D9, 0x4A90D9);
  grid.material.transparent = true;
  grid.material.opacity = 0.08;
  grid.position.y = -0.28;
  scene.add(grid);

  /* ---------------------------------------------------------------------
     PARTÍCULAS DE ESPUMA SOBRE EL OCÉANO
     --------------------------------------------------------------------- */
  const foamCount = 300;
  const foamGeo = new THREE.BufferGeometry();
  const foamPos = new Float32Array(foamCount * 3);
  const foamPhase = new Float32Array(foamCount);
  for (let i = 0; i < foamCount; i++) {
    foamPos[i*3]   = (Math.random() - 0.5) * 40;
    foamPos[i*3+1] = -0.15 + Math.random() * 0.1;
    foamPos[i*3+2] = (Math.random() - 0.5) * 40;
    foamPhase[i]   = Math.random() * Math.PI * 2;
  }
  foamGeo.setAttribute('position', new THREE.BufferAttribute(foamPos, 3));
  scene.add(new THREE.Points(foamGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.12, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending
  })));

  /* ---------------------------------------------------------------------
     NUBES 3D
     --------------------------------------------------------------------- */
  const cloudGroup = new THREE.Group();
  scene.add(cloudGroup);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, roughness: 1, metalness: 0,
    transparent: true, opacity: 0.85
  });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * (10 + Math.random() * 4);
    const z = Math.sin(angle) * (10 + Math.random() * 4);
    const cloud = new THREE.Group();
    const blobs = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < blobs; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.4 + Math.random() * 0.35, 12, 12), cloudMat);
      s.position.set((j - blobs/2) * 0.5 + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.4);
      cloud.add(s);
    }
    cloud.position.set(x, 4 + Math.random() * 2, z);
    cloud.scale.setScalar(0.6 + Math.random() * 0.4);
    cloud.userData = { drift: (Math.random() - 0.5) * 0.004, bob: Math.random() * Math.PI * 2 };
    cloudGroup.add(cloud);
  }

  /* ---------------------------------------------------------------------
     PARÁMETROS DEL PAÍS (compartidos entre GeoJSON real y fallback)
     --------------------------------------------------------------------- */
  const COUNTRY_DEPTH = 1.0;
  const COUNTRY_TOP_Y = COUNTRY_DEPTH + 0.18;   // por encima del bisel
  const countryGroup = new THREE.Group();
  scene.add(countryGroup);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xEDEDED,
    roughness: 0.85,
    metalness: 0.04,
    emissive: 0x1a1a1a,
    emissiveIntensity: 0.06
  });
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0xBDBDBD,
    roughness: 0.92,
    metalness: 0.02
  });
  const borderMat = new THREE.LineBasicMaterial({
    color: 0x7B8794,
    transparent: true,
    opacity: 0.85
  });
  const outlineMat = new THREE.LineBasicMaterial({
    color: 0x4A5568,
    transparent: true,
    opacity: 0.95
  });

  const extrudeSettings = {
    depth: COUNTRY_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.12,
    bevelSegments: 3,
    curveSegments: 10,
    steps: 1
  };

  /* ---------------------------------------------------------------------
     BUILD COUNTRY desde GeoJSON real
     Cada feature (departamento) → mesh extruido + línea de borde.
     --------------------------------------------------------------------- */
  function buildCountryFromGeoJSON(geojson) {
    if (!geojson || !geojson.features) return false;
    let valid = 0;

    geojson.features.forEach(feature => {
      const geom = feature.geometry;
      if (!geom) return;
      const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

      polys.forEach(rings => {
        const outer = rings[0];
        if (!outer || outer.length < 4) return;

        // Construir el Shape 2D
        const shape = new THREE.Shape();
        outer.forEach(([lng, lat], i) => {
          const { x, z } = project(lat, lng);
          if (i === 0) shape.moveTo(x, -z);
          else shape.lineTo(x, -z);
        });

        // Holes (anillos internos del polígono)
        for (let i = 1; i < rings.length; i++) {
          const hole = new THREE.Path();
          rings[i].forEach(([lng, lat], j) => {
            const { x, z } = project(lat, lng);
            if (j === 0) hole.moveTo(x, -z);
            else hole.lineTo(x, -z);
          });
          shape.holes.push(hole);
        }

        // Extrudir
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.rotateX(-Math.PI / 2);
        geo.computeVertexNormals();

        // Material único (multi-material puede fallar en algunos contextos).
        // Las luces 3-point + el bisel crean naturalmente el contraste top vs lados.
        const mesh = new THREE.Mesh(geo, bodyMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        countryGroup.add(mesh);

        // Línea de borde departamental sobre la superficie superior
        const pts = outer.map(([lng, lat]) => {
          const { x, z } = project(lat, lng);
          return new THREE.Vector3(x, COUNTRY_TOP_Y, z);
        });
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        countryGroup.add(new THREE.Line(lineGeo, borderMat));

        // Líneas de huecos (raro en departamentos, pero por completitud)
        for (let i = 1; i < rings.length; i++) {
          const hp = rings[i].map(([lng, lat]) => {
            const { x, z } = project(lat, lng);
            return new THREE.Vector3(x, COUNTRY_TOP_Y, z);
          });
          countryGroup.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(hp), borderMat
          ));
        }

        valid++;
      });
    });
    return valid > 0;
  }

  /* ---------------------------------------------------------------------
     FALLBACK: outline embebido si falla la red
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

    // Borde país
    const pts = FALLBACK_OUTLINE.map(([lat, lng]) => {
      const { x, z } = project(lat, lng);
      return new THREE.Vector3(x, COUNTRY_TOP_Y, z);
    });
    countryGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts), outlineMat
    ));

    // San Andrés como cilindro aparte (con GeoJSON real ya viene incluido)
    const sa = project(12.58, -81.71);
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, COUNTRY_DEPTH * 0.7, 18),
      bodyMat
    );
    island.position.set(sa.x, COUNTRY_DEPTH * 0.35 - 0.1, sa.z);
    island.castShadow = true;
    countryGroup.add(island);
  }

  // Sombra plana bajo el país
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.22 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.28;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  /* ---------------------------------------------------------------------
     PINS DE DESTINOS
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

  const pins = [];
  destinos.forEach(d => {
    const { x, z } = project(d.lat, d.lng);
    const baseY = COUNTRY_TOP_Y + 0.05;
    const pin = new THREE.Group();
    pin.position.set(x, 0, z);
    pin.userData = { id: d.id, destino: d, baseY };

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 0.8, 12),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 })
    );
    post.position.y = baseY;
    post.castShadow = true;
    pin.add(post);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xF39A1F, emissive: 0xE67E22,
        emissiveIntensity: 0.55, roughness: 0.22, metalness: 0.35
      })
    );
    head.position.y = baseY + 0.5;
    head.castShadow = true;
    pin.add(head);

    const halo1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0.9, depthWrite: false }));
    halo1.scale.set(1, 1, 1);
    halo1.position.y = baseY + 0.5;
    pin.add(halo1);

    const halo2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0.4, depthWrite: false }));
    halo2.scale.set(1.6, 1.6, 1.6);
    halo2.position.y = baseY + 0.5;
    pin.add(halo2);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.32, 32),
      new THREE.MeshBasicMaterial({ color: 0xF39A1F, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = COUNTRY_TOP_Y + 0.02;
    pin.add(ring);

    pin.userData.head = head;
    pin.userData.halo1 = halo1;
    pin.userData.halo2 = halo2;
    pin.userData.ring = ring;

    pinGroup.add(pin);
    pins.push(pin);

    const label = document.createElement('div');
    label.className = 'map-3d__label';
    label.innerHTML = `<span class="flag">${d.flag}</span> ${d.nombre}`;
    label.dataset.id = d.id;
    label.addEventListener('click', () => selectDestino(d.id, true));
    overlay.appendChild(label);
    pin.userData.label = label;
  });

  /* ---------------------------------------------------------------------
     ARCOS CURVOS conectando destinos en cadena con luz viajera
     --------------------------------------------------------------------- */
  const arcGroup = new THREE.Group();
  scene.add(arcGroup);
  const arcs = [];
  const arcOrder = ['cartagena','san-andres','santa-marta','eje-cafetero','huila','tumaco','putumayo'];
  for (let i = 0; i < arcOrder.length - 1; i++) {
    const a = destinos.find(x => x.id === arcOrder[i]);
    const b = destinos.find(x => x.id === arcOrder[i+1]);
    if (!a || !b) continue;
    const pa = project(a.lat, a.lng);
    const pb = project(b.lat, b.lng);
    const dist = Math.hypot(pa.x - pb.x, pa.z - pb.z);
    const mid = new THREE.Vector3(
      (pa.x + pb.x) / 2,
      dist * 0.45 + 1.8,
      (pa.z + pb.z) / 2
    );
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(pa.x, COUNTRY_TOP_Y + 0.3, pa.z),
      mid,
      new THREE.Vector3(pb.x, COUNTRY_TOP_Y + 0.3, pb.z)
    );
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
    arcGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x42A5F5, transparent: true, opacity: 0.4
    })));
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xFFB74D })
    );
    arcGroup.add(dot);
    arcs.push({ curve, dot, phase: i * 0.3 });
  }

  /* ---------------------------------------------------------------------
     BARCO navegando por el Caribe
     --------------------------------------------------------------------- */
  const boat = new THREE.Group();
  boat.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.18, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 })
  ));
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.06, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x1976D2 })
  );
  band.position.y = -0.05; boat.add(band);
  const stack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8),
    new THREE.MeshStandardMaterial({ color: 0xF39A1F })
  );
  stack.position.set(0.08, 0.18, 0); boat.add(stack);
  boat.position.y = -0.1; boat.scale.setScalar(0.85);
  scene.add(boat);
  const boatPath = [
    project(11.5, -73.5), project(12, -75), project(11.5, -76.5),
    project(11, -77), project(10, -76.5)
  ];

  /* ---------------------------------------------------------------------
     INTERACCIÓN: rotar / zoom (drag + wheel + pinch)
     --------------------------------------------------------------------- */
  let isDragging = false, lastX = 0, lastY = 0;
  let rotY = 0, rotX = 0.5;
  let velY = 0, velX = 0;
  let zoom = 18;
  const minZoom = 10, maxZoom = 28;
  let lastInteract = performance.now();
  const autoRotate = () => performance.now() - lastInteract > 5000;

  function onPointerDown(e) {
    isDragging = true;
    lastX = e.clientX; lastY = e.clientY;
    host.style.cursor = 'grabbing';
    lastInteract = performance.now();
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = (e.clientX - lastX) / W();
    const dy = (e.clientY - lastY) / H();
    rotY += dx * 2.4;
    rotX += dy * 1.4;
    rotX = Math.max(0.15, Math.min(1.2, rotX));
    velY = dx * 2.4; velX = dy * 1.4;
    lastX = e.clientX; lastY = e.clientY;
    lastInteract = performance.now();
  }
  function onPointerUp() { isDragging = false; host.style.cursor = 'grab'; }
  function onWheel(e) {
    e.preventDefault();
    zoom += e.deltaY * 0.018;
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    lastInteract = performance.now();
  }
  let pinchDist = null;
  function distance(a, b) { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
  host.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) pinchDist = distance(e.touches[0], e.touches[1]);
    else if (e.touches.length === 1) onPointerDown(e.touches[0]);
  }, { passive: true });
  host.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchDist != null) {
      const d = distance(e.touches[0], e.touches[1]);
      zoom += (pinchDist - d) * 0.04;
      zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
      pinchDist = d; lastInteract = performance.now();
    } else if (e.touches.length === 1) onPointerMove(e.touches[0]);
  }, { passive: true });
  host.addEventListener('touchend', () => { pinchDist = null; onPointerUp(); }, { passive: true });
  host.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  host.addEventListener('wheel', onWheel, { passive: false });

  /* ---------------------------------------------------------------------
     RAYCASTER para click en pins
     --------------------------------------------------------------------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let dragMoved = false;
  host.addEventListener('mousedown', () => { dragMoved = false; });
  host.addEventListener('mousemove', () => { if (isDragging) dragMoved = true; });
  host.addEventListener('click', (e) => {
    if (dragMoved) return;
    const rect = host.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const heads = pins.map(p => p.userData.head);
    const hits = raycaster.intersectObjects(heads, false);
    if (hits.length) {
      const pin = pins.find(p => p.userData.head === hits[0].object);
      if (pin) selectDestino(pin.userData.id, true);
    }
  });

  /* ---------------------------------------------------------------------
     SELECT / FLY-TO / POPUP / PANEL
     --------------------------------------------------------------------- */
  let flyTo = null;
  function selectDestino(id, openPopup) {
    const d = destinos.find(x => x.id === id);
    if (!d) return;
    const { x, z } = project(d.lat, d.lng);
    pins.forEach(p => {
      const sel = p.userData.id === id;
      p.userData.head.scale.setScalar(sel ? 1.6 : 1);
      p.userData.label.classList.toggle('is-active', sel);
    });
    flyTo = { x, z, t: 0 };
    renderPanel(d);
    if (openPopup) {
      popup.hidden = false;
      popup.innerHTML = `
        <img src="${d.img}" alt="${d.nombre}" />
        <h4>${d.nombre} ${d.flag}</h4>
        <p>${d.desc.substring(0, 95)}…</p>
        <a class="btn btn--whatsapp btn--sm" target="_blank" rel="noopener"
           href="https://wa.me/${D.whatsapp}?text=${encodeURIComponent(`Hola PARAISOS, quiero cotizar un viaje a ${d.nombre}.`)}">
          Cotizar por WhatsApp
        </a>`;
      popup.dataset.id = id;
    }
    chipsHost.querySelectorAll('.map-3d__chip').forEach(c => {
      c.classList.toggle('is-active', c.dataset.id === id);
    });
  }
  function renderPanel(d) {
    panelEmpty.hidden = true;
    panelContent.hidden = false;
    panelContent.innerHTML = `
      <img src="${d.img}" alt="${d.nombre}" />
      <span class="region">${d.region}</span>
      <h3>${d.nombre} ${d.flag}</h3>
      <p>${d.desc}</p>
      <div class="features">${d.features.map(f => `<span>${f}</span>`).join('')}</div>
      <div class="meta">
        <div><span>Precio desde</span><strong>${d.precio}</strong></div>
        <div><span>Duración</span><strong>${d.duracion}</strong></div>
        <div><span>Mejor temporada</span><strong>${d.temporada}</strong></div>
        <div><span>Viendo ahora</span><strong>${d.viewers}</strong></div>
      </div>
      <span class="viewers"><span class="pulse"></span><strong>${d.viewers}</strong> personas viendo este destino</span>
      <a class="btn btn--whatsapp" target="_blank" rel="noopener"
         href="https://wa.me/${D.whatsapp}?text=${encodeURIComponent(`Hola PARAISOS, quiero cotizar un viaje a ${d.nombre}. Vi su información en el mapa interactivo.`)}">
        Cotizar este destino
      </a>`;
  }

  chipsHost.innerHTML = destinos.map(d =>
    `<button class="map-3d__chip" data-id="${d.id}">${d.flag} ${d.nombre}</button>`
  ).join('');
  chipsHost.addEventListener('click', (e) => {
    const b = e.target.closest('.map-3d__chip');
    if (b) selectDestino(b.dataset.id, true);
  });

  /* ---------------------------------------------------------------------
     RENDER LOOP
     --------------------------------------------------------------------- */
  const tmpV = new THREE.Vector3();
  const clock = new THREE.Clock();

  function tick() {
    const t = clock.getElapsedTime();
    const dt = clock.getDelta();

    if (!isDragging) {
      velY *= 0.93; velX *= 0.93;
      rotY += velY; rotX += velX;
      if (autoRotate()) rotY += 0.0018;
    }
    rotX = Math.max(0.15, Math.min(1.2, rotX));

    [countryGroup, pinGroup, arcGroup, boat, cloudGroup].forEach(o => { o.rotation.y = rotY; });
    grid.rotation.y = rotY;

    const r = zoom;
    camera.position.x = 0;
    camera.position.y = r * Math.sin(rotX);
    camera.position.z = r * Math.cos(rotX);
    camera.lookAt(0, 0, 0);

    if (compassNeedle) {
      compassNeedle.style.transform = `rotate(${(-rotY * 180 / Math.PI) % 360}deg)`;
    }

    if (flyTo) {
      flyTo.t = Math.min(flyTo.t + dt * 1.4, 1);
      const angle = Math.atan2(flyTo.x, flyTo.z);
      rotY = rotY + (-angle - rotY) * 0.06;
      zoom += (14 - zoom) * 0.05;
      if (flyTo.t >= 1) flyTo = null;
    }

    // Océano
    for (let i = 0; i < oPos.count; i++) {
      const x = oPos.getX(i), y = oPos.getY(i);
      const w = Math.sin(x * 0.4 + t * 1.2) * 0.07 + Math.cos(y * 0.3 + t * 0.9) * 0.06;
      oPos.setZ(i, oInit[i] + w);
    }
    oPos.needsUpdate = true;

    // Foam particles
    for (let i = 0; i < foamCount; i++) {
      const idx = i * 3;
      foamPos[idx+1] = -0.15 + Math.sin(t * 1.5 + foamPhase[i]) * 0.08 + 0.05;
      foamPos[idx]   += Math.sin(t * 0.3 + foamPhase[i]) * 0.002;
      foamPos[idx+2] += Math.cos(t * 0.4 + foamPhase[i]) * 0.002;
      if (foamPos[idx] > 20) foamPos[idx] = -20;
      if (foamPos[idx+2] > 20) foamPos[idx+2] = -20;
    }
    foamGeo.attributes.position.needsUpdate = true;

    // Pins bobbing + halos
    pins.forEach((p, i) => {
      const phase = t * 1.5 + i * 0.6;
      p.userData.head.position.y = p.userData.baseY + 0.5 + Math.sin(phase) * 0.06;
      p.userData.halo1.scale.setScalar(0.9 + Math.sin(phase) * 0.2);
      p.userData.halo1.material.opacity = 0.6 + Math.sin(phase) * 0.25;
      p.userData.halo2.scale.setScalar(1.5 + Math.sin(phase * 0.8 + 1) * 0.3);
      p.userData.halo2.material.opacity = 0.25 + Math.sin(phase * 0.8) * 0.15;
      p.userData.ring.scale.setScalar(1 + Math.sin(phase * 1.3) * 0.08);
    });

    // Nubes
    cloudGroup.children.forEach((cl) => {
      cl.position.x += cl.userData.drift;
      cl.position.y += Math.sin(t * 0.5 + cl.userData.bob) * 0.003;
      if (cl.position.x > 15) cl.position.x = -15;
      if (cl.position.x < -15) cl.position.x = 15;
    });

    // Arcos
    arcs.forEach(a => {
      const u = ((t * 0.18 + a.phase) % 1);
      a.dot.position.copy(a.curve.getPoint(u));
      a.dot.scale.setScalar(0.8 + Math.sin(t * 6) * 0.15);
    });

    // Barco
    const boatU = (t * 0.06) % 1;
    const idx = Math.floor(boatU * boatPath.length);
    const next = (idx + 1) % boatPath.length;
    const local = (boatU * boatPath.length) % 1;
    boat.position.x = boatPath[idx].x + (boatPath[next].x - boatPath[idx].x) * local;
    boat.position.z = boatPath[idx].z + (boatPath[next].z - boatPath[idx].z) * local;
    boat.position.y = -0.05 + Math.sin(t * 3) * 0.03;
    boat.rotation.y = Math.atan2(boatPath[next].x - boatPath[idx].x, boatPath[next].z - boatPath[idx].z) + Math.PI + rotY;

    // Proyectar labels
    pins.forEach(p => {
      const label = p.userData.label;
      p.userData.head.getWorldPosition(tmpV);
      tmpV.project(camera);
      const sx = (tmpV.x * 0.5 + 0.5) * W();
      const sy = (-tmpV.y * 0.5 + 0.5) * H();
      const visible = tmpV.z < 1 && tmpV.z > -1;
      label.style.display = visible ? '' : 'none';
      label.style.left = sx + 'px';
      label.style.top  = sy + 'px';
    });

    if (!popup.hidden && popup.dataset.id) {
      const pin = pins.find(p => p.userData.id === popup.dataset.id);
      if (pin) {
        pin.userData.head.getWorldPosition(tmpV);
        tmpV.project(camera);
        popup.style.left = ((tmpV.x * 0.5 + 0.5) * W()) + 'px';
        popup.style.top  = ((-tmpV.y * 0.5 + 0.5) * H()) + 'px';
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  function resize() {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  }
  window.addEventListener('resize', resize);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { popup.hidden = true; popup.dataset.id = ''; }
  });
  document.addEventListener('click', (e) => {
    if (!popup.hidden && !e.target.closest('#mapPopup') && !e.target.closest('canvas') && !e.target.closest('.map-3d__chip') && !e.target.closest('.map-3d__label')) {
      popup.hidden = true;
    }
  });

  /* ---------------------------------------------------------------------
     ARRANQUE: empezamos el render loop YA mismo para que el usuario vea
     océano, cielo, nubes, pins, barco, arcos desde el primer frame.
     Luego cargamos el GeoJSON en paralelo (con timeout). El país aparece
     cuando esté listo (real o fallback).
     --------------------------------------------------------------------- */
  tick();

  // Orden de prioridad: archivo local (servido por start-server.bat), luego
  // el Gist público como fallback de red. Los URLs antiguos (john-guerra/
  // colombia_geojson) devuelven 404 — el repo fue movido.
  const GEO_URLS = [
    'assets/data/colombia.geo.json',
    'https://gist.githubusercontent.com/john-guerra/43c7656821069d00dcbc/raw/3aadedf47badbdac823b00dbe259f6bc6d9e1899/colombia.geo.json'
  ];
  const FETCH_TIMEOUT_MS = 8000;

  function fetchWithTimeout(url, ms) {
    return Promise.race([
      fetch(url, { mode: 'cors' }).then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))),
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

  // Cuando la página se abre con file:// (doble-click en index.html), el
  // navegador trata cada file:// como origen único y bloquea TODO fetch
  // cross-origin (también iframes externos). En ese caso vamos directo
  // al fallback sin perder 6s en el timeout.
  const isFileProtocol = location.protocol === 'file:';

  (async () => {
    let ok = false;
    if (!isFileProtocol) {
      try {
        const geo = await fetchGeo();
        if (geo) ok = buildCountryFromGeoJSON(geo);
      } catch (e) {
        console.warn('[mapa] error al construir GeoJSON', e);
      }
    } else {
      console.info('[mapa] file:// detectado · saltando fetch · usando outline embebido. Para el mapa con 33 departamentos reales, ejecuta start-server.bat.');
    }
    if (!ok) buildCountryFallback();
    loadingEl.style.opacity = '0';
    setTimeout(() => loadingEl && loadingEl.remove(), 400);
  })();
})();
