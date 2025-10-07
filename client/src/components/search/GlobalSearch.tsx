import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, CheckSquare, Calendar, Zap, Trophy, Hash, ArrowRight, Clock, Filter, SortAsc, History, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Mock searchable data
const searchableData = [
  // Tasks
  { id: 't1', type: 'task', icon: <CheckSquare className="w-4 h-4" />, title: 'Write Q4 Strategy', subtitle: 'High priority • Due today', category: 'Task', route: '/do', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 't2', type: 'task', icon: <CheckSquare className="w-4 h-4" />, title: 'Code Review Sprint', subtitle: 'Medium priority • Due Oct 8', category: 'Task', route: '/do', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 't3', type: 'task', icon: <CheckSquare className="w-4 h-4" />, title: 'Budget Analysis', subtitle: 'High priority • Due tomorrow', category: 'Task', route: '/do', color: 'text-green-600', bgColor: 'bg-green-100' },
  
  // Events
  { id: 'e1', type: 'event', icon: <Calendar className="w-4 h-4" />, title: 'Team Meeting', subtitle: '10:00 AM • 30 min', category: 'Event', route: '/plan', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'e2', type: 'event', icon: <Calendar className="w-4 h-4" />, title: 'Focus Block - Write Proposal', subtitle: '11:00 AM • 90 min', category: 'Event', route: '/plan', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'e3', type: 'event', icon: <Calendar className="w-4 h-4" />, title: 'Lunch', subtitle: '12:30 PM • 30 min', category: 'Event', route: '/plan', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  
  // Challenges
  { id: 'c1', type: 'challenge', icon: <Trophy className="w-4 h-4" />, title: 'Peak Performance', subtitle: 'Complete 3 tasks at PEAK energy', category: 'Challenge', route: '/do?tab=challenges', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'c2', type: 'challenge', icon: <Trophy className="w-4 h-4" />, title: 'Seven Day Streak', subtitle: '5/7 days completed', category: 'Challenge', route: '/do?tab=challenges', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'c3', type: 'challenge', icon: <Trophy className="w-4 h-4" />, title: 'Productivity Legend', subtitle: 'Complete 100 tasks this month', category: 'Challenge', route: '/do?tab=challenges', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  
  // Scripts
  { id: 's1', type: 'script', icon: <Zap className="w-4 h-4" />, title: 'Morning Routine', subtitle: '5 tasks • Auto-run daily', category: 'Script', route: '/do', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 's2', type: 'script', icon: <Zap className="w-4 h-4" />, title: 'End of Day', subtitle: '4 tasks • Review & plan', category: 'Script', route: '/do', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 's3', type: 'script', icon: <Zap className="w-4 h-4" />, title: 'Deep Focus Mode', subtitle: '7 tasks • Block distractions', category: 'Script', route: '/do', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  
  // Pages
  { id: 'p1', type: 'page', icon: <Hash className="w-4 h-4" />, title: 'Home', subtitle: 'Command center', category: 'Navigate', route: '/home', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { id: 'p2', type: 'page', icon: <Hash className="w-4 h-4" />, title: 'Do Mode', subtitle: 'Task execution', category: 'Navigate', route: '/do', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { id: 'p3', type: 'page', icon: <Hash className="w-4 h-4" />, title: 'Plan Mode', subtitle: 'Calendar & scheduling', category: 'Navigate', route: '/plan', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { id: 'p4', type: 'page', icon: <Hash className="w-4 h-4" />, title: 'Manage Mode', subtitle: 'Admin & finances', category: 'Navigate', route: '/manage', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { id: 'p5', type: 'page', icon: <Hash className="w-4 h-4" />, title: 'Energy Insights', subtitle: 'Charts & predictions', category: 'Navigate', route: '/energy-insights', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
];

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'alphabetical'>('relevance');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('syncscript-recent-searches');
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter results based on query and type
  let filteredResults = query.trim() === '' 
    ? searchableData.slice(0, 8) // Show recent/popular when empty
    : searchableData.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );
  
  // Apply type filter
  if (filterType !== 'all') {
    filteredResults = filteredResults.filter(item => item.type === filterType);
  }
  
  // Apply sorting
  if (sortBy === 'alphabetical') {
    filteredResults = [...filteredResults].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'recent') {
    // Most recent first (reverse order)
    filteredResults = [...filteredResults].reverse();
  }
  
  const results = filteredResults;

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex]);

  const handleSelect = (item: typeof searchableData[0]) => {
    console.log('🔍 Search result selected:', item.title);
    
    // Save to recent searches
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('syncscript-recent-searches', JSON.stringify(updated));
    }
    
    navigate(item.route);
    onClose();
  };
  
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('syncscript-recent-searches');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden" aria-describedby="search-description">
        <h2 id="search-title" className="sr-only">Global Search</h2>
        <p id="search-description" className="sr-only">Search for tasks, events, challenges, scripts, and pages</p>
        
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, events, challenges, scripts..."
              className="border-0 focus-visible:ring-0 shadow-none text-lg dark:bg-transparent dark:text-white"
            />
            <kbd className="hidden md:block px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
              ESC
            </kbd>
          </div>
          
          {/* Filters and Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <Button
                size="sm"
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className="h-7 text-xs"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterType === 'task' ? 'default' : 'outline'}
                onClick={() => setFilterType('task')}
                className="h-7 text-xs"
              >
                Tasks
              </Button>
              <Button
                size="sm"
                variant={filterType === 'event' ? 'default' : 'outline'}
                onClick={() => setFilterType('event')}
                className="h-7 text-xs"
              >
                Events
              </Button>
              <Button
                size="sm"
                variant={filterType === 'challenge' ? 'default' : 'outline'}
                onClick={() => setFilterType('challenge')}
                className="h-7 text-xs"
              >
                Challenges
              </Button>
            </div>
            
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            
            <div className="flex items-center gap-1">
              <SortAsc className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <Button
                size="sm"
                variant={sortBy === 'relevance' ? 'default' : 'outline'}
                onClick={() => setSortBy('relevance')}
                className="h-7 text-xs"
              >
                Relevance
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'alphabetical' ? 'default' : 'outline'}
                onClick={() => setSortBy('alphabetical')}
                className="h-7 text-xs"
              >
                A-Z
              </Button>
            </div>
          </div>
          
          {/* Recent Searches */}
          {query === '' && recentSearches.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <History className="w-3.5 h-3.5" />
                  <span>Recent Searches</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearRecentSearches}
                  className="h-6 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try searching for tasks, events, or challenges</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-150",
                    selectedIndex === index 
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-l-4 border-purple-500 dark:border-purple-400" 
                      : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {/* Icon */}
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center dark:opacity-90", item.bgColor)}>
                    <div className={item.color}>
                      {item.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{item.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.subtitle}</div>
                  </div>

                  {/* Category Badge */}
                  <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                    {item.category}
                  </Badge>

                  {/* Arrow (on selected) */}
                  {selectedIndex === index && (
                    <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">ESC</kbd>
              Close
            </span>
          </div>
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

