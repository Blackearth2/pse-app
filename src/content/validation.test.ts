import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { validerContenu, type FichierSource } from './validation';

// --- Fabriques de contenu valide -------------------------------------------

type Objet = Record<string, unknown>;

function chapitres(): Objet[] {
  return [
    { id: 'generalites', titre: 'Généralités' },
    { id: 'urgences-vitales', titre: 'Urgences vitales' },
  ];
}

function fiche(surcharge: Objet = {}): Objet {
  return {
    id: 'hemorragies',
    niveau: 'PSE1',
    chapitre: 'urgences-vitales',
    type: 'procedure',
    ordre: 1,
    titre: 'Hémorragies externes',
    statut: 'brouillon',
    source: { document: 'Recommandations PSE', code: 'PR-01' },
    blocs: [
      { type: 'texte', titre: 'En bref', contenu: 'Un saignement abondant.' },
      { type: 'etapes', items: ['Comprimer', 'Alerter'] },
    ],
    qcm: [
      {
        id: 'q1',
        enonce: 'Premier geste ?',
        propositions: ['Garrot', 'Compression directe', 'Attendre'],
        bonnes: [1],
        explication: 'La compression directe vient en premier.',
      },
    ],
    ...surcharge,
  };
}

function cas(surcharge: Objet = {}): Objet {
  return {
    id: 'chute-scooter',
    niveau: 'PSE1',
    titre: 'Chute de scooter',
    lieu: 'Voie publique',
    statut: 'brouillon',
    liees: ['hemorragies'],
    contexte: 'Un scooter a chuté.',
    etapes: [
      {
        moment: "À l'arrivée",
        situation: 'La circulation continue.',
        question: 'Première action ?',
        type: 'choix',
        propositions: [
          { texte: 'Baliser', correct: true, retour: 'Oui.' },
          { texte: 'Comprimer', correct: false, retour: 'Pas avant.' },
        ],
      },
      {
        moment: 'Transmission',
        situation: 'Le régulateur demande le bilan.',
        question: 'Que transmets-tu ?',
        type: 'multiple',
        propositions: [
          { texte: 'Heure du garrot', correct: true, retour: 'Oui.' },
          { texte: 'Bilan vital', correct: true, retour: 'Oui.' },
          { texte: 'Plat préféré', correct: false, retour: 'Non.' },
        ],
      },
      {
        moment: 'Début',
        situation: 'Tu arrives.',
        question: 'Remets dans l’ordre.',
        type: 'ordre',
        elements: ['Protéger', 'Examiner', 'Alerter'],
        retour: 'Protéger, examiner, alerter.',
      },
    ],
    pointsCles: ['Sécuriser avant tout.'],
    ...surcharge,
  };
}

function fichiers(options: { fiches?: Objet[]; cas?: Objet[]; chapitres?: Objet[] | null } = {}): FichierSource[] {
  const liste: FichierSource[] = [];
  if (options.chapitres !== null) liste.push({ chemin: 'chapitres.yaml', texte: stringify(options.chapitres ?? chapitres()) });
  for (const f of options.fiches ?? [fiche()]) {
    liste.push({ chemin: `fiches/${String(f.chapitre)}/${String(f.id)}.yaml`, texte: stringify(f) });
  }
  for (const c of options.cas ?? [cas()]) {
    liste.push({ chemin: `cas/${String(c.id)}.yaml`, texte: stringify(c) });
  }
  return liste;
}

function erreursDe(liste: FichierSource[]): string {
  return validerContenu(liste).erreurs.join('\n');
}

// --- Contenu valide ---------------------------------------------------------

describe('validerContenu — contenu valide', () => {
  it("n'émet aucune erreur et construit le contenu", () => {
    const r = validerContenu(fichiers());
    expect(r.erreurs).toEqual([]);
    expect(r.contenu?.fiches).toHaveLength(1);
    expect(r.contenu?.cas).toHaveLength(1);
  });

  it('applique les valeurs par défaut et les identifiants complets de questions', () => {
    const f = validerContenu(fichiers()).contenu!.fiches[0]!;
    expect(f.motsCles).toEqual([]);
    expect(f.liees).toEqual([]);
    expect(f.estNouveaute).toBe(false);
    expect(f.questions[0]).toMatchObject({ id: 'hemorragies/q1', ficheId: 'hemorragies', nouveaute: false });
  });

  it('détecte une fiche « nouveauté » grâce à un bloc nouveaute', () => {
    const f = fiche({ blocs: [{ type: 'nouveaute', items: ['Packing.'] }] });
    expect(validerContenu(fichiers({ fiches: [f] })).contenu!.fiches[0]!.estNouveaute).toBe(true);
  });

  it("trie les fiches dans l'ordre du programme (chapitres puis ordre)", () => {
    const a = fiche({ id: 'b-vitale-2', ordre: 2, qcm: [] });
    const b = fiche({ id: 'a-vitale-1', ordre: 1, qcm: [] });
    const c = fiche({ id: 'z-generalite', chapitre: 'generalites', ordre: 5, qcm: [] });
    const r = validerContenu(fichiers({ fiches: [a, b, c], cas: [] }));
    expect(r.erreurs).toEqual([]);
    expect(r.contenu!.fiches.map((f) => f.id)).toEqual(['z-generalite', 'a-vitale-1', 'b-vitale-2']);
  });

  it('accepte une question à choix multiple', () => {
    const f = fiche({
      qcm: [{ id: 'q1', enonce: 'Lesquels ?', propositions: ['A', 'B', 'C'], bonnes: [0, 2], explication: 'A et C.' }],
    });
    expect(erreursDe(fichiers({ fiches: [f] }))).toBe('');
  });
});

