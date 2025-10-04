/**
 * Export Runbook Golden Flow Test
 * 
 * Tests the complete export flow:
 * 1. Run-of-Show PDF renders correctly
 * 2. RBAC redaction is enforced based on audience
 * 3. Professional document templates are applied
 * 4. Export jobs are tracked and can be downloaded
 */

import { test, expect } from '@playwright/test'

test.describe('Export Runbook Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="event-list"]')
  })

  test('exports run-of-show PDF with owner audience', async ({ page }) => {
    // Create an event with tasks
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Test Event for Export')
    await page.fill('[data-testid="event-description-input"]', 'This is a test event for export functionality')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.fill('[data-testid="event-location-input"]', 'Test Location')
    await page.click('[data-testid="save-event-button"]')
    
    // Add preparation tasks
    await page.click('[data-testid="add-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Setup Equipment')
    await page.fill('[data-testid="task-description-input"]', 'Set up all necessary equipment')
    await page.selectOption('[data-testid="task-priority-select"]', 'HIGH')
    await page.click('[data-testid="save-task-button"]')
    
    await page.click('[data-testid="add-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Welcome Guests')
    await page.fill('[data-testid="task-description-input"]', 'Greet and welcome all guests')
    await page.selectOption('[data-testid="task-priority-select"]', 'MEDIUM')
    await page.click('[data-testid="save-task-button"]')
    
    // Export the event
    await page.click('[data-testid="export-event-button"]')
    
    // Select export format
    await page.click('[data-testid="export-format-pdf"]')
    
    // Select audience
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-owner"]')
    
    // Select template
    await page.click('[data-testid="template-select"]')
    await page.click('[data-testid="template-run-of-show"]')
    
    // Preview the export
    await page.click('[data-testid="preview-export-button"]')
    
    // Wait for preview to load
    await page.waitForSelector('[data-testid="export-preview"]')
    
    // Check that preview contains event details
    const previewContent = page.locator('[data-testid="export-preview"]')
    await expect(previewContent).toContainText('Test Event for Export')
    await expect(previewContent).toContainText('This is a test event for export functionality')
    await expect(previewContent).toContainText('Test Location')
    await expect(previewContent).toContainText('Setup Equipment')
    await expect(previewContent).toContainText('Welcome Guests')
    
    // Check that preview shows professional formatting
    await expect(previewContent).toContainText('RUN OF SHOW')
    await expect(previewContent).toContainText('Event Details')
    await expect(previewContent).toContainText('Preparation Tasks')
    
    // Download the export
    await page.click('[data-testid="download-export-button"]')
    
    // Wait for download to complete
    await page.waitForSelector('[data-testid="export-completed"]')
    
    // Check that export job was created
    await page.click('[data-testid="nav-export"]')
    await page.waitForSelector('[data-testid="export-jobs-list"]')
    
    const exportJobs = page.locator('[data-testid="export-job-item"]')
    await expect(exportJobs).toHaveCount(1)
    
    const jobItem = exportJobs.first()
    await expect(jobItem).toContainText('Test Event for Export')
    await expect(jobItem).toContainText('PDF')
    await expect(jobItem).toContainText('Owner')
    await expect(jobItem).toContainText('Run of Show')
  })

  test('exports with vendor audience redacts sensitive information', async ({ page }) => {
    // Create an event with sensitive information
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Private Event')
    await page.fill('[data-testid="event-description-input"]', 'This event contains sensitive information that should be redacted for vendors')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.fill('[data-testid="event-location-input"]', 'Private Location')
    await page.click('[data-testid="save-event-button"]')
    
    // Add tasks with sensitive information
    await page.click('[data-testid="add-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Handle VIP Guests')
    await page.fill('[data-testid="task-description-input"]', 'Special handling for VIP guests with confidential requirements')
    await page.click('[data-testid="save-task-button"]')
    
    // Export with vendor audience
    await page.click('[data-testid="export-event-button"]')
    await page.click('[data-testid="export-format-pdf"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-vendor"]')
    await page.click('[data-testid="template-select"]')
    await page.click('[data-testid="template-run-of-show"]')
    
    // Preview the export
    await page.click('[data-testid="preview-export-button"]')
    await page.waitForSelector('[data-testid="export-preview"]')
    
    // Check that sensitive information is redacted
    const previewContent = page.locator('[data-testid="export-preview"]')
    await expect(previewContent).toContainText('Private Event')
    await expect(previewContent).not.toContainText('sensitive information')
    await expect(previewContent).not.toContainText('VIP Guests')
    await expect(previewContent).not.toContainText('confidential requirements')
    
    // Check that redaction notice is shown
    await expect(previewContent).toContainText('REDACTED')
    await expect(previewContent).toContainText('Information has been redacted for vendor audience')
  })

  test('exports with attendee audience shows limited information', async ({ page }) => {
    // Create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Public Event')
    await page.fill('[data-testid="event-description-input"]', 'This is a public event for attendees')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.fill('[data-testid="event-location-input"]', 'Public Location')
    await page.click('[data-testid="save-event-button"]')
    
    // Add tasks
    await page.click('[data-testid="add-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Setup Registration')
    await page.fill('[data-testid="task-description-input"]', 'Set up registration table and materials')
    await page.click('[data-testid="save-task-button"]')
    
    // Export with attendee audience
    await page.click('[data-testid="export-event-button"]')
    await page.click('[data-testid="export-format-pdf"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-attendee"]')
    await page.click('[data-testid="template-select"]')
    await page.click('[data-testid="template-attendee-guide"]')
    
    // Preview the export
    await page.click('[data-testid="preview-export-button"]')
    await page.waitForSelector('[data-testid="export-preview"]')
    
    // Check that attendee-relevant information is shown
    const previewContent = page.locator('[data-testid="export-preview"]')
    await expect(previewContent).toContainText('Public Event')
    await expect(previewContent).toContainText('This is a public event for attendees')
    await expect(previewContent).toContainText('Public Location')
    await expect(previewContent).toContainText('10:00 AM - 12:00 PM')
    
    // Check that internal tasks are not shown
    await expect(previewContent).not.toContainText('Setup Registration')
    await expect(previewContent).not.toContainText('Set up registration table')
    
    // Check that attendee guide template is used
    await expect(previewContent).toContainText('ATTENDEE GUIDE')
    await expect(previewContent).toContainText('What to Expect')
    await expect(previewContent).toContainText('Event Schedule')
  })

  test('exports multiple formats for same event', async ({ page }) => {
    // Create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Multi-Format Event')
    await page.fill('[data-testid="event-description-input"]', 'Event for testing multiple export formats')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Export as PDF
    await page.click('[data-testid="export-event-button"]')
    await page.click('[data-testid="export-format-pdf"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-owner"]')
    await page.click('[data-testid="template-select"]')
    await page.click('[data-testid="template-run-of-show"]')
    await page.click('[data-testid="download-export-button"]')
    
    await page.waitForSelector('[data-testid="export-completed"]')
    
    // Export as CSV
    await page.click('[data-testid="export-event-button"]')
    await page.click('[data-testid="export-format-csv"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-owner"]')
    await page.click('[data-testid="download-export-button"]')
    
    await page.waitForSelector('[data-testid="export-completed"]')
    
    // Export as ICS
    await page.click('[data-testid="export-event-button"]')
    await page.click('[data-testid="export-format-ics"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-owner"]')
    await page.click('[data-testid="download-export-button"]')
    
    await page.waitForSelector('[data-testid="export-completed"]')
    
    // Check that all export jobs were created
    await page.click('[data-testid="nav-export"]')
    await page.waitForSelector('[data-testid="export-jobs-list"]')
    
    const exportJobs = page.locator('[data-testid="export-job-item"]')
    await expect(exportJobs).toHaveCount(3)
    
    // Check that each format is represented
    const jobTexts = await exportJobs.evaluateAll(items => 
      items.map(item => item.textContent)
    )
    
    expect(jobTexts.some(text => text?.includes('PDF'))).toBe(true)
    expect(jobTexts.some(text => text?.includes('CSV'))).toBe(true)
    expect(jobTexts.some(text => text?.includes('ICS'))).toBe(true)
  })

  test('exports task with budget information', async ({ page }) => {
    // Create a task with budget
    await page.click('[data-testid="nav-tasks"]')
    await page.click('[data-testid="create-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Purchase Equipment')
    await page.fill('[data-testid="task-description-input"]', 'Buy necessary equipment for the event')
    await page.selectOption('[data-testid="task-priority-select"]', 'HIGH')
    await page.click('[data-testid="save-task-button"]')
    
    // Add budget information
    await page.click('[data-testid="task-budget-button"]')
    await page.fill('[data-testid="budget-line-item-name"]', 'Audio Equipment')
    await page.fill('[data-testid="budget-line-item-price"]', '500.00')
    await page.fill('[data-testid="budget-line-item-quantity"]', '2')
    await page.click('[data-testid="add-budget-line-item"]')
    
    await page.fill('[data-testid="budget-line-item-name"]', 'Lighting')
    await page.fill('[data-testid="budget-line-item-price"]', '300.00')
    await page.fill('[data-testid="budget-line-item-quantity"]', '1')
    await page.click('[data-testid="add-budget-line-item"]')
    
    await page.click('[data-testid="save-budget-button"]')
    
    // Export the task
    await page.click('[data-testid="export-task-button"]')
    await page.click('[data-testid="export-format-pdf"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-owner"]')
    await page.click('[data-testid="template-select"]')
    await page.click('[data-testid="template-procurement-sheet"]')
    
    // Preview the export
    await page.click('[data-testid="preview-export-button"]')
    await page.waitForSelector('[data-testid="export-preview"]')
    
    // Check that budget information is included
    const previewContent = page.locator('[data-testid="export-preview"]')
    await expect(previewContent).toContainText('Purchase Equipment')
    await expect(previewContent).toContainText('Audio Equipment')
    await expect(previewContent).toContainText('$500.00')
    await expect(previewContent).toContainText('2')
    await expect(previewContent).toContainText('Lighting')
    await expect(previewContent).toContainText('$300.00')
    await expect(previewContent).toContainText('Total: $1,300.00')
    
    // Check that procurement sheet template is used
    await expect(previewContent).toContainText('PROCUREMENT SHEET')
    await expect(previewContent).toContainText('Item')
    await expect(previewContent).toContainText('Price')
    await expect(previewContent).toContainText('Quantity')
    await expect(previewContent).toContainText('Total')
  })
})

