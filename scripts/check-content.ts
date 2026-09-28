// `npm run check:content` : valide le contenu et contrôle la neutralité du projet.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilerContenu } from '../src/content/node/compiler';
import { scannerNeutralite } from './neutralite';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
let echec = false;

const tout = compilerContenu(join(racine, 'content'), true);
if (!tout.contenu) {
  console.error(`✗ Contenu invalide :\n- ${tout.erreurs.join('\n- ')}`);
  echec = true;
} else {
  const { fiches, cas } = tout.contenu;
  const verifiees = fiches.filter((f) => f.statut === 'verifie');
  const questions = fiches.reduce((n, f) => n + f.questions.length, 0);
  console.log(
    `✓ Contenu valide : ${fiches.length} fiches (${verifiees.length} vérifiées), ${questions} questions, ` +
      `${cas.length} cas (${cas.filter((c) => c.statut === 'verifie').length} vérifiés)`,
  );
  const publie = compilerContenu(join(racine, 'content'), false);
  for (const a of publie.avertissements) console.warn(`! ${a}`);
}

const occurrences = scannerNeutralite(racine);
if (occurrences.length) {
  console.error(`✗ Contrôle de neutralité : termes interdits trouvés\n- ${occurrences.join('\n- ')}`);
  echec = true;
} else {
  console.log('✓ Contrôle de neutralité : aucun terme interdit');
}

process.exit(echec ? 1 : 0);
