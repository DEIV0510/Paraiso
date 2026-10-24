/* =====================================================================
   PARAISOS — main.js (solo el inicio)
   - Datos compartidos (PARAISOS_DATA) que leen el mapa y el asistente
   - Realce al hacer scroll (solo un realce: sin JS todo se ve)
   - Galería y visor (las tarjetas de destino están en el HTML)
   - Formulario de contacto → WhatsApp
   - Video del hero: se reproduce para todos, con botón de pausa
   Header, menú, cinta, barra fija y año del pie viven en nav.js.
   ===================================================================== */

'use strict';

/* ------------------ DATOS COMPARTIDOS ------------------
   Los leen el mapa (colombia-map-3d.js) y el asistente (wizard.js). Las
   tarjetas de #viajes están escritas en index.html: si cambia una tarifa,
   hay que cambiarla aquí, en esas tarjetas y en la cinta superior.
   precio: tarifa «desde» confirmada por el cliente, o null («Precio por
   WhatsApp»). Solo Putumayo tiene plan confirmado (fin de semana). */
const destImg = (id) => ({
  img: `assets/images/destinos/${id}-480.webp`,
  srcset: `assets/images/destinos/${id}-480.webp 480w, assets/images/destinos/${id}-960.webp 960w`
});
window.PARAISOS_DATA = {
  whatsapp: '573157347306',
  destinos: [
    { id:'putumayo', nombre:'Putumayo', region:'Andes y Amazonía',
      lat:1.15, lng:-76.65, ...destImg('putumayo'),
      desc:'Territorio andino-amazónico con 3 parques nacionales naturales, cascadas y ríos cristalinos.',
      features:['Fin del Mundo','Cascada del Hornoyaco','Cañón del Mandiyaco','Limpia con taita indígena','Sembrando vida','Yagesito','Ruta del cacao','Kayaking y rappel'],
      precio:'$999.000', plan:'Plan fin de semana' },
    { id:'cartagena', nombre:'Cartagena', region:'Caribe colombiano',
      lat:10.39, lng:-75.51, ...destImg('cartagena'),
      desc:'Ciudad amurallada frente al mar Caribe.',
      precio:'$999.000' },
    { id:'san-andres', nombre:'San Andrés', region:'Isla del Caribe',
      lat:12.58, lng:-81.71, ...destImg('san-andres'),
      desc:'Isla del Caribe colombiano con playas de arena blanca.',
      precio:'$1.250.000' },
    { id:'santa-marta', nombre:'Santa Marta', region:'Caribe colombiano',
      lat:11.24, lng:-74.21, ...destImg('santa-marta'),
      desc:'Playas del Caribe al pie de la Sierra Nevada.',
      precio:'$999.000' },
    { id:'eje-cafetero', nombre:'Eje Cafetero', region:'Andes colombianos',
      lat:4.81, lng:-75.69, ...destImg('eje-cafetero'),
      desc:'Paisaje cultural cafetero y Valle del Cocora.',
      precio:null },
    { id:'tumaco', nombre:'Tumaco', region:'Pacífico colombiano',
      lat:1.81, lng:-78.76, ...destImg('tumaco'),
      desc:'Playas y manglares del Pacífico nariñense.',
      precio:'$680.000' },
    { id:'huila', nombre:'Huila', region:'Andes del sur',
      lat:2.93, lng:-75.28, ...destImg('huila'),
      desc:'Desierto de la Tatacoa y Parque Arqueológico de San Agustín.',
      precio:null },
    { id:'atacames', nombre:'Atacames', region:'Pacífico de Ecuador',
      lat:0.86, lng:-79.85, ...destImg('atacames'),
      desc:'Playas del Pacífico ecuatoriano.',
      precio:'$699.000' }
  ]
};

const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
const D = window.PARAISOS_DATA;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ======================================================================
   REALCE AL HACER SCROLL
   El JS pone .reveal y lo quita al entrar en pantalla. Sin JS, sin
   IntersectionObserver o con «reducir movimiento» no se oculta nada.
   ====================================================================== */