// --- Structure des fichiers -------------------------------------------------

describe('validerContenu — fichiers', () => {
  it('exige chapitres.yaml', () => {
    expect(erreursDe(fichiers({ chapitres: null }))).toContain('chapitres.yaml');
  });

  it('signale un YAML illisible avec le nom du fichier', () => {
    const liste = [...fichiers(), { chemin: 'cas/casse.yaml', texte: 'id: [non fermé' }];
    expect(erreursDe(liste)).toMatch(/cas\/casse\.yaml.*YAML/);
  });

  it('signale un fichier inattendu', () => {
    const liste = [...fichiers(), { chemin: 'notes.md', texte: 'bonjour' }];
    expect(erreursDe(liste)).toContain('notes.md');
  });

  it('exige que le dossier de la fiche corresponde à son chapitre', () => {
    const liste = fichiers();
    liste[1] = { chemin: 'fiches/generalites/hemorragies.yaml', texte: liste[1]!.texte };
    expect(erreursDe(liste)).toContain('dossier');
  });

  it("exige que le nom du fichier corresponde à l'identifiant", () => {
    const liste = fichiers();
    liste[1] = { chemin: 'fiches/urgences-vitales/autre-nom.yaml', texte: liste[1]!.texte };
    expect(erreursDe(liste)).toContain('nom du fichier');
  });
});

// --- Règles des fiches et des QCM ---------------------------------------------

describe('validerContenu — règles des fiches', () => {
  const cas_: [string, Objet, string][] = [
    ['identifiant hors kebab-case', { id: 'Hemo_Rragies' }, 'kebab-case'],
    ['niveau inconnu', { niveau: 'PSE3' }, '› niveau :'],
    ['type inconnu', { type: 'recette' }, '› type :'],
    ['ordre nul', { ordre: 0 }, 'ordre'],
    ['clé inconnue (faute de frappe)', { titr: 'x' }, 'titr'],
    ['source sans code', { source: { document: 'Recommandations PSE' } }, 'source.code'],
    ['aucun bloc', { blocs: [] }, 'blocs'],
    ['bloc de type inconnu', { blocs: [{ type: 'video', items: ['x'] }] }, 'blocs.0.type'],
    ['bloc texte sans contenu', { blocs: [{ type: 'texte' }] }, 'blocs.0.contenu'],
    ['bloc liste vide', { blocs: [{ type: 'liste', items: [] }] }, 'blocs.0.items'],
  ];
  it.each(cas_)('refuse : %s', (_nom, surcharge, attendu) => {
    const f = fiche(surcharge);
    const liste = fichiers({ fiches: [f], cas: [] });
    // Garder le chemin cohérent pour ne tester que la règle visée.
    liste[1] = { chemin: 'fiches/urgences-vitales/hemorragies.yaml', texte: liste[1]!.texte };
    expect(erreursDe(liste)).toContain(attendu);
  });

  it('refuse un chapitre inconnu', () => {
    const f = fiche({ chapitre: 'inconnu' });
    expect(erreursDe(fichiers({ fiches: [f], cas: [] }))).toContain('chapitre « inconnu »');
  });

  it('refuse deux fiches avec le même identifiant', () => {
    const f1 = fiche();
    const f2 = fiche({ chapitre: 'generalites' });
    expect(erreursDe(fichiers({ fiches: [f1, f2], cas: [] }))).toContain('en double');
  });

  it('refuse deux fiches avec le même ordre dans un chapitre', () => {
    const f1 = fiche({ id: 'a', ordre: 1, qcm: [] });
    const f2 = fiche({ id: 'b', ordre: 1, qcm: [] });
    expect(erreursDe(fichiers({ fiches: [f1, f2], cas: [] }))).toContain('ordre 1');
  });

  it('refuse un lien vers une fiche inexistante', () => {
    expect(erreursDe(fichiers({ fiches: [fiche({ liees: ['fantome'] })], cas: [] }))).toContain('fantome');
  });

  it('refuse une fiche liée à elle-même', () => {
    expect(erreursDe(fichiers({ fiches: [fiche({ liees: ['hemorragies'] })], cas: [] }))).toContain('elle-même');
  });
});

