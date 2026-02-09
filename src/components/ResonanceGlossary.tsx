import { motion } from 'motion/react';
import { Book, Clock, Zap, Activity, TrendingUp, DollarSign, Music } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export function ResonanceGlossary() {
  const terms = [
    {
      term: "Phase",
      simple: "When",
      explanation: "Timing fit — is this at your good time of day?",
      icon: Clock,
      color: "text-cyan-400",
      example: "Doing homework at the time you usually focus best"
    },
    {
      term: "In Phase",
      simple: "Lined up just right",
      explanation: "Good timing—this will feel easier",
      icon: Music,
      color: "text-green-400",
      example: "Doing math when your brain is sharp"
    },
    {
      term: "Out of Phase",
      simple: "Off the beat",
      explanation: "Bad timing—expect drag",
      icon: Activity,
      color: "text-rose-400",
      example: "Trying to read when you're sleepy"
    },
    {
      term: "Amplitude",
      simple: "How much push",
      explanation: "How much this can move the needle right now",
      icon: TrendingUp,
      color: "text-blue-400",
      example: "Big project = big wave; small chore = small wave"
    },
    {
      term: "Damping",
      simple: "How much drag",
      explanation: "Friction that slows you down",
      icon: Zap,
      color: "text-amber-400",
      example: "Being tired, hungry, or distracted"
    },
    {
      term: "Resonance",
      simple: "How well things fit",
      explanation: "Net boost after timing and drag",
      icon: Activity,
      color: "text-purple-400",
      example: "Two songs that sound good together"
    },
    {
      term: "Constructive Interference",
      simple: "Good pair",
      explanation: "When things help each other",
      icon: TrendingUp,
      color: "text-teal-400",
      example: "Cleaning your room right after organizing your desk"
    },
    {
      term: "Destructive Interference",
      simple: "Clash",
      explanation: "When things hurt each other",
      icon: Activity,
      color: "text-red-400",
      example: "Doing homework while watching TV"
    },
    {
      term: "Impedance",
      simple: "Stuff that blocks",
      explanation: "Delays, fees, or risk that reduce payoff",
      icon: DollarSign,
      color: "text-orange-400",
      example: "Waiting for Wi-Fi or being stuck in traffic"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
          <Book className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl text-white">Resonance Glossary</h2>
          <p className="text-gray-400 text-sm">Simple explanations for complex concepts</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {terms.map((term, i) => {
          const Icon = term.icon;
          return (
            <motion.div
              key={term.term}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-[#1e2128] border-gray-800 p-4 hover:border-teal-600/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${term.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-medium">{term.term}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {term.simple}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{term.explanation}</p>
                    <p className="text-xs text-gray-500 italic">
                      Example: {term.example}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Key Takeaways */}
      <Card className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border-purple-600/20 p-6">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" />
          Core Metaphor
        </h3>
        <p className="text-gray-300 mb-4">
          "We tune your day like sound. Tasks that 'sound good together' go next to each other. 
          Tasks that clash get spaced apart."
        </p>
        <div className="space-y-2 text-sm text-gray-400">
          <p>• Good timing makes hard work feel easy</p>
          <p>• When tasks hit the same rhythm, you move faster</p>
          <p>• Your day is music — we just help it stay in tune</p>
        </div>
      </Card>
    </div>
  );
}

// Compact version for dropdown/popover
export function ResonanceGlossaryCompact() {
  const quickTerms = [
    { term: "🎵 In Tune", meaning: "Good timing, less drag" },
    { term: "⚠️ Off-Beat", meaning: "Bad timing, more effort" },
    { term: "❌ Clash", meaning: "Tasks fighting each other" },
    { term: "✨ Good Pair", meaning: "Tasks that help each other" },
    { term: "🔋 Power Hour", meaning: "Your peak focus time" }
  ];

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-lg p-3 min-w-[250px]">
      <h3 className="text-white text-sm font-medium mb-3">Quick Reference</h3>
      <div className="space-y-2">
        {quickTerms.map((term) => (
          <div key={term.term} className="flex items-center justify-between text-xs">
            <span className="text-gray-300">{term.term}</span>
            <span className="text-gray-500">{term.meaning}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-800">
        <p className="text-[10px] text-gray-500 italic">
          "Your day is music — we help it stay in tune"
        </p>
      </div>
    </div>
  );
}
