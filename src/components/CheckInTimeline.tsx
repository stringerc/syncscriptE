import { SmilePlus, Meh, Frown, CheckCircle2, AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';

interface CheckIn {
  id: string;
  date: string;
  progress: number;
  mood: 'positive' | 'neutral' | 'concerned';
  summary: string;
  blockers: string[];
  wins: string[];
  nextSteps: string[];
  author: string;
}

interface CheckInTimelineProps {
  checkIns: CheckIn[];
  nextCheckIn?: string;
}

export function CheckInTimeline({ checkIns, nextCheckIn }: CheckInTimelineProps) {
  const moodConfig = {
    positive: { icon: SmilePlus, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500' },
    neutral: { icon: Meh, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500' },
    concerned: { icon: Frown, color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500' },
  };

  if (checkIns.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No check-ins yet</p>
        <p className="text-xs text-gray-500 mt-1">Add your first check-in to track progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Check-In Reminder */}
      {nextCheckIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <p className="text-sm text-purple-300">
              Next check-in: <span className="font-medium">{nextCheckIn}</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500 via-cyan-500 to-transparent" />

        {checkIns.map((checkIn, index) => {
          const moodStyle = moodConfig[checkIn.mood];
          const MoodIcon = moodStyle.icon;

          return (
            <motion.div
              key={checkIn.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-12"
            >
              {/* Timeline Node */}
              <div className={`absolute left-0 w-8 h-8 rounded-full ${moodStyle.bgColor} ${moodStyle.borderColor} border-2 flex items-center justify-center z-10`}>
                <MoodIcon className={`w-4 h-4 ${moodStyle.color}`} />
              </div>

              {/* Check-In Card */}
              <div className="bg-[#2a2d35] border border-gray-700 rounded-lg p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${moodStyle.color} ${moodStyle.borderColor} text-xs`}>
                        {checkIn.mood}
                      </Badge>
                      <span className="text-xs text-gray-400">{checkIn.date}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">by {checkIn.author}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-400">{checkIn.progress}%</p>
                    <p className="text-xs text-gray-500">Progress</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-3">
                  <p className="text-sm text-gray-300">{checkIn.summary}</p>
                </div>

                {/* Wins */}
                {checkIn.wins.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Wins</span>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {checkIn.wins.map((win, i) => (
                        <li key={i} className="text-xs text-gray-400 list-disc">{win}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Blockers */}
                {checkIn.blockers.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400">Blockers</span>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {checkIn.blockers.map((blocker, i) => (
                        <li key={i} className="text-xs text-gray-400 list-disc">{blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {checkIn.nextSteps.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium text-blue-400">Next Steps</span>
                    </div>
                    <ul className="space-y-1 pl-6">
                      {checkIn.nextSteps.map((step, i) => (
                        <li key={i} className="text-xs text-gray-400 list-disc">{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
