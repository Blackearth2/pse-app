// Contrôle de neutralité (§ 12 de la spec) : aucun nom d'association dans le projet.
// Ce fichier et son test sont les seuls autorisés à contenir les motifs ; ils sont exclus du contrôle.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

/** Motifs interdits, testés sur un texte en minuscules et sans accents. */
export const MOTIFS_INTERDITS: RegExp[] = [/croix[\s\-‐-―]*rouge/, /red[\s\-‐-―]*cross/, /\bcrf\b/];

/** Fichiers et dossiers contrôlés, relatifs à la racine du projet. */
export const CIBLES = ['content', 'src', 'public', 'docs', 'scripts', '.github', 'index.html', 'README.md'];

/** Fichiers exclus (ils définissent et testent les motifs). */
export const EXCLUS = ['scripts/neutralite.ts', 'scripts/neutralite.test.ts'];

const EXTENSIONS_TEXTE = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.yaml', '.yml', '.md', '.html', '.css', '.svg', '.txt', '.webmanifest',
]);

function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Renvoie les extraits correspondant à un motif interdit (liste vide si le texte est neutre). */
export function trouverMotifsInterdits(texte: string): string[] {
  const t = normaliser(texte);
  const trouves: string[] = [];
  for (const motif of MOTIFS_INTERDITS) {
    const m = new RegExp(motif.source, 'g');
    for (const r of t.matchAll(m)) trouves.push(r[0]);
  }
  return trouves;
}

function fichiersTexte(chemin: string): string[] {
  if (!existsSync(chemin)) return [];
  if (statSync(chemin).isFile()) return EXTENSIONS_TEXTE.has(extname(chemin).toLowerCase()) ? [chemin] : [];
  return readdirSync(chemin).flatMap((nom) => fichiersTexte(join(chemin, nom)));
}

/** Parcourt les cibles et renvoie une ligne « chemin:ligne « extrait » » par occurrence trouvée. */
export function scannerNeutralite(racine: string): string[] {
  const resultats: string[] = [];
  for (const cible of CIBLES) {
    for (const fichier of fichiersTexte(join(racine, cible))) {
      const rel = relative(racine, fichier).split(sep).join('/');
      if (EXCLUS.includes(rel)) continue;
      readFileSync(fichier, 'utf8')
        .split('\n')
        .forEach((ligne, i) => {
          for (const extrait of trouverMotifsInterdits(ligne)) resultats.push(`${rel}:${i + 1} « ${extrait} »`);
        });
    }
  }
  return resultats;
}
