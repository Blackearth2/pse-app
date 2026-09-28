/** Générateur de nombres dans [0, 1). `Math.random` en production, générateur à graine en test. */
export type Aleatoire = () => number;

/** Générateur déterministe (mulberry32), pour des tests reproductibles. */
export function creerAleatoire(graine: number): Aleatoire {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mélange de Fisher-Yates, sans modifier la liste reçue. */
export function melanger<T>(liste: readonly T[], rnd: Aleatoire = Math.random): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copie[i], copie[j]] = [copie[j]!, copie[i]!];
  }
  return copie;
}

/** Tire `n` éléments distincts au hasard (tous s'il y en a moins). */
export function tirer<T>(liste: readonly T[], n: number, rnd: Aleatoire = Math.random): T[] {
  return melanger(liste, rnd).slice(0, n);
}

/** Permutation aléatoire de 0..n-1. */
export function permutation(n: number, rnd: Aleatoire = Math.random): number[] {
  return melanger(
    Array.from({ length: n }, (_, i) => i),
    rnd,
  );
}
