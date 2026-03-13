(function () {
  const root = document.getElementById('hub-root');
  if (!root) return;

  let hub = null;
  try {
    hub = JSON.parse(localStorage.getItem('a4p_hub_results')) || null;
  } catch (error) {
    hub = null;
  }

  if (!hub || !hub.CMP) {
    root.innerHTML = `
      <section class="card empty-state">
        <h2>Aucun résultat CMP enregistré</h2>
        <p class="muted">Passe d’abord le questionnaire pour alimenter le hub local.</p>
        <div class="button-row center-row">
          <a class="btn btn-primary" href="test.html">Accéder au questionnaire</a>
        </div>
      </section>
    `;
    return;
  }

  const cmp = hub.CMP;
  const identity = [cmp.identity?.prenom, cmp.identity?.nom].filter(Boolean).join(' ');

  root.innerHTML = `
    <section class="card">
      <h2>Module CMP</h2>
      <div class="meta-grid">
        <span class="meta-pill">Profil : ${cmp.profil_nom}</span>
        <span class="meta-pill">Score global : ${cmp.score_global}/100</span>
        ${identity ? `<span class="meta-pill">${identity}</span>` : ''}
      </div>
      <p class="muted" style="margin-top:16px;">${cmp.summary}</p>
    </section>

    <section class="card">
      <h2>Données JSON</h2>
      <pre class="code-block">${escapeHtml(JSON.stringify(hub, null, 2))}</pre>
    </section>
  `;

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
})();
