// Rendu de l'app complète pour les tests d'interface.
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import { Fournisseurs } from '../app/contextes';
import type { ContenuPublie } from '../content/types';
import { PROGRESSION_VIDE, type Progression } from '../store/progression';
import { CLE, creerStockage, type Stockage } from '../store/stockage';
import { contenuTest } from './fabriques';

export function rendreApp(
  options: { route?: string; contenu?: ContenuPublie; progression?: Partial<Progression>; stockage?: Stockage } = {},
) {
  window.location.hash = options.route ?? '/';
  if (options.progression) {
    localStorage.setItem(CLE, JSON.stringify({ ...PROGRESSION_VIDE, ...options.progression }));
  }
  const utilisateur = userEvent.setup();
  const rendu = render(
    <Fournisseurs contenu={options.contenu ?? contenuTest()} stockage={options.stockage ?? creerStockage(localStorage)}>
      <App />
    </Fournisseurs>,
  );
  return { ...rendu, utilisateur };
}

/** Progression actuellement enregistrée dans le stockage local. */
export function progressionEnregistree(): Progression {
  return JSON.parse(localStorage.getItem(CLE) ?? 'null') as Progression;
}
