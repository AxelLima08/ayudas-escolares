/* ============================================================
   EJERCICIOS.JS
   Lógica compartida para ejercitarios interactivos.

   Contiene:
     1. STATE MANAGER      — puntaje global y por sección
     2. TRUE / FALSE       — checkTF()
     3. MULTIPLE CHOICE    — checkMC()
     4. MATCHING           — selectLeft() / selectRight()
     5. CALCULATION        — checkCalc()
     6. FILL-IN-THE-BLANK  — checkFill()   ← nuevo para DL
     7. DRAG-TO-SORT       — initSort() / checkSort()  ← nuevo para DL
     8. SCENARIO CLASSIFY  — checkClassify()  ← nuevo para DL
     9. NAV & SCROLL       — goTo() / scrollToSection() / scroll listener
    10. RESET              — resetAll()
    11. PYRAMID BUILDER    — buildPyramid()   ← extraído de apuntes DL
   ============================================================ */

'use strict';

// ============================================================
// 1. STATE MANAGER
// ============================================================
const state = {
  answered: 0,
  correct:  0,
  sections: {}
};

function getOrCreate(key, total) {
  if (!state.sections[key]) state.sections[key] = { correct: 0, total: total };
  return state.sections[key];
}

function updateGlobal() {
  let tot = 0, cor = 0;
  Object.values(state.sections).forEach(s => { tot += s.total; cor += s.correct; });

  const scoreEl = document.getElementById('global-score');
  const subEl   = document.getElementById('global-sub');
  const barEl   = document.getElementById('global-bar');
  if (scoreEl) scoreEl.textContent = cor;
  if (subEl)   subEl.textContent   = `de ${tot} ejercicios respondidos`;
  const pct = tot > 0 ? Math.round((cor / tot) * 100) : 0;
  if (barEl) barEl.style.width = pct + '%';
}

function updateSection(key, fillId, scoreId, total) {
  const s = state.sections[key] || { correct: 0, total: total };
  const pct = total > 0 ? Math.round((s.correct / total) * 100) : 0;
  const fillEl  = document.getElementById(fillId);
  const scoreEl = document.getElementById(scoreId);
  if (fillEl)  fillEl.style.width  = pct + '%';
  if (scoreEl) scoreEl.textContent = s.correct + '/' + total;
}

// ============================================================
// 2. TRUE / FALSE
// ============================================================
const tfAnswered = {};

/**
 * checkTF(itemId, correct, chosen)
 *   itemId  — id del .tf-item  (ej: 'tf_s1_1')
 *   correct — 'V' o 'F'
 *   chosen  — 'V' o 'F' (la que clicó el usuario)
 */
function checkTF(itemId, correct, chosen) {
  if (tfAnswered[itemId]) return;
  tfAnswered[itemId] = true;

  const item = document.getElementById(itemId);
  const btns = item.querySelectorAll('.tf-btn');
  const fb   = document.getElementById(itemId + '_fb');
  const isCorrect = chosen === correct;

  btns.forEach(b => {
    const val = b.textContent.trim();
    if (val === correct)              b.classList.add('correct');
    if (val === chosen && !isCorrect) b.classList.add('wrong');
  });
  if (fb) fb.classList.add('show', isCorrect ? 'ok' : 'fail');

  const parts      = itemId.split('_');   // ['tf','s1','1']
  const sectionKey = parts[1] + '_tf';
  if (!state.sections[sectionKey]) state.sections[sectionKey] = { correct: 0, total: 0 };
  state.sections[sectionKey].total++;
  if (isCorrect) state.sections[sectionKey].correct++;
  updateGlobal();
}

// ============================================================
// 3. MULTIPLE CHOICE
// ============================================================
const mcAnswered = {};

/**
 * checkMC(itemId, chosen, correct)
 *   itemId  — id del .mc-item  (ej: 'mc_s1_1')
 *   chosen  — letra elegida ('a', 'b', 'c', 'd')
 *   correct — letra correcta
 */
function checkMC(itemId, chosen, correct) {
  if (mcAnswered[itemId]) return;
  mcAnswered[itemId] = true;

  const item = document.getElementById(itemId);
  const opts = item.querySelectorAll('.mc-opt');
  const fb   = document.getElementById(itemId + '_fb');
  const isCorrect = chosen === correct;

  opts.forEach(opt => {
    const letter = opt.querySelector('.opt-letter').textContent.trim().toLowerCase();
    if (letter === correct)              opt.classList.add('correct');
    if (letter === chosen && !isCorrect) opt.classList.add('wrong');
    opt.style.pointerEvents = 'none';
  });
  if (fb) fb.classList.add('show', isCorrect ? 'ok' : 'fail');

  const parts      = itemId.split('_');   // ['mc','s1','1']
  const sectionKey = parts[1] + '_mc';
  if (!state.sections[sectionKey]) state.sections[sectionKey] = { correct: 0, total: 0 };
  state.sections[sectionKey].total++;
  if (isCorrect) state.sections[sectionKey].correct++;
  updateGlobal();
}

