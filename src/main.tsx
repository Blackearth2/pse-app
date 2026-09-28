import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import './ui/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import contenu from 'virtual:contenu';
import { App } from './app/App';
import { Fournisseurs } from './app/contextes';
import { creerStockage, stockageNavigateur } from './store/stockage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Fournisseurs contenu={contenu} stockage={creerStockage(stockageNavigateur())}>
      <App />
    </Fournisseurs>
  </StrictMode>,
);
