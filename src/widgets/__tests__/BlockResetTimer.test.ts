import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { RenderContext } from '../../types/RenderContext';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import * as usage from '../../utils/usage';
import type { UsageWindowMetrics } from '../../utils/usage-types';
import { BlockResetTimerWidget } from '../BlockResetTimer';

import { runUsageTimerEditorSuite } from './helpers/usage-widget-suites';

function render(widget: BlockResetTimerWidget, item: WidgetItem, context: RenderContext = {}): string | null {
    return widget.render(item, context, DEFAULT_SETTINGS);
}

describe('BlockResetTimerWidget', () => {
    let mockFormatUsageDuration: { mockReturnValue: (value: string) => void };
    let mockGetUsageErrorMessage: { mockReturnValue: (value: string) => void };
    let mockResolveUsageWindowWithFallback: { mockReturnValue: (value: UsageWindowMetrics | null) => void };

    beforeEach(() => {
        vi.restoreAllMocks();
        mockFormatUsageDuration = vi.spyOn(usage, 'formatUsageDuration');
        mockGetUsageErrorMessage = vi.spyOn(usage, 'getUsageErrorMessage');
        mockResolveUsageWindowWithFallback = vi.spyOn(usage, 'resolveUsageWindowWithFallback');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders preview using block-style reset format', () => {
        const widget = new BlockResetTimerWidget();

        expect(render(widget, { id: 'reset', type: 'reset-timer' }, { isPreview: true })).toBe('重置: 4时 30分');
    });

    it('renders remaining time in time mode', () => {
        const widget = new BlockResetTimerWidget();

        mockResolveUsageWindowWithFallback.mockReturnValue({
            sessionDurationMs: 18000000,
            elapsedMs: 3600000,
            remainingMs: 14400000,
            elapsedPercent: 20,
            remainingPercent: 80
        });
        mockFormatUsageDuration.mockReturnValue('4时');

        expect(render(widget, { id: 'reset', type: 'reset-timer' }, { usageData: {} })).toBe('重置: 4时');
    });

    it('renders short progress bar with inverted fill', () => {
        const widget = new BlockResetTimerWidget();
        const item: WidgetItem = {
            id: 'reset',
            type: 'reset-timer',
            metadata: {
                display: 'progress-short',
                invert: 'true'
            }
        };

        mockResolveUsageWindowWithFallback.mockReturnValue({
            sessionDurationMs: 18000000,
            elapsedMs: 14400000,
            remainingMs: 3600000,
            elapsedPercent: 80,
            remainingPercent: 20
        });

        expect(render(widget, item, { usageData: {} })).toBe('重置 [███░░░░░░░░░░░░░] 20.0%');
    });

    it('returns usage error when no timer data is available', () => {
        const widget = new BlockResetTimerWidget();

        mockResolveUsageWindowWithFallback.mockReturnValue(null);
        mockGetUsageErrorMessage.mockReturnValue('[超时]');

        expect(render(widget, { id: 'reset', type: 'reset-timer' }, { usageData: { error: 'timeout' } })).toBe('[超时]');
    });

    it('returns null when neither timer data nor usage error exists', () => {
        const widget = new BlockResetTimerWidget();

        mockResolveUsageWindowWithFallback.mockReturnValue(null);

        expect(render(widget, { id: 'reset', type: 'reset-timer' }, { usageData: {} })).toBeNull();
    });

    it('shows raw value without label in time mode', () => {
        const widget = new BlockResetTimerWidget();

        mockResolveUsageWindowWithFallback.mockReturnValue({
            sessionDurationMs: 18000000,
            elapsedMs: 4500000,
            remainingMs: 13500000,
            elapsedPercent: 25,
            remainingPercent: 75
        });
        mockFormatUsageDuration.mockReturnValue('3时 45分');

        expect(render(widget, { id: 'reset', type: 'reset-timer', rawValue: true }, { usageData: {} })).toBe('3时 45分');
    });

    runUsageTimerEditorSuite({
        baseItem: { id: 'reset', type: 'reset-timer' },
        createWidget: () => new BlockResetTimerWidget(),
        expectedDisplayName: '时段重置计时',
        expectedModifierText: '(短进度条, 反转)',
        modifierItem: {
            id: 'reset',
            type: 'reset-timer',
            metadata: { display: 'progress-short', invert: 'true' }
        }
    });
});