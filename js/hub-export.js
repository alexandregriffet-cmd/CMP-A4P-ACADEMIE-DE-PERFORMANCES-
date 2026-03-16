(function () {
  function safeParse(value, fallback) {
    try {
      return JSON.parse(value) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getUrlParams() {
    return new URLSearchParams(window.location.search);
  }

  function getStoredContext() {
    return safeParse(localStorage.getItem('cmp_passation_context'), {});
  }

  function getFinalToken() {
    const params = getUrlParams();
    const urlToken = params.get('token') || '';
    const storedContext = getStoredContext();
    const runtimeToken = window.CMP_RUNTIME?.passation?.token || '';
    const localToken = localStorage.getItem('cmp_token') || '';
    const legacyToken = localStorage.getItem('cmp_passation_token') || '';

    const token = urlToken || runtimeToken || storedContext.token || localToken || legacyToken || '';

    if (token) {
      localStorage.setItem('cmp_token', token);
      localStorage.setItem('cmp_passation_token', token);
    }

    return token;
  }

  function getSupabaseUrl() {
    return window.CMP_SUPABASE_URL || '';
  }

  function getSupabaseAnonKey() {
    return window.CMP_SUPABASE_ANON_KEY || '';
  }

  async function upsertCMPResult(report) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseAnonKey();
    const token = getFinalToken();

    if (!supabaseUrl || !supabaseKey) {
      return { ok: false, error: 'Configuration Supabase manquante' };
    }

    if (!token) {
      return { ok: false, error: "Token manquant dans l'URL ou le contexte local" };
    }

    const storedContext = getStoredContext();

    const payload = {
      token: token,
      module: 'CMP',
      firstname: report.identity?.prenom || storedContext.firstname || '',
      lastname: report.identity?.nom || storedContext.lastname || '',
      email: report.identity?.email || storedContext.email || null,
      club_structure: report.identity?.club || '',
      profile_code: report.profil_code || '',
      profile_label: report.profil_nom || '',
      score_global: report.score_global || 0,
      confiance: report.dimensions?.confiance ?? null,
      regulation: report.dimensions?.regulation ?? null,
      engagement: report.dimensions?.engagement ?? null,
      stabilite: report.dimensions?.stabilite ?? null,
      dimensions: report.dimensions || {},
      raw_data: report,
      full_report: report,
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/cmp_results?on_conflict=token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, error: errorText };
      }

      const data = await response.json().catch(() => []);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error.message || 'Erreur réseau inconnue' };
    }
  }

  async function updatePassationStatus(report) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseAnonKey();
    const token = getFinalToken();

    if (!supabaseUrl || !supabaseKey) {
      return { ok: false, error: 'Configuration Supabase manquante' };
    }

    if (!token) {
      return { ok: false, error: "Token manquant pour mise à jour de la passation" };
    }

    const patchPayload = {
      status: 'completed'
    };

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/passations?token=eq.${encodeURIComponent(token)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(patchPayload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, error: errorText };
      }

      const data = await response.json().catch(() => []);
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error.message || 'Erreur réseau inconnue' };
    }
  }

  window.exportCMPToHub = async function exportCMPToHub(report) {
    const storageKey = window.A4P_CONFIG?.storageKey || 'a4p_hub_results';
    const hub = safeParse(localStorage.getItem(storageKey), {});

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

    localStorage.setItem(storageKey, JSON.stringify(hub));

    const saveResult = await upsertCMPResult(report);
    if (!saveResult.ok) {
      return saveResult;
    }

    const passationResult = await updatePassationStatus(report);
    if (!passationResult.ok) {
      return passationResult;
    }

    return { ok: true };
  };
})();
