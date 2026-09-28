// Magasin de progression, branché sur React via useSyncExternalStore.
import type { Contenu } from '../content/types';
import { purger, type Progression } from './progression';
import type { Stockage } from './stockage';

export interface EtatProgression {
  progression: Progression;
  /** Faux si le stockage local est indisponible : la progression ne vit qu'en mémoire. */
  disponible: boolean;
}

export class MagasinProgression {
  private etat: EtatProgression;
  private readonly abonnes = new Set<() => void>();
  private readonly stockage: Stockage;

  constructor(stockage: Stockage, contenu: Contenu) {
    this.stockage = stockage;
    const { progression, disponible } = stockage.lire();
    this.etat = { progression: purger(progression, contenu), disponible };
  }

  lire = (): EtatProgression => this.etat;

  abonner = (abonne: () => void): (() => void) => {
    this.abonnes.add(abonne);
    return () => this.abonnes.delete(abonne);
  };

  modifier = (transformation: (p: Progression) => Progression): void => {
    const suivante = transformation(this.etat.progression);
    if (suivante === this.etat.progression) return;
    const ecrit = this.stockage.ecrire(suivante);
    this.etat = { progression: suivante, disponible: ecrit };
    this.abonnes.forEach((a) => a());
  };
}
