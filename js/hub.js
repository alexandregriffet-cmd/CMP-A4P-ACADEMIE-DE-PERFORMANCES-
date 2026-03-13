(function () {
  const root = document.getElementById('hub-root');
  if (!root) return;

  let hub = null;
  try { hub = JSON.parse(localStorage.getItem('a4p_hub_results')) || null; } catch (error) { hub = null; }

  if (!hub || !hub.CMP) {
    root.innerHTML = `
      <section class="card empty-state">
        <h2>Aucun résultat CMP enregistré</h2>
        <p class="muted">Passe d’abord le questionnaire pour alimenter le hub local.</p>
        <div class="button-row center-row"><a class="btn btn-primary" href="test.html">Accéder au questionnaire</a></div>
      </section>`;
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
      <div class="hub-dims">
        ${renderScoreRow('confiance', cmp.dimensions?.confiance ?? 0)}
        ${renderScoreRow('régulation', cmp.dimensions?.regulation ?? 0)}
        ${renderScoreRow('engagement', cmp.dimensions?.engagement ?? 0)}
        ${renderScoreRow('stabilité', cmp.dimensions?.stabilite ?? 0)}
      </div>
      <p class="section-text hub-note">${cmp.summary}</p>
    </section>

    <section class="card details-block">
      <details>
        <summary>Voir les données JSON</summary>
        <pre class="code-block">${escapeHtml(JSON.stringify(hub, null, 2))}</pre>
      </details>
    </section>`;

  function renderScoreRow(label, value) {
    return `<div class="score-row"><div class="score-label">${label}</div><div class="score-track"><div class="score-fill" style="width:${value}%"></div></div><div class="score-value">${value}</div></div>`;
  }
  function escapeHtml(str) { return str.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
})();
