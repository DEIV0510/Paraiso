/* =====================================================================
   PARAISOS — main.js
   Orquestación general:
   - Loader, navbar inteligente, progress bar, sticky CTA mobile
   - Smooth scroll Lenis-style (vanilla, sin dependencias)
   - Cursor custom con label dinámico
   - Magnetic buttons (cursor empuja al elemento)
   - Text reveals palabra-por-palabra / línea-por-línea con stagger
   - ScrollTrigger orchestration: proceso timeline, contadores, parallax
   - Galería + lightbox + filtros
   - Testimonios carousel (auto + nav + dots)
   - Forms newsletter / contacto → WhatsApp
   - Floating: chat widget, scroll-top, cookie banner
   - Avión de papel 3D Three.js (hero)
   - Tilt 3D real en cards de destinos
   ===================================================================== */

'use strict';

/* ------------------ DATOS COMPARTIDOS ------------------ */
window.PARAISOS_DATA = {
  whatsapp: '573157347306',
  email: 'gerencia.paraisos@gmail.com',
  emailAlt: 'agenciadeviajesparaisos@gmail.com',
  slogan: 'Más que un destino turístico, somos territorio de vida',
  destinos: [
    { id:'putumayo', nombre:'Putumayo · Nuestra casa', flag:'🇨🇴', region:'Andino-amazónica · Sur de Colombia',
      lat:1.15, lng:-76.65,
      img:'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=70',
      desc:'Territorio andino-amazónico con 3 Parques Nacionales Naturales, 15 pueblos indígenas, cascadas, ríos cristalinos y experiencias vivenciales únicas. Aquí nacen las nubes que dan vida al sur de Colombia.',
      categoria:'Aventura & Cultura', tag:'Territorio de vida',
      features:['Fin del Mundo','Cascada Hornoyaco','Cañón Mandiyaco','Limpia con taita','Sembrando vida','Yagesito','Ruta del cacao','Kayaking & Rappel'],
      precio:'$1.490.000 COP', duracion:'4–7 días', temporada:'Todo el año', viewers:128 },
    { id:'cartagena', nombre:'Cartagena', flag:'🇨🇴', region:'Caribe colombiano',
      lat:10.39, lng:-75.51,
      img:'https://images.unsplash.com/photo-1583309217394-d178fff204d0?auto=format&fit=crop&w=900&q=70',
      desc:'Murallas coloniales, calles empedradas y atardeceres frente al Caribe. La ciudad heroica te espera.',
      categoria:'Playa & Cultura', tag:'UNESCO',
      features:['Centro histórico','Islas del Rosario','Gastronomía','Atardeceres'],
      precio:'$1.290.000 COP', duracion:'4–6 días', temporada:'Diciembre – Abril', viewers:142 },
    { id:'san-andres', nombre:'San Andrés', flag:'🇨🇴', region:'Isla del Caribe',
      lat:12.58, lng:-81.71,
      img:'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=900&q=70',
      desc:'El mar de los siete colores, snorkel en arrecifes vivos y playas de arena blanca.',
      categoria:'Playa', tag:'Top',
      features:['Mar 7 colores','Snorkel','Hoyo Soplador','Johnny Cay'],
      precio:'$1.690.000 COP', duracion:'4–7 días', temporada:'Enero – Mayo', viewers:198 },
    { id:'santa-marta', nombre:'Santa Marta', flag:'🇨🇴', region:'Caribe colombiano',
      lat:11.24, lng:-74.21,
      img:'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?auto=format&fit=crop&w=900&q=70',
      desc:'Donde la sierra nevada se besa con el mar. Tayrona, Minca y playas eternas.',
      categoria:'Playa & Naturaleza', tag:'Aventura',
      features:['PNN Tayrona','Minca','Ciudad Perdida','Snorkel'],
      precio:'$1.190.000 COP', duracion:'4–6 días', temporada:'Diciembre – Marzo', viewers:113 },
    { id:'eje-cafetero', nombre:'Eje Cafetero', flag:'🇨🇴', region:'Andes colombianos',
      lat:4.81, lng:-75.69,
      img:'https://images.unsplash.com/photo-1606820854416-439b3305ff39?auto=format&fit=crop&w=900&q=70',
      desc:'Valle del Cocora, palmas de cera y haciendas cafeteras. El paisaje cultural patrimonio.',
      categoria:'Naturaleza', tag:'UNESCO',
      features:['Valle del Cocora','Tour del café','Salento','Termales'],
      precio:'$1.090.000 COP', duracion:'4–5 días', temporada:'Todo el año', viewers:87 },
    { id:'tumaco', nombre:'Tumaco', flag:'🇨🇴', region:'Pacífico colombiano',
      lat:1.81, lng:-78.76,
      img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=70',
      desc:'La perla del Pacífico. Playas vírgenes, manglares y avistamiento de ballenas.',
      categoria:'Playa & Naturaleza', tag:'Off the beaten path',
      features:['Ballenas jorobadas','Manglares','Cocoteros','Cultura afro'],
      precio:'$1.390.000 COP', duracion:'4–6 días', temporada:'Julio – Octubre', viewers:41 },
    { id:'huila', nombre:'Huila', flag:'🇨🇴', region:'Sur Andes',
      lat:2.93, lng:-75.28,
      img:'https://images.unsplash.com/photo-1601921004897-b7d2080c64ac?auto=format&fit=crop&w=900&q=70',
      desc:'Desierto de la Tatacoa, parque arqueológico San Agustín y cielos sin igual.',
      categoria:'Aventura & Cultura', tag:'UNESCO',
      features:['Desierto Tatacoa','San Agustín','Astronomía','Café'],
      precio:'$990.000 COP', duracion:'3–5 días', temporada:'Junio – Septiembre', viewers:62 },
    { id:'atacames', nombre:'Atacames', flag:'🇪🇨', region:'Ecuador · Pacífico',
      lat:0.86, lng:-79.85,
      img:'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=900&q=70',
      desc:'Playas ecuatorianas con sabor a coco, rumba y descanso a precios increíbles.',
      categoria:'Playa', tag:'Internacional',
      features:['Playa','Rumba','Gastronomía','Spa'],
      precio:'$2.190.000 COP', duracion:'6–8 días', temporada:'Junio – Octubre', viewers:74 }
  ]
};

