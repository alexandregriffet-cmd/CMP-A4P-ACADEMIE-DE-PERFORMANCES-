# CMP A4P — Pack GitHub prêt à intégrer

## Contenu

- `index.html` : accueil du test
- `test.html` : questionnaire CMP
- `resultats.html` : restitution automatique
- `hub.html` : visualisation locale de la donnée envoyée au hub
- `css/style.css` : style premium
- `js/questions.js` : 16 questions réparties sur 4 dimensions
- `js/calc.js` : moteur de calcul des scores
- `js/profiles.js` : base des 5 profils CMP
- `js/interpret.js` : choix automatique du profil et création du rapport
- `js/hub-export.js` : export local vers le hub A4P
- `js/test.js` : rendu du questionnaire, sauvegarde locale, validation
- `js/resultats.js` : affichage du rapport + graphique radar + export JSON

## Déploiement GitHub

1. Créer un dépôt GitHub vide.
2. Déposer tous les fichiers du dossier à la racine du dépôt.
3. Activer **GitHub Pages** sur la branche principale, dossier racine.
4. Le point d’entrée est `index.html`.

## Stockage local utilisé

- `cmp_answers`
- `cmp_identity`
- `cmp_result`
- `a4p_hub_results`

## Logique de profil

- `CMP-1` : base solide, scores homogènes élevés
- `CMP-2` : engagement fort, régulation plus basse
- `CMP-3` : engagement présent, confiance plus fragile
- `CMP-4` : fonctionnement irrégulier
- `CMP-5` : base mentale en construction

## Étape suivante recommandée

Brancher la même structure sur d’autres tests A4P pour alimenter un hub consolidé multi-tests.
