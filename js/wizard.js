/* =====================================================================
   PARAISOS — wizard.js
   Asistente de cotización en 5 pasos (#asistente).
   - Cada paso guarda solo su propio dato (tipo, destino, fecha,
     personas y presupuesto, nombre opcional).
   - Los pasos inactivos quedan ocultos de verdad (hidden + inert);
     al avanzar, el foco va al título del paso nuevo.
   - En los pasos de una sola opción se avanza solo al elegir.
   - Se guarda en localStorage (con try/catch), pero siempre se
     empieza en el paso 1 y nunca se restaura una fecha pasada.
   - Al final abre WhatsApp con un mensaje en texto limpio.
   ===================================================================== */
(function () {
  'use strict';

  const root = document.getElementById('wizard');
  if (!root) return;

  const D = window.PARAISOS_DATA || {};
  const WA = String(D.whatsapp || '573157347306').replace(/\D/g, '');

  const $ = (s, c = root) => c.querySelector(s);
  const $$ = (s, c = root) => Array.from(c.querySelectorAll(s));

  const STORAGE = 'paraisos_wizard_v2';
  const OLD_STORAGE = ['paraisos_wizard_v1'];
  const TOTAL = 5;
  const AUTO_ADVANCE = ['tipo', 'destino'];
  const ADVANCE_DELAY = 260;
  const LIMITS = { duration: [2, 21], adults: [1, 50], kids: [0, 50] };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* --------------- HOY EN HORA DE COLOMBIA --------------- */
  function todayCO() {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date());
      const get = (t) => (parts.find((p) => p.type === t) || {}).value;
      const iso = `${get('year')}-${get('month')}-${get('day')}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    } catch (e) { /* sin Intl con zonas horarias: cálculo fijo */ }
    // Colombia está en UTC-5 todo el año (no tiene horario de verano)
    return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
  }
  const today = todayCO();

  /* --------------- ELEMENTOS --------------- */
  const steps = $$('.wizard__step');
  const stepsLi = $$('#wizSteps li');
  const bar = $('#wizBar');
  const prev = $('#wizPrev');
  const next = $('#wizNext');
  const send = $('#wizSend');
  const msgEl = $('#wizMsg');
  const statusEl = $('#wizStatus');
  const dateInput = $('#wizDate');
  const dateField = dateInput ? dateInput.closest('.field') : null;
  const durEl = $('#wizDur');
  const durOut = $('#wizDurOut');
  const nameInput = $('#wizName');
  if (!steps.length || !prev || !next || !send) return;

  /* --------------- DESTINOS DEL PASO 2 (desde PARAISOS_DATA) --------------- */
  const destHost = $('#wizDestinos');
  const destName = (d) => String(d.corto || d.nombre || '').split('·')[0].trim();
  if (destHost && Array.isArray(D.destinos)) {
    const frag = document.createDocumentFragment();
    D.destinos.forEach((d) => {
      const name = destName(d);
      if (!name) return;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'wiz-card wiz-card--destino';
      card.dataset.value = name;
      card.setAttribute('aria-pressed', 'false');
      // Sin foto (no hay fotos verificadas de cada destino): nombre y región
      const label = document.createElement('strong');
      label.textContent = name;
      card.appendChild(label);
      if (d.region) {
        const region = document.createElement('em');
        region.textContent = d.region;
        card.appendChild(region);
      }
      frag.appendChild(card);
    });
    // Los destinos van antes de «Crucero» y «Otro destino», que están en el HTML
    destHost.insertBefore(frag, destHost.firstChild);
  }

  /* --------------- GRUPOS DE OPCIONES (un dato por grupo) --------------- */
  const groups = {};
  $$('[data-key]').forEach((g) => { groups[g.dataset.key] = g; });
  const optionsOf = (key) => (groups[key] ? $$('.wiz-card', groups[key]).map((c) => c.dataset.value) : []);

  /* --------------- ESTADO + PERSISTENCIA --------------- */
  const defaults = {
    step: 1, tipo: null, destino: null, date: '',
    duration: 5, adults: 2, kids: 0, budget: null, name: ''
  };
  const state = Object.assign({}, defaults, restore());

  function restore() {
    let saved = null;
    try {
      OLD_STORAGE.forEach((k) => localStorage.removeItem(k));
      saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    } catch (e) { saved = null; }
    if (!saved || typeof saved !== 'object') return {};
    const out = {};
    ['tipo', 'destino', 'budget'].forEach((k) => {
      if (optionsOf(k).includes(saved[k])) out[k] = saved[k];
    });
    if (typeof saved.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.date) && saved.date >= today) {
      out.date = saved.date;
    }
    ['duration', 'adults', 'kids'].forEach((k) => {
      const n = Math.round(Number(saved[k]));
      if (Number.isFinite(n)) out[k] = clamp(n, LIMITS[k][0], LIMITS[k][1]);
    });
    if (typeof saved.name === 'string') out.name = saved.name.slice(0, 80);
    return out; // el paso nunca se restaura: siempre se empieza en el 1
  }

  function persist() {
    const data = {
      tipo: state.tipo, destino: state.destino, date: state.date,
      duration: state.duration, adults: state.adults, kids: state.kids,
      budget: state.budget, name: state.name
    };
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch (e) { /* almacenamiento bloqueado */ }
  }

  /* --------------- AVISOS (región viva) --------------- */
  let msgFrame = 0;
  function showMsg(text) {
    if (!msgEl) return;
    cancelAnimationFrame(msgFrame);
    msgEl.textContent = '';
    // Vaciar y volver a escribir hace que el lector anuncie aunque el texto se repita
    msgFrame = requestAnimationFrame(() => { msgEl.textContent = text; });
  }
  function clearMsg() {
    cancelAnimationFrame(msgFrame);
    if (msgEl) msgEl.textContent = '';
  }
  function announce(text) {
    if (!statusEl) return;
    statusEl.textContent = '';
    requestAnimationFrame(() => { statusEl.textContent = text; });
  }

  /* --------------- TARJETAS: SELECCIÓN POR PASO --------------- */
  let advanceTimer = 0;

  function syncCards(key) {
    const g = groups[key];
    if (!g) return;
    $$('.wiz-card', g).forEach((card) => {
      const on = card.dataset.value === state[key];
      card.classList.toggle('is-selected', on);
      card.setAttribute('aria-pressed', String(on));
    });
  }

  Object.keys(groups).forEach((key) => {
    const g = groups[key];
    syncCards(key);
    g.addEventListener('click', (e) => {
      const card = e.target.closest('.wiz-card');
      if (!card || !g.contains(card)) return;
      state[key] = card.dataset.value;
      syncCards(key);
      clearMsg();
      persist();
      const stepEl = g.closest('.wizard__step');
      const from = stepEl ? Number(stepEl.dataset.step) : 0;
      if (AUTO_ADVANCE.includes(key) && from === state.step && from < TOTAL) {
        clearTimeout(advanceTimer);
        // Pausa corta para que se vea la opción marcada antes de pasar
        advanceTimer = setTimeout(() => { if (state.step === from) go(from + 1); }, ADVANCE_DELAY);
      }
    });
  });

  /* --------------- FECHA (mínimo = hoy en Colombia) --------------- */
  function clearDateError() {
    if (dateField) dateField.classList.remove('is-error');
    if (dateInput) dateInput.removeAttribute('aria-invalid');
  }
  if (dateInput) {
    dateInput.min = today;
    dateInput.value = state.date || '';
    const onDate = () => {
      state.date = dateInput.value;
      clearDateError();
      clearMsg();
      persist();
    };
    dateInput.addEventListener('change', onDate);
    dateInput.addEventListener('input', onDate);
  }

  /* --------------- DURACIÓN --------------- */
  function paintDuration() {
    if (durOut) durOut.textContent = state.duration;
    if (durEl) durEl.setAttribute('aria-valuetext', plural(state.duration, 'día', 'días'));
  }
  if (durEl) {
    durEl.value = state.duration;
    durEl.addEventListener('input', () => {
      state.duration = clamp(Math.round(Number(durEl.value)) || defaults.duration, LIMITS.duration[0], LIMITS.duration[1]);
      paintDuration();
      persist();
    });
  }
  paintDuration();

  /* --------------- PERSONAS (adultos / niños) --------------- */
  const people = () => plural(state.adults, 'adulto', 'adultos') +
    (state.kids ? ', ' + plural(state.kids, 'niño', 'niños') : '');

  function paintCounters() {
    const a = $('#wizAdults'), k = $('#wizKids');
    if (a) a.textContent = state.adults;
    if (k) k.textContent = state.kids;
  }
  $$('[data-counter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.counter; // 'adults' | 'kids'
      if (!LIMITS[key]) return;
      state[key] = clamp(state[key] + Number(btn.dataset.op || 0), LIMITS[key][0], LIMITS[key][1]);
      paintCounters();
      persist();
      announce(key === 'adults' ? plural(state.adults, 'adulto', 'adultos') : plural(state.kids, 'niño', 'niños'));
    });
  });
  paintCounters();

  /* --------------- NOMBRE (opcional) --------------- */
  if (nameInput) {
    nameInput.value = state.name;
    nameInput.addEventListener('input', () => {
      state.name = nameInput.value.slice(0, 80);
      persist();
      updateSendHref();
    });
  }

  /* --------------- VALIDACIÓN POR PASO --------------- */
  let lastError = '';
  function fail(text) {
    lastError = text;
    showMsg(text);
    return false;
  }
  function validate(n) {
    switch (n) {
      case 1: return state.tipo ? true : fail('Elige el tipo de viaje.');
      case 2: return state.destino ? true : fail('Elige un destino.');
      case 3: {
        if (dateInput) state.date = dateInput.value;
        const bad = !state.date ? 'Elige la fecha de salida.'
          : state.date < today ? 'Elige una fecha desde hoy.' : '';
        if (!bad) return true;
        if (dateField) dateField.classList.add('is-error');
        if (dateInput) { dateInput.setAttribute('aria-invalid', 'true'); dateInput.focus(); }
        return fail(bad);
      }
      case 4: return state.budget ? true : fail('Elige un presupuesto. Si no lo tienes claro, toca «Aún no lo sé».');
    }
    return true;
  }

  /* --------------- PASOS --------------- */
  function render() {
    steps.forEach((s) => {
      const on = Number(s.dataset.step) === state.step;
      s.hidden = !on;
      s.toggleAttribute('inert', !on);
      s.classList.toggle('is-active', on);
    });
    stepsLi.forEach((li, i) => {
      const n = i + 1;
      li.classList.toggle('is-active', n === state.step);
      li.classList.toggle('is-done', n < state.step);
      if (n === state.step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    // El relleno se dibuja en CSS con transform: scaleX(var(--wiz-progress))
    if (bar) bar.style.setProperty('--wiz-progress', String((state.step - 1) / (TOTAL - 1)));
    prev.disabled = state.step === 1;
    next.hidden = state.step === TOTAL;
    send.hidden = state.step !== TOTAL;
    if (state.step === TOTAL) { buildResume(); updateSendHref(); }
  }

  function headerOffset() {
    const nav = document.getElementById('navbar') || document.querySelector('.navbar');
    if (!nav) return 16;
    const cs = getComputedStyle(nav);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return 16;
    // offsetTop/offsetHeight no cambian cuando el header se esconde con transform
    return nav.offsetTop + nav.offsetHeight + 12;
  }

  function bringIntoView() {
    const title = $('.wizard__step:not([hidden]) h3');
    if (!title) return;
    title.focus({ preventScroll: true });
    const top = headerOffset();
    const box = root.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    // Solo se mueve si el título quedó tapado por el header o muy abajo
    if (t.top < top || t.bottom > window.innerHeight * 0.75) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(0, window.scrollY + box.top - top), behavior: reduce ? 'instant' : 'smooth' });
    }
  }

  function go(n) {
    clearTimeout(advanceTimer);
    const target = clamp(n, 1, TOTAL);
    if (target === state.step) return;
    state.step = target;
    clearMsg();
    clearDateError();
    render();
    bringIntoView();
  }

  next.addEventListener('click', () => {
    clearTimeout(advanceTimer);
    if (validate(state.step)) go(state.step + 1);
  });
  prev.addEventListener('click', () => go(state.step - 1));

  /* --------------- RESUMEN (PASO 5) --------------- */
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return 'Por definir';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    try {
      return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return `${m[3]}/${m[2]}/${m[1]}`;
    }
  }

  // [etiqueta corta del resumen, etiqueta del mensaje, valor]
  function rows() {
    return [
      ['Tipo', 'Tipo', state.tipo || 'Sin elegir'],
      ['Destino', 'Destino', state.destino || 'Sin elegir'],
      ['Fecha', 'Fecha', fmtDate(state.date)],
      ['Duración', 'Duración', plural(state.duration, 'día', 'días')],
      ['Personas', 'Personas', people()],
      ['Presupuesto', 'Presupuesto por persona', state.budget || 'Sin elegir']
    ];
  }

  function buildResume() {
    const host = $('#wizResume');
    if (!host) return;
    const dl = document.createElement('dl');
    rows().forEach(([k, , v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      dl.append(dt, dd);
    });
    host.replaceChildren(dl);
  }

  /* --------------- MENSAJE DE WHATSAPP --------------- */
  function buildMessage() {
    const lines = ['Hola, PARAISOS. Quiero cotizar un viaje.', ''];
    rows().forEach(([, k, v]) => lines.push(`${k}: ${v}`));
    const name = String(state.name || '').replace(/\s+/g, ' ').trim();
    if (name) lines.push(`Nombre: ${name}`);
    return lines.join('\n');
  }
  function waHref() {
    return `https://wa.me/${WA}?text=${encodeURIComponent(buildMessage())}`;
  }
  function updateSendHref() { send.href = waHref(); }

  send.addEventListener('click', (e) => {
    // Seguridad: si falta algo, vuelve al paso que lo pide
    for (let n = 1; n < TOTAL; n++) {
      if (!validate(n)) {
        e.preventDefault();
        const msg = lastError;
        go(n);
        if (msg) showMsg(msg);
        return;
      }
    }
    updateSendHref();
  });

  /* --------------- INICIO --------------- */
  render();
})();
