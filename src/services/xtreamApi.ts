import axios from "axios";
import { getCredentials } from "./credentialsService";
import {
  Credentials,
  XtreamCategoryRaw,
  XtreamLiveStreamRaw,
  XtreamVodStreamRaw,
  XtreamSeriesRaw,
  XtreamSeriesInfo,
} from "../types";

const TIMEOUT = 30000;

function creds(): Credentials {
  const c = getCredentials();
  if (!c) throw new Error("Aucun identifiant configuré");
  return c;
}

function apiUrl(action: string, params: Record<string, string> = {}): string {
  const { host, username, password } = creds();
  const query = new URLSearchParams({ username, password, action, ...params });
  return `${host}/player_api.php?${query.toString()}`;
}

async function apiFetch(
  action: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const { data } = await axios.get(apiUrl(action, params), {
    timeout: TIMEOUT,
  });
  return data;
}

export async function validateCredentials(
  host: string,
  username: string,
  password: string,
): Promise<boolean> {
  const query = new URLSearchParams({ username, password });
  const { data } = await axios.get(
    `${host}/player_api.php?${query.toString()}`,
    { timeout: TIMEOUT },
  );
  return (data as { user_info?: { auth?: number } })?.user_info?.auth === 1;
}

export function getLiveCategories(): Promise<XtreamCategoryRaw[]> {
  return apiFetch("get_live_categories") as Promise<XtreamCategoryRaw[]>;
}

export function getVodCategories(): Promise<XtreamCategoryRaw[]> {
  return apiFetch("get_vod_categories") as Promise<XtreamCategoryRaw[]>;
}

export function getSeriesCategories(): Promise<XtreamCategoryRaw[]> {
  return apiFetch("get_series_categories") as Promise<XtreamCategoryRaw[]>;
}

export function getLiveStreams(): Promise<XtreamLiveStreamRaw[]> {
  return apiFetch("get_live_streams") as Promise<XtreamLiveStreamRaw[]>;
}

export function getVodStreams(): Promise<XtreamVodStreamRaw[]> {
  return apiFetch("get_vod_streams") as Promise<XtreamVodStreamRaw[]>;
}

export function getSeriesList(): Promise<XtreamSeriesRaw[]> {
  return apiFetch("get_series") as Promise<XtreamSeriesRaw[]>;
}

export function getSeriesInfo(
  seriesId: string | number,
): Promise<XtreamSeriesInfo> {
  return apiFetch("get_series_info", {
    series_id: String(seriesId),
  }) as Promise<XtreamSeriesInfo>;
}

export function buildLiveUrl(streamId: number | string): string {
  const { host, username, password } = creds();
  return `${host}/${username}/${password}/${streamId}`;
}

export function buildVodUrl(streamId: number | string, ext?: string): string {
  const { host, username, password } = creds();
  return `${host}/movie/${username}/${password}/${streamId}.${ext || "mp4"}`;
}

export function buildEpisodeUrl(
  episodeId: string | number,
  ext?: string,
): string {
  const { host, username, password } = creds();
  return `${host}/series/${username}/${password}/${episodeId}.${ext || "mp4"}`;
}