const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
const D = window.PARAISOS_DATA;
const isMobile = matchMedia('(hover: none) and (pointer: coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ======================================================================
   SMOOTH SCROLL VANILLA (Lenis-style)
   - Reemplaza el scroll nativo con interpolación lineal hacia un target.
   - No usa raf-throttle externo, todo en un único ticker.
   - Respeta anchors internos y emite refresh para ScrollTrigger.
   ====================================================================== */
class SmoothScroll {
  constructor() {
    this.target = window.scrollY;
    this.current = window.scrollY;
    this.ease = 0.1;
    this.enabled = !isMobile && !reducedMotion;
    if (!this.enabled) return;
    document.documentElement.classList.add('has-lenis');

    window.addEventListener('scroll', () => {
      this.target = window.scrollY;
    }, { passive: true });

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - 70;
      this.scrollTo(y);
    });

    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }
  scrollTo(y) {
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  tick() {
    if (!this.enabled) return;
    this.current += (this.target - this.current) * this.ease;
    if (Math.abs(this.target - this.current) < 0.5) this.current = this.target;
    // Aplicamos transform al main para crear el efecto smooth visual sutil
    // (sin reemplazar el scroll nativo, lo que rompería el wheel).
    if (window.ScrollTrigger && typeof window.ScrollTrigger.update === 'function') {
      window.ScrollTrigger.update();
    }
    requestAnimationFrame(this.tick);
  }
}
new SmoothScroll();

/* ======================================================================
   LOADER
   ====================================================================== */
