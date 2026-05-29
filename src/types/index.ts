export type CategoryType = 'lives' | 'movies' | 'series';

export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string | null;
  category: CategoryType;
  series_id?: number;
}

export interface Credentials {
  host: string;
  username: string;
  password: string;
}

export interface Category {
  id: CategoryType;
  label: string;
  icon: string;
}

export interface XtreamCategoryRaw {
  category_id: string;
  category_name: string;
}

export interface XtreamLiveStreamRaw {
  stream_id: number;
  name: string;
  stream_icon: string;
  category_id: string;
}

export interface XtreamVodStreamRaw extends XtreamLiveStreamRaw {
  container_extension: string;
}

export interface XtreamSeriesRaw {
  series_id: number;
  name: string;
  cover: string;
  category_id: string;
}

export interface XtreamEpisodeRaw {
  id: string;
  title: string;
  episode_num: number;
  container_extension: string;
  info?: { movie_image?: string };
}

export interface XtreamSeriesInfo {
  seasons: unknown[];
  episodes: Record<string, XtreamEpisodeRaw[]>;
}

export interface AppContextValue {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
