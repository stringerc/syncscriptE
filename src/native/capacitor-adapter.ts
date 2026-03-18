import type { ContinuityEnvelope, SmartEventDraftContract, WatchQuickAction } from './continuity-contracts';
import type { NativeBridgeAdapter } from './ios-watch-scaffold';

function isCapacitorRuntime(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).Capacitor);
}

export class CapacitorNativeBridgeAdapter implements NativeBridgeAdapter {
  private lastEnvelope: ContinuityEnvelope | null = null;
  private lastQuickActions: WatchQuickAction[] = [];
  private lastDraft: SmartEventDraftContract | null = null;

  async publishContinuityEnvelope(envelope: ContinuityEnvelope): Promise<void> {
    this.lastEnvelope = envelope;
    if (!isCapacitorRuntime()) return;
    // Store latest continuity envelope for native shells to pull immediately.
    localStorage.setItem('syncscript_native_last_envelope', JSON.stringify(envelope));
  }

  async getLastContinuityEnvelope(): Promise<ContinuityEnvelope | null> {
    if (this.lastEnvelope) return this.lastEnvelope;
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('syncscript_native_last_envelope');
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      this.lastEnvelope = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  async registerWatchQuickActions(actions: WatchQuickAction[]): Promise<void> {
    this.lastQuickActions = actions.slice(0, 6);
    if (!isCapacitorRuntime()) return;
    localStorage.setItem('syncscript_native_watch_actions', JSON.stringify(this.lastQuickActions));
  }

  async triggerSmartEventDraft(draft: SmartEventDraftContract): Promise<void> {
    this.lastDraft = draft;
    if (!isCapacitorRuntime()) return;
    localStorage.setItem('syncscript_native_smart_event_draft', JSON.stringify(draft));
  }

  async requestPushPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!isCapacitorRuntime()) return Notification.permission;
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const status = await PushNotifications.requestPermissions();
      return status.receive === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }

  async scheduleLocalNexusAlert(title: string, body: string, deepLink?: string): Promise<void> {
    if (!isCapacitorRuntime()) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.requestPermissions();
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 2147483646,
          title,
          body,
          schedule: { at: new Date(Date.now() + 500) },
          extra: deepLink ? { deepLink } : {},
        }],
      });
    } catch {
      // Ignore native notification failures and preserve app flow.
    }
  }

  debugSnapshot(): {
    envelope: ContinuityEnvelope | null;
    quickActions: WatchQuickAction[];
    smartEventDraft: SmartEventDraftContract | null;
  } {
    return {
      envelope: this.lastEnvelope,
      quickActions: this.lastQuickActions,
      smartEventDraft: this.lastDraft,
    };
  }
}
