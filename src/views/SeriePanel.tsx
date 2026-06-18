import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { Panel, Header } from "@enact/sandstone/Panels";
import Scroller from "@enact/sandstone/Scroller";
import Item from "@enact/sandstone/Item";
import Heading from "@enact/sandstone/Heading";
import Spinner from "@enact/sandstone/Spinner";
import BodyText from "@enact/sandstone/BodyText";
import Image from "@enact/sandstone/Image";
import { useNavigate, useOutlet, useParams } from "react-router-dom";
import ri from "@enact/ui/resolution";

import { loadSeriesInfo } from "../services/playlistService";
import { buildEpisodeUrl } from "../services/xtreamApi";
import { useApp } from "../context/AppContext";
import { XtreamSeriesInfo } from "../types";
import HiddenWhilePlaying from "../components/HiddenWhilePlaying";
import { useRestoreFocusOnReturn } from "../hooks/useRestoreFocusOnReturn";
import logoTitle from "../assets/logo-title.png";

const CONTAINER_ID = "serie-panel";

interface EpisodeData {
  id: string;
  name: string;
  url: string;
}

interface SeasonData {
  num: string;
  name: string;
  episodes: EpisodeData[];
}

interface EpisodeRowProps {
  episode: EpisodeData;
  onPlay: (episode: EpisodeData) => void;
}

function formatEpisodeTitle(
  rawTitle: string,
  seasonNum: string,
  episodeNum: number,
): string {
  const match = rawTitle.match(/S\d+E\d+.*/i);
  if (match) return match[0].trim();
  const code = `S${seasonNum.padStart(2, "0")}E${String(episodeNum).padStart(2, "0")}`;
  return rawTitle ? `${code} - ${rawTitle}` : code;
}

const EpisodeRow = ({ episode, onPlay }: EpisodeRowProps) => {
  const handleClick = useCallback(() => onPlay(episode), [episode, onPlay]);
  return <Item onClick={handleClick}>{episode.name}</Item>;
};

const SeriePanel = () => {
  const navigate = useNavigate();
  const outlet = useOutlet();
  useRestoreFocusOnReturn(CONTAINER_ID, !!outlet);
  const { series_id } = useParams<{ series_id: string }>();
  const { channels } = useApp();

  const series = useMemo(
    () =>
      channels.find(
        (c) =>
          c.category === "series" && String(c.series_id) === String(series_id),
      ),
    [channels, series_id],
  );

  const [seriesInfo, setSeriesInfo] = useState<XtreamSeriesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!series_id) return;
    loadSeriesInfo(series_id)
      .then((info) => {
        setSeriesInfo(info);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [series_id]);

  const seasons = useMemo((): SeasonData[] => {
    if (!seriesInfo) return [];
    return Object.keys(seriesInfo.episodes || {})
      .sort((a, b) => Number(a) - Number(b))
      .map((num) => ({
        num,
        name: `Saison ${num}`,
        episodes: (seriesInfo.episodes[num] || []).map((ep) => ({
          id: ep.id,
          name: formatEpisodeTitle(ep.title || "", num, ep.episode_num),
          url: buildEpisodeUrl(ep.id, ep.container_extension),
        })),
      }));
  }, [seriesInfo]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handlePlay = useCallback(
    (episode: EpisodeData) => {
      navigate(`player/${episode.id}`, {
        state: { url: episode.url, name: episode.name },
      });
    },
    [navigate],
  );

  return (
    <>
      <HiddenWhilePlaying hidden={!!outlet} containerId={CONTAINER_ID}>
        <Panel noCloseButton onBack={handleBack}>
          <Header
            title={series ? series.name : ""}
            onBack={handleBack}
            slotBefore={
              <Image
                src={logoTitle}
                sizing="fit"
                style={{ width: ri.scale(320), height: ri.scale(150) }}
              />
            }
          />

          {loading && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
              }}
            >
              <Spinner>Chargement…</Spinner>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "2rem" }}>
              <BodyText centered>{`Erreur : ${error}`}</BodyText>
            </div>
          )}

          {!loading && !error && seasons.length === 0 && (
            <div style={{ padding: "2rem" }}>
              <BodyText centered>Aucun épisode disponible.</BodyText>
            </div>
          )}

          {!loading && !error && seasons.length > 0 && (
            <Scroller
              direction="vertical"
              style={{ height: "calc(100vh - 280px)" }}
            >
              {seasons.map((season) => (
                <Fragment key={season.num}>
                  <Heading showLine>{season.name}</Heading>
                  {season.episodes.map((ep) => (
                    <EpisodeRow key={ep.id} episode={ep} onPlay={handlePlay} />
                  ))}
                </Fragment>
              ))}
            </Scroller>
          )}
        </Panel>
      </HiddenWhilePlaying>
      {outlet}
    </>
  );
};

export default SeriePanel;
