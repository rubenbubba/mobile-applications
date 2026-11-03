import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { PageLayout } from '@/components/shell/PageLayout';

export default function SettingsScreen() {
  return (
    <PageLayout title="Settings" showBusiness={false} testID="screen-settings">
      <SettingsPanel />
    </PageLayout>
  );
}
