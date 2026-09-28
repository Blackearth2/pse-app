import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useContenu, useProgression } from '../../app/contextes';
import { IconeFleche, IconeHorloge } from '../../ui/Icones';
import { questionsDuPerimetre, TAILLE_SERIE, type Perimetre } from './logique';

type Choix = 'tout' | 'PSE1' | 'PSE2' | 'nouveautes' | 'chapitre';

export function ChoixQcm() {
  const { fiches, chapitres } = useContenu();
  const { progression } = useProgression();
  const navigate = useNavigate();
  const [choix, setChoix] = useState<Choix>('tout');
  const chapitresAvecQuestions = chapitres.filter((c) => questionsDuPerimetre(fiches, { type: 'chapitre', chapitre: c.id }).length > 0);
  const [chapitre, setChapitre] = useState(chapitresAvecQuestions[0]?.id ?? '');

  const perimetreDe = (c: Choix): Perimetre =>
    c === 'tout'
      ? { type: 'tout' }
      : c === 'nouveautes'
        ? { type: 'nouveautes' }
        : c === 'chapitre'
          ? { type: 'chapitre', chapitre }
          : { type: 'niveau', niveau: c };
  const compte = (c: Choix) => questionsDuPerimetre(fiches, perimetreDe(c)).length;

  const modes: { valeur: Choix; libelle: string; description: string }[] = [
    { valeur: 'tout', libelle: 'Tout le programme', description: 'PSE1 et PSE2' },
    { valeur: 'PSE1', libelle: 'PSE1', description: 'Premiers secours en équipe, niveau 1' },
    { valeur: 'PSE2', libelle: 'PSE2', description: 'Premiers secours en équipe, niveau 2' },
    { valeur: 'nouveautes', libelle: 'Nouveautés 2026', description: 'Uniquement ce qui change' },
    { valeur: 'chapitre', libelle: 'Un chapitre', description: 'Au choix dans la liste' },
  ];
  const disponibles = compte(choix);
  const nbErreurs = progression.erreurs.length;

  return (
    <main className="page">
      <h1 className="titre-page">
        Entraînement
        <br />
        QCM
      </h1>
      <p className="texte">Séries de {TAILLE_SERIE} questions tirées au hasard, correction immédiate et explication pour chaque réponse.</p>

      <fieldset className="pile" style={{ border: 'none', margin: 0, padding: 0 }}>
        <legend className="titre-section" style={{ marginBottom: 10 }}>
          Sur quoi veux-tu t’entraîner ?
        </legend>
        {modes.map((m) => {
          const actif = choix === m.valeur;
          return (
            <label
              key={m.valeur}
              className="option"
              style={{ borderColor: actif ? 'var(--violet)' : 'var(--blanc)', background: actif ? 'var(--violet-clair)' : 'var(--blanc)', borderRadius: 22, cursor: 'pointer' }}
            >
              <input type="radio" name="perimetre" value={m.valeur} checked={actif} onChange={() => setChoix(m.valeur)} style={{ width: 20, height: 20, accentColor: 'var(--violet)' }} />
              <span className="option__texte" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{m.libelle}</span>
                <span className="discret">{m.description}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--violet-fonce)', whiteSpace: 'nowrap' }}>{compte(m.valeur)} Q.</span>
            </label>
          );
        })}
        {choix === 'chapitre' && (
          <label className="pile" style={{ gap: 6 }}>
            <span className="discret">Chapitre</span>
            <select
              value={chapitre}
              onChange={(e) => setChapitre(e.target.value)}
              style={{ minHeight: 48, borderRadius: 16, border: '2px solid var(--violet-clair)', padding: '0 12px', font: 'inherit', background: 'var(--blanc)' }}
            >
              {chapitresAvecQuestions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titre}
                </option>
              ))}
            </select>
          </label>
        )}
      </fieldset>

      <button
        type="button"
        className="bouton bouton--principal"
        disabled={disponibles === 0}
        onClick={() => navigate('/qcm/serie', { state: { mode: 'entrainement', perimetre: perimetreDe(choix) } })}
      >
        {disponibles === 0
          ? 'Aucune question disponible'
          : `Commencer (${Math.min(disponibles, TAILLE_SERIE)} question${Math.min(disponibles, TAILLE_SERIE) > 1 ? 's' : ''})`}
      </button>

      {nbErreurs > 0 && (
        <Link to="/qcm/serie" state={{ mode: 'erreurs' }} className="carte-lien carte--sable" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <span style={{ flexGrow: 1 }}>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 600 }}>Mes erreurs ({nbErreurs})</span>
            <span className="discret">Une question réussie ici sort de la liste.</span>
          </span>
          <span className="rond">
            <IconeFleche />
          </span>
        </Link>
      )}

      <Link to="/examen" className="carte-lien carte--vert" style={{ flexDirection: 'row', alignItems: 'center' }}>
        <span className="rond" style={{ color: 'var(--vert)' }}>
          <IconeHorloge />
        </span>
        <span style={{ flexGrow: 1 }}>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 600 }}>Examen blanc</span>
          <span className="discret">40 questions · 40 minutes · correction à la fin</span>
        </span>
        <IconeFleche />
      </Link>
    </main>
  );
}
