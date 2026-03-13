function normalizeLikert(value, reverse = false) {
  const v = reverse ? 6 - value : value;
  return Math.round(((v - 1) / 4) * 100);
}

function computeCMPScores(questions, answers) {
  const buckets = {
    confiance: [],
    regulation: [],
    engagement: [],
    stabilite: []
  };

  questions.forEach((q) => {
    const raw = Number(answers[q.id] || 0);
    if (!raw) return;
    const score = normalizeLikert(raw, !!q.reverse);
    buckets[q.dimension].push(score);
  });

  const dimensions = {};
  Object.keys(buckets).forEach((key) => {
    const arr = buckets[key];
    dimensions[key] = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  });

  const score_global = Math.round(
    (dimensions.confiance + dimensions.regulation + dimensions.engagement + dimensions.stabilite) / 4
  );

  return { dimensions, score_global };
}
