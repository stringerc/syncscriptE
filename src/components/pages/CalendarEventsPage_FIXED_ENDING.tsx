  </motion.div>
  
  {/* PHASE 5: Integration Marketplace Modal */}
  <IntegrationMarketplace
    open={showIntegrationMarketplace}
    onClose={() => setShowIntegrationMarketplace(false)}
    context="calendar"
    onIntegrationConnect={(integrationId) => {
      console.log('Integration connected:', integrationId);
      // Handle specific integrations
      if (integrationId === 'make') {
        setShowIntegrationMarketplace(false);
        setShowMakeComWizard(true);
      } else {
        // Handle OAuth integrations (Google Calendar, Outlook, etc.)
        // Will be implemented with actual OAuth flows
        toast.success(`${integrationId} integration initiated!`);
      }
    }}
  />
  
  {/* PHASE 5: Make.com Guided Wizard */}
  <MakeComWizard
    open={showMakeComWizard}
    onClose={() => setShowMakeComWizard(false)}
    onComplete={() => {
      toast.success('Make.com integration activated!');
      // Refresh integration status
      setIntegrationNotifications(0);
    }}
  />
</DashboardLayout>
  );
}

export default CalendarEventsPage;
