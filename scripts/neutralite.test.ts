import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { scannerNeutralite, trouverMotifsInterdits } from './neutralite';

describe('trouverMotifsInterdits', () => {
  it.each([
    'Formé à la Croix-Rouge',
    'la croix rouge française',
    'CROIX–ROUGE', // tiret demi-cadratin
    'Red Cross training',
    'le CRF organise',
    'la Cróix-Rôuge', // accents parasites
  ])('détecte : %s', (texte) => {
    expect(trouverMotifsInterdits(texte)).not.toEqual([]);
  });

  it.each(['Aucune forme de croix', 'rouge vif', 'secours croisés', 'CRFX', 'des mots crf1'])('ignore : %s', (texte) => {
    expect(trouverMotifsInterdits(texte)).toEqual([]);
  });
});

describe('scannerNeutralite', () => {
  let racine = '';
  afterEach(() => rmSync(racine, { recursive: true, force: true }));

  it('signale fichier et ligne, ignore les dossiers non ciblés et les fichiers exclus', () => {
    racine = mkdtempSync(join(tmpdir(), 'neutralite-'));
    mkdirSync(join(racine, 'content', 'fiches'), { recursive: true });
    mkdirSync(join(racine, 'scripts'));
    mkdirSync(join(racine, 'node_modules'));
    writeFileSync(join(racine, 'content', 'fiches', 'a.yaml'), 'titre: ok\nsource: Croix-Rouge\n');
    writeFileSync(join(racine, 'index.html'), '<title>Red Cross</title>');
    writeFileSync(join(racine, 'content', 'image.png'), 'croix rouge'); // binaire : ignoré
    writeFileSync(join(racine, 'scripts', 'neutralite.ts'), 'croix rouge'); // exclu
    writeFileSync(join(racine, 'node_modules', 'x.js'), 'croix rouge'); // hors cible

    const r = scannerNeutralite(racine);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatch(/^content\/fiches\/a\.yaml:2 /);
    expect(r[1]).toMatch(/^index\.html:1 /);
  });
});
