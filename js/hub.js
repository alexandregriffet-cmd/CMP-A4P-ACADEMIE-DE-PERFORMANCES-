document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('hub-root');
  if (!root) return;
  let hub = {};
  try {
    hub = JSON.parse(localStorage.getItem('a4p_hub_results')) || {};
  } catch (_) {
    hub = {};
  }

  const cmp = hub.CMP;
  if (!cmp) {
    root.innerHTML = `
      <section class="panel">
        <h1>Hub A4P</h1>
        <p>Aucun résultat CMP n’a encore été transmis au hub.</p>
        <a class="btn" href="test.html">Passer le questionnaire</a>
      </section>
    `;
    return;
  }

  const dims = Object.entries(cmp.dimensions || {}).map(([k, v]) => `
    <div class="metric-card">
      <div class="metric-label">${window.CMP_DIMENSIONS[k] || k}</div>
      <div class="metric-value">${v}</div>
    </div>
  `).join('');

  root.innerHTML = `
    <section class="hero panel glass">
      <div>
        <p class="eyebrow">Hub diagnostic A4P</p>
        <h1>${cmp.profil_nom}</h1>
        <p class="lead">${cmp.summary}</p>
      </div>
      <div class="score-badge"><span>${cmp.score_global}</span><small>Score CMP</small></div>
    </section>

    <section class="panel">
      <h2>Dimensions remontées</h2>
      <div class="metrics-grid">${dims}</div>
    </section>

    <section class="panel">
      <h2>Payload actuel du hub</h2>
      <pre class="code-block">${escapeHtml(JSON.stringify(hub, null, 2))}</pre>
    </section>
  `;
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
