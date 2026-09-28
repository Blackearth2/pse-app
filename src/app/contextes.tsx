// Contextes React : contenu publié et progression de l'utilisateur.
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { ContenuPublie } from '../content/types';
import { MagasinProgression, type EtatProgression } from '../store/magasin';
import type { Progression } from '../store/progression';
import type { Stockage } from '../store/stockage';

const ContexteContenu = createContext<ContenuPublie | null>(null);
const ContexteMagasin = createContext<MagasinProgression | null>(null);

export function Fournisseurs({ contenu, stockage, children }: { contenu: ContenuPublie; stockage: Stockage; children: ReactNode }) {
  const [magasin] = useState(() => new MagasinProgression(stockage, contenu));
  return (
    <ContexteContenu.Provider value={contenu}>
      <ContexteMagasin.Provider value={magasin}>{children}</ContexteMagasin.Provider>
    </ContexteContenu.Provider>
  );
}

export function useContenu(): ContenuPublie {
  const c = useContext(ContexteContenu);
  if (!c) throw new Error('useContenu doit être utilisé dans <Fournisseurs>');
  return c;
}

export function useProgression(): EtatProgression & { modifier: (f: (p: Progression) => Progression) => void } {
  const m = useContext(ContexteMagasin);
  if (!m) throw new Error('useProgression doit être utilisé dans <Fournisseurs>');
  const etat = useSyncExternalStore(m.abonner, m.lire);
  return { ...etat, modifier: m.modifier };
}