window.addEventListener('load', () => {
  const loader = $('#loader');
  if (!loader) return;

  // Mouse parallax 3D solo en desktop (no aplica en touch). El logo
  // sigue al cursor en perspectiva mientras el loader está visible.
  const wrap = $('#loaderWrap');
  if (wrap && !isMobile && !reducedMotion) {
    let raf = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e) => {
      const w = innerWidth, h = innerHeight;
      cx = (e.clientX / w - 0.5) * 2;
      cy = (e.clientY / h - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    function loop() {
      tx += (cx - tx) * 0.1;
      ty += (cy - ty) * 0.1;
      wrap.style.animation = 'ldStageIn 1.4s .2s cubic-bezier(.16,1,.3,1) forwards';
      wrap.style.transform = `rotateY(${tx * 12}deg) rotateX(${-ty * 8}deg) translateZ(30px)`;
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else { raf = null; }
    }
    loader.addEventListener('mousemove', onMove);
  }

  // Tiempo del loader: mobile 2.2s (más rápido) · desktop 3.5s (animación completa)
  const loadDuration = isMobile ? 2200 : 3500;
  setTimeout(() => {
    loader.classList.add('is-hidden');
    document.body.classList.add('is-loaded');
    requestAnimationFrame(() => triggerInitialReveals());
  }, loadDuration);
});

/* ======================================================================
   NAVBAR INTELIGENTE (scrolled, hide-on-scroll-down, progress bar,
   menu hamburger, active link según sección visible)
   ====================================================================== */
(function navbar() {
  const nav = $('#navbar');
  const burger = $('#navBurger');
  const progress = $('#navProgress');
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    // Esconder al scroll down rápido, mostrar al up
    if (y > 200 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
    // Progress bar
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();

  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
  });
  $$('.navbar__menu a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }));

  // Active link según sección en viewport
  const sections = $$('main section[id]');
  const links = $$('.navbar__menu a');
  const ioActive = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => ioActive.observe(s));
})();

/* ======================================================================
   CURSOR PERSONALIZADO con label dinámico
   ====================================================================== */
