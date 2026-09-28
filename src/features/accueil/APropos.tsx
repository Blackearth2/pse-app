import { useState } from 'react';
import { Link } from 'react-router';
import { useContenu, useProgression } from '../../app/contextes';
import { PROGRESSION_VIDE } from '../../store/progression';
import { IconeRetour } from '../../ui/Icones';
import { AVERTISSEMENT } from './Accueil';

export function APropos() {
  const { fiches, meta } = useContenu();
  const { modifier } = useProgression();
  const [confirmation, setConfirmation] = useState(false);
  const [reinitialise, setReinitialise] = useState(false);

  const documents = [...new Set(fiches.map((f) => f.source.document))];
  const date = new Date(meta.genereLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="page">
      <Link to="/" className="bouton-rond" aria-label="Retour à l’accueil">
        <IconeRetour />
      </Link>
      <h1 className="titre-page">À propos</h1>

      <section className="carte carte--sable">
        <h2 className="bloc-titre">Avertissement</h2>
        <p className="texte">{AVERTISSEMENT}</p>
      </section>

      <section className="carte">
        <h2 className="bloc-titre">Sources</h2>
        {documents.length ? (
          <ul className="puces-texte">
            {documents.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className="texte">Aucune fiche publiée pour l’instant.</p>
        )}
        <p className="discret">
          Les fiches sont des résumés reformulés à partir des documents officiels de l’État, avec leur référence en bas de chaque fiche.
        </p>
      </section>

      <section className="carte">
        <h2 className="bloc-titre">Version du contenu</h2>
        <p className="texte">
          Contenu généré le {date}.{meta.avecBrouillons ? ' Brouillons inclus (version de travail).' : ''}
        </p>
      </section>

      <section className="carte">
        <h2 className="bloc-titre">Ta progression</h2>
        <p className="texte">
          Ta progression reste sur cet appareil : rien n’est envoyé sur internet. Installe l’app sur l’écran d’accueil de ton téléphone
          pour la conserver durablement (certains navigateurs effacent les données des sites peu visités).
        </p>
        {reinitialise && (
          <p className="texte" role="status">
            Progression réinitialisée.
          </p>
        )}
        {!confirmation ? (
          <button type="button" className="bouton bouton--secondaire" onClick={() => setConfirmation(true)}>
            Réinitialiser ma progression
          </button>
        ) : (
          <div className="pile">
            <p className="texte" style={{ fontWeight: 600 }}>
              Effacer fiches lues, favoris, erreurs, examens et cas terminés ?
            </p>
            <div className="ligne">
              <button
                type="button"
                className="bouton bouton--principal bouton--plein"
                onClick={() => {
                  modifier(() => PROGRESSION_VIDE);
                  setConfirmation(false);
                  setReinitialise(true);
                }}
              >
                Confirmer
              </button>
              <button type="button" className="bouton bouton--secondaire bouton--plein" onClick={() => setConfirmation(false)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
