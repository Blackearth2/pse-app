import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { lireDossierContenu } from './charger';
import { compilerContenu } from './compiler';

const FICHE = `id: hemorragies
niveau: PSE1
chapitre: urgences-vitales
type: procedure
ordre: 1
titre: Hémorragies externes
statut: STATUT
source: { document: Recommandations PSE, code: PR-01 }
blocs:
  - type: liste
    items: [Comprimer]
`;

let racine = '';
beforeEach(() => {
  racine = mkdtempSync(join(tmpdir(), 'contenu-'));
  mkdirSync(join(racine, 'fiches', 'urgences-vitales'), { recursive: true });
  writeFileSync(join(racine, 'chapitres.yaml'), '- { id: urgences-vitales, titre: Urgences vitales }\n');
});
afterEach(() => rmSync(racine, { recursive: true, force: true }));

function ecrireFiche(statut: string, extra = '') {
  writeFileSync(join(racine, 'fiches', 'urgences-vitales', 'hemorragies.yaml'), FICHE.replace('STATUT', statut) + extra);
}

describe('lireDossierContenu', () => {
  it('lit récursivement avec des chemins relatifs en « / » et ignore les fichiers cachés', () => {
    ecrireFiche('verifie');
    writeFileSync(join(racine, '.DS_Store'), 'x');
    expect(lireDossierContenu(racine).map((f) => f.chemin)).toEqual(['chapitres.yaml', 'fiches/urgences-vitales/hemorragies.yaml']);
  });
});

describe('compilerContenu', () => {
  it('inclut les brouillons en développement', () => {
    ecrireFiche('brouillon');
    const r = compilerContenu(racine, true, new Date('2026-09-28T10:00:00Z'));
    expect(r.erreurs).toEqual([]);
    expect(r.contenu?.fiches).toHaveLength(1);
    expect(r.contenu?.meta).toEqual({ genereLe: '2026-09-28T10:00:00.000Z', avecBrouillons: true });
  });

  it('applique la typographie française au texte, pas aux identifiants', () => {
    ecrireFiche('brouillon');
    const f = compilerContenu(racine, true).contenu!.fiches[0]!;
    expect(f.id).toBe('hemorragies');
    expect(f.source.document).toBe('Recommandations PSE');
    writeFileSync(join(racine, 'fiches', 'urgences-vitales', 'hemorragies.yaml'), FICHE.replace('STATUT', 'brouillon').replace('titre: Hémorragies externes', 'titre: "Hémorragies : bases"'));
    expect(compilerContenu(racine, true).contenu!.fiches[0]!.titre).toBe('Hémorragies\u202f: bases');
  });

  it('exclut les brouillons en production', () => {
    ecrireFiche('brouillon');
    expect(compilerContenu(racine, false).contenu?.fiches).toEqual([]);
  });

  it('bloque un contenu contenant un terme interdit', () => {
    // Terme assemblé à l'exécution : ce fichier lui-même doit rester neutre.
    ecrireFiche('verifie', `motsCles: [${['red', 'cross'].join(' ')}]\n`);
    const r = compilerContenu(racine, true);
    expect(r.contenu).toBeNull();
    expect(r.erreurs.join('\n')).toContain('neutralité');
  });

  it('remonte les erreurs de validation', () => {
    ecrireFiche('inconnu');
    const r = compilerContenu(racine, true);
    expect(r.contenu).toBeNull();
    expect(r.erreurs.join('\n')).toContain('statut');
  });
});
