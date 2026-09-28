import { describe, expect, it } from 'vitest';
import { contenuTest } from '../test/fabriques';
import {
  PROGRESSION_VIDE,
  basculerFavori,
  enregistrerCas,
  enregistrerExamen,
  marquerLue,
  migrer,
  purger,
  repondreQuestion,
  type Progression,
} from './progression';

const p0 = PROGRESSION_VIDE;

describe('actions', () => {
  it('marquerLue ajoute une fois', () => {
    expect(marquerLue(marquerLue(p0, 'a'), 'a').lues).toEqual(['a']);
  });

  it('basculerFavori ajoute puis retire', () => {
    const p1 = basculerFavori(p0, 'a');
    expect(p1.favoris).toEqual(['a']);
    expect(basculerFavori(p1, 'a').favoris).toEqual([]);
  });

  it('repondreQuestion applique les règles de « Mes erreurs »', () => {
    const p1 = repondreQuestion(p0, 'f/q1', false, 'entrainement');
    expect(p1.erreurs).toEqual(['f/q1']);
    expect(repondreQuestion(p1, 'f/q1', true, 'entrainement').erreurs).toEqual(['f/q1']);
    expect(repondreQuestion(p1, 'f/q1', true, 'erreurs').erreurs).toEqual([]);
  });

  it("enregistrerExamen garde les 10 derniers et vide l'examen en cours", () => {
    let p: Progression = { ...p0, examenEnCours: { niveau: 'PSE1', questions: [], reponses: [], debut: 'x', dureeMs: 0, index: 0 } };
    for (let i = 0; i < 12; i++) p = enregistrerExamen(p, { date: `d${i}`, niveau: 'PSE1', score: i, total: 40 });
    expect(p.examens).toHaveLength(10);
    expect(p.examens[0]!.date).toBe('d2');
    expect(p.examens[9]!.date).toBe('d11');
    expect(p.examenEnCours).toBeNull();
  });

  it('enregistrerCas garde le dernier et le meilleur score', () => {
    const p1 = enregistrerCas(p0, 'c', 3, 4);
    const p2 = enregistrerCas(p1, 'c', 1, 4);
    expect(p2.cas.c).toEqual({ dernier: 1, meilleur: 3, total: 4 });
  });

  it('ne modifie jamais l’état reçu', () => {
    marquerLue(p0, 'a');
    expect(p0.lues).toEqual([]);
  });
});

describe('purger', () => {
  it('retire les références vers du contenu non publié', () => {
    const p: Progression = {
      ...p0,
      lues: ['securite', 'disparue'],
      favoris: ['disparue'],
      erreurs: ['securite/q1', 'disparue/q1'],
      cas: { chute: { dernier: 1, meilleur: 1, total: 3 }, ancien: { dernier: 0, meilleur: 0, total: 2 } },
    };
    const r = purger(p, contenuTest());
    expect(r.lues).toEqual(['securite']);
    expect(r.favoris).toEqual([]);
    expect(r.erreurs).toEqual(['securite/q1']);
    expect(Object.keys(r.cas)).toEqual(['chute']);
  });
});

describe('migrer', () => {
  it('accepte une progression version 1 et complète les champs manquants', () => {
    expect(migrer({ version: 1, lues: ['a'] })).toEqual({ ...p0, lues: ['a'] });
  });

  it('écarte les valeurs mal formées sans tout perdre', () => {
    const r = migrer({ version: 1, lues: ['a', 3, null], favoris: 'x', cas: { c: { dernier: 1, meilleur: 2, total: 3 }, d: 'x' } });
    expect(r).toMatchObject({ lues: ['a'], favoris: [], cas: { c: { dernier: 1, meilleur: 2, total: 3 } } });
  });

  it('écarte un examen en cours mal formé', () => {
    expect(migrer({ version: 1, examenEnCours: { niveau: 'PSE9' } })!.examenEnCours).toBeNull();
  });

  it('conserve un examen en cours valide', () => {
    const ex = { niveau: 'PSE1', questions: [{ questionId: 'a/q1', ordre: [1, 0] }], reponses: [null], debut: '2026-09-28T10:00:00.000Z', dureeMs: 60000, index: 0 };
    expect(migrer({ version: 1, examenEnCours: ex })!.examenEnCours).toEqual(ex);
  });

  it('renvoie null pour une donnée illisible ou d’une version inconnue', () => {
    expect(migrer('texte')).toBeNull();
    expect(migrer(null)).toBeNull();
    expect(migrer({ version: 99 })).toBeNull();
  });
});
