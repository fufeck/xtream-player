import { useMemo, useCallback, useState, useRef } from "react";
import { Panel, Header } from "@enact/sandstone/Panels";
import { VirtualList } from "@enact/sandstone/VirtualList";
import Item from "@enact/sandstone/Item";
import BodyText from "@enact/sandstone/BodyText";
import Icon from "@enact/sandstone/Icon";
import Image from "@enact/sandstone/Image";
import { useNavigate } from "react-router-dom";
import ri from "@enact/ui/resolution";

import { useApp } from "../context/AppContext";
import { extractGroups } from "../services/playlistService";
import { getFavoriteIds, toggleFavorite } from "../services/favoritesService";
import CategoryFilter from "../components/CategoryFilter";

type ItemRendererArgs = { index: number; style: React.CSSProperties } & Record<
  string,
  unknown
>;

const FAVORITES_GROUP = "__favorites__";

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const LivePanel = () => {
  const navigate = useNavigate();
  const { channels } = useApp();
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActiveRef = useRef(false);

  const handleQueryChange = useCallback(
    ({ value }: { value: string }) => setQuery(value),
    [],
  );

  const groups = useMemo(
    () => extractGroups(channels.filter((c) => c.category === "lives")),
    [channels],
  );

  const favoriteIds = useMemo(() => getFavoriteIds(), [favoritesVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredChannels = useMemo(() => {
    const liveChannels = channels.filter((c) => c.category === "lives");
    let grouped = liveChannels;
    if (selectedGroup === FAVORITES_GROUP) {
      const favIds = getFavoriteIds();
      grouped = liveChannels.filter((c) => favIds.includes(c.id));
    } else if (selectedGroup) {
      grouped = liveChannels.filter((c) => c.group === selectedGroup);
    }
    if (!query.trim()) return grouped;
    const q = normalize(query.trim());
    return grouped.filter((c) => normalize(c.name).includes(q));
  }, [channels, query, selectedGroup, favoritesVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleItemClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (longPressActiveRef.current) {
        longPressActiveRef.current = false;
        return;
      }
      const idx = Number((e.currentTarget as HTMLElement).dataset.index);
      const channel = filteredChannels[idx];
      if (channel) navigate(`/lives/player/${channel.id}`);
    },
    [filteredChannels, navigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key !== "Enter" || e.repeat) return;
      const idx = Number((e.currentTarget as HTMLElement).dataset.index);
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        const channel = filteredChannels[idx];
        if (channel) {
          longPressActiveRef.current = true;
          toggleFavorite(channel.id);
          setFavoritesVersion((v) => v + 1);
        }
      }, 700);
    },
    [filteredChannels],
  );

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter") return;
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const renderItem = useCallback(
    ({ index, style, ...rest }: ItemRendererArgs) => {
      const channel = filteredChannels[index as number];
      if (!channel) return null;
      const logo = channel.logo ? (
        <Image
          src={channel.logo}
          style={{
            width: ri.scale(56),
            height: ri.scale(56),
            borderRadius: ri.scale(4),
          }}
        />
      ) : (
        <Icon>playcircle</Icon>
      );

      const star = favoriteIds.includes(channel.id) ? (
        <Icon
          style={{
            color: "#e6b655",
          }}
        >
          star
        </Icon>
      ) : undefined;

      return (
        <Item
          {...(rest as React.HTMLAttributes<HTMLElement>)}
          style={style as React.CSSProperties}
          slotBefore={logo}
          slotAfter={star}
          onClick={handleItemClick}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          data-index={index as number}
        >
          {channel.name}
        </Item>
      );
    },
    [
      filteredChannels,
      favoriteIds,
      handleItemClick,
      handleKeyDown,
      handleKeyUp,
    ],
  );

  const subtitle = `${filteredChannels.length} chaîne${filteredChannels.length > 1 ? "s" : ""}`;

  return (
    <Panel noCloseButton onBack={handleBack}>
      <Header title="Chaînes TV" subtitle={subtitle} onBack={handleBack} />
      <div style={{ display: "flex", height: "calc(100vh - 300px)" }}>
        <CategoryFilter
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          query={query}
          onQueryChange={handleQueryChange}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {filteredChannels.length === 0 && (
            <div style={{ padding: "2rem" }}>
              <BodyText centered>Aucune chaîne trouvée.</BodyText>
            </div>
          )}
          {filteredChannels.length > 0 && (
            <VirtualList
              dataSize={filteredChannels.length}
              itemRenderer={renderItem}
              itemSize={ri.scale(96)}
              style={{ height: "calc(100vh - 400px)" }}
            />
          )}
        </div>
      </div>
    </Panel>
  );
};

export default LivePanel;