// ============================================================
// 4. MATCHING
// ============================================================
const matchState = {};

/**
 * selectLeft(group, id)
 *   Marca el item izquierdo como seleccionado.
 */
function selectLeft(group, id) {
  const key = 'match_' + group;
  if (!matchState[key]) matchState[key] = { selected: null, matched: {}, correct: 0, total: 0 };
  const ms = matchState[key];
  if (ms.matched['l' + id]) return;

  if (ms.selected) {
    const prev = document.getElementById('ml_' + group + '_' + ms.selected);
    if (prev) prev.classList.remove('selected');
  }
  ms.selected = id;
  const el = document.getElementById('ml_' + group + '_' + id);
  if (el) el.classList.add('selected');
}

/**
 * selectRight(group, rightId, correctLeftId)
 *   Intenta emparejar el item derecho con el izquierdo seleccionado.
 */
function selectRight(group, rightId, correctLeftId) {
  const key = 'match_' + group;
  if (!matchState[key]) matchState[key] = { selected: null, matched: {}, correct: 0, total: 0 };
  const ms = matchState[key];
  if (!ms.selected) return;

  const rightEl = document.getElementById('mr_' + group + '_' + rightId);
  if (rightEl.classList.contains('matched')) return;

  const isCorrect = ms.selected === correctLeftId;
  const leftEl    = document.getElementById('ml_' + group + '_' + ms.selected);

  if (isCorrect) {
    leftEl.classList.remove('selected');
    leftEl.classList.add('matched');
    rightEl.classList.add('matched');
    ms.matched['l' + ms.selected] = true;
    ms.matched['r' + rightId]     = true;
    ms.correct++;

    const allLeft = document.querySelectorAll('#match_' + group + ' .match-left-item');
    ms.total = allLeft.length;

    const sectionKey = group + '_match';
    if (!state.sections[sectionKey]) state.sections[sectionKey] = { correct: 0, total: allLeft.length };
    state.sections[sectionKey].correct++;
    state.sections[sectionKey].total = allLeft.length;
    updateGlobal();

    const result = document.getElementById('match_' + group + '_result');
    if (result) result.textContent = '✅ ' + ms.correct + ' de ' + ms.total + ' correctos';
  } else {
    rightEl.classList.add('wrong-flash');
    setTimeout(() => rightEl.classList.remove('wrong-flash'), 600);
    leftEl.classList.remove('selected');
    const result = document.getElementById('match_' + group + '_result');
    if (result) { result.style.color = 'var(--coral)'; result.textContent = '❌ Incorrecto, intentá de nuevo'; }
  }
  ms.selected = null;
}

// ============================================================
// 5. CALCULATION
// ============================================================
const calcAnswered = {};

/**
 * checkCalc(inputId, correct, tolerance, scoreKey)
 *   inputId   — id del <input>
 *   correct   — número correcto
 *   tolerance — margen de error aceptado (ej: 0.5)
 *   scoreKey  — clave para el feedback (ej: 's6_c1')
 */
function checkCalc(inputId, correct, tolerance, scoreKey) {
  if (calcAnswered[inputId]) return;
  const input = document.getElementById(inputId);
  const val   = parseFloat(input.value);
  const fb    = document.getElementById('fb_' + scoreKey);
  if (isNaN(val)) return;

  const isCorrect = Math.abs(val - correct) <= tolerance;
  calcAnswered[inputId] = true;
  input.disabled = true;
  input.classList.add(isCorrect ? 'correct-input' : 'wrong-input');
  if (fb) fb.classList.add('show', isCorrect ? 'ok' : 'fail');

  const sectionKey = scoreKey.replace(/_c\d+$/, '') + '_calc';
  if (!state.sections[sectionKey]) state.sections[sectionKey] = { correct: 0, total: 0 };
  state.sections[sectionKey].total++;
  if (isCorrect) state.sections[sectionKey].correct++;
  updateGlobal();
}

// ============================================================
// 6. FILL-IN-THE-BLANK  ← NUEVO (Derecho Laboral)
// ============================================================
const fillAnswered = {};

/**
 * checkFill(inputId, acceptedAnswers, feedbackOk, feedbackFail)
 *   inputId         — id del <input class="fill-input">
 *   acceptedAnswers — array de strings aceptados (case-insensitive, trim)
 *   feedbackOk      — texto si correcto  (opcional)
 *   feedbackFail    — texto si incorrecto (opcional)
 *
 * Uso en HTML:
 *   <input class="fill-input" id="fill_s1_1"
 *          onblur="checkFill('fill_s1_1',
 *            ['protectorio','principio protectorio'],
 *            '✅ Correcto. Es el principio protectorio.',
 *            '❌ Revisá: es el Principio Protectorio.')" />
 */
