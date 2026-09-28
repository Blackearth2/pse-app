// Types du contenu tel que l'app le consomme (après validation et transformation).

export type Niveau = 'PSE1' | 'PSE2';
export type TypeFiche = 'connaissance' | 'procedure' | 'technique';
export type Statut = 'brouillon' | 'verifie';

export interface Chapitre {
  id: string;
  titre: string;
}

export type Bloc =
  | { type: 'texte'; titre?: string; contenu: string }
  | { type: 'chiffres'; titre?: string; items: { valeur: string; libelle: string }[] }
  | { type: 'etapes' | 'liste' | 'attention' | 'nouveaute'; titre?: string; items: string[] };

export interface Question {
  /** Identifiant complet : `<idFiche>/<idQuestion>`. */
  id: string;
  ficheId: string;
  enonce: string;
  propositions: string[];
  /** Indices (à partir de 0) des bonnes propositions ; 2 ou plus = choix multiple. */
  bonnes: number[];
  explication: string;
  nouveaute: boolean;
}

export interface Source {
  document: string;
  code: string;
  page?: number;
}

export interface Fiche {
  id: string;
  niveau: Niveau;
  chapitre: string;
  type: TypeFiche;
  ordre: number;
  titre: string;
  motsCles: string[];
  statut: Statut;
  source: Source;
  liees: string[];
  blocs: Bloc[];
  questions: Question[];
  /** Vrai si la fiche contient au moins un bloc `nouveaute`. */
  estNouveaute: boolean;
}

export interface PropositionCas {
  texte: string;
  correct: boolean;
  retour: string;
}

interface EtapeBase {
  moment: string;
  situation: string;
  question: string;
}

export type EtapeCas =
  | (EtapeBase & { type: 'choix' | 'multiple'; propositions: PropositionCas[] })
  | (EtapeBase & { type: 'ordre'; elements: string[]; retour: string });

export interface Cas {
  id: string;
  niveau: Niveau;
  titre: string;
  lieu: string;
  statut: Statut;
  liees: string[];
  contexte: string;
  etapes: EtapeCas[];
  pointsCles: string[];
}

export interface Contenu {
  chapitres: Chapitre[];
  /** Fiches dans l'ordre du programme (chapitres, puis `ordre`). */
  fiches: Fiche[];
  cas: Cas[];
}

export interface ContenuPublie extends Contenu {
  meta: {
    /** Date ISO de génération du contenu. */
    genereLe: string;
    avecBrouillons: boolean;
  };
}
