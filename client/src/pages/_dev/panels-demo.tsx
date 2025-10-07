import React from 'react';
import { 
  Panel, 
  PanelHeader, 
  PanelTitle, 
  PanelSubtitle, 
  PanelBody, 
  PanelFooter,
  EmptyState,
  Toolbar
} from '@/components/panels';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons/IconLibrary';

/**
 * Panel Components Demo Page
 * 
 * Showcases all panel primitives and their variants.
 * Used for visual testing and documentation.
 */
export const PanelsDemo: React.FC = () => {
  const toolbarActions = [
    { icon: 'Plus' as const, label: 'Add', onClick: () => console.log('Add clicked') },
    { icon: 'Edit' as const, label: 'Edit', onClick: () => console.log('Edit clicked') },
    { icon: 'Trash' as const, label: 'Delete', onClick: () => console.log('Delete clicked'), primary: true },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Panel Components Demo</h1>
        <p className="text-muted-foreground">Showcasing all panel primitives and variants</p>
      </div>

      {/* Default Panel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Default Panel</h2>
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Default Panel</PanelTitle>
              <PanelSubtitle>This is a default panel with comfortable density</PanelSubtitle>
            </div>
            <Toolbar actions={toolbarActions} />
          </PanelHeader>
          <PanelBody>
            <p className="text-sm text-muted-foreground">
              This is the panel body content. It can contain any React elements.
            </p>
          </PanelBody>
          <PanelFooter>
            <span className="text-xs text-muted-foreground">Last updated 2 minutes ago</span>
            <Button size="sm" variant="outline">View Details</Button>
          </PanelFooter>
        </Panel>
      </section>

      {/* Compact Panel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Compact Panel</h2>
        <Panel density="compact">
          <PanelHeader>
            <PanelTitle level={3}>Compact Panel</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <p className="text-sm text-muted-foreground">
              This panel uses compact density with less padding.
            </p>
          </PanelBody>
        </Panel>
      </section>

      {/* Warning Panel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Warning Panel</h2>
        <Panel tone="warning">
          <PanelHeader>
            <PanelTitle>Warning Panel</PanelTitle>
            <PanelSubtitle>This panel has a warning tone</PanelSubtitle>
          </PanelHeader>
          <PanelBody>
            <p className="text-sm text-muted-foreground">
              Warning panels are used to highlight important information or alerts.
            </p>
          </PanelBody>
        </Panel>
      </section>

      {/* Info Panel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Info Panel</h2>
        <Panel tone="info">
          <PanelHeader>
            <PanelTitle>Info Panel</PanelTitle>
            <PanelSubtitle>This panel has an info tone</PanelSubtitle>
          </PanelHeader>
          <PanelBody>
            <p className="text-sm text-muted-foreground">
              Info panels are used to display helpful information or tips.
            </p>
          </PanelBody>
        </Panel>
      </section>

      {/* Loading Panel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Loading Panel</h2>
        <Panel loading>
          <PanelHeader>
            <PanelTitle>Loading Panel</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <p className="text-sm text-muted-foreground">
              This panel is in a loading state with pulse animation.
            </p>
          </PanelBody>
        </Panel>
      </section>

      {/* Empty State Panel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Empty State Panel</h2>
        <Panel empty>
          <EmptyState
            title="No items yet"
            description="Get started by creating your first item. It will appear here once you do."
            actionLabel="Create Item"
            onAction={() => console.log('Create item clicked')}
            icon="Plus"
          />
        </Panel>
      </section>

      {/* Grid Layout Example */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Grid Layout</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Panel density="compact">
            <PanelHeader>
              <PanelTitle level={4}>Quick Stats</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tasks</span>
                  <span className="text-sm font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Events</span>
                  <span className="text-sm font-medium">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Projects</span>
                  <span className="text-sm font-medium">3</span>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel density="compact">
            <PanelHeader>
              <PanelTitle level={4}>Recent Activity</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Completed "Review proposal"
                </div>
                <div className="text-sm text-muted-foreground">
                  Created "Team meeting"
                </div>
                <div className="text-sm text-muted-foreground">
                  Updated "Project timeline"
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel density="compact">
            <PanelHeader>
              <PanelTitle level={4}>Upcoming</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Team standup - 9:00 AM
                </div>
                <div className="text-sm text-muted-foreground">
                  Client call - 2:00 PM
                </div>
                <div className="text-sm text-muted-foreground">
                  Deadline - 5:00 PM
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </section>
    </div>
  );
};
