import {
    describe,
    expect,
    it
} from 'vitest';

import type {
    RenderContext,
    SpeedMetrics,
    WidgetItem
} from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import { RequestCountWidget } from '../RequestCount';

function createSpeedMetrics(overrides: Partial<SpeedMetrics> = {}): SpeedMetrics {
    return {
        totalDurationMs: 10000,
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        requestCount: 7,
        ...overrides
    };
}

function createItem(overrides: Partial<WidgetItem> = {}): WidgetItem {
    return {
        id: 'rc',
        type: 'request-count',
        ...overrides
    };
}

describe('RequestCountWidget', () => {
    const widget = new RequestCountWidget();

    it('reports the 会话 category', () => {
        expect(widget.getCategory()).toBe('会话');
    });

    it('exposes a Chinese display name and description', () => {
        expect(widget.getDisplayName()).toBe('请求数');
        expect(widget.getDescription()).toContain('当前会话');
        expect(widget.getDescription()).toContain('assistant');
    });

    it('supports raw value and color customization', () => {
        expect(widget.supportsRawValue()).toBe(true);
        expect(widget.supportsColors(createItem())).toBe(true);
    });

    it('renders a labeled preview value by default', () => {
        const context: RenderContext = { isPreview: true };
        expect(widget.render(createItem(), context, DEFAULT_SETTINGS)).toBe('请求: 42');
    });

    it('renders the raw preview value without label when rawValue is set', () => {
        const context: RenderContext = { isPreview: true };
        expect(widget.render(createItem({ rawValue: true }), context, DEFAULT_SETTINGS)).toBe('42');
    });

    it('renders the requestCount from session speedMetrics', () => {
        const context: RenderContext = { speedMetrics: createSpeedMetrics({ requestCount: 13 }) };
        expect(widget.render(createItem(), context, DEFAULT_SETTINGS)).toBe('请求: 13');
    });

    it('renders the raw requestCount when rawValue is set', () => {
        const context: RenderContext = { speedMetrics: createSpeedMetrics({ requestCount: 13 }) };
        expect(widget.render(createItem({ rawValue: true }), context, DEFAULT_SETTINGS)).toBe('13');
    });

    it('renders zero when the session has no assistant usage yet', () => {
        const context: RenderContext = { speedMetrics: createSpeedMetrics({ requestCount: 0 }) };
        expect(widget.render(createItem(), context, DEFAULT_SETTINGS)).toBe('请求: 0');
    });

    it('returns null when speedMetrics is missing', () => {
        const context: RenderContext = {};
        expect(widget.render(createItem(), context, DEFAULT_SETTINGS)).toBeNull();
    });

    it('returns null when speedMetrics is explicitly null', () => {
        const context: RenderContext = { speedMetrics: null };
        expect(widget.render(createItem(), context, DEFAULT_SETTINGS)).toBeNull();
    });
});
