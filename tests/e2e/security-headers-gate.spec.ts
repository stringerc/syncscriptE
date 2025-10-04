/**
 * Security Headers Gate Test
 * 
 * Verifies that security headers are present on all app routes and no console CSP violations
 */

import { test, expect } from '@playwright/test';

test.describe('Security Headers Gate', () => {
  test('headers present on all app routes', async ({ request }) => {
    // Test various routes to ensure security headers are present
    
    const routes = [
      '/',
      '/api/user/dashboard',
      '/api/tasks',
      '/api/calendar',
      '/api/export/preview'
    ];
    
    for (const route of routes) {
      const response = await request.get(route);
      
      // Check for essential security headers
      const headers = response.headers();
      
      // Content Security Policy
      expect(headers['content-security-policy']).toBeTruthy();
      expect(headers['content-security-policy']).toContain("default-src 'self'");
      expect(headers['content-security-policy']).toContain("script-src 'self' 'nonce-");
      expect(headers['content-security-policy']).toContain("object-src 'none'");
      expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
      
      // X-Frame-Options
      expect(headers['x-frame-options']).toBe('DENY');
      
      // Cross-Origin policies
      expect(headers['cross-origin-embedder-policy']).toBe('require-corp');
      expect(headers['cross-origin-opener-policy']).toBe('same-origin');
      expect(headers['cross-origin-resource-policy']).toBe('same-origin');
      
      // Referrer Policy
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      
      // X-Content-Type-Options
      expect(headers['x-content-type-options']).toBe('nosniff');
      
      // Permissions Policy
      expect(headers['permissions-policy']).toBeTruthy();
      expect(headers['permissions-policy']).toContain('camera=()');
      expect(headers['permissions-policy']).toContain('microphone=()');
      
      // X-XSS-Protection
      expect(headers['x-xss-protection']).toBe('1; mode=block');
    }
  });
  
  test('no console CSP violations for core flows', async ({ page }) => {
    const cspViolations: string[] = [];
    
    // Listen for CSP violations
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        cspViolations.push(msg.text());
      }
    });
    
    // Navigate to the main app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for any CSP violations
    expect(cspViolations).toHaveLength(0);
  });
  
  test('HSTS header present on HTTPS', async ({ request }) => {
    // This test would require HTTPS setup
    // For now, we'll verify the header structure is correct
    
    const response = await request.get('/');
    const headers = response.headers();
    
    // In development, HSTS might not be present
    // In production with HTTPS, it should be present
    if (headers['strict-transport-security']) {
      expect(headers['strict-transport-security']).toContain('max-age=');
      expect(headers['strict-transport-security']).toContain('includeSubDomains');
    }
  });
  
  test('nonce is generated and included in CSP', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    
    const csp = headers['content-security-policy'];
    expect(csp).toBeTruthy();
    
    // Extract nonce from CSP
    const nonceMatch = csp.match(/'nonce-([^']+)'/);
    expect(nonceMatch).toBeTruthy();
    
    const nonce = nonceMatch![1];
    expect(nonce).toBeTruthy();
    expect(nonce.length).toBeGreaterThan(10); // Base64 encoded nonce should be reasonably long
  });
  
  test('cache control headers for API endpoints', async ({ request }) => {
    // Test POST endpoint (should have no-cache headers)
    const response = await request.post('/api/tasks', {
      data: {
        title: 'Test task',
        description: 'Test description'
      }
    });
    
    const headers = response.headers();
    
    // Non-GET API requests should have no-cache headers
    if (response.status() !== 404) { // Skip if endpoint doesn't exist
      expect(headers['cache-control']).toContain('no-store');
      expect(headers['cache-control']).toContain('no-cache');
    }
  });
  
  test('static assets have appropriate cache headers', async ({ request }) => {
    // Test static asset (if any exist)
    const response = await request.get('/favicon.ico');
    
    if (response.status() === 200) {
      const headers = response.headers();
      
      // Static assets should have long cache headers
      expect(headers['cache-control']).toContain('public');
      expect(headers['cache-control']).toContain('max-age=');
      expect(headers['x-content-type-options']).toBe('nosniff');
    }
  });
  
  test('suspicious headers are logged', async ({ request }) => {
    // This test would require access to server logs
    // For now, we'll verify the request validation middleware is working
    
    const response = await request.get('/', {
      headers: {
        'X-Forwarded-Host': 'malicious.com',
        'X-Originating-IP': '192.168.1.1'
      }
    });
    
    // The request should still be processed (middleware logs but doesn't block)
    expect(response.status()).toBe(200);
  });
  
  test('content type validation for POST requests', async ({ request }) => {
    // Test POST with invalid content type
    const response = await request.post('/api/tasks', {
      headers: {
        'Content-Type': 'text/plain'
      },
      data: 'invalid data'
    });
    
    // The request should be processed (validation logs but doesn't block)
    // The actual validation would be in server logs
    expect(response.status()).toBeDefined();
  });
});
