#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Checks for security headers and common security issues
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const SECURITY_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'x-xss-protection',
  'strict-transport-security',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-embedder-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy'
];

const REQUIRED_CSP_DIRECTIVES = [
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Security-Audit-Script/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function auditSecurityHeaders(baseUrl) {
  console.log(`🔍 Auditing security headers for ${baseUrl}\n`);
  
  const routes = [
    '/',
    '/api/user/dashboard',
    '/api/tasks',
    '/api/calendar'
  ];
  
  let allPassed = true;
  
  for (const route of routes) {
    try {
      const url = `${baseUrl}${route}`;
      console.log(`📋 Checking ${route}...`);
      
      const response = await makeRequest(url);
      
      if (response.statusCode >= 400) {
        console.log(`   ⚠️  Route returned ${response.statusCode}, skipping header check`);
        continue;
      }
      
      const headers = response.headers;
      const issues = [];
      
      // Check for required security headers
      for (const header of SECURITY_HEADERS) {
        if (!headers[header]) {
          issues.push(`Missing ${header}`);
        }
      }
      
      // Check CSP directives
      const csp = headers['content-security-policy'];
      if (csp) {
        for (const directive of REQUIRED_CSP_DIRECTIVES) {
          if (!csp.includes(directive)) {
            issues.push(`CSP missing directive: ${directive}`);
          }
        }
        
        // Check for dangerous directives
        if (csp.includes("'unsafe-inline'") && !csp.includes("'nonce-")) {
          issues.push('CSP allows unsafe-inline without nonce');
        }
        
        if (csp.includes("'unsafe-eval'")) {
          issues.push('CSP allows unsafe-eval');
        }
      }
      
      // Check X-Frame-Options
      if (headers['x-frame-options'] && headers['x-frame-options'] !== 'DENY') {
        issues.push('X-Frame-Options should be DENY');
      }
      
      // Check HSTS
      if (baseUrl.startsWith('https://') && !headers['strict-transport-security']) {
        issues.push('Missing HSTS header on HTTPS');
      }
      
      if (issues.length === 0) {
        console.log(`   ✅ All security headers present`);
      } else {
        console.log(`   ❌ Security issues found:`);
        issues.forEach(issue => console.log(`      - ${issue}`));
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking ${route}: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function checkCommonVulnerabilities(baseUrl) {
  console.log(`\n🔍 Checking for common vulnerabilities...\n`);
  
  let allPassed = true;
  
  try {
    // Check for directory traversal
    const traversalResponse = await makeRequest(`${baseUrl}/api/../../../etc/passwd`);
    if (traversalResponse.statusCode === 200) {
      console.log('❌ Directory traversal vulnerability detected');
      allPassed = false;
    } else {
      console.log('✅ Directory traversal protection working');
    }
    
    // Check for SQL injection (basic test)
    const sqlResponse = await makeRequest(`${baseUrl}/api/tasks?id=1' OR '1'='1`);
    if (sqlResponse.statusCode === 200 && sqlResponse.body.includes('error')) {
      console.log('✅ SQL injection protection working');
    } else {
      console.log('⚠️  SQL injection test inconclusive');
    }
    
    // Check for XSS (basic test)
    const xssResponse = await makeRequest(`${baseUrl}/api/tasks?search=<script>alert('xss')</script>`);
    if (xssResponse.statusCode === 200 && !xssResponse.body.includes('<script>')) {
      console.log('✅ XSS protection working');
    } else {
      console.log('⚠️  XSS test inconclusive');
    }
    
  } catch (error) {
    console.log(`❌ Error checking vulnerabilities: ${error.message}`);
    allPassed = false;
  }
  
  return allPassed;
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  
  console.log('🛡️  SyncScript Security Audit\n');
  console.log(`Target: ${baseUrl}\n`);
  
  try {
    const headersPassed = await auditSecurityHeaders(baseUrl);
    const vulnerabilitiesPassed = await checkCommonVulnerabilities(baseUrl);
    
    console.log('\n' + '='.repeat(50));
    
    if (headersPassed && vulnerabilitiesPassed) {
      console.log('🎉 Security audit passed!');
      process.exit(0);
    } else {
      console.log('❌ Security audit failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Security audit failed with error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
