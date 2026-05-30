import { useMemo, useCallback, useState } from "react";
import { Panel, Header } from "@enact/sandstone/Panels";
import { VirtualGridList } from "@enact/sandstone/VirtualList";
import BodyText from "@enact/sandstone/BodyText";
import ActionGuide from "@enact/sandstone/ActionGuide";
import { useNavigate } from "react-router-dom";
import ri from "@enact/ui/resolution";

import { CATEGORIES } from "../config";
import { useApp } from "../context/AppContext";
import { CategoryType } from "../types";
import ImageItem from "@enact/sandstone/ImageItem";
import { extractGroups } from "../services/playlistService";
import CategoryFilter from "../components/CategoryFilter";

interface PosterPanelProps {
  category: CategoryType;
}

type ItemRendererArgs = { index: number; style: React.CSSProperties } & Record<
  string,
  unknown
>;

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
);

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const PosterPanel = ({ category }: PosterPanelProps) => {
  const navigate = useNavigate();
  const { channels } = useApp();
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const handleQueryChange = useCallback(
    ({ value }: { value: string }) => setQuery(value),
    [],
  );

  const groups = useMemo(
    () => extractGroups(channels.filter((c) => c.category === category)),
    [channels, category],
  );

  const filteredChannels = useMemo(() => {
    const byCategory = channels.filter((c) => c.category === category);
    const grouped = selectedGroup
      ? byCategory.filter((c) => c.group === selectedGroup)
      : byCategory;
    if (!query.trim()) return grouped;
    const q = normalize(query.trim());
    return grouped.filter((c) => normalize(c.name).includes(q));
  }, [channels, category, query, selectedGroup]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleItemClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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

  const renderItem = useCallback(
    ({ index }: ItemRendererArgs) => {
      const channel = filteredChannels[index as number];
      if (!channel) return null;
      return (
        <ImageItem
          src={channel.logo}
          label={channel.name}
          onClick={handleItemClick}
          data-index={index as number}
        />
      );
    },
    [filteredChannels, handleItemClick],
  );

  const title = CATEGORY_LABELS[category] || "IPTV Player";
  const subtitle = `${filteredChannels.length} résultat${filteredChannels.length > 1 ? "s" : ""}`;

  return (
    <Panel noCloseButton onBack={handleBack}>
      <Header title={title} subtitle={subtitle} onBack={handleBack} />
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
            />
          )}
          <ActionGuide icon="arrowlargedown">
            Naviguer avec les touches directionnelles
          </ActionGuide>
        </div>
      </div>
    </Panel>
  );
};

export default PosterPanel;
