import { Component, useEffect, type ReactNode } from 'react';
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router';
import { Accueil } from '../features/accueil/Accueil';
import { APropos } from '../features/accueil/APropos';
import { DeroulerCas } from '../features/cas/DeroulerCas';
import { ListeCas } from '../features/cas/ListeCas';
import { Examen } from '../features/examen/Examen';
import { DetailFiche } from '../features/fiches/DetailFiche';
import { ListeFiches } from '../features/fiches/ListeFiches';
import { ChoixQcm } from '../features/qcm/ChoixQcm';
import { Serie } from '../features/qcm/Serie';
import { IconeAccueil, IconeCas, IconeFiches, IconeQcm } from '../ui/Icones';
import { useProgression } from './contextes';
import { Introuvable } from './Introuvable';

const ONGLETS = [
  { vers: '/', libelle: 'Accueil', icone: <IconeAccueil taille={22} />, actif: (p: string) => p === '/' || p === '/a-propos' },
  { vers: '/fiches', libelle: 'Fiches', icone: <IconeFiches taille={22} />, actif: (p: string) => p.startsWith('/fiches') },
  { vers: '/qcm', libelle: 'QCM', icone: <IconeQcm taille={22} />, actif: (p: string) => p.startsWith('/qcm') || p.startsWith('/examen') },
  { vers: '/cas', libelle: 'Cas', icone: <IconeCas taille={22} />, actif: (p: string) => p.startsWith('/cas') },
];

function Navigation() {
  const { pathname } = useLocation();
  return (
    <nav className="nav" aria-label="Navigation principale">
      {ONGLETS.map((o) => (
        <Link key={o.vers} to={o.vers} className="nav__lien" aria-current={o.actif(pathname) ? 'page' : undefined}>
          {o.icone}
          {o.libelle}
        </Link>
      ))}
    </nav>
  );
}

function RemonterEnHaut() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function BandeauStockage() {
  const { disponible } = useProgression();
  if (disponible) return null;
  return (
    <div className="bandeau bandeau--alerte" role="status">
      Ta progression ne sera pas conservée sur cet appareil (stockage du navigateur indisponible).
    </div>
  );
}

class LimiteErreur extends Component<{ children: ReactNode }, { erreur: boolean }> {
  state = { erreur: false };
  static getDerivedStateFromError() {
    return { erreur: true };
  }
  render() {
    if (!this.state.erreur) return this.props.children;
    return (
      <main className="page">
        <h1 className="titre-page">Un problème est survenu</h1>
        <p className="texte">L’affichage a rencontré une erreur. Ta progression est conservée.</p>
        <button type="button" className="bouton bouton--principal" onClick={() => window.location.reload()}>
          Recharger
        </button>
      </main>
    );
  }
}

export function App({ bandeauMiseAJour }: { bandeauMiseAJour?: ReactNode }) {
  return (
    <HashRouter>
      <RemonterEnHaut />
      <div className="app">
        {bandeauMiseAJour}
        <BandeauStockage />
        <LimiteErreur>
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/fiches" element={<ListeFiches />} />
            <Route path="/fiches/:id" element={<DetailFiche />} />
            <Route path="/qcm" element={<ChoixQcm />} />
            <Route path="/qcm/serie" element={<Serie />} />
            <Route path="/examen" element={<Examen />} />
            <Route path="/cas" element={<ListeCas />} />
            <Route path="/cas/:id" element={<DeroulerCas />} />
            <Route path="*" element={<Introuvable />} />
          </Routes>
        </LimiteErreur>
        <Navigation />
      </div>
    </HashRouter>
  );
}
