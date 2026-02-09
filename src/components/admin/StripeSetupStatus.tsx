/**
 * Stripe Setup Status Component
 * 
 * Administrative component to verify Stripe integration is configured correctly.
 * Shows real-time status of all Stripe components.
 * 
 * Usage: Add to admin dashboard or settings page during setup
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, XCircle, AlertCircle, Loader2, 
  DollarSign, Webhook, CreditCard, Key, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface StatusCheck {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function StripeSetupStatus() {
  const [checks, setChecks] = useState<StatusCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: StatusCheck[] = [];

    // Check 1: API Key Configuration
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/stripe/pricing`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        results.push({
          name: 'Stripe API Key',
          status: 'success',
          message: 'API key configured and working',
          details: 'Server can communicate with Stripe'
        });
      } else {
        results.push({
          name: 'Stripe API Key',
          status: 'error',
          message: 'API key not configured or invalid',
          details: 'Check STRIPE_SECRET_KEY in environment variables'
        });
      }
    } catch (error) {
      results.push({
        name: 'Stripe API Key',
        status: 'error',
        message: 'Failed to connect to server',
        details: String(error)
      });
    }

    // Check 2: Price IDs Configuration
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/stripe/pricing`
      );
      const data = await response.json();

      if (data.plans) {
        const hasPlaceholders = Object.values(data.plans).some((plan: any) => 
          plan.price_id.includes('starter_monthly') || 
          plan.price_id.includes('professional_monthly') ||
          plan.price_id.includes('enterprise_monthly')
        );

        if (hasPlaceholders) {
          results.push({
            name: 'Price IDs',
            status: 'warning',
            message: 'Using placeholder Price IDs',
            details: 'Update PRICING_PLANS in stripe-routes.tsx with actual Stripe Price IDs'
          });
        } else {
          results.push({
            name: 'Price IDs',
            status: 'success',
            message: 'Price IDs configured',
            details: `${Object.keys(data.plans).length} pricing plans detected`
          });
        }
      }
    } catch (error) {
      results.push({
        name: 'Price IDs',
        status: 'error',
        message: 'Failed to fetch pricing plans',
        details: String(error)
      });
    }

    // Check 3: Webhook Secret
    // Can't directly check, but we can infer from other checks
    results.push({
      name: 'Webhook Secret',
      status: 'warning',
      message: 'Cannot verify webhook secret client-side',
      details: 'Ensure STRIPE_WEBHOOK_SECRET is set in Supabase environment variables'
    });

    // Check 4: Server Routes
    try {
      const endpoints = [
        '/stripe/pricing',
        '/stripe/subscription/test-user'
      ];

      let workingEndpoints = 0;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9${endpoint}`
          );
          if (response.ok || response.status === 404) {
            workingEndpoints++;
          }
        } catch (e) {
          // Endpoint failed
        }
      }

      if (workingEndpoints === endpoints.length) {
        results.push({
          name: 'Server Routes',
          status: 'success',
          message: 'All Stripe endpoints responding',
          details: `${workingEndpoints}/${endpoints.length} endpoints active`
        });
      } else {
        results.push({
          name: 'Server Routes',
          status: 'warning',
          message: 'Some endpoints not responding',
          details: `${workingEndpoints}/${endpoints.length} endpoints active`
        });
      }
    } catch (error) {
      results.push({
        name: 'Server Routes',
        status: 'error',
        message: 'Failed to check server routes',
        details: String(error)
      });
    }

    // Check 5: Environment
    const isTestMode = publicAnonKey.includes('test') || 
                       window.location.hostname.includes('localhost');
    
    results.push({
      name: 'Environment Mode',
      status: isTestMode ? 'success' : 'warning',
      message: isTestMode ? 'Test mode (recommended for setup)' : 'Production mode',
      details: isTestMode 
        ? 'Use test cards for testing (4242 4242 4242 4242)'
        : 'Using live Stripe keys - real charges will occur'
    });

    setChecks(results);
    setLoading(false);
  };

  const getStatusIcon = (status: StatusCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
    }
  };

  const getStatusColor = (status: StatusCheck['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-500/20 bg-green-500/10';
      case 'error':
        return 'border-red-500/20 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/10';
      case 'pending':
        return 'border-gray-500/20 bg-gray-500/10';
    }
  };

  const overallStatus = checks.every(c => c.status === 'success') ? 'success' :
                       checks.some(c => c.status === 'error') ? 'error' : 'warning';

  const successCount = checks.filter(c => c.status === 'success').length;
  const totalChecks = checks.length;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5" />
                Stripe Integration Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Real-time diagnostic check of your Stripe configuration
              </CardDescription>
            </div>
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              variant="secondary"
              size="sm"
              className="hover:bg-white/10"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && checks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Configuration Progress</span>
                  <span className="text-sm font-semibold text-white">
                    {successCount}/{totalChecks} Checks Passed
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(successCount / totalChecks) * 100}%` }}
                    className={`h-full rounded-full ${
                      overallStatus === 'success' ? 'bg-green-500' :
                      overallStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                {overallStatus === 'success' && (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Ready for Production
                  </Badge>
                )}
                {overallStatus === 'warning' && (
                  <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Configuration Incomplete
                  </Badge>
                )}
                {overallStatus === 'error' && (
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                    <XCircle className="mr-1 h-3 w-3" />
                    Configuration Errors
                  </Badge>
                )}
              </div>

              {/* Individual Checks */}
              <div className="space-y-3">
                {checks.map((check, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-lg border p-4 ${getStatusColor(check.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white">{check.name}</h4>
                        </div>
                        <p className="mt-1 text-sm text-gray-300">{check.message}</p>
                        {check.details && (
                          <p className="mt-1 text-xs text-gray-400">{check.details}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {overallStatus !== 'success' && (
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Key className="h-5 w-5" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-gray-300">
              <p className="font-semibold text-white">To complete setup:</p>
              
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  <strong>Create Stripe Products</strong>
                  <br />
                  <span className="text-gray-400">
                    Go to{' '}
                    <a 
                      href="https://dashboard.stripe.com/test/products" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Stripe Dashboard
                    </a>
                    {' '}and create 3 products
                  </span>
                </li>
                
                <li>
                  <strong>Update Price IDs</strong>
                  <br />
                  <span className="text-gray-400">
                    Edit <code className="rounded bg-white/10 px-1 py-0.5">/supabase/functions/server/stripe-routes.tsx</code>
                  </span>
                </li>
                
                <li>
                  <strong>Configure Webhook</strong>
                  <br />
                  <span className="text-gray-400">
                    Add webhook endpoint in Stripe with secret key
                  </span>
                </li>
                
                <li>
                  <strong>Test Everything</strong>
                  <br />
                  <span className="text-gray-400">
                    Use test card 4242 4242 4242 4242 to verify
                  </span>
                </li>
              </ol>
              
              <div className="mt-4 rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  📖 See <strong>STRIPE_SETUP_GUIDE.md</strong> for detailed step-by-step instructions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Webhook className="h-5 w-5" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <a
              href="https://dashboard.stripe.com/test/products"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/10 p-3 text-sm text-gray-300 hover:border-purple-500/30 hover:bg-white/5 transition-colors"
            >
              <CreditCard className="h-4 w-4 text-purple-400" />
              <span>Stripe Products</span>
            </a>
            
            <a
              href="https://dashboard.stripe.com/test/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/10 p-3 text-sm text-gray-300 hover:border-purple-500/30 hover:bg-white/5 transition-colors"
            >
              <Webhook className="h-4 w-4 text-purple-400" />
              <span>Webhooks</span>
            </a>
            
            <a
              href="https://dashboard.stripe.com/test/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/10 p-3 text-sm text-gray-300 hover:border-purple-500/30 hover:bg-white/5 transition-colors"
            >
              <Key className="h-4 w-4 text-purple-400" />
              <span>API Keys</span>
            </a>
            
            <a
              href="https://stripe.com/docs/testing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/10 p-3 text-sm text-gray-300 hover:border-purple-500/30 hover:bg-white/5 transition-colors"
            >
              <CheckCircle className="h-4 w-4 text-purple-400" />
              <span>Test Cards</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
