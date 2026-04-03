import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { loadClaudeSettingsSync } from '../utils/claude-settings';
import { getTranscriptThinkingEffort } from '../utils/jsonl';

export type ThinkingEffortLevel = 'low' | 'medium' | 'high' | 'max';

/**
 * Resolve thinking effort from transcript and settings.
 */
function normalizeThinkingEffort(value: string | undefined): ThinkingEffortLevel | undefined {
    if (!value) {
        return undefined;
    }

    const normalized = value.toLowerCase();
    if (normalized === 'low' || normalized === 'medium' || normalized === 'high' || normalized === 'max') {
        return normalized;
    }

    return undefined;
}

function resolveThinkingEffortFromSettings(): ThinkingEffortLevel | undefined {
    try {
        const settings = loadClaudeSettingsSync({ logErrors: false });
        return normalizeThinkingEffort(settings.effortLevel);
    } catch {
        // Settings unavailable, return undefined
    }

    return undefined;
}

function resolveThinkingEffort(context: RenderContext): ThinkingEffortLevel {
    return getTranscriptThinkingEffort(context.data?.transcript_path)
        ?? resolveThinkingEffortFromSettings()
        ?? 'medium';
}

export class ThinkingEffortWidget implements Widget {
    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return '显示当前思考力度级别（low, medium, high, max）。\n多个 Claude Code 会话同时运行时可能不准确。'; }
    getDisplayName(): string { return '思考力度'; }
    getCategory(): string { return '核心'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'high' : '思考: high';
        }

        const effort = resolveThinkingEffort(context);
        return item.rawValue ? effort : `思考: ${effort}`;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}