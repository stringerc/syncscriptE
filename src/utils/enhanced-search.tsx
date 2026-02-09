/**
 * Enhanced client-side search with fuzzy matching and autocomplete
 */

export interface SearchSuggestion {
  text: string;
  type: 'script' | 'tag' | 'category' | 'author';
  relevance: number;
}

export class EnhancedSearch {
  
  /**
   * Fuzzy search: matches even with typos
   */
  static fuzzyMatch(query: string, target: string): number {
    query = query.toLowerCase();
    target = target.toLowerCase();

    // Exact match
    if (target.includes(query)) {
      return 1.0;
    }

    // Calculate Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(query, target);
    const maxLength = Math.max(query.length, target.length);
    
    // Convert distance to similarity score (0-1)
    const similarity = 1 - (distance / maxLength);
    
    // Only return matches above threshold
    return similarity > 0.6 ? similarity : 0;
  }

  /**
   * Levenshtein distance (edit distance) calculation
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate autocomplete suggestions
   */
  static generateSuggestions(
    query: string,
    scriptNames: string[],
    tags: string[],
    categories: string[],
    authors: string[],
    limit: number = 5
  ): SearchSuggestion[] {
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];

    // Search script names
    scriptNames.forEach(name => {
      const relevance = this.fuzzyMatch(query, name);
      if (relevance > 0) {
        suggestions.push({
          text: name,
          type: 'script',
          relevance
        });
      }
    });

    // Search tags
    tags.forEach(tag => {
      const relevance = this.fuzzyMatch(query, tag);
      if (relevance > 0) {
        suggestions.push({
          text: tag,
          type: 'tag',
          relevance
        });
      }
    });

    // Search categories
    categories.forEach(category => {
      const relevance = this.fuzzyMatch(query, category);
      if (relevance > 0) {
        suggestions.push({
          text: category,
          type: 'category',
          relevance
        });
      }
    });

    // Search authors
    authors.forEach(author => {
      const relevance = this.fuzzyMatch(query, author);
      if (relevance > 0) {
        suggestions.push({
          text: author,
          type: 'author',
          relevance
        });
      }
    });

    // Sort by relevance and limit
    return suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Get "Did you mean?" suggestion for typos
   */
  static getDidYouMean(
    query: string,
    validTerms: string[]
  ): string | null {
    let bestMatch: { term: string; score: number } | null = null;

    validTerms.forEach(term => {
      const score = this.fuzzyMatch(query, term);
      if (score > 0.6 && score < 1.0) { // Similar but not exact
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { term, score };
        }
      }
    });

    return bestMatch ? bestMatch.term : null;
  }

  /**
   * Highlight matching text in result
   */
  static highlightMatch(text: string, query: string): string {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Synonym mapping for semantic search
   */
  private static synonyms: { [key: string]: string[] } = {
    'daily': ['everyday', 'routine', 'morning', 'day'],
    'planner': ['scheduler', 'organizer', 'calendar', 'plan'],
    'focus': ['concentration', 'deep work', 'attention', 'flow'],
    'email': ['inbox', 'mail', 'message', 'communication'],
    'meeting': ['sync', 'standup', 'call', 'conference'],
    'goal': ['target', 'objective', 'aim', 'milestone'],
    'task': ['todo', 'work', 'job', 'assignment'],
    'automation': ['script', 'workflow', 'auto', 'automatic'],
    'report': ['analytics', 'dashboard', 'summary', 'stats']
  };

  /**
   * Expand query with synonyms for better matching
   */
  static expandQuery(query: string): string[] {
    const words = query.toLowerCase().split(' ');
    const expanded = new Set(words);

    words.forEach(word => {
      Object.entries(this.synonyms).forEach(([key, synonyms]) => {
        if (key === word || synonyms.includes(word)) {
          expanded.add(key);
          synonyms.forEach(syn => expanded.add(syn));
        }
      });
    });

    return Array.from(expanded);
  }

  /**
   * Advanced search with multiple criteria
   */
  static advancedSearch<T>(
    items: T[],
    query: string,
    searchFields: (keyof T)[],
    options?: {
      caseSensitive?: boolean;
      fuzzyThreshold?: number;
      expandSynonyms?: boolean;
    }
  ): T[] {
    const {
      caseSensitive = false,
      fuzzyThreshold = 0.6,
      expandSynonyms = true
    } = options || {};

    // Expand query with synonyms
    const queries = expandSynonyms 
      ? this.expandQuery(query)
      : [query];

    return items.filter(item => {
      return queries.some(q => {
        return searchFields.some(field => {
          const value = String(item[field]);
          const target = caseSensitive ? value : value.toLowerCase();
          const searchTerm = caseSensitive ? q : q.toLowerCase();

          // Exact or substring match
          if (target.includes(searchTerm)) {
            return true;
          }

          // Fuzzy match
          const score = this.fuzzyMatch(searchTerm, target);
          return score >= fuzzyThreshold;
        });
      });
    });
  }

  /**
   * Track search queries for analytics
   */
  static trackSearch(query: string, resultCount: number): void {
    if (typeof window === 'undefined') return;

    const searches = this.getSearchHistory();
    searches.unshift({
      query,
      resultCount,
      timestamp: new Date().toISOString()
    });

    // Keep last 50 searches
    const trimmed = searches.slice(0, 50);
    localStorage.setItem('syncscript_search_history', JSON.stringify(trimmed));
  }

  /**
   * Get search history
   */
  static getSearchHistory(): Array<{ query: string; resultCount: number; timestamp: string }> {
    if (typeof window === 'undefined') return [];

    const saved = localStorage.getItem('syncscript_search_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  /**
   * Get popular searches
   */
  static getPopularSearches(limit: number = 5): string[] {
    const history = this.getSearchHistory();
    const queryCount: { [key: string]: number } = {};

    history.forEach(({ query }) => {
      queryCount[query] = (queryCount[query] || 0) + 1;
    });

    return Object.entries(queryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query]) => query);
  }
}
