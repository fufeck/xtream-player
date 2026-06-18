import { useCallback, useMemo } from "react";
import { Panel } from "@enact/sandstone/Panels";
import Button from "@enact/sandstone/Button";
import Image from "@enact/sandstone/Image";
import { useNavigate } from "react-router-dom";
import ri from "@enact/ui/resolution";

import { CATEGORIES } from "../config";
import { useApp } from "../context/AppContext";
import { Category, CategoryType } from "../types";
import logoTitle from "../assets/logo-title.png";

const CATEGORY_ROUTES: Record<CategoryType, string> = {
  lives: "/lives",
  movies: "/movies",
  series: "/series",
};

const FIRST_CARD_ID = "home-first-card";

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
    <Button
      size="large"
      icon={category.icon}
      onClick={handleClick}
      spotlightId={spotlightId}
      style={{ width: ri.scale(380), height: ri.scale(200) }}
    >
      {category.label}
    </Button>
  );
};

const HomePanel = () => {
  const navigate = useNavigate();
  const { channels } = useApp();

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
