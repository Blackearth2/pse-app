// Plugin Vite : expose le contenu validé via le module virtuel `virtual:contenu`.
// - développement (`vite`) : brouillons inclus, rechargement à chaque modification de `content/` ;
// - construction (`vite build`) : contenu vérifié uniquement, contrôle de neutralité du projet entier.
// La variable d'environnement CONTENU_BROUILLONS=1 force l'inclusion des brouillons.
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { scannerNeutralite } from '../../../scripts/neutralite';
import { compilerContenu } from './compiler';

const ID_VIRTUEL = 'virtual:contenu';
const ID_RESOLU = '\0' + ID_VIRTUEL;

export function pluginContenu(options: { racineProjet: string }): Plugin {
  const racineContenu = join(options.racineProjet, 'content');
  let commande: 'serve' | 'build' = 'serve';

  return {
    name: 'revision-pse:contenu',
    configResolved(config) {
      commande = config.command;
    },
    buildStart() {
      if (commande !== 'build') return;
      const occurrences = scannerNeutralite(options.racineProjet);
      if (occurrences.length) {
        this.error(`Contrôle de neutralité : termes interdits trouvés\n- ${occurrences.join('\n- ')}`);
      }
    },
    resolveId(id) {
      return id === ID_VIRTUEL ? ID_RESOLU : undefined;
    },
    load(id) {
      if (id !== ID_RESOLU) return undefined;
      const avecBrouillons = commande === 'serve' || process.env.CONTENU_BROUILLONS === '1';
      const r = compilerContenu(racineContenu, avecBrouillons);
      if (!r.contenu) this.error(`Contenu invalide :\n- ${r.erreurs.join('\n- ')}`);
      for (const a of r.avertissements) this.warn(a);
      return `export default ${JSON.stringify(r.contenu)};`;
    },
    configureServer(server) {
      server.watcher.add(racineContenu);
      const recharger = (fichier: string) => {
        if (!fichier.startsWith(racineContenu)) return;
        const mod = server.environments.client.moduleGraph.getModuleById(ID_RESOLU);
        if (mod) server.environments.client.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', recharger);
      server.watcher.on('change', recharger);
      server.watcher.on('unlink', recharger);
    },
  };
}
