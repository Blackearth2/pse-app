import type { Fiche, Question } from '../../content/types';
import { EtiquetteBrouillon, EtiquetteNouveau } from '../../ui/composants';

/** En-tête d'une question : niveau, chapitre, badges et énoncé. */
export function CarteQuestion({ question, fiche, chapitre }: { question: Question; fiche: Fiche; chapitre: string }) {
  const multiple = question.bonnes.length > 1;
  return (
    <div className="carte carte--violet" style={{ borderRadius: 28, padding: 22 }}>
      <div className="ligne" style={{ gap: 6, flexWrap: 'wrap' }}>
        <span className="etiquette">{fiche.niveau}</span>
        <span className="etiquette etiquette--discrete">{chapitre}</span>
        {question.nouveaute && <EtiquetteNouveau court />}
        {fiche.statut === 'brouillon' && <EtiquetteBrouillon />}
      </div>
      <h1 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.4 }}>{question.enonce}</h1>
      {multiple && (
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--violet-fonce)' }}>Plusieurs réponses possibles.</p>
      )}
    </div>
  );
}
