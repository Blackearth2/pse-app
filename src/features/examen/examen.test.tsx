import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { creerAleatoire } from '../../lib/hasard';
import { contenuTest } from '../../test/fabriques';
import { progressionEnregistree, rendreApp } from '../../test/rendu';
import { creerExamen } from './logique';

describe('Examen blanc', () => {
  it('se lance, se rend après confirmation et enregistre le résultat et les erreurs', async () => {
    const { utilisateur } = rendreApp({ route: '/examen' });
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer l’examen (8 questions, 8 min)' }));

    expect(screen.getByText('1 / 8')).toBeInTheDocument();
    expect(screen.getByRole('timer', { name: 'Temps restant' })).toHaveTextContent(/0[78]:\d\d/);
    expect(progressionEnregistree().examenEnCours?.questions).toHaveLength(8);

    // Répond à la première question, puis navigue.
    const premiere = within(screen.getByRole('list', { name: 'Propositions' })).getAllByRole('button')[0]!;
    await utilisateur.click(premiere);
    expect(premiere).toHaveAttribute('aria-pressed', 'true');
    expect(progressionEnregistree().examenEnCours?.reponses[0]).toEqual([0]);
    await utilisateur.click(screen.getByRole('button', { name: 'Suivante →' }));
    expect(screen.getByText('2 / 8')).toBeInTheDocument();

    await utilisateur.click(screen.getByRole('button', { name: 'Rendre la copie' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('7 questions sans réponse');
    await utilisateur.click(screen.getByRole('button', { name: 'Rendre' }));

    expect(screen.getByRole('region', { name: 'Détail par chapitre' })).toHaveTextContent('Généralités');
    const p = progressionEnregistree();
    expect(p.examenEnCours).toBeNull();
    expect(p.examens).toHaveLength(1);
    expect(p.examens[0]).toMatchObject({ niveau: 'PSE1', total: 8 });
    expect(p.erreurs.length).toBe(8 - p.examens[0]!.score);
  });

  it('reprend un examen en cours là où il s’était arrêté', () => {
    const ex = creerExamen(contenuTest().fiches, 'PSE1', creerAleatoire(1), new Date());
    rendreApp({ route: '/examen', progression: { examenEnCours: { ...ex, index: 3 } } });
    expect(screen.getByText('4 / 8')).toBeInTheDocument();
  });

  it('est rendu automatiquement si le temps a expiré pendant que l’app était fermée', async () => {
    const ex = creerExamen(contenuTest().fiches, 'PSE1', creerAleatoire(1), new Date('2026-01-01T10:00:00Z'));
    rendreApp({ route: '/examen', progression: { examenEnCours: ex } });
    expect(await screen.findByRole('region', { name: 'Détail par chapitre' })).toBeInTheDocument();
    expect(progressionEnregistree().examens).toHaveLength(1);
  });
});
