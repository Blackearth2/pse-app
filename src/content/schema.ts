// Schémas des fichiers YAML de `content/` (format décrit au § 5 de la spec).
import { z } from 'zod';

z.config(z.locales.fr());

const texte = z.string().trim().min(1);
export const identifiant = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'identifiant en kebab-case attendu (minuscules, chiffres, tirets)');
const niveau = z.enum(['PSE1', 'PSE2']);
const statut = z.enum(['brouillon', 'verifie']);

// --- Chapitres ------------------------------------------------------------------

export const schemaChapitres = z.array(z.object({ id: identifiant, titre: texte }).strict()).min(1);

// --- Fiches ---------------------------------------------------------------------

const blocItems = <T extends 'etapes' | 'liste' | 'attention' | 'nouveaute'>(type: T) =>
  z.object({ type: z.literal(type), titre: texte.optional(), items: z.array(texte).min(1) }).strict();

const schemaBloc = z.discriminatedUnion('type', [
  z.object({ type: z.literal('texte'), titre: texte.optional(), contenu: texte }).strict(),
  z
    .object({
      type: z.literal('chiffres'),
      titre: texte.optional(),
      items: z.array(z.object({ valeur: texte, libelle: texte }).strict()).min(1),
    })
    .strict(),
  blocItems('etapes'),
  blocItems('liste'),
  blocItems('attention'),
  blocItems('nouveaute'),
]);

const schemaQuestion = z
  .object({
    id: identifiant,
    enonce: texte,
    propositions: z.array(texte).min(2).max(5),
    bonnes: z.array(z.number().int().min(0)).min(1),
    explication: texte,
    nouveaute: z.boolean().default(false),
  })
  .strict()
  .superRefine((q, ctx) => {
    for (const i of q.bonnes) {
      if (i >= q.propositions.length) {
        ctx.addIssue({ code: 'custom', path: ['bonnes'], message: `indice ${i} hors des propositions` });
      }
    }
    if (new Set(q.bonnes).size !== q.bonnes.length) {
      ctx.addIssue({ code: 'custom', path: ['bonnes'], message: 'bonne réponse en double' });
    }
    if (q.bonnes.length >= q.propositions.length) {
      ctx.addIssue({ code: 'custom', path: ['bonnes'], message: 'toutes les propositions ne peuvent pas être bonnes' });
    }
  });

export const schemaFiche = z
  .object({
    id: identifiant,
    niveau,
    chapitre: identifiant,
    type: z.enum(['connaissance', 'procedure', 'technique']),
    ordre: z.number().int().min(1),
    titre: texte,
    motsCles: z.array(texte).default([]),
    statut,
    source: z.object({ document: texte, code: texte, page: z.number().int().min(1).optional() }).strict(),
    liees: z.array(identifiant).default([]),
    blocs: z.array(schemaBloc).min(1),
    qcm: z.array(schemaQuestion).default([]),
  })
  .strict()
  .superRefine((f, ctx) => {
    const vus = new Set<string>();
    f.qcm.forEach((q, i) => {
      if (vus.has(q.id)) ctx.addIssue({ code: 'custom', path: ['qcm', i, 'id'], message: `question « ${q.id} » en double` });
      vus.add(q.id);
    });
  });

// --- Cas pratiques --------------------------------------------------------------

const proposition = z.object({ texte, correct: z.boolean(), retour: texte }).strict();
const etapeBase = { moment: texte, situation: texte, question: texte };

const schemaEtape = z.discriminatedUnion('type', [
  z
    .object({ ...etapeBase, type: z.literal('choix'), propositions: z.array(proposition).min(2).max(5) })
    .strict()
    .refine((e) => e.propositions.filter((p) => p.correct).length === 1, {
      message: 'une étape « choix » doit avoir exactement une proposition correcte',
      path: ['propositions'],
    }),
  z
    .object({ ...etapeBase, type: z.literal('multiple'), propositions: z.array(proposition).min(3).max(6) })
    .strict()
    .superRefine((e, ctx) => {
      const correctes = e.propositions.filter((p) => p.correct).length;
      if (correctes < 2) {
        ctx.addIssue({ code: 'custom', path: ['propositions'], message: 'une étape « multiple » demande au moins 2 propositions correctes' });
      }
      if (correctes === e.propositions.length) {
        ctx.addIssue({ code: 'custom', path: ['propositions'], message: 'une étape « multiple » demande au moins 1 incorrecte' });
      }
    }),
  z
    .object({ ...etapeBase, type: z.literal('ordre'), elements: z.array(texte).min(3).max(6), retour: texte })
    .strict()
    .refine((e) => new Set(e.elements).size === e.elements.length, {
      message: 'élément en double',
      path: ['elements'],
    }),
]);

export const schemaCas = z
  .object({
    id: identifiant,
    niveau,
    titre: texte,
    lieu: texte,
    statut,
    liees: z.array(identifiant).min(1),
    contexte: texte,
    etapes: z.array(schemaEtape).min(2),
    pointsCles: z.array(texte).min(1),
  })
  .strict();

export type FicheBrute = z.infer<typeof schemaFiche>;
export type CasBrut = z.infer<typeof schemaCas>;
export type ChapitreBrut = z.infer<typeof schemaChapitres>[number];
