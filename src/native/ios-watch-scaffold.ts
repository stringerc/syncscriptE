import type { ContinuityEnvelope, SmartEventDraftContract, WatchQuickAction } from './continuity-contracts';
import { CapacitorNativeBridgeAdapter } from './capacitor-adapter';

export interface NativeBridgeAdapter {
  publishContinuityEnvelope: (envelope: ContinuityEnvelope) => Promise<void>;
  getLastContinuityEnvelope: () => Promise<ContinuityEnvelope | null>;
  registerWatchQuickActions: (actions: WatchQuickAction[]) => Promise<void>;
  triggerSmartEventDraft: (draft: SmartEventDraftContract) => Promise<void>;
}

/**
 * No-op scaffold for the future Capacitor iOS shell and watch companion.
 * Web/PWA can call this now without coupling to native runtimes.
 */
export class NativeScaffoldBridge implements NativeBridgeAdapter {
  private lastEnvelope: ContinuityEnvelope | null = null;
  private lastQuickActions: WatchQuickAction[] = [];
  private lastDraft: SmartEventDraftContract | null = null;

  async publishContinuityEnvelope(envelope: ContinuityEnvelope): Promise<void> {
    this.lastEnvelope = envelope;
  }

  async getLastContinuityEnvelope(): Promise<ContinuityEnvelope | null> {
    return this.lastEnvelope;
  }

  async registerWatchQuickActions(actions: WatchQuickAction[]): Promise<void> {
    this.lastQuickActions = actions.slice(0, 6);
  }

  async triggerSmartEventDraft(draft: SmartEventDraftContract): Promise<void> {
    this.lastDraft = draft;
  }

  // Exposed for development validation.
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

export const nativeScaffoldBridge = new NativeScaffoldBridge();

const hasCapacitorRuntime = typeof window !== 'undefined' && Boolean((window as any).Capacitor);
export const nativeBridge: NativeBridgeAdapter = hasCapacitorRuntime
  ? new CapacitorNativeBridgeAdapter()
  : nativeScaffoldBridge;
