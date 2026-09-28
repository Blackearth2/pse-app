import { describe, expect, it, vi } from 'vitest';
import { contenuTest } from '../test/fabriques';
import { MagasinProgression } from './magasin';
import { PROGRESSION_VIDE, marquerLue, type Progression } from './progression';
import type { Stockage } from './stockage';

function stockageFactice(initiale: Progression = PROGRESSION_VIDE, disponible = true) {
  const ecrits: Progression[] = [];
  let reussite = disponible;
  const s: Stockage & { ecrits: Progression[]; echouer(): void } = {
    ecrits,
    lire: () => ({ progression: initiale, disponible }),
    ecrire: (p) => {
      ecrits.push(p);
      return reussite;
    },
    echouer: () => {
      reussite = false;
    },
  };
  return s;
}

describe('MagasinProgression', () => {
  it('purge au chargement les références vers du contenu disparu', () => {
    const m = new MagasinProgression(stockageFactice({ ...PROGRESSION_VIDE, lues: ['securite', 'disparue'] }), contenuTest());
    expect(m.lire().progression.lues).toEqual(['securite']);
  });

  it('écrit à chaque modification et prévient les abonnés', () => {
    const s = stockageFactice();
    const m = new MagasinProgression(s, contenuTest());
    const abonne = vi.fn();
    m.abonner(abonne);
    m.modifier((p) => marquerLue(p, 'securite'));
    expect(s.ecrits.at(-1)!.lues).toEqual(['securite']);
    expect(m.lire().progression.lues).toEqual(['securite']);
    expect(abonne).toHaveBeenCalledOnce();
  });

  it('passe en « indisponible » si une écriture échoue, sans perdre l’état en mémoire', () => {
    const s = stockageFactice();
    const m = new MagasinProgression(s, contenuTest());
    s.echouer();
    m.modifier((p) => marquerLue(p, 'securite'));
    expect(m.lire()).toMatchObject({ disponible: false, progression: { lues: ['securite'] } });
  });

  it("ignore une modification qui ne change rien", () => {
    const s = stockageFactice();
    const m = new MagasinProgression(s, contenuTest());
    m.modifier((p) => p);
    expect(s.ecrits).toEqual([]);
  });

  it('le désabonnement fonctionne', () => {
    const m = new MagasinProgression(stockageFactice(), contenuTest());
    const abonne = vi.fn();
    const desabonner = m.abonner(abonne);
    desabonner();
    m.modifier((p) => marquerLue(p, 'securite'));
    expect(abonne).not.toHaveBeenCalled();
  });
});
