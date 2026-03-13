# Pack correctif Hub ↔ CMP A4P

Ce pack relie les deux URLs réelles :

- Hub : https://alexandregriffet-cmd.github.io/Diagnostic-mental-A4P-/
- CMP : https://alexandregriffet-cmd.github.io/CMP-A4P-ACADEMIE-DE-PERFORMANCES-/

## Objectif
Créer un aller-retour propre :

Hub → CMP → résultats CMP → retour hub

avec synchronisation dans la clé locale :

`a4p_hub_results`

## Fichiers fournis

### Répertoire `hub/`
- `js/config.js`
- `js/hub-sync.js`
- `js/hub-sync.css`
- `EXEMPLE_INTEGRATION_HUB.html`

### Répertoire `cmp/`
- `js/config.js`
- `js/hub-export.js`
- `js/resultats-bridge.js`
- `js/EXEMPLE_EXPORT_DANS_TEST.js`
- `EXEMPLE_INTEGRATION_CMP.html`

## Ce qu’il faut faire

### 1. Dans le dépôt du hub
Copier :
- `hub/js/config.js`
- `hub/js/hub-sync.js`
- `hub/js/hub-sync.css`

Puis dans la page du hub :
- ajouter `<section id="cmp-sync-card"></section>`
- ajouter un bouton avec `data-cmp-link`
- charger les scripts et la feuille CSS comme montré dans `EXEMPLE_INTEGRATION_HUB.html`

### 2. Dans le dépôt CMP
Copier :
- `cmp/js/config.js`
- `cmp/js/hub-export.js`
- `cmp/js/resultats-bridge.js`

Puis :
- appeler `window.A4PCMPBridge.exportCMPToHub(report)` à la fin du calcul CMP
- ajouter un bouton retour hub avec `id="btn-back-hub"` ou `data-hub-return`
- charger les scripts comme montré dans `EXEMPLE_INTEGRATION_CMP.html`

## Effet attendu
- le hub ouvre le bon CMP
- le CMP écrit bien dans `localStorage["a4p_hub_results"]`
- la page résultats CMP renvoie vers le hub principal
- le hub relit et affiche automatiquement le résultat CMP

## Point de rigueur
Ce pack est un correctif d’intégration. Il n’écrase pas tes pages actuelles et s’adapte à ton code existant, mais il faut bien copier les fichiers dans les deux dépôts GitHub séparés.
