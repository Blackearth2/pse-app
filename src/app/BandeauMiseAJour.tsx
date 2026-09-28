// Bandeau proposé quand une nouvelle version est disponible (§ 9) : l'utilisateur choisit quand recharger.
import { useRegisterSW } from 'virtual:pwa-register/react';

export function BandeauMiseAJour() {
  const {
    needRefresh: [nouvelleVersion, setNouvelleVersion],
    updateServiceWorker,
  } = useRegisterSW();

  if (!nouvelleVersion) return null;
  return (
    <div className="bandeau bandeau--info" role="status">
      <span>Nouvelle version du contenu disponible.</span>
      <span className="ligne" style={{ gap: 6 }}>
        <button type="button" className="bouton bouton--principal bouton--petit" onClick={() => void updateServiceWorker(true)}>
          Recharger
        </button>
        <button type="button" className="bouton bouton--secondaire bouton--petit" onClick={() => setNouvelleVersion(false)}>
          Plus tard
        </button>
      </span>
    </div>
  );
}
