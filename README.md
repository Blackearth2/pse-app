# Révision PSE

Web app de révision des référentiels **PSE1 et PSE2** (Premiers Secours en Équipe) : fiches, QCM, examen blanc et cas pratiques. Installable sur téléphone, utilisable hors connexion, sans compte : la progression reste sur l'appareil.

> Outil de révision personnel et non officiel. Il ne remplace ni la formation ni le référentiel officiel ; en cas de doute, le document officiel et ton formateur font foi.

## Démarrer

Prérequis : Node.js 24 LTS.

```bash
npm install
npm run dev          # http://localhost:5173 — brouillons inclus, rechargement à chaque modification de content/
```

| Commande | Rôle |
|---|---|
| `npm run check` | lint, typage, tests, validation du contenu et contrôle de neutralité |
| `npm run check:content` | validation du contenu seule (résumé : fiches, questions, cas, statuts) |
| `npm run build` | construction de production (**contenu vérifié uniquement**) dans `dist/` |
| `CONTENU_BROUILLONS=1 npm run build` | construction incluant les brouillons (relecture) |
| `node scripts/generer-icones.mjs` | régénère les icônes de `public/` |

## Contenu

Le contenu vit dans `content/`, séparé du code, au format YAML :

- `content/chapitres.yaml` : chapitres, dans l'ordre du programme ;
- `content/fiches/<chapitre>/<id>.yaml` : une fiche (blocs `texte`, `chiffres`, `etapes`, `liste`, `attention`, `nouveaute`) et ses QCM ;
- `content/cas/<id>.yaml` : un cas pratique (étapes `choix`, `multiple`, `ordre`).

Le format complet est décrit au § 5 de la [spec](docs/superpowers/specs/2026-09-28-revision-pse-design.md). Toute erreur (champ manquant, bonne réponse inexistante, lien vers une fiche absente…) bloque le développement et la construction avec un message indiquant le fichier et le champ.

### Vérification médicale

- Chaque fiche et chaque cas portent un `statut` : `brouillon` ou `verifie`.
- Un contenu passe à `verifie` **uniquement après relecture humaine** contre le texte officiel.
- La version publiée ne contient **que** du contenu vérifié ; les brouillons ne sont visibles qu'en développement (badge « Brouillon »).
- Sources citées : uniquement les documents officiels de l'État.

## Publication

Chaque `push` sur `main` déclenche `.github/workflows/deploy.yml` : contrôle complet, construction, puis publication sur GitHub Pages (activer Pages avec la source « GitHub Actions » dans les réglages du dépôt).
