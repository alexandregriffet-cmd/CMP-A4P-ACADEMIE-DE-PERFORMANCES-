(function () {
  const root = document.getElementById('result-root');
  if (!root) return;

  let report = null;
  try { report = JSON.parse(localStorage.getItem('cmp_result')) || null; } catch (error) { report = null; }

  if (!report) {
    root.innerHTML = `
      <section class="card empty-state">
        <p class="eyebrow">Résultat introuvable</p>
        <h1>Aucun diagnostic CMP disponible</h1>
        <p class="muted">Complète d’abord le questionnaire pour générer le rapport et le radar.</p>
        <div class="button-row center-row"><a class="btn btn-primary" href="test.html">Accéder au questionnaire</a></div>
      </section>`;
    return;
  }

  const identityLine = [report.identity?.prenom, report.identity?.nom].filter(Boolean).join(' ');
  const clubLine = report.identity?.club ? ` · ${report.identity.club}` : '';

  root.className = 'result-root-stack';
  root.innerHTML = `
    <section class="card hero-summary-card">
      <p class="eyebrow">Diagnostic CMP A4P</p>
      <h1>${report.profil_nom}</h1>
      <p class="lead muted-strong">${report.resume_court}</p>
      <div class="hero-score">
        <span class="meta-pill">Score global : ${report.score_global}/100</span>
        <span class="meta-pill">Code profil : ${report.profil_code}</span>
        ${identityLine ? `<span class="meta-pill">${identityLine}${clubLine}</span>` : ''}
      </div>
    </section>

    <section class="two-col">
      <section class="card radar-card">
        <h2 class="panel-title">Radar des 4 dimensions</h2>
        <div class="radar-wrap"><canvas id="radar-chart" width="420" height="420"></canvas></div>
      </section>

      <section class="card">
        <h2 class="panel-title">Scores par dimension</h2>
        <div class="score-grid">
          ${renderScoreRow('confiance', report.dimensions.confiance)}
          ${renderScoreRow('régulation', report.dimensions.regulation)}
          ${renderScoreRow('engagement', report.dimensions.engagement)}
          ${renderScoreRow('stabilité', report.dimensions.stabilite)}
        </div>
      </section>
    </section>

    ${renderTextCard('Lecture synthétique', report.lecture_synthetique)}
    ${renderTextCard('Fonctionnement mental dominant', report.fonctionnement_mental)}
    ${renderTextCard('Comportement en situation de performance', report.comportement_performance)}
    ${renderTextCard('Réaction sous pression', report.reaction_pression)}

    <section class="two-col">
      <section class="card"><h2 class="section-heading">Forces mentales</h2>${renderList(report.forces)}</section>
      <section class="card"><h2 class="section-heading">Points de vigilance</h2>${renderList(report.vigilances)}</section>
    </section>

    <section class="card"><h2 class="section-heading">Leviers de progression</h2>${renderList(report.leviers)}</section>

    <section class="card details-block">
      <details>
        <summary>Voir la donnée technique hub</summary>
        <pre class="code-block">${escapeHtml(JSON.stringify({
          test: report.test,
          profil_code: report.profil_code,
          profil_nom: report.profil_nom,
          score_global: report.score_global,
          dimensions: report.dimensions,
          summary: report.resume_court
        }, null, 2))}</pre>
      </details>
    </section>`;

  drawRadar('radar-chart', report.dimensions);

  function renderTextCard(title, text) {
    return `<section class="card"><h2 class="section-heading">${title}</h2><p class="section-text">${text}</p></section>`;
  }
  function renderScoreRow(label, value) {
    return `<div class="score-row"><div class="score-label">${label}</div><div class="score-track"><div class="score-fill" style="width:${value}%"></div></div><div class="score-value">${value}</div></div>`;
  }
  function renderList(items) { return `<ul class="nice-list section-text">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`; }
  function escapeHtml(str) { return str.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

  function drawRadar(canvasId, dimensions) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const cssSize = Math.min(canvas.parentElement.clientWidth || 340, 380);
    canvas.style.width = cssSize + 'px';
    canvas.style.height = cssSize + 'px';
    canvas.width = cssSize * ratio;
    canvas.height = cssSize * ratio;

    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    const labels = [['Confiance', dimensions.confiance], ['Régulation', dimensions.regulation], ['Engagement', dimensions.engagement], ['Stabilité', dimensions.stabilite]];
    const w = cssSize;
    const h = cssSize;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.28;
    const levels = 5;

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;

    for (let level = 1; level <= levels; level++) {
      const r = (maxR / levels) * level;
      ctx.beginPath();
      labels.forEach((_, index) => {
        const angle = (-Math.PI / 2) + (Math.PI * 2 * index / labels.length);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(31,53,96,0.12)';
      ctx.stroke();
    }

    labels.forEach(([label], index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index / labels.length);
      const x = cx + Math.cos(angle) * maxR;
      const y = cy + Math.sin(angle) * maxR;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.strokeStyle = 'rgba(31,53,96,0.14)'; ctx.stroke();
      const labelX = cx + Math.cos(angle) * (maxR + 28);
      const labelY = cy + Math.sin(angle) * (maxR + 28);
      ctx.fillStyle = '#1f3560';
      ctx.font = '700 13px Inter, Arial, sans-serif';
      ctx.textAlign = Math.abs(Math.cos(angle)) < 0.2 ? 'center' : (Math.cos(angle) > 0 ? 'left' : 'right');
      ctx.textBaseline = Math.abs(Math.sin(angle)) < 0.2 ? 'middle' : (Math.sin(angle) > 0 ? 'top' : 'bottom');
      ctx.fillText(label, labelX, labelY);
    });

    ctx.beginPath();
    labels.forEach(([_, value], index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index / labels.length);
      const r = (value / 100) * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(47,77,133,0.22)';
    ctx.strokeStyle = '#2f4d85';
    ctx.lineWidth = 3;
    ctx.fill(); ctx.stroke();

    labels.forEach(([_, value], index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index / labels.length);
      const r = (value / 100) * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = '#1f3560'; ctx.fill();
    });
  }
})();