describe('validerContenu — règles des QCM', () => {
  const base = { id: 'q1', enonce: 'Question ?', propositions: ['A', 'B', 'C'], bonnes: [0], explication: 'Parce que.' };
  const cas_: [string, Objet, string][] = [
    ['une seule proposition', { propositions: ['A'] }, 'qcm.0.propositions'],
    ['six propositions', { propositions: ['A', 'B', 'C', 'D', 'E', 'F'] }, 'qcm.0.propositions'],
    ['aucune bonne réponse', { bonnes: [] }, 'qcm.0.bonnes'],
    ['indice hors bornes', { bonnes: [3] }, 'indice 3'],
    ['bonne réponse en double', { bonnes: [0, 0] }, 'bonne réponse en double'],
    ['toutes les propositions bonnes', { bonnes: [0, 1, 2] }, 'toutes'],
    ['explication manquante', { explication: undefined }, 'qcm.0.explication'],
  ];
  it.each(cas_)('refuse : %s', (_nom, surcharge, attendu) => {
    const f = fiche({ qcm: [{ ...base, ...surcharge }] });
    expect(erreursDe(fichiers({ fiches: [f], cas: [] }))).toContain(attendu);
  });

  it('refuse deux questions avec le même identifiant dans une fiche', () => {
    const f = fiche({ qcm: [base, base] });
    expect(erreursDe(fichiers({ fiches: [f], cas: [] }))).toContain('q1');
  });
});

// --- Règles des cas pratiques -------------------------------------------------

describe('validerContenu — règles des cas', () => {
  function avecEtape(etape: Objet): Objet {
    const c = cas();
    const etapes = [...(c.etapes as Objet[])];
    etapes[0] = etape;
    return { ...c, etapes };
  }
  const choix = (correctes: boolean[]): Objet => ({
    moment: 'm',
    situation: 's',
    question: 'q',
    type: 'choix',
    propositions: correctes.map((correct, i) => ({ texte: `P${i}`, correct, retour: 'r' })),
  });
  const multiple = (correctes: boolean[]): Objet => ({ ...choix(correctes), type: 'multiple' });
  const ordre = (elements: string[]): Objet => ({
    moment: 'm',
    situation: 's',
    question: 'q',
    type: 'ordre',
    elements,
    retour: 'r',
  });

  const cas_: [string, Objet, string][] = [
    ['choix sans bonne réponse', avecEtape(choix([false, false])), 'exactement une'],
    ['choix avec deux bonnes réponses', avecEtape(choix([true, true, false])), 'exactement une'],
    ['multiple avec une seule bonne réponse', avecEtape(multiple([true, false, false])), 'au moins 2'],
    ['multiple sans mauvaise réponse', avecEtape(multiple([true, true, true])), 'au moins 1 incorrecte'],
    ['multiple avec 2 propositions', avecEtape(multiple([true, true])), 'etapes.0.propositions'],
    ['ordre avec 2 éléments', avecEtape(ordre(['A', 'B'])), 'etapes.0.elements'],
    ['ordre avec doublon', avecEtape(ordre(['A', 'B', 'A'])), 'élément en double'],
    ['une seule étape', { etapes: [choix([true, false])] }, 'etapes'],
    ['aucun point clé', { pointsCles: [] }, 'pointsCles'],
    ['aucune fiche liée', { liees: [] }, 'liees'],
    ['fiche liée inexistante', { liees: ['fantome'] }, 'fantome'],
  ];
  it.each(cas_)('refuse : %s', (_nom, surcharge, attendu) => {
    const c = { ...cas(), ...surcharge };
    expect(erreursDe(fichiers({ cas: [c] }))).toContain(attendu);
  });

  it('refuse deux cas avec le même identifiant', () => {
    const liste = fichiers();
    liste.push({ chemin: 'cas/chute-scooter.yaml', texte: stringify(cas()) });
    expect(erreursDe(liste)).toContain('en double');
  });

  it('indique le fichier en cause dans chaque erreur', () => {
    const r = validerContenu(fichiers({ cas: [{ ...cas(), pointsCles: [] }] }));
    expect(r.erreurs[0]).toMatch(/^cas\/chute-scooter\.yaml/);
    expect(r.contenu).toBeNull();
  });
});
