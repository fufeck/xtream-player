import { useMemo, useCallback } from 'react';
import VideoPlayer from '@enact/sandstone/VideoPlayer';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { useApp } from '../context/AppContext';
import { CategoryType } from '../types';

interface PlayerPanelProps {
  type: CategoryType;
}

interface PlayerChannel {
  url: string | null;
  name: string;
}

const PlayerPanel = ({ type }: PlayerPanelProps) => {
  const navigate = useNavigate();
  const { stream_id } = useParams<{ stream_id: string }>();
  const { state } = useLocation() as { state: { url: string; name: string } | null };
  const { channels } = useApp();

  const channel = useMemo((): PlayerChannel | null => {
    if (type === 'series') {
      return state ? { url: state.url, name: state.name } : null;
    }
    return channels.find((c) => c.category === type && c.id === stream_id) || null;
  }, [type, stream_id, state, channels]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  if (!channel) {
    return <div style={{ position: 'fixed', inset: 0, background: '#000' }} />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <VideoPlayer
        title={channel.name}
        backButtonAriaLabel="Retour"
        onBack={handleBack}
        noAutoPlay={false}
      >
        <source src={channel.url || undefined} />
      </VideoPlayer>
    </div>
  );
};

export default PlayerPanel;
