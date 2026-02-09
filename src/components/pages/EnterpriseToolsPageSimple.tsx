import { DashboardLayout } from '../layout/DashboardLayout';
import { ComingSoonWrapper } from '../ComingSoonOverlay';
import { EnterpriseToolsPageContent } from './EnterpriseToolsPageContent';

export function EnterpriseToolsPage() {
  return (
    <ComingSoonWrapper feature="enterprise" showOverlayOnMount={true}>
      <DashboardLayout>
        <EnterpriseToolsPageContent />
      </DashboardLayout>
    </ComingSoonWrapper>
  );
}
