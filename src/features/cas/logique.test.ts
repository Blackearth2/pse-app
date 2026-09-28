import { describe, expect, it } from 'vitest';
import { creerAleatoire } from '../../lib/hasard';
import { casTest } from '../../test/fabriques';
import { etapeReussie, ordreInitial } from './logique';

const [choix, multiple, ordre] = casTest().etapes;

describe('ordreInitial', () => {
  it("n'est jamais l'ordre correct, quelle que soit la graine", () => {
    for (let graine = 0; graine < 200; graine++) {
      const o = ordreInitial(3, creerAleatoire(graine));
      expect([...o].sort()).toEqual([0, 1, 2]);
      expect(o).not.toEqual([0, 1, 2]);
    }
  });

  it('fonctionne avec 2 éléments (inversion obligatoire)', () => {
    expect(ordreInitial(2, creerAleatoire(1))).toEqual([1, 0]);
  });
});

describe('etapeReussie', () => {
  it('choix : juste seulement avec la proposition correcte', () => {
    expect(etapeReussie(choix!, [0])).toBe(true);
    expect(etapeReussie(choix!, [1])).toBe(false);
  });

  it("multiple : l'ensemble exact des propositions correctes", () => {
    expect(etapeReussie(multiple!, [1, 0])).toBe(true);
    expect(etapeReussie(multiple!, [0])).toBe(false);
    expect(etapeReussie(multiple!, [0, 1, 2])).toBe(false);
  });

  it("ordre : l'ordre exact des éléments", () => {
    expect(etapeReussie(ordre!, [0, 1, 2])).toBe(true);
    expect(etapeReussie(ordre!, [1, 0, 2])).toBe(false);
  });
});
