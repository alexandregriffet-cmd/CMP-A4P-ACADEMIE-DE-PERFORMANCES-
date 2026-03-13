window.CMPTest = (() => {
  const ANSWERS_KEY = 'cmp_answers';
  const IDENTITY_KEY = 'cmp_identity';
  const RESULT_KEY = 'cmp_result';

  let currentIndex = 0;
  let answers = {};

  function qs(selector) { return document.querySelector(selector); }
  function qsa(selector) { return Array.from(document.querySelectorAll(selector)); }

  function loadState() {
    try { answers = JSON.parse(localStorage.getItem(ANSWERS_KEY)) || {}; } catch (_) { answers = {}; }
    try {
      const identity = JSON.parse(localStorage.getItem(IDENTITY_KEY)) || {};
      ['prenom','nom','club'].forEach((id) => {
        const el = document.getElementById(id);
        if (el && identity[id]) el.value = identity[id];
      });
    } catch (_) {}
  }

  function saveState() {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    const identity = {
      prenom: document.getElementById('prenom')?.value?.trim() || '',
      nom: document.getElementById('nom')?.value?.trim() || '',
      club: document.getElementById('club')?.value?.trim() || ''
    };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  }

  function answeredCount() {
    return window.CMP_QUESTIONS.filter(q => !!answers[q.id]).length;
  }

  function progressPercent() {
    return Math.round((answeredCount() / window.CMP_QUESTIONS.length) * 100);
  }

  function setProgress() {
    const pct = progressPercent();
    const bar = qs('.progress-fill');
    const txt = qs('#progress-text');
    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = `${answeredCount()} / ${window.CMP_QUESTIONS.length} questions répondues`;
  }

  function renderStep() {
    const q = window.CMP_QUESTIONS[currentIndex];
    const container = qs('#question-card');
    if (!container) return;

    const existing = answers[q.id] || '';
    container.innerHTML = `
      <div class="question-meta">
        <span class="pill">Question ${currentIndex + 1} / ${window.CMP_QUESTIONS.length}</span>
        <span class="pill muted">${window.CMP_DIMENSIONS[q.dimension]}</span>
      </div>
      <h2 class="question-title">${q.text}</h2>
      <div class="scale-grid" role="radiogroup" aria-label="Réponse">
        ${window.CMP_SCALE.map(item => `
          <label class="scale-option ${String(existing) === String(item.value) ? 'selected' : ''}">
            <input type="radio" name="cmp-answer" value="${item.value}" ${String(existing) === String(item.value) ? 'checked' : ''}>
            <span class="scale-value">${item.value}</span>
            <span class="scale-label">${item.label}</span>
          </label>
        `).join('')}
      </div>
    `;

    qsa('input[name="cmp-answer"]').forEach((input) => {
      input.addEventListener('change', (e) => {
        answers[q.id] = Number(e.target.value);
        saveState();
        setProgress();
        renderStep();
      });
    });

    qs('#btn-prev').disabled = currentIndex === 0;
    const isLast = currentIndex === window.CMP_QUESTIONS.length - 1;
    qs('#btn-next').hidden = isLast;
    qs('#btn-finish').hidden = !isLast;
    qs('#btn-next').disabled = !answers[q.id];
    qs('#btn-finish').disabled = !answers[q.id] || answeredCount() !== window.CMP_QUESTIONS.length;
  }

  function next() {
    if (currentIndex < window.CMP_QUESTIONS.length - 1) {
      currentIndex += 1;
      renderStep();
    }
  }

  function prev() {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderStep();
    }
  }

  function finish() {
    saveState();
    const identity = JSON.parse(localStorage.getItem(IDENTITY_KEY) || '{}');
    const scores = window.CMPCalc.computeScores(window.CMP_QUESTIONS, answers);
    const report = window.CMPInterpret.buildReport(scores, identity);
    localStorage.setItem(RESULT_KEY, JSON.stringify(report));
    window.CMPHub.exportToHub(report);
    window.location.href = 'resultats.html';
  }

  function bind() {
    qs('#btn-prev').addEventListener('click', prev);
    qs('#btn-next').addEventListener('click', next);
    qs('#btn-finish').addEventListener('click', finish);
    ['prenom','nom','club'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', saveState);
    });
  }

  function init() {
    loadState();
    bind();
    setProgress();
    renderStep();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('question-card')) {
    window.CMPTest.init();
  }
});
