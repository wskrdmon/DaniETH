/**
 * Página de verificación de setup.
 *
 * Esta página sirve para verificar visualmente que:
 * - El frontend carga correctamente.
 * - Tailwind y los CSS variables funcionan.
 * - El backend está accesible.
 * - Firebase está conectado en ambos lados.
 *
 * Es la página inicial del Paso 1 — en el Paso 2 la reemplazamos por el dashboard real.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import apiClient from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { auth } from '@/lib/firebase';

interface HealthCheck {
  status: string;
  app_name: string;
  app_env: string;
  firebase: string;
  project_id: string | null;
}

type CheckState = 'pending' | 'ok' | 'error';

export default function SetupCheckPage() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [backendCheck, setBackendCheck] = useState<CheckState>('pending');
  const [firebaseCheck, setFirebaseCheck] = useState<CheckState>('pending');
  const [healthData, setHealthData] = useState<HealthCheck | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // 1) Verificar conexión con el backend
    apiClient
      .get<HealthCheck>('/api/v1/health')
      .then((response) => {
        setBackendCheck('ok');
        setHealthData(response.data);
        setFirebaseCheck(response.data.firebase === 'connected' ? 'ok' : 'error');
      })
      .catch((error) => {
        setBackendCheck('error');
        setFirebaseCheck('error');
        setErrorMessage(error.message);
      });

    // 2) Verificar que el SDK de Firebase del frontend cargó correctamente
    if (!auth) {
      console.error('Firebase Auth no se inicializó en el frontend');
    }
  }, []);

  const StatusIcon = ({ state }: { state: CheckState }) => {
    if (state === 'pending') return <span className="text-text-muted">⏳</span>;
    if (state === 'ok') return <span className="text-severity-low">✅</span>;
    return <span className="text-severity-critical">❌</span>;
  };

  const allOk = backendCheck === 'ok' && firebaseCheck === 'ok';

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-2xl">
              🛡️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-accent-cyan">{t('app.name')}</h1>
              <p className="text-sm text-text-muted">{t('app.tagline')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de idioma */}
            <select
              value={i18n.language.startsWith('en') ? 'en' : 'es'}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-bg-tertiary border border-border-secondary rounded-md px-3 py-2 text-sm cursor-pointer"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
            </select>

            {/* Toggle de tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-md bg-bg-tertiary border border-border-secondary flex items-center justify-center text-lg hover:bg-bg-quaternary transition-colors"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        {/* Setup checks */}
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">{t('setup.title')}</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon state={backendCheck} />
                <div>
                  <p className="font-medium">
                    {backendCheck === 'ok' ? t('setup.backendOk') : t('setup.checkingBackend')}
                  </p>
                  {healthData && (
                    <p className="text-xs text-text-muted mt-1">
                      {healthData.app_name} • {healthData.app_env}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon state={firebaseCheck} />
                <div>
                  <p className="font-medium">
                    {firebaseCheck === 'ok' ? t('setup.firebaseOk') : t('setup.firebaseError')}
                  </p>
                  {healthData?.project_id && (
                    <p className="text-xs text-text-muted mt-1">
                      Project ID: {healthData.project_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 bg-severity-critical/10 border border-severity-critical/30 rounded-lg text-sm text-severity-critical">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
        </div>

        {/* Estado final */}
        {allOk && (
          <div className="bg-severity-low/10 border border-severity-low/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-severity-low mb-2">✓ {t('setup.ready')}</h3>
            <p className="text-sm text-text-secondary mb-4">
              <strong>{t('setup.nextSteps')}:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-text-secondary">
              <li>{t('setup.step2')}</li>
              <li>{t('setup.step3')}</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
