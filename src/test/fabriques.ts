// Contenu de test, indépendant de `content/`.
import type { Cas, ContenuPublie, Fiche, Niveau, Question } from '../content/types';

export function question(ficheId: string, n: number, surcharge: Partial<Question> = {}): Question {
  return {
    id: `${ficheId}/q${n}`,
    ficheId,
    enonce: `Question ${n} de ${ficheId} ?`,
    propositions: ['Réponse A', 'Réponse B', 'Réponse C'],
    bonnes: [0],
    explication: `Explication ${n}.`,
    nouveaute: false,
    ...surcharge,
  };
}

export function fiche(id: string, surcharge: Partial<Fiche> & { nbQuestions?: number } = {}): Fiche {
  const { nbQuestions = 2, ...reste } = surcharge;
  return {
    id,
    niveau: 'PSE1' as Niveau,
    chapitre: 'urgences',
    type: 'procedure',
    ordre: 1,
    titre: `Fiche ${id}`,
    motsCles: [],
    statut: 'verifie',
    source: { document: 'Recommandations PSE', code: 'PR-00', page: 12 },
    liees: [],
    blocs: [{ type: 'texte', contenu: `Texte de ${id}.` }],
    questions: Array.from({ length: nbQuestions }, (_, i) => question(id, i + 1)),
    estNouveaute: false,
    ...reste,
  };
}

export function casTest(surcharge: Partial<Cas> = {}): Cas {
  return {
    id: 'chute',
    niveau: 'PSE1',
    titre: 'Chute de vélo',
    lieu: 'Piste cyclable',
    statut: 'verifie',
    liees: ['hemorragies'],
    contexte: 'Un cycliste est tombé.',
    etapes: [
      {
        moment: "À l'arrivée",
        situation: 'Des vélos passent encore.',
        question: 'Première action ?',
        type: 'choix',
        propositions: [
          { texte: 'Sécuriser la zone', correct: true, retour: 'Oui, on évite le suraccident.' },
          { texte: 'Examiner la victime', correct: false, retour: 'Pas avant de sécuriser.' },
        ],
      },
      {
        moment: 'Transmission',
        situation: 'Le régulateur prend le bilan.',
        question: 'Que transmets-tu ?',
        type: 'multiple',
        propositions: [
          { texte: 'Le bilan vital', correct: true, retour: 'Indispensable.' },
          { texte: "L'heure de l'accident", correct: true, retour: 'Utile.' },
          { texte: 'La couleur du vélo', correct: false, retour: 'Sans intérêt.' },
        ],
      },
      {
        moment: 'Récapitulatif',
        situation: 'Tu refais le point.',
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

/** Petit programme complet : 2 chapitres, 4 fiches (dont 1 PSE2), 9 questions, 1 cas. */
export function contenuTest(): ContenuPublie {
  return {
    chapitres: [
      { id: 'generalites', titre: 'Généralités' },
      { id: 'urgences', titre: 'Urgences vitales' },
    ],
    fiches: [
      fiche('securite', { chapitre: 'generalites', titre: 'Sécurité et protection', motsCles: ['EPI'], nbQuestions: 2 }),
      fiche('hemorragies', {
        titre: 'Hémorragies externes',
        motsCles: ['garrot', 'saignement'],
        blocs: [
          { type: 'texte', titre: 'En bref', contenu: 'Un saignement abondant et prolongé.' },
          { type: 'chiffres', items: [{ valeur: 'Compression directe', libelle: '1er geste' }] },
          { type: 'etapes', titre: 'Conduite à tenir', items: ['Comprimer la plaie', 'Poser un garrot si inefficace'] },
          { type: 'nouveaute', titre: 'Ce qui change en 2026', items: ['Introduction du packing.'] },
        ],
        estNouveaute: true,
        liees: ['arret-cardiaque'],
        nbQuestions: 0,
        questions: [
          question('hemorragies', 1, { enonce: 'Premier geste face à un saignement ?', nouveaute: true }),
          question('hemorragies', 2, {
            enonce: 'Quels garrots sont admis ?',
            propositions: ['Garrot industriel', 'Garrot pneumatique', 'Élastique de prélèvement'],
            bonnes: [0, 1],
          }),
          question('hemorragies', 3),
        ],
      }),
      fiche('arret-cardiaque', { ordre: 2, titre: 'Arrêt cardiaque', nbQuestions: 3 }),
      fiche('rachis', { ordre: 3, niveau: 'PSE2', titre: 'Traumatisme du rachis', nbQuestions: 1 }),
    ],
    cas: [casTest()],
    meta: { genereLe: '2026-09-28T10:00:00.000Z', avecBrouillons: false },
  };
}
