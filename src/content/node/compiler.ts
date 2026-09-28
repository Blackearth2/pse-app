// Chaîne complète : lecture → validation → neutralité → filtrage de publication.
import { trouverMotifsInterdits } from '../../../scripts/neutralite';
import { filtrerPublication } from '../publication';
import type { ContenuPublie } from '../types';
import { validerContenu } from '../validation';
import { lireDossierContenu } from './charger';

export interface ResultatCompilation {
  contenu: ContenuPublie | null;
  erreurs: string[];
  avertissements: string[];
}

export function compilerContenu(racineContenu: string, avecBrouillons: boolean, maintenant = new Date()): ResultatCompilation {
  const fichiers = lireDossierContenu(racineContenu);
  const { contenu, erreurs } = validerContenu(fichiers);

  for (const { chemin, texte } of fichiers) {
    for (const extrait of trouverMotifsInterdits(texte)) {
      erreurs.push(`${chemin} : terme interdit « ${extrait} » (contrôle de neutralité)`);
    }
  }
  if (!contenu || erreurs.length) return { contenu: null, erreurs, avertissements: [] };

  const pub = filtrerPublication(contenu, avecBrouillons);
  return {
    contenu: { ...pub.contenu, meta: { genereLe: maintenant.toISOString(), avecBrouillons } },
    erreurs: [],
    avertissements: pub.avertissements,
  };
}
