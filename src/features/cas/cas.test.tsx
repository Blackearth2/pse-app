import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { progressionEnregistree, rendreApp } from '../../test/rendu';

const ORDRE_CORRECT = ['Protéger', 'Examiner', 'Alerter'];

function ordreAffiche(): string[] {
  return within(screen.getByRole('list', { name: 'Actions à ordonner' }))
    .getAllByRole('listitem')
    .map((li) => ORDRE_CORRECT.find((t) => li.textContent!.includes(t))!);
}

describe('Cas pratiques', () => {
  it('se joue de bout en bout avec les 3 types d’étapes', async () => {
    const { utilisateur } = rendreApp({ route: '/cas' });
    await utilisateur.click(screen.getByRole('link', { name: /Chute de vélo/ }));

    // Étape 1 : choix unique
    expect(screen.getByText('Un cycliste est tombé.')).toBeInTheDocument();
    await utilisateur.click(screen.getByRole('button', { name: 'Sécuriser la zone' }));
    expect(screen.getByRole('status')).toHaveTextContent('Bonne décision');
    await utilisateur.click(screen.getByRole('button', { name: 'Étape suivante' }));

    // Étape 2 : choix multiple, une bonne réponse oubliée
    await utilisateur.click(screen.getByRole('button', { name: 'Le bilan vital' }));
    await utilisateur.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByRole('status')).toHaveTextContent('À corriger');
    // toHaveTextContent normalise les espaces (dont l'espace fine) du texte affiché.
    expect(screen.getByRole('status')).toHaveTextContent(/Oublié.: L'heure de l'accident/);
    await utilisateur.click(screen.getByRole('button', { name: 'Étape suivante' }));

    // Étape 3 : remise en ordre avec les boutons ↑ / ↓
    expect(ordreAffiche()).not.toEqual(ORDRE_CORRECT);
    for (let garde = 0; garde < 10 && ordreAffiche().join() !== ORDRE_CORRECT.join(); garde++) {
      const actuel = ordreAffiche();
      const rang = actuel.findIndex((t, i) => t !== ORDRE_CORRECT[i]);
      const attendu = ORDRE_CORRECT[rang]!;
      await utilisateur.click(screen.getByRole('button', { name: `Monter « ${attendu} »` }));
    }
    expect(ordreAffiche()).toEqual(ORDRE_CORRECT);
    await utilisateur.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByRole('status')).toHaveTextContent('Bonne décision');
    await utilisateur.click(screen.getByRole('button', { name: 'Voir le débriefing' }));

    // Débriefing
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2/3');
    expect(screen.getByRole('region', { name: 'Points clés' })).toHaveTextContent('Sécuriser avant tout.');
    expect(progressionEnregistree().cas.chute).toEqual({ dernier: 2, meilleur: 2, total: 3 });

    await utilisateur.click(screen.getByRole('button', { name: 'Autres cas' }));
    expect(screen.getByRole('link', { name: /Chute de vélo/ })).toHaveTextContent('Fait · 2/3');
  });
});
