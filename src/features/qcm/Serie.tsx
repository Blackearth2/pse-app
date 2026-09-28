import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useContenu, useProgression } from '../../app/contextes';
import type { Question } from '../../content/types';
import { repondreQuestion } from '../../store/progression';
import { EnteteExercice, etatsOptions, Options, Retour } from '../../ui/composants';
import { IconeFermer } from '../../ui/Icones';
import { CarteQuestion } from './CarteQuestion';
import { estCorrect, questionsDuPerimetre, reponseOriginale, tirerSerie, type Perimetre, type QuestionTiree } from './logique';

type Mode = 'entrainement' | 'erreurs';
interface EtatNavigation {
  mode?: Mode;
  perimetre?: Perimetre;
}
interface EtatSerie {
  questions: QuestionTiree[];
  index: number;
  selection: number[];
  corrige: boolean;
  resultats: { questionId: string; juste: boolean }[];
}

export function messageScore(taux: number): string {
  if (taux === 1) return 'Parfait, sans faute\u202f!';
  if (taux >= 0.8) return 'Très bien, presque prêt.';
  if (taux >= 0.5) return 'Bonne base, encore quelques points à revoir.';
  return 'Reprends les fiches puis retente une série.';
}

/** Une nouvelle navigation vers la série repart toujours d'une série neuve. */
export function Serie() {
  const { key } = useLocation();
  return <SerieEnCours key={key} />;
}

function SerieEnCours() {
  const { fiches, chapitres } = useContenu();
  const { progression, modifier } = useProgression();
  const navigate = useNavigate();
  const etatNav = (useLocation().state ?? {}) as EtatNavigation;
  const mode: Mode = etatNav.mode === 'erreurs' ? 'erreurs' : 'entrainement';

  const nouvelleSerie = (erreurs: string[]): EtatSerie => {
    const perimetre: Perimetre = mode === 'erreurs' ? { type: 'ids', ids: erreurs } : (etatNav.perimetre ?? { type: 'tout' });
    return { questions: tirerSerie(questionsDuPerimetre(fiches, perimetre)), index: 0, selection: [], corrige: false, resultats: [] };
  };
  const [serie, setSerie] = useState<EtatSerie>(() => nouvelleSerie(progression.erreurs));

  const questions = new Map(fiches.flatMap((f) => f.questions).map((q) => [q.id, q]));
  const ficheDe = (q: Question) => fiches.find((f) => f.id === q.ficheId)!;
  const chapitreDe = (q: Question) => chapitres.find((c) => c.id === ficheDe(q).chapitre)?.titre ?? '';
  const intitule = mode === 'erreurs' ? 'Mes erreurs' : 'Entraînement';

  const sortie = (
    <Link to="/qcm" className="bouton-rond" aria-label="Quitter la série">
      <IconeFermer />
    </Link>
  );

  if (serie.questions.length === 0) {
    return (
      <main className="page">
        {sortie}
        <h1 className="titre-page">{intitule}</h1>
        <p className="texte">{mode === 'erreurs' ? 'Aucune erreur à retravailler pour l’instant. Bravo\u202f!' : 'Aucune question disponible pour ce choix.'}</p>
        <Link to="/qcm" className="bouton bouton--principal">
          Retour aux QCM
        </Link>
      </main>
    );
  }

  const termine = serie.index >= serie.questions.length;

  if (termine) {
    const score = serie.resultats.filter((r) => r.juste).length;
    const total = serie.resultats.length;
    const ratees = serie.resultats.filter((r) => !r.juste).map((r) => questions.get(r.questionId)!);
    return (
      <main className="page">
        <div className="score carte--violet">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--violet-fonce)' }}>{intitule}</div>
          <h1 className="score__valeur">
            {score}
            <span className="score__total">/{total}</span>
          </h1>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{messageScore(score / total)}</div>
        </div>
        {ratees.length > 0 && (
          <section className="pile" aria-labelledby="titre-a-revoir">
            <h2 id="titre-a-revoir" className="titre-section">
              À revoir
            </h2>
            {ratees.map((q) => (
              <div key={q.id} className="carte" style={{ gap: 8, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>{q.enonce}</div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--juste)' }}>
                  Réponse{q.bonnes.length > 1 ? 's' : ''} : {q.bonnes.map((b) => q.propositions[b]).join(' · ')}
                </div>
                <Link to={`/fiches/${q.ficheId}`} className="bouton bouton--vert bouton--petit" style={{ alignSelf: 'flex-start' }}>
                  Fiche : {ficheDe(q).titre}
                </Link>
              </div>
            ))}
          </section>
        )}
        <div className="ligne">
          <button type="button" className="bouton bouton--principal bouton--plein" onClick={() => setSerie(nouvelleSerie(progression.erreurs))}>
            Nouvelle série
          </button>
          <button type="button" className="bouton bouton--secondaire bouton--plein" onClick={() => navigate('/qcm')}>
            Terminer
          </button>
        </div>
      </main>
    );
  }

  const qt = serie.questions[serie.index]!;
  const q = questions.get(qt.questionId)!;
  const multiple = q.bonnes.length > 1;
  const juste = serie.corrige && estCorrect(q.bonnes, reponseOriginale(qt.ordre, serie.selection));

  const valider = (selection: number[]) => {
    const correct = estCorrect(q.bonnes, reponseOriginale(qt.ordre, selection));
    modifier((p) => repondreQuestion(p, q.id, correct, mode));
    setSerie({ ...serie, selection, corrige: true, resultats: [...serie.resultats, { questionId: q.id, juste: correct }] });
  };

  const choisir = (position: number) => {
    if (serie.corrige) return;
    if (!multiple) return valider([position]);
    const selection = serie.selection.includes(position) ? serie.selection.filter((p) => p !== position) : [...serie.selection, position];
    setSerie({ ...serie, selection });
  };

  const derniere = serie.index + 1 === serie.questions.length;

  return (
    <main className="page">
      <EnteteExercice
        sortie={sortie}
        intitule={intitule}
        compteur={`${serie.index + 1} / ${serie.questions.length}`}
        pourcent={((serie.index + (serie.corrige ? 1 : 0)) / serie.questions.length) * 100}
      />
      <CarteQuestion question={q} fiche={ficheDe(q)} chapitre={chapitreDe(q)} />
      <Options
        libelles={qt.ordre.map((i) => q.propositions[i]!)}
        etats={etatsOptions(qt.ordre, q.bonnes, serie.selection, serie.corrige)}
        multiple={multiple}
        desactive={serie.corrige}
        legende="Propositions"
        onChoisir={choisir}
      />
      {multiple && !serie.corrige && (
        <button type="button" className="bouton bouton--principal" disabled={serie.selection.length === 0} onClick={() => valider(serie.selection)}>
          Valider
        </button>
      )}
      {serie.corrige && (
        <>
          <Retour juste={juste} titre={juste ? 'Bonne réponse' : 'Ce n’est pas ça'}>
            <p>{q.explication}</p>
            <Link to={`/fiches/${q.ficheId}`} style={{ fontWeight: 600 }}>
              Revoir la fiche : {ficheDe(q).titre}
            </Link>
          </Retour>
          <button
            type="button"
            className="bouton bouton--principal"
            onClick={() => setSerie({ ...serie, index: serie.index + 1, selection: [], corrige: false })}
          >
            {derniere ? 'Voir mon score' : 'Question suivante'}
          </button>
        </>
      )}
    </main>
  );
}