(function reveal() {
  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const selectors = [
    '.section-head', '.map-3d', '.wizard',
    '.experience__media', '.experience__content', '.allies__list',
    '.tienda-teaser__inner', '.gallery__grid', '.accordion',
    '.contact__info', '.contact__form',
    '.service-card', '.putumayo__media', '.putumayo__intro', '.putumayo__col'
  ].join(',');
  const items = $$(selectors).filter(el => !el.closest('.hero'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  items.forEach(el => { el.classList.add('reveal'); io.observe(el); });
})();

/* ======================================================================
   GALERÍA: FILTROS + VISOR
   Las 12 fotos están en index.html (se ven sin JS). Aquí se crean los
   filtros (botones con aria-pressed) y el visor: un <dialog> modal con la
   foto grande, Esc para cerrar, flechas (teclado, botones o deslizar) para
   cambiar de foto, el foco atrapado y devuelto a la foto que lo abrió.
   ====================================================================== */
(function galeria() {
  const grid = $('#galGrid');
  if (!grid) return;
  const items = $$('li', grid);
  const filters = $('#galFilters');
  const status = $('#galStatus');

  /* ---------- Filtros ---------- */
  const nombres = { todas: 'Todas', naturaleza: 'Naturaleza', fauna: 'Fauna', cultura: 'Cultura', playas: 'Playas y resorts' };
  if (filters) {
    const cats = ['todas', ...new Set(items.map(li => li.dataset.cat))];
    filters.innerHTML = cats.map((c, i) =>
      `<button type="button" data-cat="${c}" aria-pressed="${i === 0}">${nombres[c] || c}</button>`
    ).join('');
    filters.hidden = false;
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      $$('button', filters).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const cat = b.dataset.cat;
      let n = 0;
      items.forEach(li => {
        const show = cat === 'todas' || li.dataset.cat === cat;
        li.hidden = !show;
        if (show) n++;
      });
      if (status) status.textContent = `${n} fotos: ${b.textContent}.`;
    });
  }

  /* ---------- Visor ---------- */
  const lb = $('#lightbox');
  const img = $('#lightboxImg');
  const cap = $('#lightboxCap');
  if (!lb || !img || !cap) return;
  const btnClose = $('.lightbox__close', lb);
  const btnPrev = $('.lightbox__prev', lb);
  const btnNext = $('.lightbox__next', lb);
  const canModal = typeof lb.showModal === 'function';
  let list = [];        // fotos visibles (respeta el filtro)
  let index = 0;
  let opener = null;

  function show(i) {
    index = (i + list.length) % list.length;
    const thumb = $('img', list[index]);
    const n = list[index].dataset.n;
    const w = thumb.getAttribute('width');
    const h = thumb.getAttribute('height');
    img.removeAttribute('src');
    img.width = w; img.height = h;
    img.sizes = '(max-width: 768px) 100vw, 85vw';
    img.srcset = `assets/images/galeria/w960/${n}.webp 960w, assets/images/galeria/w1400/${n}.webp ${w}w`;
    img.src = `assets/images/galeria/w960/${n}.webp`;
    img.alt = '';   // la descripción está en el pie de foto, que nombra el diálogo
    cap.textContent = `${thumb.alt}. Foto ${index + 1} de ${list.length}.`;
    const solo = list.length < 2;
    btnPrev.hidden = solo;
    btnNext.hidden = solo;
  }

  function open(button) {
    list = items.filter(li => !li.hidden).map(li => $('.gallery__item', li));
    opener = button;
    show(list.indexOf(button));
    document.documentElement.classList.add('lightbox-open');
    if (canModal) lb.showModal(); else lb.setAttribute('open', '');
    btnClose.focus();
  }

  function close() {
    if (canModal && lb.open) lb.close();
    else { lb.removeAttribute('open'); onClosed(); }
  }

  function onClosed() {
    document.documentElement.classList.remove('lightbox-open');
    img.removeAttribute('src');
    img.removeAttribute('srcset');
    if (opener && document.contains(opener)) opener.focus();
  }

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.gallery__item');
    if (b) open(b);
  });
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(index - 1));
  btnNext.addEventListener('click', () => show(index + 1));
  // Esc: el <dialog> lanza «cancel» y luego «close»
  lb.addEventListener('close', onClosed);
  // Clic en el fondo oscuro (fuera de la foto y de los botones) cierra
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.classList.contains('lightbox__figure')) close();
  });

  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && list.length > 1) { e.preventDefault(); show(index - 1); }
    else if (e.key === 'ArrowRight' && list.length > 1) { e.preventDefault(); show(index + 1); }
    else if (e.key === 'Escape' && !canModal) { e.preventDefault(); close(); }
    else if (e.key === 'Tab') {
      // El foco da la vuelta entre los botones del visor
      const f = [btnClose, btnPrev, btnNext].filter(b => !b.hidden);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!f.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  // Deslizar con el dedo para cambiar de foto
  let x0 = null, y0 = 0;
  lb.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null || list.length < 2) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();

/* ======================================================================
   FORMULARIO DE CONTACTO → WhatsApp (nombre opcional, destino y mensaje)
   El destino es obligatorio: si falta, el error se dice con texto, se
   marca aria-invalid y el foco vuelve al campo.
   ====================================================================== */
(function contactForm() {
  const form = $('#contactForm');
  if (!form) return;
  const dest = form.elements.destino;
  const err = $('#cfDestErr');
  const setError = (on) => {
    if (!dest || !err) return;
    err.hidden = !on;
    dest.closest('.field').classList.toggle('is-error', on);
    if (on) {
      dest.setAttribute('aria-invalid', 'true');
      dest.setAttribute('aria-describedby', err.id);
    } else {
      dest.removeAttribute('aria-invalid');
      dest.removeAttribute('aria-describedby');
    }
  };
  // El error se limpia al elegir (no en blur, para no mover el botón bajo el clic)
  if (dest) dest.addEventListener('change', () => { if (dest.value) setError(false); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const destino = String(fd.get('destino') || '').trim();
    const msg = String(fd.get('msg') || '').trim();
    if (!destino) { setError(true); dest.focus(); return; }
    setError(false);
    const lines = [
      name ? `Hola PARAISOS, soy ${name}. Quiero cotizar un viaje.` : 'Hola PARAISOS, quiero cotizar un viaje.',
      `Destino: ${destino}`
    ];
    if (msg) lines.push(`Mensaje: ${msg}`);
    const url = `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
    // Con 'noopener' window.open devuelve null: se corta el opener a mano
    const w = window.open(url, '_blank');
    if (w) w.opener = null;
    else location.href = url;
  });
})();

/* ------------------ VIDEO HERO FONDO ------------------ */
(function heroVideo() {
  const hero  = document.querySelector('.hero');
  const video = document.querySelector('.hero__video-el');
  if (!hero || !video) return;

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
})();
