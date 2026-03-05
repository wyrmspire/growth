import type { DomainEvent, DomainEventName, EntityId } from './types';
import { newEntityId } from './id';

export class EventLog {
    private events: DomainEvent[] = [];

    append(name: DomainEventName, entityId: EntityId, payload: Record<string, unknown> = {}): DomainEvent {
        const event: DomainEvent = {
            id: newEntityId('item'),
            name,
            entityId,
            timestamp: new Date().toISOString(),
            payload,
        };
        this.events.push(event);
        return event;
    }

    all(): readonly DomainEvent[] {
        return [...this.events];
    }

    byName(name: DomainEventName): DomainEvent[] {
        return this.events.filter(e => e.name === name);
    }

    byEntity(entityId: EntityId): DomainEvent[] {
        return this.events.filter(e => e.entityId === entityId);
    }

    count(): number {
        return this.events.length;
    }

    clear(): void {
        this.events = [];
    }
}
