// Filtrage du contenu publié (§ 6.1) : en production, seul le contenu `verifie` est servi.
import type { Contenu } from './types';

export interface ResultatPublication {
  contenu: Contenu;
  avertissements: string[];
}

export function filtrerPublication(contenu: Contenu, avecBrouillons: boolean): ResultatPublication {
  if (avecBrouillons) return { contenu, avertissements: [] };

  const avertissements: string[] = [];
  const publiees = new Set(contenu.fiches.filter((f) => f.statut === 'verifie').map((f) => f.id));

  const fiches = contenu.fiches
    .filter((f) => publiees.has(f.id))
    .map((f) => {
      const masquees = f.liees.filter((l) => !publiees.has(l));
      for (const l of masquees) {
        avertissements.push(`fiche « ${f.id} » : lien vers « ${l} » masqué (fiche non publiée)`);
      }
      return masquees.length ? { ...f, liees: f.liees.filter((l) => publiees.has(l)) } : f;
    });

  const cas = contenu.cas.filter((c) => {
    if (c.statut !== 'verifie') return false;
    const manquantes = c.liees.filter((l) => !publiees.has(l));
    if (manquantes.length) {
      avertissements.push(`cas « ${c.id} » exclu : fiche(s) liée(s) non publiée(s) : ${manquantes.join(', ')}`);
      return false;
    }
    return true;
  });

  return { contenu: { chapitres: contenu.chapitres, fiches, cas }, avertissements };
}