(function cursor() {
  if (isMobile) return;
  const cur = $('.cursor');
  if (!cur) return;
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const label = $('.cursor__label');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  function tick() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.transform  = `translate(${mx}px, ${my}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    label.style.transform = `translate(${mx + 20}px, ${my + 12}px)`;
    requestAnimationFrame(tick);
  }
  tick();
  document.addEventListener('mouseover', (e) => {
    const hover = e.target.closest('a, button, .wiz-card, .dest-card, summary, [data-cursor-label]');
    cur.classList.toggle('is-hover', !!hover);
    const lbl = hover?.getAttribute('data-cursor-label');
    if (lbl) {
      label.textContent = lbl;
      cur.classList.add('has-label');
    } else {
      cur.classList.remove('has-label');
    }
  });
  document.addEventListener('mousedown', () => cur.classList.add('is-drag'));
  document.addEventListener('mouseup',   () => cur.classList.remove('is-drag'));
})();

/* ======================================================================
   MAGNETIC BUTTONS
   El elemento sigue ligeramente al cursor cuando está cerca, creando
   una sensación de imán. Se aplica via [data-magnetic].
   ====================================================================== */
(function magnetic() {
  if (isMobile || reducedMotion) return;
  $$('[data-magnetic]').forEach(el => {
    const strength = parseFloat(el.dataset.magneticStrength || '0.35');
    let raf = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    el.addEventListener('mouseenter', () => {
      el.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
    });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      cx = (e.clientX - r.left - r.width / 2) * strength;
      cy = (e.clientY - r.top - r.height / 2) * strength;
      el.style.transition = 'transform .15s cubic-bezier(.2,.7,.2,1)';
      if (!raf) raf = requestAnimationFrame(animate);
      // Ripple position para .btn
      const ripple = el.querySelector('.btn__ripple');
      if (ripple) {
        ripple.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        ripple.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      }
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .55s cubic-bezier(.34,1.56,.64,1)';
      tx = 0; ty = 0;
      el.style.transform = '';
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
    function animate() {
      tx += (cx - tx) * 0.18;
      ty += (cy - ty) * 0.18;
      el.style.transform = `translate(${tx}px, ${ty}px)`;
      raf = requestAnimationFrame(animate);
    }
  });
})();

/* ======================================================================
   TEXT REVEALS palabra-por-palabra / línea-por-línea
   - Para .reveal-line: cada hijo directo se envuelve en un span y se
     anima desde translateY(110%) opacity 0 → 0/1.
   - Para .reveal-up: el elemento aparece desde abajo con stagger.
   ====================================================================== */
function prepareReveals() {
  // Líneas: ya están envueltas en HTML — solo aseguramos el inner span
  $$('.reveal-line').forEach(line => {
    if (line.children.length === 0) {
      const inner = document.createElement('span');
      inner.textContent = line.textContent;
      line.textContent = '';
      line.appendChild(inner);
    }
  });
  // Aplicar delays incrementales en hijos directos de elementos con clase .reveal-up dentro de un padre con .stagger
  $$('.stagger').forEach(parent => {
    $$(':scope > *', parent).forEach((child, i) => {
      child.style.setProperty('--d', (i * 0.08) + 's');
    });
  });
}
function triggerInitialReveals() {
  // Hero: revelar inmediatamente
  $$('.hero .reveal-line, .hero .reveal-up').forEach((el, i) => {
    setTimeout(() => {
      const parent = el.classList.contains('reveal-line') ? el : null;
      const target = parent || el;
      target.classList.add('is-revealed');
      // En .reveal-line también añadimos clase al padre si es necesario
      const grand = el.closest('.hero__title, .hero__content');
      if (grand && !grand.classList.contains('is-revealed')) {
        grand.classList.add('is-revealed');
      }
    }, 150 + i * 120);
  });
}
prepareReveals();

/* ======================================================================
   SCROLL REVEALS GENÉRICOS (para no-hero)
   ====================================================================== */
(function reveal() {
  const selectors = [
    '.section-head', '.map-3d', '.wizard', '.cruise-card', '.dest-card',
    '.experience__media', '.experience__content',
    '.testimonial', '.accordion details', '.contact__info', '.contact__form',
    '.cta-final__inner', '.newsletter__inner', '.process__step',
    // Nuevas secciones del portafolio 2026
    '.exp-card', '.service-card', '.ally-card', '.mvv__card', '.policy',
    '.putumayo__media', '.putumayo__intro', '.putumayo__highlights li',
    '.act-chip'
  ].join(',');
  $$(selectors).forEach(el => {
    if (!el.closest('.hero')) el.classList.add('reveal');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        // Activar reveals dentro
        $$('.reveal-line, .reveal-up', e.target).forEach(el => {
          const target = el.classList.contains('reveal-line') ? el : el;
          target.classList.add('is-revealed');
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
})();

/* ======================================================================
   PROCESO TIMELINE (línea naranja se llena + steps active)
   ====================================================================== */
(function processTimeline() {
  const tl = $('#processTimeline');
  if (!tl) return;
  const fill = $('#processLine');
  const steps = $$('.process__step', tl);
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    // Animar línea
    fill.style.width = '100%';
    // Activar pasos con stagger
    steps.forEach((s, i) => {
      setTimeout(() => s.classList.add('is-active'), 400 + i * 400);
    });
    io.disconnect();
  }, { threshold: 0.3 });
  io.observe(tl);
})();

/* ======================================================================
   CONTADORES animados con easeOutCubic
   ====================================================================== */
(function counters() {
  const els = $$('[data-count-to]');
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = parseFloat(el.dataset.countTo);
      const decimals = parseInt(el.dataset.decimal || '0', 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1800;
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const val = to * (1 - Math.pow(1 - t, 3));
        el.textContent = val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
})();

/* ======================================================================
   PARALLAX HERO (cards siguen el mouse en eje X/Y)
   ====================================================================== */
(function heroParallax() {
  if (isMobile || reducedMotion) return;
  const hero = $('.hero__visual');
  if (!hero) return;
  const cards = $$('[data-parallax]', hero);
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    cards.forEach(card => {
      const f = parseFloat(card.dataset.parallax) || 0.05;
      const rot = card.style.getPropertyValue('--rot') || '0deg';
      card.style.transform = `translate3d(${cx * 30 * f * 4}px, ${cy * 30 * f * 4}px, 0) rotate(${rot})`;
    });
  });
  hero.addEventListener('mouseleave', () => {
    cards.forEach(c => c.style.transform = '');
  });
})();

/* ======================================================================
   AVIÓN DE PAPEL 3D (Three.js) — figura-8 con trail
   ====================================================================== */
(function paperPlane() {
  const host = $('#paperPlane');
  if (!host || !window.THREE) return;

  const w = host.clientWidth, h = host.clientHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const planeGroup = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: .55, metalness: .05 });
  const matShade = new THREE.MeshStandardMaterial({ color: 0xE3F0FB, side: THREE.DoubleSide, roughness: .65 });

  const g1 = new THREE.BufferGeometry();
  g1.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,  -1.4, -0.5, 0,   1.4, -0.5, 0
  ], 3));
  g1.computeVertexNormals();
  planeGroup.add(new THREE.Mesh(g1, mat));

  const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,  0, -0.5, .4,   0, -0.5, -.4
  ], 3));
  g2.computeVertexNormals();
  planeGroup.add(new THREE.Mesh(g2, matShade));

  planeGroup.scale.set(.9, .9, .9);
  scene.add(planeGroup);

  // Trail
  const trailGeo = new THREE.BufferGeometry();
  const trailPts = new Float32Array(40 * 3);
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPts, 3));
  const trailMat = new THREE.PointsMaterial({ color: 0xFFB74D, size: .09, transparent: true, opacity: .7 });
  scene.add(new THREE.Points(trailGeo, trailMat));

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(3, 4, 5);
  scene.add(dir);

  let t = 0;
  function animate() {
    t += 0.012;
    const x = Math.sin(t * 0.8) * 2.4;
    const y = Math.sin(t * 1.4) * 0.7 + 0.2;
    const z = Math.cos(t * 0.8) * 1.0;
    planeGroup.position.set(x, y, z);
    planeGroup.rotation.y = Math.atan2(Math.cos(t * 0.8) * 2.4, -Math.sin(t * 0.8) * 1.0) + Math.PI;
    planeGroup.rotation.z = Math.cos(t * 1.4) * 0.2;
    planeGroup.rotation.x = -0.1;

    for (let i = trailPts.length / 3 - 1; i > 0; i--) {
      trailPts[i*3]   = trailPts[(i-1)*3];
      trailPts[i*3+1] = trailPts[(i-1)*3+1];
      trailPts[i*3+2] = trailPts[(i-1)*3+2];
    }
    trailPts[0] = x; trailPts[1] = y; trailPts[2] = z;
    trailGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    const W = host.clientWidth, H = host.clientHeight;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
})();

/* ======================================================================
   LIVE COUNTER HERO (simulado, ondula entre 28–58)
   ====================================================================== */
(function liveCounter() {
  const el = $('#liveCounter');
  if (!el) return;
  let n = 37;
  setInterval(() => {
    n += Math.random() > 0.5 ? 1 : -1;
    n = Math.max(28, Math.min(58, n));
    el.textContent = n;
  }, 3500);
})();

/* ======================================================================
   DESTINOS GRID con tilt 3D real
   ====================================================================== */
(function destinosGrid() {
  const grid = $('#destinosGrid');
  if (!grid) return;
  grid.innerHTML = D.destinos.map(d => `
    <article class="dest-card" data-id="${d.id}" data-magnetic data-magnetic-strength="0.15" data-cursor-label="Ver">
      <div class="dest-card__inner">
        <img loading="lazy" src="${d.img}" alt="${d.nombre}" />
        <span class="dest-card__cat">${d.categoria}</span>
        <span class="dest-card__viewers"><span class="pulse"></span><span>${d.viewers}</span> viendo</span>
        <div class="dest-card__overlay">
          <span class="dest-card__tag">${d.tag}</span>
          <h3>${d.nombre} ${d.flag}</h3>
          <p class="dest-card__desc">${d.desc}</p>
          <div class="dest-card__meta">
            <span>${d.region}</span>
            <span><strong>${d.precio}</strong></span>
          </div>
        </div>
        <span class="dest-card__cta">Cotizar por WhatsApp →</span>
      </div>
    </article>
  `).join('');

  // Re-aplicar magnetic a las cards recién creadas
  $$('.dest-card', grid).forEach(card => {
    const inner = $('.dest-card__inner', card);
    if (!isMobile && !reducedMotion) {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)`;
      });
      card.addEventListener('mouseleave', () => { inner.style.transform = ''; });
    }
    card.addEventListener('click', () => {
      const d = D.destinos.find(x => x.id === card.dataset.id);
      const msg = encodeURIComponent(`Hola PARAISOS, quiero cotizar un viaje a ${d.nombre}. ¿Me podrían enviar opciones?`);
      window.open(`https://wa.me/${D.whatsapp}?text=${msg}`, '_blank');
    });
  });
})();

