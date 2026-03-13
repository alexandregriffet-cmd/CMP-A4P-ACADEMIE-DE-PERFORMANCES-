# Hub A4P V5

## Contenu
- Menu SaaS propre pour PMP / CMP / Équilibre
- Score global mental calculé à partir des modules synchronisés
- Radar global combiné sur 4 axes : confiance, régulation, engagement, stabilité
- Dashboard club préconfiguré pour une future version SaaS
- Vue JSON repliable

## Mise à jour des liens modules
Éditez `js/config.js` :
- `pmp`
- `cmp`
- `epe`

## Clé de stockage
Le hub lit les données dans :
- `localStorage['a4p_hub_results']`

## Structure attendue par module
Exemple CMP :
```json
{
  "CMP": {
    "test": "CMP",
    "profil_nom": "Mobilisation forte mais régulation fluctuante",
    "score_global": 64,
    "dimensions": {
      "confiance": 56,
      "regulation": 44,
      "engagement": 75,
      "stabilite": 81
    },
    "summary": "..."
  }
}
```
