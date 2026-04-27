/**
 * Componente raíz de la aplicación.
 * Envuelve toda la app con los providers necesarios y monta el router.
 */
import { RouterProvider } from 'react-router-dom';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { router } from '@/router';

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
