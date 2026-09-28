// Lecture du dossier `content/` sur le disque (côté Node uniquement).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { FichierSource } from '../validation';

/**
 * Renvoie tous les fichiers du dossier (sauf fichiers cachés), chemins relatifs en `/`.
 * Les fichiers non YAML sont renvoyés aussi : la validation les signale comme inattendus.
 */
export function lireDossierContenu(racine: string): FichierSource[] {
  if (!existsSync(racine)) return [];
  const resultats: FichierSource[] = [];
  const parcourir = (dossier: string) => {
    for (const nom of readdirSync(dossier).sort()) {
      if (nom.startsWith('.')) continue;
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else resultats.push({ chemin: relative(racine, chemin).split(sep).join('/'), texte: readFileSync(chemin, 'utf8') });
    }
  };
  parcourir(racine);
  return resultats;
}
