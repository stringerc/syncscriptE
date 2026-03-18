import type { ContractDomainEvent, EventDispatchResult } from './domain-events';
import { validateEvent } from './domain-events';

export type ContractEventSubscriber = (event: ContractDomainEvent) => void;

export class ContractEventBus {
  private readonly subscribers = new Set<ContractEventSubscriber>();
  private readonly seenIdempotencyKeys = new Set<string>();

  subscribe(subscriber: ContractEventSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  dispatch(event: ContractDomainEvent): EventDispatchResult {
    const errors = validateEvent(event);
    if (errors.length > 0) {
      return { accepted: false, reason: errors.join('; ') };
    }
    if (this.seenIdempotencyKeys.has(event.idempotencyKey)) {
      return { accepted: false, reason: 'idempotent duplicate' };
    }
    this.seenIdempotencyKeys.add(event.idempotencyKey);
    for (const subscriber of this.subscribers) {
      subscriber(event);
    }
    return { accepted: true };
  }
}
