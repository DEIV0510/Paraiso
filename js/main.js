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
    '.accordion details', '.contact__info', '.contact__form',
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
