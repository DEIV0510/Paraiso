/* =====================================================================
   PARAISOS — main.js
   Orquestación general:
   - Navbar inteligente, progress bar, sticky CTA mobile
   - Text reveals palabra-por-palabra / línea-por-línea con stagger
   - ScrollTrigger orchestration: proceso timeline, contadores, parallax
   - Galería + lightbox + filtros
   - Formulario de contacto → WhatsApp
   - Floating: scroll-top
   - Video del hero diferido (versión liviana en celular)
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
    { id:'putumayo', nombre:'Putumayo · Nuestra casa', region:'Andino-amazónica · Sur de Colombia',
      lat:1.15, lng:-76.65,
      img:'assets/images/destinos/putumayo.jpg',
      desc:'Territorio andino-amazónico con 3 Parques Nacionales Naturales, 15 pueblos indígenas, cascadas, ríos cristalinos y experiencias vivenciales únicas. Aquí nacen las nubes que dan vida al sur de Colombia.',
      categoria:'Aventura & Cultura', tag:'Territorio de vida',
      features:['Fin del Mundo','Cascada Hornoyaco','Cañón Mandiyaco','Limpia espiritual','Sembrando vida','Yagesito','Ruta del cacao','Kayaking & Rappel'],
      precio:'$999.000 COP', duracion:'Plan fin de semana', temporada:'Todo el año' },
    { id:'cartagena', nombre:'Cartagena', region:'Caribe colombiano',
      lat:10.39, lng:-75.51,
      img:'assets/images/destinos/cartagena.jpg',
      desc:'Murallas coloniales, calles empedradas y atardeceres frente al Caribe. La ciudad heroica te espera.',
      categoria:'Playa & Cultura', tag:'UNESCO',
      features:['Centro histórico','Islas del Rosario','Gastronomía','Atardeceres'],
      precio:'$999.000 COP', duracion:'4–6 días', temporada:'Diciembre – Abril' },
    { id:'san-andres', nombre:'San Andrés', region:'Isla del Caribe',
      lat:12.58, lng:-81.71,
      img:'assets/images/destinos/san-andres.jpg',
      desc:'El mar de los siete colores, snorkel en arrecifes vivos y playas de arena blanca.',
      categoria:'Playa', tag:'Top',
      features:['Mar 7 colores','Snorkel','Hoyo Soplador','Johnny Cay'],
      precio:'$1.250.000 COP', duracion:'4–7 días', temporada:'Enero – Mayo' },
    { id:'santa-marta', nombre:'Santa Marta', region:'Caribe colombiano',
      lat:11.24, lng:-74.21,
      img:'assets/images/destinos/santa-marta.jpg',
      desc:'Donde la sierra nevada se besa con el mar. Tayrona, Minca y playas eternas.',
      categoria:'Playa & Naturaleza', tag:'Aventura',
      features:['PNN Tayrona','Minca','Ciudad Perdida','Snorkel'],
      precio:'$999.000 COP', duracion:'4–6 días', temporada:'Diciembre – Marzo' },
    { id:'eje-cafetero', nombre:'Eje Cafetero', region:'Andes colombianos',
      lat:4.81, lng:-75.69,
      img:'assets/images/destinos/eje-cafetero.jpg',
      desc:'Valle del Cocora, palmas de cera y haciendas cafeteras. El paisaje cultural patrimonio.',
      categoria:'Naturaleza', tag:'UNESCO',
      features:['Valle del Cocora','Tour del café','Salento','Termales'],
      precio:'$1.090.000 COP', duracion:'4–5 días', temporada:'Todo el año' },
    { id:'tumaco', nombre:'Tumaco', region:'Pacífico colombiano',
      lat:1.81, lng:-78.76,
      img:'assets/images/destinos/tumaco.jpg',
      desc:'La perla del Pacífico. Playas vírgenes, manglares y avistamiento de ballenas.',
      categoria:'Playa & Naturaleza', tag:'Off the beaten path',
      features:['Ballenas jorobadas','Manglares','Cocoteros','Cultura afro'],
      precio:'$680.000 COP', duracion:'4–6 días', temporada:'Julio – Octubre' },
    { id:'huila', nombre:'Huila', region:'Sur Andes',
      lat:2.93, lng:-75.28,
      img:'assets/images/destinos/huila.jpg',
      desc:'Desierto de la Tatacoa, parque arqueológico San Agustín y cielos sin igual.',
      categoria:'Aventura & Cultura', tag:'UNESCO',
      features:['Desierto Tatacoa','San Agustín','Astronomía','Café'],
      precio:'$990.000 COP', duracion:'3–5 días', temporada:'Junio – Septiembre' },
    { id:'atacames', nombre:'Atacames', region:'Ecuador · Pacífico',
      lat:0.86, lng:-79.85,
      img:'assets/images/destinos/atacames.jpg',
      desc:'Playas ecuatorianas con sabor a coco, rumba y descanso a precios increíbles.',
      categoria:'Playa', tag:'Internacional',
      features:['Playa','Rumba','Gastronomía','Spa'],
      precio:'$699.000 COP', duracion:'6–8 días', temporada:'Junio – Octubre' }
  ]
};

const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
const D = window.PARAISOS_DATA;
const isMobile = matchMedia('(hover: none) and (pointer: coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
requestAnimationFrame(triggerInitialReveals);

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
   DESTINOS GRID con tilt 3D real
   ====================================================================== */
