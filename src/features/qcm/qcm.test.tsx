import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Question } from '../../content/types';
import { contenuTest } from '../../test/fabriques';
import { progressionEnregistree, rendreApp } from '../../test/rendu';

const QUESTIONS = new Map(contenuTest().fiches.flatMap((f) => f.questions).map((q) => [q.enonce, q]));

/** Répond à la question affichée, juste ou faux, quel que soit l'ordre de mélange. */
async function repondre(u: UserEvent, juste: boolean): Promise<Question> {
  const q = QUESTIONS.get(screen.getByRole('heading', { level: 1 }).textContent!)!;
  const cibles = juste ? q.bonnes : [q.propositions.findIndex((_, i) => !q.bonnes.includes(i))];
  for (const i of cibles) await u.click(screen.getByRole('button', { name: q.propositions[i] }));
  if (q.bonnes.length > 1) await u.click(screen.getByRole('button', { name: 'Valider' }));
  return q;
}

describe('QCM — entraînement', () => {
  it('déroule une série sur une fiche, avec correction, score et erreurs enregistrées', async () => {
    const { utilisateur } = rendreApp({ route: '/fiches/hemorragies' });
    await utilisateur.click(screen.getByRole('button', { name: 'Tester cette fiche (3 questions)' }));

    const ratees: string[] = [];
    for (let n = 1; n <= 3; n++) {
      expect(screen.getByText(`${n} / 3`)).toBeInTheDocument();
      const q = QUESTIONS.get(screen.getByRole('heading', { level: 1 }).textContent!)!;
      const juste = q.id !== 'hemorragies/q3';
      await repondre(utilisateur, juste);
      expect(screen.getByRole('status')).toHaveTextContent(juste ? 'Bonne réponse' : 'Ce n’est pas ça');
      expect(screen.getByRole('status')).toHaveTextContent(q.explication);
      if (!juste) ratees.push(q.id);
      await utilisateur.click(screen.getByRole('button', { name: n < 3 ? 'Question suivante' : 'Voir mon score' }));
    }

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('2/3');
    expect(screen.getByRole('region', { name: 'À revoir' })).toHaveTextContent('Question 3 de hemorragies ?');
    expect(progressionEnregistree().erreurs).toEqual(ratees);
  });

  it('une question à choix multiple exige toutes les bonnes réponses', async () => {
    const { utilisateur } = rendreApp({ route: '/fiches/hemorragies' });
    await utilisateur.click(screen.getByRole('button', { name: /Tester cette fiche/ }));
    // Avance jusqu'à la question multiple.
    while (screen.getByRole('heading', { level: 1 }).textContent !== 'Quels garrots sont admis ?') {
      await repondre(utilisateur, true);
      await utilisateur.click(screen.getByRole('button', { name: 'Question suivante' }));
    }
    expect(screen.getByText('Plusieurs réponses possibles.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
    await utilisateur.click(screen.getByRole('button', { name: 'Garrot industriel' }));
    expect(screen.getByRole('button', { name: 'Garrot industriel' })).toHaveAttribute('aria-pressed', 'true');
    await utilisateur.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByRole('status')).toHaveTextContent('Ce n’est pas ça');
    expect(screen.getByRole('button', { name: /Garrot pneumatique/ })).toHaveTextContent('Bonne réponse');
  });

  it('« Mes erreurs » retire une question réussie', async () => {
    const { utilisateur } = rendreApp({ route: '/qcm', progression: { erreurs: ['rachis/q1'] } });
    await utilisateur.click(screen.getByRole('link', { name: /Mes erreurs \(1\)/ }));
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    await repondre(utilisateur, true);
    expect(progressionEnregistree().erreurs).toEqual([]);
    await utilisateur.click(screen.getByRole('button', { name: 'Voir mon score' }));
    await utilisateur.click(screen.getByRole('button', { name: 'Nouvelle série' }));
    expect(screen.getByText(/Aucune erreur à retravailler/)).toBeInTheDocument();
  });

  it('lance une série sur un niveau depuis l’écran QCM', async () => {
    const { utilisateur } = rendreApp({ route: '/qcm' });
    await utilisateur.click(screen.getByRole('radio', { name: /^PSE2/ }));
    await utilisateur.click(screen.getByRole('button', { name: 'Commencer (1 question)' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Question 1 de rachis ?');
  });
});
