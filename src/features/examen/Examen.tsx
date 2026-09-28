import { useEffect, useEffectEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useContenu, useProgression } from '../../app/contextes';
import type { Question } from '../../content/types';
import { enregistrerExamen, majExamenEnCours, repondreQuestion } from '../../store/progression';
import { EnteteExercice, etatsOptions, Options } from '../../ui/composants';
import { IconeHorloge, IconeRetour } from '../../ui/Icones';
import { CarteQuestion } from '../qcm/CarteQuestion';
import { questionsDuPerimetre } from '../qcm/logique';
import { messageScore } from '../qcm/Serie';
import {
  corrigerExamen,
  creerExamen,
  estExpire,
  tempsRestantMs,
  TAILLE_EXAMEN,
  type ExamenEnCours,
  type NiveauExamen,
  type ResultatExamen,
} from './logique';

export function formaterDuree(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function Examen() {
  const { fiches } = useContenu();
  const { progression, modifier } = useProgression();
  const [resultat, setResultat] = useState<{ examen: ExamenEnCours; resultat: ResultatExamen } | null>(null);

  const rendre = (examen: ExamenEnCours) => {
    const r = corrigerExamen(examen, fiches);
    modifier((p) => {
      let suivante = p;
      for (const id of r.erreurs) suivante = repondreQuestion(suivante, id, false, 'examen');
      return enregistrerExamen(suivante, { date: new Date().toISOString(), niveau: examen.niveau, score: r.score, total: r.total });
    });
    setResultat({ examen, resultat: r });
  };

  if (resultat) return <Resultat {...resultat} recommencer={() => setResultat(null)} />;
  if (progression.examenEnCours) return <EnCours examen={progression.examenEnCours} rendre={rendre} />;
  return <Lancement />;
}

// --- Lancement -----------------------------------------------------------------------

function Lancement() {
  const { fiches } = useContenu();
  const { progression, modifier } = useProgression();
  const [niveau, setNiveau] = useState<NiveauExamen>('PSE1');
  const compte = (n: NiveauExamen) =>
    questionsDuPerimetre(fiches, n === 'PSE1' ? { type: 'niveau', niveau: 'PSE1' } : { type: 'tout' }).length;
  const nb = Math.min(compte(niveau), TAILLE_EXAMEN);
  const historique = [...progression.examens].reverse();

  return (
    <main className="page">
      <Link to="/qcm" className="bouton-rond" aria-label="Retour aux QCM">
        <IconeRetour />
      </Link>
      <h1 className="titre-page">
        Examen
        <br />
        blanc
      </h1>
      <p className="texte">
        {TAILLE_EXAMEN} questions réparties sur tout le programme, 1 minute par question. Aucune correction avant la fin : tu peux revenir sur
        tes réponses jusqu’à rendre ta copie. L’examen est sauvegardé si tu quittes l’app.
      </p>
      <fieldset className="pile" style={{ border: 'none', margin: 0, padding: 0 }}>
        <legend className="titre-section" style={{ marginBottom: 10 }}>
          Niveau
        </legend>
        {(['PSE1', 'PSE1+PSE2'] as const).map((n) => (
          <label
            key={n}
            className="option"
            style={{ borderColor: niveau === n ? 'var(--violet)' : 'var(--blanc)', background: niveau === n ? 'var(--violet-clair)' : 'var(--blanc)', cursor: 'pointer' }}
          >
            <input type="radio" name="niveau" checked={niveau === n} onChange={() => setNiveau(n)} style={{ width: 20, height: 20, accentColor: 'var(--violet)' }} />
            <span className="option__texte" style={{ fontWeight: 600 }}>
              {n === 'PSE1' ? 'PSE1' : 'PSE1 et PSE2'}
            </span>
            <span className="discret">{compte(n)} Q. disponibles</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className="bouton bouton--principal"
        disabled={nb === 0}
        onClick={() => modifier((p) => majExamenEnCours(p, creerExamen(fiches, niveau, Math.random, new Date())))}
      >
        {nb === 0 ? 'Aucune question disponible' : `Commencer l’examen (${nb} questions, ${nb} min)`}
      </button>

      {historique.length > 0 && (
        <section className="pile" aria-labelledby="titre-historique">
          <h2 id="titre-historique" className="titre-section">
            Derniers examens
          </h2>
          <ul className="carte" style={{ listStyle: 'none', margin: 0, gap: 8 }}>
            {historique.map((e) => (
              <li key={e.date} className="ligne" style={{ justifyContent: 'space-between', fontSize: 14 }}>
                <span>
                  {new Date(e.date).toLocaleDateString('fr-FR')} · {e.niveau === 'PSE1' ? 'PSE1' : 'PSE1 et PSE2'}
                </span>
                <strong>
                  {e.score}/{e.total}
                </strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

// --- Examen en cours ---------------------------------------------------------------------

function EnCours({ examen, rendre }: { examen: ExamenEnCours; rendre: (e: ExamenEnCours) => void }) {
  const { fiches, chapitres } = useContenu();
  const { modifier } = useProgression();
  const navigate = useNavigate();
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [confirmation, setConfirmation] = useState(false);

  const verifierTemps = useEffectEvent(() => {
    const now = new Date();
    if (estExpire(examen, now)) rendre(examen);
    else setMaintenant(now);
  });
  useEffect(() => {
    const premier = setTimeout(verifierTemps, 0); // examen expiré pendant que l'app était fermée
    const id = setInterval(verifierTemps, 1000);
    return () => {
      clearTimeout(premier);
      clearInterval(id);
    };
  }, []);

  const questions = new Map(fiches.flatMap((f) => f.questions).map((q) => [q.id, q]));
  const qt = examen.questions[examen.index]!;
  const q: Question | undefined = questions.get(qt.questionId);
  const fiche = q ? fiches.find((f) => f.id === q.ficheId) : undefined;
  const selection = examen.reponses[examen.index] ?? [];
  const restant = tempsRestantMs(examen, maintenant);
  const sansReponse = examen.reponses.filter((r) => r === null).length;
  const total = examen.questions.length;

  const maj = (e: Partial<ExamenEnCours>) => modifier((p) => majExamenEnCours(p, { ...examen, ...e }));
  const choisir = (position: number) => {
    if (!q) return;
    let suivante: number[];
    if (q.bonnes.length > 1) suivante = selection.includes(position) ? selection.filter((p) => p !== position) : [...selection, position];
    else suivante = [position];
    const reponses = [...examen.reponses];
    reponses[examen.index] = suivante.length ? suivante : null;
    maj({ reponses });
  };

  return (
    <main className="page">
      <EnteteExercice
        sortie={
          <button type="button" className="bouton-rond" aria-label="Mettre l’examen en pause" onClick={() => navigate('/qcm')}>
            <IconeRetour />
          </button>
        }
        intitule="Examen blanc"
        compteur={`${examen.index + 1} / ${total}`}
        pourcent={((total - sansReponse) / total) * 100}
      />
      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        <span className={`chrono${restant < 5 * 60_000 ? ' chrono--urgent' : ''}`} role="timer" aria-label="Temps restant">
          <IconeHorloge taille={18} />
          {formaterDuree(restant)}
        </span>
        <span className="discret">
          {sansReponse} sans réponse
        </span>
      </div>

      {q && fiche ? (
        <>
          <CarteQuestion question={q} fiche={fiche} chapitre={chapitres.find((c) => c.id === fiche.chapitre)?.titre ?? ''} />
          <Options
            libelles={qt.ordre.map((i) => q.propositions[i]!)}
            etats={etatsOptions(qt.ordre, q.bonnes, selection, false)}
            multiple
            desactive={false}
            legende="Propositions"
            onChoisir={choisir}
          />
        </>
      ) : (
        <p className="texte">Cette question n’est plus publiée : elle ne sera pas comptée.</p>
      )}

      <div className="ligne">
        <button type="button" className="bouton bouton--secondaire bouton--plein" disabled={examen.index === 0} onClick={() => maj({ index: examen.index - 1 })}>
          ← Précédente
        </button>
        <button type="button" className="bouton bouton--secondaire bouton--plein" disabled={examen.index === total - 1} onClick={() => maj({ index: examen.index + 1 })}>
          Suivante →
        </button>
      </div>

      {!confirmation ? (
        <button
          type="button"
          className="bouton bouton--principal"
          onClick={() => (sansReponse > 0 ? setConfirmation(true) : rendre(examen))}
        >
          Rendre la copie
        </button>
      ) : (
        <div className="carte carte--sable" role="alertdialog" aria-label="Confirmer le rendu">
          <p className="texte" style={{ fontWeight: 600 }}>
            {sansReponse} question{sansReponse > 1 ? 's' : ''} sans réponse. Rendre la copie quand même ?
          </p>
          <div className="ligne">
            <button type="button" className="bouton bouton--principal bouton--plein" onClick={() => rendre(examen)}>
              Rendre
            </button>
            <button type="button" className="bouton bouton--secondaire bouton--plein" onClick={() => setConfirmation(false)}>
              Continuer
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// --- Résultat ---------------------------------------------------------------------------

function Resultat({ examen, resultat, recommencer }: { examen: ExamenEnCours; resultat: ResultatExamen; recommencer: () => void }) {
  const { fiches, chapitres } = useContenu();
  const navigate = useNavigate();
  const questions = new Map(fiches.flatMap((f) => f.questions).map((q) => [q.id, q]));
  const titreChapitre = new Map(chapitres.map((c) => [c.id, c.titre]));
  const taux = resultat.total ? resultat.score / resultat.total : 0;

  return (
    <main className="page">
      <div className="score carte--violet">
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--violet-fonce)' }}>
          Examen blanc · {examen.niveau === 'PSE1' ? 'PSE1' : 'PSE1 et PSE2'}
        </div>
        <h1 className="score__valeur">
          {resultat.score}
          <span className="score__total">/{resultat.total}</span>
        </h1>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{messageScore(taux)}</div>
      </div>

      <section className="carte" aria-labelledby="titre-par-chapitre">
        <h2 id="titre-par-chapitre" className="bloc-titre">
          Détail par chapitre
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead className="visuellement-cache">
            <tr>
              <th>Chapitre</th>
              <th>Bonnes réponses</th>
            </tr>
          </thead>
          <tbody>
            {resultat.parChapitre.map((c) => (
              <tr key={c.chapitre} style={{ borderTop: '1px solid var(--fond)' }}>
                <td style={{ padding: '8px 0' }}>{titreChapitre.get(c.chapitre) ?? c.chapitre}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {c.bonnes}/{c.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {resultat.erreurs.length > 0 && (
        <section className="pile" aria-labelledby="titre-erreurs-examen">
          <h2 id="titre-erreurs-examen" className="titre-section">
            À revoir ({resultat.erreurs.length})
          </h2>
          <p className="discret">Ces questions ont rejoint « Mes erreurs ».</p>
          {resultat.erreurs.map((id) => {
            const q = questions.get(id)!;
            const i = examen.questions.findIndex((qt) => qt.questionId === id);
            const reponse = examen.reponses[i];
            const donnee = reponse ? reponse.map((pos) => q.propositions[examen.questions[i]!.ordre[pos]!]).join(' · ') : 'sans réponse';
            return (
              <div key={id} className="carte" style={{ gap: 8, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>{q.enonce}</div>
                <div style={{ fontSize: 13, color: 'var(--faux)' }}>Ta réponse : {donnee}</div>
                <div style={{ fontSize: 13, color: 'var(--juste)' }}>
                  Réponse{q.bonnes.length > 1 ? 's' : ''} : {q.bonnes.map((b) => q.propositions[b]).join(' · ')}
                </div>
                <div className="texte" style={{ fontSize: 13 }}>
                  {q.explication}
                </div>
                <Link to={`/fiches/${q.ficheId}`} className="bouton bouton--vert bouton--petit" style={{ alignSelf: 'flex-start' }}>
                  Revoir la fiche
                </Link>
              </div>
            );
          })}
        </section>
      )}

      <div className="ligne">
        <button type="button" className="bouton bouton--principal bouton--plein" onClick={recommencer}>
          Nouvel examen
        </button>
        <button type="button" className="bouton bouton--secondaire bouton--plein" onClick={() => navigate('/qcm')}>
          Terminer
        </button>
      </div>
    </main>
  );
}
