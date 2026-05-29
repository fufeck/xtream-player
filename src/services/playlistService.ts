import {
  getLiveCategories,
  getVodCategories,
  getSeriesCategories,
  getLiveStreams,
  getVodStreams,
  getSeriesList,
  getSeriesInfo,
  buildLiveUrl,
  buildVodUrl,
} from './xtreamApi';
import {
  Channel,
  XtreamCategoryRaw,
  XtreamLiveStreamRaw,
  XtreamVodStreamRaw,
  XtreamSeriesRaw,
  XtreamSeriesInfo,
} from '../types';

export function extractGroups(channels: Channel[]): string[] {
  const groups = Array.from(new Set(channels.map((c) => c.group)));
  return groups.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

export async function loadPlaylist(): Promise<Channel[]> {
  const [
    liveCategories,
    vodCategories,
    seriesCategories,
    liveStreams,
    vodStreams,
    seriesList,
  ] = await Promise.all([
    getLiveCategories(),
    getVodCategories(),
    getSeriesCategories(),
    getLiveStreams(),
    getVodStreams(),
    getSeriesList(),
  ]) as [
    XtreamCategoryRaw[], XtreamCategoryRaw[], XtreamCategoryRaw[],
    XtreamLiveStreamRaw[], XtreamVodStreamRaw[], XtreamSeriesRaw[]
  ];

  const liveCatMap = buildCategoryMap(liveCategories);
  const vodCatMap = buildCategoryMap(vodCategories);
  const seriesCatMap = buildCategoryMap(seriesCategories);

  return [
    ...normalizeLive(liveStreams, liveCatMap),
    ...normalizeVod(vodStreams, vodCatMap),
    ...normalizeSeries(seriesList, seriesCatMap),
  ];
}

export async function loadSeriesInfo(seriesId: string | number): Promise<XtreamSeriesInfo> {
  return getSeriesInfo(seriesId);
}

function buildCategoryMap(categories: XtreamCategoryRaw[]): Record<string, string> {
  const map: Record<string, string> = {};
  if (Array.isArray(categories)) {
    categories.forEach((c) => {
      map[c.category_id] = c.category_name;
    });
  }
  return map;
}

function normalizeLive(streams: XtreamLiveStreamRaw[], catMap: Record<string, string>): Channel[] {
  if (!Array.isArray(streams)) return [];
  return streams.map((s) => ({
    id: String(s.stream_id),
    name: s.name || 'Sans nom',
    logo: s.stream_icon || '',
    group: catMap[s.category_id] || 'Sans groupe',
    url: buildLiveUrl(s.stream_id),
    category: 'lives' as const,
  }));
}

function normalizeVod(streams: XtreamVodStreamRaw[], catMap: Record<string, string>): Channel[] {
  if (!Array.isArray(streams)) return [];
  return streams.map((s) => ({
    id: String(s.stream_id),
    name: s.name || 'Sans nom',
    logo: s.stream_icon || '',
    group: catMap[s.category_id] || 'Sans groupe',
    url: buildVodUrl(s.stream_id, s.container_extension),
    category: 'movies' as const,
  }));
}

function normalizeSeries(list: XtreamSeriesRaw[], catMap: Record<string, string>): Channel[] {
  if (!Array.isArray(list)) return [];
  return list.map((s) => ({
    id: String(s.series_id),
    name: s.name || 'Sans nom',
    logo: s.cover || '',
    group: catMap[s.category_id] || 'Sans groupe',
    url: null,
    category: 'series' as const,
    series_id: s.series_id,
  }));
}
