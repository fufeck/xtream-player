import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { getCredentials } from "../services/credentialsService";
import { loadPlaylist } from "../services/playlistService";
import { AppContextValue, Channel, Credentials } from "../types";

const AppContext = createContext<AppContextValue | null>(null);

function credentialsKey(c: Credentials | null): string | null {
  return c ? `${c.host}|${c.username}|${c.password}` : null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadedKeyRef = useRef<string | null>(null);

  const fetchPlaylist = useCallback(() => {
    setLoading(true);
    setError(null);
    loadPlaylist()
      .then((data) => {
        setChannels(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const refresh = useCallback(() => {
    loadedKeyRef.current = credentialsKey(getCredentials());
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Loads the playlist at most once per set of credentials, so returning to
  // /home after the first load doesn't refetch it.
  const ensurePlaylist = useCallback(() => {
    const key = credentialsKey(getCredentials());
    if (key !== null && key === loadedKeyRef.current) return;
    loadedKeyRef.current = key;
    fetchPlaylist();
  }, [fetchPlaylist]);

  return (
    <AppContext.Provider
      value={{ channels, loading, error, refresh, ensurePlaylist }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
