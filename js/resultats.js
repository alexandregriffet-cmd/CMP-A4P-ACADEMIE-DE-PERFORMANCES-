window.CMPResults = (() => {
  function getReport() {
    try {
      return JSON.parse(localStorage.getItem('cmp_result'));
    } catch (_) {
      return null;
    }
  }

  function renderList(items) {
    return items.map(item => `<li>${item}</li>`).join('');
  }

  function renderDimensionCards(dimensions) {
    return dimensions.map(item => `
      <div class="metric-card">
        <div class="metric-label">${item.label}</div>
        <div class="metric-value">${item.score}</div>
        <div class="metric-level">${item.level}</div>
      </div>
    `).join('');
  }

  function drawRadar(canvas, dimensions) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const labels = dimensions.map(item => item.label);
    const values = dimensions.map(item => item.score / 100);
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.32;

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30,47,79,0.18)';
    ctx.fillStyle = '#1e2f4f';
    ctx.font = '14px Arial';

    for (let level = 1; level <= 5; level++) {
      ctx.beginPath();
      labels.forEach((_, i) => {
        const angle = (-Math.PI / 2) + (i * 2 * Math.PI / labels.length);
        const x = cx + Math.cos(angle) * radius * (level / 5);
        const y = cy + Math.sin(angle) * radius * (level / 5);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    labels.forEach((label, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / labels.length);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();

      const lx = cx + Math.cos(angle) * (radius + 28);
      const ly = cy + Math.sin(angle) * (radius + 28);
      ctx.textAlign = lx < cx - 10 ? 'right' : lx > cx + 10 ? 'left' : 'center';
      ctx.textBaseline = ly < cy - 10 ? 'bottom' : ly > cy + 10 ? 'top' : 'middle';
      ctx.fillText(label, lx, ly);
    });

    ctx.beginPath();
    values.forEach((value, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / labels.length);
      const x = cx + Math.cos(angle) * radius * value;
      const y = cy + Math.sin(angle) * radius * value;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(56,189,248,0.22)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    values.forEach((value, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / labels.length);
      const x = cx + Math.cos(angle) * radius * value;
      const y = cy + Math.sin(angle) * radius * value;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1e2f4f';
      ctx.fill();
    });
  }

  function exportJson(report) {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cmp-a4p-${(report.identity.nom || 'resultat').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function render() {
    const report = getReport();
    const root = document.getElementById('cmp-report');
    if (!root) return;

    if (!report) {
      root.innerHTML = '<section class="panel"><h1>Résultat introuvable</h1><p>Aucun résultat CMP n’a été trouvé dans cette session.</p><p><a class="btn secondary" href="test.html">Revenir au questionnaire</a></p></section>';
      return;
    }

    const name = [report.identity?.prenom, report.identity?.nom].filter(Boolean).join(' ');

    root.innerHTML = `
      <section class="hero panel glass">
        <div>
          <p class="eyebrow">Diagnostic CMP A4P</p>
          <h1>${report.profil_nom}</h1>
          <p class="lead">${report.resume_court}</p>
          <div class="hero-meta">
            <span>Score global <strong>${report.score_global}/100</strong></span>
            <span>Code <strong>${report.profil_code}</strong></span>
            ${name ? `<span>Sportif <strong>${name}</strong></span>` : ''}
          </div>
        </div>
        <div class="score-badge">
          <span>${report.score_global}</span>
          <small>Indice global</small>
        </div>
      </section>

      <section class="grid-two">
        <div class="panel">
          <h2>Radar des 4 dimensions</h2>
          <canvas id="radar" width="500" height="420" aria-label="Radar CMP"></canvas>
        </div>
        <div class="panel">
          <h2>Scores par dimension</h2>
          <div class="metrics-grid">${renderDimensionCards(report.dimension_insights)}</div>
        </div>
      </section>

      <section class="panel">
        <h2>Lecture synthétique</h2>
        <p>${report.lecture_synthetique}</p>
      </section>

      <section class="grid-two">
        <div class="panel">
          <h2>Fonctionnement mental</h2>
          <p>${report.fonctionnement_mental}</p>
        </div>
        <div class="panel">
          <h2>Réaction sous pression</h2>
          <p>${report.reaction_pression}</p>
        </div>
      </section>

      <section class="panel">
        <h2>Comportement en situation de performance</h2>
        <p>${report.comportement_performance}</p>
      </section>

      <section class="grid-two">
        <div class="panel">
          <h2>Forces mentales</h2>
          <ul class="styled-list">${renderList(report.forces)}</ul>
        </div>
        <div class="panel">
          <h2>Points de vigilance</h2>
          <ul class="styled-list">${renderList(report.vigilances)}</ul>
        </div>
      </section>

      <section class="panel">
        <h2>Leviers de progression</h2>
        <ul class="styled-list">${renderList(report.leviers)}</ul>
      </section>
    `;

    const radar = document.getElementById('radar');
    drawRadar(radar, report.dimension_insights);

    document.getElementById('btn-export-json')?.addEventListener('click', () => exportJson(report));
  }

  return { render };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cmp-report')) {
    window.CMPResults.render();
  }
});
