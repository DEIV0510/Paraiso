/* =====================================================================
   PARAISOS — main.js (solo el inicio)
   - Datos compartidos (PARAISOS_DATA) que leen el mapa y el asistente
   - Realce al hacer scroll (solo un realce: sin JS todo se ve)
   - Tarjetas de destino, galería y visor
   - Formulario de contacto → WhatsApp
   - Video del hero: se reproduce para todos, con botón de pausa
   Header, menú, cinta, barra fija y año del pie viven en nav.js.
   ===================================================================== */

'use strict';

/* ------------------ DATOS COMPARTIDOS ------------------ */
window.PARAISOS_DATA = {
  whatsapp: '573157347306',
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
   REALCE AL HACER SCROLL
   El JS pone .reveal y lo quita al entrar en pantalla. Sin JS, sin
   IntersectionObserver o con «reducir movimiento» no se oculta nada.
   ====================================================================== */
(function reveal() {
  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const selectors = [
    '.section-head', '.map-3d', '.wizard', '.cruise-card',
    '.experience__media', '.experience__content', '.allies__list',
    '.accordion details', '.contact__info', '.contact__form',
    '.exp-card', '.service-card', '.putumayo__media', '.putumayo__intro'
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
   FORMULARIO DE CONTACTO → WhatsApp (nombre opcional, destino y mensaje)
   ====================================================================== */
(function contactForm() {
  const form = $('#contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const destino = String(fd.get('destino') || '').trim();
    const msg = String(fd.get('msg') || '').trim();
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
