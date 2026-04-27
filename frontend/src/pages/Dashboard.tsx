import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/PagePlaceholder';

export default function DashboardPage() {
  const { t } = useTranslation();
  return (
    <PagePlaceholder
      icon="📊"
      title={t('pages.dashboard.title')}
      description={t('pages.dashboard.description')}
    />
  );
}
