/**
 * Annual Plan Upsell Integration Example
 * 
 * Shows how to integrate AnnualPlanUpsellComponent with existing PaywallGate
 * for maximum revenue impact.
 */

import { AnnualPlanUpsellComponent } from './AnnualPlanUpsellComponent';
import { CreditUpsellComponent } from './CreditUpsellComponent';
import { useState } from 'react';

interface IntegrationExampleProps {
  userId: string;
  userPlan: string;
  creditsUsed: number;
  creditsLimit: number;
}

export function AnnualPlanUpsellIntegrationExample({
  userId,
  userPlan,
  creditsUsed,
  creditsLimit
}: IntegrationExampleProps) {
  const [showAnnualUpsell, setShowAnnualUpsell] = useState(false);
  
  // Determine user type for personalized messaging
  const getUserType = () => {
    if (creditsUsed >= creditsLimit * 0.8) return 'power_user';
    if (userPlan === 'lite' && creditsUsed > 0) return 'returning';
    return 'new';
  };

  const handleCreditUpgrade = () => {
    console.log('🎯 Credit upgrade initiated - showing annual upsell');
    setShowAnnualUpsell(true);
  };

  const handleAnnualUpgrade = (planId: string) => {
    console.log('🎯 Annual upgrade selected:', planId);
    // Redirect to Stripe checkout with annual billing
    window.open(`/checkout?plan=${planId}&billing=annual`, '_blank');
  };

  const handleMonthlyUpgrade = (planId: string) => {
    console.log('🎯 Monthly upgrade selected:', planId);
    // Redirect to Stripe checkout with monthly billing
    window.open(`/checkout?plan=${planId}&billing=monthly`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Example 1: Credit Upsell → Annual Upsell Flow */}
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Revenue Optimization Flow: Credit → Annual Upsell
        </h3>
        
        <div className="space-y-4">
          {/* Step 1: Credit Upsell */}
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Step 1: Credit Limit Reached</h4>
            <CreditUpsellComponent 
              userId={userId}
              currentCredits={creditsUsed}
              maxCredits={creditsLimit}
              onUpgrade={handleCreditUpgrade}
            />
          </div>

          {/* Step 2: Annual Upsell (conditional) */}
          {showAnnualUpsell && (
            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-4 border border-green-500/30">
              <h4 className="text-white font-semibold mb-2">Step 2: Maximize Your Savings</h4>
              <AnnualPlanUpsellComponent 
                currentPlan={userPlan}
                userType={getUserType()}
                onAnnualSelect={handleAnnualUpgrade}
                onMonthlySelect={handleMonthlyUpgrade}
                showComparison={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Example 2: Direct Annual Upsell in Paywall */}
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Direct Annual Upsell in PaywallGate
        </h3>
        
        <div className="space-y-4">
          <p className="text-slate-300">
            Replace generic upgrade messaging with targeted annual upsell:
          </p>
          
          <div className="bg-slate-800/30 rounded-lg p-4">
            <AnnualPlanUpsellComponent 
              currentPlan={userPlan}
              userType={getUserType()}
              showComparison={false}
            />
          </div>
        </div>
      </div>

      {/* Integration Code Example */}
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">Integration Code</h3>
        
        <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto text-sm">
{`// In PaywallGate.tsx - Add annual upsell section
{access.accessType === 'free_lite' && (
  <div className="mt-6">
    <AnnualPlanUpsellComponent 
      currentPlan="lite"
      userType={getUserType(user)}
      onAnnualSelect={(planId) => handleAnnualCheckout(planId)}
      onMonthlySelect={(planId) => handleMonthlyCheckout(planId)}
    />
  </div>
)}

// In upgrade flow - After credit upsell
<CreditUpsellComponent 
  onUpgrade={() => setShowAnnualUpsell(true)}
/>

{showAnnualUpsell && (
  <AnnualPlanUpsellComponent 
    currentPlan={currentPlan}
    userType={userType}
    showComparison={true}
  />
)}`}
        </pre>
      </div>

      {/* Revenue Impact Summary */}
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30">
        <h3 className="text-xl font-bold text-white mb-4">Revenue Impact Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Without Annual Upsell</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• 20% annual plan adoption</li>
              <li>• $228 LTV per user</li>
              <li>• $74,400/year per 1,000 users</li>
              <li>• 30% churn rate</li>
            </ul>
          </div>
          
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">With Annual Upsell</h4>
            <ul className="space-y-2 text-green-300 text-sm">
              <li>• 50% annual plan adoption (+150%)</li>
              <li>• $372 LTV per user (+63%)</li>
              <li>• $186,000/year per 1,000 users (+150%)</li>
              <li>• 18% churn rate (-40%)</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
          <p className="text-center text-white font-semibold">
            Estimated Annual Revenue Increase: <span className="text-green-400">+$111,600</span> per 1,000 users
          </p>
        </div>
      </div>
    </div>
  );
}