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
      prenom: fields.prenom.value.trim(),
      nom: fields.nom.value.trim(),
      club: fields.club.value.trim()
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
    progressText.textContent = `Progression ${answered} / ${total}`;
    progressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
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

  async function supabaseRequest(path, options = {}) {
    const url = `${window.CMP_SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
      apikey: window.CMP_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.CMP_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    return fetch(url, {
      ...options,
      headers
    });
  }

  async function saveCmpResultToSupabase(report) {
    const token = new URLSearchParams(window.location.search).get('token') || '';

    if (!token) {
      return { ok: false, error: 'Token manquant dans l’URL' };
    }

    if (!window.CMP_SUPABASE_URL || !window.CMP_SUPABASE_ANON_KEY) {
      return { ok: false, error: 'Configuration Supabase manquante dans js/config.js' };
    }

    const passationResponse = await supabaseRequest(
      `passations?token=eq.${encodeURIComponent(token)}&select=id,player_id,token,module,status`,
      { method: 'GET' }
    );

    if (!passationResponse.ok) {
      const errorText = await passationResponse.text();
      return { ok: false, error: `Lecture passation impossible : ${errorText}` };
    }

    const passationRows = await passationResponse.json();
    const passation = Array.isArray(passationRows) ? passationRows[0] : null;

    if (!passation) {
      return { ok: false, error: 'Passation introuvable pour ce token' };
    }

    const payload = {
      passation_id: passation.id,
      player_id: passation.player_id || null,
      token,
      module: 'CMP',
      firstname: report.identity?.prenom || '',
      lastname: report.identity?.nom || '',
      email: null,
      club_structure: report.identity?.club || '',
      profile_code: report.profil_code || '',
      profile_label: report.profil_nom || '',
      score_global: report.score_global ?? null,
      confiance: report.dimensions?.confiance ?? null,
      regulation: report.dimensions?.regulation ?? null,
      engagement: report.dimensions?.engagement ?? null,
      stabilite: report.dimensions?.stabilite ?? null,
      raw_data: report
    };

    const insertResponse = await supabaseRequest('cmp_results', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      return { ok: false, error: `Insertion cmp_results impossible : ${errorText}` };
    }

    const updateResponse = await supabaseRequest(
      `passations?id=eq.${encodeURIComponent(passation.id)}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation'
        },
        body: JSON.stringify({ status: 'completed' })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return { ok: false, error: `Mise à jour passation impossible : ${errorText}` };
    }

    return { ok: true };
  }

  btnSubmit?.addEventListener('click', async () => {
    saveIdentity();
    if (!validateForm()) return;

    const scores = computeCMPScores(window.CMP_QUESTIONS, answers);
    const report = buildCMPInterpretation(scores, getIdentity());

    localStorage.setItem('cmp_result', JSON.stringify(report));
    exportCMPToHub(report);

    const saveResponse = await saveCmpResultToSupabase(report);

    if (!saveResponse.ok) {
      console.error(saveResponse.error);
      alert(`Résultat affiché, mais sauvegarde plateforme impossible : ${saveResponse.error}`);
    }

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
