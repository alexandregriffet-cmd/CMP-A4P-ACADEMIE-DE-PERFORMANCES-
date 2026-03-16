(function () {

  const STORAGE_ANSWERS = "cmp_answers";
  const STORAGE_IDENTITY = "cmp_identity";

  const root = document.getElementById("questions-root");
  const btnSubmit = document.getElementById("btn-submit");
  const btnReset = document.getElementById("btn-reset");

  if (!root || !window.CMP_QUESTIONS) return;

  let answers = JSON.parse(localStorage.getItem(STORAGE_ANSWERS) || "{}");

  function getIdentity() {
    return {
      prenom: document.getElementById("prenom")?.value || "",
      nom: document.getElementById("nom")?.value || "",
      club: document.getElementById("club")?.value || ""
    };
  }

  function saveAnswers() {
    localStorage.setItem(STORAGE_ANSWERS, JSON.stringify(answers));
  }

  function renderQuestions() {

    root.innerHTML = window.CMP_QUESTIONS.map((q, index) => {

      const options = window.CMP_SCALE.map(scale => {

        const checked = answers[q.id] == scale.value ? "checked" : "";

        return `
          <label class="scale-option">
            <input type="radio" name="${q.id}" value="${scale.value}" ${checked}>
            <span>${scale.value} - ${scale.label}</span>
          </label>
        `;

      }).join("");

      return `
        <div class="question-card">
          <div class="question-head">
            <span>Question ${index + 1} / ${window.CMP_QUESTIONS.length}</span>
          </div>

          <p>${q.text}</p>

          <div class="scale">
            ${options}
          </div>
        </div>
      `;

    }).join("");

    root.querySelectorAll("input").forEach(input => {

      input.addEventListener("change", (e) => {

        answers[e.target.name] = Number(e.target.value);

        saveAnswers();

      });

    });

  }

  function getToken() {

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("cmp_token", tokenFromUrl);
      return tokenFromUrl;
    }

    const tokenStored = localStorage.getItem("cmp_token");

    return tokenStored || "";

  }

  async function saveCmpResult(report) {

    const token = getToken();

    if (!token) {

      alert("Token manquant dans l'URL");

      return;

    }

    const payload = {
      token: token,
      profile_code: report.profil_code,
      profile_label: report.profil_nom,
      score_global: report.score_global,
      confiance: report.dimensions.confiance,
      regulation: report.dimensions.regulation,
      engagement: report.dimensions.engagement,
      stabilite: report.dimensions.stabilite,
      raw_data: report
    };

    const response = await fetch(
      `${window.CMP_SUPABASE_URL}/rest/v1/cmp_results`,
      {
        method: "POST",
        headers: {
          "apikey": window.CMP_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${window.CMP_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {

      console.error(await response.text());

      alert("Sauvegarde Supabase impossible");

      return;

    }

  }

  btnSubmit?.addEventListener("click", async () => {

    const scores = computeCMPScores(window.CMP_QUESTIONS, answers);

    const report = buildCMPInterpretation(scores, getIdentity());

    localStorage.setItem("cmp_result", JSON.stringify(report));

    await saveCmpResult(report);

    window.location.href = "resultats.html";

  });

  btnReset?.addEventListener("click", () => {

    if (!confirm("Réinitialiser les réponses ?")) return;

    answers = {};

    localStorage.removeItem(STORAGE_ANSWERS);

    localStorage.removeItem("cmp_result");

    renderQuestions();

  });

  renderQuestions();

})();
