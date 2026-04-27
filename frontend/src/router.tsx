/**
 * Configuración central de rutas con React Router.
 *
 * Estructura:
 *   /                  → redirige a /dashboard
 *   /dashboard         → DashboardLayout > DashboardPage
 *   /vulnerabilities   → DashboardLayout > VulnerabilityHubPage
 *   /ai-pentesting     → DashboardLayout > AIPentestingPage
 *   /patches           → DashboardLayout > PatchManagerPage
 *   /team              → DashboardLayout > TeamAssetsPage
 *   /reports           → DashboardLayout > ReportsPage
 *   /settings          → DashboardLayout > SettingsPage
 *   /setup             → DashboardLayout > SetupCheckPage  (página de diagnóstico)
 *   *                  → redirige a /dashboard (404 → home)
 *
 * En el Paso 3 vamos a agregar:
 *   /login             → LoginPage (sin layout)
 *   /register          → RegisterPage (sin layout)
 *   y un wrapper de "rutas protegidas" alrededor del DashboardLayout.
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';

import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPage from '@/pages/Dashboard';
import VulnerabilityHubPage from '@/pages/VulnerabilityHub';
import AIPentestingPage from '@/pages/AIPentesting';
import PatchManagerPage from '@/pages/PatchManager';
import TeamAssetsPage from '@/pages/TeamAssets';
import ReportsPage from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import SetupCheckPage from '@/pages/SetupCheck';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      // Redirección de la raíz al dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Rutas principales
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'vulnerabilities', element: <VulnerabilityHubPage /> },
      { path: 'ai-pentesting', element: <AIPentestingPage /> },
      { path: 'patches', element: <PatchManagerPage /> },
      { path: 'team', element: <TeamAssetsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },

      // Página de diagnóstico (oculta del menú)
      { path: 'setup', element: <SetupCheckPage /> },

      // 404 → redirige al dashboard
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
