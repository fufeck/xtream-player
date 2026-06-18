import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { Panel, Header } from "@enact/sandstone/Panels";
import { VirtualGridList } from "@enact/sandstone/VirtualList";
import BodyText from "@enact/sandstone/BodyText";
import ActionGuide from "@enact/sandstone/ActionGuide";
import { useNavigate, useOutlet } from "react-router-dom";
import ri from "@enact/ui/resolution";
import Icon from "@enact/sandstone/Icon";
import Image from "@enact/sandstone/Image";

import { CATEGORIES } from "../config";
import { useApp } from "../context/AppContext";
import { CategoryType } from "../types";
import ImageItem from "@enact/sandstone/ImageItem";
import { extractGroups } from "../services/playlistService";
import { getFavoriteIds, toggleFavorite } from "../services/favoritesService";
import CategoryFilter from "../components/CategoryFilter";
import HiddenWhilePlaying from "../components/HiddenWhilePlaying";
import { useRestoreFocusOnReturn } from "../hooks/useRestoreFocusOnReturn";
import logoTitle from "../assets/logo-title.png";

interface PosterPanelProps {
  category: CategoryType;
}

type ItemRendererArgs = { index: number; style: React.CSSProperties } & Record<
  string,
  unknown
>;

const FAVORITES_GROUP = "__favorites__";

type ScrollTo = (opts: { align?: string; animate?: boolean }) => void;

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
);

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const PosterPanel = ({ category }: PosterPanelProps) => {
  const navigate = useNavigate();
  const outlet = useOutlet();
  const containerId = `poster-panel-${category}`;
  useRestoreFocusOnReturn(containerId, !!outlet);
  const { channels } = useApp();
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActiveRef = useRef(false);
  const scrollToRef = useRef<ScrollTo | null>(null);

  useEffect(() => {
    scrollToRef.current?.({ align: "top", animate: false });
  }, [selectedGroup]);

  const handleQueryChange = useCallback(
    ({ value }: { value: string }) => setQuery(value),
    [],
  );

  const handleScrollTo = useCallback((fn: ScrollTo) => {
    scrollToRef.current = fn;
  }, []);

  const groups = useMemo(
    () => extractGroups(channels.filter((c) => c.category === category)),
    [channels, category],
  );

  const favoriteIds = useMemo(() => getFavoriteIds(), [favoritesVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredChannels = useMemo(() => {
    const byCategory = channels.filter((c) => c.category === category);
    let grouped = byCategory;
    if (selectedGroup === FAVORITES_GROUP) {
      const favIds = getFavoriteIds();
      grouped = byCategory.filter((c) => favIds.includes(c.id));
    } else if (selectedGroup) {
      grouped = byCategory.filter((c) => c.group === selectedGroup);
    }
    if (!query.trim()) return grouped;
    const q = normalize(query.trim());
    return grouped.filter((c) => normalize(c.name).includes(q));
  }, [channels, category, query, selectedGroup, favoritesVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleItemClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (longPressActiveRef.current) {
        longPressActiveRef.current = false;
        return;
      }
      const idx = Number(e.currentTarget.dataset.index);
      const channel = filteredChannels[idx];
      if (!channel) return;
      if (channel.category === "series") {
        navigate(`/series/${channel.series_id}`);
      } else if (channel.category === "movies") {
        navigate(`/movies/player/${channel.id}`);
      } else {
        navigate(`/lives/player/${channel.id}`);
      }
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
    ({ index }: ItemRendererArgs) => {
      const channel = filteredChannels[index as number];
      if (!channel) return null;
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <ImageItem
            src={channel.logo}
            label={channel.name}
            onClick={handleItemClick}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            data-index={index as number}
          />
          {favoriteIds.includes(channel.id) && (
            <Icon
              style={{
                position: "absolute",
                top: ri.scale(16),
                right: ri.scale(48),
                color: "#e6b655",
              }}
            >
              star
            </Icon>
          )}
        </div>
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

  const title = CATEGORY_LABELS[category] || "IPTV Player";

  return (
    <>
      <HiddenWhilePlaying hidden={!!outlet} containerId={containerId}>
        <Panel noCloseButton onBack={handleBack}>
          <Header
            title={title}
            noSubtitle
            onBack={handleBack}
            slotBefore={
              <Image
                src={logoTitle}
                sizing="fit"
                style={{ width: ri.scale(320), height: ri.scale(150) }}
              />
            }
          />
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
                  <BodyText centered>Aucun contenu trouvé.</BodyText>
                </div>
              )}
              {filteredChannels.length > 0 && (
                <VirtualGridList
                  dataSize={filteredChannels.length}
                  itemRenderer={renderItem}
                  itemSize={{ minWidth: ri.scale(500), minHeight: ri.scale(750) }}
                  spacing={ri.scale(8)}
                  style={{ height: "calc(100vh - 400px)" }}
                  cbScrollTo={handleScrollTo}
                />
              )}
              <ActionGuide icon="arrowlargedown">
                Naviguer avec les touches directionnelles
              </ActionGuide>
            </div>
          </div>
        </Panel>
      </HiddenWhilePlaying>
      {outlet}
    </>
  );
};

export default PosterPanel;
