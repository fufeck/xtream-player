import { useCallback } from "react";
import Scroller from "@enact/sandstone/Scroller";
import Item from "@enact/sandstone/Item";

interface CategoryFilterProps {
  groups: string[];
  selectedGroup: string | null;
  onSelectGroup: (group: string | null) => void;
}

const CategoryFilter = ({
  groups,
  selectedGroup,
  onSelectGroup,
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
        width: '25%',
        flexShrink: 0,
        height: "100%",
        borderRight: "1px solid rgba(255,255,255,0.15)",
        overflow: "hidden",
      }}
    >
      <Scroller direction="vertical" style={{ height: "100%" }}>
        <Item
          data-group=""
          onClick={handleGroupClick}
          style={selectedGroup === null ? { color: "#e6b655" } : undefined}
        >
          Toutes
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
