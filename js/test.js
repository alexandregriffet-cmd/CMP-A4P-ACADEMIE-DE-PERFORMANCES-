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

  if (!root || !window.CMP_QUESTIONS) return;

  let answers = loadJSON(STORAGE_ANSWERS, {});
  const savedIdentity = loadJSON(STORAGE_IDENTITY, {});

  Object.keys(fields).forEach((key) => {
    if (fields[key]) fields[key].value = savedIdentity[key] || '';
    fields[key]?.addEventListener('input', saveIdentity);
  });

  function loadJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveIdentity() {
    localStorage.setItem(STORAGE_IDENTITY, JSON.stringify(getIdentity()));
  }

  function getIdentity() {
    return {
      prenom: fields.prenom?.value.trim() || '',
      nom: fields.nom?.value.trim() || '',
      club: fields.club?.value.trim() || ''
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

  function getPassationToken() {
    const urlToken = new URLSearchParams(window.location.search).get('token') || '';

    if (urlToken) {
      localStorage.setItem('cmp_token', urlToken);
      return urlToken;
    }

    try {
      const storedContext = JSON.parse(localStorage.getItem('cmp_passation_context') || '{}');
      if (storedContext?.token) {
        localStorage.setItem('cmp_token', storedContext.token);
        return storedContext.token;
      }
    } catch (error) {}

    return localStorage.getItem('cmp_token') || '';
  }

  async function supabaseInsertCmpResult(report) {
    const token = getPassationToken();

    if (!token) {
      alert("Token manquant dans l'URL");
      return false;
    }

    if (!window.CMP_SUPABASE_URL || !window.CMP_SUPABASE_ANON_KEY) {
      alert("Configuration Supabase manquante");
      return false;
    }

    const response = await fetch(`${window.CMP_SUPABASE_URL}/rest/v1/cmp_results`, {
      method: 'POST',
      headers: {
        apikey: window.CMP_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.CMP_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        token: token,
        profile_code: report.profil_code,
        profile_label: report.profil_nom,
        score_global: report.score_global,
        confiance: report.dimensions?.confiance ?? null,
        regulation: report.dimensions?.regulation ?? null,
        engagement: report.dimensions?.engagement ?? null,
        stabilite: report.dimensions?.stabilite ?? null,
        raw_data: report
      })
    });

    if (!response.ok) {
      console.error(await response.text());
      alert("Sauvegarde Supabase impossible");
      return false;
    }

    return true;
  }

  btnSubmit?.addEventListener('click', async () => {
    saveIdentity();

    if (!validateForm()) return;

    const scores = computeCMPScores(window.CMP_QUESTIONS, answers);
    const report = buildCMPInterpretation(scores, getIdentity());

    localStorage.setItem('cmp_result', JSON.stringify(report));

    if (typeof exportCMPToHub === 'function') {
      try {
        exportCMPToHub(report);
      } catch (error) {
        console.error(error);
      }
    }

    await supabaseInsertCmpResult(report);

    window.location.href = 'resultats.html';
  });

  btnReset?.addEventListener('click', () => {
    if (!confirm('Réinitialiser toutes les réponses du questionnaire CMP ?')) return;
    answers = {};
    localStorage.removeItem(STORAGE_ANSWERS);
    localStorage.removeItem('cmp_result');
    renderQuestions();
    updateProgress();
  });

  renderQuestions();
  updateProgress();
})();
