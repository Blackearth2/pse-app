import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useContenu, useProgression } from '../../app/contextes';
import { Introuvable } from '../../app/Introuvable';
import type { Cas, EtapeCas } from '../../content/types';
import { permutation } from '../../lib/hasard';
import { enregistrerCas } from '../../store/progression';
import { EnteteExercice, etatsOptions, Options, Retour } from '../../ui/composants';
import { IconeBas, IconeCoche, IconeFermer, IconeHaut, IconeHorloge } from '../../ui/Icones';
import { reponseOriginale } from '../qcm/logique';
import { etapeReussie, ordreInitial } from './logique';

interface Partie {
  /** Par étape : ordre d'affichage des propositions (choix/multiple) ou ordre de départ (ordre). */
  ordres: number[][];
  index: number;
  selection: number[];
  /** Ordre courant proposé par l'utilisateur (étape « ordre »), en indices d'origine. */
  arrangement: number[];
  corrige: boolean;
  score: number;
  termine: boolean;
}

function nouvellePartie(cas: Cas): Partie {
  const ordres = cas.etapes.map((e) => (e.type === 'ordre' ? ordreInitial(e.elements.length) : permutation(e.propositions.length)));
  return { ordres, index: 0, selection: [], arrangement: ordres[0]!, corrige: false, score: 0, termine: false };
}

export function DeroulerCas() {
  const { id = '' } = useParams();
  const { cas } = useContenu();
  const c = cas.find((x) => x.id === id);
  if (!c) return <Introuvable />;
  return <Deroule key={c.id} cas={c} />;
}

