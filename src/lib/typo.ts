// Typographie française : espace fine insécable (U+202F) avant : ; ? ! » et après «.
// Prudente : ne touche ni aux heures (10:30), ni aux URL (https://…, ?a=1).
const FINE = '\u202f';
const ESPACES = '[ \\u00a0\\u202f]';

const AVANT_PONCTUATION = new RegExp(`${ESPACES}*([;?!])(?=$|[\\s»)\\]!?.,])`, 'g');
const AVANT_GUILLEMET_FERMANT = new RegExp(`${ESPACES}*»`, 'g');
const APRES_GUILLEMET_OUVRANT = new RegExp(`«${ESPACES}*`, 'g');
const DEUX_POINTS_ESPACES = new RegExp(`(\\S)${ESPACES}+:`, 'g');
const DEUX_POINTS_COLLES = /(\S)(?<![\d/]):(?=\s)/g;

export function typo(texte: string): string {
  return texte
    .replace(AVANT_PONCTUATION, `${FINE}$1`)
    .replace(AVANT_GUILLEMET_FERMANT, `${FINE}»`)
    .replace(APRES_GUILLEMET_OUVRANT, `«${FINE}`)
    .replace(DEUX_POINTS_ESPACES, `$1${FINE}:`)
    .replace(DEUX_POINTS_COLLES, `$1${FINE}:`);
}

/** Applique `typo` à toutes les chaînes d'une structure (valeurs uniquement, pas les clés). */
export function typographier<T>(valeur: T): T {
  if (typeof valeur === 'string') return typo(valeur) as T;
  if (Array.isArray(valeur)) return valeur.map((v) => typographier(v)) as T;
  if (typeof valeur === 'object' && valeur !== null) {
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, typographier(v)])) as T;
  }
  return valeur;
}
