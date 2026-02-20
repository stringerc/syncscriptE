/**
 * Referral Program Component - Revenue & Viral Growth Focus
 * 
 * Purpose: Drive viral growth through user referrals with revenue incentives
 * Impact: Each successful referral = $19/month revenue + potential upgrades
 * Testing: Locally verified with copy-paste sharing and analytics
 * 
 * Revenue Model:
 * - Referrer: 30-day free Pro tier for each successful referral
 * - Referee: 14-day extended trial (incentive to sign up)
 * - Platform: $19/month recurring revenue per converted user
 * 
 * Viral Coefficient Target: 1.2+ (each user brings 1.2+ new users)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Share2, 
  Users, 
  Gift, 
  Zap, 
  Copy, 
  Check, 
  TrendingUp, 
  Award,
  Sparkles,
  Crown
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ReferralProgramProps {
  userId: string;
  userEmail?: string;
  currentPlan?: 'free' | 'lite' | 'pro' | 'enterprise';
  onUpgradePrompt?: () => void;
}

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  earnedRewards: number;
  estimatedRevenue: number;
}

export function ReferralProgram({ 
  userId, 
  userEmail = '',
  currentPlan = 'lite',
  onUpgradePrompt 
}: ReferralProgramProps) {
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    earnedRewards: 0,
    estimatedRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Generate referral code from user ID and email
  useEffect(() => {
    if (userId && userEmail) {
      const baseCode = `${userId.slice(0, 4)}-${userEmail.split('@')[0].slice(0, 4)}`.toUpperCase();
      setReferralCode(`SYNC-${baseCode}`);
      
      // Mock stats - in production, fetch from API
      setStats({
        totalReferrals: 3,
        successfulReferrals: 1,
        pendingReferrals: 2,
        earnedRewards: 1, // 30-day Pro tier earned
        estimatedRevenue: 19 // $19/month from successful referral
      });
    }
  }, [userId, userEmail]);

  const copyToClipboard = () => {
    const shareUrl = `https://syncscript.ai/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        toast.success('Referral link copied to clipboard!');
        
        // Track referral share event
        console.log('🎯 Revenue event: User shared referral link', { referralCode, userId });
        
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };

  const shareViaEmail = () => {
    const subject = 'Join me on SyncScript - Get 14 days free!';
    const body = `Hey! I've been using SyncScript to boost my productivity and thought you'd love it too.

Use my referral link to get 14 days of Pro features free: https://syncscript.ai/signup?ref=${referralCode}

What you get:
🚀 14-day Pro trial (normally $39/month)
🤖 AI task automation
🎯 Calendar optimization
💬 Voice AI assistant

Try it out and let me know what you think!`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    
    // Track email share event
    console.log('🎯 Revenue event: User shared via email', { referralCode, userId });
  };

  const shareViaMessage = () => {
    const message = `🚀 Boost your productivity! Get 14 days FREE Pro access to SyncScript with my referral: https://syncscript.ai/signup?ref=${referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Try SyncScript Free',
        text: message,
        url: `https://syncscript.ai/signup?ref=${referralCode}`
      }).then(() => {
        console.log('🎯 Revenue event: User shared via native share', { referralCode, userId });
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(message)
        .then(() => {
          toast.success('Message copied! Paste it anywhere to share.');
          console.log('🎯 Revenue event: User copied share message', { referralCode, userId });
        });
    }
  };

  const handleUpgradeForMoreRewards = () => {
    toast.info('Upgrade to Pro for unlimited referral rewards!', {
      action: {
        label: 'Learn More',
        onClick: () => {
          if (onUpgradePrompt) {
            onUpgradePrompt();
          } else {
            window.open('/upgrade?source=referral-program', '_blank');
          }
        }
      }
    });
  };

  // Calculate progress towards next reward
  const nextRewardThreshold = 3; // Get Pro upgrade after 3 successful referrals
  const progressPercentage = Math.min(100, (stats.successfulReferrals / nextRewardThreshold) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-950/20 via-slate-900/50 to-indigo-950/20 overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl"
            style={{ backgroundColor: '#8b5cf6' }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Refer Friends, Earn Pro Time
              </CardTitle>
              <CardDescription className="text-slate-300">
                Share SyncScript and unlock free Pro access for yourself
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-purple-500/20 border-purple-500/40 text-purple-300">
              <TrendingUp className="w-3 h-3 mr-1" />
              Viral Growth
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalReferrals}</div>
              <div className="text-xs text-slate-400">Total Referrals</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.successfulReferrals}</div>
              <div className="text-xs text-slate-400">Successful</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.earnedRewards}</div>
              <div className="text-xs text-slate-400">Rewards Earned</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">${stats.estimatedRevenue}</div>
              <div className="text-xs text-slate-400">Monthly Revenue</div>
            </div>
          </div>

          {/* Progress to Next Reward */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                Progress to Pro Upgrade
              </span>
              <span className="text-white font-semibold">
                {stats.successfulReferrals}/{nextRewardThreshold} referrals
              </span>
            </div>
            <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div 
                className="absolute left-0 top-0 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent/30 via-white/10 to-transparent/30 -skew-x-12 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">
              {stats.successfulReferrals >= nextRewardThreshold 
                ? "🎉 You've earned a Pro upgrade! Check your rewards."
                : `Get ${nextRewardThreshold - stats.successfulReferrals} more successful referrals for a free Pro upgrade`}
            </p>
          </div>

          {/* Referral Code & Sharing */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Your Personal Referral Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={`https://syncscript.ai/signup?ref=${referralCode}`}
                  readOnly
                  className="bg-slate-800 border-slate-600 text-white font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  variant={copied ? "default" : "outline"}
                  className={copied 
                    ? "bg-green-600 hover:bg-green-700 border-green-600" 
                    : "border-slate-600"
                  }
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="border-slate-600 hover:bg-slate-800 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                onClick={shareViaMessage}
                variant="outline"
                className="border-slate-600 hover:bg-slate-800 text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button
                onClick={handleUpgradeForMoreRewards}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Get More Rewards
              </Button>
            </div>
          </div>

          {/* Rewards Program Details */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              How the Referral Program Works
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span><strong>For your friends:</strong> 14-day Pro trial (normally $39/month)</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span><strong>For you:</strong> 30-day Pro access for each friend who upgrades</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Bonus:</strong> Get 3 successful referrals = Permanent Pro upgrade</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Revenue impact:</strong> Each converted friend = $19-$39/month recurring</span>
              </li>
            </ul>
          </div>

          {/* Revenue Impact Summary */}
          <motion.div 
            className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 font-semibold">Revenue Impact</p>
                <p className="text-sm text-slate-300">
                  Your referrals have generated <strong className="text-white">${stats.estimatedRevenue}/month</strong> in recurring revenue
                </p>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">
                +${stats.estimatedRevenue * 12}/year
              </Badge>
            </div>
          </motion.div>

          {/* Pro Tip */}
          <div className="text-center">
            <p className="text-xs text-slate-400">
              💡 <strong>Pro Tip:</strong> Share with colleagues and teams for faster rewards. 
              Teams that sign up together get additional group discounts!
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}