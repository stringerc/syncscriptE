const PROGRESS_STORAGE_KEY = 'syncscript_onboarding_progress';
const DISMISSED_STORAGE_KEY = 'syncscript_onboarding_dismissed';
const COLLAPSED_STORAGE_KEY = 'syncscript_onboarding_collapsed';
const PROGRESS_EVENT = 'syncscript:onboarding-progress';

export const CHECKLIST_ITEM_IDS = ['task', 'goal', 'event', 'energy', 'ai', 'profile'] as const;

function readProgress(): Record<string, boolean> {
  const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!savedProgress) return {};
  try {
    return JSON.parse(savedProgress) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function notifyProgressUpdated(): void {
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export const checklistTracking = {
  completeItem: (itemId: string): void => {
    const completed = readProgress();
    completed[itemId] = true;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(completed));
    notifyProgressUpdated();
  },

  isItemCompleted: (itemId: string): boolean => {
    const completed = readProgress();
    return completed[itemId] || false;
  },

  getCompletionCount: (): { completed: number; total: number } => {
    const completed = readProgress();
    const completedCount = Object.values(completed).filter(Boolean).length;
    return { completed: completedCount, total: CHECKLIST_ITEM_IDS.length };
  },

  reset: (): void => {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(DISMISSED_STORAGE_KEY);
    localStorage.removeItem(COLLAPSED_STORAGE_KEY);
    notifyProgressUpdated();
  },
};