/* ======================================================================
   GALERÍA + LIGHTBOX + FILTROS
   ====================================================================== */
(function galeria() {
  const grid = $('#galGrid');
  const filters = $('#galFilters');
  if (!grid) return;

  const fotos = [
    {src:'https://images.unsplash.com/photo-1583309217394-d178fff204d0?auto=format&fit=crop&w=700&q=65', cat:'cartagena', alt:'Cartagena'},
    {src:'https://images.unsplash.com/photo-1554310603-d39d43033735?auto=format&fit=crop&w=700&q=65', cat:'cartagena', alt:'Cartagena calle'},
    {src:'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?auto=format&fit=crop&w=700&q=65', cat:'cartagena', alt:'Cartagena murallas'},
    {src:'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=700&q=65', cat:'san-andres', alt:'San Andrés'},
    {src:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=65', cat:'san-andres', alt:'Playa San Andrés'},
    {src:'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=700&q=65', cat:'san-andres', alt:'Mar caribe'},
    {src:'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?auto=format&fit=crop&w=700&q=65', cat:'santa-marta', alt:'Santa Marta'},
    {src:'https://images.unsplash.com/photo-1535850579364-6bef6c20ae42?auto=format&fit=crop&w=700&q=65', cat:'santa-marta', alt:'Tayrona'},
    {src:'https://images.unsplash.com/photo-1606820854416-439b3305ff39?auto=format&fit=crop&w=700&q=65', cat:'eje-cafetero', alt:'Eje cafetero'},
    {src:'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=700&q=65', cat:'eje-cafetero', alt:'Café'},
    {src:'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=700&q=65', cat:'atacames', alt:'Atacames'},
    {src:'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?auto=format&fit=crop&w=700&q=65', cat:'cruceros', alt:'Crucero Caribe'},
    {src:'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=700&q=65', cat:'cruceros', alt:'Crucero Mediterráneo'},
    {src:'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=700&q=65', cat:'cruceros', alt:'Crucero Asia'},
    {src:'https://images.unsplash.com/photo-1601921004897-b7d2080c64ac?auto=format&fit=crop&w=700&q=65', cat:'huila', alt:'Tatacoa'},
    {src:'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=65', cat:'putumayo', alt:'Selva Putumayo'},
    {src:'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=700&q=65', cat:'cartagena', alt:'Atardecer caribe'},
    {src:'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=700&q=65', cat:'san-andres', alt:'Buceo'},
    {src:'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=700&q=65', cat:'eje-cafetero', alt:'Cocora'},
    {src:'https://images.unsplash.com/photo-1525428039590-2dc9f0b41bb1?auto=format&fit=crop&w=700&q=65', cat:'santa-marta', alt:'Sierra nevada'}
  ];
  const cats = ['todas', ...new Set(fotos.map(f => f.cat))];
  filters.innerHTML = cats.map((c, i) =>
    `<button class="${i===0?'is-active':''}" data-cat="${c}">${c.replace('-', ' ')}</button>`
  ).join('');
  function render(cat) {
    grid.innerHTML = fotos
      .filter(f => cat === 'todas' || f.cat === cat)
      .map(f => `<figure><img loading="lazy" src="${f.src}" alt="${f.alt}" /></figure>`)
      .join('');
  }
  render('todas');
  filters.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', filters).forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    render(b.dataset.cat);
  });

  const lb = $('#lightbox');
  const lbImg = $('#lightboxImg');
  grid.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    lbImg.src = img.src.replace('&w=700', '&w=1600');
    lbImg.alt = img.alt;
    lb.hidden = false;
    document.body.classList.add('no-scroll');
  });
  lb.addEventListener('click', () => {
    lb.hidden = true;
    document.body.classList.remove('no-scroll');
  });
})();

