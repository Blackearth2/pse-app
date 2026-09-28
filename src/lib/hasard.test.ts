import { describe, expect, it } from 'vitest';
import { creerAleatoire, melanger, permutation, tirer } from './hasard';

describe('hasard', () => {
  it('creerAleatoire est déterministe pour une même graine', () => {
    const a = creerAleatoire(42);
    const b = creerAleatoire(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('melanger renvoie une copie contenant les mêmes éléments', () => {
    const source = [1, 2, 3, 4, 5, 6];
    const r = melanger(source, creerAleatoire(1));
    expect([...r].sort()).toEqual(source);
    expect(source).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('tirer renvoie n éléments distincts, ou tous s’il y en a moins', () => {
    const rnd = creerAleatoire(7);
    const r = tirer([...'abcdefghij'], 4, rnd);
    expect(new Set(r).size).toBe(4);
    expect(tirer(['a', 'b'], 10, rnd)).toHaveLength(2);
  });

  it('permutation couvre 0..n-1', () => {
    expect([...permutation(5, creerAleatoire(3))].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});
