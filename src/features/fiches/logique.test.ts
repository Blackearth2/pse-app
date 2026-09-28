import { describe, expect, it } from 'vitest';
import { contenuTest } from '../../test/fabriques';
import { filtrerFiches, fichesAReprendre, normaliser, rechercher } from './logique';

const { fiches } = contenuTest();
const ids = (liste: { id: string }[]) => liste.map((f) => f.id);

describe('normaliser', () => {
  it('retire accents et majuscules', () => {
    expect(normaliser('Hémorragie ÉPI Œdème')).toBe('hemorragie epi œdeme');
  });
});

describe('rechercher', () => {
  it('ignore accents et casse', () => {
    expect(ids(rechercher(fiches, 'HEMORRAGIES'))).toEqual(['hemorragies']);
  });

  it('cherche dans les mots-clés et le texte des blocs', () => {
    expect(ids(rechercher(fiches, 'garrot'))).toEqual(['hemorragies']);
    expect(ids(rechercher(fiches, 'packing'))).toEqual(['hemorragies']);
  });

  it('exige que tous les mots soient trouvés', () => {
    expect(ids(rechercher(fiches, 'saignement garrot'))).toEqual(['hemorragies']);
    expect(ids(rechercher(fiches, 'saignement rachis'))).toEqual([]);
  });

  it('classe titre > mots-clés > texte, puis ordre du programme', () => {
    // « arret » est dans le titre d'« arret-cardiaque » ; « texte » est dans le texte de plusieurs fiches.
    expect(ids(rechercher(fiches, 'arret'))[0]).toBe('arret-cardiaque');
    expect(ids(rechercher(fiches, 'texte'))).toEqual(['securite', 'arret-cardiaque', 'rachis']);
  });

  it('renvoie une liste vide pour une requête vide', () => {
    expect(rechercher(fiches, '   ')).toEqual([]);
  });
});

describe('filtrerFiches', () => {
  const vide = new Set<string>();
  it('par niveau', () => {
    expect(ids(filtrerFiches(fiches, { niveau: 'PSE2', nouveautes: false, favoris: false }, vide))).toEqual(['rachis']);
  });
  it('nouveautés et favoris se cumulent', () => {
    expect(ids(filtrerFiches(fiches, { niveau: 'tous', nouveautes: true, favoris: false }, vide))).toEqual(['hemorragies']);
    expect(ids(filtrerFiches(fiches, { niveau: 'tous', nouveautes: true, favoris: true }, new Set(['rachis'])))).toEqual([]);
    expect(ids(filtrerFiches(fiches, { niveau: 'tous', nouveautes: false, favoris: true }, new Set(['rachis'])))).toEqual(['rachis']);
  });
});

describe('fichesAReprendre', () => {
  it('favorites non lues d’abord, puis non lues dans l’ordre, 3 au plus', () => {
    const r = fichesAReprendre(fiches, new Set(['securite']), new Set(['rachis']));
    expect(ids(r)).toEqual(['rachis', 'hemorragies', 'arret-cardiaque']);
  });

  it('si tout est lu : les 3 premières favorites', () => {
    const toutes = new Set(ids(fiches));
    expect(ids(fichesAReprendre(fiches, toutes, new Set(['rachis', 'securite'])))).toEqual(['securite', 'rachis']);
  });

  it('rien à reprendre : liste vide', () => {
    expect(fichesAReprendre(fiches, new Set(ids(fiches)), new Set())).toEqual([]);
  });
});