/* ======================================================================
   TESTIMONIOS CAROUSEL (auto + manual)
   ====================================================================== */
(function testimonios() {
  const track = $('#testTrack');
  const dots = $('#testDots');
  const prev = $('#testPrev');
  const next = $('#testNext');
  if (!track) return;
  const items = [
    { name:'María Camila Restrepo', city:'Medellín · Cartagena 2025', avatar:'https://i.pravatar.cc/120?img=47', stars:5, q:'Una experiencia impecable. PARAISOS organizó cada detalle de mi luna de miel en Cartagena. Repetiremos sin dudarlo.' },
    { name:'Juan David Pérez', city:'Bogotá · Crucero Caribe 2024', avatar:'https://i.pravatar.cc/120?img=12', stars:5, q:'Mi primer crucero y fue una locura. El asesor estuvo pendiente todo el viaje por WhatsApp. 10/10.' },
    { name:'Laura Sofía García', city:'Cali · Eje Cafetero 2025', avatar:'https://i.pravatar.cc/120?img=32', stars:5, q:'Perfecto para viajar en familia. Mis hijos amaron el Cocora y los precios fueron muy honestos.' },
    { name:'Andrés Felipe Ruiz', city:'Pereira · San Andrés 2025', avatar:'https://i.pravatar.cc/120?img=15', stars:5, q:'Sentí confianza desde la primera llamada. Cumplieron absolutamente todo lo prometido.' },
    { name:'Diana Patricia Mejía', city:'Barranquilla · Europa 2024', avatar:'https://i.pravatar.cc/120?img=44', stars:5, q:'Crucero por el Mediterráneo soñado. Itinerario impecable y atención post-venta inigualable.' },
    { name:'Carlos Andrés López', city:'Bucaramanga · Tayrona 2025', avatar:'https://i.pravatar.cc/120?img=22', stars:5, q:'Aventura organizada con detalle. Guías locales increíbles, todo cuadrado al milímetro.' }
  ];
  track.innerHTML = items.map(t => `
    <article class="testimonial">
      <div class="testimonial__stars" aria-label="${t.stars} de 5 estrellas">${'★'.repeat(t.stars)}</div>
      <p class="testimonial__quote">${t.q}</p>
      <div class="testimonial__author">
        <img src="${t.avatar}" alt="${t.name}" loading="lazy" />
        <div><strong>${t.name}</strong><em>${t.city}</em></div>
      </div>
    </article>
  `).join('');

  const slidesPerView = () => innerWidth >= 1100 ? 3 : innerWidth >= 880 ? 2 : 1;
  let idx = 0;
  const max = () => Math.max(0, items.length - slidesPerView());
  function render() {
    const w = $('.testimonial', track).getBoundingClientRect().width + 24;
    track.style.transform = `translateX(${-idx * w}px)`;
    dots.innerHTML = Array.from({length: max() + 1}, (_, i) =>
      `<button class="${i===idx?'is-active':''}" data-i="${i}" aria-label="Ir al testimonio ${i+1}"></button>`
    ).join('');
  }
  render();
  dots.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    idx = +b.dataset.i; render();
  });
  prev.addEventListener('click', () => { idx = idx <= 0 ? max() : idx - 1; render(); });
  next.addEventListener('click', () => { idx = idx >= max() ? 0 : idx + 1; render(); });
  let auto = setInterval(() => { idx = (idx + 1) > max() ? 0 : idx + 1; render(); }, 6000);
  // Pausa al hover
  track.addEventListener('mouseenter', () => clearInterval(auto));
  track.addEventListener('mouseleave', () => { auto = setInterval(() => { idx = (idx + 1) > max() ? 0 : idx + 1; render(); }, 6000); });
  window.addEventListener('resize', () => { idx = Math.min(idx, max()); render(); });
})();

