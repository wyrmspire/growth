import type { EntityId, IdPrefix } from './types';

let counter = 0;

export function newEntityId(prefix: IdPrefix): EntityId {
    counter++;
    const hex = counter.toString(16).padStart(6, '0');
    return `${prefix}_${hex}` as EntityId;
}

export function resetIdCounter(): void {
    counter = 0;
}

const VALID_PREFIXES: Set<string> = new Set<string>([
    'camp', 'offer', 'brief', 'copy', 'var', 'batch', 'item',
    'job', 'reply', 'comment', 'plan', 'hyp', 'sig', 'prof', 'int',
]);

export function isValidPrefix(prefix: string): prefix is IdPrefix {
    return VALID_PREFIXES.has(prefix);
}
