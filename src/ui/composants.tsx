// Composants d'interface communs.
import type { ReactNode } from 'react';
import type { Niveau } from '../content/types';
import { IconeCoche, IconeCroixFaux } from './Icones';

export const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];

export function EtiquetteNiveau({ niveau }: { niveau: Niveau }) {
  return <span className={`etiquette etiquette--${niveau.toLowerCase()}`}>{niveau}</span>;
}

export function EtiquetteNouveau({ court = false }: { court?: boolean }) {
  return <span className="etiquette etiquette--nouveau">{court ? '2026' : 'Nouveau 2026'}</span>;
}

export function EtiquetteBrouillon() {
  return <span className="etiquette etiquette--brouillon">Brouillon</span>;
}

export function Jauge({ pourcent, variante, libelle }: { pourcent: number; variante?: 'vert' | 'blanche'; libelle: string }) {
  const p = Math.max(0, Math.min(100, Math.round(pourcent)));
  return (
    <div
      className={`jauge${variante ? ` jauge--${variante}` : ''}`}
      role="progressbar"
      aria-label={libelle}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={p}
    >
      <div className="jauge__valeur" style={{ width: `${p}%` }} />
    </div>
  );
}

/** En-tête d'un exercice : bouton de sortie, intitulé, compteur et jauge. */
export function EnteteExercice(props: {
  sortie: ReactNode;
  intitule: string;
  compteur: ReactNode;
  pourcent: number;
  variante?: 'vert';
}) {
  return (
    <div className="entete-exercice">
      {props.sortie}
      <div className="entete-exercice__suivi">
        <div className="entete-exercice__legende">
          <span>{props.intitule}</span>
          <span>{props.compteur}</span>
        </div>
        <Jauge pourcent={props.pourcent} variante={props.variante} libelle="Avancement" />
      </div>
    </div>
  );
}

export type EtatOption = 'neutre' | 'coche' | 'juste' | 'faux' | 'attenue';

/**
 * États d'affichage des propositions.
 * @param ordre ordre d'affichage (`ordre[position]` = indice d'origine)
 * @param bonnes indices d'origine des bonnes réponses
 * @param selection positions affichées cochées
 */
export function etatsOptions(ordre: readonly number[], bonnes: readonly number[], selection: readonly number[], corrige: boolean): EtatOption[] {
  return ordre.map((origine, position) => {
    const coche = selection.includes(position);
    if (!corrige) return coche ? 'coche' : 'neutre';
    if (bonnes.includes(origine)) return 'juste';
    return coche ? 'faux' : 'attenue';
  });
}

export function Options(props: {
  libelles: readonly string[];
  etats: readonly EtatOption[];
  multiple: boolean;
  desactive: boolean;
  legende: string;
  onChoisir: (position: number) => void;
}) {
  return (
    <ul className="options" aria-label={props.legende}>
      {props.libelles.map((libelle, position) => {
        const etat = props.etats[position] ?? 'neutre';
        return (
          <li key={position}>
            <button
              type="button"
              className={`option option--${etat}`}
              aria-pressed={props.multiple && !props.desactive ? etat === 'coche' : undefined}
              disabled={props.desactive}
              onClick={() => props.onChoisir(position)}
            >
              <span className="option__lettre" aria-hidden="true">
                {LETTRES[position]}
              </span>
              <span className="option__texte">{libelle}</span>
              {etat === 'juste' && (
                <span className="option__verdict" style={{ color: 'var(--juste)' }}>
                  <IconeCoche taille={16} /> <span>Bonne réponse</span>
                </span>
              )}
              {etat === 'faux' && (
                <span className="option__verdict" style={{ color: 'var(--faux)' }}>
                  <IconeCroixFaux taille={16} /> <span>Ta réponse</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Correction affichée après une réponse (annoncée aux lecteurs d'écran). */
export function Retour({ juste, titre, children }: { juste: boolean; titre: string; children: ReactNode }) {
  return (
    <div className={`retour retour--${juste ? 'juste' : 'faux'}`} role="status">
      <div className="retour__titre">{titre}</div>
      <div>{children}</div>
    </div>
  );
}
