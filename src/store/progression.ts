// Progression enregistrée sur l'appareil (§ 8) : état, actions pures, migration.
import type { Contenu } from '../content/types';
import type { ExamenEnCours, NiveauExamen } from '../features/examen/logique';
import { majErreurs, purgerIds, type ModeReponse } from '../features/qcm/logique';

export const VERSION_PROGRESSION = 1;
export const NB_EXAMENS_GARDES = 10;

export interface ExamenPasse {
  date: string;
  niveau: NiveauExamen;
  score: number;
  total: number;
}

export interface ResultatCas {
  dernier: number;
  meilleur: number;
  total: number;
}

export interface Progression {
  version: typeof VERSION_PROGRESSION;
  lues: string[];
  favoris: string[];
  erreurs: string[];
  /** Du plus ancien au plus récent. */
  examens: ExamenPasse[];
  examenEnCours: ExamenEnCours | null;
  cas: Record<string, ResultatCas>;
}

export const PROGRESSION_VIDE: Progression = {
  version: VERSION_PROGRESSION,
  lues: [],
  favoris: [],
  erreurs: [],
  examens: [],
  examenEnCours: null,
  cas: {},
};

// --- Actions -------------------------------------------------------------------

export function marquerLue(p: Progression, ficheId: string): Progression {
  return p.lues.includes(ficheId) ? p : { ...p, lues: [...p.lues, ficheId] };
}

export function basculerFavori(p: Progression, ficheId: string): Progression {
  return {
    ...p,
    favoris: p.favoris.includes(ficheId) ? p.favoris.filter((id) => id !== ficheId) : [...p.favoris, ficheId],
  };
}

export function repondreQuestion(p: Progression, questionId: string, correct: boolean, mode: ModeReponse): Progression {
  return { ...p, erreurs: majErreurs(p.erreurs, questionId, correct, mode) };
}

export function majExamenEnCours(p: Progression, examen: ExamenEnCours | null): Progression {
  return { ...p, examenEnCours: examen };
}

export function enregistrerExamen(p: Progression, examen: ExamenPasse): Progression {
  return { ...p, examens: [...p.examens, examen].slice(-NB_EXAMENS_GARDES), examenEnCours: null };
}

export function enregistrerCas(p: Progression, casId: string, score: number, total: number): Progression {
  const avant = p.cas[casId];
  return { ...p, cas: { ...p.cas, [casId]: { dernier: score, meilleur: Math.max(score, avant?.meilleur ?? 0), total } } };
}

/** Retire les références vers du contenu qui n'est plus publié. */
export function purger(p: Progression, contenu: Contenu): Progression {
  const fiches = new Set(contenu.fiches.map((f) => f.id));
  const questions = new Set(contenu.fiches.flatMap((f) => f.questions.map((q) => q.id)));
  const cas = new Set(contenu.cas.map((c) => c.id));
  return {
    ...p,
    lues: purgerIds(p.lues, fiches),
    favoris: purgerIds(p.favoris, fiches),
    erreurs: purgerIds(p.erreurs, questions),
    cas: Object.fromEntries(Object.entries(p.cas).filter(([id]) => cas.has(id))),
  };
}

// --- Migration / lecture défensive --------------------------------------------------

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const estNombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const chaines = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const entiers = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => Number.isInteger(x));
const estNiveauExamen = (v: unknown): v is NiveauExamen => v === 'PSE1' || v === 'PSE1+PSE2';

function lireExamen(v: unknown): ExamenEnCours | null {
  if (!estObjet(v) || !estNiveauExamen(v.niveau) || !Array.isArray(v.questions) || !Array.isArray(v.reponses)) return null;
  if (typeof v.debut !== 'string' || Number.isNaN(Date.parse(v.debut)) || !estNombre(v.dureeMs) || !estNombre(v.index)) return null;
  const questionsOk = v.questions.every((q) => estObjet(q) && typeof q.questionId === 'string' && entiers(q.ordre));
  const reponsesOk = v.reponses.length === v.questions.length && v.reponses.every((r) => r === null || entiers(r));
  if (!questionsOk || !reponsesOk) return null;
  return v as unknown as ExamenEnCours;
}

function lireExamensPasses(v: unknown): ExamenPasse[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (e): e is ExamenPasse =>
      estObjet(e) && typeof e.date === 'string' && estNiveauExamen(e.niveau) && estNombre(e.score) && estNombre(e.total),
  );
}

function lireCas(v: unknown): Record<string, ResultatCas> {
  if (!estObjet(v)) return {};
  return Object.fromEntries(
    Object.entries(v).filter(
      (e): e is [string, ResultatCas] => estObjet(e[1]) && estNombre(e[1].dernier) && estNombre(e[1].meilleur) && estNombre(e[1].total),
    ),
  );
}

/** Convertit une donnée stockée en progression courante ; `null` si elle est illisible. */
export function migrer(brut: unknown): Progression | null {
  if (!estObjet(brut) || brut.version !== VERSION_PROGRESSION) return null;
  return {
    version: VERSION_PROGRESSION,
    lues: chaines(brut.lues),
    favoris: chaines(brut.favoris),
    erreurs: chaines(brut.erreurs),
    examens: lireExamensPasses(brut.examens),
    examenEnCours: lireExamen(brut.examenEnCours),
    cas: lireCas(brut.cas),
  };
}
