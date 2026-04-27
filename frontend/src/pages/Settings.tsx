import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/PagePlaceholder';

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <PagePlaceholder
      icon="⚙️"
      title={t('pages.settings.title')}
      description={t('pages.settings.description')}
    />
  );
}
