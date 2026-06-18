import { useCallback } from "react";
import { Panel } from "@enact/sandstone/Panels";
import Button from "@enact/sandstone/Button";
import Image from "@enact/sandstone/Image";
import IconItem from "@enact/sandstone/IconItem";
import { useNavigate } from "react-router-dom";
import ri from "@enact/ui/resolution";

import { CATEGORIES } from "../config";
import { Category, CategoryType } from "../types";
import logoTitle from "../assets/logo-title.png";
import css from "./HomePanel.module.css";

const CATEGORY_ROUTES: Record<CategoryType, string> = {
  lives: "/lives",
  movies: "/movies",
  series: "/series",
};

const FIRST_CARD_ID = "home-first-card";
const CARD_SIZE = ri.scale(240);
const ICON_SIZE = ri.scale(120);

interface CategoryCardProps {
  category: Category;
  onClick: (id: CategoryType) => void;
  spotlightId?: string;
}

const CategoryCard = ({
  category,
  onClick,
  spotlightId,
}: CategoryCardProps) => {
  const handleClick = useCallback(
    () => onClick(category.id),
    [category.id, onClick],
  );

  return (
    <IconItem
      background="#2b2b2b"
      css={{ content: css.cardContent, label: css.labelItem }}
      image={{
        src: category.icon,
        size: { width: ICON_SIZE, height: ICON_SIZE },
      }}
      label={category.label}
      onClick={handleClick}
      spotlightId={spotlightId}
      style={{ width: CARD_SIZE, height: CARD_SIZE }}
    />
  );
};

const HomePanel = () => {
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleSelect = useCallback(
    (id: CategoryType) => {
      const route = CATEGORY_ROUTES[id];
      if (route) navigate(route);
    },
    [navigate],
  );

  return (
    <Panel noCloseButton>
      <div style={{ position: "fixed", top: 24, right: 36, zIndex: 100 }}>
        <Button icon="logout" onClick={handleLogout} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          height: "calc(100vh - 200px)",
          paddingBottom: ri.scale(160),
        }}
      >
        <Image
          src={logoTitle}
          sizing="fit"
          style={{ width: ri.scale(800), height: ri.scale(376) }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
          }}
        >
          {CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onClick={handleSelect}
              spotlightId={i === 0 ? FIRST_CARD_ID : undefined}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
};

export default HomePanel;
