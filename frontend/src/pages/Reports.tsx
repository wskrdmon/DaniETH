import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/PagePlaceholder';

export default function ReportsPage() {
  const { t } = useTranslation();
  return (
    <PagePlaceholder
      icon="📈"
      title={t('pages.reports.title')}
      description={t('pages.reports.description')}
    />
  );
}
