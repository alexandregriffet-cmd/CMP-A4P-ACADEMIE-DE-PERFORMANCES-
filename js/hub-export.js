(function () {
  function safeParse(value, fallback) {
    try {
      return JSON.parse(value) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  }

  function getTokenFromStorage() {
    return localStorage.getItem('cmp_passation_token') || '';
  }

  function getFinalToken() {
    return getTokenFromUrl() || getTokenFromStorage() || '';
  }

  function getSupabaseUrl() {
    return window.CMP_SUPABASE_URL || '';
  }

  function getSupabaseAnonKey() {
    return window.CMP_SUPABASE_ANON_KEY || '';
  }

  async function saveCMPResultToSupabase(report) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseAnonKey();
    const token = getFinalToken();

    if (!supabaseUrl || !supabaseKey) {
      alert('Configuration Supabase manquante');
      return { ok: false, error: 'missing_supabase_config' };
    }

    if (!token) {
      alert("Token manquant dans l'URL");
      return { ok: false, error: 'missing_token' };
    }

    const payload = {
      token: token,
      module: 'CMP',
      prenom: report.identity?.prenom || '',
      nom: report.identity?.nom || '',
      club: report.identity?.club || '',
      profile_code: report.profil_code || '',
      profile_name: report.profil_nom || '',
      score_global: report.score_global || 0,
      dimensions: report.dimensions || {},
      full_report: report,
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/cmp_results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(`Sauvegarde Supabase impossible : ${errorText}`);
        return { ok: false, error: errorText };
      }

      return { ok: true };
    } catch (error) {
      alert(`Erreur réseau Supabase : ${error.message}`);
      return { ok: false, error: error.message };
    }
  }

  window.exportCMPToHub = async function exportCMPToHub(report) {
    let hub = safeParse(localStorage.getItem('a4p_hub_results'), {});

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

    const token = getFinalToken();
    if (token) {
      localStorage.setItem('cmp_passation_token', token);
    }

    return await saveCMPResultToSupabase(report);
  };
})();
