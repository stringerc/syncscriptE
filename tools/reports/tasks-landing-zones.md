# Tasks Landing Zone Analysis

## Overview
Analysis of Tasks route components for PR 3.2: Tasks (List/Board) → Panels conversion.

## Main Components

### 1. Page Component
- **File**: `client/src/pages/TasksPage.tsx`
- **Lines**: 19-927
- **Structure**: Single page component with multiple sections

### 2. Major Sections (JSX Anchors)

#### Header Section
- **Lines**: 341-355
- **Content**: Page title, description, "New Task" button
- **Current**: Simple div with flex layout

#### Add Task Form (Conditional)
- **Lines**: 357-435
- **Content**: Inline form for creating tasks
- **Current**: Card component with form fields

#### Main Tasks List
- **Lines**: 437-584
- **Content**: Pending tasks list with priority ordering
- **Current**: Card component with task items
- **Features**: Priority badges, action buttons, event indicators

#### Completed Tasks Section
- **Lines**: 586-749
- **Content**: Collapsible completed tasks grouped by month
- **Current**: Card component with toggle button

#### Deleted Tasks Section
- **Lines**: 751-904
- **Content**: Collapsible deleted tasks grouped by month
- **Current**: Card component with toggle button

### 3. Modals/Drawers

#### TaskModal
- **File**: `client/src/components/TaskModal.tsx`
- **Lines**: 1-1285
- **Purpose**: Create/edit task modal
- **Features**: Form fields, speech-to-text, inline suggestions, export

#### ResourcesDrawer
- **File**: `client/src/components/ResourcesDrawer.tsx`
- **Purpose**: View task resources
- **Usage**: Opened from task items

#### BudgetModal
- **File**: `client/src/components/budget/BudgetModal.tsx`
- **Purpose**: Task budget management
- **Usage**: Opened from budget chips

### 4. Key Features to Preserve

#### Task Item Actions
- View task details
- View resources
- Complete/uncomplete task
- Delete task
- Restore deleted task

#### Keyboard Shortcuts (To Add)
- "n" or Alt+N: Open new task modal
- ESC: Close modal and restore focus
- ENTER: Submit form

#### State Management
- Task creation/editing
- Task completion/deletion
- Show/hide completed tasks
- Show/hide deleted tasks
- Modal/drawer states

### 5. Panel Conversion Plan

#### Header Panel
- **Target**: Lines 341-355
- **Panel Type**: `Panel` with `density="compact"`
- **Content**: Title, description, New Task button

#### Tasks List Panel
- **Target**: Lines 437-584
- **Panel Type**: `Panel` with `tone="default"`
- **Content**: Task list with empty state

#### Completed Tasks Panel
- **Target**: Lines 586-749
- **Panel Type**: `Panel` with `tone="default"`
- **Content**: Collapsible completed tasks

#### Deleted Tasks Panel
- **Target**: Lines 751-904
- **Panel Type**: `Panel` with `tone="warning"`
- **Content**: Collapsible deleted tasks

### 6. Focus Management Requirements

#### Modal Focus
- Store `lastActiveElement` before opening modal
- Restore focus to trigger button on modal close
- Focus first input field when modal opens

#### Keyboard Navigation
- Tab order: Header → Task items → Action buttons
- ESC key handling for modals
- Enter key for form submission

### 7. Telemetry Events

#### Panel Rendering
- `ui.panel.rendered{screen:"tasks", panel:"header"}`
- `ui.panel.rendered{screen:"tasks", panel:"list"}`
- `ui.panel.rendered{screen:"tasks", panel:"completed"}`
- `ui.panel.rendered{screen:"tasks", panel:"deleted"}`

#### Drawer Events
- `ui.drawer.opened{screen:"tasks", kind:"task-create"}`
- `ui.drawer.opened{screen:"tasks", kind:"task-edit"}`
- `ui.drawer.closed{screen:"tasks", kind:"task-create"}`
- `ui.drawer.closed{screen:"tasks", kind:"task-edit"}`

### 8. Accessibility Requirements

#### Focus Management
- Visible focus rings on all interactive elements
- Proper tab order
- Focus restoration on modal close

#### Keyboard Shortcuts
- "n" or Alt+N: Open new task modal
- ESC: Close modal and restore focus
- ENTER: Submit form

#### Screen Reader Support
- Proper ARIA labels
- Role attributes
- Live regions for dynamic content

### 9. Performance Considerations

#### Bundle Size
- Target: ≤ 180KB gz per route
- Monitor: Panel component additions
- Optimize: Lazy load modals if needed

#### Animation
- Respect `prefers-reduced-motion`
- Use 200ms ease-out transitions
- Disable animations when motion is reduced

### 10. Testing Requirements

#### E2E Tests
- Panel rendering
- Keyboard-only task creation
- Focus restoration
- Accessibility compliance

#### Unit Tests
- Panel component rendering
- Focus management
- Keyboard shortcuts
- Telemetry events

## Implementation Notes

1. **No Logic Changes**: All existing functionality must be preserved
2. **Feature Flag**: Only render panels when `new_ui` is true
3. **Rollback**: Flip `new_ui` to false to revert
4. **Gradual Migration**: Can be deployed incrementally
5. **Performance**: Monitor bundle size and runtime performance
