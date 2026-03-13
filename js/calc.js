function normalizeLikert(value, reverse = false) {
  const v = reverse ? 6 - Number(value) : Number(value);
  return Math.round(((v - 1) / 4) * 100);
}

function average(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((sum, item) => sum + item, 0) / arr.length);
}

function computeCMPScores(questions, answers) {
  const buckets = {
    confiance: [],
    regulation: [],
    engagement: [],
    stabilite: []
  };

  questions.forEach((question) => {
    const raw = answers[question.id];
    if (raw == null) return;
    buckets[question.dimension].push(normalizeLikert(raw, !!question.reverse));
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
