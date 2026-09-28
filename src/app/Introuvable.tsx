import { Link } from 'react-router';

export function Introuvable() {
  return (
    <main className="page">
      <h1 className="titre-page">Introuvable</h1>
      <p className="texte">Cette page n’existe pas, ou ce contenu n’est plus publié.</p>
      <Link to="/" className="bouton bouton--principal">
        Retour à l’accueil
      </Link>
    </main>
  );
}
