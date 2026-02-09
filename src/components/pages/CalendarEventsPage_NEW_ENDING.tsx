    </div>
      </motion.div>
      
      {/* PHASE 5: Integration Marketplace Modal */}
      <IntegrationMarketplace
        open={showIntegrationMarketplace}
        onClose={() => setShowIntegrationMarketplace(false)}
        context="calendar"
        onIntegrationConnect={(integrationId) => {
          console.log('Integration connected:', integrationId);
          if (integrationId === 'make') {
            setShowIntegrationMarketplace(false);
            setShowMakeComWizard(true);
          } else {
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
          setIntegrationNotifications(0);
        }}
      />
    </DashboardLayout>
  );
}

export default CalendarEventsPage;