test.describe('Export Error Handling', () => {
  test('handles export job failure gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/export/create', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Export job creation failed' })
      })
    })
    
    // Create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Error Test Event')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Try to export
    await page.click('[data-testid="export-event-button"]')
    await page.click('[data-testid="export-format-pdf"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-owner"]')
    await page.click('[data-testid="download-export-button"]')
    
    // Check that error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Export job creation failed')
  })

  test('handles preview generation failure', async ({ page }) => {
    // Mock preview API failure
    await page.route('/api/export/preview', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Preview generation failed' })
      })
    })
    
    // Create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Preview Error Event')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Try to preview export
    await page.click('[data-testid="export-event-button"]')
    await page.click('[data-testid="export-format-pdf"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-owner"]')
    await page.click('[data-testid="preview-export-button"]')
    
    // Check that error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Preview generation failed')
  })

  test('handles download failure gracefully', async ({ page }) => {
    // Create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Download Error Event')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Export the event
    await page.click('[data-testid="export-event-button"]')
    await page.click('[data-testid="export-format-pdf"]')
    await page.click('[data-testid="audience-select"]')
    await page.click('[data-testid="audience-owner"]')
    await page.click('[data-testid="download-export-button"]')
    
    await page.waitForSelector('[data-testid="export-completed"]')
    
    // Mock download failure
    await page.route('/api/export/download/*', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Export file not found' })
      })
    })
    
    // Try to download the export
    await page.click('[data-testid="nav-export"]')
    await page.waitForSelector('[data-testid="export-jobs-list"]')
    
    const exportJob = page.locator('[data-testid="export-job-item"]').first()
    await exportJob.click('[data-testid="download-export-button"]')
    
    // Check that error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Export file not found')
  })
})
