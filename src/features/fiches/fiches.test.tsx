import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { creerStockage } from '../../store/stockage';
import { progressionEnregistree, rendreApp } from '../../test/rendu';

describe('Fiches', () => {
  it('recherche une fiche sans accents, l’ouvre et la marque comme lue', async () => {
    const { utilisateur } = rendreApp({ route: '/fiches' });
    await utilisateur.type(screen.getByRole('searchbox', { name: 'Rechercher une fiche' }), 'hemorragie');
    expect(screen.getByRole('status')).toHaveTextContent('1 fiche');
    await utilisateur.click(screen.getByRole('link', { name: /Hémorragies externes/ }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Hémorragies externes' })).toBeInTheDocument();
    expect(screen.getByText('Introduction du packing.')).toBeInTheDocument();
    expect(screen.getByText(/Source : Recommandations PSE, fiche PR-00, p\./)).toBeInTheDocument();
    expect(progressionEnregistree().lues).toEqual(['hemorragies']);
  });

  it('ajoute puis retire une fiche des favoris', async () => {
    const { utilisateur } = rendreApp({ route: '/fiches/rachis' });
    await utilisateur.click(screen.getByRole('button', { name: 'Ajouter aux favoris' }));
    expect(screen.getByRole('button', { name: 'Retirer des favoris' })).toHaveAttribute('aria-pressed', 'true');
    expect(progressionEnregistree().favoris).toEqual(['rachis']);
    await utilisateur.click(screen.getByRole('button', { name: 'Retirer des favoris' }));
    expect(progressionEnregistree().favoris).toEqual([]);
  });

  it('filtre par niveau et regroupe par chapitre', async () => {
    const { utilisateur } = rendreApp({ route: '/fiches' });
    expect(screen.getByRole('status')).toHaveTextContent('4 fiches');
    await utilisateur.click(screen.getByRole('button', { name: 'PSE2' }));
    expect(screen.getByRole('status')).toHaveTextContent('1 fiche');
    const chapitre = screen.getByText('Urgences vitales').closest('details')!;
    expect(within(chapitre).getByRole('link', { name: /Traumatisme du rachis/ })).toBeVisible();
    expect(screen.queryByText('Généralités')).not.toBeInTheDocument();
  });

  it('ouvre la liste filtrée sur les nouveautés depuis l’accueil', async () => {
    const { utilisateur } = rendreApp();
    await utilisateur.click(screen.getByRole('link', { name: /Ce qui change en 2026/ }));
    expect(screen.getByRole('button', { name: 'Nouveautés 2026' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('1 fiche');
  });

  it('navigue vers la fiche suivante du chapitre', async () => {
    const { utilisateur } = rendreApp({ route: '/fiches/hemorragies' });
    await utilisateur.click(screen.getByRole('link', { name: 'Suivante →' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Arrêt cardiaque' })).toBeInTheDocument();
  });

  it('affiche « Introuvable » pour une fiche inconnue', () => {
    rendreApp({ route: '/fiches/inexistante' });
    expect(screen.getByRole('heading', { name: 'Introuvable' })).toBeInTheDocument();
  });
});

describe('Accueil', () => {
  it('prévient quand le stockage est indisponible', () => {
    rendreApp({ stockage: creerStockage(null) });
    expect(screen.getByText(/Ta progression ne sera pas conservée/)).toBeInTheDocument();
  });

  it('propose de reprendre des fiches et affiche la progression', () => {
    rendreApp({ progression: { lues: ['securite'], favoris: ['rachis'] } });
    const reprendre = screen.getByRole('region', { name: 'Reprendre' });
    expect(within(reprendre).getAllByRole('link').map((l) => l.textContent)).toEqual([
      'PSE2Traumatisme du rachis',
      'PSE1Hémorragies externes',
      'PSE1Arrêt cardiaque',
    ]);
    expect(screen.getByRole('region', { name: 'Ta progression' })).toHaveTextContent('1/4fiches lues');
  });

  it('réinitialise la progression après confirmation', async () => {
    const { utilisateur } = rendreApp({ route: '/a-propos', progression: { lues: ['securite'] } });
    await utilisateur.click(screen.getByRole('button', { name: 'Réinitialiser ma progression' }));
    await utilisateur.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(progressionEnregistree().lues).toEqual([]);
    expect(screen.getByText('Progression réinitialisée.')).toBeInTheDocument();
  });
});
