import { describe, expect, it } from 'vitest';
import { typo, typographier } from './typo';

const FINE = '\u202f';

describe('typo', () => {
  it('insère une espace fine insécable avant : ; ? !', () => {
    expect(typo('Premier geste ?')).toBe(`Premier geste${FINE}?`);
    expect(typo('Critère : obstruction')).toBe(`Critère${FINE}: obstruction`);
    expect(typo('Stop!')).toBe(`Stop${FINE}!`);
  });

  it('gère les guillemets français', () => {
    expect(typo('la fiche « obstruction »')).toBe(`la fiche «${FINE}obstruction${FINE}»`);
  });

  it('ne touche pas aux heures ni aux URL, mais traite les ratios espacés', () => {
    expect(typo('10:30')).toBe('10:30');
    expect(typo('https://exemple.fr/page?a=1')).toBe('https://exemple.fr/page?a=1');
    expect(typo('30 : 2')).toBe(`30${FINE}: 2`);
  });

  it('est idempotente', () => {
    expect(typo(typo('Quoi ? « oui »'))).toBe(typo('Quoi ? « oui »'));
  });
});

describe('typographier', () => {
  it('traite toutes les chaînes d’une structure, sans toucher aux clés', () => {
    expect(typographier({ 'a :': ['Oui ?', { b: 'Non !' }], n: 3 })).toEqual({ 'a :': [`Oui${FINE}?`, { b: `Non${FINE}!` }], n: 3 });
  });
});
