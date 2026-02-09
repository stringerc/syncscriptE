/**
 * Stripe Test Page
 * 
 * Complete testing interface for Stripe integration.
 * Use this to verify everything works before going live.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useStripe } from '../../hooks/useStripe';
import { StripeSetupStatus } from '../admin/StripeSetupStatus';
import { toast } from 'sonner@2.0.3';

export function StripeTestPage() {
  const [testUserId, setTestUserId] = useState('test-user-' + Math.random().toString(36).substr(2, 9));
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const { createCheckoutSession, loading } = useStripe(testUserId);

  const runFullTest = async () => {
    setTesting(true);
    setTestResults([]);
    const results: any[] = [];

    // Test 1: Load Pricing Plans
    try {
      const response = await fetch('/api/stripe/pricing');
      if (response.ok) {
        const data = await response.json();
        results.push({
          test: 'Load Pricing Plans',
          status: 'success',
          message: `${Object.keys(data.plans).length} plans loaded`,
          data
        });
      } else {
        throw new Error('Failed to load pricing');
      }
    } catch (error) {
      results.push({
        test: 'Load Pricing Plans',
        status: 'error',
        message: String(error)
      });
    }

    // Test 2: Create Checkout Session
    try {
      const url = await createCheckoutSession(
        'professional',
        testEmail,
        window.location.origin + '/test/success',
        window.location.origin + '/test/cancel'
      );
      
      results.push({
        test: 'Create Checkout Session',
        status: 'success',
        message: 'Checkout session created successfully',
        data: { url }
      });
    } catch (error) {
      results.push({
        test: 'Create Checkout Session',
        status: 'error',
        message: String(error)
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  const testCheckout = async (planId: string) => {
    try {
      const url = await createCheckoutSession(
        planId,
        testEmail,
        window.location.origin + '/subscription/success',
        window.location.origin + '/pricing'
      );

      toast.success('Redirecting to Stripe Checkout...');
      setTimeout(() => {
        window.location.href = url;
      }, 1000);
    } catch (error) {
      toast.error('Checkout failed: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a] p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Stripe Integration Test Suite
          </h1>
          <p className="text-lg text-gray-400">
            Verify your Stripe configuration before going live
          </p>
          <Badge className="mt-4 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            ⚠️ Test Mode Only
          </Badge>
        </div>

        {/* Setup Status */}
        <StripeSetupStatus />

        {/* Test Configuration */}
        <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure test user details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-user-id" className="text-white">Test User ID</Label>
              <Input
                id="test-user-id"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="test-email" className="text-white">Test Email</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={runFullTest}
              disabled={testing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Full Diagnostic Test'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
              <CardDescription className="text-gray-400">
                {testResults.filter(r => r.status === 'success').length}/{testResults.length} tests passed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-lg border p-4 ${
                    result.status === 'success' 
                      ? 'border-green-500/20 bg-green-500/10' 
                      : 'border-red-500/20 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{result.test}</h4>
                      <p className="mt-1 text-sm text-gray-300">{result.message}</p>
                      {result.data && (
                        <pre className="mt-2 rounded bg-black/20 p-2 text-xs text-gray-400 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Checkout Tests */}
        <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Quick Checkout Tests</CardTitle>
            <CardDescription className="text-gray-400">
              Test the checkout flow for each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                onClick={() => testCheckout('starter')}
                disabled={loading}
                variant="secondary"
                className="h-24 flex-col hover:bg-white/10"
              >
                <span className="text-lg font-semibold">Starter</span>
                <span className="text-sm text-gray-400">$19/month</span>
              </Button>
              
              <Button
                onClick={() => testCheckout('professional')}
                disabled={loading}
                className="h-24 flex-col bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <span className="text-lg font-semibold">Professional</span>
                <span className="text-sm">$49/month</span>
              </Button>
              
              <Button
                onClick={() => testCheckout('enterprise')}
                disabled={loading}
                variant="secondary"
                className="h-24 flex-col hover:bg-white/10"
              >
                <span className="text-lg font-semibold">Enterprise</span>
                <span className="text-sm text-gray-400">$99/month</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Cards Reference */}
        <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Stripe Test Cards</CardTitle>
            <CardDescription className="text-gray-400">
              Use these cards during checkout testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">✅ Successful Payment</h4>
              <code className="block rounded bg-green-500/10 border border-green-500/20 p-3 text-green-400">
                4242 4242 4242 4242
              </code>
              <p className="text-sm text-gray-400">
                Expiry: Any future date • CVC: Any 3 digits • ZIP: Any 5 digits
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">❌ Declined Card</h4>
              <code className="block rounded bg-red-500/10 border border-red-500/20 p-3 text-red-400">
                4000 0000 0000 0002
              </code>
              <p className="text-sm text-gray-400">
                Use to test payment failures
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">🔐 Requires 3D Secure</h4>
              <code className="block rounded bg-blue-500/10 border border-blue-500/20 p-3 text-blue-400">
                4000 0027 6000 3184
              </code>
              <p className="text-sm text-gray-400">
                Use to test 3D Secure authentication flow
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Testing Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-gray-300 list-decimal pl-5">
              <li>Run the diagnostic test above to verify configuration</li>
              <li>Click a plan button to test the checkout flow</li>
              <li>Use test card 4242 4242 4242 4242 on Stripe Checkout</li>
              <li>Complete the checkout and verify redirect to success page</li>
              <li>Check Stripe Dashboard for the test subscription</li>
              <li>Test cancellation and reactivation in billing settings</li>
              <li>Verify webhook events appear in Stripe Dashboard</li>
              <li>Test customer portal access</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
