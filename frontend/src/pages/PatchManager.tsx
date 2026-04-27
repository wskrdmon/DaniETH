import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/PagePlaceholder';

export default function PatchManagerPage() {
  const { t } = useTranslation();
  return (
    <PagePlaceholder
      icon="🔧"
      title={t('pages.patches.title')}
      description={t('pages.patches.description')}
    />
  );
}
