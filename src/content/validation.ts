// Validation complète du contenu : schémas (§ 5) puis vérifications croisées (§ 6.2).
// Module pur (sans accès disque) : utilisé par le plugin Vite, le script de contrôle et les tests.
import { parse } from 'yaml';
import type { z } from 'zod';
import { schemaCas, schemaChapitres, schemaFiche, type CasBrut, type ChapitreBrut, type FicheBrute } from './schema';
import type { Cas, Contenu, Fiche } from './types';

export interface FichierSource {
  /** Chemin relatif à `content/`, séparateurs `/`. */
  chemin: string;
  texte: string;
}

export interface ResultatValidation {
  /** `null` dès qu'il y a au moins une erreur. */
  contenu: Contenu | null;
  erreurs: string[];
}

const RE_FICHE = /^fiches\/([^/]+)\/([^/]+)\.yaml$/;
const RE_CAS = /^cas\/([^/]+)\.yaml$/;

function formaterIssues(chemin: string, erreur: z.ZodError): string[] {
  return erreur.issues.map((i) => {
    const ou = i.path.length ? ` › ${i.path.join('.')}` : '';
    return `${chemin}${ou} : ${i.message}`;
  });
}

interface Lu<T> {
  chemin: string;
  donnees: T;
}

export function validerContenu(fichiers: FichierSource[]): ResultatValidation {
  const erreurs: string[] = [];
  let chapitres: ChapitreBrut[] | null = null;
  const fiches: Lu<FicheBrute>[] = [];
  const cas: Lu<CasBrut>[] = [];

  // 1. Lecture YAML + schémas
  for (const { chemin, texte } of fichiers) {
    const estFiche = RE_FICHE.exec(chemin);
    const estCas = RE_CAS.exec(chemin);
    if (chemin !== 'chapitres.yaml' && !estFiche && !estCas) {
      erreurs.push(`${chemin} : fichier inattendu (attendu : chapitres.yaml, fiches/<chapitre>/<id>.yaml ou cas/<id>.yaml)`);
      continue;
    }
    let brut: unknown;
    try {
      brut = parse(texte);
    } catch (e) {
      erreurs.push(`${chemin} : YAML invalide (${e instanceof Error ? e.message.split('\n')[0] : String(e)})`);
      continue;
    }

    if (chemin === 'chapitres.yaml') {
      const r = schemaChapitres.safeParse(brut);
      if (r.success) chapitres = r.data;
      else erreurs.push(...formaterIssues(chemin, r.error));
    } else if (estFiche) {
      const [, dossier, nom] = estFiche;
      const r = schemaFiche.safeParse(brut);
      if (!r.success) {
        erreurs.push(...formaterIssues(chemin, r.error));
        continue;
      }
      if (r.data.chapitre !== dossier) {
        erreurs.push(`${chemin} : le dossier « ${dossier} » ne correspond pas au chapitre « ${r.data.chapitre} »`);
      }
      if (r.data.id !== nom) {
        erreurs.push(`${chemin} : le nom du fichier « ${nom} » ne correspond pas à l'identifiant « ${r.data.id} »`);
      }
      fiches.push({ chemin, donnees: r.data });
    } else if (estCas) {
      const [, nom] = estCas;
      const r = schemaCas.safeParse(brut);
      if (!r.success) {
        erreurs.push(...formaterIssues(chemin, r.error));
        continue;
      }
      if (r.data.id !== nom) {
        erreurs.push(`${chemin} : le nom du fichier « ${nom} » ne correspond pas à l'identifiant « ${r.data.id} »`);
      }
      cas.push({ chemin, donnees: r.data });
    }
  }

  if (!fichiers.some((f) => f.chemin === 'chapitres.yaml')) {
    erreurs.push('chapitres.yaml : fichier manquant');
  }

  // 2. Vérifications croisées
  const idsChapitres = new Set((chapitres ?? []).map((c) => c.id));
  const idsFiches = new Set<string>();
  const ordres = new Map<string, number>(); // "chapitre#ordre" -> nb

  for (const { chemin, donnees: f } of fiches) {
    if (idsFiches.has(f.id)) erreurs.push(`${chemin} : fiche « ${f.id} » en double`);
    idsFiches.add(f.id);
    if (chapitres && !idsChapitres.has(f.chapitre)) {
      erreurs.push(`${chemin} : chapitre « ${f.chapitre} » absent de chapitres.yaml`);
    }
    const cle = `${f.chapitre}#${f.ordre}`;
    if (ordres.has(cle)) erreurs.push(`${chemin} : ordre ${f.ordre} déjà utilisé dans le chapitre « ${f.chapitre} »`);
    ordres.set(cle, 1);
  }
  for (const { chemin, donnees: f } of fiches) {
    for (const l of f.liees) {
      if (l === f.id) erreurs.push(`${chemin} › liees : une fiche ne peut pas être liée à elle-même`);
      else if (!idsFiches.has(l)) erreurs.push(`${chemin} › liees : fiche « ${l} » introuvable`);
    }
  }
  const idsCas = new Set<string>();
  for (const { chemin, donnees: c } of cas) {
    if (idsCas.has(c.id)) erreurs.push(`${chemin} : cas « ${c.id} » en double`);
    idsCas.add(c.id);
    for (const l of c.liees) {
      if (!idsFiches.has(l)) erreurs.push(`${chemin} › liees : fiche « ${l} » introuvable`);
    }
  }

  if (erreurs.length > 0 || !chapitres) return { contenu: null, erreurs };

  // 3. Construction du contenu
  const rangChapitre = new Map(chapitres.map((c, i) => [c.id, i]));
  const fichesFinales: Fiche[] = fiches
    .map(({ donnees: f }) => {
      const { qcm, ...reste } = f;
      return {
        ...reste,
        questions: qcm.map((q) => ({ ...q, id: `${f.id}/${q.id}`, ficheId: f.id })),
        estNouveaute: f.blocs.some((b) => b.type === 'nouveaute'),
      };
    })
    .sort((a, b) => rangChapitre.get(a.chapitre)! - rangChapitre.get(b.chapitre)! || a.ordre - b.ordre);

  const casFinaux: Cas[] = cas
    .map(({ donnees }) => donnees)
    .sort((a, b) => a.niveau.localeCompare(b.niveau) || a.titre.localeCompare(b.titre, 'fr'));

  return { contenu: { chapitres, fiches: fichesFinales, cas: casFinaux }, erreurs: [] };
}
