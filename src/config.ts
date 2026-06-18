import { Category } from "./types";
import iconLives from "./assets/icon-lives.png";
import iconMovies from "./assets/icon-movies.png";
import iconSeries from "./assets/icon-series.png";

export const CATEGORIES: Category[] = [
  { id: "lives", label: "Chaînes", icon: iconLives },
  { id: "movies", label: "Films", icon: iconMovies },
  { id: "series", label: "Séries", icon: iconSeries },
];
