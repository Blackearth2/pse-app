import { Link } from 'react-router';
import { useContenu, useProgression } from '../../app/contextes';
import { EtiquetteNiveau, Jauge } from '../../ui/composants';
import { IconeCas, IconeChevron, IconeEcg, IconeFleche, IconeQcm } from '../../ui/Icones';
import { fichesAReprendre } from '../fiches/logique';

export const AVERTISSEMENT =
  'Outil de révision personnel et non officiel. Il ne remplace ni la formation ni le référentiel officiel\u202f; en cas de doute, le document officiel et ton formateur font foi.';

export function Accueil() {
  const { fiches, cas } = useContenu();
  const { progression } = useProgression();

  const lues = new Set(progression.lues);
  const favoris = new Set(progression.favoris);
  const nbLues = fiches.filter((f) => lues.has(f.id)).length;
  const nbQuestions = fiches.reduce((n, f) => n + f.questions.length, 0);
  const nbNouveautes = fiches.filter((f) => f.estNouveaute).length;
  const nbCasFaits = cas.filter((c) => progression.cas[c.id]).length;
  const examens = progression.examens;
  const meilleur = examens.reduce<(typeof examens)[number] | null>((m, e) => (!m || e.score / e.total > m.score / m.total ? e : m), null);
  const dernier = examens.at(-1);
  const aReprendre = fichesAReprendre(fiches, lues, favoris);
  const nbErreurs = progression.erreurs.length;

  return (
    <main className="page">
      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        <div className="ligne" style={{ gap: 12 }}>
          <div className="rond" style={{ background: 'var(--violet-clair)', color: 'var(--violet)', width: 48, height: 48 }}>
            <IconeEcg taille={24} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Révision PSE</div>
        </div>
        <span className="etiquette" style={{ background: 'var(--vert-clair)', color: 'var(--vert)', fontSize: 12, padding: '6px 12px' }}>
          PSE1 · PSE2
        </span>
      </div>

      <h1 className="titre-page" style={{ fontSize: 30, marginTop: 4 }}>
        Ta révision
        <br />
        du jour
      </h1>

      <section className="carte carte--violet" style={{ borderRadius: 28, gap: 16 }} aria-labelledby="titre-progression">
        <h2 id="titre-progression" style={{ fontSize: 13, fontWeight: 500, color: 'var(--violet-fonce)' }}>
          Ta progression
        </h2>
        <div className="grille-3">
          <div className="chiffre">
            <div className="chiffre__valeur">
              {nbLues}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--encre-douce)' }}>/{fiches.length}</span>
            </div>
            <div className="chiffre__libelle">fiches lues</div>
          </div>
          <div className="chiffre">
            <div className="chiffre__valeur">{meilleur ? `${meilleur.score}/${meilleur.total}` : '—'}</div>
            <div className="chiffre__libelle">
              meilleur examen blanc{dernier ? ` · dernier\u00a0${dernier.score}/${dernier.total}` : ''}
            </div>
          </div>
          <div className="chiffre">
            <div className="chiffre__valeur">
              {nbCasFaits}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--encre-douce)' }}>/{cas.length}</span>
            </div>
            <div className="chiffre__libelle">cas terminés</div>
          </div>
        </div>
        <Jauge pourcent={fiches.length ? (nbLues / fiches.length) * 100 : 0} variante="blanche" libelle="Fiches lues" />
      </section>

      {fiches.length === 0 && <p className="texte">Aucune fiche publiée pour l’instant.</p>}

      {nbErreurs > 0 && (
        <Link to="/qcm/serie" state={{ mode: 'erreurs' }} className="carte-lien carte--sable" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sable-fonce)' }}>À retravailler</div>
            <div className="carte-lien__titre">Mes erreurs ({nbErreurs})</div>
          </div>
          <span className="rond">
            <IconeFleche />
          </span>
        </Link>
      )}

      {nbNouveautes > 0 && (
        <Link to="/fiches?nouveautes=1" className="carte-lien carte--sable" style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 28, padding: '20px 22px' }}>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sable-fonce)' }}>Ce qui change en 2026</div>
            <div className="carte-lien__titre">
              {nbNouveautes} fiche{nbNouveautes > 1 ? 's' : ''} mise{nbNouveautes > 1 ? 's' : ''} à jour
            </div>
          </div>
          <span className="rond" style={{ width: 48, height: 48, color: 'var(--sable-fonce)' }}>
            <IconeFleche />
          </span>
        </Link>
      )}

      <div className="grille-2">
        <Link to="/qcm" className="carte-lien carte--vert" style={{ gap: 22 }}>
          <span className="rond" style={{ borderRadius: 12, width: 40, height: 40, color: 'var(--vert)' }}>
            <IconeQcm />
          </span>
          <span>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 600 }}>QCM</span>
            <span className="discret">{nbQuestions} questions</span>
          </span>
        </Link>
        <Link to="/cas" className="carte-lien" style={{ gap: 22, background: 'var(--blanc)' }}>
          <span className="rond" style={{ borderRadius: 12, width: 40, height: 40, background: 'var(--violet-clair)', color: 'var(--violet)' }}>
            <IconeCas />
          </span>
          <span>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 600 }}>Cas pratiques</span>
            <span className="discret">{cas.length} mises en situation</span>
          </span>
        </Link>
      </div>

      {aReprendre.length > 0 && (
        <section className="pile" aria-labelledby="titre-reprendre">
          <h2 id="titre-reprendre" className="titre-section">
            Reprendre
          </h2>
          {aReprendre.map((f) => (
            <Link
              key={f.id}
              to={`/fiches/${f.id}`}
              className="carte-lien"
              style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--blanc)', borderRadius: 20, padding: '14px 16px', gap: 12 }}
            >
              <EtiquetteNiveau niveau={f.niveau} />
              <span style={{ flexGrow: 1, fontSize: 14, fontWeight: 500 }}>{f.titre}</span>
              <IconeChevron taille={18} />
            </Link>
          ))}
        </section>
      )}

      <p className="discret" style={{ fontSize: 11, lineHeight: 1.5 }}>
        {AVERTISSEMENT}
      </p>
      <Link to="/a-propos" className="lien-discret">
        À propos, sources et réinitialisation
      </Link>
    </main>
  );
}
