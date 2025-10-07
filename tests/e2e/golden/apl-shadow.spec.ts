import { test, expect } from '@playwright/test';

test.describe('APL Shadow Wiring', () => {
  test('ScriptApplied publishes exactly one outbox message', async ({ request }) => {
    // This test verifies that when a ScriptApplied event is published,
    // exactly one AplSuggestRequested message is enqueued in the outbox
    
    // First, get initial outbox count
    const initialResponse = await request.get('http://localhost:3002/api/admin/outbox');
    const initialData = await initialResponse.json();
    const initialCount = initialData.events?.length || 0;
    
    // Publish a ScriptApplied event (this would normally come from script application)
    const scriptAppliedPayload = {
      scriptId: 'script_test_123',
      userId: 'user_test_123',
      eventId: 'event_test_123',
      taskIds: ['task_1', 'task_2'],
      appliedAt: new Date().toISOString()
    };
    
    // Simulate publishing the event (in real scenario, this would be done by the script service)
    const publishResponse = await request.post('http://localhost:3002/api/_test/publish-event', {
      data: {
        eventType: 'ScriptApplied',
        aggregateType: 'Script',
        aggregateId: scriptAppliedPayload.scriptId,
        payload: scriptAppliedPayload
      }
    });
    
    expect(publishResponse.ok()).toBeTruthy();
    
    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check that exactly one AplSuggestRequested message was enqueued
    const finalResponse = await request.get('http://localhost:3002/api/admin/outbox');
    const finalData = await finalResponse.json();
    const finalCount = finalData.events?.length || 0;
    
    // Should have one more message
    expect(finalCount).toBe(initialCount + 1);
    
    // Find the AplSuggestRequested message
    const aplMessage = finalData.events?.find((event: any) => 
      event.eventType === 'AplSuggestRequested'
    );
    
    expect(aplMessage).toBeDefined();
    expect(aplMessage.aggregateId).toBe('event_test_123');
    expect(aplMessage.status).toBe('pending');
    
    // Verify the payload contains the correct data
    const payload = JSON.parse(aplMessage.payload);
    expect(payload.userId).toBe('user_test_123');
    expect(payload.eventId).toBe('event_test_123');
    expect(payload.key).toBe('event_test_123:v0:script_applied');
  });
  
  test('duplicate ScriptApplied with same key produces no duplicate outbox messages', async ({ request }) => {
    // This test verifies idempotency - same key should not create duplicate messages
    
    const scriptAppliedPayload = {
      scriptId: 'script_test_456',
      userId: 'user_test_456',
      eventId: 'event_test_456',
      taskIds: ['task_3'],
      appliedAt: new Date().toISOString()
    };
    
    // Publish the same event twice (simulating retry scenario)
    await request.post('http://localhost:3002/api/_test/publish-event', {
      data: {
        eventType: 'ScriptApplied',
        aggregateType: 'Script',
        aggregateId: scriptAppliedPayload.scriptId,
        payload: scriptAppliedPayload
      }
    });
    
    await request.post('http://localhost:3002/api/_test/publish-event', {
      data: {
        eventType: 'ScriptApplied',
        aggregateType: 'Script',
        aggregateId: scriptAppliedPayload.scriptId,
        payload: scriptAppliedPayload
      }
    });
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check outbox - should only have one AplSuggestRequested message
    const response = await request.get('http://localhost:3002/api/admin/outbox');
    const data = await response.json();
    
    const aplMessages = data.events?.filter((event: any) => 
      event.eventType === 'AplSuggestRequested' && 
      event.aggregateId === 'event_test_456'
    ) || [];
    
    expect(aplMessages.length).toBe(1);
  });
  
  test('EventCreated triggers APL suggest request', async ({ request }) => {
    // Test that EventCreated events also trigger APL suggest requests
    
    const eventCreatedPayload = {
      eventId: 'event_test_789',
      userId: 'user_test_789',
      title: 'Test Event',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date().toISOString()
    };
    
    await request.post('http://localhost:3002/api/_test/publish-event', {
      data: {
        eventType: 'EventCreated',
        aggregateType: 'Event',
        aggregateId: eventCreatedPayload.eventId,
        payload: eventCreatedPayload
      }
    });
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check that AplSuggestRequested was enqueued
    const response = await request.get('http://localhost:3002/api/admin/outbox');
    const data = await response.json();
    
    const aplMessage = data.events?.find((event: any) => 
      event.eventType === 'AplSuggestRequested' &&
      event.aggregateId === 'event_test_789'
    );
    
    expect(aplMessage).toBeDefined();
    
    const payload = JSON.parse(aplMessage.payload);
    expect(payload.key).toBe('event_test_789:v0:event_created');
  });
  
  test('APL metrics are recorded correctly', async ({ request }) => {
    // Test that APL metrics are incremented when shadow processing occurs
    
    // Get initial metrics
    const initialMetrics = await request.get('http://localhost:3002/metrics');
    const initialText = await initialMetrics.text();
    
    // Extract initial count (this is a simplified check)
    const initialMatch = initialText.match(/apl_suggested_total (\d+)/);
    const initialCount = initialMatch ? parseInt(initialMatch[1]) : 0;
    
    // Trigger an APL suggest request
    const scriptAppliedPayload = {
      scriptId: 'script_metrics_test',
      userId: 'user_metrics_test',
      eventId: 'event_metrics_test',
      appliedAt: new Date().toISOString()
    };
    
    await request.post('http://localhost:3002/api/_test/publish-event', {
      data: {
        eventType: 'ScriptApplied',
        aggregateType: 'Script',
        aggregateId: scriptAppliedPayload.scriptId,
        payload: scriptAppliedPayload
      }
    });
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check metrics
    const finalMetrics = await request.get('http://localhost:3002/metrics');
    const finalText = await finalMetrics.text();
    
    const finalMatch = finalText.match(/apl_suggested_total (\d+)/);
    const finalCount = finalMatch ? parseInt(finalMatch[1]) : 0;
    
    // Should have incremented
    expect(finalCount).toBeGreaterThan(initialCount);
  });
});
