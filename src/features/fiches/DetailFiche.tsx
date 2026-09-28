import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Introuvable } from '../../app/Introuvable';
import { useContenu, useProgression } from '../../app/contextes';
import { basculerFavori, marquerLue } from '../../store/progression';
import { EtiquetteBrouillon, EtiquetteNiveau, EtiquetteNouveau } from '../../ui/composants';
import { IconeChevron, IconeEtoile, IconeRetour } from '../../ui/Icones';
import { Bloc } from './Bloc';

export function DetailFiche() {
  const { id = '' } = useParams();
  const { fiches, chapitres } = useContenu();
  const { progression, modifier } = useProgression();
  const navigate = useNavigate();
  const fiche = fiches.find((f) => f.id === id);

  useEffect(() => {
    if (fiche) modifier((p) => marquerLue(p, fiche.id));
  }, [fiche, modifier]);

  if (!fiche) return <Introuvable />;

  const favori = progression.favoris.includes(fiche.id);
  const duChapitre = fiches.filter((f) => f.chapitre === fiche.chapitre);
  const rang = duChapitre.indexOf(fiche);
  const precedente = duChapitre[rang - 1];
  const suivante = duChapitre[rang + 1];
  const liees = fiche.liees.map((l) => fiches.find((f) => f.id === l)).filter((f) => f !== undefined);
  const chapitre = chapitres.find((c) => c.id === fiche.chapitre)?.titre ?? fiche.chapitre;
  const { source } = fiche;

  return (
    <main className="page">
      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        <Link to="/fiches" className="bouton-rond" aria-label="Retour aux fiches">
          <IconeRetour />
        </Link>
        <div className="ligne" style={{ gap: 6 }}>
          <EtiquetteNiveau niveau={fiche.niveau} />
          {fiche.estNouveaute && <EtiquetteNouveau />}
          {fiche.statut === 'brouillon' && <EtiquetteBrouillon />}
          <button
            type="button"
            className="bouton-rond"
            aria-pressed={favori}
            aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{ color: favori ? 'var(--sable-fonce)' : 'var(--encre)' }}
            onClick={() => modifier((p) => basculerFavori(p, fiche.id))}
          >
            <IconeEtoile pleine={favori} />
          </button>
        </div>
      </div>

      <div className="pile" style={{ gap: 6 }}>
        <div className="discret" style={{ fontSize: 13 }}>
          {chapitre}
        </div>
        <h1 className="titre-page" style={{ fontSize: 26, lineHeight: 1.2 }}>
          {fiche.titre}
        </h1>
      </div>

      {fiche.blocs.map((b, i) => (
        <Bloc key={i} bloc={b} />
      ))}

      <div className="ligne">
        {fiche.questions.length > 0 && (
          <button
            type="button"
            className="bouton bouton--principal bouton--plein"
            onClick={() => navigate('/qcm/serie', { state: { mode: 'entrainement', perimetre: { type: 'fiche', fiche: fiche.id } } })}
          >
            Tester cette fiche ({fiche.questions.length} question{fiche.questions.length > 1 ? 's' : ''})
          </button>
        )}
      </div>

      {liees.length > 0 && (
        <section className="pile" aria-labelledby="titre-liees">
          <h2 id="titre-liees" className="titre-section">
            Fiches liées
          </h2>
          {liees.map((f) => (
            <Link key={f.id} to={`/fiches/${f.id}`} className="carte-lien" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--blanc)', borderRadius: 20, padding: '14px 16px' }}>
              <EtiquetteNiveau niveau={f.niveau} />
              <span style={{ flexGrow: 1, fontSize: 14, fontWeight: 500 }}>{f.titre}</span>
              <IconeChevron taille={18} />
            </Link>
          ))}
        </section>
      )}

      <nav className="ligne" aria-label="Fiches du chapitre">
        {precedente && (
          <Link to={`/fiches/${precedente.id}`} className="bouton bouton--secondaire bouton--petit bouton--plein">
            ← Précédente
          </Link>
        )}
        {suivante && (
          <Link to={`/fiches/${suivante.id}`} className="bouton bouton--secondaire bouton--petit bouton--plein">
            Suivante →
          </Link>
        )}
      </nav>

      <footer className="discret" style={{ borderTop: '1px solid var(--violet-clair)', paddingTop: 12 }}>
        Source : {source.document}, fiche {source.code}
        {source.page ? `, p.\u00a0${source.page}` : ''}
      </footer>
    </main>
  );
}
