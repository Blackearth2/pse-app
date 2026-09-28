import { describe, expect, it } from 'vitest';
import { filtrerPublication } from './publication';
import type { Cas, Contenu, Fiche, Statut } from './types';

function fiche(id: string, statut: Statut, liees: string[] = []): Fiche {
  return {
    id,
    niveau: 'PSE1',
    chapitre: 'c',
    type: 'procedure',
    ordre: 1,
    titre: id,
    motsCles: [],
    statut,
    source: { document: 'd', code: 'c' },
    liees,
    blocs: [{ type: 'liste', items: ['x'] }],
    questions: [
      { id: `${id}/q1`, ficheId: id, enonce: 'e', propositions: ['a', 'b'], bonnes: [0], explication: 'x', nouveaute: false },
    ],
    estNouveaute: false,
  };
}

function cas(id: string, statut: Statut, liees: string[]): Cas {
  return {
    id,
    niveau: 'PSE1',
    titre: id,
    lieu: 'l',
    statut,
    liees,
    contexte: 'c',
    etapes: [],
    pointsCles: ['p'],
  };
}

const contenu: Contenu = {
  chapitres: [{ id: 'c', titre: 'C' }],
  fiches: [fiche('ok', 'verifie', ['ok2', 'draft']), fiche('ok2', 'verifie'), fiche('draft', 'brouillon')],
  cas: [cas('cas-ok', 'verifie', ['ok']), cas('cas-lien-brouillon', 'verifie', ['ok', 'draft']), cas('cas-draft', 'brouillon', ['ok'])],
};

describe('filtrerPublication', () => {
  it('garde tout, brouillons compris, quand ils sont demandés', () => {
    const r = filtrerPublication(contenu, true);
    expect(r.contenu).toEqual(contenu);
    expect(r.avertissements).toEqual([]);
  });

  it('ne publie que les fiches vérifiées (et donc leurs seules questions)', () => {
    const r = filtrerPublication(contenu, false);
    expect(r.contenu.fiches.map((f) => f.id)).toEqual(['ok', 'ok2']);
  });

  it('masque les liens vers une fiche non publiée, avec un avertissement', () => {
    const r = filtrerPublication(contenu, false);
    expect(r.contenu.fiches[0]!.liees).toEqual(['ok2']);
    expect(r.avertissements.join('\n')).toMatch(/ok.*draft/);
  });

  it("exclut un cas non vérifié ou lié à une fiche non publiée, avec un avertissement", () => {
    const r = filtrerPublication(contenu, false);
    expect(r.contenu.cas.map((c) => c.id)).toEqual(['cas-ok']);
    expect(r.avertissements.join('\n')).toContain('cas-lien-brouillon');
  });

  it('ne modifie pas le contenu reçu', () => {
    filtrerPublication(contenu, false);
    expect(contenu.fiches[0]!.liees).toEqual(['ok2', 'draft']);
  });
});
