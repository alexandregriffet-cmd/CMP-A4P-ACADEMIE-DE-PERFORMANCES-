function exportCMPToHub(report) {
  let hub = {};
  try {
    hub = JSON.parse(localStorage.getItem('a4p_hub_results')) || {};
  } catch (error) {
    hub = {};
  }

  hub.CMP = {
    test: 'CMP',
    identity: report.identity,
    profil_code: report.profil_code,
    profil_nom: report.profil_nom,
    score_global: report.score_global,
    dimensions: report.dimensions,
    summary: report.resume_court,
    timestamp: report.timestamp
  };

  localStorage.setItem('a4p_hub_results', JSON.stringify(hub));
}
