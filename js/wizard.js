/* =====================================================================
   PARAISOS — wizard.js
   Asistente de 5 pasos para cotizar un viaje, con persistencia en
   localStorage y generación de mensaje WhatsApp formateado.
   ===================================================================== */
(function () {
  'use strict';

  const D = window.PARAISOS_DATA;
  const root = document.getElementById('wizard');
  if (!root) return;

  const $ = (s) => root.querySelector(s);
  const $$ = (s) => Array.from(root.querySelectorAll(s));

  const STORAGE = 'paraisos_wizard_v1';
  const TOTAL = 5;

  // Estado por defecto
  const defaultState = {
    step: 1,
    tipo: null,
    destino: null,
    date: '',
    duration: 5,
    adults: 2,
    kids: 0,
    budget: null,
    name: '', phone: '', email: ''
  };
  let state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem(STORAGE) || '{}'));

  /* --------------- INYECTAR DESTINOS PASO 2 --------------- */
  const destHost = document.getElementById('wizDestinos');
  destHost.innerHTML = D.destinos.map(d => `
    <button class="wiz-card wiz-card--destino" data-value="${d.nombre}">
      <img loading="lazy" src="${d.img}" alt="${d.nombre}" />
      <strong>${d.flag} ${d.nombre}</strong>
    </button>
  `).join('');

  /* --------------- FECHA MÍNIMA = HOY --------------- */
  const dateInput = $('#wizDate');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  if (!state.date) state.date = today;
  dateInput.value = state.date;

  /* --------------- SLIDER DURACIÓN --------------- */
  const durEl = $('#wizDur'), durOut = $('#wizDurOut');
  durEl.value = state.duration;
  durOut.textContent = state.duration;
  durEl.addEventListener('input', () => {
    state.duration = +durEl.value;
    durOut.textContent = state.duration;
    persist();
  });

  /* --------------- COUNTERS ADULTOS/NIÑOS --------------- */
  $$('[data-counter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.counter; // 'adults' | 'kids'
      const op = +btn.dataset.op;
      const min = k === 'adults' ? 1 : 0;
      state[k] = Math.max(min, Math.min(20, state[k] + op));
      $(`#wiz${k === 'adults' ? 'Adults' : 'Kids'}`).textContent = state[k];
      persist();
    });
  });
  $('#wizAdults').textContent = state.adults;
  $('#wizKids').textContent = state.kids;

  /* --------------- SELECCIONES POR PASO --------------- */
  function bindCards(stepEl, key) {
    $$('.wiz-card', stepEl).forEach(card => {
      card.classList.toggle('is-selected', state[key] === card.dataset.value);
      card.addEventListener('click', () => {
        state[key] = card.dataset.value;
        $$('.wiz-card', stepEl).forEach(x => x.classList.toggle('is-selected', x === card));
        persist();
      });
    });
  }
  bindCards($('[data-step="1"]'), 'tipo');
  bindCards($('[data-step="2"]'), 'destino');
  bindCards($('[data-step="4"] .wizard__grid--budget'), 'budget');

  /* --------------- INPUTS FINALES --------------- */
  $('#wizName').value  = state.name;
  $('#wizPhone').value = state.phone;
  $('#wizEmail').value = state.email;
  ['Name','Phone','Email'].forEach(k => {
    $(`#wiz${k}`).addEventListener('input', (e) => {
      state[k.toLowerCase()] = e.target.value;
      persist();
    });
  });
  dateInput.addEventListener('change', () => { state.date = dateInput.value; persist(); });

  /* --------------- NAVEGACIÓN ENTRE PASOS --------------- */
  const prev = $('#wizPrev'), next = $('#wizNext'), send = $('#wizSend');
  const bar  = $('#wizBar');
  const stepsLi = $$('#wizSteps li');

  function renderStep() {
    $$('.wizard__step', root).forEach(s => {
      s.classList.toggle('is-active', +s.dataset.step === state.step);
    });
    stepsLi.forEach(li => {
      const n = +li.dataset.step;
      li.classList.toggle('is-active', n === state.step);
      li.classList.toggle('is-done', n < state.step);
    });
    bar.style.width = ((state.step - 1) / (TOTAL - 1)) * 100 + '%';
    prev.disabled = state.step === 1;
    next.hidden = state.step === TOTAL;
    send.hidden = state.step !== TOTAL;
    if (state.step === TOTAL) buildResumen();
  }

  function validateStep() {
    switch (state.step) {
      case 1: return !!state.tipo  || alertField('Selecciona el tipo de viaje');
      case 2: return !!state.destino || alertField('Elige un destino');
      case 3: return !!state.date  || alertField('Selecciona una fecha');
      case 4: return !!state.budget || alertField('Selecciona un presupuesto');
      case 5: return validateContact();
    }
    return true;
  }
  function validateContact() {
    let ok = true;
    [['name', 'Nombre'], ['phone', 'Teléfono'], ['email', 'Email']].forEach(([k, label]) => {
      const v = String(state[k] || '').trim();
      const valid = v && (k !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
      $(`#wiz${k[0].toUpperCase() + k.slice(1)}`).style.borderColor = valid ? '' : '#E74C3C';
      if (!valid) ok = false;
    });
    if (!ok) alertField('Completa nombre, teléfono y email válidos');
    return ok;
  }
  function alertField(msg) {
    // Toast minimalista
    let t = document.querySelector('.wiz-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'wiz-toast';
      Object.assign(t.style, {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        background: '#0F2845', color: '#fff', padding: '.7rem 1.2rem',
        borderRadius: '999px', fontSize: '.85rem', zIndex: 200, fontWeight: 600,
        boxShadow: '0 12px 30px rgba(15,40,69,.25)', opacity: 0, transition: 'opacity .25s'
      });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => { t.style.opacity = 1; });
    clearTimeout(t._tid);
    t._tid = setTimeout(() => { t.style.opacity = 0; }, 2400);
    return false;
  }

  next.addEventListener('click', () => {
    if (!validateStep()) return;
    state.step = Math.min(TOTAL, state.step + 1);
    persist();
    renderStep();
  });
  prev.addEventListener('click', () => {
    state.step = Math.max(1, state.step - 1);
    persist();
    renderStep();
  });

  /* --------------- RESUMEN PASO 5 --------------- */
  function buildResumen() {
    const f = state.date ? new Date(state.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
    $('#wizResume').innerHTML = `
      <dl>
        <dt>Tipo</dt><dd>${state.tipo || '—'}</dd>
        <dt>Destino</dt><dd>${state.destino || '—'}</dd>
        <dt>Fecha</dt><dd>${f}</dd>
        <dt>Duración</dt><dd>${state.duration} días</dd>
        <dt>Viajeros</dt><dd>${state.adults} adulto${state.adults!==1?'s':''}${state.kids?`, ${state.kids} niño${state.kids!==1?'s':''}`:''}</dd>
        <dt>Presupuesto</dt><dd>${state.budget || '—'}</dd>
      </dl>`;
  }

  /* --------------- ENVÍO A WHATSAPP --------------- */
  send.addEventListener('click', (e) => {
    if (!validateContact()) { e.preventDefault(); return; }
    const f = state.date ? new Date(state.date + 'T00:00:00').toLocaleDateString('es-CO') : '—';
    const msg =
`✈️ *Cotización PARAISOS*

👋 Hola, soy *${state.name}*

🌎 *Tipo:* ${state.tipo}
📍 *Destino:* ${state.destino}
📅 *Fecha:* ${f}
⏱ *Duración:* ${state.duration} días
👥 *Viajeros:* ${state.adults} adulto${state.adults!==1?'s':''}${state.kids?`, ${state.kids} niño${state.kids!==1?'s':''}`:''}
💰 *Presupuesto:* ${state.budget}

📞 ${state.phone}
✉️ ${state.email}

¡Espero su propuesta! 🌴`;
    send.href = `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(msg)}`;
  });

  /* --------------- PERSISTENCIA --------------- */
  function persist() { localStorage.setItem(STORAGE, JSON.stringify(state)); }

  /* --------------- INIT --------------- */
  renderStep();
})();
