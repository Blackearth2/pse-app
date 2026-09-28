import { describe, expect, it } from 'vitest';
import { creerAleatoire } from '../../lib/hasard';
import { contenuTest, fiche } from '../../test/fabriques';
import { corrigerExamen, creerExamen, estExpire, repartir, tempsRestantMs } from './logique';

describe('repartir (méthode du plus fort reste)', () => {
  it('répartit proportionnellement et totalise exactement la cible', () => {
    // 50 / 30 / 20 questions, 40 à tirer -> 20 / 12 / 8
    expect(repartir([['a', 50], ['b', 30], ['c', 20]], 40)).toEqual(new Map([['a', 20], ['b', 12], ['c', 8]]));
  });

  it('attribue les places restantes aux plus forts restes', () => {
    // 6 / 3 / 1 questions, 7 à tirer : quotas 4,2 ; 2,1 ; 0,7 -> base 4+2+0 = 6, la place restante va à « c » (reste 0,7)
    expect(repartir([['a', 6], ['b', 3], ['c', 1]], 7)).toEqual(new Map([['a', 4], ['b', 2], ['c', 1]]));
    const r = repartir([['a', 7], ['b', 7], ['c', 7]], 10);
    expect([...r.values()].reduce((s, n) => s + n, 0)).toBe(10);
  });

  it('ne dépasse jamais le nombre de questions disponibles par chapitre', () => {
    const r = repartir([['a', 1], ['b', 100]], 40);
    expect(r.get('a')).toBeLessThanOrEqual(1);
    expect(r.get('a')! + r.get('b')!).toBe(40);
  });

  it('prend tout quand il y a moins de questions que la cible', () => {
    expect(repartir([['a', 3], ['b', 2]], 40)).toEqual(new Map([['a', 3], ['b', 2]]));
  });
});

describe('creerExamen', () => {
  const debut = new Date('2026-09-28T10:00:00Z');

  it('PSE1 : seulement les questions des fiches PSE1, 1 minute par question', () => {
    const ex = creerExamen(contenuTest().fiches, 'PSE1', creerAleatoire(1), debut);
    expect(ex.questions).toHaveLength(8);
    expect(ex.questions.some((q) => q.questionId.startsWith('rachis/'))).toBe(false);
    expect(ex.dureeMs).toBe(8 * 60_000);
    expect(ex.reponses).toEqual(Array(8).fill(null));
    expect(ex).toMatchObject({ niveau: 'PSE1', debut: debut.toISOString(), index: 0 });
  });

  it('PSE1+PSE2 : toutes les questions', () => {
    expect(creerExamen(contenuTest().fiches, 'PSE1+PSE2', creerAleatoire(1), debut).questions).toHaveLength(9);
  });

  it('plafonne à 40 questions réparties entre les chapitres', () => {
    const fiches = [
      fiche('a', { chapitre: 'c1', nbQuestions: 30 }),
      fiche('b', { chapitre: 'c2', nbQuestions: 30 }),
    ];
    const ex = creerExamen(fiches, 'PSE1', creerAleatoire(5), debut);
    expect(ex.questions).toHaveLength(40);
    expect(ex.questions.filter((q) => q.questionId.startsWith('a/'))).toHaveLength(20);
    expect(ex.dureeMs).toBe(40 * 60_000);
  });
});

describe('chronomètre', () => {
  const ex = creerExamen(contenuTest().fiches, 'PSE1', creerAleatoire(1), new Date('2026-09-28T10:00:00Z'));

  it('calcule le temps restant à partir de l’heure de début', () => {
    expect(tempsRestantMs(ex, new Date('2026-09-28T10:03:00Z'))).toBe(5 * 60_000);
    expect(estExpire(ex, new Date('2026-09-28T10:03:00Z'))).toBe(false);
  });

  it('expire même si l’app était fermée entre-temps', () => {
    expect(tempsRestantMs(ex, new Date('2026-09-29T08:00:00Z'))).toBe(0);
    expect(estExpire(ex, new Date('2026-09-29T08:00:00Z'))).toBe(true);
  });
});

describe('corrigerExamen', () => {
  const { fiches } = contenuTest();
  const ex = creerExamen(fiches, 'PSE1+PSE2', creerAleatoire(9), new Date('2026-09-28T10:00:00Z'));
  const parId = new Map(fiches.flatMap((f) => f.questions).map((q) => [q.id, q]));

  it('compte les bonnes réponses, le détail par chapitre et liste les erreurs', () => {
    // Répond juste partout (positions affichées des bonnes réponses), sauf à la première question.
    const reponses = ex.questions.map((qt): number[] | null => {
      const q = parId.get(qt.questionId)!;
      return q.bonnes.map((b) => qt.ordre.indexOf(b));
    });
    reponses[0] = null;
    const r = corrigerExamen({ ...ex, reponses }, fiches);

    expect(r.total).toBe(9);
    expect(r.score).toBe(8);
    expect(r.erreurs).toEqual([ex.questions[0]!.questionId]);
    const totalParChapitre = r.parChapitre.reduce((s, c) => s + c.total, 0);
    expect(totalParChapitre).toBe(9);
    expect(r.parChapitre.map((c) => c.chapitre)).toEqual(['generalites', 'urgences']);
  });

  it('ignore une question qui n’est plus publiée', () => {
    const r = corrigerExamen(ex, fiches.slice(0, 1));
    expect(r.total).toBe(2);
  });
});
