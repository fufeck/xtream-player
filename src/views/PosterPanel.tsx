import { useMemo, useCallback, useState } from "react";
import { Panel, Header } from "@enact/sandstone/Panels";
import { VirtualGridList } from "@enact/sandstone/VirtualList";
import BodyText from "@enact/sandstone/BodyText";
import Input from "@enact/sandstone/Input";
import ActionGuide from "@enact/sandstone/ActionGuide";
import { useNavigate } from "react-router-dom";
import ri from "@enact/ui/resolution";

import { CATEGORIES } from "../config";
import { useApp } from "../context/AppContext";
import { CategoryType } from "../types";
import ImageItem from "@enact/sandstone/ImageItem";

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

  const handleQueryChange = useCallback(
    ({ value }: { value: string }) => setQuery(value),
    [],
  );

  const filteredChannels = useMemo(() => {
    const byCategory = channels.filter((c) => c.category === category);
    if (!query.trim()) return byCategory;
    const q = normalize(query.trim());
    return byCategory.filter((c) => normalize(c.name).includes(q));
  }, [channels, category, query]);

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
    ({ index, style, ...rest }: ItemRendererArgs) => {
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

      <Input
        spotlightId="search-input"
        placeholder="Rechercher…"
        value={query}
        onChange={handleQueryChange}
        style={{ width: "100%" }}
      />

      {filteredChannels.length === 0 && (
        <div style={{ padding: "2rem" }}>
          <BodyText centered>Aucun contenu trouvé.</BodyText>
        </div>
      )}

      {filteredChannels.length > 0 && (
        <VirtualGridList
          dataSize={filteredChannels.length}
          itemRenderer={renderItem}
          itemSize={{ minWidth: ri.scale(650), minHeight: ri.scale(975) }}
          spacing={ri.scale(8)}
          style={{ height: "calc(100vh - 400px)" }}
        />
      )}

      <ActionGuide icon="arrowlargedown">
        Naviguer avec les touches directionnelles
      </ActionGuide>
    </Panel>
  );
};

export default PosterPanel;
