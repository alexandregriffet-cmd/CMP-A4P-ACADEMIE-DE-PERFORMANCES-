# CMP A4P V4

Pack statique prêt pour GitHub Pages.

## Contenu
- `index.html` : accueil
- `test.html` : questionnaire dynamique 16 items
- `resultats.html` : restitution professionnelle avec radar
- `hub.html` : visualisation de la donnée remontée dans le hub local
- `assets/logo-a4p.png` : logo A4P intégré
- `css/style.css` : design premium harmonisé
- `js/*.js` : logique du questionnaire, calcul, interprétation, résultats et hub

## Déploiement GitHub Pages
1. Créer un dépôt GitHub vide.
2. Déposer tout le contenu du dossier à la racine du dépôt.
3. Activer GitHub Pages sur la branche principale.
4. Ouvrir `index.html` depuis l’URL GitHub Pages.

## Remarques
- Les données sont stockées en `localStorage`.
- Le hub A4P local lit `a4p_hub_results`.
- Le radar est dessiné sans dépendance externe.
