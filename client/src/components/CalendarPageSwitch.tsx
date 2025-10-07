import React from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { CalendarPage } from '@/pages/CalendarPage';
import CalendarPageModern from '@/pages/CalendarPageModern';

/**
 * Calendar Page Switch Component
 * 
 * Conditionally renders the modern or legacy calendar page
 * based on the new_ui feature flag
 */
export const CalendarPageSwitch: React.FC = () => {
  const { isFlagEnabled } = useFeatureFlags();
  const isNewUI = isFlagEnabled('new_ui');

  if (isNewUI) {
    return <CalendarPageModern />;
  }

  return <CalendarPage />;
};
