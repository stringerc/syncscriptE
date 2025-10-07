import React from 'react';
import { Icons } from '../icons/IconLibrary';

/**
 * Design System Showcase Component
 * Demonstrates all the new design tokens, components, and styles
 * Used for visual regression testing and design system documentation
 */
export const DesignSystemShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gradient">SyncScript</h1>
        <p className="text-xl text-muted-foreground">Professional Design System</p>
      </div>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {/* Brand Colors */}
          <div className="space-y-2">
            <div className="h-16 bg-brand-primary rounded-lg"></div>
            <p className="text-sm font-medium">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-brand-secondary rounded-lg"></div>
            <p className="text-sm font-medium">Secondary</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-brand-accent rounded-lg"></div>
            <p className="text-sm font-medium">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-brand-warning rounded-lg"></div>
            <p className="text-sm font-medium">Warning</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-brand-error rounded-lg"></div>
            <p className="text-sm font-medium">Error</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-success rounded-lg"></div>
            <p className="text-sm font-medium">Success</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-info rounded-lg"></div>
            <p className="text-sm font-medium">Info</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-neutral-500 rounded-lg"></div>
            <p className="text-sm font-medium">Neutral</p>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="text-6xl font-bold">Heading 1</h1>
            <p className="text-sm text-muted-foreground">text-6xl font-bold</p>
          </div>
          <div>
            <h2 className="text-5xl font-bold">Heading 2</h2>
            <p className="text-sm text-muted-foreground">text-5xl font-bold</p>
          </div>
          <div>
            <h3 className="text-4xl font-semibold">Heading 3</h3>
            <p className="text-sm text-muted-foreground">text-4xl font-semibold</p>
          </div>
          <div>
            <h4 className="text-3xl font-semibold">Heading 4</h4>
            <p className="text-sm text-muted-foreground">text-3xl font-semibold</p>
          </div>
          <div>
            <p className="text-lg">Body Large - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p className="text-sm text-muted-foreground">text-lg</p>
          </div>
          <div>
            <p className="text-base">Body - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p className="text-sm text-muted-foreground">text-base</p>
          </div>
          <div>
            <p className="text-sm">Body Small - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p className="text-sm text-muted-foreground">text-sm</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">Primary Button</button>
          <button className="btn-secondary">Secondary Button</button>
          <button className="btn-primary" disabled>Disabled Primary</button>
          <button className="btn-secondary" disabled>Disabled Secondary</button>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Standard Card</h3>
            </div>
            <div className="card-content">
              <p>This is a standard card with header and content sections.</p>
            </div>
            <div className="card-footer">
              <button className="btn-primary w-full">Action</button>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-2">Glass Card</h3>
            <p>This card uses glass morphism effects with backdrop blur.</p>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="font-semibold">Panel</h3>
            </div>
            <div className="panel-content">
              <p>This is a panel component with structured sections.</p>
            </div>
            <div className="panel-footer">
              <div className="flex gap-2">
                <button className="btn-secondary flex-1">Cancel</button>
                <button className="btn-primary flex-1">Save</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status Indicators */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Status Indicators</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="status-success p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Icons.Success size="sm" />
              <span className="font-medium">Success</span>
            </div>
          </div>
          <div className="status-warning p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Icons.Warning size="sm" />
              <span className="font-medium">Warning</span>
            </div>
          </div>
          <div className="status-error p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Icons.Error size="sm" />
              <span className="font-medium">Error</span>
            </div>
          </div>
          <div className="status-info p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Icons.Info size="sm" />
              <span className="font-medium">Info</span>
            </div>
          </div>
        </div>
      </section>

      {/* Icons */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Icons</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.SyncScript size="lg" />
            <span className="text-xs">SyncScript</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Brain size="lg" />
            <span className="text-xs">Brain</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Energy size="lg" />
            <span className="text-xs">Energy</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Task size="lg" />
            <span className="text-xs">Task</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Event size="lg" />
            <span className="text-xs">Event</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Calendar size="lg" />
            <span className="text-xs">Calendar</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Project size="lg" />
            <span className="text-xs">Project</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Budget size="lg" />
            <span className="text-xs">Budget</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Analytics size="lg" />
            <span className="text-xs">Analytics</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Settings size="lg" />
            <span className="text-xs">Settings</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.User size="lg" />
            <span className="text-xs">User</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
            <Icons.Notification size="lg" />
            <span className="text-xs">Notification</span>
          </div>
        </div>
      </section>

      {/* Animations */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Animations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-6 text-center animate-fade-in-up">
            <h3 className="font-semibold mb-2">Fade In Up</h3>
            <p className="text-sm text-muted-foreground">animate-fade-in-up</p>
          </div>
          <div className="card p-6 text-center animate-fade-in-down">
            <h3 className="font-semibold mb-2">Fade In Down</h3>
            <p className="text-sm text-muted-foreground">animate-fade-in-down</p>
          </div>
          <div className="card p-6 text-center animate-scale-in">
            <h3 className="font-semibold mb-2">Scale In</h3>
            <p className="text-sm text-muted-foreground">animate-scale-in</p>
          </div>
          <div className="card p-6 text-center animate-bounce-in">
            <h3 className="font-semibold mb-2">Bounce In</h3>
            <p className="text-sm text-muted-foreground">animate-bounce-in</p>
          </div>
        </div>
      </section>

      {/* Gradients */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Gradients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-semibold">
            Primary
          </div>
          <div className="h-32 bg-gradient-success rounded-lg flex items-center justify-center text-white font-semibold">
            Success
          </div>
          <div className="h-32 bg-gradient-warning rounded-lg flex items-center justify-center text-white font-semibold">
            Warning
          </div>
          <div className="h-32 bg-gradient-error rounded-lg flex items-center justify-center text-white font-semibold">
            Error
          </div>
        </div>
      </section>

      {/* Glass Morphism */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Glass Morphism</h2>
        <div className="relative h-64 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-glass backdrop-blur-glass rounded-2xl m-8 p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Glass Panel</h3>
            <p className="text-white/80">This panel demonstrates glass morphism effects with backdrop blur and transparency.</p>
          </div>
        </div>
      </section>

      {/* Responsive Design */}
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold">Responsive Design</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="card p-4">
              <h3 className="font-semibold">Card {i + 1}</h3>
              <p className="text-sm text-muted-foreground">Responsive grid item</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
