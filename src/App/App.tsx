import { useState, useEffect } from "react";
import ThemeDecorator from "@enact/sandstone/ThemeDecorator";
import Spinner from "@enact/sandstone/Spinner";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

import { AppProvider } from "../context/AppContext";
import HomePanel from "../views/HomePanel";
import PosterPanel from "../views/PosterPanel";
import LivePanel from "../views/LivePanel";
import SeriePanel from "../views/SeriePanel";
import PlayerPanel from "../views/PlayerPanel";
import LoginPanel from "../views/LoginPanel";
import { getCredentials } from "../services/credentialsService";
import { validateCredentials } from "../services/xtreamApi";

import css from "./App.module.less";

const SerieRoute = () => {
  const { series_id } = useParams<{ series_id: string }>();
  if (!series_id) return null;
  return <SeriePanel key={series_id} />;
};

const AuthGate = () => {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const c = getCredentials();
    Promise.resolve()
      .then(() => {
        if (!c) return "/login";
        return validateCredentials(c.host, c.username, c.password)
          .then((ok) => (ok ? "/home" : "/login"))
          .catch(() => "/login");
      })
      .then((dest) => setTarget(dest));
  }, []);

  if (!target) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spinner>Vérification de la connexion…</Spinner>
      </div>
    );
  }
  return <Navigate to={target} replace />;
};

const AppBase = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={css.app}>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/login" element={<LoginPanel />} />
          <Route path="/home" element={<HomePanel />} />
          <Route path="/lives" element={<LivePanel />}>
            <Route
              path="player/:stream_id"
              element={<PlayerPanel type="lives" />}
            />
          </Route>
          <Route path="/movies" element={<PosterPanel category="movies" />}>
            <Route
              path="player/:stream_id"
              element={<PlayerPanel type="movies" />}
            />
          </Route>
          <Route path="/series" element={<PosterPanel category="series" />}>
            <Route path=":series_id" element={<SerieRoute />}>
              <Route
                path="player/:stream_id"
                element={<PlayerPanel type="series" />}
              />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  </div>
);

export default ThemeDecorator(AppBase);
