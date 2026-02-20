import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, TrendingUp } from 'lucide-react';

interface UrgencyTimerProps {
  expiry: number; // Unix timestamp in seconds
  variant?: 'beta-coupon' | 'launch-offer' | 'seasonal';
}

/**
 * Revenue-generating urgency timer for time-sensitive offers
 * Drives conversion through psychological urgency and FOMO
 */
export function UrgencyTimer({ expiry, variant = 'beta-coupon' }: UrgencyTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (24 * 60 * 60)),
        hours: Math.floor((difference % (24 * 60 * 60)) / (60 * 60)),
        minutes: Math.floor((difference % (60 * 60)) / 60),
        seconds: difference % 60,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiry]);

  const variantConfig = {
    'beta-coupon': {
      title: 'Beta Access Coupon Expires',
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-200',
      icon: Clock,
    },
    'launch-offer': {
      title: 'Launch Deal Timer',
      color: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-200',
      icon: TrendingUp,
    },
    'seasonal': {
      title: 'Seasonal Discount',
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-200',
      icon: TrendingUp,
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${config.color} border ${config.borderColor} px-3 py-2 rounded-lg mb-4 animate-pulse`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className={`text-sm font-medium ${config.textColor}`}>
            Offer expired - contact support for extension
          </span>
        </div>
      </motion.div>
    );
  }

  const urgencyLevel = 
    timeLeft.days === 0 && timeLeft.hours < 24 ? 'high' :
    timeLeft.days < 3 ? 'medium' : 
    'low';

  const timeColor = 
    urgencyLevel === 'high' ? 'text-red-400' :
    urgencyLevel === 'medium' ? 'text-amber-400' :
    'text-green-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${config.color} border ${config.borderColor} rounded-xl p-4 mb-6`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${config.textColor}`} />
        <h3 className={`text-base font-bold ${config.textColor}`}>
          {config.title}
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { value: timeLeft.days, label: 'days' },
          { value: timeLeft.hours, label: 'hrs' },
          { value: timeLeft.minutes, label: 'min' },
          { value: timeLeft.seconds, label: 'sec' },
        ].map(({ value, label }) => (
          <motion.div
            key={label}
            className="text-center bg-black/20 rounded-lg p-2"
            initial={{ scale: 1 }}
            animate={{ scale: value < 10 && label === 'hrs' || value < 60 && label === 'min' ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.5, repeat: label === 'hrs' && value < 5 ? Infinity : 0 }}
          >
            <span className={`text-xl font-bold ${timeColor}`}>
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-400 block">{label}</span>
          </motion.div>
        ))}
      </div>

      {urgencyLevel === 'high' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-400 font-medium mt-2 text-center"
        >
          ⚡ Less than {timeLeft.hours} hours remaining! 
        </motion.p>
      )}

      {urgencyLevel === 'medium' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-amber-400 font-medium mt-2 text-center"
        >
          🔥 Only {timeLeft.days} days left for this deal
        </motion.p>
      )}
    </motion.div>
  );
}