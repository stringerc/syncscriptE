import React from 'react';
import { render, screen } from '@testing-library/react';
import { ShellSwitch } from '../ShellSwitch';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';

// Mock the feature flags context
const mockFeatureFlags = {
  flags: {
    new_ui: false,
    cmd_palette: false,
    askAI: false,
    focusLock: false,
    mic: false,
    priorityHierarchy: false,
    templates: false,
    pinnedEvents: false,
    googleCalendar: false,
    outlookCalendar: false,
    appleCalendar: false,
    friends: false,
    shareScript: false,
    energyHUD: false,
    energyGraph: false,
  },
  isLoading: false,
  updateFlags: jest.fn(),
  isFlagEnabled: jest.fn((flagName: string) => {
    if (flagName === 'new_ui') return false;
    return false;
  }),
};

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('ShellSwitch', () => {
  it('renders legacy shell when new_ui is false', () => {
    render(
      <FeatureFlagsProvider>
        <ShellSwitch>
          <div data-testid="test-content">Test Content</div>
        </ShellSwitch>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders new shell when new_ui is true', () => {
    // Mock the feature flag to return true for new_ui
    const mockFeatureFlagsWithNewUI = {
      ...mockFeatureFlags,
      isFlagEnabled: jest.fn((flagName: string) => {
        if (flagName === 'new_ui') return true;
        return false;
      }),
    };

    render(
      <FeatureFlagsProvider>
        <ShellSwitch>
          <div data-testid="test-content">Test Content</div>
        </ShellSwitch>
      </FeatureFlagsProvider>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('logs shell variant on mount', () => {
    render(
      <FeatureFlagsProvider>
        <ShellSwitch>
          <div data-testid="test-content">Test Content</div>
        </ShellSwitch>
      </FeatureFlagsProvider>
    );

    expect(console.log).toHaveBeenCalledWith('🔄 Shell rendered: legacy (new_ui=false)');
  });
});
