/**
 * Header superior fijo.
 *
 * Contiene:
 * - Botón hamburguesa (solo móvil/tablet) para abrir el sidebar.
 * - Título de la página actual (cambia según la ruta).
 * - Selector de idioma (es/en).
 * - Toggle dark/light.
 * - Avatar de usuario placeholder (en el Paso 3 lo conectamos con el usuario real).
 */
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/contexts/ThemeContext';
import { NAV_ITEMS } from '@/types/navigation';

interface HeaderProps {
  /** Callback para abrir el sidebar en móvil/tablet */
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Buscar el título de la página actual según la ruta
  const currentNavItem = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
  const pageTitle = currentNavItem ? t(currentNavItem.labelKey) : t('app.name');

  // Idioma actual normalizado (i18next puede devolver 'es-CL', 'es', etc.)
  const currentLang = i18n.language.startsWith('en') ? 'en' : 'es';

  return (
    <header
      className="
        fixed top-0 right-0 z-20
        left-0 lg:left-[260px]
        h-16
        bg-bg-secondary border-b border-border-primary
        flex items-center justify-between
        px-4 lg:px-8
      "
    >
      {/* Lado izquierdo: botón hamburguesa (móvil) + título */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Botón hamburguesa: solo visible en móvil/tablet */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="
            lg:hidden
            w-9 h-9 rounded-md
            bg-bg-tertiary border border-border-secondary
            flex items-center justify-center
            text-lg
            hover:bg-bg-quaternary transition-colors
          "
          aria-label={t('nav.openMenu')}
        >
          ☰
        </button>

        <h2 className="text-lg lg:text-xl font-semibold truncate">{pageTitle}</h2>
      </div>

      {/* Lado derecho: idioma, tema, avatar */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Selector de idioma */}
        <select
          value={currentLang}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          aria-label={t('nav.language')}
          className="
            bg-bg-tertiary border border-border-secondary rounded-md
            px-2 py-1.5 lg:px-3 lg:py-2
            text-xs lg:text-sm
            cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-accent-cyan
          "
        >
          <option value="es">🇪🇸 ES</option>
          <option value="en">🇬🇧 EN</option>
        </select>

        {/* Toggle de tema */}
        <button
          type="button"
          onClick={toggleTheme}
          className="
            w-9 h-9 rounded-md
            bg-bg-tertiary border border-border-secondary
            flex items-center justify-center
            text-base
            hover:bg-bg-quaternary transition-colors
            focus:outline-none focus:ring-2 focus:ring-accent-cyan
          "
          aria-label={theme === 'dark' ? t('nav.toggleThemeLight') : t('nav.toggleThemeDark')}
          title={theme === 'dark' ? t('nav.toggleThemeLight') : t('nav.toggleThemeDark')}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* Avatar de usuario (placeholder hasta el Paso 3) */}
        <div
          className="
            w-9 h-9 rounded-full
            bg-gradient-to-br from-accent-cyan to-accent-blue
            flex items-center justify-center
            text-sm font-semibold text-white
            cursor-pointer
            hover:opacity-90 transition-opacity
          "
          aria-label="User profile"
          title="User profile"
        >
          U
        </div>
      </div>
    </header>
  );
}