(function destinosGrid() {
  const grid = $('#destinosGrid');
  if (!grid) return;
  // Fallback gradient si la imagen de Unsplash falla en cargar
  const fallback = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231976D2"/><stop offset="100%" stop-color="%23F39A1F"/></linearGradient></defs><rect width="300" height="400" fill="url(%23g)"/></svg>');
  grid.innerHTML = D.destinos.map(d => `
    <article class="dest-card" data-id="${d.id}">
      <div class="dest-card__inner">
        <img loading="lazy" src="${d.img}" onerror="this.onerror=null;this.src='${fallback}';this.style.opacity='.7';" alt="${d.nombre}" />
        <span class="dest-card__cat">${d.categoria}</span>
        <div class="dest-card__overlay">
          <span class="dest-card__tag">${d.tag}</span>
          <h3>${d.nombre}</h3>
          <p class="dest-card__desc">${d.desc}</p>
          <div class="dest-card__meta">
            <span>${d.region}</span>
            <span>Desde <strong>${d.precio}</strong></span>
          </div>
        </div>
        <span class="dest-card__cta">Cotizar por WhatsApp →</span>
      </div>
    </article>
  `).join('');

  // Inclinación al pasar el mouse y clic directo a WhatsApp
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
    {src:'assets/images/galeria/33.jpg', cat:'putumayo', alt:'Cascada en la selva del Putumayo'},
    {src:'assets/images/galeria/24.jpg', cat:'putumayo', alt:'Cascada Fin del Mundo'},
    {src:'assets/images/galeria/19.jpg', cat:'putumayo', alt:'Río de aguas esmeralda'},
    {src:'assets/images/galeria/62.jpg', cat:'putumayo', alt:'Aventura en la cascada'},
    {src:'assets/images/galeria/35.jpg', cat:'putumayo', alt:'Cascada Hornoyaco'},
    {src:'assets/images/galeria/36.jpg', cat:'putumayo', alt:'Salto de agua en la selva'},
    {src:'assets/images/galeria/26.jpg', cat:'putumayo', alt:'Cascada entre la montaña'},
    {src:'assets/images/galeria/15.jpg', cat:'putumayo', alt:'Jaguar en su hábitat'},
    {src:'assets/images/galeria/21.jpg', cat:'putumayo', alt:'Mono en el dosel amazónico'},
    {src:'assets/images/galeria/22.jpg', cat:'putumayo', alt:'Perezosos en el árbol'},
    {src:'assets/images/galeria/49.jpg', cat:'putumayo', alt:'Ave tropical del Putumayo'},
    {src:'assets/images/galeria/61.jpg', cat:'putumayo', alt:'Tángara multicolor'},
    {src:'assets/images/galeria/60.jpg', cat:'putumayo', alt:'Ave del Putumayo'},
    {src:'assets/images/galeria/54.jpg', cat:'putumayo', alt:'Flor de heliconia y mariposa'},
    {src:'assets/images/galeria/20.jpg', cat:'putumayo', alt:'Selva amazónica'},
    {src:'assets/images/galeria/37.jpg', cat:'putumayo', alt:'Bosque de niebla'},
    {src:'assets/images/galeria/41.jpg', cat:'putumayo', alt:'Mujer indígena del territorio'},
    {src:'assets/images/galeria/47.jpg', cat:'putumayo', alt:'Comunidad indígena amazónica'},
    {src:'assets/images/galeria/73.jpg', cat:'putumayo', alt:'Danza y cultura ancestral'},
    {src:'assets/images/galeria/10.jpg', cat:'putumayo', alt:'Ceremonia ancestral con taita'},
    {src:'assets/images/galeria/23.jpg', cat:'putumayo', alt:'Rafting en río cristalino'},
    {src:'assets/images/galeria/52.jpg', cat:'eje-cafetero', alt:'Experiencia del café'},
    {src:'assets/images/galeria/80.jpg', cat:'cartagena', alt:'Gastronomía frente al mar'},
    {src:'assets/images/galeria/67.jpg', cat:'cartagena', alt:'Cócteles de bienvenida'},
    {src:'assets/images/galeria/66.jpg', cat:'san-andres', alt:'Bebidas tropicales del resort'},
    {src:'assets/images/galeria/69.jpg', cat:'san-andres', alt:'Buffet todo incluido'},
    {src:'assets/images/galeria/70.jpg', cat:'santa-marta', alt:'Lounge frente al mar'},
    {src:'assets/images/galeria/68.jpg', cat:'santa-marta', alt:'Bebidas tropicales'},
    {src:'assets/images/galeria/83.jpg', cat:'atacames', alt:'Amigos disfrutando el resort'},
    {src:'assets/images/galeria/85.jpg', cat:'atacames', alt:'Diversión en la piscina'}
  ];
  const nombres = { todas:'Todas', putumayo:'Putumayo', 'eje-cafetero':'Eje Cafetero', cartagena:'Cartagena',
    'san-andres':'San Andrés', 'santa-marta':'Santa Marta', atacames:'Atacames' };
  const cats = ['todas', ...new Set(fotos.map(f => f.cat))];
  filters.innerHTML = cats.map((c, i) =>
    `<button class="${i===0?'is-active':''}" data-cat="${c}">${nombres[c] || c}</button>`
  ).join('');
  function render(cat) {
    grid.innerHTML = fotos
      .filter(f => cat === 'todas' || f.cat === cat)
      .map(f => `<figure><img loading="lazy" src="${f.src.replace('/galeria/', '/galeria/sm/')}" data-full="${f.src}" alt="${f.alt}" /></figure>`)
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
    lbImg.src = img.dataset.full || img.src;
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
   MISCELÁNEA: scroll-top, year
   ====================================================================== */
(function misc() {
  $('#year').textContent = new Date().getFullYear();
  const top = $('#scrollTop');
  window.addEventListener('scroll', () => {
    top.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ------------------ VIDEO HERO FONDO ------------------ */
(function heroVideo() {
  const hero  = document.querySelector('.hero');
  const video = document.querySelector('.hero__video-el');
  if (!hero || !video) return;

  // Marca el hero cuando el video empiece a reproducirse (quita el gradiente cielo)
  let loaded = false;
  function markLoaded() {
    if (loaded) return;
    loaded = true;
    hero.classList.add('video-loaded');
  }

  video.addEventListener('canplay', markLoaded, { once: true });
  video.addEventListener('playing', markLoaded, { once: true });

  // Se reproduce para todos (también con «reducir movimiento»): es mudo,
  // corto y tiene botón de pausa. Se pide cuando la página ya cargó para no
  // competir con lo importante, y se pausa mientras el hero no se ve.
  const toggle = $('.hero__video-toggle');
  let userPaused = false;
  const play = () => { if (!userPaused) video.play().catch(() => {}); };
  const sync = () => {
    toggle.classList.toggle('is-paused', video.paused);
    toggle.setAttribute('aria-label', video.paused ? 'Reproducir video de fondo' : 'Pausar video de fondo');
  };
  if (toggle) {
    toggle.hidden = false;
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    toggle.addEventListener('click', () => {
      userPaused = !video.paused;
      if (userPaused) video.pause(); else play();
    });
    sync();
  }
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) video.pause();
    else if (document.readyState === 'complete') play();
  }).observe(hero);
  if (document.readyState === 'complete') play();
  else window.addEventListener('load', play, { once: true });

  // Fallback: si en 3 s el video no disparó canplay, marcar igual
  setTimeout(markLoaded, 3000);
})();
