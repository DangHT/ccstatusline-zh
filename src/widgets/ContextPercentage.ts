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

export class ContextPercentageWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return '显示上下文窗口已用或剩余百分比'; }
    getDisplayName(): string { return '上下文 %'; }
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
        const label = isInverse ? '剩余: ' : '已用: ';
        const contextWindowMetrics = getContextWindowMetrics(context.data);

        if (context.isPreview) {
            const previewValue = isInverse ? '90.7%' : '9.3%';
            return formatRawOrLabeledValue(item, label, previewValue);
        }

        if (contextWindowMetrics.usedPercentage !== null) {
            const displayPercentage = isInverse ? (100 - contextWindowMetrics.usedPercentage) : contextWindowMetrics.usedPercentage;
            return formatRawOrLabeledValue(item, label, `${displayPercentage.toFixed(1)}%`);
        }

        if (context.tokenMetrics) {
            const modelIdentifier = getModelContextIdentifier(context.data?.model);
            const contextConfig = getContextConfig(modelIdentifier, contextWindowMetrics.windowSize);
            const usedPercentage = Math.min(100, (context.tokenMetrics.contextLength / contextConfig.maxTokens) * 100);
            const displayPercentage = isInverse ? (100 - usedPercentage) : usedPercentage;
            return formatRawOrLabeledValue(item, label, `${displayPercentage.toFixed(1)}%`);
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