import { createContext, useCallback, useContext, useState } from 'react';
import { loadPlaylist } from '../services/playlistService';
import { AppContextValue, Channel } from '../types';

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    loadPlaylist()
      .then((data) => { setChannels(data); setLoading(false); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, []);

  return (
    <AppContext.Provider value={{ channels, loading, error, refresh }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
