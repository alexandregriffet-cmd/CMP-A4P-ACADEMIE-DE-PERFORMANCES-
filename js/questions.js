window.CMP_QUESTIONS = [
  { id: 'q1', dimension: 'confiance', text: 'Je crois en ma capacité à réussir même lorsque l’enjeu augmente.' },
  { id: 'q2', dimension: 'confiance', text: 'Après une erreur, je garde confiance en ce que je sais faire.' },
  { id: 'q3', dimension: 'confiance', text: 'Je me sens capable de relever des défis sportifs exigeants.' },
  { id: 'q4', dimension: 'confiance', text: 'Dans les moments importants, je doute peu de mes capacités.', reverse: false },

  { id: 'q5', dimension: 'regulation', text: 'Je sais calmer ma tension avant une compétition.' },
  { id: 'q6', dimension: 'regulation', text: 'Quand la pression monte, je parviens à rester lucide.' },
  { id: 'q7', dimension: 'regulation', text: 'Je garde le contrôle de mes réactions émotionnelles.' },
  { id: 'q8', dimension: 'regulation', text: 'Je me recentre rapidement après une erreur.' },

  { id: 'q9', dimension: 'engagement', text: 'Je donne le maximum à l’entraînement.' },
  { id: 'q10', dimension: 'engagement', text: 'Je reste impliqué même quand la séance devient difficile.' },
  { id: 'q11', dimension: 'engagement', text: 'Je cherche constamment à progresser.' },
  { id: 'q12', dimension: 'engagement', text: 'Je suis prêt à faire des efforts durables pour atteindre mes objectifs.' },

  { id: 'q13', dimension: 'stabilite', text: 'Mon niveau mental reste globalement stable pendant la compétition.' },
  { id: 'q14', dimension: 'stabilite', text: 'Je garde ma concentration sur la durée.' },
  { id: 'q15', dimension: 'stabilite', text: 'Je maintiens mon niveau même dans les moments délicats.' },
  { id: 'q16', dimension: 'stabilite', text: 'Je reste mentalement constant d’une séquence à l’autre.' }
];

window.CMP_DIMENSIONS = {
  confiance: 'Confiance',
  regulation: 'Régulation',
  engagement: 'Engagement',
  stabilite: 'Stabilité'
};

window.CMP_SCALE = [
  { value: 1, label: 'Pas du tout d’accord' },
  { value: 2, label: 'Plutôt pas d’accord' },
  { value: 3, label: 'Mitigé' },
  { value: 4, label: 'Plutôt d’accord' },
  { value: 5, label: 'Tout à fait d’accord' }
];
