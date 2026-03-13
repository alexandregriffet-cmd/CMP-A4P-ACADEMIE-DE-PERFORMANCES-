const CMP_STORAGE = {
  answers: 'cmp_answers',
  identity: 'cmp_identity',
  result: 'cmp_result'
};

function renderQuestions() {
  const root = document.getElementById('questions-root');
  if (!root) return;

  root.innerHTML = window.CMP_QUESTIONS.map((q, index) => `
    <section class="question-card">
      <div class="question-head">
        <span class="question-number">Question ${index + 1}</span>
        <span class="question-dimension">${q.dimension}</span>
      </div>
      <div class="question-text">${q.text}</div>
      <div class="scale">
        ${window.CMP_SCALE.map((opt) => `
          <div class="scale-option">
            <input type="radio" id="${q.id}_${opt.value}" name="${q.id}" value="${opt.value}" />
            <label for="${q.id}_${opt.value}">
              <span class="value">${opt.value}</span>
              <span class="legend">${opt.label}</span>
            </label>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function getIdentityFromForm() {
  return {
    prenom: document.getElementById('prenom')?.value?.trim() || '',
    nom: document.getElementById('nom')?.value?.trim() || '',
    club: document.getElementById('club')?.value?.trim() || ''
  };
}

function setIdentityOnForm(identity = {}) {
  document.getElementById('prenom').value = identity.prenom || '';
  document.getElementById('nom').value = identity.nom || '';
  document.getElementById('club').value = identity.club || '';
}

function collectAnswers() {
  const answers = {};
  window.CMP_QUESTIONS.forEach((q) => {
    const checked = document.querySelector(`input[name="${q.id}"]:checked`);
    if (checked) answers[q.id] = Number(checked.value);
  });
  return answers;
}

function hydrateAnswers(answers = {}) {
  Object.entries(answers).forEach(([key, value]) => {
    const el = document.querySelector(`input[name="${key}"][value="${value}"]`);
    if (el) el.checked = true;
  });
}

function saveDraft() {
  localStorage.setItem(CMP_STORAGE.answers, JSON.stringify(collectAnswers()));
  localStorage.setItem(CMP_STORAGE.identity, JSON.stringify(getIdentityFromForm()));
  updateProgress();
}

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}

function updateProgress() {
  const answers = collectAnswers();
  const done = Object.keys(answers).length;
  const total = window.CMP_QUESTIONS.length;
  const pct = Math.round((done / total) * 100);
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  if (fill) fill.style.width = `${pct}%`;
  if (text) text.textContent = `${done} / ${total}`;
}

function validateForm() {
  const answers = collectAnswers();
  const missing = window.CMP_QUESTIONS.filter(q => !answers[q.id]);
  if (missing.length) {
    alert(`Il manque ${missing.length} réponse(s). Merci de compléter tout le questionnaire.`);
    return false;
  }
  return true;
}

function saveCMPResult() {
  if (!validateForm()) return;

  const identity = getIdentityFromForm();
  const answers = collectAnswers();
  const scores = computeCMPScores(window.CMP_QUESTIONS, answers);
  const report = buildCMPInterpretation(scores, identity);

  localStorage.setItem(CMP_STORAGE.answers, JSON.stringify(answers));
  localStorage.setItem(CMP_STORAGE.identity, JSON.stringify(identity));
  localStorage.setItem(CMP_STORAGE.result, JSON.stringify(report));

  exportCMPToHub(report);
  window.location.href = 'resultats.html';
}

function resetCMP() {
  if (!confirm('Effacer les réponses enregistrées pour ce test ?')) return;
  localStorage.removeItem(CMP_STORAGE.answers);
  localStorage.removeItem(CMP_STORAGE.identity);
  localStorage.removeItem(CMP_STORAGE.result);
  renderQuestions();
  bindEvents();
  updateProgress();
  setIdentityOnForm({});
}

function bindEvents() {
  document.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener('change', saveDraft);
  });
  ['prenom', 'nom', 'club'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', saveDraft);
  });
  document.getElementById('btn-finish')?.addEventListener('click', saveCMPResult);
  document.getElementById('btn-reset')?.addEventListener('click', resetCMP);
}

document.addEventListener('DOMContentLoaded', () => {
  renderQuestions();
  hydrateAnswers(readJSON(CMP_STORAGE.answers) || {});
  setIdentityOnForm(readJSON(CMP_STORAGE.identity) || {});
  bindEvents();
  updateProgress();
});