function checkFill(inputId, acceptedAnswers, feedbackOk, feedbackFail) {
  if (fillAnswered[inputId]) return;
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = input.value.trim().toLowerCase();
  if (!val) return;

  const isCorrect = acceptedAnswers.some(a => a.trim().toLowerCase() === val);
  fillAnswered[inputId] = true;
  input.disabled = true;
  input.classList.add(isCorrect ? 'ok' : 'fail');

  const fbEl = document.getElementById(inputId + '_fb');
  if (fbEl) {
    fbEl.textContent = isCorrect
      ? (feedbackOk   || '✅ Correcto.')
      : (feedbackFail || '❌ Incorrecto.');
    fbEl.classList.add('show', isCorrect ? 'ok' : 'fail');
  }

  const parts      = inputId.split('_');   // ['fill','s1','1']
  const sectionKey = parts[1] + '_fill';
  if (!state.sections[sectionKey]) state.sections[sectionKey] = { correct: 0, total: 0 };
  state.sections[sectionKey].total++;
  if (isCorrect) state.sections[sectionKey].correct++;
  updateGlobal();
}

// ============================================================
// 7. DRAG-TO-SORT  ← NUEVO (Derecho Laboral)
// ============================================================

/**
 * initSort(containerId)
 *   Inicializa el drag-and-drop en un .sort-container.
 *   Cada .sort-item debe tener data-order="N" con el orden correcto (1-based).
 *
 * Uso en HTML:
 *   <div class="sort-container" id="sort_s2_1">
 *     <div class="sort-item" data-order="3">Texto C</div>
 *     <div class="sort-item" data-order="1">Texto A</div>
 *     <div class="sort-item" data-order="2">Texto B</div>
 *   </div>
 *   <button class="check-btn sort-check-btn"
 *           onclick="checkSort('sort_s2_1','s2')">Verificar orden</button>
 */
function initSort(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let draggedEl = null;

  container.querySelectorAll('.sort-item').forEach(item => {
    // add handle icon if not present
    if (!item.querySelector('.sort-handle')) {
      const handle = document.createElement('span');
      handle.className = 'sort-handle';
      handle.textContent = '⠿';
      item.prepend(handle);
    }

    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', () => {
      draggedEl = item;
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      container.querySelectorAll('.sort-item').forEach(i => i.classList.remove('drag-over'));
      draggedEl = null;
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      container.querySelectorAll('.sort-item').forEach(i => i.classList.remove('drag-over'));
      item.classList.add('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (draggedEl && draggedEl !== item) {
        const items = [...container.querySelectorAll('.sort-item')];
        const fromIdx = items.indexOf(draggedEl);
        const toIdx   = items.indexOf(item);
        if (fromIdx < toIdx) container.insertBefore(draggedEl, item.nextSibling);
        else                 container.insertBefore(draggedEl, item);
      }
    });
  });
}

/**
 * checkSort(containerId, sectionId)
 *   Verifica si el orden actual coincide con data-order.
 *   sectionId — ej: 's2'
 */
function checkSort(containerId, sectionId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = [...container.querySelectorAll('.sort-item')];

  let correct = 0;
  items.forEach((item, idx) => {
    const expected = parseInt(item.dataset.order, 10);
    const isOk     = expected === idx + 1;
    item.classList.remove('correct-sort', 'incorrect-sort');
    item.classList.add(isOk ? 'correct-sort' : 'incorrect-sort');
    if (isOk) correct++;
    item.setAttribute('draggable', 'false');
    item.style.cursor = 'default';
  });

  const total = items.length;
  const fbId  = containerId + '_result';
  const fbEl  = document.getElementById(fbId);
  if (fbEl) {
    fbEl.textContent = correct === total
      ? `✅ ¡Perfecto! Orden correcto (${correct}/${total})`
      : `❌ ${correct} de ${total} en la posición correcta. Revisá los marcados en rojo.`;
    fbEl.style.color  = correct === total ? 'var(--teal)' : 'var(--coral)';
    fbEl.style.fontWeight = '600';
    fbEl.style.marginTop  = '8px';
    fbEl.style.display    = 'block';
  }

  const sectionKey = sectionId + '_sort';
  if (!state.sections[sectionKey]) state.sections[sectionKey] = { correct: 0, total: total };
  state.sections[sectionKey].correct = correct;
  state.sections[sectionKey].total   = total;
  updateGlobal();
}

// ============================================================
// 8. SCENARIO CLASSIFY  ← NUEVO (Derecho Laboral)
// ============================================================

