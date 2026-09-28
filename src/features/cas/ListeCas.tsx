import { useState } from 'react';
import { Link } from 'react-router';
import { useContenu, useProgression } from '../../app/contextes';
import type { Niveau } from '../../content/types';
import { EtiquetteBrouillon } from '../../ui/composants';
import { IconeFleche } from '../../ui/Icones';

const TEINTES = [
  { fond: 'var(--violet-clair)', sous: 'var(--violet-fonce)' },
  { fond: 'var(--vert-clair)', sous: 'var(--vert-fonce)' },
];

export function ListeCas() {
  const { cas } = useContenu();
  const { progression } = useProgression();
  const [niveau, setNiveau] = useState<Niveau | 'tous'>('tous');
  const liste = cas.filter((c) => niveau === 'tous' || c.niveau === niveau);

  return (
    <main className="page">
      <h1 className="titre-page">
        Cas
        <br />
        pratiques
      </h1>
      <p className="texte">Mets-toi en situation d’intervention : à chaque étape, choisis la bonne action.</p>
      <div className="puces" role="group" aria-label="Niveau">
        {(['tous', 'PSE1', 'PSE2'] as const).map((n) => (
          <button key={n} type="button" className="puce" aria-pressed={niveau === n} onClick={() => setNiveau(n)}>
            {n === 'tous' ? 'Tous' : n}
          </button>
        ))}
      </div>
      {liste.length === 0 && <p className="texte">{cas.length === 0 ? 'Aucun cas publié pour l’instant.' : 'Aucun cas pour ce niveau.'}</p>}
      {liste.map((c, i) => {
        const t = TEINTES[i % 2]!;
        const fait = progression.cas[c.id];
        return (
          <Link key={c.id} to={`/cas/${c.id}`} className="carte-lien" style={{ background: t.fond }}>
            <div className="ligne" style={{ justifyContent: 'space-between' }}>
              <div className="ligne" style={{ gap: 6 }}>
                <span className="etiquette">{c.niveau}</span>
                <span className="etiquette etiquette--discrete">{c.etapes.length} étapes</span>
                {c.statut === 'brouillon' && <EtiquetteBrouillon />}
              </div>
              {fait && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--vert-fonce)' }}>
                  Fait · {fait.dernier}/{fait.total}
                </span>
              )}
            </div>
            <div className="carte-lien__bas">
              <span className="pile" style={{ gap: 4 }}>
                <span className="carte-lien__titre">{c.titre}</span>
                <span style={{ fontSize: 12, lineHeight: 1.45, color: t.sous }}>{c.lieu}</span>
              </span>
              <span className="rond">
                <IconeFleche taille={18} />
              </span>
            </div>
          </Link>
        );
      })}
    </main>
  );
}
