// Logique des fiches : recherche, filtres, fiches à reprendre (§ 7.1, 7.2).
import type { Fiche, Niveau } from '../../content/types';

export interface Filtres {
  niveau: Niveau | 'tous';
  nouveautes: boolean;
  favoris: boolean;
}

export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function texteDesBlocs(f: Fiche): string {
  return f.blocs
    .map((b) => {
      if (b.type === 'texte') return `${b.titre ?? ''} ${b.contenu}`;
      if (b.type === 'chiffres') return `${b.titre ?? ''} ${b.items.map((i) => `${i.valeur} ${i.libelle}`).join(' ')}`;
      return `${b.titre ?? ''} ${b.items.join(' ')}`;
    })
    .join(' ');
}

const index = new WeakMap<Fiche, { titre: string; motsCles: string; texte: string }>();
function champs(f: Fiche) {
  let c = index.get(f);
  if (!c) {
    c = { titre: normaliser(f.titre), motsCles: normaliser(f.motsCles.join(' ')), texte: normaliser(texteDesBlocs(f)) };
    index.set(f, c);
  }
  return c;
}

/** Tous les mots doivent être trouvés ; tri titre (3) > mots-clés (2) > texte (1), puis ordre du programme. */
export function rechercher(fiches: readonly Fiche[], requete: string): Fiche[] {
  const mots = normaliser(requete).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return [];
  const trouvees: { fiche: Fiche; score: number; rang: number }[] = [];
  fiches.forEach((fiche, rang) => {
    const c = champs(fiche);
    let score = 0;
    for (const mot of mots) {
      const poids = c.titre.includes(mot) ? 3 : c.motsCles.includes(mot) ? 2 : c.texte.includes(mot) ? 1 : 0;
      if (poids === 0) return;
      score += poids;
    }
    trouvees.push({ fiche, score, rang });
  });
  return trouvees.sort((a, b) => b.score - a.score || a.rang - b.rang).map((t) => t.fiche);
}

export function filtrerFiches(fiches: readonly Fiche[], filtres: Filtres, favoris: ReadonlySet<string>): Fiche[] {
  return fiches.filter(
    (f) =>
      (filtres.niveau === 'tous' || f.niveau === filtres.niveau) &&
      (!filtres.nouveautes || f.estNouveaute) &&
      (!filtres.favoris || favoris.has(f.id)),
  );
}

/** Jusqu'à 3 fiches : favorites non lues, puis non lues ; si tout est lu, les favorites. */
export function fichesAReprendre(fiches: readonly Fiche[], lues: ReadonlySet<string>, favoris: ReadonlySet<string>): Fiche[] {
  const nonLues = fiches.filter((f) => !lues.has(f.id));
  if (nonLues.length === 0) return fiches.filter((f) => favoris.has(f.id)).slice(0, 3);
  return [...nonLues.filter((f) => favoris.has(f.id)), ...nonLues.filter((f) => !favoris.has(f.id))].slice(0, 3);
}