/**
 * checkClassify(itemId, chosen, correct)
 *   Para ejercicios donde hay que clasificar un caso laboral
 *   en una categoría (ej: principio, tipo de contrato, sujeto, etc.)
 *
 *   itemId  — id del .mc-item que contiene las opciones
 *   chosen  — opción elegida
 *   correct — opción correcta
 *
 *   Internamente idéntico a checkMC, pero registra en clave '_classify'
 *   para diferenciar en el scoreboard.
 */
function checkClassify(itemId, chosen, correct) {
  if (mcAnswered[itemId]) return;
  mcAnswered[itemId] = true;

  const item = document.getElementById(itemId);
  const opts = item.querySelectorAll('.mc-opt');
  const fb   = document.getElementById(itemId + '_fb');
  const isCorrect = chosen === correct;

  opts.forEach(opt => {
    const letter = opt.querySelector('.opt-letter').textContent.trim().toLowerCase();
    if (letter === correct)              opt.classList.add('correct');
    if (letter === chosen && !isCorrect) opt.classList.add('wrong');
    opt.style.pointerEvents = 'none';
  });
  if (fb) fb.classList.add('show', isCorrect ? 'ok' : 'fail');

  const parts      = itemId.split('_');
  const sectionKey = parts[1] + '_classify';
  if (!state.sections[sectionKey]) state.sections[sectionKey] = { correct: 0, total: 0 };
  state.sections[sectionKey].total++;
  if (isCorrect) state.sections[sectionKey].correct++;
  updateGlobal();
}

// ============================================================
// 9. NAV & SCROLL
// ============================================================

/** Usado en GPP_Ejercitario */
function goTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

/** Usado en apuntes-derecho-laboral */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('scrollBtn');
  if (btn) btn.classList.toggle('visible', window.scrollY > 400);

  const sections = document.querySelectorAll('.section');
  const navItems = document.querySelectorAll('.nav-item');
  let current = 0;
  sections.forEach((s, i) => { if (window.scrollY >= s.offsetTop - 120) current = i; });
  navItems.forEach((n, i) => n.classList.toggle('active', i === current));
});

// ============================================================
// 10. RESET
// ============================================================
function resetAll() {
  if (!confirm('¿Reiniciar todos los ejercicios? Se perderá tu progreso.')) return;
  window.location.reload();
}

// ============================================================
// 11. PYRAMID BUILDER (extraído de apuntes-derecho-laboral.html)
// ============================================================

/**
 * buildPyramid(containerId, levels)
 *   containerId — id del div que aloja la pirámide
 *   levels      — array de objetos: [{ label, color, barW }, ...]
 *                 en orden de más alto a más bajo rango
 *
 * Uso en HTML:
 *   <div class="pyramid-wrap"><div id="pyramidContainer"></div></div>
 *   <script>
 *     buildPyramid('pyramidContainer', NORMAS_LABORALES);
 *   </script>
 */
const NORMAS_LABORALES = [
  { label: 'CN Art. 14 bis — Derechos laborales y Seguridad Social',                       color: '#4A90D9', barW: 14 },
  { label: 'Tratados Internacionales / Convenios OIT / Pacto San José de Costa Rica',       color: '#2563EB', barW: 22 },
  { label: 'Leyes Nacionales: LCT 20.744 — Ley de Asociaciones — Ley de Riesgos del Trabajo', color: '#0D9E75', barW: 32 },
  { label: 'Convenios Colectivos de Trabajo',                                               color: '#D97706', barW: 42 },
  { label: 'Estatutos Profesionales',                                                       color: '#D85A30', barW: 52 },
  { label: 'Usos y costumbres',                                                             color: '#6D28D9', barW: 62 },
  { label: 'Contratos Individuales de Trabajo',                                             color: '#4B5563', barW: 72 },
];

function buildPyramid(containerId, levels) {
  const container = document.getElementById(containerId);
  if (!container) return;
  levels.forEach((lvl, i) => {
    const row  = document.createElement('div');
    row.className = 'pyramid-level';

    const rank = document.createElement('div');
    rank.className = 'pyramid-rank';
    rank.textContent = (levels.length - i) + '°';

    const bar = document.createElement('div');
    bar.className = 'pyramid-bar';
    bar.style.cssText = `background:${lvl.color}; width:${lvl.barW}px;`;

    const text = document.createElement('div');
    text.className = 'pyramid-text';
    text.textContent = lvl.label;

    row.appendChild(rank);
    row.appendChild(bar);
    row.appendChild(text);
    container.appendChild(row);
  });
}

// Auto-build pyramid if container exists on this page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('pyramidContainer')) {
    buildPyramid('pyramidContainer', NORMAS_LABORALES);
  }

  // Auto-init all sort containers
  document.querySelectorAll('.sort-container').forEach(c => initSort(c.id));
});
