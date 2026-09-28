import type { Bloc as TypeBloc } from '../../content/types';

export function Bloc({ bloc }: { bloc: TypeBloc }) {
  switch (bloc.type) {
    case 'texte':
      return (
        <section className="pile">
          {bloc.titre && <h2 className="bloc-titre">{bloc.titre}</h2>}
          {bloc.contenu.split(/\n\s*\n/).map((p, i) => (
            <p key={i} className="texte">
              {p}
            </p>
          ))}
        </section>
      );
    case 'chiffres':
      return (
        <section className="pile">
          {bloc.titre && <h2 className="bloc-titre">{bloc.titre}</h2>}
          <dl className="grille-2" style={{ margin: 0, gap: 10 }}>
            {bloc.items.map((c, i) => (
              <div key={i} className="chiffre" style={{ padding: 14, gap: 4 }}>
                <dt className="chiffre__libelle" style={{ order: 2 }}>
                  {c.libelle}
                </dt>
                <dd className="chiffre__valeur" style={{ margin: 0, fontSize: 18, color: 'var(--violet-fonce)', order: 1 }}>
                  {c.valeur}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case 'etapes':
      return (
        <section className="carte">
          {bloc.titre && <h2 className="bloc-titre">{bloc.titre}</h2>}
          <ol className="etapes">
            {bloc.items.map((t, i) => (
              <li key={i}>
                <span style={{ paddingTop: 2 }}>{t}</span>
              </li>
            ))}
          </ol>
        </section>
      );
    case 'liste':
    case 'attention':
    case 'nouveaute': {
      const classe = bloc.type === 'attention' ? 'carte carte--attention' : bloc.type === 'nouveaute' ? 'carte carte--sable' : 'carte';
      const titre = bloc.titre ?? (bloc.type === 'attention' ? 'Attention' : bloc.type === 'nouveaute' ? 'Ce qui change en 2026' : undefined);
      return (
        <section className={classe}>
          {titre && <h2 className="bloc-titre">{titre}</h2>}
          <ul className="puces-texte">
            {bloc.items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      );
    }
  }
}
