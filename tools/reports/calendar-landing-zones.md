# Calendar Landing Zones - Panel Conversion

## Overview
This document identifies the key UI surfaces in the Calendar route that need to be converted to Panel primitives for PR 3.3.

## Target Files

### Primary Components
- **`client/src/pages/CalendarPage.tsx`** - Main calendar page component
- **`client/src/components/ConflictResolver.tsx`** - Conflict resolution dialog

## UI Surfaces to Convert

### 1. Action Bar (Lines 511-530 in CalendarPage.tsx)
**Current Structure:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Your Events</span>
        </CardTitle>
        <CardDescription>
          {events?.length || 0} events scheduled
        </CardDescription>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPastEvents(!showPastEvents)}
      >
        {showPastEvents ? 'Hide Past Events' : 'Show Past Events'}
      </Button>
    </div>
  </CardHeader>
```

**Panel Conversion:**
- Wrap in `<Panel density="compact">`
- Use `<PanelHeader>` with `<PanelTitle>` and `<PanelSubtitle>`
- Move toggle button to `<Toolbar>` in header

### 2. Google Calendar Connection Status (Lines 380-436 in CalendarPage.tsx)
**Current Structure:**
```tsx
<Card className="border-green-200 bg-green-50">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <Calendar className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <h3 className="font-medium text-green-900">Google Calendar Connected</h3>
          <p className="text-sm text-green-700">
            Your Google Calendar is connected. Use the sync button above to import events.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.href = '/google-calendar'}
        className="border-green-300 text-green-700 hover:bg-green-100"
      >
        Manage Connection
      </Button>
    </div>
  </CardContent>
</Card>
```

**Panel Conversion:**
- Wrap in `<Panel tone="success">`
- Use `<PanelHeader>` with status icon and title
- Use `<PanelBody>` for content
- Move action button to `<Toolbar>`

### 3. Event Creation Form (Lines 438-509 in CalendarPage.tsx)
**Current Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Create New Event</CardTitle>
    <CardDescription>Add a new event to your calendar</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Form fields */}
  </CardContent>
</Card>
```

**Panel Conversion:**
- Wrap in `<Panel>`
- Use `<PanelHeader>` with `<PanelTitle>` and `<PanelSubtitle>`
- Use `<PanelBody>` for form content
- Use `<PanelFooter>` for action buttons

### 4. Conflict Resolver Dialog (ConflictResolver.tsx)
**Current Structure:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        Schedule Conflicts
      </DialogTitle>
      <DialogDescription>
        Review and resolve scheduling conflicts for this event
      </DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

**Panel Conversion:**
- Keep Dialog container
- Replace DialogHeader with `<PanelHeader>`
- Use `<PanelTitle>` and `<PanelSubtitle>`
- Wrap content sections in `<Panel>` components
- Use `<PanelBody>` for conflict list
- Use `<PanelFooter>` for action buttons

## Key Features to Preserve

### Data Flow
- Event fetching and caching (React Query)
- Weather data integration
- Preparation tasks loading
- Google Calendar sync status

### Functionality
- Event creation, editing, deletion
- Past events toggle
- Event expansion/collapse
- Conflict resolution
- Export functionality (if present)

### Accessibility
- Keyboard navigation
- Focus management
- ARIA labels
- Screen reader support

## Panel Primitives to Use

### Core Components
- `<Panel>` - Main container
- `<PanelHeader>` - Header section
- `<PanelTitle>` - Title text
- `<PanelSubtitle>` - Subtitle/description
- `<PanelBody>` - Main content area
- `<PanelFooter>` - Footer with actions
- `<Toolbar>` - Action buttons in header

### Styling
- `density="compact"` for action bars
- `tone="success"` for connection status
- `tone="warning"` for conflict resolver
- Gradient borders and glass morphism effects

## Implementation Notes

### Feature Flag Integration
- All panel conversions behind `new_ui` flag
- Legacy Card components remain when flag is off
- Conditional rendering based on flag state

### Telemetry Events
- `ui.panel.rendered{screen:"calendar", panel:"actionbar"}`
- `ui.panel.rendered{screen:"calendar", panel:"connection"}`
- `ui.panel.rendered{screen:"calendar", panel:"events"}`
- `ui.dialog.opened{screen:"calendar", kind:"conflict-resolver"}`
- `ui.dialog.closed{screen:"calendar", kind:"conflict-resolver"}`

### Focus Management
- Conflict resolver dialog traps focus
- ESC key closes dialog and restores focus to trigger
- Tab order maintained in all panels
- Visible focus rings on all interactive elements

## Testing Requirements

### E2E Tests
- Panel rendering with `new_ui=true`
- Conflict resolver keyboard navigation
- Focus restoration on dialog close
- Accessibility compliance (axe 0 criticals)

### Performance
- Bundle size: per-route JS ≤ 180KB gzipped
- TBT within baseline ±10%
- No CLS regression

### Rollback Strategy
- Feature flag `new_ui=false` restores legacy components
- No code changes required for rollback
- Immediate effect on flag toggle
