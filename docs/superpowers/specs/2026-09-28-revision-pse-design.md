# Révision PSE — Design (sous-projet 1 : le moteur de l'app)

- **Date** : 2026-09-28
- **Statut** : design validé en brainstorming, en attente de relecture de la spec
- **Maquette de référence** : canvas « Révision PSE1 · PSE2 » (prototype mobile 390×844)

## 1. Contexte et objectif

Web app de révision des référentiels **PSE1 et PSE2** (Premiers Secours en Équipe), fondée sur les **recommandations officielles de l'État en vigueur en 2026** (ministère de l'Intérieur, DGSCGC). Trois parties : **fiches**, **QCM**, **cas pratiques**, plus quatre fonctions de révision (erreurs, recherche, examen blanc, favoris).

Public visé : **diffusion large** (stagiaires, équipiers, formateurs), sans compte, sur téléphone en priorité.

Contrainte forte : **aucun logo, nom ou référence** pouvant lier le projet à une association de secourisme.

## 2. Découpage du projet

| Sous-projet | Contenu | Spec |
|---|---|---|
| **1 — Moteur** (ce document) | App complète (écrans, moteurs QCM/examen/cas, recherche, favoris, progression, PWA, déploiement), format du contenu, validateur, contenu du prototype migré comme jeu de test (lot 0) | celle-ci |
| **2 — Contenu** | Rédaction exhaustive, fiche par fiche, en 8 lots vérifiés contre la source officielle (§ 15) | un cycle par lot, sur la base du format défini ici |

## 3. Décisions prises

| Sujet | Décision |
|---|---|
| Type d'app | PWA installable, **sans compte ni serveur**, hors ligne |
| Stack | Vite + TypeScript + React, `vite-plugin-pwa`, routage par hash |
| Contenu | Fichiers YAML dans `content/`, séparés du code, validés à la construction (zod) |
| Couverture | Exhaustive, fiche par fiche (100+ fiches, 400+ QCM) — sous-projet 2 |
| Cas pratiques | Linéaires, étapes de 3 types : choix unique, choix multiple, remise en ordre |
| Fonctions en plus | Mes erreurs, recherche, examen blanc chronométré, fiches favorites |
| Progression | `localStorage` de l'appareil, versionnée ; aucune donnée envoyée |
| Hébergement | GitHub Pages, déploiement par GitHub Actions |
| Emplacement | `C:\Users\aperraud\Documents\revision-pse` |
| Node.js | Version portable officielle (zip, sans droits admin), téléchargée avec l'accord de l'utilisateur |
| Design visuel | Celui du canvas, repris tel quel (§ 14) |

## 4. Architecture

### 4.1 Arborescence

```
revision-pse/
  content/
    chapitres.yaml                 ← liste ordonnée des chapitres
    fiches/<chapitre>/<id>.yaml    ← une fiche + ses QCM
    cas/<id>.yaml                  ← un cas pratique
  src/
    content/      ← schémas zod, types, chargement, validation croisée
    features/
      fiches/     ← liste, recherche, affichage d'une fiche
      qcm/        ← entraînement, mes erreurs
      examen/     ← examen blanc
      cas/        ← liste, déroulé, débriefing
      accueil/    ← accueil, à propos
    store/        ← progression (localStorage), migrations
    ui/           ← composants visuels communs (cartes, boutons, puces, barre de navigation)
    app/          ← routes, mise en page, bandeaux (mise à jour, stockage indisponible)
  scripts/        ← validation du contenu en ligne de commande, contrôle de neutralité
  tests/fixtures/ ← contenus volontairement invalides pour tester le validateur
  public/         ← icônes PWA
  .github/workflows/deploy.yml
```

### 4.2 Chargement du contenu

- Un **plugin Vite** lit `content/**/*.yaml` à la construction, valide chaque fichier avec les schémas zod, exécute les **vérifications croisées** (§ 6.2), filtre selon le statut (§ 6.1) et expose le résultat comme un module virtuel (`virtual:contenu`) typé.
- Toute erreur de schéma ou de vérification croisée **fait échouer** `npm run dev` (message clair : fichier, champ, problème) et `npm run build`.
- Le même code de validation est utilisé par `npm run check:content` (script en ligne de commande) et par les tests.

### 4.3 Routage (hash)

