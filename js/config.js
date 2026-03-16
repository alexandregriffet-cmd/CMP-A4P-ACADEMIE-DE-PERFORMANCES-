window.A4P_CONFIG = {
  urls: {
    pmp: "#",
    cmp: "https://alexandregriffet-cmd.github.io/CMP_academie_performances.html/CMP_academie_performances.html",
    epe: "#"
  },
  labels: {
    pmp: "PMP",
    cmp: "CMP",
    epe: "Équilibre"
  },
  storageKey: "a4p_hub_results"
};

/* =========================
   Configuration Supabase CMP
   ========================= */

window.CMP_SUPABASE_URL = "https://nhcfoepvairdseojjybi.supabase.co";

window.CMP_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oY2ZvZXB2YWlyZHNlb2pqeWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDc3NzcsImV4cCI6MjA4OTA4Mzc3N30.kPGteGjoZydTlsO0Tes1nh1dOkHoj9vEXVEUw7ny5_I";

/* =========================
   Contexte de passation CMP
   ========================= */

window.CMP_RUNTIME = window.CMP_RUNTIME || {};

(function () {
  const params = new URLSearchParams(window.location.search);

  const passationContext = {
    token: params.get('token') || '',
    module: params.get('module') || 'CMP',
    playerId: params.get('playerId') || '',
    teamId: params.get('teamId') || '',
    clubId: params.get('clubId') || ''
  };

  const hasIncomingContext =
    passationContext.token ||
    passationContext.playerId ||
    passationContext.teamId ||
    passationContext.clubId;

  if (hasIncomingContext) {
    localStorage.setItem('cmp_passation_context', JSON.stringify(passationContext));
    window.CMP_RUNTIME.passation = passationContext;
    return;
  }

  try {
    window.CMP_RUNTIME.passation = JSON.parse(
      localStorage.getItem('cmp_passation_context') || '{}'
    );
  } catch (error) {
    window.CMP_RUNTIME.passation = {};
  }
})();
