window.CMPCalc = (() => {
  function normalizeLikert(value, reverse = false) {
    const v = reverse ? 6 - value : value;
    return Math.round(((v - 1) / 4) * 100);
  }

  function average(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  function computeScores(questions, answers) {
    const buckets = {
      confiance: [],
      regulation: [],
      engagement: [],
      stabilite: []
    };

    questions.forEach((q) => {
      const raw = Number(answers[q.id]);
      if (!raw) return;
      buckets[q.dimension].push(normalizeLikert(raw, !!q.reverse));
    });

    const dimensions = {
      confiance: average(buckets.confiance),
      regulation: average(buckets.regulation),
      engagement: average(buckets.engagement),
      stabilite: average(buckets.stabilite)
    };

    return {
      dimensions,
      score_global: average(Object.values(dimensions))
    };
  }

  return { normalizeLikert, computeScores };
})();
