import { Link } from 'react-router';
import type { Fiche } from '../../content/types';
import { EtiquetteBrouillon, EtiquetteNouveau } from '../../ui/composants';
import { IconeCoche, IconeEtoile, IconeFleche } from '../../ui/Icones';

const TEINTES = [
  { fond: 'var(--violet-clair)', sous: 'var(--violet-fonce)' },
  { fond: 'var(--vert-clair)', sous: 'var(--vert-fonce)' },
];

export function CarteFiche({ fiche, rang, lue, favori, sousTitre }: { fiche: Fiche; rang: number; lue: boolean; favori: boolean; sousTitre?: string }) {
  const t = TEINTES[rang % 2]!;
  return (
    <Link to={`/fiches/${fiche.id}`} className="carte-lien" style={{ background: t.fond }}>
      <div className="ligne" style={{ justifyContent: 'space-between' }}>
        <div className="ligne" style={{ gap: 6, flexWrap: 'wrap' }}>
          <span className="etiquette">{fiche.niveau}</span>
          {fiche.estNouveaute && <EtiquetteNouveau />}
          {fiche.statut === 'brouillon' && <EtiquetteBrouillon />}
        </div>
        <div className="ligne" style={{ gap: 8 }}>
          {favori && (
            <span style={{ color: 'var(--sable-fonce)', display: 'flex' }} title="Favori">
              <IconeEtoile taille={16} pleine />
              <span className="visuellement-cache">Favori</span>
            </span>
          )}
          {lue && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--vert-fonce)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconeCoche taille={14} />
              Lue
            </span>
          )}
        </div>
      </div>
      {sousTitre && <div style={{ fontSize: 12, color: t.sous }}>{sousTitre}</div>}
      <div className="carte-lien__bas">
        <span className="carte-lien__titre">{fiche.titre}</span>
        <span className="rond">
          <IconeFleche taille={18} />
        </span>
      </div>
    </Link>
  );
}
