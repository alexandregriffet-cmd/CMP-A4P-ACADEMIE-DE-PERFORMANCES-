(function () {
  const STORAGE_ANSWERS = 'cmp_answers';
  const STORAGE_IDENTITY = 'cmp_identity';

  const root = document.getElementById('questions-root');
  const progressText = document.getElementById('progress-text');
  const progressPercent = document.getElementById('progress-percent');
  const progressFill = document.getElementById('progress-fill');
  const btnSubmit = document.getElementById('btn-submit');
  const btnReset = document.getElementById('btn-reset');

  const fields = {
    prenom: document.getElementById('prenom'),
    nom: document.getElementById('nom'),
    club: document.getElementById('club')
  };

  if (!root || !window.CMP_QUESTIONS || !window.CMP_SCALE) return;

  let answers = loadJSON(STORAGE_ANSWERS, {});
  const savedIdentity = loadJSON(STORAGE_IDENTITY, {});
  const passationContext = getPassationContext();

  prefillIdentityFromContext();
  bindIdentityEvents();

  function loadJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getPassationContext() {
    try {
      return JSON.parse(localStorage.getItem('cmp_passation_context') || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function getPassationToken() {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token') || '';
    const runtimeToken = window.CMP_RUNTIME?.passation?.token || '';
    const storedContextToken = passationContext.token || '';
    const localToken = localStorage.getItem('cmp_token') || '';
    const legacyToken = localStorage.getItem('cmp_passation_token') || '';

    const token = urlToken || runtimeToken || storedContextToken || localToken || legacyToken || '';

    if (token) {
      localStorage.setItem('cmp_token', token);
      localStorage.setItem('cmp_passation_token', token);
    }

    return token;
  }

  function prefillIdentityFromContext() {
    const prenomValue = savedIdentity.prenom || passationContext.firstname || '';
    const nomValue = savedIdentity.nom || passationContext.lastname || '';
    const clubValue = savedIdentity.club || '';

    if (fields.prenom) fields.prenom.value = prenomValue;
    if (fields.nom) fields.nom.value = nomValue;
    if (fields.club) fields.club.value = clubValue;

    saveIdentity();
  }

  function bindIdentityEvents() {
    Object.keys(fields).forEach((key) => {
      if (fields[key]) {
        fields[key].addEventListener('input', saveIdentity);
      }
    });
  }

  function saveIdentity() {
    localStorage.setItem(STORAGE_IDENTITY, JSON.stringify(getIdentity()));
  }

  function getIdentity() {
    return {
      prenom: fields.prenom?.value.trim() || '',
      nom: fields.nom?.value.trim() || '',
      club: fields.club?.value.trim() || '',
      email: passationContext.email || ''
    };
  }

  function renderQuestions() {
    root.innerHTML = window.CMP_QUESTIONS.map((question, index) => {
      const options = window.CMP_SCALE.map((scale) => {
        const checked = Number(answers[question.id]) === scale.value ? 'checked' : '';

        return `
          <label class="scale-option">
            <input type="radio" name="${question.id}" value="${scale.value}" ${checked} />
            <span class="scale-label">
              <span class="scale-number">${scale.value}</span>
              <span class="scale-text">${scale.label}</span>
            </span>
          </label>
        `;
      }).join('');

      return `
        <article class="card question-card" data-question="${question.id}">
          <div class="question-head">
            <span class="question-index">Question ${index + 1} / ${window.CMP_QUESTIONS.length}</span>
            <span class="dimension-badge">${capitalize(question.dimension)}</span>
          </div>
          <p class="question-text">${question.text}</p>
          <div class="scale">${options}</div>
        </article>
      `;
    }).join('');

    root.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener('change', (event) => {
        answers[event.target.name] = Number(event.target.value);
        persistAnswers();
        updateProgress();
      });
    });
  }

  function persistAnswers() {
    localStorage.setItem(STORAGE_ANSWERS, JSON.stringify(answers));
  }

  function updateProgress() {
    const answered = window.CMP_QUESTIONS.filter((question) => answers[question.id] != null).length;
    const total = window.CMP_QUESTIONS.length;
    const percent = Math.round((answered / total) * 100);

    if (progressText) progressText.textContent = `Progression ${answered} / ${total}`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressFill) progressFill.style.width = `${percent}%`;
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function validateForm() {
    const missing = window.CMP_QUESTIONS.filter((question) => answers[question.id] == null);

    if (missing.length) {
      const firstMissing = document.querySelector(`[data-question="${missing[0].id}"]`);
      firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alert(`Il manque ${missing.length} réponse(s). Merci de compléter tout le questionnaire.`);
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    saveIdentity();

    if (!validateForm()) return;

    const token = getPassationToken();
    if (!token) {
      alert("Token manquant dans l'URL ou le contexte local");
      return;
    }

    const scores = computeCMPScores(window.CMP_QUESTIONS, answers);
    const report = buildCMPInterpretation(scores, getIdentity());

    localStorage.setItem('cmp_result', JSON.stringify(report));

    if (typeof exportCMPToHub === 'function') {
      const exportResult = await exportCMPToHub(report);

      if (!exportResult || !exportResult.ok) {
        const errorMessage =
          exportResult?.error ||
          'Sauvegarde Supabase impossible';
        alert(`Sauvegarde Supabase impossible : ${errorMessage}`);
        return;
      }
    }

    window.location.href = 'resultats.html';
  }

  function handleReset() {
    if (!confirm('Réinitialiser toutes les réponses du questionnaire CMP ?')) return;

    answers = {};
    localStorage.removeItem(STORAGE_ANSWERS);
    localStorage.removeItem('cmp_result');

    renderQuestions();
    updateProgress();
  }

  btnSubmit?.addEventListener('click', handleSubmit);
  btnReset?.addEventListener('click', handleReset);

  renderQuestions();
  updateProgress();
})();