/* ======================================================================
   NEWSLETTER
   ====================================================================== */
(function newsletter() {
  const form = $('#newsForm');
  const ok = $('#newsOk');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#newsEmail').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      $('#newsEmail').focus();
      return;
    }
    ok.hidden = false;
    form.reset();
    setTimeout(() => { ok.hidden = true; }, 5000);
  });
})();

/* ======================================================================
   CONTACT FORM → WhatsApp
   ====================================================================== */
(function contactForm() {
  const form = $('#contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const required = ['name', 'phone', 'email'];
    let valid = true;
    required.forEach(k => {
      const input = form.querySelector(`[name="${k}"]`);
      const field = input.closest('.field');
      const v = String(fd.get(k) || '').trim();
      const ok = v && (k !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
      field.classList.toggle('is-error', !ok);
      if (!ok) valid = false;
    });
    if (!valid) return;
    const msg =
`Hola PARAISOS, soy *${fd.get('name')}* y quiero más información.
📍 Destino: ${fd.get('destino')}
📞 Tel: ${fd.get('phone')}
✉️ Email: ${fd.get('email')}

📝 ${fd.get('msg') || 'Sin mensaje adicional.'}`;
    window.open(`https://wa.me/${D.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  });
})();

/* ======================================================================
   FLOATING: chat widget
   ====================================================================== */
(function chatWidget() {
  const toggle = $('#chatToggle');
  const box = $('#chatBox');
  const close = $('#chatClose');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    box.hidden = !box.hidden;
    if (!box.hidden) {
      const badge = toggle.querySelector('.chat-widget__badge');
      if (badge) badge.style.display = 'none';
    }
  });
  close.addEventListener('click', () => { box.hidden = true; });
  $$('.chat-widget__quick button').forEach(b => {
    b.addEventListener('click', () => {
      const msg = encodeURIComponent(`Hola PARAISOS, ${b.dataset.q.toLowerCase()}.`);
      window.open(`https://wa.me/${D.whatsapp}?text=${msg}`, '_blank');
    });
  });
})();

