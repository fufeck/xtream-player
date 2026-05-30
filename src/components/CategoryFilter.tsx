import { useCallback } from "react";
import Scroller from "@enact/sandstone/Scroller";
import Item from "@enact/sandstone/Item";
import { InputField } from "@enact/sandstone/Input";

interface CategoryFilterProps {
  groups: string[];
  selectedGroup: string | null;
  onSelectGroup: (group: string | null) => void;
  query: string;
  onQueryChange: ({ value }: { value: string }) => void;
  placeholder?: string;
}

const favoritesIcon = <span style={{ color: "#e6b655" }}>★</span>;

const CategoryFilter = ({
  groups,
  selectedGroup,
  onSelectGroup,
  query,
  onQueryChange,
  placeholder = "Rechercher…",
}: CategoryFilterProps) => {
  const handleGroupClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const group = (e.currentTarget as HTMLElement).dataset.group;
      onSelectGroup(group !== undefined && group !== "" ? group : null);
    },
    [onSelectGroup],
  );

  return (
    <div
      style={{
        width: "25%",
        flexShrink: 0,
        height: "100%",
        borderRight: "1px solid rgba(255,255,255,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <InputField
        placeholder={placeholder}
        value={query}
        onChange={onQueryChange}
        iconBefore="search"
      />
      <Scroller direction="vertical" style={{ flex: 1 }}>
        <Item
          data-group="__favorites__"
          onClick={handleGroupClick}
          style={selectedGroup === "__favorites__" ? { color: "#e6b655" } : undefined}
          slotBefore={favoritesIcon}
        >
          Favoris
        </Item>
        {groups.map((group) => (
          <Item
            key={group}
            data-group={group}
            onClick={handleGroupClick}
            style={selectedGroup === group ? { color: "#e6b655" } : undefined}
          >
            {group}
          </Item>
        ))}
      </Scroller>
    </div>
  );
};

export default CategoryFilter;
