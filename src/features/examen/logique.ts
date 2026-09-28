// Logique de l'examen blanc (§ 7.5) : tirage réparti, chronomètre, correction.
import type { Fiche } from '../../content/types';
import { melanger, tirer, type Aleatoire } from '../../lib/hasard';
import { estCorrect, reponseOriginale, tirerQuestion, type QuestionTiree } from '../qcm/logique';

export type NiveauExamen = 'PSE1' | 'PSE1+PSE2';

export const TAILLE_EXAMEN = 40;
export const DUREE_PAR_QUESTION_MS = 60_000;

export interface ExamenEnCours {
  niveau: NiveauExamen;
  questions: QuestionTiree[];
  /** Positions affichées cochées, par question (`null` = sans réponse). */
  reponses: (number[] | null)[];
  /** Heure de début, ISO. */
  debut: string;
  dureeMs: number;
  index: number;
}

export interface ResultatExamen {
  score: number;
  total: number;
  parChapitre: { chapitre: string; bonnes: number; total: number }[];
  /** Identifiants des questions ratées ou sans réponse. */
  erreurs: string[];
}

/** Répartit `cible` places entre des groupes, au prorata de leur taille (méthode du plus fort reste). */
export function repartir(groupes: readonly (readonly [string, number])[], cible: number): Map<string, number> {
  const total = groupes.reduce((s, [, n]) => s + n, 0);
  if (total <= cible) return new Map(groupes.map(([id, n]) => [id, n]));

  const quotas = groupes.map(([id, n], rang) => {
    const q = (cible * n) / total;
    return { id, n, rang, base: Math.floor(q), reste: q - Math.floor(q) };
  });
  let restantes = cible - quotas.reduce((s, q) => s + q.base, 0);
  const parReste = [...quotas].sort((a, b) => b.reste - a.reste || b.n - a.n || a.rang - b.rang);
  for (const q of parReste) {
    if (restantes === 0) break;
    if (q.base < q.n) {
      q.base += 1;
      restantes -= 1;
    }
  }
  return new Map(quotas.map((q) => [q.id, q.base]));
}

export function creerExamen(fiches: readonly Fiche[], niveau: NiveauExamen, rnd: Aleatoire, maintenant: Date): ExamenEnCours {
  const retenues = fiches.filter((f) => niveau === 'PSE1+PSE2' || f.niveau === 'PSE1');
  const parChapitre = new Map<string, Fiche['questions']>();
  for (const f of retenues) parChapitre.set(f.chapitre, [...(parChapitre.get(f.chapitre) ?? []), ...f.questions]);

  const quotas = repartir(
    [...parChapitre].map(([c, qs]) => [c, qs.length] as const),
    TAILLE_EXAMEN,
  );
  const tirees = [...parChapitre].flatMap(([c, qs]) => tirer(qs, quotas.get(c) ?? 0, rnd));
  const questions = melanger(tirees, rnd).map((q) => tirerQuestion(q, rnd));

  return {
    niveau,
    questions,
    reponses: questions.map(() => null),
    debut: maintenant.toISOString(),
    dureeMs: questions.length * DUREE_PAR_QUESTION_MS,
    index: 0,
  };
}

export function tempsRestantMs(examen: ExamenEnCours, maintenant: Date): number {
  return Math.max(0, new Date(examen.debut).getTime() + examen.dureeMs - maintenant.getTime());
}

export function estExpire(examen: ExamenEnCours, maintenant: Date): boolean {
  return tempsRestantMs(examen, maintenant) === 0;
}

export function corrigerExamen(examen: ExamenEnCours, fiches: readonly Fiche[]): ResultatExamen {
  const questions = new Map(fiches.flatMap((f) => f.questions).map((q) => [q.id, q]));
  const chapitreDe = new Map(fiches.map((f) => [f.id, f.chapitre]));
  const ordreChapitres = [...new Set(fiches.map((f) => f.chapitre))];

  let score = 0;
  const erreurs: string[] = [];
  const parChapitre = new Map<string, { bonnes: number; total: number }>();

  examen.questions.forEach((qt, i) => {
    const q = questions.get(qt.questionId);
    if (!q) return; // question retirée du contenu publié depuis le début de l'examen
    const reponse = examen.reponses[i];
    const juste = reponse != null && estCorrect(q.bonnes, reponseOriginale(qt.ordre, reponse));
    const chapitre = chapitreDe.get(q.ficheId)!;
    const c = parChapitre.get(chapitre) ?? { bonnes: 0, total: 0 };
    c.total += 1;
    if (juste) {
      c.bonnes += 1;
      score += 1;
    } else {
      erreurs.push(q.id);
    }
    parChapitre.set(chapitre, c);
  });

  return {
    score,
    total: [...parChapitre.values()].reduce((s, c) => s + c.total, 0),
    parChapitre: ordreChapitres.filter((c) => parChapitre.has(c)).map((c) => ({ chapitre: c, ...parChapitre.get(c)! })),
    erreurs,
  };
}
