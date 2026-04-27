/**
 * Componente raíz de la aplicación.
 * Envuelve toda la app con los providers necesarios (tema, etc.).
 */
import { ThemeProvider } from '@/contexts/ThemeContext';
import SetupCheckPage from '@/pages/SetupCheck';

export default function App() {
  return (
    <ThemeProvider>
      {/*
        En el Paso 1 mostramos solo la página de verificación de setup.
        En el Paso 2 vamos a agregar React Router con las rutas reales.
      */}
      <SetupCheckPage />
    </ThemeProvider>
  );
}
