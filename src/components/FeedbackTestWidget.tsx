/**
 * FEEDBACK TEST WIDGET
 * Manual feedback submission for testing the intelligence system
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function FeedbackTestWidget() {
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('Test User');
  const [category, setCategory] = useState('feedback');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  async function submitFeedback() {
    if (!message.trim()) return;

    setLoading(true);
    setSuccess(false);
    setAnalysis(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: 'test_' + Date.now(),
            user_name: userName,
            message: message,
            category: category
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setAnalysis(data.analysis);
        setMessage('');
        
        setTimeout(() => {
          setSuccess(false);
          setAnalysis(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setLoading(false);
    }
  }

  const exampleMessages = [
    "The energy system is really confusing. I don't understand the difference between Points Mode and Aura Mode.",
    "I love the Goals feature! It's helping me stay organized.",
    "Bug: When I complete a task, the progress bar doesn't update immediately.",
    "Can you add a dark mode? The current UI is too bright.",
    "The automation system is amazing! Saved me so much time.",
    "The app crashes when I try to upload an image.",
    "Please add keyboard shortcuts for common actions.",
    "This is the best productivity app I've ever used! 🎉"
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Test Feedback Submission</h2>
      <p className="text-slate-400 mb-6">
        Submit test feedback to see how the AI analyzes and categorizes it
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              User Name
            </label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white"
              placeholder="Test User"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Channel
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white"
            >
              <option value="feedback">General Feedback</option>
              <option value="bug-reports">Bug Reports</option>
              <option value="feature-requests">Feature Requests</option>
              <option value="ux-issues">UX Issues</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Feedback Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white min-h-[100px] resize-none"
            placeholder="Type your feedback here..."
          />
        </div>

        <Button
          onClick={submitFeedback}
          disabled={loading || !message.trim()}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Submitted!
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-900/20 border border-green-500/30 rounded-lg p-4"
          >
            <h3 className="text-green-400 font-semibold mb-2">AI Analysis Results:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Category:</span>
                <span className="px-2 py-0.5 bg-slate-700 rounded text-white capitalize">
                  {analysis.category.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Sentiment:</span>
                <span className={`px-2 py-0.5 rounded capitalize ${
                  analysis.sentiment === 'positive' ? 'bg-green-500' :
                  analysis.sentiment === 'negative' ? 'bg-red-500' :
                  'bg-slate-500'
                } text-white`}>
                  {analysis.sentiment}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Example Messages */}
        <div>
          <p className="text-sm text-slate-400 mb-2">Quick examples (click to use):</p>
          <div className="space-y-2">
            {exampleMessages.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setMessage(example)}
                className="w-full text-left px-3 py-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
