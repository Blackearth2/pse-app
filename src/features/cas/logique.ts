// Logique des cas pratiques (§ 7.6).
import type { EtapeCas } from '../../content/types';
import { permutation, type Aleatoire } from '../../lib/hasard';
import { estCorrect } from '../qcm/logique';

/** Ordre de départ d'une étape « ordre » : mélangé et toujours différent de l'ordre correct. */
export function ordreInitial(n: number, rnd: Aleatoire = Math.random): number[] {
  const o = permutation(n, rnd);
  if (n >= 2 && o.every((v, i) => v === i)) [o[0], o[1]] = [o[1]!, o[0]!];
  return o;
}

/**
 * `reponse` : pour `choix`/`multiple`, les indices d'origine des propositions choisies ;
 * pour `ordre`, les indices d'origine des éléments dans l'ordre donné par l'utilisateur.
 */
export function etapeReussie(etape: EtapeCas, reponse: readonly number[]): boolean {
  if (etape.type === 'ordre') return reponse.length === etape.elements.length && reponse.every((v, i) => v === i);
  const correctes = etape.propositions.flatMap((p, i) => (p.correct ? [i] : []));
  return estCorrect(correctes, reponse);
}
