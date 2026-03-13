(function () {
  const config = window.A4P_CONFIG || { storageKey: 'a4p_hub_results', urls: {} };

  const defaultData = {
    CMP: {
      test: 'CMP',
      profil_code: 'CMP-2',
      profil_nom: 'Mobilisation forte mais régulation fluctuante',
      score_global: 64,
      dimensions: {
        confiance: 56,
        regulation: 44,
        engagement: 75,
        stabilite: 81
      },
      summary: 'L’énergie mentale est présente et l’engagement est fort, mais certaines situations de pression provoquent des fluctuations émotionnelles qui perturbent la stabilité.',
      timestamp: new Date().toISOString()
    }
  };

  function safeLoad() {
    try {
      const parsed = JSON.parse(localStorage.getItem(config.storageKey));
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (err) {}
    return defaultData;
  }

  function safeSave(data) {
    localStorage.setItem(config.storageKey, JSON.stringify(data));
  }

  function average(values) {
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  function computeGlobal(data) {
    const moduleEntries = Object.entries(data).filter(([, v]) => v && typeof v === 'object' && typeof v.score_global === 'number');
    const globalScore = average(moduleEntries.map(([, v]) => v.score_global));

    const axes = {
      confiance: [],
      regulation: [],
      engagement: [],
      stabilite: []
    };

    moduleEntries.forEach(([, v]) => {
      if (v.dimensions) {
        Object.keys(axes).forEach((key) => {
          if (typeof v.dimensions[key] === 'number') axes[key].push(v.dimensions[key]);
        });
      }
    });

    const combinedAxes = {};
    Object.keys(axes).forEach((key) => {
      const val = average(axes[key]);
      combinedAxes[key] = val == null ? 0 : val;
    });

    return { moduleEntries, globalScore, combinedAxes };
  }

  function setLinks(data) {
    const pmp = document.getElementById('link-pmp');
    const cmp = document.getElementById('link-cmp');
    const epe = document.getElementById('link-epe');
    if (pmp) pmp.href = config.urls.pmp || '#';
    if (cmp) cmp.href = config.urls.cmp || '#';
    if (epe) epe.href = config.urls.epe || '#';

    const has = {
      pmp: !!data.PMP,
      cmp: !!data.CMP,
      epe: !!(data.EPE || data.EQUILIBRE || data.EP)
    };

    ['pmp', 'cmp', 'epe'].forEach((key) => {
      const el = document.getElementById(`status-${key}`);
      if (!el) return;
      el.textContent = has[key] ? 'Synchronisé' : 'En attente';
      el.className = `module-status ${has[key] ? 'ready' : 'pending'}`;
    });
  }

  function renderGlobalScore(globalScore, count) {
    const scoreEl = document.getElementById('global-score');
    const metaEl = document.getElementById('global-score-meta');
    const ring = document.querySelector('.score-ring');
    if (!scoreEl || !metaEl || !ring) return;

    if (globalScore == null) {
      scoreEl.textContent = '—';
      metaEl.textContent = 'Aucune donnée synchronisée pour le moment.';
      ring.style.setProperty('--score-angle', '0deg');
      return;
    }

    scoreEl.textContent = globalScore;
    metaEl.textContent = `${count} module(s) pris en compte dans le calcul global.`;
    ring.style.setProperty('--score-angle', `${Math.max(0, Math.min(100, globalScore)) * 3.6}deg`);
  }

  function renderModuleResults(entries) {
    const root = document.getElementById('module-results');
    if (!root) return;
    if (!entries.length) {
      root.innerHTML = '<div class="empty-state">Aucun module synchronisé. Lance un test depuis un module A4P pour alimenter automatiquement le hub.</div>';
      return;
    }

    root.innerHTML = entries.map(([code, mod]) => {
      const dimensions = mod.dimensions && typeof mod.dimensions === 'object'
        ? Object.entries(mod.dimensions).map(([name, value]) => `
          <div class="dim-row">
            <span>${capitalize(name)}</span>
            <div class="progress-bar"><div class="progress-fill" style="width:${clamp(value)}%"></div></div>
            <strong>${value}</strong>
          </div>`).join('')
        : '<p class="subtext">Pas de dimensions détaillées disponibles.</p>';

      return `
        <article class="module-summary">
          <div class="summary-head">
            <div>
              <p class="eyebrow">${code}</p>
              <h4>${escapeHtml(mod.profil_nom || mod.profil || mod.test || code)}</h4>
            </div>
            <span class="badge-score">${typeof mod.score_global === 'number' ? `${mod.score_global}/100` : '—'}</span>
          </div>
          <p>${escapeHtml(mod.summary || mod.resume_court || 'Aucune synthèse disponible.')}</p>
          <div class="dimensions-grid">${dimensions}</div>
        </article>
      `;
    }).join('');
  }

  function renderClubDashboard(entries, combinedAxes, globalScore) {
    const avg = document.getElementById('club-avg');
    const best = document.getElementById('club-best');
    const watch = document.getElementById('club-watch');
    const tested = document.getElementById('club-tested');
    if (tested) tested.textContent = String(Math.max(1, entries.length));
    if (avg) avg.textContent = globalScore == null ? '—' : `${globalScore}/100`;

    if (best) {
      if (!entries.length) best.textContent = '—';
      else {
        const bestModule = [...entries].sort((a,b) => (b[1].score_global||0) - (a[1].score_global||0))[0];
        best.textContent = `${bestModule[0]} ${bestModule[1].score_global}/100`;
      }
    }

    if (watch) {
      const dims = Object.entries(combinedAxes).filter(([,v]) => typeof v === 'number' && v > 0);
      if (!dims.length) watch.textContent = '—';
      else {
        const lowest = dims.sort((a,b) => a[1]-b[1])[0];
        watch.textContent = `${capitalize(lowest[0])} ${lowest[1]}/100`;
      }
    }
  }

  function renderLegend(combinedAxes) {
    const root = document.getElementById('legend-list');
    if (!root) return;
    root.innerHTML = Object.entries(combinedAxes).map(([key, value], idx) => `
      <div class="legend-item">
        <span class="legend-dot ${idx % 2 ? 'secondary' : ''}"></span>
        <span>${capitalize(key)} : <strong>${value}/100</strong></span>
      </div>
    `).join('');
  }

  function drawRadar(axes) {
    const canvas = document.getElementById('global-radar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 420;
    const cssHeight = 340;
    canvas.width = cssWidth * ratio;
    canvas.height = cssHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const labels = ['Confiance', 'Régulation', 'Engagement', 'Stabilité'];
    const values = [axes.confiance || 0, axes.regulation || 0, axes.engagement || 0, axes.stabilite || 0];
    const cx = cssWidth / 2;
    const cy = cssHeight / 2 + 8;
    const radius = Math.min(cssWidth, cssHeight) * 0.26;

    function point(i, valueFactor) {
      const angle = (-Math.PI / 2) + (i * (Math.PI * 2 / 4));
      return {
        x: cx + Math.cos(angle) * radius * valueFactor,
        y: cy + Math.sin(angle) * radius * valueFactor
      };
    }

    ctx.strokeStyle = '#dbe3f1';
    ctx.lineWidth = 1;
    for (let step = 1; step <= 5; step++) {
      const f = step / 5;
      ctx.beginPath();
      labels.forEach((_, i) => {
        const p = point(i, f);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    labels.forEach((label, i) => {
      const p = point(i, 1);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      const labelP = point(i, 1.18);
      ctx.fillStyle = '#3f4f6f';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.textAlign = i === 1 ? 'left' : i === 3 ? 'right' : 'center';
      ctx.textBaseline = i === 0 ? 'bottom' : i === 2 ? 'top' : 'middle';
      ctx.fillText(label, labelP.x, labelP.y);
    });

    ctx.beginPath();
    values.forEach((v, i) => {
      const p = point(i, clamp(v) / 100);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(35, 68, 124, 0.18)';
    ctx.strokeStyle = '#23447c';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    values.forEach((v, i) => {
      const p = point(i, clamp(v) / 100);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#23447c';
      ctx.fill();
    });
  }

  function clamp(v) { return Math.max(0, Math.min(100, Number(v) || 0)); }
  function capitalize(str) { return (str || '').charAt(0).toUpperCase() + (str || '').slice(1); }
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"]/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[s]));
  }

  function render() {
    const data = safeLoad();
    safeSave(data);
    setLinks(data);
    const { moduleEntries, globalScore, combinedAxes } = computeGlobal(data);
    renderGlobalScore(globalScore, moduleEntries.length);
    renderModuleResults(moduleEntries);
    renderClubDashboard(moduleEntries, combinedAxes, globalScore);
    renderLegend(combinedAxes);
    drawRadar(combinedAxes);

    const jsonView = document.getElementById('json-view');
    if (jsonView) jsonView.textContent = JSON.stringify(data, null, 2);
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    window.addEventListener('resize', render, { passive: true });

    const refresh = document.getElementById('btn-refresh');
    if (refresh) refresh.addEventListener('click', render);

    const reset = document.getElementById('btn-reset');
    if (reset) {
      reset.addEventListener('click', () => {
        localStorage.removeItem(config.storageKey);
        render();
      });
    }

    const toggleJson = document.getElementById('toggle-json');
    const jsonView = document.getElementById('json-view');
    if (toggleJson && jsonView) {
      toggleJson.addEventListener('click', () => jsonView.classList.toggle('is-hidden'));
    }
  });
})();