/* ======================================================================
   STICKY CTA MOBILE: aparece al pasar el hero
   ====================================================================== */
(function stickyCta() {
  const cta = $('#stickyCta');
  if (!cta) return;
  const hero = $('.hero');
  const io = new IntersectionObserver((entries) => {
    cta.classList.toggle('is-visible', !entries[0].isIntersecting);
  }, { threshold: 0.05 });
  io.observe(hero);
})();

/* ======================================================================
   MISCELÁNEA: scroll-top, cookies, year
   ====================================================================== */
/* ======================================================================
   TIENDA · filtro de categorías de productos
   ====================================================================== */
(function shopFilter() {
  const cats = $$('.shop-cat');
  const products = $$('.product-card');
  if (!cats.length || !products.length) return;
  cats.forEach(b => b.addEventListener('click', () => {
    cats.forEach(c => c.classList.remove('is-active'));
    b.classList.add('is-active');
    const cat = b.dataset.cat;
    products.forEach(p => {
      const show = cat === 'todos' || p.dataset.cat === cat;
      p.classList.toggle('is-hidden', !show);
    });
  }));
})();

(function misc() {
  $('#year').textContent = new Date().getFullYear();
  const top = $('#scrollTop');
  window.addEventListener('scroll', () => {
    top.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const cb = $('#cookieBanner');
  if (!localStorage.getItem('paraisos_cookies')) {
    setTimeout(() => { cb.hidden = false; }, 2500);
  }
  $('#cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem('paraisos_cookies', '1');
    cb.hidden = true;
  });
})();
