import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowMetrics } from '../utils/context-window';
import {
    getContextConfig,
    getModelContextIdentifier
} from '../utils/model-context';

import {
    getContextInverseModifierText,
    handleContextInverseAction,
    isContextInverse
} from './shared/context-inverse';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class ContextPercentageUsableWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return '显示可用上下文窗口已用或剩余百分比（自动压缩前最大值的 80%）'; }
    getDisplayName(): string { return '上下文 %（可用）'; }
    getCategory(): string { return '上下文'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return {
            displayText: this.getDisplayName(),
            modifierText: getContextInverseModifierText(item)
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return handleContextInverseAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const isInverse = isContextInverse(item);
        const modelIdentifier = getModelContextIdentifier(context.data?.model);
        const contextWindowMetrics = getContextWindowMetrics(context.data);
        const contextConfig = getContextConfig(modelIdentifier, contextWindowMetrics.windowSize);

        if (context.isPreview) {
            const previewValue = isInverse ? '88.4%' : '11.6%';
            return formatRawOrLabeledValue(item, '可用: ', previewValue);
        }

        if (contextWindowMetrics.contextLengthTokens !== null) {
            const usedPercentage = Math.min(100, (contextWindowMetrics.contextLengthTokens / contextConfig.usableTokens) * 100);
            const displayPercentage = isInverse ? (100 - usedPercentage) : usedPercentage;
            return formatRawOrLabeledValue(item, '可用: ', `${displayPercentage.toFixed(1)}%`);
        }

        if (context.tokenMetrics) {
            const usedPercentage = Math.min(100, (context.tokenMetrics.contextLength / contextConfig.usableTokens) * 100);
            const displayPercentage = isInverse ? (100 - usedPercentage) : usedPercentage;
            return formatRawOrLabeledValue(item, '可用: ', `${displayPercentage.toFixed(1)}%`);
        }
        return null;
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'u', label: '(u)已用/剩余', action: 'toggle-inverse' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}