function Deroule({ cas }: { cas: Cas }) {
  const { fiches } = useContenu();
  const { modifier } = useProgression();
  const navigate = useNavigate();
  const [partie, setPartie] = useState(() => nouvellePartie(cas));
  const total = cas.etapes.length;

  const sortie = (
    <Link to="/cas" className="bouton-rond" aria-label="Quitter le cas">
      <IconeFermer />
    </Link>
  );

  if (partie.termine) {
    const liees = cas.liees.map((l) => fiches.find((f) => f.id === l)).filter((f) => f !== undefined);
    const taux = partie.score / total;
    return (
      <main className="page">
        <div className="score carte--vert">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--vert-fonce)' }}>Débriefing · {cas.titre}</div>
          <h1 className="score__valeur">
            {partie.score}
            <span className="score__total">/{total}</span>
          </h1>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {taux === 1 ? 'Intervention maîtrisée.' : taux >= 0.5 ? 'Bonne intervention, quelques réflexes à consolider.' : 'Relis les fiches associées et rejoue le cas.'}
          </div>
        </div>
        <section className="carte" aria-labelledby="titre-points-cles">
          <h2 id="titre-points-cles" className="bloc-titre">
            Points clés
          </h2>
          <ul className="pile" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {cas.pointsCles.map((p, i) => (
              <li key={i} className="ligne" style={{ alignItems: 'flex-start', fontSize: 14, lineHeight: 1.55 }}>
                <span style={{ color: 'var(--vert)', flexShrink: 0, marginTop: 3 }}>
                  <IconeCoche taille={16} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </section>
        {liees.length > 0 && (
          <section className="pile" aria-labelledby="titre-fiches-cas">
            <h2 id="titre-fiches-cas" className="titre-section">
              Fiches à revoir
            </h2>
            {liees.map((f) => (
              <Link key={f.id} to={`/fiches/${f.id}`} className="bouton bouton--vert bouton--petit" style={{ justifyContent: 'flex-start' }}>
                {f.titre}
              </Link>
            ))}
          </section>
        )}
        <div className="ligne">
          <button type="button" className="bouton bouton--principal bouton--plein" onClick={() => setPartie(nouvellePartie(cas))}>
            Rejouer
          </button>
          <button type="button" className="bouton bouton--vert bouton--plein" onClick={() => navigate('/cas')}>
            Autres cas
          </button>
        </div>
      </main>
    );
  }

  const etape = cas.etapes[partie.index]!;
  const ordre = partie.ordres[partie.index]!;
  const reponse = etape.type === 'ordre' ? partie.arrangement : reponseOriginale(ordre, partie.selection);
  const reussie = partie.corrige && etapeReussie(etape, reponse);

  const valider = (selection: number[]) => {
    const r = etape.type === 'ordre' ? partie.arrangement : reponseOriginale(ordre, selection);
    setPartie({ ...partie, selection, corrige: true, score: partie.score + (etapeReussie(etape, r) ? 1 : 0) });
  };

  const suivante = () => {
    const index = partie.index + 1;
    if (index >= total) {
      modifier((p) => enregistrerCas(p, cas.id, partie.score, total));
      setPartie({ ...partie, termine: true });
    } else {
      setPartie({ ...partie, index, selection: [], arrangement: partie.ordres[index]!, corrige: false });
    }
  };

  const deplacer = (rang: number, sens: -1 | 1) => {
    const a = [...partie.arrangement];
    [a[rang], a[rang + sens]] = [a[rang + sens]!, a[rang]!];
    setPartie({ ...partie, arrangement: a });
  };

  return (
    <main className="page">
      <EnteteExercice
        sortie={sortie}
        intitule={cas.titre}
        compteur={`Étape ${partie.index + 1} / ${total}`}
        pourcent={((partie.index + (partie.corrige ? 1 : 0)) / total) * 100}
        variante="vert"
      />
      {partie.index === 0 && (
        <div className="carte" style={{ padding: '16px 18px', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--encre-douce)' }}>Contexte · {cas.lieu}</div>
          <p className="texte" style={{ fontSize: 13 }}>
            {cas.contexte}
          </p>
        </div>
      )}
      <div className="carte carte--vert" style={{ borderRadius: 28, padding: 22 }}>
        <div className="ligne" style={{ gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--vert-fonce)' }}>
          <IconeHorloge taille={16} />
          {etape.moment}
        </div>
        <p className="texte" style={{ color: 'var(--encre)' }}>
          {etape.situation}
        </p>
        <h1 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{etape.question}</h1>
        {etape.type === 'multiple' && <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--vert-fonce)' }}>Plusieurs réponses possibles.</p>}
      </div>

      {etape.type === 'ordre' ? (
        <EtapeOrdre etape={etape} arrangement={partie.arrangement} corrige={partie.corrige} deplacer={deplacer} />
      ) : (
        <Options
          libelles={ordre.map((i) => etape.propositions[i]!.texte)}
          etats={etatsOptions(
            ordre,
            etape.propositions.flatMap((p, i) => (p.correct ? [i] : [])),
            partie.selection,
            partie.corrige,
          )}
          multiple={etape.type === 'multiple'}
          desactive={partie.corrige}
          legende="Actions possibles"
          onChoisir={(pos) => {
            if (etape.type === 'choix') return valider([pos]);
            const s = partie.selection.includes(pos) ? partie.selection.filter((p) => p !== pos) : [...partie.selection, pos];
            setPartie({ ...partie, selection: s });
          }}
        />
      )}

      {!partie.corrige && etape.type !== 'choix' && (
        <button
          type="button"
          className="bouton bouton--principal"
          disabled={etape.type === 'multiple' && partie.selection.length === 0}
          onClick={() => valider(partie.selection)}
        >
          Valider
        </button>
      )}

      {partie.corrige && (
        <>
          <Retour juste={reussie} titre={reussie ? 'Bonne décision' : 'À corriger'}>
            <RetourEtape etape={etape} choisies={reponse} />
          </Retour>
          <button type="button" className="bouton bouton--principal" onClick={suivante}>
            {partie.index + 1 < total ? 'Étape suivante' : 'Voir le débriefing'}
          </button>
        </>
      )}
    </main>
  );
}

function EtapeOrdre({
  etape,
  arrangement,
  corrige,
  deplacer,
}: {
  etape: Extract<EtapeCas, { type: 'ordre' }>;
  arrangement: number[];
  corrige: boolean;
  deplacer: (rang: number, sens: -1 | 1) => void;
}) {
  return (
    <ol className="pile" style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Actions à ordonner">
      {arrangement.map((origine, rang) => {
        const texte = etape.elements[origine]!;
        const bienPlace = corrige && origine === rang;
        return (
          <li
            key={origine}
            className="ordre__element"
            style={corrige ? { border: `2px solid ${bienPlace ? 'var(--juste)' : 'var(--faux)'}` } : undefined}
          >
            <span className="ordre__rang" aria-hidden="true">
              {rang + 1}
            </span>
            <span className="ordre__texte">
              {texte}
              {corrige && <span className="visuellement-cache">{bienPlace ? ' (bien placé)' : ' (mal placé)'}</span>}
            </span>
            {!corrige && (
              <span className="ordre__boutons">
                <button type="button" className="bouton-rond" aria-label={`Monter « ${texte} »`} disabled={rang === 0} onClick={() => deplacer(rang, -1)}>
                  <IconeHaut taille={18} />
                </button>
                <button
                  type="button"
                  className="bouton-rond"
                  aria-label={`Descendre « ${texte} »`}
                  disabled={rang === arrangement.length - 1}
                  onClick={() => deplacer(rang, 1)}
                >
                  <IconeBas taille={18} />
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function RetourEtape({ etape, choisies }: { etape: EtapeCas; choisies: readonly number[] }) {
  if (etape.type === 'ordre') {
    return (
      <div className="pile" style={{ gap: 6 }}>
        <div style={{ fontWeight: 600 }}>Ordre attendu :</div>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {etape.elements.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ol>
        <p>{etape.retour}</p>
      </div>
    );
  }
  // Retours des propositions choisies, puis des bonnes propositions oubliées.
  const concernees = etape.propositions.flatMap((p, i) => (choisies.includes(i) || p.correct ? [{ ...p, choisie: choisies.includes(i) }] : []));
  return (
    <ul className="pile" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 8 }}>
      {concernees.map((p, i) => (
        <li key={i}>
          <strong>
            {p.choisie ? '' : etape.type === 'choix' ? 'Il fallait\u202f: ' : 'Oublié\u202f: '}
            {p.texte}
          </strong>{' '}
          — {p.retour}
        </li>
      ))}
    </ul>
  );
}
