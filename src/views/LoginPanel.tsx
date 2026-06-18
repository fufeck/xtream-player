import { useState, useCallback } from 'react';
import { Panel, Header } from '@enact/sandstone/Panels';
import Button from '@enact/sandstone/Button';
import Input from '@enact/sandstone/Input';
import Spinner from '@enact/sandstone/Spinner';
import BodyText from '@enact/sandstone/BodyText';
import Image from '@enact/sandstone/Image';
import { useNavigate } from 'react-router-dom';
import ri from '@enact/ui/resolution';

import { validateCredentials } from '../services/xtreamApi';
import { saveCredentials, getCredentials } from '../services/credentialsService';
import logoTitle from '../assets/logo-title.png';

const LoginPanel = () => {
  const navigate = useNavigate();
  const saved = getCredentials();

  const [host, setHost] = useState(saved?.host || '');
  const [username, setUsername] = useState(saved?.username || '');
  const [password, setPassword] = useState(saved?.password || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHostChange = useCallback(({ value }: { value: string }) => setHost(value), []);
  const handleUsernameChange = useCallback(({ value }: { value: string }) => setUsername(value), []);
  const handlePasswordChange = useCallback(({ value }: { value: string }) => setPassword(value), []);

  const handleSubmit = useCallback(() => {
    const h = host.trim();
    const u = username.trim();
    const p = password.trim();

    if (!h || !u || !p) {
      setError('Tous les champs sont requis.');
      return;
    }

    setLoading(true);
    setError(null);

    validateCredentials(h, u, p)
      .then((ok) => {
        if (ok) {
          saveCredentials(h, u, p);
          navigate('/home', { replace: true });
        } else {
          setError("Identifiants invalides. Vérifiez le host, le nom d'utilisateur et le mot de passe.");
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Impossible de contacter le serveur. Vérifiez l'URL du host.");
        setLoading(false);
      });
  }, [host, username, password, navigate]);

  return (
    <Panel noCloseButton>
      <Header
        subtitle="Connexion"
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
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100vh - 200px)',
          }}
        >
          <Spinner>Vérification des identifiants…</Spinner>
        </div>
      )}

      {!loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            height: 'calc(100vh - 200px)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 600 }}>
            <Input
              placeholder="URL du serveur (ex: http://exemple.com:8080)"
              value={host}
              onChange={handleHostChange}
            />
            <Input
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={handleUsernameChange}
            />
            <Input
              placeholder="Mot de passe"
              type="password"
              value={password}
              onChange={handlePasswordChange}
            />
          </div>

          {error && (
            <BodyText centered style={{ color: '#e05', maxWidth: 600 }}>
              {error}
            </BodyText>
          )}

          <Button onClick={handleSubmit} size="large">
            Se connecter
          </Button>
        </div>
      )}
    </Panel>
  );
};

export default LoginPanel;
