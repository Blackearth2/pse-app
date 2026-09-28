import { useSearchParams } from 'react-router';
import { useContenu, useProgression } from '../../app/contextes';
import type { Niveau } from '../../content/types';
import { IconeChevron, IconeRecherche } from '../../ui/Icones';
import { CarteFiche } from './CarteFiche';
import { filtrerFiches, rechercher, type Filtres } from './logique';

export function ListeFiches() {
  const { fiches, chapitres } = useContenu();
  const { progression } = useProgression();
  const [params, setParams] = useSearchParams();

  const niveauParam = params.get('niveau');
  const filtres: Filtres = {
    niveau: niveauParam === 'PSE1' || niveauParam === 'PSE2' ? niveauParam : 'tous',
    nouveautes: params.get('nouveautes') === '1',
    favoris: params.get('favoris') === '1',
  };
  const requete = params.get('q') ?? '';

  const lues = new Set(progression.lues);
  const favoris = new Set(progression.favoris);
  const filtrees = filtrerFiches(fiches, filtres, favoris);
  const resultats = requete.trim() ? rechercher(filtrees, requete) : filtrees;
  const filtreActif = filtres.niveau !== 'tous' || filtres.nouveautes || filtres.favoris;

  const changer = (cle: string, valeur: string | null) => {
    const suivants = new URLSearchParams(params);
    if (valeur === null) suivants.delete(cle);
    else suivants.set(cle, valeur);
    setParams(suivants, { replace: true });
  };

  const puceNiveau = (valeur: Niveau | 'tous', libelle: string) => (
    <button
      type="button"
      className="puce"
      aria-pressed={filtres.niveau === valeur}
      onClick={() => changer('niveau', valeur === 'tous' ? null : valeur)}
    >
      {libelle}
    </button>
  );

  const titreChapitre = new Map(chapitres.map((c) => [c.id, c.titre]));

  return (
    <main className="page">
      <h1 className="titre-page">
        Fiches
        <br />
        de révision
      </h1>

      <label className="recherche">
        <IconeRecherche />
        <span className="visuellement-cache">Rechercher une fiche</span>
        <input
          type="search"
          value={requete}
          placeholder="Garrot, DAE, nourrisson…"
          onChange={(e) => changer('q', e.target.value || null)}
        />
      </label>

      <div className="puces" role="group" aria-label="Filtres">
        {puceNiveau('tous', 'Toutes')}
        {puceNiveau('PSE1', 'PSE1')}
        {puceNiveau('PSE2', 'PSE2')}
        <button type="button" className="puce" aria-pressed={filtres.nouveautes} onClick={() => changer('nouveautes', filtres.nouveautes ? null : '1')}>
          Nouveautés 2026
        </button>
        <button type="button" className="puce" aria-pressed={filtres.favoris} onClick={() => changer('favoris', filtres.favoris ? null : '1')}>
          ★ Favoris
        </button>
      </div>

      <p className="discret" role="status">
        {resultats.length} fiche{resultats.length > 1 ? 's' : ''}
      </p>

      {resultats.length === 0 && (
        <p className="texte">
          {fiches.length === 0 ? 'Aucune fiche publiée pour l’instant.' : 'Aucune fiche ne correspond à ta recherche ou à tes filtres.'}
        </p>
      )}

      {requete.trim() ? (
        <div className="pile">
          {resultats.map((f, i) => (
            <CarteFiche key={f.id} fiche={f} rang={i} lue={lues.has(f.id)} favori={favoris.has(f.id)} sousTitre={titreChapitre.get(f.chapitre)} />
          ))}
        </div>
      ) : (
        chapitres.map((c) => {
          const duChapitre = resultats.filter((f) => f.chapitre === c.id);
          if (duChapitre.length === 0) return null;
          return (
            <details key={c.id} className="chapitre" open={filtreActif}>
              <summary>
                <span>
                  {c.titre} <span className="discret">({duChapitre.length})</span>
                </span>
                <IconeChevron taille={18} />
              </summary>
              <div className="chapitre__contenu">
                {duChapitre.map((f, i) => (
                  <CarteFiche key={f.id} fiche={f} rang={i} lue={lues.has(f.id)} favori={favoris.has(f.id)} />
                ))}
              </div>
            </details>
          );
        })
      )}
    </main>
  );
}
