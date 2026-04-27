import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/PagePlaceholder';

export default function TeamAssetsPage() {
  const { t } = useTranslation();
  return (
    <PagePlaceholder
      icon="👥"
      title={t('pages.team.title')}
      description={t('pages.team.description')}
    />
  );
}
