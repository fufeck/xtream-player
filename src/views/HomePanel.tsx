import { useCallback, useMemo, useEffect } from 'react';
import { Panel, Header } from '@enact/sandstone/Panels';
import Button from '@enact/sandstone/Button';
import Spinner from '@enact/sandstone/Spinner';
import BodyText from '@enact/sandstone/BodyText';
import { useNavigate } from 'react-router-dom';
import ri from '@enact/ui/resolution';

import { CATEGORIES } from '../config';
import { useApp } from '../context/AppContext';
import { clearCredentials } from '../services/credentialsService';
import { Category, CategoryType } from '../types';

const CATEGORY_ROUTES: Record<CategoryType, string> = {
  lives: '/lives',
  movies: '/movies',
  series: '/series',
};

interface CategoryCardProps {
  category: Category;
  count: number | null;
  onClick: (id: CategoryType) => void;
}

const CategoryCard = ({ category, count, onClick }: CategoryCardProps) => {
  const handleClick = useCallback(
    () => onClick(category.id),
    [category.id, onClick],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Button
        size="large"
        icon={category.icon}
        onClick={handleClick}
        style={{ width: ri.scale(380), height: ri.scale(200) }}
      >
        {category.label}
      </Button>
      {count !== null && (
        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 24 }}>
          {count > 0 ? `${count.toLocaleString('fr')} éléments` : 'Aucun élément'}
        </span>
      )}
    </div>
  );
};

const HomePanel = () => {
  const navigate = useNavigate();
  const { channels, loading, error, refresh } = useApp();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogout = useCallback(() => {
    clearCredentials();
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleSelect = useCallback(
    (id: CategoryType) => {
      const route = CATEGORY_ROUTES[id];
      if (route) navigate(route);
    },
    [navigate],
  );

  const counts = useMemo(() => {
    const map: Record<CategoryType, number> = { lives: 0, movies: 0, series: 0 };
    channels.forEach((ch) => {
      map[ch.category]++;
    });
    return map;
  }, [channels]);

  const subtitle = loading
    ? 'Chargement de la playlist…'
    : error
      ? 'Erreur de chargement'
      : 'Playlist chargée';

  return (
    <Panel noCloseButton>
      <Header title="IPTV Player" subtitle={subtitle} />
      <div style={{ position: 'fixed', top: 24, right: 36, zIndex: 100 }}>
        <Button icon="logout" onClick={handleLogout} />
      </div>

      {loading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100vh - 200px)',
          }}
        >
          <Spinner>Chargement de la playlist…</Spinner>
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: ri.scale(24),
            height: 'calc(100vh - 200px)',
          }}
        >
          <BodyText centered>{`Impossible de charger la playlist : ${error}`}</BodyText>
          <Button onClick={refresh}>Réessayer</Button>
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 48,
            height: 'calc(100vh - 200px)',
          }}
        >
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              count={counts[cat.id] ?? null}
              onClick={handleSelect}
            />
          ))}
        </div>
      )}
    </Panel>
  );
};

export default HomePanel;
