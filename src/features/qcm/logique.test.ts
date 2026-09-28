import { describe, expect, it } from 'vitest';
import { creerAleatoire } from '../../lib/hasard';
import { contenuTest, fiche } from '../../test/fabriques';
import { estCorrect, majErreurs, purgerIds, questionsDuPerimetre, reponseOriginale, tirerSerie } from './logique';

const { fiches } = contenuTest();

describe('estCorrect', () => {
  it('choix unique : juste seulement avec la bonne proposition', () => {
    expect(estCorrect([1], [1])).toBe(true);
    expect(estCorrect([1], [0])).toBe(false);
  });

  it("choix multiple : l'ensemble coché doit être exactement celui des bonnes réponses", () => {
    expect(estCorrect([0, 2], [2, 0])).toBe(true);
    expect(estCorrect([0, 2], [0])).toBe(false);
    expect(estCorrect([0, 2], [0, 1, 2])).toBe(false);
    expect(estCorrect([0, 2], [])).toBe(false);
  });
});

describe('reponseOriginale', () => {
  it('convertit les positions affichées en indices de propositions', () => {
    // affichage : [prop 2, prop 0, prop 1]
    expect(reponseOriginale([2, 0, 1], [0, 2])).toEqual([2, 1]);
  });
});

describe('questionsDuPerimetre', () => {
  const ids = (p: Parameters<typeof questionsDuPerimetre>[1]) => questionsDuPerimetre(fiches, p).map((q) => q.id);

  it('tout le programme', () => {
    expect(ids({ type: 'tout' })).toHaveLength(9);
  });
  it('par niveau', () => {
    expect(ids({ type: 'niveau', niveau: 'PSE2' })).toEqual(['rachis/q1']);
    expect(ids({ type: 'niveau', niveau: 'PSE1' })).toHaveLength(8);
  });
  it('par chapitre', () => {
    expect(ids({ type: 'chapitre', chapitre: 'generalites' })).toEqual(['securite/q1', 'securite/q2']);
  });
  it('nouveautés 2026 : questions marquées nouveauté', () => {
    expect(ids({ type: 'nouveautes' })).toEqual(['hemorragies/q1']);
  });
  it('une fiche', () => {
    expect(ids({ type: 'fiche', fiche: 'arret-cardiaque' })).toEqual(['arret-cardiaque/q1', 'arret-cardiaque/q2', 'arret-cardiaque/q3']);
  });
  it('liste explicite (mes erreurs)', () => {
    expect(ids({ type: 'ids', ids: ['rachis/q1', 'inconnue/q9'] })).toEqual(['rachis/q1']);
  });
});

describe('tirerSerie', () => {
  const questions = questionsDuPerimetre(fiches, { type: 'tout' });

  it('tire 10 questions distinctes au plus, avec un ordre de propositions pour chacune', () => {
    const grand = questionsDuPerimetre(
      [fiche('x', { nbQuestions: 15 })],
      { type: 'tout' },
    );
    const serie = tirerSerie(grand, creerAleatoire(1));
    expect(serie).toHaveLength(10);
    expect(new Set(serie.map((q) => q.questionId)).size).toBe(10);
    for (const q of serie) expect([...q.ordre].sort()).toEqual([0, 1, 2]);
  });

  it('prend toutes les questions si le périmètre en contient moins de 10', () => {
    expect(tirerSerie(questions, creerAleatoire(2))).toHaveLength(9);
  });

  it('respecte une taille demandée', () => {
    expect(tirerSerie(questions, creerAleatoire(3), 4)).toHaveLength(4);
  });
});

describe('majErreurs', () => {
  it('ajoute une question ratée, quel que soit le mode, sans doublon', () => {
    expect(majErreurs([], 'a/q1', false, 'entrainement')).toEqual(['a/q1']);
    expect(majErreurs(['a/q1'], 'a/q1', false, 'examen')).toEqual(['a/q1']);
    expect(majErreurs(['a/q1'], 'a/q1', false, 'erreurs')).toEqual(['a/q1']);
  });

  it('retire une question réussie seulement en mode « mes erreurs »', () => {
    expect(majErreurs(['a/q1', 'b/q2'], 'a/q1', true, 'erreurs')).toEqual(['b/q2']);
    expect(majErreurs(['a/q1'], 'a/q1', true, 'entrainement')).toEqual(['a/q1']);
    expect(majErreurs(['a/q1'], 'a/q1', true, 'examen')).toEqual(['a/q1']);
  });
});

describe('purgerIds', () => {
  it('retire les identifiants qui ne sont plus publiés', () => {
    expect(purgerIds(['a', 'b', 'c'], new Set(['a', 'c']))).toEqual(['a', 'c']);
  });
});
