// Accès défensif au stockage local : toutes les erreurs sont absorbées (§ 8).
import { PROGRESSION_VIDE, migrer, type Progression } from './progression';

export const CLE = 'revision-pse';
export const CLE_CORROMPU = 'revision-pse:corrompu';
const CLE_TEST = 'revision-pse:test';

type StockageBrut = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface Stockage {
  lire(): { progression: Progression; disponible: boolean };
  /** `false` si l'écriture a échoué (stockage indisponible ou plein). */
  ecrire(p: Progression): boolean;
}

/** `localStorage` peut lever une exception au simple accès (navigation privée, cookies bloqués). */
export function stockageNavigateur(): StockageBrut | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function creerStockage(brut: StockageBrut | null): Stockage {
  return {
    lire() {
      if (!brut) return { progression: PROGRESSION_VIDE, disponible: false };
      let texte: string | null;
      try {
        brut.setItem(CLE_TEST, '1');
        brut.removeItem(CLE_TEST);
        texte = brut.getItem(CLE);
      } catch {
        return { progression: PROGRESSION_VIDE, disponible: false };
      }
      if (texte === null) return { progression: PROGRESSION_VIDE, disponible: true };

      let progression: Progression | null;
      try {
        progression = migrer(JSON.parse(texte));
      } catch {
        progression = null;
      }
      if (!progression) {
        try {
          brut.setItem(CLE_CORROMPU, texte);
        } catch {
          // tant pis : on repart de zéro quoi qu'il arrive
        }
        return { progression: PROGRESSION_VIDE, disponible: true };
      }
      return { progression, disponible: true };
    },
    ecrire(p) {
      if (!brut) return false;
      try {
        brut.setItem(CLE, JSON.stringify(p));
        return true;
      } catch {
        return false;
      }
    },
  };
}
