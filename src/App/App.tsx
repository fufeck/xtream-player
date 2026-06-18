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

const HomeGate = () => {
  const [status, setStatus] = useState<"checking" | "ok" | "invalid">(
    "checking",
  );

  useEffect(() => {
    const c = getCredentials();
    Promise.resolve()
      .then(() => {
        if (!c) return false;
        return validateCredentials(c.host, c.username, c.password).catch(
          () => false,
        );
      })
      .then((ok) => setStatus(ok ? "ok" : "invalid"));
  }, []);

  if (status === "checking") {
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

  if (status === "invalid") {
    return <Navigate to="/login" replace />;
  }

  return <HomePanel />;
};

const AppBase = ({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={[className, css.app].filter(Boolean).join(" ")}>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<LoginPanel />} />
          <Route path="/home" element={<HomeGate />} />
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
