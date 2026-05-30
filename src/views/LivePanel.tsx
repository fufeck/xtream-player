import { useMemo, useCallback, useState } from 'react';
import { Panel, Header } from '@enact/sandstone/Panels';
import { VirtualList } from '@enact/sandstone/VirtualList';
import Item from '@enact/sandstone/Item';
import Input from '@enact/sandstone/Input';
import BodyText from '@enact/sandstone/BodyText';
import Icon from '@enact/sandstone/Icon';
import { useNavigate } from 'react-router-dom';
import ri from '@enact/ui/resolution';

import { useApp } from '../context/AppContext';
import { extractGroups } from '../services/playlistService';
import CategoryFilter from '../components/CategoryFilter';

type ItemRendererArgs = { index: number; style: React.CSSProperties } & Record<string, unknown>;

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const LivePanel = () => {
  const navigate = useNavigate();
  const { channels } = useApp();
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const handleQueryChange = useCallback(
    ({ value }: { value: string }) => setQuery(value),
    [],
  );

  const groups = useMemo(
    () => extractGroups(channels.filter((c) => c.category === 'lives')),
    [channels],
  );

  const filteredChannels = useMemo(() => {
    const liveChannels = channels.filter((c) => c.category === 'lives');
    const grouped = selectedGroup ? liveChannels.filter((c) => c.group === selectedGroup) : liveChannels;
    if (!query.trim()) return grouped;
    const q = normalize(query.trim());
    return grouped.filter((c) => normalize(c.name).includes(q));
  }, [channels, query, selectedGroup]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleItemClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const idx = Number((e.currentTarget as HTMLElement).dataset.index);
      const channel = filteredChannels[idx];
      if (channel) navigate(`/lives/player/${channel.id}`);
    },
    [filteredChannels, navigate],
  );

  const renderItem = useCallback(
    ({ index, style, ...rest }: ItemRendererArgs) => {
      const channel = filteredChannels[index as number];
      if (!channel) return null;
      const logo = channel.logo
        ? (
          <img
            src={channel.logo}
            alt=""
            style={{
              width: ri.scale(56),
              height: ri.scale(56),
              objectFit: 'contain',
              borderRadius: ri.scale(4),
            }}
          />
        )
        : <Icon>playcircle</Icon>;

      return (
        <Item
          {...(rest as React.HTMLAttributes<HTMLElement>)}
          style={style as React.CSSProperties}
          slotBefore={logo}
          onClick={handleItemClick}
          data-index={index as number}
        >
          {channel.name}
        </Item>
      );
    },
    [filteredChannels, handleItemClick],
  );

  const subtitle = `${filteredChannels.length} chaîne${filteredChannels.length > 1 ? 's' : ''}`;

  return (
    <Panel noCloseButton onBack={handleBack}>
      <Header title="Chaînes TV" subtitle={subtitle} onBack={handleBack} />
      <div style={{ display: 'flex', height: 'calc(100vh - 300px)' }}>
        <CategoryFilter
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Input
            spotlightId="live-search-input"
            placeholder="Rechercher une chaîne…"
            value={query}
            onChange={handleQueryChange}
            style={{ width: '100%' }}
          />
          {filteredChannels.length === 0 && (
            <div style={{ padding: '2rem' }}>
              <BodyText centered>Aucune chaîne trouvée.</BodyText>
            </div>
          )}
          {filteredChannels.length > 0 && (
            <VirtualList
              dataSize={filteredChannels.length}
              itemRenderer={renderItem}
              itemSize={ri.scale(96)}
              style={{ height: 'calc(100vh - 400px)' }}
            />
          )}
        </div>
      </div>
    </Panel>
  );
};

export default LivePanel;
