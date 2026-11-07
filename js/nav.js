/* =====================================================================
   PARAISOS — nav.js (piezas globales, compartido por todas las páginas)
   - Header: sombra al bajar y se esconde al hacer scroll hacia abajo
   - Menú de celular: aria-expanded, cerrado de verdad (inert), Esc,
     clic fuera, al elegir un enlace o al salir del header con Tab
   - Enlace activo según la sección que se ve (anclas de esta página)
   - Cinta superior: un toque la pausa y otro la reanuda
   - Barra fija de celular: con data-after aparece al pasar ese bloque y
     con data-avoid se aparta mientras se ve otro botón que hace lo mismo
   - Saltos a anclas con content-visibility y año del pie
   No depende de ninguna librería.
   ===================================================================== */
(function () {
  'use strict';

  const doc = document.documentElement;
  const nav = document.getElementById('navbar');
  const burger = document.getElementById('navBurger');
  const menu = document.getElementById('primaryMenu');
  const topbar = document.getElementById('topbar');
  const bar = document.getElementById('stickyCta');
  const mobileMenu = window.matchMedia('(max-width: 1000px)');
  const hasIO = 'IntersectionObserver' in window;

  /* ---------- Header al hacer scroll ----------
     Tras un salto a un ancla (menú, botones, entrada con #) el header se
     queda visible un momento: si se escondiera, scroll-padding-top dejaría
     a la vista una franja de la sección anterior sobre el título. */
  let lastY = window.scrollY;
  let ticking = false;
  let holdUntil = location.hash ? performance.now() + 3000 : 0;
  const holdHeader = (ms) => { holdUntil = Math.max(holdUntil, performance.now() + ms); doc.classList.remove('header-hidden'); };
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 24);
      // No se esconde con el menú abierto ni mientras se recorre con teclado
      const busy = nav.classList.contains('is-open') || !!nav.querySelector(':focus-visible') || performance.now() < holdUntil;
      if (!busy && y > 240 && y > lastY + 4) doc.classList.add('header-hidden');
      else if (busy || y <= 240 || y < lastY - 4) doc.classList.remove('header-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  // Con teclado, el header vuelve en cuanto algo suyo recibe el foco
  if (nav) nav.addEventListener('focusin', () => doc.classList.remove('header-hidden'));

  /* ---------- Menú de celular ---------- */
  function syncInert() {
    if (!menu || !nav) return;
    const closed = mobileMenu.matches && !nav.classList.contains('is-open');
    if (closed) menu.setAttribute('inert', '');
    else menu.removeAttribute('inert');
  }
  function setMenu(open, returnFocus) {
    if (!nav || !burger || !menu) return;
    nav.classList.toggle('is-open', open);
    doc.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    syncInert();
    if (open) doc.classList.remove('header-hidden');
    if (!open && returnFocus) burger.focus();
  }
  if (nav && burger && menu) {
    syncInert();
    burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true);
    });
    // Tocar fuera del header lo cierra
    document.addEventListener('pointerdown', (e) => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false);
    });
    // Salir del header con Tab lo cierra
    nav.addEventListener('focusout', (e) => {
      if (nav.classList.contains('is-open') && e.relatedTarget && !nav.contains(e.relatedTarget)) setMenu(false);
    });
    const onChange = () => { if (!mobileMenu.matches) setMenu(false); else syncInert(); };
    if (mobileMenu.addEventListener) mobileMenu.addEventListener('change', onChange);
    else mobileMenu.addListener(onChange);
  }

  /* ---------- Enlace activo según la sección visible ---------- */
  if (menu && hasIO) {
    const links = Array.from(menu.querySelectorAll('a[href^="#"]'));
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    if (links.length && sections.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((a) => {
            const on = a.getAttribute('href') === '#' + e.target.id;
            a.classList.toggle('is-active', on);
            if (on) a.setAttribute('aria-current', 'location');
            else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach((s) => io.observe(s));
    }
  }

  /* ---------- Cinta superior: tocar pausa / reanuda ---------- */
  if (topbar) {
    const toggle = () => topbar.classList.toggle('is-paused');
    topbar.addEventListener('click', toggle);
    topbar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  /* ---------- Barra fija de celular ---------- */
  if (bar) {
    const sel = bar.getAttribute('data-after');
    const ref = sel ? document.querySelector(sel) : null;
    // Botones que hacen lo mismo que la barra (enviar del asistente o del
    // formulario): mientras se ven, la barra se aparta para no duplicarlos
    // ni tapar el que lleva el mensaje armado.
    const avoidSel = bar.getAttribute('data-avoid');
    const avoid = avoidSel ? Array.from(document.querySelectorAll(avoidSel)) : [];
    let past = !(ref && hasIO);
    const seen = new Set();
    const sync = () => bar.classList.toggle('is-shown', past && seen.size === 0);
    if (ref && hasIO) {
      new IntersectionObserver(([e]) => { past = !e.isIntersecting; sync(); }).observe(ref);
    }
    if (avoid.length && hasIO) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
        sync();
      });
      avoid.forEach((el) => io.observe(el));
    }
    sync();
    // Mientras se escribe en un campo, la barra no tapa el teclado ni el campo
    const isField = (el) => el && el.matches && el.matches('input, textarea, select');
    document.addEventListener('focusin', (e) => { if (isField(e.target)) doc.classList.add('is-typing'); });
    document.addEventListener('focusout', (e) => { if (isField(e.target)) doc.classList.remove('is-typing'); });
  }

  /* ---------- Saltos a anclas ----------
     Las secciones bajo el pliegue se pintan cuando se acercan
     (content-visibility) y hay fotos y bloques que crecen al cargar. Antes de
     saltar se pintan todas (cv-off) y, al terminar, se corrige el destino
     si algo de arriba cambió de alto. Cualquier gesto del usuario lo detiene. */
  const allSections = () => { doc.classList.add('cv-off'); void doc.offsetHeight; };
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const findTarget = (hash) => {
    if (!hash || hash.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return null; }
  };
  function jumpTo(y) {
    // Salto sin animación aunque el CSS pida scroll suave
    const prev = doc.style.scrollBehavior;
    doc.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    doc.style.scrollBehavior = prev;
  }
  let settling = null;
  function settle(target) {
    if (settling) settling();
    const gestures = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    let timer = 0, tries = 0, still = 0, prevY = -1;
    const stop = () => {
      clearTimeout(timer);
      gestures.forEach((ev) => window.removeEventListener(ev, stop, true));
      if (settling === stop) settling = null;
    };
    settling = stop;
    gestures.forEach((ev) => window.addEventListener(ev, stop, { capture: true, passive: true }));
    const check = () => {
      holdHeader(500);
      const y = window.scrollY;
      still = Math.abs(y - prevY) < 1 ? still + 1 : 0;
      prevY = y;
      if (still >= 2) {
        const pad = parseFloat(getComputedStyle(doc).scrollPaddingTop) || 0;
        const off = Math.round(target.getBoundingClientRect().top - pad);
        const atEnd = y >= doc.scrollHeight - window.innerHeight - 1;
        if (Math.abs(off) > 2 && !(off > 0 && atEnd) && tries < 4) { tries++; still = 0; jumpTo(y + off); }
        else if (still >= 6 || tries >= 4) return stop();
      }
      timer = setTimeout(check, 120);
    };
    timer = setTimeout(check, 150);
  }
  function goTo(target, smooth) {
    holdHeader(1600);
    target.scrollIntoView({ behavior: smooth && !reduceMotion() ? 'smooth' : 'auto', block: 'start' });
    // El siguiente Tab sigue desde el destino
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    settle(target);
  }
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || (a.target && a.target !== '_self')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname !== location.pathname || u.search !== location.search) return;
    const target = findTarget(u.hash);
    if (!target) return;
    e.preventDefault();
    allSections();
    if (location.hash !== u.hash) history.pushState(null, '', u.hash);
    goTo(target, true);
  });
  // Atrás / adelante entre anclas
  window.addEventListener('popstate', () => {
    const target = findTarget(location.hash);
    if (target) { allSections(); goTo(target, false); }
  });
  // Entrada con #ancla desde otra página (el <head> ya puso cv-off)
  if (location.hash) {
    const fix = () => { const t = findTarget(location.hash); if (t) { allSections(); settle(t); } };
    if (document.readyState === 'complete') fix(); else window.addEventListener('load', fix, { once: true });
  }

  /* ---------- Año del pie ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
