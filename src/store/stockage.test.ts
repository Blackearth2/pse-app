import { describe, expect, it } from 'vitest';
import { PROGRESSION_VIDE } from './progression';
import { CLE, CLE_CORROMPU, creerStockage } from './stockage';

class StockageMemoire implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  donnees = new Map<string, string>();
  getItem(k: string) {
    return this.donnees.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.donnees.set(k, v);
  }
  removeItem(k: string) {
    this.donnees.delete(k);
  }
}

describe('creerStockage', () => {
  it('lit une progression vide au premier lancement', () => {
    const s = creerStockage(new StockageMemoire());
    expect(s.lire()).toEqual({ progression: PROGRESSION_VIDE, disponible: true });
  });

  it('écrit puis relit la progression', () => {
    const m = new StockageMemoire();
    const s = creerStockage(m);
    expect(s.ecrire({ ...PROGRESSION_VIDE, lues: ['a'] })).toBe(true);
    expect(creerStockage(m).lire().progression.lues).toEqual(['a']);
  });

  it('repart de zéro sur un JSON illisible et conserve la valeur brute', () => {
    const m = new StockageMemoire();
    m.setItem(CLE, '{pas du json');
    expect(creerStockage(m).lire()).toEqual({ progression: PROGRESSION_VIDE, disponible: true });
    expect(m.getItem(CLE_CORROMPU)).toBe('{pas du json');
  });

  it('repart de zéro sur une version inconnue et conserve la valeur brute', () => {
    const m = new StockageMemoire();
    m.setItem(CLE, '{"version":99}');
    expect(creerStockage(m).lire().progression).toEqual(PROGRESSION_VIDE);
    expect(m.getItem(CLE_CORROMPU)).toBe('{"version":99}');
  });

  it('signale un stockage indisponible (navigation privée, accès refusé)', () => {
    const hostile = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => undefined,
    };
    const s = creerStockage(hostile);
    expect(s.lire()).toEqual({ progression: PROGRESSION_VIDE, disponible: false });
    expect(s.ecrire(PROGRESSION_VIDE)).toBe(false);
  });

  it('signale un stockage plein à l’écriture', () => {
    const plein = new StockageMemoire();
    plein.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(creerStockage(plein).ecrire(PROGRESSION_VIDE)).toBe(false);
  });

  it('fonctionne sans aucun stockage', () => {
    expect(creerStockage(null).lire().disponible).toBe(false);
  });
});
