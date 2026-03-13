function readResult() {
  try { return JSON.parse(localStorage.getItem('cmp_result')); } catch (e) { return null; }
}

function renderList(items) {
  return items.map(item => `<li>${item}</li>`).join('');
}

function renderDimensionBars(dimensions) {
  return Object.entries(dimensions)
    .map(([key, value]) => `
      <div class="score-row">
        <div class="score-label">${key}</div>
        <div class="score-bar"><div class="score-fill" style="width:${value}%"></div></div>
        <div class="score-value">${value}</div>
      </div>
    `)
    .join('');
}

function drawRadar(canvas, dimensions) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const labels = ['confiance', 'regulation', 'engagement', 'stabilite'];
  const values = labels.map((k) => dimensions[k] || 0);

  const dpr = window.devicePixelRatio || 1;
  const size = 420;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const radius = 140;
  const levels = 5;

  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.fillStyle = '#eef4ff';
  ctx.lineWidth = 1;
  ctx.font = '14px Inter, sans-serif';

  for (let level = 1; level <= levels; level++) {
    const r = (radius / levels) * level;
    ctx.beginPath();
    labels.forEach((_, i) => {
      const angle = (-Math.PI / 2) + (i * Math.PI * 2 / labels.length);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  labels.forEach((label, i) => {
    const angle = (-Math.PI / 2) + (i * Math.PI * 2 / labels.length);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    const lx = cx + Math.cos(angle) * (radius + 28);
    const ly = cy + Math.sin(angle) * (radius + 28);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, ly);
  });

  ctx.beginPath();
  values.forEach((value, i) => {
    const ratio = value / 100;
    const angle = (-Math.PI / 2) + (i * Math.PI * 2 / labels.length);
    const x = cx + Math.cos(angle) * radius * ratio;
    const y = cy + Math.sin(angle) * radius * ratio;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(124,199,255,0.22)';
  ctx.strokeStyle = 'rgba(124,199,255,0.95)';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

function downloadJSON(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cmp-a4p-${(report.identity?.prenom || 'resultat').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderCMPResults(report) {
  const root = document.getElementById('cmp-report');
  if (!root) return;

  const identite = [report.identity?.prenom, report.identity?.nom].filter(Boolean).join(' ');
  root.innerHTML = `
    <section class="card card-hero">
      <p class="eyebrow">Diagnostic CMP A4P</p>
      <h1>${report.profil_nom}</h1>
      <p class="lead">${report.resume_court}</p>
      <div class="hero-meta">
        <span>Score global : <strong>${report.score_global}/100</strong></span>
        <span>Code profil : <strong>${report.profil_code}</strong></span>
        ${identite ? `<span>Bénéficiaire : <strong>${identite}</strong></span>` : ''}
        ${report.identity?.club ? `<span>Club : <strong>${report.identity.club}</strong></span>` : ''}
      </div>
    </section>

    <section class="report-grid">
      <div class="card">
        <h2>Scores par dimension</h2>
        ${renderDimensionBars(report.dimensions)}
      </div>
      <div class="card radar-wrap">
        <canvas id="radar-chart" aria-label="Graphique radar CMP"></canvas>
      </div>
    </section>

    <section class="card">
      <h2>Lecture synthétique</h2>
      <p>${report.lecture_synthetique}</p>
    </section>

    <section class="card">
      <h2>Fonctionnement mental dominant</h2>
      <p>${report.fonctionnement_mental}</p>
    </section>

    <section class="card">
      <h2>Comportement en situation de performance</h2>
      <p>${report.comportement_performance}</p>
    </section>

    <section class="card">
      <h2>Réaction sous pression</h2>
      <p>${report.reaction_pression}</p>
    </section>

    <section class="card two-cols">
      <div>
        <h2>Forces mentales</h2>
        <ul>${renderList(report.forces)}</ul>
      </div>
      <div>
        <h2>Points de vigilance</h2>
        <ul>${renderList(report.vigilances)}</ul>
      </div>
    </section>

    <section class="card">
      <h2>Leviers de progression</h2>
      <ul>${renderList(report.leviers)}</ul>
    </section>
  `;

  drawRadar(document.getElementById('radar-chart'), report.dimensions);
  document.getElementById('btn-export-json')?.addEventListener('click', () => downloadJSON(report));
}

document.addEventListener('DOMContentLoaded', () => {
  const report = readResult();
  const root = document.getElementById('cmp-report');

  if (!report) {
    root.innerHTML = `
      <section class="card">
        <h1>Résultat introuvable</h1>
        <p>Aucun résultat CMP n’a été trouvé dans cette session.</p>
        <p><a class="text-link" href="test.html">Revenir au test</a></p>
      </section>
    `;
    return;
  }

  renderCMPResults(report);
});
