/**
 * FUN-A2 — CTA Map Tests
 */

import { describe, test, expect } from 'vitest';
import { CTA_MAP, getCtasForStageChannel, getCtasForStage } from '../cta-map';
import type { FunnelStageName, ChannelName } from '../../../core/src/types';

const STAGES: FunnelStageName[] = ['awareness', 'consideration', 'decision'];
const CHANNELS: ChannelName[] = ['meta', 'linkedin', 'x', 'email'];

describe('CTA_MAP', () => {
    test('has entries for all 3 stages', () => {
        for (const stage of STAGES) {
            expect(CTA_MAP[stage]).toBeDefined();
        }
    });

    test('each stage has entries for all 4 channels', () => {
        for (const stage of STAGES) {
            for (const channel of CHANNELS) {
                expect(CTA_MAP[stage][channel]).toBeDefined();
                expect(Array.isArray(CTA_MAP[stage][channel])).toBe(true);
            }
        }
    });

    test('every channel-stage combo has at least one CTA', () => {
        for (const stage of STAGES) {
            for (const channel of CHANNELS) {
                expect(CTA_MAP[stage][channel].length).toBeGreaterThan(0);
            }
        }
    });

    test('no CTA is an empty string', () => {
        for (const stage of STAGES) {
            for (const channel of CHANNELS) {
                for (const cta of CTA_MAP[stage][channel]) {
                    expect(cta.trim().length).toBeGreaterThan(0);
                }
            }
        }
    });
});

describe('getCtasForStageChannel()', () => {
    test('returns non-empty array for valid stage+channel', () => {
        const ctas = getCtasForStageChannel('awareness', 'meta');
        expect(ctas.length).toBeGreaterThan(0);
    });

    test('returns a copy — mutations do not affect CTA_MAP', () => {
        const ctas = getCtasForStageChannel('awareness', 'meta');
        ctas.push('Injected CTA');
        expect(CTA_MAP.awareness.meta).not.toContain('Injected CTA');
    });

    test('decision/email has action-oriented CTAs', () => {
        const ctas = getCtasForStageChannel('decision', 'email');
        expect(ctas.some(c => /start|order|activate|today/i.test(c))).toBe(true);
    });
});

describe('getCtasForStage()', () => {
    test('returns CTAs for all given channels', () => {
        const ctas = getCtasForStage('consideration', ['meta', 'email']);
        expect(ctas.length).toBeGreaterThan(0);
    });

    test('deduplicates across channels', () => {
        const ctas = getCtasForStage('awareness', ['meta', 'email']);
        const unique = new Set(ctas);
        expect(unique.size).toBe(ctas.length);
    });

    test('single channel matches getCtasForStageChannel result', () => {
        const a = getCtasForStage('decision', ['linkedin']);
        const b = getCtasForStageChannel('decision', 'linkedin');
        expect(a.sort()).toEqual(b.sort());
    });

    test('all channels for awareness includes CTAs from all 4 sources', () => {
        const ctas = getCtasForStage('awareness', ['meta', 'linkedin', 'x', 'email']);
        expect(ctas.length).toBeGreaterThan(4); // at least a few unique across all channels
    });
});
