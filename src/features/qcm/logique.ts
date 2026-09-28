// Logique des QCM : périmètres, tirage des séries, correction, règles de « Mes erreurs » (§ 7.3, 7.4).
import type { Fiche, Niveau, Question } from '../../content/types';
import { permutation, tirer, type Aleatoire } from '../../lib/hasard';

export type Perimetre =
  | { type: 'tout' }
  | { type: 'niveau'; niveau: Niveau }
  | { type: 'chapitre'; chapitre: string }
  | { type: 'nouveautes' }
  | { type: 'fiche'; fiche: string }
  | { type: 'ids'; ids: string[] };

export type ModeReponse = 'entrainement' | 'erreurs' | 'examen';

/** Une question tirée, avec l'ordre d'affichage de ses propositions (`ordre[i]` = indice d'origine). */
export interface QuestionTiree {
  questionId: string;
  ordre: number[];
}

export const TAILLE_SERIE = 10;

export function questionsDuPerimetre(fiches: readonly Fiche[], p: Perimetre): Question[] {
  if (p.type === 'ids') {
    const voulues = new Set(p.ids);
    return fiches.flatMap((f) => f.questions).filter((q) => voulues.has(q.id));
  }
  return fiches
    .filter((f) => {
      if (p.type === 'niveau') return f.niveau === p.niveau;
      if (p.type === 'chapitre') return f.chapitre === p.chapitre;
      if (p.type === 'fiche') return f.id === p.fiche;
      return true;
    })
    .flatMap((f) => f.questions)
    .filter((q) => p.type !== 'nouveautes' || q.nouveaute);
}

export function tirerQuestion(q: Question, rnd: Aleatoire): QuestionTiree {
  return { questionId: q.id, ordre: permutation(q.propositions.length, rnd) };
}

export function tirerSerie(questions: readonly Question[], rnd: Aleatoire = Math.random, taille = TAILLE_SERIE): QuestionTiree[] {
  return tirer(questions, taille, rnd).map((q) => tirerQuestion(q, rnd));
}

/** Convertit des positions affichées en indices de propositions d'origine. */
export function reponseOriginale(ordre: readonly number[], positions: readonly number[]): number[] {
  return positions.map((p) => ordre[p]!);
}

/** Juste si l'ensemble choisi est exactement l'ensemble des bonnes réponses. */
export function estCorrect(bonnes: readonly number[], choisies: readonly number[]): boolean {
  const b = new Set(bonnes);
  const c = new Set(choisies);
  return b.size === c.size && [...b].every((i) => c.has(i));
}

/** Règles de « Mes erreurs » : toute question ratée y entre ; seule une réussite en mode « erreurs » l'en retire. */
export function majErreurs(erreurs: readonly string[], questionId: string, correct: boolean, mode: ModeReponse): string[] {
  if (!correct) return erreurs.includes(questionId) ? [...erreurs] : [...erreurs, questionId];
  if (mode === 'erreurs') return erreurs.filter((id) => id !== questionId);
  return [...erreurs];
}

export function purgerIds(ids: readonly string[], publies: ReadonlySet<string>): string[] {
  return ids.filter((id) => publies.has(id));
}