| Route | Écran |
|---|---|
| `#/` | Accueil |
| `#/a-propos` | À propos |
| `#/fiches` | Liste des fiches (recherche, filtres) |
| `#/fiches/:id` | Détail d'une fiche |
| `#/qcm` | Choix du mode QCM |
| `#/qcm/serie` | Série en cours (entraînement ou mes erreurs) |
| `#/examen` | Examen blanc (lancement, en cours, résultat) |
| `#/cas` | Liste des cas |
| `#/cas/:id` | Déroulé d'un cas et débriefing |

Une route inconnue ou un identifiant absent affiche un écran « Introuvable » avec un retour à l'accueil.

## 5. Modèle de contenu

### 5.1 Conventions

- Identifiants en `kebab-case` ASCII, **stables dans le temps** (la progression s'y rattache). Un identifiant publié n'est jamais réutilisé pour autre chose.
- Identifiant complet d'une question : `<idFiche>/<idQuestion>` (ex. `hemorragies-externes/q3`).
- Texte en français, typographie française (espaces insécables avant `: ; ? !` gérées par le rendu, pas par l'auteur).

### 5.2 Chapitres — `content/chapitres.yaml`

```yaml
- id: generalites
  titre: Généralités
- id: urgences-vitales
  titre: Urgences vitales
# … l'ordre du fichier = l'ordre d'affichage
```

### 5.3 Fiche — `content/fiches/<chapitre>/<id>.yaml`

```yaml
id: hemorragies-externes
niveau: PSE1                 # PSE1 | PSE2
chapitre: urgences-vitales   # doit exister dans chapitres.yaml ET correspondre au dossier
type: procedure              # connaissance | procedure | technique
ordre: 3                     # position dans le chapitre (entier ≥ 1, unique dans le chapitre)
titre: Hémorragies externes
motsCles: [saignement, garrot, packing, compression]
statut: brouillon            # brouillon | verifie
source:
  document: "Recommandations PSE — DGSCGC, édition 2026"
  code: "<code officiel de la fiche>"
  page: 42                   # facultatif
liees: [garrot, pansement-compressif]   # identifiants d'autres fiches
blocs:
  - type: texte
    titre: En bref           # titre facultatif pour tous les blocs
    contenu: "Une hémorragie externe est…"
  - type: chiffres
    items:
      - { valeur: "Compression directe", libelle: "1er geste" }
  - type: etapes
    titre: Conduite à tenir
    items: ["Comprimer immédiatement…", "Relayer par un pansement compressif…"]
  - type: liste
    items: ["…"]
  - type: attention
    items: ["Ne jamais retirer un garrot."]
  - type: nouveaute          # « Ce qui change en 2026 »
    items: ["Introduction du packing…"]
qcm:
  - id: q1
    enonce: "Premier geste face à une hémorragie externe accessible :"
    propositions: ["Garrot d'emblée", "Compression directe", "Point de compression à distance"]
    bonnes: [1]              # indices (à partir de 0) ; 1 élément = choix unique, 2+ = choix multiple
    explication: "La compression directe est le premier geste…"
    nouveaute: false         # facultatif, défaut false
```

Règles :
- **Ordre du programme** = ordre des chapitres dans `chapitres.yaml`, puis `ordre` croissant dans chaque chapitre. Il sert partout où une liste de fiches est affichée ou parcourue (Précédente / Suivante, Reprendre, tri de la recherche).
- `blocs` : au moins 1. Types autorisés : `texte`, `chiffres`, `etapes`, `liste`, `attention`, `nouveaute`. `texte` a `contenu` (paragraphes séparés par une ligne vide) ; les autres ont `items` (au moins 1).
- La fiche est considérée « nouveauté 2026 » si elle contient au moins un bloc `nouveaute`.
- `qcm` : facultatif (une fiche peut n'avoir aucune question). Chaque question : 2 à 5 propositions, `bonnes` non vide, indices valides, sans doublon, **pas toutes les propositions bonnes**, `explication` obligatoire.
- **Règle de rédaction** : les propositions sont **mélangées à l'affichage** ; donc interdiction des propositions du type « toutes les réponses ci-dessus » / « aucune des réponses ».

### 5.4 Cas pratique — `content/cas/<id>.yaml`

```yaml
id: piqure-au-marche
niveau: PSE1
titre: Piqûre au marché
lieu: Poste de secours, marché de plein air
statut: brouillon
liees: [reaction-anaphylactique]        # au moins 1 fiche
contexte: "Un homme d'une trentaine d'années…"
etapes:
  - moment: "À l'arrivée"
    situation: "Son visage gonfle…"
    question: "Quelle est ta priorité ?"
    type: choix                          # choix | multiple | ordre
    propositions:
      - { texte: "L'aider à s'injecter l'adrénaline…", correct: true,  retour: "Oui : …" }
      - { texte: "Lui donner de l'eau…",              correct: false, retour: "Non : …" }
  - moment: "Transmission"
    situation: "Le médecin régulateur te demande ton bilan."
    question: "Quels éléments transmets-tu ?"
    type: multiple
    propositions: [ … ]                  # au moins 2 correctes et au moins 1 incorrecte
  - moment: "À l'arrivée"
    situation: "…"
    question: "Remets ces actions dans l'ordre."
    type: ordre
    elements: ["Sécuriser", "Bilan d'urgence vitale", "Alerter"]   # écrits DANS L'ORDRE CORRECT
    retour: "Explication de l'ordre attendu…"
pointsCles: ["Adrénaline sans délai…", "…"]
```

Règles :
- `etapes` : au moins 2. `pointsCles` : au moins 1.
- `choix` : 2 à 5 propositions, **exactement une** correcte.
- `multiple` : 3 à 6 propositions, au moins 2 correctes, au moins 1 incorrecte.
- `ordre` : 3 à 6 `elements`, sans doublon ; un `retour` unique.
- Chaque proposition de `choix`/`multiple` a un `retour`.

## 6. Vérification médicale

### 6.1 Statut et publication

- `statut: brouillon` → visible **uniquement** en développement (`npm run dev`), avec un badge « Brouillon ».
- `statut: verifie` → publié. Passage à `verifie` **uniquement après relecture humaine** (l'utilisateur ou un formateur) du lot concerné.
- **Construction de production** : ne contient que le contenu `verifie`.
  - Une fiche vérifiée qui liste une fiche non publiée dans `liees` : le lien est masqué (avertissement dans le journal de construction, pas d'erreur).
  - Un cas vérifié dont une fiche de `liees` n'est pas publiée : le cas est exclu (avertissement).
  - Les QCM d'une fiche non publiée ne sont pas publiés.
- Si aucun contenu n'est publié, l'app affiche des états vides explicites (« Aucune fiche publiée pour l'instant »).

### 6.2 Vérifications croisées (erreurs bloquantes)

1. Identifiants uniques : fiches, cas, questions au sein d'une fiche.
2. `chapitre` d'une fiche existe dans `chapitres.yaml` et correspond au nom du dossier.
3. Nom du fichier = `id` ; `ordre` unique au sein d'un chapitre.
4. Toutes les références (`liees` des fiches et des cas) pointent vers des fiches existantes (quel que soit leur statut).
5. Contraintes de § 5.3 et § 5.4 (nombre de propositions, bonnes réponses, types d'étapes).
6. Contrôle de neutralité (§ 12) sur tout le contenu.

### 6.3 Processus de rédaction (sous-projet 2)

- Rédaction **à partir du texte officiel 2026 uniquement**, avec `source.code` (et `page` si disponible) sur chaque fiche.
- Tout point non confirmé par la source est signalé à l'utilisateur, jamais complété de mémoire.
- Si le texte officiel complet n'est pas accessible en ligne : arrêt, et demande du PDF à l'utilisateur.
- Les fiches sont des **résumés reformulés** ; pas de copie intégrale du texte officiel ni de reproduction de ses illustrations.

## 7. Écrans et fonctions

Barre de navigation basse à 4 onglets : **Accueil, Fiches, QCM, Cas** (comme le canvas). Contenu centré, largeur max. 480 px sur grand écran.

### 7.1 Accueil

- Progression : fiches lues / total, dernier et meilleur score à l'examen blanc, cas terminés / total.
- Raccourcis : **Mes erreurs (n)** (masqué si n = 0), **Ce qui change en 2026** (ouvre Fiches filtré sur Nouveautés), **Reprendre** (jusqu'à 3 fiches : favorites non lues d'abord, puis non lues dans l'ordre du programme ; si tout est lu, les 3 premières favorites ; s'il n'y a ni fiche non lue ni favori, le bloc est masqué).
- Lien **À propos** : avertissement (§ 12), source officielle et édition, version du contenu (date de construction), conseil « installe l'app sur l'écran d'accueil pour conserver ta progression », bouton **Réinitialiser ma progression** (avec confirmation).

### 7.2 Fiches

- **Recherche** : insensible aux accents et à la casse ; la requête est découpée en mots, **tous** doivent être trouvés (dans le titre, les mots-clés ou le texte des blocs). Tri : correspondance dans le titre > mots-clés > texte, puis ordre du programme. Recherche calculée à l'exécution (volume faible).
- **Filtres** (puces) : Tous / PSE1 / PSE2 (exclusifs entre eux), plus Nouveautés 2026 et ★ Favoris (cumulables).
- Liste **regroupée par chapitre**, sections repliables ; compteur de fiches affichées ; indicateur « Lue ».
- **Détail** : en-tête (niveau, chapitre, badge 2026), blocs dans l'ordre, étoile favori, bouton « Tester cette fiche (n questions) » (masqué si n = 0), fiches liées, source officielle en pied de fiche, boutons Précédente / Suivante dans le chapitre.
- Une fiche est **lue dès son ouverture**.

### 7.3 QCM — Entraînement

- Périmètre au choix : Tout, PSE1, PSE2, un chapitre, Nouveautés 2026 (questions `nouveaute: true`), ou une fiche (depuis le détail d'une fiche).
- Série de **10 questions** tirées au hasard sans remise (toutes si le périmètre en contient moins de 10). Propositions mélangées.
- Choix unique : toucher une proposition valide immédiatement. Choix multiple : mention « Plusieurs réponses possibles », on coche puis **Valider**. Correct seulement si l'ensemble coché est exactement l'ensemble des bonnes réponses.
- Correction immédiate : bonnes réponses marquées (couleur **et** icône/texte), explication, lien vers la fiche.
- Écran de résultat : score, message selon le taux, liste « À revoir » (question, bonne(s) réponse(s), lien fiche), boutons Nouvelle série / Terminer.

### 7.4 QCM — Mes erreurs

- Toute question ratée en entraînement ou en examen est **ajoutée** à la liste des erreurs.
- Le mode « Mes erreurs » tire jusqu'à 10 questions de cette liste ; une question réussie dans ce mode est **retirée** ; ratée, elle reste.
- Les questions qui ne sont plus publiées sont ignorées (et purgées de la liste).

### 7.5 Examen blanc

- Niveau : **PSE1** (questions des fiches PSE1) ou **PSE1 + PSE2** (toutes).
- **40 questions** ; répartition entre chapitres proportionnelle au nombre de questions publiées par chapitre (méthode du plus fort reste), tirage au hasard dans chaque chapitre. S'il y a moins de 40 questions publiées, toutes sont utilisées.
- **Chronomètre : 1 minute par question** (40 min pour 40), calculé à partir de l'heure de début enregistrée.
- Pas de correction pendant l'examen ; navigation Précédente / Suivante ; réponses modifiables jusqu'au rendu.
- **Rendre la copie** : confirmation si des questions sont sans réponse. Rendu automatique à l'expiration du temps.
- Examen en cours **sauvegardé en continu** ; à la réouverture, reprise là où on s'était arrêté ; si le temps a expiré entre-temps, rendu automatique.
- Résultat : score, **détail par chapitre** (bonnes / total), liste des erreurs avec correction et explication ; les erreurs rejoignent « Mes erreurs ». Pas de mention « reçu » / « ajourné ».
- Historique : les 10 derniers examens (date, niveau, score, total).

### 7.6 Cas pratiques

- Liste filtrable (Tous / PSE1 / PSE2), avec nombre d'étapes et dernier score si le cas a été fait.
- Déroulé : contexte (première étape), puis pour chaque étape : moment, situation, question, réponse.
  - Les propositions des étapes `choix` et `multiple` sont mélangées à l'affichage (comme les QCM).
  - `choix` : toucher = valider. `multiple` : cocher puis Valider (exactitude de l'ensemble). `ordre` : éléments affichés dans un ordre mélangé **différent de l'ordre correct**, déplacés avec des boutons ↑ / ↓ (accessibles au clavier et au doigt), puis Valider (exactitude de l'ordre).
  - Retour affiché : pour `choix`/`multiple`, le retour de chaque proposition concernée ; pour `ordre`, l'ordre correct et le `retour`.
- Étape réussie uniquement si la réponse est exacte. Débriefing : score, points clés, liens vers les fiches liées, Rejouer / Autres cas.
- Progression par cas : dernier score et meilleur score.

### 7.7 Hors périmètre (version 1)

Mode sombre, export/import de la progression entre appareils, statistiques détaillées, comptes utilisateurs.

## 8. Progression (stockage local)

Clé unique `localStorage` : `revision-pse`. Contenu :

```ts
{
  version: 1,
  lues: string[],              // id de fiches
  favoris: string[],           // id de fiches
  erreurs: string[],           // id complets de questions
  examens: { date: string, niveau: 'PSE1' | 'PSE1+PSE2', score: number, total: number }[], // 10 derniers
  examenEnCours: { niveau, questions: { questionId: string, ordre: number[] }[], reponses: (number[] | null)[], debut: string, dureeMs: number, index: number } | null,
  cas: Record<string, { dernier: number, meilleur: number, total: number }>
}
```

- Écriture à chaque changement d'état (volume faible).
- Lecture au démarrage : si `version` est antérieure, **migration** ; si le JSON est illisible, on repart d'un état vide (sans planter) et on conserve la valeur brute sous `revision-pse:corrompu`.
- Références vers du contenu disparu : ignorées à l'affichage, purgées à la prochaine écriture.
- Tous les accès au stockage sont protégés (`try/catch`) ; si le stockage est indisponible, l'app fonctionne en mémoire et affiche un bandeau « Ta progression ne sera pas conservée sur cet appareil ».

## 9. Hors connexion et mises à jour

- `vite-plugin-pwa` (Workbox) : pré-cache de l'app, du contenu et des polices à la première visite ; fonctionne ensuite sans réseau.
- Manifeste : nom « Révision PSE », couleur de thème `#6A55B5`, fond `#F4F2F8`, icônes 192/512 et maskable dessinées à partir du pictogramme ECG du canvas.
- Mise à jour en mode « prompt » : bandeau « Nouvelle version disponible — Recharger ». **Jamais de rechargement forcé** (protège un examen en cours).
- `base` Vite configurable (`/revision-pse/` pour GitHub Pages).

## 10. Gestion des erreurs

- Contenu invalide : bloqué à la construction, jamais à l'exécution.
- Route ou identifiant inconnu : écran « Introuvable ».
- Stockage indisponible ou corrompu : § 8.
- Erreur d'affichage inattendue : une limite d'erreur React affiche « Un problème est survenu » avec un bouton Recharger, sans effacer la progression.

## 11. Tests et qualité

- **Validateur de contenu** : tests sur des fixtures invalides couvrant chaque règle de § 5 et § 6.2 (chacune doit produire une erreur précise), et sur le contenu réel.
- **Tests unitaires (Vitest)** : correction choix unique / multiple / ordre ; mélange « ordre différent de l'ordre correct » ; règles de Mes erreurs ; répartition de l'examen (plus fort reste, moins de 40 questions) ; chronomètre (reprise, expiration hors app) ; recherche (accents, casse, plusieurs mots, tri) ; filtrage brouillon/vérifié ; migration et récupération du stockage.
- **Tests d'interface (Testing Library)** : faire une série d'entraînement ; terminer un examen (rendu manuel et automatique) ; jouer un cas avec les 3 types d'étapes ; rechercher et ouvrir une fiche ; ajouter/retirer un favori.
- **Qualité** : TypeScript strict, ESLint ; `npm run check` = lint + typecheck + tests + validation du contenu + contrôle de neutralité.
- **Vérification visuelle** dans le navigateur intégré, au format téléphone (390 px), à la fin de chaque étape d'implémentation, et test manuel du hors-ligne (chargement, coupure réseau, rechargement).
- **Accessibilité** : vrais `<button>`/`<a>`/`<input>`, focus visible, `aria-live` pour les corrections, contraste ≥ 4,5:1, cibles tactiles ≥ 44 px, correct/incorrect jamais signalé par la couleur seule, respect de `prefers-reduced-motion`.

## 12. Neutralité

- Nom : **Révision PSE**. Pictogramme : ligne ECG. **Aucune forme de croix**, aucune association rouge + blanc.
- Aucun nom d'association (contenu, code, métadonnées, manifeste, dépôt, messages de commit).
- **Contrôle automatique** (dans `npm run check` et dans le build) : échec si l'un des motifs interdits apparaît, sans tenir compte de la casse ni des accents, dans les fichiers texte de `content/`, `src/`, `public/`, `docs/`, `scripts/`, `.github/`, `index.html` et `README.md`. Les motifs sont définis dans `scripts/neutralite.ts`, seul fichier (avec son test) autorisé à les contenir, et exclu du contrôle.
- Sources citées : **uniquement les documents officiels de l'État**.
- Avertissement (accueil et À propos) : « Outil de révision personnel et non officiel. Il ne remplace ni la formation ni le référentiel officiel ; en cas de doute, le document officiel et ton formateur font foi. »
- Nom de dépôt conseillé : `revision-pse`.

## 13. Déploiement

- Dépôt GitHub créé par l'utilisateur (compte personnel).
- Workflow `.github/workflows/deploy.yml` : sur `push` vers `main` → `npm ci` → `npm run check` → `npm run build` (production, contenu vérifié uniquement) → publication GitHub Pages (`actions/deploy-pages`).
- Node.js en local : version portable **LTS en cours** (zip officiel nodejs.org) décompressée dans `C:\Users\aperraud\tools\node`, téléchargée **après accord explicite** de l'utilisateur (nom du fichier, source, taille annoncés).

## 14. Design visuel (repris du canvas)

| Jeton | Valeur | Usage |
|---|---|---|
| `fond` | `#F4F2F8` | fond de l'app |
| `encre` | `#1E1B2E` | texte, boutons principaux |
| `encre-douce` | `#5E5873` | texte secondaire |
| `violet` / `violet-fonce` / `violet-clair` | `#6A55B5` / `#4B3A8C` / `#E4DDF5` | accent principal, PSE1 |
| `vert` / `vert-fonce` / `vert-clair` | `#2E6B61` / `#1E4A43` / `#DCEBE6` | accent secondaire, PSE2, cas |
| `sable` / `sable-fonce` | `#F7EAD2` / `#7A4B0B` | nouveautés 2026 |
| `juste-fond` / `juste` | `#D5EDE3` / `#1F6B4E` | bonne réponse |
| `faux-fond` / `faux` | `#F9DCD3` / `#9A3412` | mauvaise réponse |

- Police **Poppins** 400/500/600/700, **auto-hébergée** (paquet `@fontsource/poppins`, sous-ensemble latin).
- Rayons 12–30 px, cartes pleines sans bordure, puces arrondies, barre de navigation basse blanche arrondie en haut.
- Icônes : SVG en trait, inline, comme dans le canvas ; pas d'emoji.

## 15. Plan des lots de contenu (sous-projet 2, provisoire)

À ajuster au sommaire officiel une fois celui-ci lu. Chaque lot : fiches + environ 4 QCM par fiche + cas associés ; relecture par l'utilisateur avant passage à `verifie`.

| Lot | Contenu |
|---|---|
| 0 | Contenu du prototype migré au nouveau format, en `brouillon` (jeu de test du sous-projet 1) |
| 1 | Généralités : attitude, sécurité, hygiène et EPI, bilans, alerte et transmission |
| 2 | Urgences vitales : hémorragies, obstruction des voies aériennes, perte de connaissance, arrêt cardiaque, détresses |
| 3 | Malaises et affections spécifiques |
| 4 | Atteintes circonstancielles : environnement, intoxications, noyade, électrisation… |
| 5 | Traumatismes |
| 6 | Souffrance psychique et situations particulières : accouchement, nombreuses victimes… |
| 7 | Fiches techniques : gestes et matériel |
| 8 | Cas pratiques transversaux et équilibrage de l'examen blanc |

## 16. Critères d'acceptation du sous-projet 1

1. `npm run dev` affiche l'app avec le contenu du lot 0 (badges Brouillon), fidèle au canvas au format 390 px.
2. Toutes les fonctions de § 7 fonctionnent sur ce contenu.
3. `npm run check` passe ; chaque règle du validateur et le contrôle de neutralité sont couverts par un test qui échoue quand la règle est violée.
4. `npm run build` produit une PWA installable qui fonctionne hors ligne (vérifié manuellement) et ne contient que du contenu `verifie` (états vides si aucun).
5. Le workflow de déploiement est prêt ; la première mise en ligne publique a lieu dès qu'un lot est vérifié et que le dépôt GitHub existe.

## 17. Risques et points ouverts

- **Source officielle 2026 non encore consultée** : les outils réseau étaient indisponibles pendant le brainstorming. L'intitulé exact et le contenu de l'édition 2026 (le prototype mentionne des « Références Techniques Nationales, édition juillet 2026 ») sont à confirmer au début du sous-projet 2. Repli : PDF fourni par l'utilisateur.
- **iOS / Safari** : le stockage d'un site non installé peut être effacé après plusieurs jours sans visite ; l'app installée sur l'écran d'accueil n'est pas concernée → conseil affiché dans À propos.
- **Téléchargements** (Node.js portable, dépendances npm) : soumis à l'accord de l'utilisateur ; poste de travail potentiellement filtré (proxy).
- **Compte GitHub** : à créer par l'utilisateur.
