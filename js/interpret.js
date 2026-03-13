function chooseCMPProfile(dimensions) {
  const { confiance, regulation, engagement, stabilite } = dimensions;
  const global = Math.round((confiance + regulation + engagement + stabilite) / 4);

  if (global >= 70 && confiance >= 65 && regulation >= 65 && engagement >= 65 && stabilite >= 65) {
    return 'CMP-1';
  }
  if (engagement >= 70 && regulation < 60) {
    return 'CMP-2';
  }
  if (engagement >= 60 && confiance < 60) {
    return 'CMP-3';
  }
  if (global < 50 || (confiance < 50 && regulation < 50)) {
    return 'CMP-5';
  }
  return 'CMP-4';
}

function buildCMPInterpretation(scores, identity = {}) {
  const profileCode = chooseCMPProfile(scores.dimensions);
  const profile = window.CMP_PROFILES[profileCode];

  return {
    test: 'CMP',
    version: '3.0.0',
    identity,
    score_global: scores.score_global,
    dimensions: scores.dimensions,
    profil_code: profile.code,
    profil_nom: profile.nom,
    resume_court: profile.resume_court,
    lecture_synthetique: profile.lecture_synthetique,
    fonctionnement_mental: profile.fonctionnement_mental,
    comportement_performance: profile.comportement_performance,
    reaction_pression: profile.reaction_pression,
    forces: profile.forces,
    vigilances: profile.vigilances,
    leviers: profile.leviers,
    timestamp: new Date().toISOString()
  };
}
